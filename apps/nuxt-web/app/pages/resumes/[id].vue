<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useRoute } from 'vue-router'
import { ref, watch, onMounted, computed, defineAsyncComponent, onBeforeUnmount } from 'vue'
import { createError } from '#app'
import A4Paper from '~/components/resume/A4Paper.vue'
import { toast } from 'vue-sonner'

const ClassicTemplate = defineAsyncComponent(() => import('~/components/templates/ClassicTemplate.vue'))
const MinimalTemplate = defineAsyncComponent(() => import('~/components/templates/MinimalTemplate.vue'))
const ModernTemplate = defineAsyncComponent(() => import('~/components/templates/ModernTemplate.vue'))

const route = useRoute()
const store = useResumeStore()
const id = route.params.id as string

const resume = ref(store.getResume(id))
const zoom = ref(0.8)
const saveStatus = ref<'saved' | 'saving'>('saved')
const activeTab = ref<'editor' | 'preview'>('editor')

let saveTimeout: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (store.ready) {
    resume.value = store.getResume(id)
  }
})

onBeforeUnmount(() => {
  if (saveTimeout) clearTimeout(saveTimeout)
})

watch(() => store.ready, (ready) => {
  if (ready) {
    resume.value = store.getResume(id)
  }
})

const currentTemplate = computed(() => {
  if (!resume.value?.templateId) return ClassicTemplate
  
  if (resume.value.templateId.includes('minimal')) return MinimalTemplate
  if (resume.value.templateId.includes('modern')) return ModernTemplate
  return ClassicTemplate
})

// Autosave com Debounce
function handleUpdate() {
  saveStatus.value = 'saving'
  if (saveTimeout) clearTimeout(saveTimeout)
  
  saveTimeout = setTimeout(() => {
    if (resume.value) {
      store.updateResume(resume.value)
      saveStatus.value = 'saved'
    }
  }, 1000)
}

// Undo/Redo Handlers
function handleUndo() {
  store.undo(id)
  resume.value = store.getResume(id)
  saveStatus.value = 'saved'
  toast.success('Desfeito', {
    description: 'Alterações revertidas para versão anterior.'
  })
}

function handleRedo() {
  store.redo(id)
  resume.value = store.getResume(id)
  saveStatus.value = 'saved'
  toast.success('Refeito', {
    description: 'Alterações refeitas.'
  })
}

// Not found
if (resume.value && resume.value.deletedAt) {
  throw createError({ statusCode: 404, message: 'Currículo não encontrado' })
}
</script>

<template>
  <div v-if="!store.ready" class="flex items-center justify-center py-20">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>

  <div v-else-if="!resume" class="flex flex-col items-center justify-center py-20 text-center">
    <div class="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
      <Icon name="lucide:alert-triangle" class="w-8 h-8" />
    </div>
    <h2 class="text-xl font-bold text-foreground">Currículo não encontrado</h2>
    <NuxtLink to="/resumes" class="mt-4 text-primary font-semibold hover:underline flex items-center gap-2">
      <Icon name="lucide:arrow-left" class="w-4 h-4" />
      Voltar para Meus Currículos
    </NuxtLink>
  </div>

  <div v-else class="max-w-[1600px] mx-auto">
    <!-- Toolbar Superior -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 toolbar">
      <div>
        <NuxtLink to="/resumes" class="text-xs font-bold text-primary uppercase tracking-widest hover:opacity-80 transition-opacity mb-1 inline-block">
          ← Meus Currículos
        </NuxtLink>
        <div class="flex items-center gap-3">
           <input 
            v-model="resume.title"
            @input="handleUpdate"
            class="text-3xl font-black bg-transparent border-none p-0 focus:ring-0 w-full md:w-auto min-w-[300px] text-foreground"
            placeholder="Nome do Currículo"
          />
          <span v-if="saveStatus === 'saving'" class="text-xs font-bold text-muted animate-pulse uppercase tracking-wider ml-2">
            Salvando...
          </span>
          <span v-else class="text-xs font-bold text-success uppercase tracking-wider ml-2">
            Salvo
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border self-start">
        <!-- Undo/Redo Group -->
        <div class="flex items-center gap-1 border-r border-border pr-2 mr-2">
            <button 
                @click="handleUndo"
                :disabled="!store.canUndo(id)"
                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Desfazer (Undo)"
            >
                <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
            </button>
            <button 
                @click="handleRedo"
                :disabled="!store.canRedo(id)"
                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Refazer (Redo)"
            >
                <Icon name="lucide:rotate-cw" class="w-4 h-4" />
            </button>
        </div>

        <button 
          @click="store.exportPdf(id)"
          class="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Icon name="lucide:download" class="w-4 h-4" />
          Baixar PDF
        </button>
        <button 
          @click="store.exportJson(id)"
          class="h-10 px-4 rounded-lg hover:bg-background text-foreground text-sm font-semibold transition-all"
        >
          JSON
        </button>
        <NuxtLink 
          :to="`/templates?id=${id}`"
          class="h-10 px-4 rounded-lg hover:bg-background text-foreground text-sm font-semibold transition-all flex items-center gap-2"
        >
           Template
        </NuxtLink>
      </div>
    </div>

    <!-- Tabs Mobile -->
    <div class="lg:hidden flex border-b border-border mb-6">
      <button 
        @click="activeTab = 'editor'"
        :class="[
          'flex-1 py-3 text-sm font-bold border-b-2 transition-colors',
          activeTab === 'editor' 
            ? 'border-primary text-primary' 
            : 'border-transparent text-muted hover:text-foreground'
        ]"
      >
        <div class="flex items-center justify-center gap-2">
          <Icon name="lucide:pen-line" class="w-4 h-4" />
          Editar
        </div>
      </button>
      <button 
        @click="activeTab = 'preview'"
        :class="[
          'flex-1 py-3 text-sm font-bold border-b-2 transition-colors',
          activeTab === 'preview' 
            ? 'border-primary text-primary' 
            : 'border-transparent text-muted hover:text-foreground'
        ]"
      >
        <div class="flex items-center justify-center gap-2">
          <Icon name="lucide:eye" class="w-4 h-4" />
          Visualizar
        </div>
      </button>
    </div>

    <div class="grid gap-10 lg:grid-cols-[480px_1fr] items-start">
      <!-- Editor Column -->
      <div 
        :class="[
          'editor-column space-y-8 pb-20',
          activeTab === 'editor' ? 'block' : 'hidden lg:block'
        ]"
      >
        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-sm font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-primary rounded-full"></span>
            Dados Pessoais
          </h2>
          
          <div class="space-y-5">
            <div class="group">
              <label class="block text-xs font-bold text-muted uppercase tracking-tighter mb-1 group-focus-within:text-primary transition-colors">Nome Completo</label>
              <input 
                v-model="resume.data.name"
                @input="handleUpdate"
                placeholder="Seu nome"
                class="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>

            <div class="group">
              <label class="block text-xs font-bold text-muted uppercase tracking-tighter mb-1 group-focus-within:text-primary transition-colors">Título Profissional</label>
              <input 
                v-model="resume.data.headline"
                @input="handleUpdate"
                placeholder="Ex: Desenvolvedor Fullstack"
                class="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>

            <div class="group">
              <label class="block text-xs font-bold text-muted uppercase tracking-tighter mb-1 group-focus-within:text-primary transition-colors">Resumo Profissional</label>
              <textarea 
                v-model="resume.data.summary"
                @input="handleUpdate"
                placeholder="Breve descrição sobre sua carreira..."
                class="w-full min-h-[140px] bg-background border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
              />
            </div>
          </div>
        </section>

        <!-- Placeholder para outras seções -->
        <div class="p-6 border-2 border-dashed border-border rounded-2xl text-center">
          <p class="text-muted text-sm font-medium">Mais seções em breve...</p>
        </div>
      </div>

      <!-- Preview Column -->
      <div 
        :class="[
          'relative min-h-[800px] preview-container',
          activeTab === 'preview' ? 'block' : 'hidden lg:block'
        ]"
      >
         <div class="sticky top-24 space-y-4">
          <div class="flex items-center justify-between px-2">
            <span class="text-xs font-bold text-muted uppercase tracking-widest">Visualização em Tempo Real</span>
            <div class="flex items-center gap-3 bg-surface border border-border rounded-full px-3 py-1.5">
              <Icon name="lucide:search" class="w-3.5 h-3.5 text-muted" />
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.01"
                v-model.number="zoom"
                class="w-24 accent-primary"
              />
              <span class="text-[10px] font-black tabular-nums w-8 text-muted">{{ Math.round(zoom * 100) }}%</span>
            </div>
          </div>

          <div class="bg-surface/30 border border-border rounded-3xl overflow-hidden aspect-[1/1.4] flex items-start justify-center p-12 shadow-inner overflow-y-auto max-h-[80vh] custom-scrollbar a4-preview-wrapper">
            <div 
              :style="{ transform: `scale(${zoom})`, transformOrigin: 'top center' }"
              class="transition-transform duration-300 ease-out scale-zoom"
            >
              <A4Paper>
                <component :is="currentTemplate" :data="resume.data" />
              </A4Paper>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border);
  border-radius: 9999px;
  transition: background-color 0.2s;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: color-mix(in srgb, var(--muted) 30%, transparent);
}
</style>
