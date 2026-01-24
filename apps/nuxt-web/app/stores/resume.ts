/**
 * Pinia Store para gerenciamento de currículos
 * Migrado de ResumeStoreProvider (React Context)
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LS_KEYS } from '~/lib/storage/keys'
import { readJson, writeJson, removeKey } from '~/lib/storage/storage'
import { ensureStorageInitialized } from '~/lib/storage/seed'
import { runMigrations } from '~/lib/storage/migrations'
import {
    ResumeDocSchema,
    ResumeIndexSchema,
    type ResumeDoc,
    type ResumeIndex,
    type ResumeIndexItem,
    type VersionSnapshot,
    VersionSnapshotListSchema,
} from '~/lib/storage/schema'
import { createSnapshot, deleteSnapshots } from '~/lib/versioning/snapshot'
import { exportJson as exportJsonFn } from '~/lib/export/json'
import { exportPdf as exportPdfFn } from '~/lib/export/pdf'

export const useResumeStore = defineStore('resume', () => {
    const ready = ref(false)
    const index = ref<ResumeIndex>([])
    const futureSnapshots = ref<Record<string, ResumeDoc[]>>({}) // Map resumeId -> snapshots

    // Inicializar apenas no client-side
    if (import.meta.client) {
        ensureStorageInitialized()
        runMigrations()

        const raw = readJson<ResumeIndex>(LS_KEYS.resumesIndex)
        const parsed = ResumeIndexSchema.safeParse(raw)
        index.value = parsed.success ? parsed.data : []
        ready.value = true

        console.log('[ResumeStore] Store inicializado')
    }

    /**
     * Buscar currículo por ID
     */
    function getResume(id: string): ResumeDoc | null {
        const raw = readJson(LS_KEYS.resume(id))
        const parsed = ResumeDocSchema.safeParse(raw)

        if (!parsed.success) {
            console.error('[ResumeStore] Erro ao validar currículo:', id, parsed.error)
            return null
        }

        return parsed.data
    }

    /**
     * Criar novo currículo
     */
    function createResume(templateId = 'classic'): ResumeDoc {
        const now = new Date().toISOString()
        const id = crypto.randomUUID()

        const doc: ResumeDoc = {
            id,
            title: 'Novo currículo',
            templateId,
            data: {},
            locale: 'pt-BR',
            version: 1,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }

        // Salvar documento
        writeJson(LS_KEYS.resume(id), doc)

        // Atualizar índice
        const newIndexItem: ResumeIndexItem = {
            id,
            title: doc.title,
            templateId: doc.templateId,
            updatedAt: now,
            deletedAt: null,
        }

        index.value = [newIndexItem, ...index.value]
        writeJson(LS_KEYS.resumesIndex, index.value)

        console.log('[ResumeStore] Currículo criado:', id)
        return doc
    }

    /**
     * Atualizar currículo (com versionamento)
     */
    /**
     * Atualizar currículo (com versionamento)
     */
    function updateResume(doc: ResumeDoc) {
        const now = new Date().toISOString()

        // 1. Ler o estado ATUAL do disco (que será o "passado" após esse update)
        // Isso é crucial porque 'doc' já vem com as alterações do v-model (futuro)
        const currentOnDisk = getResume(doc.id)

        if (currentOnDisk) {
            // Criar snapshot do que estava no disco
            createSnapshot(currentOnDisk)
        } else {
            // Se não existir no disco (primeiro save ou erro), cria snapshot do estado inicial base
            createSnapshot({ ...doc, version: doc.version, data: {} })
        }

        const previousVersion = doc.version

        // Incrementar versão
        const nextVersion = previousVersion + 1
        const updated: ResumeDoc = {
            ...doc,
            version: nextVersion,
            updatedAt: now,
        }

        // Salvar documento novo
        writeJson(LS_KEYS.resume(doc.id), updated)

        // Limpar histórico de "Redo" pois houve uma nova ramificação de mudança
        if (futureSnapshots.value[doc.id]) {
            futureSnapshots.value[doc.id] = []
        }

        // Atualizar índice
        index.value = index.value.map(item =>
            item.id === doc.id
                ? { ...item, title: updated.title, templateId: updated.templateId, updatedAt: now }
                : item
        )
        writeJson(LS_KEYS.resumesIndex, index.value)

        console.log('[ResumeStore] Currículo atualizado:', doc.id, `v${previousVersion} → v${nextVersion}`)
    }

    /**
     * Undo (Desfazer)
     */
    function undo(id: string) {
        // Tenta obter o estado atual, mas não impede o undo se estiver inválido/corrompido
        const currentParams = getResume(id)

        // Pegar snapshots anteriores
        const key = LS_KEYS.resumeVersions(id)
        // Corrigido: Snapshots são salvos como VersionSnapshot[], não ResumeDoc[]
        const rawSnapshots = readJson(key)
        const parsedList = VersionSnapshotListSchema.safeParse(rawSnapshots)
        const snapshots = parsedList.success ? parsedList.data : []

        if (snapshots.length === 0) {
            console.warn('[ResumeStore] Undo falhou: sem snapshots disponíveis')
            return
        }

        // Encontrar o primeiro snapshot VÁLIDO
        let previousState: ResumeDoc | undefined
        let remainingSnapshots: VersionSnapshot[] = []

        // Iterar para achar um snapshot válido
        for (let i = 0; i < snapshots.length; i++) {
            const snap = snapshots[i]
            if (!snap) continue

            // Reconstruir o ResumeDoc a partir do snapshot
            // O snapshot guarda apenas { version, data, createdAt }, precisamos do resto do documento atual (id, title, etc)
            // Se o documento atual estiver nulo (recuperação), usamos valores padrão ou tentamos pegar do snapshot se ele tivesse tudo (mas não tem)
            // Assumimos que o ID e TemplateID não mudam entre versões pelo snapshot atual

            // Se currentParams for nulo, precisamos de alguma fonte de verdade para ID/Titulo/Template. 
            // Como VersionSnapshot não tem Title/TemplateID, isso é um problema de design dos snapshots.
            // POREM, para fins de correção imediata, se tivermos currentParams, usamos ele.
            // Se não tivermos, vamos tentar inferir ou usar defaults, pois melhor recuperar dados parciais do que nada.

            const baseDoc = currentParams || {
                id,
                title: 'Currículo Recuperado',
                templateId: 'classic',
                locale: 'pt-BR',
                createdAt: snap.createdAt,
                updatedAt: snap.createdAt,
                deletedAt: null
            }

            const reconstructed: ResumeDoc = {
                ...baseDoc,
                version: snap.version,
                data: snap.data,
                updatedAt: snap.createdAt
            }

            // Validar o documento reconstruído
            const parsed = ResumeDocSchema.safeParse(reconstructed)

            if (parsed.success) {
                previousState = parsed.data
                remainingSnapshots = snapshots.slice(i + 1)
                break
            } else {
                console.warn('[ResumeStore] Snapshot reconstruído inválido:', parsed.error)
            }
        }

        if (!previousState) {
            console.error('[ResumeStore] Undo falhou: nenhum snapshot válido encontrado')
            return
        }

        // Se o estado atual for válido, salvar no futuro para Redo.
        // Se for inválido (null), não salvamos (pois está quebrado), apenas recuperamos o snapshot.
        if (currentParams) {
            if (!futureSnapshots.value[id]) {
                futureSnapshots.value[id] = []
            }
            futureSnapshots.value[id] = [currentParams, ...futureSnapshots.value[id]]
        }

        // Reverter estado
        writeJson(LS_KEYS.resume(id), previousState)

        // Atualizar lista de snapshots (mantendo apenas os anteriores ao recuperado)
        writeJson(key, remainingSnapshots)

        // Atualizar índice
        index.value = index.value.map(item =>
            item.id === id
                ? { ...item, title: previousState!.title, templateId: previousState!.templateId, updatedAt: previousState!.updatedAt }
                : item
        )

        // Forçar atualização do índice caso o item não existisse (ex: recuperação complexa)
        if (!index.value.find(i => i.id === id)) {
            const newItem: ResumeIndexItem = {
                id: previousState.id,
                title: previousState.title,
                templateId: previousState.templateId,
                updatedAt: previousState.updatedAt,
                deletedAt: previousState.deletedAt
            }
            index.value = [newItem, ...index.value]
            writeJson(LS_KEYS.resumesIndex, index.value)
        }

        console.log('[ResumeStore] Undo aplicado com sucesso:', id, `v${currentParams?.version ?? '?'} → v${previousState.version}`)
    }

    /**
     * Redo (Refazer)
     */
    function redo(id: string) {
        const currentParams = getResume(id)
        if (!currentParams) return

        const futureList = futureSnapshots.value[id] || []
        if (futureList.length === 0) return

        const nextState = futureList[0]
        if (!nextState) return

        const remainingFuture = futureList.slice(1)

        // Salvar estado atual como snapshot (o passado volta a ser passado)
        createSnapshot(currentParams)

        // Avançar estado
        writeJson(LS_KEYS.resume(id), nextState)

        // Atualizar lista de futuros
        futureSnapshots.value[id] = remainingFuture

        // Atualizar índice
        index.value = index.value.map(item =>
            item.id === id
                ? { ...item, title: nextState.title, templateId: nextState.templateId, updatedAt: nextState.updatedAt }
                : item
        )

        console.log('[ResumeStore] Redo aplicado:', id, `v${currentParams.version} → v${nextState.version}`)
    }

    function canUndo(id: string): boolean {
        const key = LS_KEYS.resumeVersions(id)
        const snapshots = readJson<ResumeDoc[]>(key) || []
        return snapshots.length > 0
    }

    function canRedo(id: string): boolean {
        const futureList = futureSnapshots.value[id] || []
        return futureList.length > 0
    }

    /**
     * Soft delete (mover para lixeira)
     */
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

        console.log('[ResumeStore] Currículo movido para lixeira:', id)
    }

    /**
     * Restaurar da lixeira
     */
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

        console.log('[ResumeStore] Currículo restaurado:', id)
    }

    /**
     * Deletar permanentemente
     */
    function hardDelete(id: string) {
        // Remover documento
        removeKey(LS_KEYS.resume(id))

        // Remover snapshots
        deleteSnapshots(id)

        // Remover do índice
        index.value = index.value.filter(item => item.id !== id)
        writeJson(LS_KEYS.resumesIndex, index.value)

        console.log('[ResumeStore] Currículo deletado permanentemente:', id)
    }

    /**
     * Esvaziar lixeira
     */
    function emptyTrash() {
        const deletedItems = index.value.filter(item => item.deletedAt !== null)

        deletedItems.forEach(item => {
            hardDelete(item.id)
        })

        console.log('[ResumeStore] Lixeira esvaziada:', deletedItems.length, 'itens')
    }

    /**
     * Exportar PDF
     */
    function exportPdf(id: string) {
        const doc = getResume(id)
        if (!doc) {
            throw new Error('Currículo não encontrado')
        }
        exportPdfFn(doc)
    }

    /**
     * Exportar JSON
     */
    function exportJson(id: string) {
        const doc = getResume(id)
        if (!doc) {
            throw new Error('Currículo não encontrado')
        }
        exportJsonFn(doc)
    }

    return {
        ready,
        index,
        getResume,
        createResume,
        updateResume,
        softDelete,
        restore,
        hardDelete,
        emptyTrash,
        exportPdf,
        exportJson,
        undo,
        redo,
        canUndo,
        canRedo
    }
})
