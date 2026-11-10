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
import type { ResumeDoc } from '~/lib/storage/schema'

export const useSyncStore = defineStore('sync', () => {
    const account = ref<SyncAccount | null>(getAccount())
    const passphrase = ref('') // apenas em memória, nunca persistida
    const syncing = ref(false)
    const lastSync = ref<string | null>(null)
    const error = ref('')

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
     * Sync completo: push dos docs locais + pull dos remotos + merge LWW.
     * Merge: updatedAt vence (last-write-wins por doc), como na spec.
     */
    async function syncNow(): Promise<boolean> {
        const acc = account.value
        if (!acc || passphrase.value.length < 8 || syncing.value) return false
        syncing.value = true
        error.value = ''
        try {
            const since = getLastSyncSince()
            const localIndex = readJson<{ id: string; updatedAt: string }[]>(LS_KEYS.resumesIndex) ?? []

            // 1. push: cifra cada doc local e envia
            const blobs: { docId: string; encrypted: string; version: number; updatedAt: string }[] = []
            for (const item of localIndex) {
                const doc = readJson<ResumeDoc>(LS_KEYS.resume(item.id))
                if (!doc) continue
                blobs.push({
                    docId: item.id,
                    encrypted: await encryptDoc(acc.accountId, passphrase.value, doc),
                    version: doc.version ?? 1,
                    updatedAt: doc.updatedAt ?? new Date().toISOString(),
                })
            }
            if (blobs.length) await pushBlobs(blobs)

            // 2. pull: decifra remotos e aplica LWW
            const remote = await pullBlobs(since)
            if (remote) {
                for (const blob of remote) {
                    const doc = await decryptDoc(acc.accountId, passphrase.value, blob.encrypted)
                    if (!doc) continue // passphrase errada ou blob de outra sessão
                    const local = readJson<ResumeDoc>(LS_KEYS.resume(blob.docId))
                    const remoteDoc = doc as ResumeDoc
                    if (!local || (remoteDoc.updatedAt ?? '') > (local.updatedAt ?? '')) {
                        writeJson(LS_KEYS.resume(blob.docId), remoteDoc)
                        // atualiza índice se necessário
                        const idx = readJson<{ id: string }[]>(LS_KEYS.resumesIndex) ?? []
                        if (!idx.some((i) => i.id === blob.docId)) {
                            writeJson(LS_KEYS.resumesIndex, [...idx, {
                                id: blob.docId, title: remoteDoc.title, templateId: remoteDoc.templateId,
                                tags: remoteDoc.tags ?? [], pinned: remoteDoc.pinned ?? false,
                                jobTitle: remoteDoc.jobTitle ?? '', updatedAt: remoteDoc.updatedAt, deletedAt: null,
                            }])
                        }
                    }
                }
                const now = new Date().toISOString()
                setLastSyncSince(now)
                lastSync.value = now
            }
            return true
        } catch {
            error.value = 'Falha na sincronização — tente novamente.'
            return false
        } finally {
            syncing.value = false
        }
    }

    return {
        account, passphrase, syncing, lastSync, error,
        hasAccount, unlocked,
        createAccount, unlock, lock, logout, syncNow,
    }
})
