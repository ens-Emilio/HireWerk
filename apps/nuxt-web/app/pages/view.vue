<script setup lang="ts">
import { ref, computed } from 'vue'
import { decodeShareLink, decodeProtectedLink } from '~/lib/export/share'
import A4Paper from '~/components/resume/A4Paper.vue'
import { useI18n } from '~/composables/useI18n'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { ResumeDoc } from '~/lib/storage/schema'

const route = useRoute()
const { t } = useI18n()

/* ============ decode (protegido ou simples) ============ */
const encoded = computed(() => route.query.r as string | null)
const isProtected = computed(() => route.query.p === '1')
const decodedDoc = ref<ResumeDoc | null>(null)
const passwordInput = ref('')
const wrongPassword = ref(false)

// link simples: decodifica já
decodedDoc.value = !isProtected.value && encoded.value ? decodeShareLink(encoded.value) : null

async function tryUnlock() {
  if (!encoded.value || !passwordInput.value) return
  const doc = await decodeProtectedLink(encoded.value, passwordInput.value)
  decodedDoc.value = doc
  wrongPassword.value = doc === null
}

const expired = computed(() => !isProtected.value && encoded.value !== null && decodedDoc.value === null && route.query.r !== undefined)

const resume = computed(() => decodedDoc.value)

/* ============ templates ============ */
const ClassicTemplate = defineAsyncComponent(() => import('~/components/templates/ClassicTemplate.vue'))
const MinimalTemplate = defineAsyncComponent(() => import('~/components/templates/MinimalTemplate.vue'))
const ModernTemplate = defineAsyncComponent(() => import('~/components/templates/ModernTemplate.vue'))
const ExecutiveTemplate = defineAsyncComponent(() => import('~/components/templates/ExecutiveTemplate.vue'))
const CreativeTemplate = defineAsyncComponent(() => import('~/components/templates/CreativeTemplate.vue'))

const currentTemplate = computed(() => {
  if (!resume.value?.templateId) return ClassicTemplate
  const tid = resume.value.templateId
  if (tid.includes('minimal')) return MinimalTemplate
  if (tid.includes('modern')) return ModernTemplate
  if (tid.includes('executive')) return ExecutiveTemplate
  if (tid.includes('creative')) return CreativeTemplate
  return ClassicTemplate
})

/* ============ baixar PDF do visitante (F7 #43) ============ */
function downloadPdf() {
  document.body.classList.add('printing-view')
  window.print()
  setTimeout(() => document.body.classList.remove('printing-view'), 1000)
}

useSeoMeta({
  title: () => resume.value ? `${resume.value.data?.name || resume.value.title} — HireWerk` : 'HireWerk',
})

/* ============ schema.org JobPosting (F8 #89): payload nos links compartilhados ============ */
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => {
        const doc = resume.value
        if (!doc || doc.jobTitle) return '' // só link simples de currículo genérico vira JobPosting; documentos "p/ vaga" já têm contexto
        const name = doc.data?.name?.trim()
        if (!name) return ''
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: doc.data?.headline?.trim() || doc.title,
          name: name,
          description: doc.data?.summary?.trim() || '',
          datePosted: new Date().toISOString().slice(0, 10),
          employmentType: 'FULL_TIME',
          hiringOrganization: { '@type': 'Organization', name: 'HireWerk' },
          applicantLocationRequirements: doc.data?.location?.trim()
            ? { '@type': 'Place', address: doc.data.location }
            : undefined,
        })
      },
    },
  ],
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-6">
    <!-- protegido: pede senha -->
    <div v-if="isProtected && !resume" class="text-center py-20 grid gap-4 justify-items-center max-w-sm">
      <div class="w-16 h-16 bg-surface rounded-2xl grid place-items-center text-foreground mb-1">
        <Icon name="lucide:lock" class="w-7 h-7" />
      </div>
      <h2 class="font-display text-xl font-bold text-foreground">{{ t('view.protected') }}</h2>
      <p class="text-sm text-muted-foreground">Quem compartilhou protegeu este currículo com uma senha.</p>
      <form class="w-full space-y-3" @submit.prevent="tryUnlock">
        <Input
          v-model="passwordInput"
          type="password"
          placeholder="Digite a senha"
          aria-label="Senha do currículo"
        />
        <Button type="submit" class="w-full">Abrir currículo</Button>
      </form>
      <p v-if="wrongPassword" class="text-sm text-destructive">Senha incorreta. Tente novamente.</p>
    </div>

    <template v-else-if="resume">
      <div class="no-print mb-6 text-center">
        <h1 class="text-xl font-bold text-foreground">{{ resume.data?.name || resume.title }}</h1>
        <p class="text-sm text-muted-foreground mt-1">Currículo compartilhado via HireWerk</p>
        <Button variant="outline" size="sm" class="mt-3" @click="downloadPdf">
          <Icon name="lucide:download" class="w-4 h-4 mr-2" />
          Baixar PDF
        </Button>
      </div>
      <div class="w-full max-w-[800px]">
        <A4Paper>
          <component :is="currentTemplate" :data="resume.data" />
        </A4Paper>
      </div>
      <div class="no-print mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="lucide:briefcase-business" class="w-4 h-4" />
        <span>Criado com <NuxtLink to="/" class="text-primary font-semibold hover:underline">HireWerk</NuxtLink> · ao imprimir esta tela, sai apenas a página A4</span>
      </div>
    </template>

    <div v-else class="text-center py-20 grid gap-3 justify-items-center">
      <div class="w-16 h-16 bg-destructive-soft text-destructive rounded-2xl flex items-center justify-center mb-1">
        <Icon name="lucide:link-off" class="w-8 h-8" />
      </div>
      <h2 class="font-display text-xl font-bold text-foreground">Link inválido</h2>
      <p class="text-muted-foreground max-w-sm">
        {{ expired ? 'Este link de compartilhamento expirou.' : 'Este link não contém um currículo válido. Peça um novo link a quem compartilhou.' }}
      </p>
      <Button variant="link" as-child>
        <NuxtLink to="/" class="mt-4 inline-flex items-center gap-2">
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          Voltar para o início
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.a4-page {
  transform-origin: top center;
}

@media print {
  .printing-view main > div > div:has(.no-print) { display: none; }
}
</style>
