<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { computed } from 'vue'
import { toast } from 'vue-sonner'

const store = useResumeStore()

const deletedResumes = computed(() => 
  store.index.filter(r => r.deletedAt !== null)
)

function handleRestore(id: string, title: string) {
  store.restore(id)
  toast.success(`"${title}" restaurado com sucesso!`)
}

function handleEmptyTrash() {
  if (confirm('Tem certeza de que deseja esvaziar a lixeira? Esta ação é permanente e não pode ser desfeita.')) {
    store.emptyTrash()
    toast.success('Lixeira esvaziada!')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="!store.ready" class="text-center py-12 text-foreground/70">
      Carregando...
    </div>

    <template v-else>
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-foreground">Lixeira</h1>
        <div class="flex items-center gap-3">
          <button 
            v-if="deletedResumes.length > 0"
            @click="handleEmptyTrash"
            class="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700"
          >
            Esvaziar lixeira
          </button>
          <NuxtLink to="/resumes" class="text-sm link">
            Voltar para currículos
          </NuxtLink>
        </div>
      </div>

      <ul 
        v-if="deletedResumes.length > 0" 
        class="divide-y divide-border rounded-md border border-border bg-background text-foreground"
      >
        <li 
          v-for="r in deletedResumes" 
          :key="r.id" 
          class="flex items-center justify-between px-4 py-3"
        >
          <div>
            <div class="font-medium">{{ r.title }}</div>
            <div class="text-xs text-foreground/70">
              Removido em {{ new Date(r.deletedAt!).toLocaleString('pt-BR') }}
            </div>
          </div>
          <button 
            @click="handleRestore(r.id, r.title)"
            class="inline-flex h-8 items-center justify-center rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            Restaurar
          </button>
        </li>
      </ul>

      <div 
        v-else 
        class="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
      >
        <div>
          <div class="text-sm font-semibold text-foreground">Lixeira vazia</div>
          <div class="mt-1 text-foreground/80">Nenhum currículo na lixeira.</div>
        </div>
        <NuxtLink to="/resumes" class="text-sm link">
          Voltar para currículos
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
