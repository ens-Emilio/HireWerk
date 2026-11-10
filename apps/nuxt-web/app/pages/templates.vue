<script setup lang="ts">
import { readJson } from '~/lib/storage/storage'
import { LS_KEYS } from '~/lib/storage/keys'
import { TemplateListSchema, type TemplateList } from '~/lib/storage/schema'
import { useResumeStore } from '~/stores/resume'
import { ref, onMounted, computed, defineAsyncComponent, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import A4Paper from '~/components/resume/A4Paper.vue'

const store = useResumeStore()
const router = useRouter()
const route = useRoute()

const templates = ref<TemplateList>([])
const loading = ref(true)
const using = ref<string | null>(null)

// Preview real: amostra fixa com os campos que os templates renderizam
const sample = {
  name: 'Maria Silva',
  headline: 'Desenvolvedora Fullstack',
  summary: 'Experiência em aplicações web e produtos digitais.',
  skills: ['Vue', 'TypeScript', 'Node.js'],
  experiences: [{ role: 'Dev Sênior', company: 'Tech Co', period: '2021 — hoje', description: 'Liderou a migração do legado para Nuxt 4.' }],
  education: [{ course: 'Ciência da Computação', institution: 'UFPE' }],
  languages: ['Português (nativo)', 'Inglês (fluente)'],
}

const ClassicTemplate = defineAsyncComponent(() => import('~/components/templates/ClassicTemplate.vue'))
const MinimalTemplate = defineAsyncComponent(() => import('~/components/templates/MinimalTemplate.vue'))
const ModernTemplate = defineAsyncComponent(() => import('~/components/templates/ModernTemplate.vue'))
const ExecutiveTemplate = defineAsyncComponent(() => import('~/components/templates/ExecutiveTemplate.vue'))
const CreativeTemplate = defineAsyncComponent(() => import('~/components/templates/CreativeTemplate.vue'))

const TEMPLATE_COMPONENTS: Record<string, Component> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  modern: ModernTemplate,
  executive: ExecutiveTemplate,
  creative: CreativeTemplate,
}

const loadedComponents = computed(() =>
  Object.fromEntries(templates.value.map(t => [t.id, TEMPLATE_COMPONENTS[t.id] ?? ClassicTemplate]))
)

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

/* ============ Import de template via JSON (F3 #41) ============ */
const importTplInput = ref<HTMLInputElement | null>(null)

function pickTemplateFile() {
  importTplInput.value?.click()
}

async function handleTemplateFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const json = JSON.parse(text) as { templateId?: string; style?: Record<string, unknown>; _meta?: { name?: string; description?: string } }
    const templateId = json.templateId
    if (!templateId || !TEMPLATE_COMPONENTS[templateId]) {
      throw new Error(`Template desconhecido: "${templateId ?? '?'}". Use um dos: ${Object.keys(TEMPLATE_COMPONENTS).join(', ')}.`)
    }
    const currentResumeId = route.query.id as string
    if (!currentResumeId) {
      toast.error('Sem contexto do currículo. Abra esta página a partir do editor.')
      return
    }
    const resume = store.getResume(currentResumeId)
    if (!resume) {
      toast.error('Currículo não encontrado.')
      return
    }
    // aplica templateId + estilo embutido no arquivo (accent, fonte, densidade, papel, rodapé, ícones)
    const mergedStyle = { ...resume.style, ...(json.style ?? {}) }
    store.updateResume({ ...resume, templateId, style: mergedStyle })
    toast.success(json._meta?.name ? `Template "${json._meta.name}" aplicado` : 'Template importado e aplicado')
    router.push(`/resumes/${currentResumeId}`)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Arquivo de template inválido')
  }
  input.value = ''
}
</script>

<template>
  <div class="grid gap-9">
    <div>
      <h1 class="font-display text-2xl font-bold text-foreground">Modelos</h1>
      <p class="text-muted-foreground text-sm mt-1">Escolher a cara do seu currículo: clássico, minimalista ou moderno.</p>
    </div>

    <div class="flex justify-end -mt-10 mb-4">
      <Button variant="outline" size="sm" @click="pickTemplateFile" title="Aplica um template + estilo salvos em arquivo JSON">
        <Icon name="lucide:file-json" class="w-4 h-4 mr-2" />
        Importar template (.json)
      </Button>
      <input ref="importTplInput" type="file" accept="application/json,.json" class="hidden" @change="handleTemplateFile" />
    </div>

    <div class="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-if="loading" class="p-4">
        <div class="h-[311px] animate-pulse rounded-md border border-border bg-muted" />
        <div class="mt-4 h-4 w-24 animate-pulse rounded bg-muted" />
      </Card>

      <div
        v-else-if="templates.length === 0"
        class="col-span-full border border-border bg-background p-4 rounded-lg text-sm text-muted-foreground"
      >
        Nenhum template disponível.
      </div>

      <Card
        v-for="tpl in templates"
        :key="tpl.id"
        class="p-4"
      >
        <div
          class="h-[311px] w-full rounded-md overflow-hidden border border-border-soft grid place-items-center"
          :class="tpl.id === 'minimal' ? 'bg-success-soft' : tpl.id === 'modern' ? 'bg-muted' : 'bg-surface'"
        >
          <A4Paper class="origin-top scale-[0.62] pointer-events-none">
            <component :is="loadedComponents[tpl.id]" :data="sample" />
          </A4Paper>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div>
            <div class="font-display font-bold text-foreground">{{ tpl.name }}</div>
            <div v-if="tpl.description" class="text-xs text-muted-foreground mt-1">{{ tpl.description }}</div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            @click="applyTemplate(tpl.id)"
            :disabled="using === tpl.id"
          >
            {{ using === tpl.id ? 'Aplicando...' : 'Usar' }}
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
