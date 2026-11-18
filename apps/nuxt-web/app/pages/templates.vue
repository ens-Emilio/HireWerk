<script setup lang="ts">
import { readJson, writeJson } from '~/lib/storage/storage'
import { LS_KEYS } from '~/lib/storage/keys'
import { TemplateListSchema, type TemplateList, type Template } from '~/lib/storage/schema'
import { useResumeStore } from '~/stores/resume'
import { useI18n } from '~/composables/useI18n'
import { ref, onMounted, computed, defineAsyncComponent, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { downloadFile } from '~/lib/export/formats'
import A4Paper from '~/components/resume/A4Paper.vue'

const store = useResumeStore()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const templates = ref<TemplateList>([])
const loading = ref(true)
const using = ref<string | null>(null)

// Preview real: amostra traduzida com os campos que os templates renderizam
const sample = computed(() => ({
  name: t('tplSample.name'),
  headline: t('tplSample.headline'),
  summary: t('tplSample.summary'),
  skills: ['Vue', 'TypeScript', 'Node.js'],
  experiences: [{ role: t('tplSample.role'), company: 'Tech Co', period: t('tplSample.period'), description: t('tplSample.description') }],
  education: [{ course: t('tplSample.course'), institution: 'UFPE' }],
  languages: [t('tplSample.lang1'), t('tplSample.lang2')],
}))

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
    toast.error(t('toast.templateNoContext'))
    return
  }

  using.value = templateId
  const resume = store.getResume(currentResumeId)
  if (!resume) {
    toast.error(t('toast.templateNotFound'))
    using.value = null
    return
  }

  store.updateResume({
    ...resume,
    templateId,
  })

  toast.success(t('toast.templateApplied'))
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
      toast.error(t('toast.templateNoContext'))
      return
    }
    const resume = store.getResume(currentResumeId)
    if (!resume) {
      toast.error(t('toast.templateNotFound'))
      return
    }
    // aplica templateId + estilo embutido no arquivo (accent, fonte, densidade, papel, rodapé, ícones)
    const mergedStyle = { ...resume.style, ...(json.style ?? {}) }
    store.updateResume({ ...resume, templateId, style: mergedStyle })
    toast.success(json._meta?.name ? t('toast.templateAppliedNamed', { name: json._meta.name }) : t('toast.templateImported'))
    router.push(`/resumes/${currentResumeId}`)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('toast.templateInvalid'))
  }
  input.value = ''
}

/* ============ v3: templates da comunidade ============ */

/** Exporta o template + estilo do currículo aberto como arquivo compartilhável */
function exportCurrentTemplate() {
  const currentResumeId = route.query.id as string
  const resume = currentResumeId ? store.getResume(currentResumeId) : null
  if (!resume) {
    toast.error(t('templates.noContext'))
    return
  }
  const payload = {
    templateId: resume.templateId,
    style: resume.style,
    _meta: {
      name: resume.title,
      description: `Template ${resume.templateId} exportado do HireWerk`,
      exportedAt: new Date().toISOString(),
    },
  }
  downloadFile(JSON.stringify(payload, null, 2), `hirewerk-template-${resume.templateId}.json`, 'application/json')
  toast.success(t('toast.templateExported'))
}

/** Adiciona um template importado à lista local (sem aplicar) */
function addToLibrary(tpl: Template) {
  const exists = templates.value.some(x => x.id === tpl.id)
  if (exists) {
    toast.error(t('toast.templateExists'))
    return
  }
  templates.value = [...templates.value, tpl]
  writeJson(LS_KEYS.templates, templates.value)
  toast.success(t('toast.templateAdded'))
}

function removeFromLibrary(id: string) {
  templates.value = templates.value.filter(x => x.id !== id)
  writeJson(LS_KEYS.templates, templates.value)
  toast.success(t('toast.templateRemoved'))
}

/** Importa um template da comunidade para a lista (não aplica) */
const communityInput = ref<HTMLInputElement | null>(null)

async function handleCommunityFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const json = JSON.parse(await file.text()) as {
      templateId?: string
      style?: Record<string, unknown>
      _meta?: { name?: string; description?: string }
    }
    if (!json.templateId || !TEMPLATE_COMPONENTS[json.templateId]) {
      throw new Error(`Template desconhecido: "${json.templateId ?? '?'}"`)
    }
    addToLibrary({
      id: `${json.templateId}-${Date.now().toString(36)}`,
      slug: json.templateId,
      name: json._meta?.name ?? json.templateId,
      description: json._meta?.description,
      isDefault: false,
      importable: true,
    })
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('templates.invalidFile'))
  }
  input.value = ''
}

const communityTemplates = computed(() => templates.value.filter(x => x.importable))
</script>

<template>
  <div class="grid gap-9">
    <div>
      <h1 class="font-display text-2xl font-bold text-foreground">{{ t('templates.title') }}</h1>
      <p class="text-muted-foreground text-sm mt-1">{{ t('templates.subtitleLong') }}</p>
    </div>

    <div class="flex flex-wrap justify-end gap-2 -mt-10 mb-4">
      <Button variant="outline" size="sm" @click="exportCurrentTemplate" :title="t('templates.export')">
        <Icon name="lucide:download" class="w-4 h-4 mr-2" />
        {{ t('templates.export') }}
      </Button>
      <Button variant="outline" size="sm" @click="communityInput?.click()" :title="t('templates.community')">
        <Icon name="lucide:users" class="w-4 h-4 mr-2" />
        {{ t('templates.community') }}
      </Button>
      <Button variant="outline" size="sm" @click="pickTemplateFile" :title="t('finding.bundleHint')">
        <Icon name="lucide:file-json" class="w-4 h-4 mr-2" />
        {{ t('templates.import') }}
      </Button>
      <input ref="importTplInput" type="file" accept="application/json,.json" class="hidden" @change="handleTemplateFile" />
      <input ref="communityInput" type="file" accept="application/json,.json" class="hidden" @change="handleCommunityFile" />
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
        {{ t('templates.none') }}
      </div>

      <Card
        v-for="tpl in templates"
        :key="tpl.id"
        class="p-4"
      >
        <div
          class="h-[311px] w-full rounded-md overflow-hidden border border-border-soft grid place-items-center relative"
          :class="tpl.slug === 'minimal' ? 'bg-success-soft' : tpl.slug === 'modern' ? 'bg-muted' : 'bg-surface'"
        >
          <Badge v-if="tpl.importable" variant="sample" class="absolute top-2 right-2 text-[10px]">
            {{ t('templates.community') }}
          </Badge>
          <A4Paper class="origin-top scale-[0.62] pointer-events-none">
            <component :is="loadedComponents[tpl.id] ?? loadedComponents[tpl.slug] ?? ClassicTemplate" :data="sample" />
          </A4Paper>
        </div>
        <div class="mt-4 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="font-display font-bold text-foreground truncate">{{ tpl.importable ? tpl.name : t(`tpl.${tpl.slug}.name`) }}</div>
            <div v-if="tpl.importable ? tpl.description : true" class="text-xs text-muted-foreground mt-1">{{ tpl.importable ? tpl.description : t(`tpl.${tpl.slug}.desc`) }}</div>
          </div>
          <div class="flex gap-1 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              @click="applyTemplate(tpl.slug)"
              :disabled="using === tpl.slug"
            >
              {{ using === tpl.slug ? t('templates.using') : t('templates.use') }}
            </Button>
            <Button v-if="tpl.importable" variant="ghost" size="icon" class="h-9 w-9 text-destructive" :aria-label="t('templates.remove')" @click="removeFromLibrary(tpl.id)">
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
