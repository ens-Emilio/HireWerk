<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '~/composables/useI18n'
import type { ResumeData } from '~/lib/storage/schema'
import { cn, formatLanguage } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'

const { t } = useI18n()

const props = defineProps<{
  data: ResumeData
}>()

const name = computed(() => props.data.name?.trim() || t('cv.namePlaceholder'))
const headline = computed(() => props.data.headline?.trim() || t('cv.headlinePlaceholder'))
const summary = computed(() => props.data.summary?.trim() || t('cv.summaryPlaceholder'))
const skills = computed(() => (props.data.skills ?? []).filter(Boolean))
const softSkills = computed(() => (props.data.softSkills ?? []).filter(Boolean))
const experiences = computed(() => (props.data.experiences ?? []).filter((e) => e && (e.role || e.company)))
const education = computed(() => (props.data.education ?? []).filter((e) => e && (e.course || e.institution)))
const languages = computed(() => (props.data.languages ?? []).map(formatLanguage).filter(Boolean))
</script>

<template>
  <div class="text-foreground">
    <div class="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">{{ name }}</div>
    <div class="mt-0.5 text-xs sm:text-sm text-muted-foreground">{{ headline }}</div>

    <div class="mt-5 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">{{ summary }}</div>

    <div v-if="skills.length > 0 || softSkills.length > 0" class="mt-6 grid gap-4 md:grid-cols-2">
      <div v-if="skills.length > 0">
        <div class="text-sm font-medium">{{ t('cv.skills') }}</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <Badge
            v-for="(s, i) in skills"
            :key="i"
            variant="secondary"
            class="text-[11px] chip"
          >
            {{ s }}
          </Badge>
        </div>
      </div>
      <div v-if="softSkills.length > 0">
        <div class="text-sm font-medium">{{ t('cv.softSkills') }}</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <Badge
            v-for="(s, i) in softSkills"
            :key="i"
            variant="secondary"
            class="text-[11px] chip"
          >
            {{ s }}
          </Badge>
        </div>
      </div>
    </div>

    <div v-if="experiences.length > 0 || education.length > 0 || languages.length > 0" class="mt-6 grid gap-3 md:grid-cols-2">
      <div v-if="experiences.length > 0" class="md:col-span-2 rounded-md p-3 border border-border">
        <div class="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{{ t('cv.experience') }}</div>
        <div class="mt-1 grid gap-3">
          <div v-for="(exp, i) in experiences" :key="i">
            <div class="font-medium">
              {{ exp.role || "Cargo" }}
              <span v-if="exp.company"> — {{ exp.company }}</span>
            </div>
            <div v-if="exp.period" class="muted text-[11px]">{{ exp.period }}</div>
            <p v-if="exp.description?.trim()" class="mt-1 text-[11px] whitespace-pre-wrap">{{ exp.description }}</p>
            <ul v-else-if="(((exp as Record<string, unknown>).bullets as string[] | undefined) ?? []).length > 0" class="mt-1 list-disc pl-4 text-[11px]">
              <li v-for="(b, j) in (((exp as Record<string, unknown>).bullets as string[] | undefined) ?? [])" :key="j">{{ b }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="education.length > 0" class="rounded-md p-3 border border-border">
        <div class="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{{ t('cv.education') }}</div>
        <div class="mt-1 grid gap-2">
          <div v-for="(ed, i) in education" :key="i">
            <div>{{ ed.course || "Curso" }}</div>
            <div v-if="ed.institution" class="muted text-[11px]">{{ ed.institution }}</div>
          </div>
        </div>
      </div>

      <div v-if="languages.length > 0" class="rounded-md p-3 border border-border">
        <div class="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{{ t('cv.languages') }}</div>
        <div class="mt-1 grid gap-1 text-[12px]">
          <div v-for="(l, i) in languages" :key="i">{{ l }}</div>
        </div>
      </div>
    </div>
  </div>
</template>