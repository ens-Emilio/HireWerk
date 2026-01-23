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
} from '~/lib/storage/schema'
import { createSnapshot, deleteSnapshots } from '~/lib/versioning/snapshot'
import { exportJson as exportJsonFn } from '~/lib/export/json'
import { exportPdf as exportPdfFn } from '~/lib/export/pdf'

export const useResumeStore = defineStore('resume', () => {
    const ready = ref(false)
    const index = ref<ResumeIndex>([])

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
        return parsed.success ? parsed.data : null
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
    function updateResume(doc: ResumeDoc) {
        const now = new Date().toISOString()
        const previousVersion = doc.version

        // Incrementar versão
        const nextVersion = previousVersion + 1
        const updated: ResumeDoc = {
            ...doc,
            version: nextVersion,
            updatedAt: now,
        }

        // Salvar documento
        writeJson(LS_KEYS.resume(doc.id), updated)

        // Criar snapshot da versão anterior
        createSnapshot({ ...doc, version: previousVersion })

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
    }
})
