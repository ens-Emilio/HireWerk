<script setup lang="ts">
import { computed } from 'vue'

interface ResumeData {
  name?: string
  headline?: string
  summary?: string
  skills?: string[]
  softSkills?: string[]
  experiences?: Array<{
    role?: string
    company?: string
    period?: string
    bullets?: string[]
  }>
  education?: Array<{
    course?: string
    institution?: string
  }>
  languages?: string[]
}

const props = defineProps<{
  data: ResumeData
}>()

const name = computed(() => props.data.name?.trim() || "Nome Completo")
const headline = computed(() => props.data.headline?.trim() || "Profissão / Título")
const summary = computed(() => props.data.summary?.trim() || "Resumo profissional aparecerá aqui.")
const skills = computed(() => (props.data.skills ?? []).filter(Boolean))
const softSkills = computed(() => (props.data.softSkills ?? []).filter(Boolean))
const experiences = computed(() => (props.data.experiences ?? []).filter((e) => e && (e.role || e.company)))
const education = computed(() => (props.data.education ?? []).filter((e) => e && (e.course || e.institution)))
const languages = computed(() => (props.data.languages ?? []).filter(Boolean))
</script>

<template>
  <div class="text-foreground">
    <div class="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">{{ name }}</div>
    <div class="mt-0.5 text-xs sm:text-sm text-foreground/70">{{ headline }}</div>

    <div class="mt-5 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">{{ summary }}</div>

    <div v-if="skills.length > 0 || softSkills.length > 0" class="mt-6 grid gap-4 md:grid-cols-2">
      <div v-if="skills.length > 0">
        <div class="text-sm font-medium">Skills</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <span 
            v-for="(s, i) in skills" 
            :key="i" 
            class="chip text-[11px] border border-border bg-foreground/10"
          >
            {{ s }}
          </span>
        </div>
      </div>
      <div v-if="softSkills.length > 0">
        <div class="text-sm font-medium">Soft Skills</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <span 
            v-for="(s, i) in softSkills" 
            :key="i" 
            class="chip text-[11px] border border-border bg-foreground/10"
          >
            {{ s }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="experiences.length > 0 || education.length > 0 || languages.length > 0" class="mt-6 grid gap-3 md:grid-cols-2">
      <!-- Experiência -->
      <div v-if="experiences.length > 0" class="md:col-span-2 rounded-md p-3 border border-border">
        <div class="text-[13px] font-semibold uppercase tracking-wide text-foreground/70">Experiência</div>
        <div class="mt-1 grid gap-3">
          <div v-for="(exp, i) in experiences" :key="i">
            <div class="font-medium">
              {{ exp.role || "Cargo" }}
              <span v-if="exp.company"> — {{ exp.company }}</span>
            </div>
            <div v-if="exp.period" class="muted text-[11px]">{{ exp.period }}</div>
            <ul v-if="(exp.bullets ?? []).length > 0" class="mt-1 list-disc pl-4 text-[11px]">
              <li v-for="(b, j) in exp.bullets" :key="j">{{ b }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Educação -->
      <div v-if="education.length > 0" class="rounded-md p-3 border border-border">
        <div class="text-[13px] font-semibold uppercase tracking-wide text-foreground/70">Educação</div>
        <div class="mt-1 grid gap-2">
          <div v-for="(ed, i) in education" :key="i">
            <div>{{ ed.course || "Curso" }}</div>
            <div v-if="ed.institution" class="muted text-[11px]">{{ ed.institution }}</div>
          </div>
        </div>
      </div>

      <!-- Idiomas -->
      <div v-if="languages.length > 0" class="rounded-md p-3 border border-border">
        <div class="text-[13px] font-semibold uppercase tracking-wide text-foreground/70">Idiomas</div>
        <div class="mt-1 grid gap-1 text-[12px]">
          <div v-for="(l, i) in languages" :key="i">{{ l }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
