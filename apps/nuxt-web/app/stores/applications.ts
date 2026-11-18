/**
 * Store do tracker de candidaturas (v3).
 *
 * O currículo diz "para qual vaga"; o tracker diz "em que pé está". Fica no
 * localStorage como o resto — nada sai do aparelho.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LS_KEYS } from '~/lib/storage/keys'
import { readJson, writeJson } from '~/lib/storage/storage'
import {
    ApplicationListSchema,
    ApplicationSchema,
    type Application,
    type ApplicationList,
} from '~/lib/storage/schema'

export const useApplicationsStore = defineStore('applications', () => {
    const list = ref<ApplicationList>([])

    if (import.meta.client) {
        // Item a item: uma candidatura corrompida não pode zerar o tracker
        // inteiro (o próximo persist() gravaria [] e apagaria tudo).
        const raw = readJson<unknown[]>(LS_KEYS.applications)
        list.value = Array.isArray(raw)
            ? raw.flatMap(item => {
                const parsed = ApplicationSchema.safeParse(item)
                return parsed.success ? [parsed.data] : []
            })
            : []
    }

    function persist() {
        writeJson(LS_KEYS.applications, list.value)
    }

    function create(patch: Partial<Application> = {}): Application {
        const now = new Date().toISOString()
        const app = ApplicationSchema.parse({
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
            ...patch,
        })
        list.value = [app, ...list.value]
        persist()
        return app
    }

    function update(id: string, patch: Partial<Application>): void {
        list.value = list.value.map(a =>
            a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
        )
        persist()
    }

    function remove(id: string): void {
        list.value = list.value.filter(a => a.id !== id)
        persist()
    }

    /** Candidaturas cujo follow-up vence hoje ou já venceu */
    function dueFollowUps(today = new Date().toISOString().slice(0, 10)): Application[] {
        return list.value.filter(a =>
            a.followUpAt && a.followUpAt <= today && a.status !== 'rejected' && a.status !== 'offer'
        )
    }

    return { list, create, update, remove, dueFollowUps }
})
