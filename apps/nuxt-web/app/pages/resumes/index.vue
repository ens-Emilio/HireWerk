<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { toast } from 'vue-sonner'

const store = useResumeStore()
const router = useRouter()

const activeResumes = computed(() => 
  store.index.filter(r => !r.deletedAt)
)

function handleCreate() {
  const newResume = store.createResume()
  toast.success('Currículo criado com sucesso!')
  router.push(`/resumes/${newResume.id}`)
}

function handleDelete(id: string, title: string) {
  store.softDelete(id)
  toast.success(`"${title}" movido para a lixeira`)
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <div v-if="!store.ready" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">Meus Currículos</h1>
          <p class="text-muted mt-1">Gerencie e edite seus currículos salvos localmente.</p>
        </div>
        <button 
          @click="handleCreate"
          class="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Icon name="lucide:plus" class="w-5 h-5 mr-2" />
          Novo Currículo
        </button>
      </div>

      <div 
        v-if="activeResumes.length > 0" 
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div 
          v-for="r in activeResumes" 
          :key="r.id" 
          class="group bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex flex-col"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
              <Icon name="lucide:file-text" class="w-6 h-6" />
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                @click="handleDelete(r.id, r.title)"
                class="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                title="Mover para lixeira"
              >
                <Icon name="lucide:trash-2" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex-1">
            <h3 class="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {{ r.title }}
            </h3>
            <p class="text-xs text-muted mt-1 uppercase tracking-wider font-medium">
              Atualizado em {{ new Date(r.updatedAt).toLocaleDateString('pt-BR') }}
            </p>
          </div>

          <div class="mt-6">
            <NuxtLink 
              :to="`/resumes/${r.id}`" 
              class="inline-flex w-full h-10 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95"
            >
              Editar Currículo
            </NuxtLink>
          </div>
        </div>
      </div>

      <div 
        v-else 
        class="flex flex-col items-center justify-center py-20 px-4 bg-surface/50 border-2 border-dashed border-border rounded-3xl text-center"
      >
        <div class="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center text-muted mb-6">
          <Icon name="lucide:file-plus" class="w-10 h-10" />
        </div>
        <h2 class="text-xl font-bold text-foreground">Nenhum currículo ainda</h2>
        <p class="text-muted mt-2 max-w-xs mx-auto">Comece sua jornada profissional criando seu primeiro currículo agora mesmo.</p>
        <button 
          @click="handleCreate"
          class="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          Criar meu primeiro currículo
        </button>
      </div>
    </template>
  </div>
</template>
