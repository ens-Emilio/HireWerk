<script setup lang="ts">
import { computed } from 'vue'

interface ResumeData {
  name?: string
  headline?: string
  summary?: string
  skills?: string[]
  softSkills?: string[]
}

const props = defineProps<{
  data: ResumeData
}>()

const name = computed(() => props.data.name?.trim() || "Nome Completo")
const headline = computed(() => props.data.headline?.trim() || "Profissão / Título")
const summary = computed(() => props.data.summary?.trim() || "Resumo profissional aparecerá aqui.")
const skills = computed(() => (props.data.skills ?? []).filter(Boolean))
const softSkills = computed(() => (props.data.softSkills ?? []).filter(Boolean))
</script>

<template>
  <div class="text-foreground">
    <header class="border-b border-border pb-3">
      <div class="text-3xl font-bold tracking-tight">{{ name }}</div>
      <div class="mt-0.5 text-sm text-foreground/70">{{ headline }}</div>
    </header>

    <section class="mt-5 grid gap-6 md:grid-cols-[1fr_260px]">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-foreground/70">Resumo</h3>
        <p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{{ summary }}</p>
      </div>
      <aside>
        <div v-if="skills.length > 0">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-foreground/70">Skills</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            <span 
              v-for="(s, i) in skills" 
              :key="i" 
              class="rounded-md border border-border bg-foreground/10 px-2 py-1 text-xs text-foreground"
            >
              {{ s }}
            </span>
          </div>
        </div>
        <div v-if="softSkills.length > 0" class="mt-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-foreground/70">Soft Skills</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            <span 
              v-for="(s, i) in softSkills" 
              :key="i" 
              class="rounded-md border border-border bg-foreground/10 px-2 py-1 text-xs text-foreground"
            >
              {{ s }}
            </span>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>
