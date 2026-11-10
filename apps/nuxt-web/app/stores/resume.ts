import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LS_KEYS, SCHEMA_VERSION } from '~/lib/storage/keys'
import { readJson, writeJson, removeKey } from '~/lib/storage/storage'
import { ensureStorageInitialized, getSettings, saveSettings } from '~/lib/storage/seed'
import { runMigrations } from '~/lib/storage/migrations'
import {
    ResumeDocSchema,
    ResumeIndexSchema,
    type ResumeDoc,
    type ResumeIndex,
    type ResumeIndexItem,
    type VersionSnapshot,
    VersionSnapshotListSchema,
    SettingsSchema,
    type Settings,
} from '~/lib/storage/schema'
import { createSnapshot, deleteSnapshots, getSnapshots, restoreSnapshot, labelSnapshot, ensureDailySnapshot } from '~/lib/versioning/snapshot'
import { exportJson as exportJsonFn } from '~/lib/export/json'
import { exportPdf as exportPdfFn } from '~/lib/export/pdf'

export const useResumeStore = defineStore('resume', () => {
    const ready = ref(false)
    const index = ref<ResumeIndex>([])
    const settings = ref<Settings | null>(null)

    if (import.meta.client) {
        ensureStorageInitialized()
        runMigrations()

        const raw = readJson<ResumeIndex>(LS_KEYS.resumesIndex)
        const parsed = ResumeIndexSchema.safeParse(raw)
        index.value = parsed.success ? parsed.data : []
        settings.value = getSettings()
        ready.value = true
    }

    function updateSettings(patch: Partial<Settings>) {
        if (!settings.value) return
        settings.value = { ...settings.value, ...patch }
        saveSettings(settings.value)
    }

    function getResume(id: string): ResumeDoc | null {
        const raw = readJson(LS_KEYS.resume(id))
        const parsed = ResumeDocSchema.safeParse(raw)

        if (!parsed.success) {
            console.error('[ResumeStore] Erro ao validar currículo:', id, parsed.error)
            return null
        }

        return parsed.data
    }

    function createResume(templateId?: string): ResumeDoc {
        const now = new Date().toISOString()
        const id = crypto.randomUUID()

        const doc: ResumeDoc = ResumeDocSchema.parse({
            id,
            title: 'Novo currículo',
            templateId: templateId ?? settings.value?.defaultTemplateId ?? 'classic',
            data: {},
            locale: 'pt-BR',
            version: 1,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        })

        writeJson(LS_KEYS.resume(id), doc)

        const newIndexItem: ResumeIndexItem = {
            id,
            title: doc.title,
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

        writeJson(LS_KEYS.resume(newId), duplicate)

        const newItem: ResumeIndexItem = {
            id: newId,
            title: duplicate.title,
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

        writeJson(LS_KEYS.resume(doc.id), updated)

        // Limpar histórico de "Redo" (memória + disco)
        if (readJson(LS_KEYS.resumeFuture(doc.id))) {
            removeKey(LS_KEYS.resumeFuture(doc.id))
        }

        index.value = index.value.map(item =>
            item.id === doc.id
                ? {
                    ...item,
                    title: updated.title,
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
        const rawSnapshots = readJson(key)
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
            const future = [currentParams, ...(readJson<ResumeDoc[]>(LS_KEYS.resumeFuture(id)) ?? [])]
            writeJson(LS_KEYS.resumeFuture(id), future)
        }

        writeJson(LS_KEYS.resume(id), previousState)
        writeJson(key, remainingSnapshots)

        index.value = index.value.map(item =>
            item.id === id
                ? { ...item, title: previousState!.title, templateId: previousState!.templateId, updatedAt: previousState!.updatedAt }
                : item
        )

        if (!index.value.find(i => i.id === id)) {
            const newItem: ResumeIndexItem = {
                id: previousState.id,
                title: previousState.title,
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

        const futureList = readJson<ResumeDoc[]>(LS_KEYS.resumeFuture(id)) ?? []
        if (futureList.length === 0) return

        const nextState = futureList[0]
        if (!nextState) return

        const remainingFuture = futureList.slice(1)

        createSnapshot(currentParams)

        writeJson(LS_KEYS.resume(id), nextState)

        futureSnapshotsWrite(id, remainingFuture)

        index.value = index.value.map(item =>
            item.id === id
                ? { ...item, title: nextState.title, templateId: nextState.templateId, updatedAt: nextState.updatedAt }
                : item
        )
    }

    function futureSnapshotsWrite(id: string, list: ResumeDoc[]) {
        writeJson(LS_KEYS.resumeFuture(id), list)
    }

    function canUndo(id: string): boolean {
        const key = LS_KEYS.resumeVersions(id)
        const snapshots = readJson<ResumeDoc[]>(key) || []
        return snapshots.length > 0
    }

    /** Lista snapshots (para a timeline da UI) */
    function getVersions(id: string): VersionSnapshot[] {
        return getSnapshots(id)
    }

    /** Restaura versão específica e re-sincroniza índice */
    function restoreVersion(id: string, version: number): boolean {
        const restored = restoreSnapshot(id, version)
        if (!restored) return false
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
        const futureList = readJson<ResumeDoc[]>(LS_KEYS.resumeFuture(id)) ?? []
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

        writeJson(LS_KEYS.resume(id), updated)

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

        writeJson(LS_KEYS.resume(id), updated)

        index.value = index.value.map(item =>
            item.id === id ? { ...item, deletedAt: null, updatedAt: now } : item
        )
        writeJson(LS_KEYS.resumesIndex, index.value)
    }

    function hardDelete(id: string) {
        removeKey(LS_KEYS.resume(id))
        deleteSnapshots(id)
        removeKey(LS_KEYS.resumeFuture(id))

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
            snapshots: readJson<unknown[]>(LS_KEYS.resumeVersions(item.id)) ?? [],
        }))

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

            writeJson(LS_KEYS.resume(finalDoc.id), finalDoc)
            if (Array.isArray(entry.snapshots) && entry.snapshots.length > 0) {
                writeJson(LS_KEYS.resumeVersions(finalDoc.id), entry.snapshots)
            }

            const indexItem: ResumeIndexItem = {
                id: finalDoc.id,
                title: finalDoc.title,
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
    }
})
