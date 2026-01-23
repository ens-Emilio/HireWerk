<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { computed } from 'vue'

const store = useResumeStore()

const totalResumes = computed(() => 
  store.index.filter(r => !r.deletedAt).length
)

const deletedResumes = computed(() => 
  store.index.filter(r => r.deletedAt).length
)
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-10">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">Meu Dashboard</h1>
      <p class="text-muted text-lg">Acesse rapidamente suas áreas de trabalho e gerencie seus currículos.</p>
    </div>

    <!-- Stats Section -->
    <div v-if="store.ready" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="text-sm font-medium text-muted uppercase tracking-wider">Total de currículos</div>
        <div class="mt-2 text-4xl font-black text-foreground tabular-nums">{{ totalResumes }}</div>
      </div>
      <div class="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="text-sm font-medium text-muted uppercase tracking-wider">Na lixeira</div>
        <div class="mt-2 text-4xl font-black text-foreground tabular-nums">{{ deletedResumes }}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid gap-6 sm:grid-cols-2">
      <NuxtLink 
        to="/resumes" 
        class="group relative bg-surface border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all overflow-hidden"
      >
        <div class="relative z-10">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <Icon name="lucide:file-text" class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-foreground">Meus Currículos</h3>
          <p class="mt-2 text-muted">Gerencie seus currículos existentes ou crie novos do zero com rapidez.</p>
        </div>
        <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="lucide:arrow-right" class="w-6 h-6 text-primary" />
        </div>
      </NuxtLink>

      <NuxtLink 
        to="/templates" 
        class="group relative bg-surface border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all overflow-hidden"
      >
        <div class="relative z-10">
          <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
            <Icon name="lucide:layout-template" class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-foreground">Modelos</h3>
          <p class="mt-2 text-muted">Escolha entre diversos modelos profissionais otimizados para ATS.</p>
        </div>
        <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="lucide:arrow-right" class="w-6 h-6 text-accent" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
