import { defineStore } from 'pinia'
import { z } from 'zod'
import { ref } from 'vue'
import { LS_KEYS, SCHEMA_VERSION, MAX_ATS_HISTORY, MAX_SNAPSHOTS_PER_RESUME } from '~/lib/storage/keys'
import { readJson, writeJson, removeKey } from '~/lib/storage/storage'
import { ensureStorageInitialized, getSettings, saveSettings } from '~/lib/storage/seed'
import { runMigrations } from '~/lib/storage/migrations'
import {
    ResumeDocSchema,
    ResumeIndexItemSchema,
    type ResumeDoc,
    type ResumeIndex,
    type ResumeIndexItem,
    type VersionSnapshot,
    VersionSnapshotListSchema,
    SettingsSchema,
    type Settings,
} from '~/lib/storage/schema'
import { createSnapshot, deleteSnapshots, getSnapshots, restoreSnapshot, labelSnapshot, ensureDailySnapshot } from '~/lib/versioning/snapshot'
import { readSecureJson, writeSecureJson, removeSecureKey, unlockSecureKeys, encryptSecureKeys, decryptSecureKeys, clearSecureMemory } from '~/lib/storage/secure'
import { isEncryptionEnabled, isEncryptedDoc, encryptAtRest, decryptAtRest } from '~/lib/storage/crypto'
import { exportJson as exportJsonFn } from '~/lib/export/json'
import { exportPdf as exportPdfFn } from '~/lib/export/pdf'

export const useResumeStore = defineStore('resume', () => {
    const ready = ref(false)
    const index = ref<ResumeIndex>([])
    const settings = ref<Settings | null>(null)

    /**
     * v3: cache de docs decifrados (só memória). Com criptografia ativa os docs
     * em repouso são envelopes AES-GCM; `getResume` é síncrono, então a versão
     * em claro vive aqui enquanto a sessão estiver destravada.
     */
    const plainCache = new Map<string, ResumeDoc>()

    if (import.meta.client) {
        ensureStorageInitialized()
        runMigrations()

        /**
         * Parse item a item: um registro corrompido no índice não pode apagar a
         * lista inteira da UI. Itens inválidos são descartados (e o doc em si
         * continua no localStorage, recuperável).
         */
        const raw = readJson<unknown[]>(LS_KEYS.resumesIndex)
        index.value = Array.isArray(raw)
            ? raw.flatMap(item => {
                const parsed = ResumeIndexItemSchema.safeParse(item)
                return parsed.success ? [parsed.data] : []
            })
            : []
        settings.value = getSettings()
        ready.value = true
    }

    function updateSettings(patch: Partial<Settings>) {
        if (!settings.value) return
        settings.value = { ...settings.value, ...patch }
        saveSettings(settings.value)
    }

    /**
     * Escritas pendentes por doc (criptografia ativa é assíncrona).
     * Uma cadeia de promessas por id garante ordem: saves consecutivos não se
     * sobrepõem, e remover a chave invalida o que ainda estava em voo — sem
     * isso, `wipeAll`/`hardDelete` podiam ser "ressuscitados" por um save tardio.
     */
    const writeChains = new Map<string, Promise<void>>()
    const deletedIds = new Set<string>()

    /**
     * Grava o doc respeitando a criptografia em repouso.
     *
     * Retorna `false` quando não foi possível gravar (sessão cifrada travada) —
     * o chamador NÃO deve atualizar o índice nesse caso, senão UI e disco
     * divergem em silêncio.
     */
    function persistDoc(doc: ResumeDoc): boolean {
        if (deletedIds.has(doc.id)) return false

        if (!isEncryptionEnabled()) {
            writeJson(LS_KEYS.resume(doc.id), doc)
            return true
        }

        plainCache.set(doc.id, doc)
        let ok = true
        const previous = writeChains.get(doc.id) ?? Promise.resolve()
        const chain = previous
            .then(async () => {
                if (deletedIds.has(doc.id)) return
                const enc = await encryptAtRest(doc)
                if (!enc) {
                    ok = false
                    return
                }
                writeJson(LS_KEYS.resume(doc.id), enc)
            })
            .catch((e) => {
                ok = false
                console.error('[ResumeStore] falha ao gravar doc cifrado:', e)
            })
            .finally(() => {
                if (writeChains.get(doc.id) === chain) writeChains.delete(doc.id)
            })
        writeChains.set(doc.id, chain)
        return ok
    }

    /** Invalida escritas pendentes de um doc (antes de remover a chave). */
    function cancelPendingWrites(id: string): void {
        deletedIds.add(id)
        writeChains.delete(id)
        plainCache.delete(id)
    }

    function getResume(id: string): ResumeDoc | null {
        const raw = readJson<unknown>(LS_KEYS.resume(id))

        if (isEncryptedDoc(raw)) {
            const cached = plainCache.get(id)
            if (cached) return cached
            // Travado: o doc existe mas não é legível — o editor mostra o aviso
            return null
        }

        const parsed = ResumeDocSchema.safeParse(raw)
        if (!parsed.success) {
            console.error('[ResumeStore] Erro ao validar currículo:', id, parsed.error)
            return null
        }
        return parsed.data
    }

    /** Ids de todo doc existente no localStorage (inclui órfãos fora do índice). */
    function allDocIds(): string[] {
        const ids = new Set(index.value.map(i => i.id))
        for (const key of Object.keys(window.localStorage)) {
            // Valida com o próprio schema: UUID em maiúsculas é válido e a
            // regex antiga (só hex minúsculo) deixava esses docs em claro.
            const m = key.match(/^hirewerk:resume:(.+)$/)
            if (m?.[1] && z.string().uuid().safeParse(m[1]).success) ids.add(m[1])
        }
        return [...ids]
    }

    /** Chaves auxiliares de um doc que também guardam conteúdo pessoal. */
    function auxKeys(id: string): string[] {
        return [LS_KEYS.resumeVersions(id), LS_KEYS.resumeFuture(id)]
    }

    function allAuxKeys(): string[] {
        return allDocIds().flatMap(auxKeys)
    }

    /** v3: depois de destravar, decifra todos os docs para o cache. */
    async function unlockDocs(): Promise<number> {
        let n = 0
        for (const id of allDocIds()) {
            const raw = readJson<unknown>(LS_KEYS.resume(id))
            if (!isEncryptedDoc(raw)) continue
            const doc = await decryptAtRest<ResumeDoc>(raw)
            const parsed = doc ? ResumeDocSchema.safeParse(doc) : null
            if (parsed?.success) {
                plainCache.set(id, parsed.data)
                n++
            }
        }
        // Snapshots e pilha de redo guardam ResumeData completo
        await unlockSecureKeys(allAuxKeys())
        return n
    }

    /** v3: cifra todos os docs em repouso (após ativar a criptografia). */
    async function encryptAllDocs(): Promise<number> {
        let n = 0
        for (const id of allDocIds()) {
            const raw = readJson<unknown>(LS_KEYS.resume(id))
            if (!raw || isEncryptedDoc(raw)) continue
            const parsed = ResumeDocSchema.safeParse(raw)
            if (!parsed.success) continue
            plainCache.set(id, parsed.data)
            const enc = await encryptAtRest(parsed.data)
            if (enc) { writeJson(LS_KEYS.resume(id), enc); n++ }
        }
        await encryptSecureKeys(allAuxKeys())
        return n
    }

    /** v3: decifra tudo para claro (antes de desativar a criptografia). */
    /**
     * Decifra todos os docs para o disco em claro. Retorna `{ ok, failed }`:
     * desativar a criptografia com qualquer doc ilegível destruiria a chave e
     * perderia esses currículos para sempre — o chamador precisa abortar.
     */
    async function decryptAllDocs(): Promise<{ ok: number; failed: string[] }> {
        let n = 0
        const failed: string[] = []
        for (const id of allDocIds()) {
            // Cache primeiro; senão decifra do envelope (ex.: outro doc no índice)
            let doc = plainCache.get(id) ?? null
            if (!doc) {
                const raw = readJson<unknown>(LS_KEYS.resume(id))
                if (isEncryptedDoc(raw)) {
                    const plain = await decryptAtRest<ResumeDoc>(raw)
                    doc = plain ? ResumeDocSchema.safeParse(plain).data ?? null : null
                }
            }
            if (!doc) {
                failed.push(id)
                continue
            }
            writeJson(LS_KEYS.resume(id), doc)
            n++
        }
        decryptSecureKeys(allAuxKeys())
        return { ok: n, failed }
    }

    /** v3: descarta o cache em claro (ao travar a sessão). */
    function clearPlainCache(): void {
        plainCache.clear()
        clearSecureMemory()
    }

    function createResume(templateId?: string, kind: 'resume' | 'coverLetter' = 'resume'): ResumeDoc {
        const now = new Date().toISOString()
        const id = crypto.randomUUID()

        const doc: ResumeDoc = ResumeDocSchema.parse({
            id,
            title: kind === 'coverLetter' ? 'Nova carta de apresentação' : 'Novo currículo',
            kind,
            templateId: templateId ?? settings.value?.defaultTemplateId ?? 'classic',
            data: {},
            locale: 'pt-BR',
            version: 1,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        })

        if (!persistDoc(doc)) {
            throw new Error('Não foi possível gravar o currículo (criptografia travada).')
        }

        const newIndexItem: ResumeIndexItem = {
            id,
            title: doc.title,
            kind,
            templateId: doc.templateId,
            tags: [],
            pinned: false,
            jobTitle: '',
            updatedAt: now,
            deletedAt: null,
        }

        index.value = [newIndexItem, ...index.value]
        writeJson(LS_KEYS.resumesIndex, index.value)

        return doc
    }

    /** Cria uma carta de apresentação, opcionalmente herdando os dados de um currículo */
    function createCoverLetter(fromResumeId?: string): ResumeDoc {
        const doc = createResume(undefined, 'coverLetter')
        const source = fromResumeId ? getResume(fromResumeId) : null
        if (!source) return doc

        const merged: ResumeDoc = {
            ...doc,
            title: `Carta — ${source.title}`,
            data: { ...source.data },
            coverLetter: {
                body: '',
                company: '',
                role: source.jobTitle || source.data.headline,
                tone: 'formal',
            },
            jobDescription: source.jobDescription,
        }
        if (!persistDoc(merged)) return doc
        index.value = index.value.map(i => i.id === doc.id ? { ...i, title: merged.title } : i)
        writeJson(LS_KEYS.resumesIndex, index.value)
        return merged
    }

    /** Duplicar "para a vaga X" (F9): título composto + jobTitle preenchido */
    function duplicateResume(id: string, jobTitle?: string): ResumeDoc | null {
        const original = getResume(id)
        if (!original) return null

        const newId = crypto.randomUUID()
        const now = new Date().toISOString()

        const duplicate: ResumeDoc = {
            ...original,
            id: newId,
            title: jobTitle ? `${original.title} — ${jobTitle}` : `${original.title} (cópia)`,
            jobTitle: jobTitle ?? '',
            pinned: false,
            version: 1,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }

        if (!persistDoc(duplicate)) return null

        const newItem: ResumeIndexItem = {
            id: newId,
            title: duplicate.title,
            kind: duplicate.kind,
            templateId: duplicate.templateId,
            tags: [...original.tags],
            pinned: false,
            jobTitle: duplicate.jobTitle,
            updatedAt: now,
            deletedAt: null,
        }

        index.value = [newItem, ...index.value]
        writeJson(LS_KEYS.resumesIndex, index.value)

        return duplicate
    }

    function updateResume(doc: ResumeDoc) {
        const now = new Date().toISOString()

        const currentOnDisk = getResume(doc.id)

        if (currentOnDisk) {
            ensureDailySnapshot(currentOnDisk) // marca o primeiro save do dia (F4 #55)
            createSnapshot(currentOnDisk)
        } else {
            createSnapshot({ ...doc, version: doc.version, data: ResumeDocSchema.shape.data.parse({}) })
        }

        const previousVersion = doc.version

        const updated: ResumeDoc = {
            ...doc,
            version: previousVersion + 1,
            updatedAt: now,
        }

        if (!persistDoc(updated)) {
            throw new Error('Não foi possível salvar (criptografia travada).')
        }

        // Limpar histórico de "Redo" (memória + disco)
        if (readSecureJson(LS_KEYS.resumeFuture(doc.id)) !== null) {
            removeSecureKey(LS_KEYS.resumeFuture(doc.id))
        }

        index.value = index.value.map(item =>
            item.id === doc.id
                ? {
                    ...item,
                    title: updated.title,
                    kind: updated.kind,
                    templateId: updated.templateId,
                    tags: updated.tags,
                    pinned: updated.pinned,
                    jobTitle: updated.jobTitle,
                    updatedAt: now,
                }
                : item
        )
        writeJson(LS_KEYS.resumesIndex, index.value)
    }

    function undo(id: string) {
        const currentParams = getResume(id)

        const key = LS_KEYS.resumeVersions(id)
        const rawSnapshots = readSecureJson<unknown>(key)
        const parsedList = VersionSnapshotListSchema.safeParse(rawSnapshots)
        const snapshots = parsedList.success ? parsedList.data : []

        if (snapshots.length === 0) return

        let previousState: ResumeDoc | undefined
        let remainingSnapshots: VersionSnapshot[] = []

        for (let i = 0; i < snapshots.length; i++) {
            const snap = snapshots[i]
            if (!snap) continue

            const baseDoc: ResumeDoc = currentParams ?? ResumeDocSchema.parse({
                id,
                title: 'Currículo Recuperado',
                templateId: 'classic',
                locale: 'pt-BR',
                createdAt: snap.createdAt,
                updatedAt: snap.createdAt,
                deletedAt: null
            })

            const reconstructed: ResumeDoc = {
                ...baseDoc,
                version: snap.version,
                data: ResumeDocSchema.shape.data.safeParse(snap.data).data ?? baseDoc.data,
                updatedAt: snap.createdAt
            }

            const parsed = ResumeDocSchema.safeParse(reconstructed)

            if (parsed.success) {
                previousState = parsed.data
                remainingSnapshots = snapshots.slice(i + 1)
                break
            }
        }

        if (!previousState) return

        if (currentParams) {
            const future = [currentParams, ...(readSecureJson<ResumeDoc[]>(LS_KEYS.resumeFuture(id)) ?? [])]
            writeSecureJson(LS_KEYS.resumeFuture(id), future)
        }

        persistDoc(previousState)
        writeSecureJson(key, remainingSnapshots)

        index.value = index.value.map(item =>
            item.id === id
                ? { ...item, title: previousState!.title, templateId: previousState!.templateId, updatedAt: previousState!.updatedAt }
                : item
        )

        if (!index.value.find(i => i.id === id)) {
            const newItem: ResumeIndexItem = {
                id: previousState.id,
                title: previousState.title,
                kind: previousState.kind,
                templateId: previousState.templateId,
                tags: previousState.tags,
                pinned: previousState.pinned,
                jobTitle: previousState.jobTitle,
                updatedAt: previousState.updatedAt,
                deletedAt: previousState.deletedAt
            }
            index.value = [newItem, ...index.value]
            writeJson(LS_KEYS.resumesIndex, index.value)
        }
    }

    function redo(id: string) {
        const currentParams = getResume(id)
        if (!currentParams) return

        const futureList = readSecureJson<ResumeDoc[]>(LS_KEYS.resumeFuture(id)) ?? []
        if (futureList.length === 0) return

        const nextState = futureList[0]
        if (!nextState) return

        const remainingFuture = futureList.slice(1)

        createSnapshot(currentParams)

        persistDoc(nextState)

        futureSnapshotsWrite(id, remainingFuture)

        index.value = index.value.map(item =>
            item.id === id
                ? { ...item, title: nextState.title, templateId: nextState.templateId, updatedAt: nextState.updatedAt }
                : item
        )
    }

    function futureSnapshotsWrite(id: string, list: ResumeDoc[]) {
        writeSecureJson(LS_KEYS.resumeFuture(id), list)
    }

    function canUndo(id: string): boolean {
        return getSnapshots(id).length > 0
    }

    /** Lista snapshots (para a timeline da UI) */
    function getVersions(id: string): VersionSnapshot[] {
        return getSnapshots(id)
    }

    /** Restaura versão específica e re-sincroniza índice */
    function restoreVersion(id: string, version: number): boolean {
        const restored = restoreSnapshot(id, version, getResume(id))
        if (!restored) return false
        if (!persistDoc(restored)) return false
        index.value = index.value.map(item =>
            item.id === id ? { ...item, updatedAt: restored.updatedAt } : item
        )
        writeJson(LS_KEYS.resumesIndex, index.value)
        return true
    }

    /** Renomeia snapshot */
    function renameVersion(id: string, version: number, label: string | null): void {
        labelSnapshot(id, version, label)
    }

    function canRedo(id: string): boolean {
        const futureList = readSecureJson<ResumeDoc[]>(LS_KEYS.resumeFuture(id)) ?? []
        return futureList.length > 0
    }
    function softDelete(id: string) {
        const doc = getResume(id)
        if (!doc) return

        const now = new Date().toISOString()
        const updated: ResumeDoc = {
            ...doc,
            deletedAt: now,
            updatedAt: now,
        }

        if (!persistDoc(updated)) return

        index.value = index.value.map(item =>
            item.id === id ? { ...item, deletedAt: now, updatedAt: now } : item
        )
        writeJson(LS_KEYS.resumesIndex, index.value)
    }

    function restore(id: string) {
        const doc = getResume(id)
        if (!doc) return

        const now = new Date().toISOString()
        const updated: ResumeDoc = {
            ...doc,
            deletedAt: null,
            updatedAt: now,
        }

        if (!persistDoc(updated)) return

        index.value = index.value.map(item =>
            item.id === id ? { ...item, deletedAt: null, updatedAt: now } : item
        )
        writeJson(LS_KEYS.resumesIndex, index.value)
    }

    function hardDelete(id: string) {
        cancelPendingWrites(id)
        removeKey(LS_KEYS.resume(id))
        deleteSnapshots(id)
        removeSecureKey(LS_KEYS.resumeFuture(id))

        index.value = index.value.filter(item => item.id !== id)
        writeJson(LS_KEYS.resumesIndex, index.value)
    }

    function emptyTrash() {
        const deletedItems = index.value.filter(item => item.deletedAt !== null)
        deletedItems.forEach(item => hardDelete(item.id))
    }

    /** Exportar TUDO: docs + snapshots + settings (backup completo) */
    function exportAll(): string {
        const docs = index.value.map(item => ({
            ...item,
            doc: getResume(item.id),
            snapshots: readSecureJson<unknown[]>(LS_KEYS.resumeVersions(item.id)) ?? [],
        }))

        // Sessão cifrada travada: getResume devolve null para tudo. Exportar
        // assim geraria um backup de `doc: null` que só falha na restauração.
        const unreadable = docs.filter(d => d.doc === null)
        if (unreadable.length > 0) {
            throw new Error(`Não foi possível ler ${unreadable.length} currículo(s) — destrave a criptografia antes de exportar.`)
        }

        return JSON.stringify({
            app: 'hirewerk',
            schemaVersion: SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            settings: settings.value,
            resumes: docs,
        }, null, 2)
    }

    /** Importar backup completo. Retorna contagem importada. */
    function importAll(json: string): number {
        const parsed = JSON.parse(json)
        if (parsed?.app !== 'hirewerk' || !Array.isArray(parsed.resumes)) {
            throw new Error('Arquivo de backup inválido')
        }

        let imported = 0
        const now = new Date().toISOString()

        for (const entry of parsed.resumes) {
            const doc = ResumeDocSchema.safeParse(entry.doc).data ?? null
            if (!doc) continue

            const exists = index.value.some(i => i.id === doc.id)
            const finalDoc: ResumeDoc = exists
                ? { ...doc, id: doc.id, updatedAt: now }
                : doc

            if (!persistDoc(finalDoc)) continue
            if (Array.isArray(entry.snapshots) && entry.snapshots.length > 0) {
                // Backup não é fonte confiável: valida e limita, senão entradas
                // inválidas ficam no disco e canUndo mente sobre o histórico.
                const snapshots = VersionSnapshotListSchema.safeParse(entry.snapshots)
                if (snapshots.success) {
                    writeSecureJson(LS_KEYS.resumeVersions(finalDoc.id), snapshots.data.slice(0, MAX_SNAPSHOTS_PER_RESUME))
                }
            }

            const indexItem: ResumeIndexItem = {
                id: finalDoc.id,
                title: finalDoc.title,
                kind: finalDoc.kind,
                templateId: finalDoc.templateId,
                tags: finalDoc.tags,
                pinned: finalDoc.pinned,
                jobTitle: finalDoc.jobTitle,
                updatedAt: finalDoc.updatedAt,
                deletedAt: finalDoc.deletedAt,
            }

            index.value = exists
                ? index.value.map(i => (i.id === indexItem.id ? indexItem : i))
                : [indexItem, ...index.value]
            imported++
        }

        if (parsed.settings) {
            const s = SettingsSchema.catch(getSettings()).parse(parsed.settings)
            settings.value = s
            saveSettings(s)
        }

        writeJson(LS_KEYS.resumesIndex, index.value)
        return imported
    }

    /** Apagar TUDO (com confirm externo) */
    function wipeAll(): void {
        // Invalida escritas cifradas em voo antes de remover as chaves — senão
        // uma promessa pendente recria o doc logo após o "apagar tudo".
        for (const item of index.value) cancelPendingWrites(item.id)
        const keys = Object.keys(window.localStorage).filter(k => k.startsWith('hirewerk:'))
        keys.forEach(k => window.localStorage.removeItem(k))
        index.value = []
    }

    /** Estimativa de uso do localStorage em bytes */
    function estimateUsage(): number {
        if (typeof window === 'undefined') return 0
        let total = 0
        for (const k of Object.keys(window.localStorage)) {
            if (k.startsWith('hirewerk:')) {
                total += (k.length + (window.localStorage.getItem(k)?.length ?? 0)) * 2
            }
        }
        return total
    }

    /* ============ v3: busca no conteúdo ============ */

    /** Texto pesquisável de um doc (título, vaga, tags, dados e carta) */
    function searchableText(doc: ResumeDoc): string {
        const d = doc.data
        return [
            doc.title, doc.jobTitle, ...doc.tags,
            d.name, d.headline, d.summary, d.location,
            ...d.skills, ...d.softSkills,
            ...d.experiences.flatMap(e => [e.role, e.company, e.period, e.description]),
            ...d.education.flatMap(e => [e.course, e.institution]),
            ...d.projects.flatMap(p => [p.name, p.stack, p.description]),
            ...d.certifications.flatMap(c => [c.name, c.issuer]),
            ...d.volunteer.flatMap(v => [v.role, v.org, v.description]),
            doc.coverLetter.body, doc.coverLetter.company, doc.coverLetter.role,
        ].filter(Boolean).join(' ').toLowerCase()
    }

    /** Ids de docs cujo conteúdo contém o termo (busca em skills, bullets, carta...) */
    function searchInContent(query: string): Set<string> {
        const q = query.trim().toLowerCase()
        if (!q) return new Set()
        const hits = new Set<string>()
        for (const item of index.value) {
            if (item.deletedAt) continue
            const doc = getResume(item.id)
            if (doc && searchableText(doc).includes(q)) hits.add(item.id)
        }
        return hits
    }

    /* ============ v3: ações em lote ============ */

    function bulkSoftDelete(ids: string[]): number {
        let n = 0
        for (const id of ids) {
            if (getResume(id)) { softDelete(id); n++ }
        }
        return n
    }

    function bulkRestore(ids: string[]): number {
        let n = 0
        for (const id of ids) {
            if (getResume(id)) { restore(id); n++ }
        }
        return n
    }

    function bulkHardDelete(ids: string[]): number {
        let n = 0
        for (const id of ids) {
            if (getResume(id)) { hardDelete(id); n++ }
        }
        return n
    }

    /* ============ v3: histórico ATS ============ */

    function recordAts(id: string, entry: { score: number; jobDescription: string; missing: string[] }): void {
        const doc = getResume(id)
        if (!doc) return
        const history = [{ at: new Date().toISOString(), ...entry }, ...doc.atsHistory].slice(0, MAX_ATS_HISTORY)
        // Passa por updateResume: bumpa version/updatedAt (senão o push do sync
        // é rejeitado e o histórico nunca chega a outro aparelho) e snapshot.
        updateResume({ ...doc, atsHistory: history, jobDescription: entry.jobDescription })
    }

    function exportPdf(id: string) {
        const doc = getResume(id)
        if (!doc) throw new Error('Currículo não encontrado')
        exportPdfFn(doc)
    }

    function exportJson(id: string) {
        const doc = getResume(id)
        if (!doc) throw new Error('Currículo não encontrado')
        exportJsonFn(doc)
    }

    return {
        ready,
        index,
        settings,
        updateSettings,
        getResume,
        createResume,
        createCoverLetter,
        updateResume,
        duplicateResume,
        softDelete,
        restore,
        hardDelete,
        emptyTrash,
        exportPdf,
        exportJson,
        undo,
        redo,
        canUndo,
        canRedo,
        getVersions,
        restoreVersion,
        renameVersion,
        importAll,
        wipeAll,
        estimateUsage,
        exportAll,
        searchInContent,
        bulkSoftDelete,
        bulkRestore,
        bulkHardDelete,
        recordAts,
        unlockDocs,
        encryptAllDocs,
        decryptAllDocs,
        clearPlainCache,
    }
})
