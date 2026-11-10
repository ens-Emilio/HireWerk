<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeData } from '~/lib/storage/schema'
import { cn } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'

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
    <header class="border-b border-border pb-3">
      <div class="text-3xl font-bold tracking-tight">{{ name }}</div>
      <div class="mt-0.5 text-sm text-muted-foreground">{{ headline }}</div>
    </header>

    <section class="mt-5 grid gap-6 md:grid-cols-[1fr_260px]">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
        <p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{{ summary }}</p>

        <div v-if="experiences.length > 0" class="mt-5">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Experiência</h3>
          <div class="mt-2 space-y-3">
            <div v-for="(exp, i) in experiences" :key="i">
              <div class="font-medium">{{ exp.role || "Cargo" }}<span v-if="exp.company"> — {{ exp.company }}</span></div>
              <div v-if="exp.period" class="text-[11px] text-muted-foreground">{{ exp.period }}</div>
              <p v-if="exp.description?.trim()" class="mt-1 text-[11px] whitespace-pre-wrap">{{ exp.description }}</p>
              <ul v-else-if="(((exp as Record<string, unknown>).bullets as string[] | undefined) ?? []).length > 0" class="mt-1 list-disc pl-4 text-[11px]">
                <li v-for="(b, j) in (((exp as Record<string, unknown>).bullets as string[] | undefined) ?? [])" :key="j">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="education.length > 0" class="mt-5">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Educação</h3>
          <div class="mt-2 space-y-1">
            <div v-for="(ed, i) in education" :key="i">
              {{ ed.course || "Curso" }}<span v-if="ed.institution"> — {{ ed.institution }}</span>
            </div>
          </div>
        </div>
      </div>
      <aside>
        <div v-if="skills.length > 0">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Skills</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            <Badge 
              v-for="(s, i) in skills" 
              :key="i"
              variant="secondary"
              class="text-xs"
            >
              {{ s }}
            </Badge>
          </div>
        </div>
        <div v-if="softSkills.length > 0" class="mt-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Soft Skills</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            <Badge 
              v-for="(s, i) in softSkills" 
              :key="i"
              variant="secondary"
              class="text-xs"
            >
              {{ s }}
            </Badge>
          </div>
        </div>
        <div v-if="languages.length > 0" class="mt-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Idiomas</h3>
          <div class="mt-2 text-[12px] space-y-0.5">
            <div v-for="(l, i) in languages" :key="i">{{ l }}</div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>