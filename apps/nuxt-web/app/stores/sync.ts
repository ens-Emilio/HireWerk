/**
 * F10.1 — Store da conta/sync (opt-in). Estado da UI de settings + fluxo push/pull.
 * Offline-first: tudo aqui falha graciosamente e o app nem sabe que a F10 existe
 * quando não há conta.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    setupAccount, getAccount, logoutAccount,
    encryptDoc, decryptDoc, pushBlobs, pullBlobs,
    getLastSyncSince, setLastSyncSince,
    type SyncAccount,
} from '~/lib/sync/e2e'
import { LS_KEYS, API_BASE } from '~/lib/storage/keys'
import { readJson, writeJson } from '~/lib/storage/storage'
import type { ResumeDoc, ResumeIndexItem } from '~/lib/storage/schema'
import { useResumeStore } from '~/stores/resume'
import { decideMerge } from '~/lib/sync/merge'

export const useSyncStore = defineStore('sync', () => {
    const resumeStore = useResumeStore()
    const account = ref<SyncAccount | null>(getAccount())
    const passphrase = ref('') // apenas em memória, nunca persistida
    const syncing = ref(false)
    const lastSync = ref<string | null>(null)
    const error = ref('')
    /** Docs que divergiram nos dois lados desde o último sync */
    const conflicts = ref<{ docId: string; local: ResumeDoc; remote: ResumeDoc }[]>([])

    const hasAccount = computed(() => account.value !== null)
    const unlocked = computed(() => hasAccount.value && passphrase.value.length >= 8)

    /** Cria conta + sincroniza imediatamente */
    async function createAccount(pass: string): Promise<boolean> {
        error.value = ''
        const acc = await setupAccount(pass)
        if (!acc) {
            error.value = 'Não foi possível criar a conta (verifique conexão e use pelo menos 8 caracteres).'
            return false
        }
        account.value = acc
        passphrase.value = pass
        return await syncNow()
    }

    /** Sessão existente: destrava com a passphrase (não valida contra servidor — o decrypt valida) */
    function unlock(pass: string): boolean {
        if (!account.value || pass.length < 8) return false
        passphrase.value = pass
        return true
    }

    function lock() {
        passphrase.value = ''
    }

    function logout() {
        logoutAccount()
        account.value = null
        passphrase.value = ''
        lastSync.value = null
    }

    /**
     * Sync completo: push dos docs locais + pull dos remotos + merge.
     *
     * Merge: se só um lado mudou desde o último sync, ele vence (LWW). Se os
     * DOIS mudaram e divergem, nada é sobrescrito — o conflito vai para
     * `conflicts` e o usuário escolhe qual versão manter.
     */
    async function syncNow(): Promise<boolean> {
        const acc = account.value
        if (!acc || passphrase.value.length < 8 || syncing.value) return false
        // Conflito pendente: um novo push sobrescreveria a versão remota no
        // servidor antes de o usuário escolher — a decisão nunca seria pedida.
        if (conflicts.value.length > 0) {
            error.value = 'Resolva os conflitos pendentes antes de sincronizar de novo.'
            return false
        }
        syncing.value = true
        error.value = ''
        try {
            const since = getLastSyncSince()
            const localIndex = readJson<{ id: string; updatedAt: string }[]>(LS_KEYS.resumesIndex) ?? []

            // 1. push: cifra cada doc local e envia.
            // Com criptografia local ativa o valor em disco é um envelope
            // `{__enc, iv, data}` — enviá-lo cifraria duas vezes e o outro
            // aparelho receberia um envelope em vez do currículo. Lemos pelo
            // store (que resolve o plainCache) e pulamos o que não for legível.
            const blobs: { docId: string; encrypted: string; version: number; updatedAt: string }[] = []
            for (const item of localIndex) {
                const doc = resumeStore.getResume(item.id)
                if (!doc) continue
                blobs.push({
                    docId: item.id,
                    encrypted: await encryptDoc(acc.accountId, passphrase.value, doc),
                    version: doc.version ?? 1,
                    updatedAt: doc.updatedAt ?? item.updatedAt,
                })
            }
            // Push falhou (rede/relógio à frente): não avançar `since`, senão a
            // edição local que nunca chegou ao servidor seria sobrescrita no
            // pull seguinte (localChanged falso → take-remote).
            const pushed = blobs.length ? await pushBlobs(blobs) : true

            // 2. pull: decifra remotos e resolve por doc
            const remote = await pullBlobs(since)
            if (remote) {
                for (const blob of remote) {
                    const doc = await decryptDoc(acc.accountId, passphrase.value, blob.encrypted)
                    if (!doc) continue // passphrase errada ou blob de outra sessão
                    const local = readJson<ResumeDoc>(LS_KEYS.resume(blob.docId))
                    const remoteDoc = doc as ResumeDoc
                    const decision = decideMerge({ local, remote: remoteDoc, since: since ?? null })

                    if (decision === 'conflict') {
                        conflicts.value.push({ docId: blob.docId, local: local!, remote: remoteDoc })
                        continue
                    }

                    if (decision === 'take-remote') {
                        writeJson(LS_KEYS.resume(blob.docId), remoteDoc)
                        const idx = readJson<{ id: string }[]>(LS_KEYS.resumesIndex) ?? []
                        if (!idx.some((i) => i.id === blob.docId)) {
                            writeJson(LS_KEYS.resumesIndex, [...idx, {
                                id: blob.docId, title: remoteDoc.title, kind: remoteDoc.kind ?? 'resume',
                                templateId: remoteDoc.templateId,
                                tags: remoteDoc.tags ?? [], pinned: remoteDoc.pinned ?? false,
                                jobTitle: remoteDoc.jobTitle ?? '', updatedAt: remoteDoc.updatedAt, deletedAt: null,
                            }])
                        }
                    }
                }
                if (pushed) {
                    const now = new Date().toISOString()
                    setLastSyncSince(now)
                    lastSync.value = now
                }
            }
            return true
        } catch {
            error.value = 'Falha na sincronização — tente novamente.'
            return false
        } finally {
            syncing.value = false
        }
    }

    /** Resolve um conflito mantendo a versão escolhida. */
    function resolveConflict(docId: string, keep: 'local' | 'remote'): void {
        const conflict = conflicts.value.find(c => c.docId === docId)
        if (!conflict) return
        const chosen = keep === 'local' ? conflict.local : conflict.remote
        // `updatedAt` novo: sem isso o servidor mantém a versão descartada
        // (upsert só aceita updated_at maior) e ela ressuscita em outro aparelho.
        const resolved: ResumeDoc = { ...chosen, updatedAt: new Date().toISOString() }
        writeJson(LS_KEYS.resume(docId), resolved)
        const idx = readJson<ResumeIndexItem[]>(LS_KEYS.resumesIndex) ?? []
        writeJson(LS_KEYS.resumesIndex, idx.map(i =>
            i.id === docId
                ? {
                    ...i,
                    title: resolved.title,
                    kind: resolved.kind ?? 'resume',
                    templateId: resolved.templateId,
                    tags: resolved.tags ?? [],
                    pinned: resolved.pinned ?? false,
                    jobTitle: resolved.jobTitle ?? '',
                    updatedAt: resolved.updatedAt,
                }
                : i,
        ))
        conflicts.value = conflicts.value.filter(c => c.docId !== docId)
    }

    return {
        account, passphrase, syncing, lastSync, error, conflicts,
        hasAccount, unlocked,
        createAccount, unlock, lock, logout, syncNow, resolveConflict,
    }
})
