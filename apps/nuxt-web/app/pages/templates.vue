<script setup lang="ts">
import { readJson } from '~/lib/storage/storage'
import { LS_KEYS } from '~/lib/storage/keys'
import { TemplateListSchema, type TemplateList } from '~/lib/storage/schema'
import { useResumeStore } from '~/stores/resume'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

const store = useResumeStore()
const router = useRouter()
const route = useRoute()

const templates = ref<TemplateList>([])
const loading = ref(true)
const using = ref<string | null>(null)

onMounted(() => {
  const raw = readJson(LS_KEYS.templates)
  const parsed = TemplateListSchema.safeParse(raw)
  templates.value = parsed.success ? parsed.data : []
  loading.value = false
})

function applyTemplate(templateId: string) {
  const currentResumeId = route.query.id as string
  if (!currentResumeId) {
    toast.error('Sem contexto do currículo. Abra esta página a partir do editor.')
    return
  }

  using.value = templateId
  const resume = store.getResume(currentResumeId)
  if (!resume) {
    toast.error('Currículo não encontrado.')
    using.value = null
    return
  }

  store.updateResume({
    ...resume,
    templateId,
  })

  toast.success('Template atualizado!')
  router.push(`/resumes/${currentResumeId}`)
}
</script>

<template>
  <div class="grid gap-6">
    <div>
      <h1 class="text-2xl font-semibold mb-1 text-foreground">Templates</h1>
      <p class="text-foreground/70 text-sm">Escolha um estilo para seu currículo.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div 
        v-if="loading" 
        class="rounded-lg border border-border bg-background p-3 text-foreground"
      >
        <div class="h-40 animate-pulse rounded-md border border-border bg-foreground/10" />
        <div class="mt-3 h-4 w-24 animate-pulse rounded bg-foreground/20" />
      </div>

      <div 
        v-else-if="templates.length === 0" 
        class="col-span-full rounded-lg border border-border bg-background p-4 text-sm text-foreground/70"
      >
        Nenhum template disponível.
      </div>

      <div 
        v-for="tpl in templates" 
        :key="tpl.id" 
        class="rounded-lg border border-border bg-background p-3 text-foreground"
      >
        <div class="h-40 w-full rounded-md bg-foreground/10 flex items-center justify-center">
          <span class="text-sm text-foreground/50">{{ tpl.name }}</span>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <div>
            <div class="font-medium">{{ tpl.name }}</div>
            <div v-if="tpl.description" class="text-xs text-foreground/70 mt-1">
              {{ tpl.description }}
            </div>
          </div>
          <button
            @click="applyTemplate(tpl.id)"
            :disabled="using === tpl.id"
            class="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {{ using === tpl.id ? 'Aplicando…' : 'Usar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
