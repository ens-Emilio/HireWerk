<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '~/composables/useI18n'
import type { ResumeData } from '~/lib/storage/schema'
import { formatLanguage } from '~/lib/utils'

const { t } = useI18n()

const props = defineProps<{
  data: ResumeData
}>()

const name = computed(() => props.data.name?.trim() || t('cv.namePlaceholder'))
const headline = computed(() => props.data.headline?.trim() || t('cv.headlinePlaceholder'))
const summary = computed(() => props.data.summary?.trim() || t('cv.summaryPlaceholder'))
const skills = computed(() => (props.data.skills ?? []).filter(Boolean))
const experiences = computed(() => (props.data.experiences ?? []).filter((e) => e && (e.role || e.company)))
const education = computed(() => (props.data.education ?? []).filter((e) => e && (e.course || e.institution)))
const languages = computed(() => (props.data.languages ?? []).map(formatLanguage).filter(Boolean))
const certifications = computed(() => (props.data.certifications ?? []).filter(c => c.name))
const contacts = computed(() => [
  ...(props.data.emails ?? []).map(e => e.value),
  ...(props.data.phones ?? []).map(p => p.value),
  props.data.location,
].filter(Boolean))
</script>

<template>
  <div class="text-foreground font-serif">
    <div class="text-center border-b-2 border-foreground pb-3">
      <div class="text-2xl font-bold tracking-wide uppercase">{{ name }}</div>
      <div class="text-xs tracking-widest uppercase mt-1 text-muted-foreground">{{ headline }}</div>
      <div v-if="contacts.length" class="text-[11px] mt-2">{{ contacts.join(" · ") }}</div>
    </div>

    <div class="mt-4 text-[13px] leading-relaxed whitespace-pre-wrap">{{ summary }}</div>

    <div v-if="experiences.length > 0" class="mt-5">
      <div class="text-sm font-bold uppercase tracking-widest border-b border-foreground/30 pb-1">{{ t('cv.experience') }}</div>
      <div class="mt-2 space-y-3">
        <div v-for="(exp, i) in experiences" :key="i">
          <div class="flex justify-between items-baseline">
            <span class="font-bold text-sm">{{ exp.role }}<span v-if="exp.company"> — {{ exp.company }}</span></span>
            <span v-if="exp.period" class="text-[11px] text-muted-foreground">{{ exp.period }}</span>
          </div>
          <p v-if="exp.description" class="text-[12px] mt-0.5 whitespace-pre-wrap">{{ exp.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="education.length > 0" class="mt-5">
      <div class="text-sm font-bold uppercase tracking-widest border-b border-foreground/30 pb-1">{{ t('cv.education') }}</div>
      <div class="mt-2 space-y-1 text-sm">
        <div v-for="(ed, i) in education" :key="i">
          {{ ed.course }}<span v-if="ed.institution"> — {{ ed.institution }}</span>
        </div>
      </div>
    </div>

    <div v-if="skills.length > 0" class="mt-5">
      <div class="text-sm font-bold uppercase tracking-widest border-b border-foreground/30 pb-1">{{ t('cv.skills') }}</div>
      <div class="mt-2 text-sm">{{ skills.join(" · ") }}</div>
    </div>

    <div v-if="languages.length > 0" class="mt-5">
      <div class="text-sm font-bold uppercase tracking-widest border-b border-foreground/30 pb-1">{{ t('cv.languages') }}</div>
      <div class="mt-2 text-sm">{{ languages.join(" · ") }}</div>
    </div>

    <div v-if="certifications.length > 0" class="mt-5">
      <div class="text-sm font-bold uppercase tracking-widest border-b border-foreground/30 pb-1">{{ t('cv.certifications') }}</div>
      <div class="mt-2 space-y-0.5 text-sm">
        <div v-for="(c, i) in certifications" :key="i">
          {{ c.name }}<span v-if="c.issuer"> — {{ c.issuer }}</span><span v-if="c.year"> ({{ c.year }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
