<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { computed } from 'vue'
import { Card } from '~/components/ui/card'

const store = useResumeStore()

const totalResumes = computed(() =>
  store.index.filter(r => !r.deletedAt).length
)

const deletedResumes = computed(() =>
  store.index.filter(r => r.deletedAt).length
)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-12">
    <div class="flex items-baseline gap-4 flex-wrap">
      <h1 class="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">Olá 👋 seu painel</h1>
    </div>

    <div v-if="store.ready" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Card class="p-5 rounded-2xl">
        <div class="font-display text-3xl font-bold text-foreground tabular-nums">{{ totalResumes }}</div>
        <div class="text-sm text-muted-foreground mt-1">currículos prontos</div>
      </Card>
      <Card class="p-5 rounded-2xl">
        <div class="font-display text-3xl font-bold text-foreground tabular-nums">{{ deletedResumes }}</div>
        <div class="text-sm text-muted-foreground mt-1">na lixeira, recuperável</div>
      </Card>
      <Card class="p-5 rounded-2xl">
        <div class="font-display text-3xl font-bold text-foreground">100%</div>
        <div class="text-sm text-muted-foreground mt-1">privado: nada sai do seu aparelho</div>
      </Card>
    </div>

    <div class="grid gap-6 sm:grid-cols-2">
      <NuxtLink
        to="/resumes"
        class="group relative bg-card border border-border-soft rounded-2xl p-8 hover:shadow-raised hover:-translate-y-0.5 hover:-rotate-[0.3deg] transition-all overflow-hidden"
      >
        <div class="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center text-foreground mb-4 group-hover:scale-110 transition-transform">
          <Icon name="lucide:file-text" class="w-6 h-6" />
        </div>
        <h3 class="font-display text-lg font-bold text-foreground">Meus currículos</h3>
        <p class="mt-1.5 text-sm text-muted-foreground">Editar, duplicar ou compartilhar os que já existem.</p>
      </NuxtLink>

      <NuxtLink
        to="/templates"
        class="group relative bg-card border border-border-soft rounded-2xl p-8 hover:shadow-raised hover:-translate-y-0.5 hover:-rotate-[0.3deg] transition-all overflow-hidden"
      >
        <div class="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center text-foreground mb-4 group-hover:scale-110 transition-transform">
          <Icon name="lucide:layout-template" class="w-6 h-6" />
        </div>
        <h3 class="font-display text-lg font-bold text-foreground">Modelos</h3>
        <p class="mt-1.5 text-sm text-muted-foreground">Escolher a cara do próximo currículo: clássico, minimalista ou moderno.</p>
      </NuxtLink>
    </div>
  </div>
</template>
