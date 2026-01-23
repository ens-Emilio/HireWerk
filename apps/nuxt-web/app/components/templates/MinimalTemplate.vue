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
    <div class="text-xl font-medium tracking-wide">{{ name }}</div>
    <div class="text-xs text-foreground/60">{{ headline }}</div>

    <div class="mt-4 text-[13px] leading-relaxed whitespace-pre-wrap">{{ summary }}</div>

    <div v-if="skills.length > 0" class="mt-4">
      <div class="text-xs font-medium uppercase tracking-wider text-foreground/70">Skills</div>
      <ul class="mt-2 grid grid-cols-2 gap-1 text-xs">
        <li v-for="(s, i) in skills" :key="i" class="truncate">• {{ s }}</li>
      </ul>
    </div>

    <div v-if="softSkills.length > 0" class="mt-4">
      <div class="text-xs font-medium uppercase tracking-wider text-foreground/70">Soft Skills</div>
      <ul class="mt-2 grid grid-cols-2 gap-1 text-xs">
        <li v-for="(s, i) in softSkills" :key="i" class="truncate">• {{ s }}</li>
      </ul>
    </div>
  </div>
</template>
