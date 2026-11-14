<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useApplicationsStore } from '~/stores/applications'
import { useI18n } from '~/composables/useI18n'
import { computed } from 'vue'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

const store = useResumeStore()
const apps = useApplicationsStore()
const { t } = useI18n()

const active = computed(() => store.index.filter(r => !r.deletedAt))
const totalResumes = computed(() => active.value.filter(r => r.kind !== 'coverLetter').length)
const totalLetters = computed(() => active.value.filter(r => r.kind === 'coverLetter').length)
const deletedResumes = computed(() => store.index.filter(r => r.deletedAt).length)
const dueFollowUps = computed(() => apps.dueFollowUps().length)
const openApplications = computed(() =>
  apps.list.filter(a => a.status !== 'rejected' && a.status !== 'offer').length
)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-12">
    <div class="flex items-baseline gap-4 flex-wrap">
      <h1 class="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">{{ t('dash.greeting') }}</h1>
    </div>

    <div v-if="store.ready" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card class="p-5 rounded-2xl">
        <div class="font-display text-3xl font-bold text-foreground tabular-nums">{{ totalResumes }}</div>
        <div class="text-sm text-muted-foreground mt-1">{{ t('dash.total') }}</div>
      </Card>
      <Card class="p-5 rounded-2xl">
        <div class="font-display text-3xl font-bold text-foreground tabular-nums">{{ totalLetters }}</div>
        <div class="text-sm text-muted-foreground mt-1">{{ t('cover.title') }}</div>
      </Card>
      <Card class="p-5 rounded-2xl">
        <div class="font-display text-3xl font-bold text-foreground tabular-nums">{{ openApplications }}</div>
        <div class="text-sm text-muted-foreground mt-1">{{ t('tracker.title') }}</div>
        <Badge v-if="dueFollowUps" variant="destructive" class="mt-2 text-[10px]">
          {{ t('tracker.due', { n: dueFollowUps }) }}
        </Badge>
      </Card>
      <Card class="p-5 rounded-2xl">
        <div class="font-display text-3xl font-bold text-foreground tabular-nums">{{ deletedResumes }}</div>
        <div class="text-sm text-muted-foreground mt-1">{{ t('nav.trash') }}</div>
      </Card>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        to="/resumes"
        class="group relative bg-card border border-border-soft rounded-2xl p-8 hover:shadow-raised hover:-translate-y-0.5 hover:-rotate-[0.3deg] transition-all overflow-hidden"
      >
        <div class="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center text-foreground mb-4 group-hover:scale-110 transition-transform">
          <Icon name="lucide:file-text" class="w-6 h-6" />
        </div>
        <h3 class="font-display text-lg font-bold text-foreground">{{ t('list.title') }}</h3>
        <p class="mt-1.5 text-sm text-muted-foreground">{{ t('list.subtitle') }}</p>
      </NuxtLink>

      <NuxtLink
        to="/applications"
        class="group relative bg-card border border-border-soft rounded-2xl p-8 hover:shadow-raised hover:-translate-y-0.5 hover:-rotate-[0.3deg] transition-all overflow-hidden"
      >
        <div class="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center text-foreground mb-4 group-hover:scale-110 transition-transform">
          <Icon name="lucide:kanban" class="w-6 h-6" />
        </div>
        <h3 class="font-display text-lg font-bold text-foreground">{{ t('tracker.title') }}</h3>
        <p class="mt-1.5 text-sm text-muted-foreground">{{ t('tracker.subtitle') }}</p>
      </NuxtLink>

      <NuxtLink
        to="/templates"
        class="group relative bg-card border border-border-soft rounded-2xl p-8 hover:shadow-raised hover:-translate-y-0.5 hover:-rotate-[0.3deg] transition-all overflow-hidden"
      >
        <div class="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center text-foreground mb-4 group-hover:scale-110 transition-transform">
          <Icon name="lucide:layout-template" class="w-6 h-6" />
        </div>
        <h3 class="font-display text-lg font-bold text-foreground">{{ t('nav.templates') }}</h3>
        <p class="mt-1.5 text-sm text-muted-foreground">{{ t('templates.subtitle') }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
