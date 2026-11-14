<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '~/composables/useI18n'
import type { ResumeData } from '~/lib/storage/schema'
import { cn, formatLanguage } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'

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
    <div class="text-xl font-medium tracking-wide">{{ name }}</div>
    <div class="text-xs text-muted-foreground">{{ headline }}</div>

    <div class="mt-4 text-[13px] leading-relaxed whitespace-pre-wrap">{{ summary }}</div>

    <div v-if="experiences.length > 0" class="mt-4">
      <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ t('cv.experience') }}</div>
      <div class="mt-2 space-y-2">
        <div v-for="(exp, i) in experiences" :key="i">
          <div class="font-medium text-sm">{{ exp.role || "Cargo" }}<span v-if="exp.company"> — {{ exp.company }}</span></div>
          <div v-if="exp.period" class="text-[11px] text-muted-foreground">{{ exp.period }}</div>
          <p v-if="exp.description?.trim()" class="mt-1 text-[11px] whitespace-pre-wrap">{{ exp.description }}</p>
          <ul v-else-if="(((exp as Record<string, unknown>).bullets as string[] | undefined) ?? []).length > 0" class="mt-1 list-disc pl-4 text-[11px]">
            <li v-for="(b, j) in (((exp as Record<string, unknown>).bullets as string[] | undefined) ?? [])" :key="j">{{ b }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="education.length > 0" class="mt-4">
      <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ t('cv.education') }}</div>
      <div class="mt-2 space-y-1 text-sm">
        <div v-for="(ed, i) in education" :key="i">
          {{ ed.course || "Curso" }}<span v-if="ed.institution"> — {{ ed.institution }}</span>
        </div>
      </div>
    </div>

    <div v-if="skills.length > 0" class="mt-4">
      <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ t('cv.skills') }}</div>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <Badge v-for="(s, i) in skills" :key="i" variant="outline" class="text-[11px] font-normal">{{ s }}</Badge>
      </div>
    </div>

    <div v-if="softSkills.length > 0" class="mt-4">
      <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ t('cv.softSkills') }}</div>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <Badge v-for="(s, i) in softSkills" :key="i" variant="outline" class="text-[11px] font-normal">{{ s }}</Badge>
      </div>
    </div>

    <div v-if="languages.length > 0" class="mt-4">
      <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ t('cv.languages') }}</div>
      <div class="mt-2 text-[12px] space-y-0.5">
        <div v-for="(l, i) in languages" :key="i">{{ l }}</div>
      </div>
    </div>
  </div>
</template>