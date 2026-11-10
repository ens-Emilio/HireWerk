<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useI18n } from '~/composables/useI18n'
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { createError } from '#app'
import type { ResumeData, VersionSnapshot } from '~/lib/storage/schema'
import { ResumeDocSchema } from '~/lib/storage/schema'
import A4Paper from '~/components/resume/A4Paper.vue'
import StyledA4 from '~/components/resume/StyledA4.vue'
import { toast } from 'vue-sonner'
import { generateShareLink, generateProtectedLink, decodeShareLink, generateQrSvg, shareMailto, formattedTextForEmail } from '~/lib/export/share'
import { DEFAULT_SECTIONS } from '~/composables/useSectionOrder'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { completeness } from '~/lib/quality'
import { scoreAts } from '~/lib/ats'
import { Separator } from '~/components/ui/separator'
import { Badge } from '~/components/ui/badge'
import { Tooltip } from '~/components/ui/tooltip'

const ClassicTemplate = defineAsyncComponent(() => import('~/components/templates/ClassicTemplate.vue'))
const MinimalTemplate = defineAsyncComponent(() => import('~/components/templates/MinimalTemplate.vue'))
const ModernTemplate = defineAsyncComponent(() => import('~/components/templates/ModernTemplate.vue'))
const ExecutiveTemplate = defineAsyncComponent(() => import('~/components/templates/ExecutiveTemplate.vue'))
const CreativeTemplate = defineAsyncComponent(() => import('~/components/templates/CreativeTemplate.vue'))

const route = useRoute()
const router = useRouter()
const store = useResumeStore()
const { t } = useI18n()
const id = route.params.id as string

const resume = ref(store.getResume(id))
const zoomPercent = ref(100)
const saveStatus = ref<'saved' | 'saving'>('saved')
const activeTab = ref<'editor' | 'preview'>('editor')

const openSections = ref<Record<string, boolean>>({ personal: true })

function isSectionOpen(key: string): boolean {
  return openSections.value[key] !== false
}

function toggleSection(key: string) {
  openSections.value[key] = !isSectionOpen(key)
}

let saveTimeout: ReturnType<typeof setTimeout> | undefined

function cancelPendingSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = undefined
  }
}

onMounted(() => {
  if (store.ready) {
    resume.value = store.getResume(id)
  }
  refreshUndoRedo()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  cancelPendingSave()
  window.removeEventListener('keydown', handleKeydown)
})

const canUndoNow = ref(false)
const canRedoNow = ref(false)

function refreshUndoRedo() {
  canUndoNow.value = store.canUndo(id)
  canRedoNow.value = store.canRedo(id)
}

const currentTemplate = computed(() => {
  if (!resume.value?.templateId) return ClassicTemplate

  const tid = resume.value.templateId
  if (tid.includes('minimal')) return MinimalTemplate
  if (tid.includes('modern')) return ModernTemplate
  if (tid.includes('executive')) return ExecutiveTemplate
  if (tid.includes('creative')) return CreativeTemplate
  return ClassicTemplate
})

function markSaved() {
  saveStatus.value = 'saved'
  isDirty.value = false
  savedAt.value = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  refreshUndoRedo()
}

function handleUpdate() {
  saveStatus.value = 'saving'
  isDirty.value = true
  if (saveTimeout) clearTimeout(saveTimeout)

  saveTimeout = setTimeout(() => {
    if (resume.value) {
      store.updateResume(resume.value)
      markSaved()
    }
  }, 1000)
}

function handleUndo() {
  cancelPendingSave() // evita que o debounce pendente sobrescreva o undo e mate o redo
  store.undo(id)
  resume.value = store.getResume(id)
  markSaved()
  toast.success(t('editor.undoDone'), {
    description: t('editor.undoDoneDesc')
  })
}

function handleRedo() {
  cancelPendingSave()
  store.redo(id)
  resume.value = store.getResume(id)
  markSaved()
  toast.success(t('editor.redoDone'), {
    description: t('editor.redoDoneDesc')
  })
}

/* ============ F5 #68: undo/redo por campo (blur agrupa a digitação) ============ */
interface FieldSnapshot { path: string; before: string; after: string }
const fieldUndoStack = ref<FieldSnapshot[]>([])
const fieldRedoStack = ref<FieldSnapshot[]>([])
const lastFocusPath = ref<string | null>(null)
const lastFocusValue = ref<string>('')

/** Resolve o caminho do campo a partir do elemento focado (data-fpath no wrapper) */
function focusPath(e: FocusEvent): string {
  const el = e.target as HTMLElement
  const holder = el.closest('[data-fpath]')
  return holder?.getAttribute('data-fpath') ?? (el.closest('form,section,div')?.tagName ?? '?')
}

function handleFieldFocus(e: FocusEvent) {
  lastFocusPath.value = focusPath(e)
  lastFocusValue.value = (e.target as HTMLInputElement | HTMLTextAreaElement).value
}

function handleFieldBlur(e: FocusEvent) {
  const path = focusPath(e)
  if (path !== lastFocusPath.value) return
  const after = (e.target as HTMLInputElement | HTMLTextAreaElement).value
  if (after !== lastFocusValue.value) {
    fieldUndoStack.value.push({ path, before: lastFocusValue.value, after })
    if (fieldUndoStack.value.length > 100) fieldUndoStack.value.shift()
    fieldRedoStack.value = []
  }
  lastFocusPath.value = null
}

/** Restaura o valor do campo identificado por path e devolve o valor anterior */
function restoreField(path: string, value: string): string | null {
  const d = resume.value?.data as unknown as Record<string, unknown> | undefined
  if (!d) return null
  const m = path.match(/^(data\.)?([a-zA-Z]+)\[(\d+)\]\.([a-zA-Z]+)$/)
  if (m) {
    const arr = d[m[2]!] as Record<string, unknown>[] | undefined
    const item = arr?.[Number(m[3])]
    if (!item || !(m[4]! in item)) return null
    const old = String(item[m[4]!] ?? '')
    item[m[4]!] = value
    return old
  }
  const m2 = path.match(/^data\.([a-zA-Z]+)$/)
  if (m2 && m2[1]! in d) {
    const old = String(d[m2[1]!] ?? '')
    d[m2[1]!] = value
    return old
  }
  return null
}

function handleFieldUndo() {
  const snap = fieldUndoStack.value.pop()
  if (!snap) return
  const oldValue = restoreField(snap.path, snap.before)
  if (oldValue !== null) {
    fieldRedoStack.value.push(snap)
    handleUpdate()
    toast.success(`Desfeito em ${snap.path}`)
  }
}

function handleFieldRedo() {
  const snap = fieldRedoStack.value.pop()
  if (!snap) return
  const oldValue = restoreField(snap.path, snap.after)
  if (oldValue !== null) {
    fieldUndoStack.value.push(snap)
    handleUpdate()
    toast.success(`Refeito em ${snap.path}`)
  }
}

const canFieldUndo = computed(() => fieldUndoStack.value.length > 0)
const canFieldRedo = computed(() => fieldRedoStack.value.length > 0)

function handleKeydown(e: KeyboardEvent) {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey
  if (isCtrlOrCmd && e.key === 's') {
    e.preventDefault()
    if (resume.value) {
      cancelPendingSave()
      store.updateResume(resume.value)
      markSaved()
      toast.success(t('editor.saved'))
    }
  }
  if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
  }
  if (isCtrlOrCmd && (e.key === 'y' || (e.shiftKey && e.key === 'z') || (e.shiftKey && e.key === 'Z'))) {
    e.preventDefault()
    handleRedo()
  }
}


function handleSaveCopy() {
  if (!resume.value) return
  store.exportJson(id)
  toast.success(t('editor.savedCopy'))
}

const showShareModal = ref(false)

function handleShare() {
  if (!resume.value) return
  showShareModal.value = true
}

// ponytail: campos de array são heterogêneos no schema v2; push tipado por campo custaria
// um map de factories — o `unknown[]` aqui é a fronteira de confiança do editor
function addArrayItem(field: keyof ResumeData & string, template: unknown) {
  if (!resume.value) return
  const arr = resume.value.data[field] as unknown[] | undefined
  const item = typeof template === 'string' ? template : { ...(template as object) }
  if (Array.isArray(arr)) {
    arr.push(item)
  } else {
    (resume.value.data as Record<string, unknown>)[field] = [item]
  }
  handleUpdate()
}

function removeArrayItem(field: keyof ResumeData & string, index: number) {
  const arr = resume.value?.data[field] as unknown[] | undefined
  if (!Array.isArray(arr)) return
  arr.splice(index, 1)
  handleUpdate()
}

/** Mover item de array de campo (↑↓) */
function moveArrayItem(field: keyof ResumeData & string, index: number, delta: -1 | 1) {
  const arr = resume.value?.data[field] as unknown[] | undefined
  if (!Array.isArray(arr)) return
  const target = index + delta
  if (target < 0 || target >= arr.length) return
  ;[arr[index], arr[target]] = [arr[target], arr[index]]
  handleUpdate()
}

/** Duplicar item de array */
function duplicateArrayItem(field: keyof ResumeData & string, index: number) {
  const arr = resume.value?.data[field] as unknown[] | undefined
  if (!Array.isArray(arr)) return
  const original = arr[index]
  const copy = typeof original === 'string' ? original : JSON.parse(JSON.stringify(original))
  arr.splice(index + 1, 0, copy)
  handleUpdate()
}

const summaryWords = computed(() => (resume.value?.data.summary ?? '').trim().split(/\s+/).filter(Boolean).length)

/** Paleta do painel de estilo: '' = accent do design system */
const ACCENT_CHOICES: Record<string, string> = {
  '': '',
  blue: '#2563eb',
  green: '#16a34a',
  violet: '#7c3aed',
  rose: '#e11d48',
  orange: '#ea580c',
  teal: '#0d9488',
  red: '#dc2626',
  ink: '#1e1e24',
}

/* ============ Idiomas (aceita string legado ou objeto) ============ */
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'nativo'] as const

function parseLanguage(raw: string): { name: string; level: (typeof LEVELS)[number] } {
  const match = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  const name = (match?.[1] ?? raw).trim()
  const rawLevel = match?.[2]?.trim().toUpperCase() ?? 'B1'
  const level = (LEVELS as readonly string[]).includes(rawLevel)
    ? rawLevel as (typeof LEVELS)[number]
    : 'B1'
  return { name, level }
}

function addLanguage() {
  if (!resume.value) return
  const current = resume.value.data.languages
  const last = current[current.length - 1]
  current.push(typeof last === 'string' ? '' : { name: '', level: 'B1' as const })
  handleUpdate()
}

function removeLanguage(index: number) {
  resume.value?.data.languages.splice(index, 1)
  handleUpdate()
}

/* ============ Foto (F2 #26): compressão client-side para JPEG <= 400px ============ */
const photoInput = ref<HTMLInputElement | null>(null)

function pickPhoto() {
  photoInput.value?.click()
}

function handlePhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !resume.value) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const max = 400
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resume.value!.data.photo = canvas.toDataURL('image/jpeg', 0.7)
      handleUpdate()
    }
    img.src = reader.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removePhoto() {
  if (!resume.value) return
  resume.value.data.photo = null
  handleUpdate()
}

/* ============ Validação inline (F2 #13): campos vazios em seções com conteúdo ============ */
const hasEmptyRequired = computed(() => {
  const d = resume.value?.data
  if (!d) return false
  return d.experiences.some(e => !e.role.trim()) || d.education.some(e => !e.course.trim())
})

/* ============ F2 #12: contador de palavras por seção ============ */
function sectionWords(texts: (string | undefined | null)[]): number {
  return texts.filter(Boolean).join(' ').trim().split(/\s+/).filter(Boolean).length
}
const sectionWordCounts = computed<Record<string, number>>(() => {
  const d = resume.value?.data
  if (!d) return {} as Record<string, number>
  return {
    personal: sectionWords([d.summary]),
    experience: sectionWords(d.experiences.flatMap(e => [e.role, e.company, e.period, e.description])),
    education: sectionWords(d.education.flatMap(e => [e.course, e.institution])),
    skills: sectionWords(d.skills),
    links: sectionWords(d.links.map(l => l.label ?? l.url ?? '')),
    projects: sectionWords(d.projects.flatMap(p => [p.name, p.stack, p.description])),
    certifications: sectionWords(d.certifications.flatMap(c => [c.name, c.issuer])),
    languages: sectionWords(d.languages.map(l => typeof l === 'string' ? l : `${l.name} ${l.level}`)),
    volunteer: sectionWords(d.volunteer.flatMap(v => [v.role, v.org, v.description])),
  } as Record<string, number>
})

/* ============ F2 #14: placeholders por profissão ============ */
const PROFESSION_PLACEHOLDERS: Record<string, { role: string; summary: string }> = {
  dev: { role: 'Desenvolvedor Full-Stack', summary: 'Desenvolvedor com experiência em Vue, TypeScript e Node, entregando produtos web ponta a ponta.' },
  designer: { role: 'Designer de Produto', summary: 'Designer focado em pesquisa com usuários e interfaces que equilibram negócio e usabilidade.' },
  marketing: { role: 'Analista de Marketing Digital', summary: 'Especialista em performance, SEO e conteúdo com histórico de crescimento de receita.' },
  admin: { role: 'Analista Administrativo', summary: 'Organização de processos, financeiro e atendimento com foco em eficiência operacional.' },
  generic: { role: 'Cargo', summary: 'Duas linhas sobre você...' },
}
const professionKey = ref<keyof typeof PROFESSION_PLACEHOLDERS>('generic')
function guessProfession() {
  const h = (resume.value?.data.headline ?? '').toLowerCase()
  if (/dev|program|engenh|software|front|back|full/.test(h)) return 'dev'
  if (/design|ux|ui|product desig/.test(h)) return 'designer'
  if (/market|growth|seo|comunic/.test(h)) return 'marketing'
  if (/admin|financeir|contab|opera/.test(h)) return 'admin'
  return 'generic'
}
watch(() => resume.value?.data.headline, () => { professionKey.value = guessProfession() }, { immediate: true })
const ph = computed(() => PROFESSION_PLACEHOLDERS[professionKey.value])

/** Aplica placeholders da profissão em campos ainda vazios (F2 #14) */
function applyProfessionPlaceholders() {
  const d = resume.value
  if (!d) return
  if (!d.data.headline.trim()) d.data.headline = ph.value?.role ?? ''
  if (!d.data.summary.trim()) d.data.summary = ph.value?.summary ?? ''
  handleUpdate()
}

/* ============ F2 #19: modo "sem experiência" ============ */
const noExperienceMode = ref(false)
function toggleNoExperience() {
  noExperienceMode.value = !noExperienceMode.value
  if (noExperienceMode.value) applyProfessionPlaceholders()
}

/* ============ Versões (F4): timeline, renomear, restaurar ============ */
const showVersions = ref(false)
const versions = ref<VersionSnapshot[]>([])

watch(showVersions, (show) => {
  if (show) versions.value = store.getVersions(id)
})

function renamePrompt(version: number, current: string | null) {
  const label = window.prompt('Nome da versão (vazio para remover):', current ?? '')
  if (label === null) return
  store.renameVersion(id, version, label.trim() || null)
  versions.value = store.getVersions(id)
}

function restoreThis(version: number) {
  if (!window.confirm(`Restaurar a versão v${version}? A versão atual fica recuperável pelo Refazer.`)) return
  cancelPendingSave()
  if (store.restoreVersion(id, version)) {
    resume.value = store.getResume(id)
    refreshUndoRedo()
    toast.success(`Versão v${version} restaurada`)
  } else {
    toast.error('Não foi possível restaurar esta versão')
  }
}

/* ============ F5: salvo-às + completude + beforeunload ============ */
const savedAt = ref<string>('')

const quality = computed(() => completeness(resume.value?.data ?? ResumeDocSchema.shape.data.parse({})))
const completenessPct = computed(() => quality.value.pct)
const completenessChecks = computed(() => quality.value.checks)
const completenessTitle = computed(() =>
  completenessChecks.value.filter(c => !c.done).map(c => `• ${c.label}`).join('\n') || 'Tudo completo! 🎉'
)

/** Marca mudanças não salvas para o beforeunload (zera ao salvar) */
const isDirty = ref(false)
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value) e.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

/* ============ F9: Score ATS contra descrição de vaga ============ */
const showAts = ref(false)
const jobDescription = ref('')
const atsResult = computed(() =>
  jobDescription.value.trim().length > 50 && resume.value
    ? scoreAts(resume.value.data, jobDescription.value)
    : null
)
const atsScore = computed(() => atsResult.value?.score ?? 0)
const atsMissing = computed(() => atsResult.value?.missing ?? [])
const atsMatched = computed(() => atsResult.value?.matched ?? [])

/** Duplicar este currículo "para a vaga X" (F9 #99) */
function duplicateForJob() {
  if (!resume.value) return
  const jobTitle = window.prompt('Nome da vaga (ex: "Dev Sênior na Magalu"):', resume.value.jobTitle || '')
  if (!jobTitle?.trim()) return
  const dup = store.duplicateResume(id, jobTitle.trim())
  if (dup) {
    toast.success(`Criado "${dup.title}"`)
    router.push(`/resumes/${dup.id}`)
  }
}

/* ============ F9: importar PDF / LinkedIn (parse 100% local) ============ */
const importInput = ref<HTMLInputElement | null>(null)
let importMode: 'pdf' | 'linkedin' = 'pdf'

function pickImport(mode: 'pdf' | 'linkedin') {
  importMode = mode
  importInput.value?.click()
}

async function handleImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !resume.value) return

  try {
    if (importMode === 'pdf') {
      // pdf.js: extrai texto do PDF e tenta preencher nome/headline/resumo
      const { extractTextFromPdf } = await import('~/lib/import/pdf')
      const text = await extractTextFromPdf(file)
      applyExtracted(text)
    } else {
      // LinkedIn: zip com Profile.csv ou CompleteProfileHtml.html
      const { importLinkedInZip } = await import('~/lib/import/linkedin')
      const extracted = await importLinkedInZip(file)
      const d = resume.value.data
      if (extracted.name) d.name = extracted.name
      if (extracted.headline) d.headline = extracted.headline
      if (extracted.summary) d.summary = extracted.summary
      if (extracted.location) d.location = extracted.location
      if (extracted.experiences?.length) d.experiences = extracted.experiences
      if (extracted.education?.length) d.education = extracted.education
      handleUpdate()
    }
    toast.success('Dados importados — revise antes de exportar')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Não foi possível importar este arquivo')
  }
  input.value = ''
}

/** Aplica texto de PDF ao resumo (heurística simples: primeiro bloco relevante) */
function applyExtracted(text: string) {
  if (!resume.value) return
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length > 0 && !resume.value.data.name) resume.value.data.name = lines[0]!
  const summaryCandidate = lines.find(l => l.length > 80)
  if (summaryCandidate && !resume.value.data.summary) resume.value.data.summary = summaryCandidate
  handleUpdate()
}

/* ============ F5 #67: busca e substituição global ============ */
const showFindReplace = ref(false)
const findQuery = ref('')
const replaceQuery = ref('')
const matchCase = ref(false)
const findMatches = ref<{ field: string; count: number }[]>([])

function collectTextFields(): { obj: Record<string, unknown>; key: string; label: string }[] {
  const d = resume.value?.data as unknown as Record<string, unknown> | undefined
  if (!d) return []
  const fields: { obj: Record<string, unknown>; key: string; label: string }[] = [
    { obj: d, key: 'name', label: 'Nome' },
    { obj: d, key: 'headline', label: 'Título' },
    { obj: d, key: 'summary', label: 'Resumo' },
    { obj: d, key: 'location', label: 'Localização' },
  ];
  const exps = d.experiences as unknown as Record<string, unknown>[] | undefined
  exps?.forEach((e: Record<string, unknown>, i: number) => {
    for (const k of ['role', 'company', 'period', 'description']) fields.push({ obj: e, key: k, label: `Experiência ${i + 1} · ${k}` })
  })
  const edus = d.education as unknown as Record<string, unknown>[] | undefined
  edus?.forEach((e: Record<string, unknown>, i: number) => {
    for (const k of ['course', 'institution']) fields.push({ obj: e, key: k, label: `Formação ${i + 1} · ${k}` })
  })
  const projs = d.projects as unknown as Record<string, unknown>[] | undefined
  projs?.forEach((p: Record<string, unknown>, i: number) => {
    for (const k of ['name', 'stack', 'description']) fields.push({ obj: p, key: k, label: `Projeto ${i + 1} · ${k}` })
  })
  return fields
}

function runFind() {
  const q = findQuery.value
  if (!q) { findMatches.value = []; return }
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase.value ? 'g' : 'gi')
  findMatches.value = collectTextFields()
    .map(f => ({ field: f.label, count: String(f.obj[f.key] ?? '').split(re).length - 1 }))
    .filter(m => m.count > 0)
}

function runReplaceAll() {
  const q = findQuery.value
  if (!q || !resume.value) return
  const flags = matchCase.value ? 'g' : 'gi'
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
  let total = 0
  for (const f of collectTextFields()) {
    const val = String(f.obj[f.key] ?? '')
    const next = val.replace(re, replaceQuery.value)
    if (next !== val) { total += val.split(re).length - 1; f.obj[f.key] = next }
  }
  if (total > 0) handleUpdate()
  runFind()
  toast.success(`${total} substituição(ões) aplicada(s)`)
}

watch([findQuery, matchCase], runFind)

/* ============ Share modal (F7): senha, expiração, QR, mailto ============ */
const shareMode = ref<'link' | 'password'>('link')
const sharePassword = ref('')
const shareExpiry = ref<'never' | '7' | '30'>('never')
const shareLink = ref('')
const shareQr = ref<string | null>(null)
const shareError = ref('')

watch(showShareModal, (open) => {
  if (open && resume.value) {
    shareMode.value = 'link'
    sharePassword.value = ''
    shareError.value = ''
    shareLink.value = generateShareLink(resume.value, {
      expiresInDays: shareExpiry.value === 'never' ? undefined : Number(shareExpiry.value),
    })
    shareQr.value = generateQrSvg(shareLink.value, 140)
  }
})

async function buildProtectedLink() {
  if (!resume.value || sharePassword.value.length < 4) {
    shareError.value = 'A senha precisa ter pelo menos 4 caracteres.'
    return
  }
  shareError.value = ''
  shareLink.value = await generateProtectedLink(resume.value, sharePassword.value)
  shareQr.value = null // link cifrado excede QR simplificado
}

async function doShareLink() {
  if (!shareLink.value) return
  if (navigator.share) {
    try {
      await navigator.share({ title: resume.value?.title, url: shareLink.value })
      showShareModal.value = false
      return
    } catch { /* cancelado pelo usuário → cai no clipboard */ }
  }
  await navigator.clipboard.writeText(shareLink.value)
  toast.success('Link copiado!')
  showShareModal.value = false
}

/** F7 #82: compartilhar currículo como arquivo TXT via Web Share L2 (canShare) */
async function shareAsFile() {
  if (!resume.value) return
  const { resumeToText, sanitizeFilename } = await import('~/lib/export/formats')
  const file = new File(
    [resumeToText(resume.value.data)],
    `${sanitizeFilename(resume.value.title)}.txt`,
    { type: 'text/plain' },
  )
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  const payload: ShareData = { files: [file], title: resume.value.title }
  if (nav.share && nav.canShare?.(payload)) {
    try {
      await nav.share(payload)
      return
    } catch { /* cancelado */ }
  }
  toast.error('Este navegador não suporta compartilhar arquivos')
}

function shareByEmail() {
  if (!resume.value) return
  window.location.href = shareMailto(resume.value, shareLink.value)
}

async function copyAsText() {
  if (!resume.value) return
  await navigator.clipboard.writeText(formattedTextForEmail(resume.value))
  toast.success('Currículo copiado como texto')
}

if (resume.value && resume.value.deletedAt) {
  throw createError({ statusCode: 404, message: 'Currículo não encontrado' })
}
/* ============ F5: fullscreen no preview + layout lado/embaixo ============ */
const isPreviewFullscreen = ref(false)
const previewLayout = ref<'side' | 'below'>(
  (localStorage.getItem('hirewerk-preview-layout') as 'side' | 'below' | null) ?? 'side'
)
watch(previewLayout, (v) => localStorage.setItem('hirewerk-preview-layout', v))

function togglePreviewFullscreen() {
  isPreviewFullscreen.value = !isPreviewFullscreen.value
}

function handleFullscreenKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isPreviewFullscreen.value) isPreviewFullscreen.value = false
}
onMounted(() => window.addEventListener('keydown', handleFullscreenKey))
onBeforeUnmount(() => window.removeEventListener('keydown', handleFullscreenKey))

</script>

<template>
  <div v-if="!store.ready" class="flex flex-col items-center justify-center py-20 gap-3">
    <div class="animate-spin rounded-full h-[34px] w-[34px] border-[3px] border-border border-t-secondary" role="status" aria-label="Carregando seus currículos"></div>
    <p class="text-sm text-muted-foreground">Carregando seus currículos…</p>
  </div>

  <div v-else-if="!resume" class="flex flex-col items-center justify-center py-20 text-center gap-3">
    <div class="w-16 h-16 bg-destructive-soft text-destructive rounded-2xl flex items-center justify-center font-display text-2xl font-extrabold">!</div>
    <h2 class="font-display text-xl font-bold text-foreground">Não conseguimos abrir este currículo</h2>
    <p class="text-sm text-muted-foreground max-w-xs">Ele pode ter sido excluído.</p>
    <Button variant="outline" as-child class="mt-2">
      <NuxtLink to="/resumes">Voltar à lista</NuxtLink>
    </Button>
  </div>

  <div v-else class="max-w-[1600px] mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 toolbar">
      <div>
        <NuxtLink to="/resumes" class="text-xs font-bold text-primary uppercase tracking-widest hover:opacity-80 transition-opacity mb-1 inline-block">
          &larr; Meus Currículos
        </NuxtLink>
        <div class="flex items-center gap-3">
          <Input
            v-model="resume.title"
            @input="handleUpdate"
            class="font-display text-lg font-bold bg-transparent border-transparent hover:border-border w-full md:w-auto min-w-[220px] h-auto"
            placeholder="Nome do currículo"
            aria-label="Título do currículo"
          />
          <Badge v-if="saveStatus === 'saving'" variant="sample" class="animate-pulse">
            Salvando…
          </Badge>
          <Badge v-else variant="success">
            Salvo{{ savedAt ? ` às ${savedAt}` : '' }}
          </Badge>
          <Badge variant="sample" class="tabular-nums cursor-help" :title="completenessTitle">
            {{ completenessPct }}% {{ t('state.complete') }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border self-start">
        <div class="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Tooltip>
            <template #trigger>
              <Button
                variant="ghost"
                size="icon"
                @click="handleUndo"
                :disabled="!canUndoNow"
                title="Desfazer (Ctrl+Z)"
              >
                <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
              </Button>
            </template>
            <template #content>Desfazer</template>
          </Tooltip>
          <Tooltip>
            <template #trigger>
              <Button
                variant="ghost"
                size="icon"
                @click="handleRedo"
                :disabled="!canRedoNow"
                title="Refazer (Ctrl+Y)"
              >
                <Icon name="lucide:rotate-cw" class="w-4 h-4" />
              </Button>
            </template>
            <template #content>Refazer</template>
          </Tooltip>
        </div>

        <Button
          @click="store.exportPdf(id)"
          class="shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
        >
          <Icon name="lucide:download" class="w-4 h-4 mr-2" />
          {{ t('editor.pdf') }}
        </Button>
        <Button variant="ghost" @click="handleSaveCopy">
          <Icon name="lucide:save" class="w-4 h-4 mr-2" />
          {{ t('editor.copy') }}
        </Button>
        <Button variant="ghost" @click="handleShare">
          <Icon name="lucide:share-2" class="w-4 h-4 mr-2" />
          {{ t('share.title') }}
        </Button>
        <Button variant="ghost" @click="showAts = !showAts">
          <Icon name="lucide:target" class="w-4 h-4 mr-2" />
          {{ t('editor.matchJob') }}
        </Button>
        <Button variant="ghost" @click="showVersions = !showVersions">
          <Icon name="lucide:history" class="w-4 h-4 mr-2" />
          {{ t('editor.versions') }}
        </Button>
        <Button variant="ghost" @click="showFindReplace = !showFindReplace" title="Buscar e substituir em todo o currículo">
          <Icon name="lucide:search" class="w-4 h-4 mr-2" />
          {{ t('action.replace') }}
        </Button>
        <Button variant="ghost" @click="duplicateForJob" title="Criar uma cópia para uma vaga específica">
          <Icon name="lucide:copy-plus" class="w-4 h-4 mr-2" />
          {{ t('editor.forJob') }}
        </Button>
        <Button variant="ghost" @click="pickImport('pdf')" title="Importar dados de um PDF ou do LinkedIn">
          <Icon name="lucide:file-up" class="w-4 h-4 mr-2" />
          {{ t('editor.import') }}
        </Button>
        <Button variant="ghost" as-child>
          <NuxtLink :to="`/templates?id=${id}`">
            {{ t('editor.template') }}
          </NuxtLink>
        </Button>
      </div>
      <input ref="importInput" type="file" class="hidden" :accept="importMode === 'pdf' ? 'application/pdf' : '.zip'" @change="handleImportFile" />
    </div>

    <!-- Validação inline (F2 #13) + modo sem experiência (F2 #19) -->
    <div class="no-print flex flex-wrap items-center gap-3 mb-4 -mt-4">
      <div
        v-if="hasEmptyRequired"
        class="flex items-center gap-2 text-xs text-destructive bg-destructive-soft rounded-lg px-3 py-2"
        role="alert"
      >
        <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5" />
        Há itens com campos obrigatórios vazios (cargo ou curso) — preencha ou remova antes de exportar.
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="text-xs text-muted-foreground"
        :class="{ 'text-secondary bg-secondary/10': noExperienceMode }"
        @click="toggleNoExperience"
        title="Modo para primeiro emprego: destaca resumo e formação, sem exigir experiência"
      >
        <Icon name="lucide:sprout" class="w-3.5 h-3.5 mr-1.5" />
        {{ noExperienceMode ? 'Modo sem experiência ativo' : 'Primeiro emprego? Ativar modo sem experiência' }}
      </Button>
      <Button
        v-if="!resume.data.headline.trim() || !resume.data.summary.trim()"
        variant="ghost"
        size="sm"
        class="text-xs text-muted-foreground"
        @click="applyProfessionPlaceholders"
        title="Preenche título e resumo com sugestões baseadas na sua profissão"
      >
        <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5 mr-1.5" />
        Sugerir texto por profissão
      </Button>
    </div>

    <!-- Busca e substituição global (F5 #67) -->
    <Card v-if="showFindReplace" class="toolbar rounded-2xl p-5 mb-8 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-display text-base font-bold text-foreground">Buscar e substituir</h3>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="showFindReplace = false" aria-label="Fechar busca">
          <Icon name="lucide:x" class="w-4 h-4" />
        </Button>
      </div>
      <div class="grid sm:grid-cols-2 gap-3">
        <Input v-model="findQuery" placeholder="Buscar..." aria-label="Texto a buscar" />
        <Input v-model="replaceQuery" placeholder="Substituir por..." aria-label="Texto de substituição" />
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" v-model="matchCase" class="accent-secondary" />
          Diferenciar maiúsculas
        </label>
        <span v-if="findMatches.length" class="text-xs text-muted-foreground">
          {{ findMatches.reduce((n, m) => n + m.count, 0) }} ocorrência(s) em {{ findMatches.length }} campo(s)
        </span>
        <Button variant="secondary" size="sm" :disabled="!findQuery || findMatches.length === 0" @click="runReplaceAll">
          <Icon name="lucide:replace" class="w-3.5 h-3.5 mr-1.5" />
          Substituir tudo
        </Button>
      </div>
      <div v-if="findMatches.length" class="text-[11px] text-muted-foreground">
        {{ findMatches.map(m => `${m.field} (${m.count})`).join(' · ') }}
      </div>
    </Card>

    <div class="lg:hidden flex border-b border-border mb-6">
      <Button
        variant="ghost"
        :class="[
          'flex-1 py-3 text-sm font-bold border-b-2 rounded-none',
          activeTab === 'editor'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground'
        ]"
        @click="activeTab = 'editor'"
      >
        <Icon name="lucide:pen-line" class="w-4 h-4 mr-2" />
        Editar
      </Button>
      <Button
        variant="ghost"
        :class="[
          'flex-1 py-3 text-sm font-bold border-b-2 rounded-none',
          activeTab === 'preview'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground'
        ]"
        @click="activeTab = 'preview'"
      >
        <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
        Visualizar
      </Button>
    </div>

    <!-- Timeline de versões (F4) -->
    <Card v-if="showVersions" class="toolbar rounded-2xl p-5 mb-8 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-display text-base font-bold text-foreground">Histórico de versões</h3>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="showVersions = false" aria-label="Fechar histórico">
          <Icon name="lucide:x" class="w-4 h-4" />
        </Button>
      </div>

      <p v-if="versions.length === 0" class="text-sm text-muted-foreground">
        Nenhuma versão salva ainda. Cada vez que você edita, uma versão anterior é guardada aqui (até 30).
      </p>

      <div v-else class="divide-y divide-border-soft">
        <div v-for="snap in versions" :key="snap.version" class="flex flex-wrap items-center gap-3 py-2.5">
          <span class="font-display font-bold text-sm w-14 tabular-nums">v{{ snap.version }}</span>
          <div class="flex-1 min-w-[160px]">
            <div class="text-sm text-foreground">
              {{ snap.label || new Date(snap.createdAt).toLocaleString('pt-BR') }}
            </div>
            <div v-if="snap.label" class="text-[11px] text-muted-foreground">{{ new Date(snap.createdAt).toLocaleString('pt-BR') }}</div>
          </div>
          <Button variant="ghost" size="sm" @click="renamePrompt(snap.version, snap.label)">Renomear</Button>
          <Button variant="outline" size="sm" @click="restoreThis(snap.version)">Restaurar</Button>
        </div>
      </div>
    </Card>

    <!-- Score ATS (F9 #97) -->
    <Card v-if="showAts" class="toolbar rounded-2xl p-5 mb-8 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-display text-base font-bold text-foreground">Compatibilidade com a vaga</h3>
          <p class="text-xs text-muted-foreground">Cole a descrição da vaga. A análise roda no seu aparelho — nada é enviado.</p>
        </div>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="showAts = false" aria-label="Fechar análise">
          <Icon name="lucide:x" class="w-4 h-4" />
        </Button>
      </div>

      <Textarea v-model="jobDescription" placeholder="Cole aqui a descrição da vaga..." class="min-h-[120px] resize-none" />

      <div v-if="jobDescription.trim().length > 50" class="space-y-3">
        <div class="flex items-center gap-4">
          <div class="font-display text-4xl font-bold tabular-nums" :class="atsScore >= 60 ? 'text-success' : atsScore >= 30 ? 'text-primary' : 'text-destructive'">
            {{ atsScore }}%
          </div>
          <p class="text-sm text-muted-foreground flex-1">
            {{ atsScore >= 60 ? 'Boa cobertura das palavras-chave da vaga.' : atsScore >= 30 ? 'Cobertura parcial — veja o que falta abaixo.' : 'Poucas palavras-chave da vaga aparecem no seu currículo.' }}
          </p>
        </div>

        <div class="h-2 rounded-full bg-surface overflow-hidden">
          <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${atsScore}%` }" />
        </div>

        <div v-if="atsMissing.length" class="space-y-1.5">
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Palavras-chave que faltam</p>
          <div class="flex flex-wrap gap-1.5">
            <Badge v-for="kw in atsMissing.slice(0, 15)" :key="kw" variant="destructive" class="text-[11px]">{{ kw }}</Badge>
          </div>
          <p class="text-[11px] text-muted-foreground">Se você tem essa experiência, inclua com as mesmas palavras da vaga.</p>
        </div>

        <div v-if="atsMatched.length" class="space-y-1.5">
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Encontradas no currículo</p>
          <div class="flex flex-wrap gap-1.5">
            <Badge v-for="kw in atsMatched.slice(0, 15)" :key="kw" variant="success" class="text-[11px]">{{ kw }}</Badge>
          </div>
        </div>
      </div>
    </Card>


    <div :class="previewLayout === 'below' ? 'flex flex-col gap-8 items-start' : 'grid gap-10 lg:grid-cols-[480px_1fr] items-start'">
      <div 
        :class="[
          'editor-column space-y-4 pb-20',
          activeTab === 'editor' ? 'block' : 'hidden lg:block'
        ]"
        @focusin="handleFieldFocus"
        @focusout="handleFieldBlur"
      >
            <Card v-for="section in DEFAULT_SECTIONS" :key="section.key" class="rounded-2xl overflow-hidden">
              <div
                class="flex items-center justify-between p-4 px-5 cursor-pointer hover:bg-surface transition-colors"
                @click="toggleSection(section.key)"
                :aria-expanded="isSectionOpen(section.key)"
              >
                <div class="flex items-center gap-3">
                  <Icon :name="section.icon" class="w-4 h-4 text-secondary" />
                  <h2 class="font-display text-base font-bold text-foreground">
                    {{ t('section.' + section.key) }}
                  </h2>
                  <span
                    v-if="(sectionWordCounts[section.key] ?? 0) > 0"
                    class="text-[10px] tabular-nums text-muted-foreground bg-surface rounded-full px-2 py-0.5"
                    :title="`${sectionWordCounts[section.key] ?? 0} palavras nesta seção`"
                  >{{ sectionWordCounts[section.key] ?? 0 }} palavras</span>
                </div>
                <Icon
                  :name="'lucide:chevron-down'"
                  class="w-4 h-4 text-muted-foreground transition-transform"
                  :class="{ '-rotate-90': !isSectionOpen(section.key) }"
                />
              </div>

              <div v-if="isSectionOpen(section.key)" class="px-6 pb-6">
                <template v-if="section.key === 'personal'">
                  <div class="space-y-5">
                    <div class="group">
                      <label class="block text-xs font-bold text-muted-foreground mb-1.5 group-focus-within:text-secondary transition-colors">Nome</label>
                      <Input
                        v-model="resume.data.name"
                        @input="handleUpdate"
                        placeholder="Seu nome"
                        inputmode="text"
                      />
                    </div>
                    <div class="group">
                      <label class="block text-xs font-bold text-muted-foreground mb-1.5 group-focus-within:text-secondary transition-colors">Título</label>
                      <Input
                        v-model="resume.data.headline"
                        @input="handleUpdate"
                        placeholder="Ex: Designer de produto"
                        inputmode="text"
                      />
                    </div>
                    <div class="group">
                      <div class="flex items-baseline justify-between mb-1.5">
                        <label class="block text-xs font-bold text-muted-foreground group-focus-within:text-secondary transition-colors">Resumo</label>
                        <span class="text-[10px] tabular-nums" :class="summaryWords > 120 ? 'text-destructive' : 'text-muted-foreground'">{{ summaryWords }} palavras</span>
                      </div>
                      <Textarea
                        v-model="resume.data.summary"
                        @input="handleUpdate"
                        placeholder="Duas linhas sobre você..."
                        class="resize-none"
                      />
                    </div>
                    <div class="group">
                      <label class="block text-xs font-bold text-muted-foreground mb-1.5 group-focus-within:text-secondary transition-colors">Localização</label>
                      <Input
                        v-model="resume.data.location"
                        @input="handleUpdate"
                        placeholder="Cidade, UF"
                        inputmode="text"
                      />
                    </div>
                    <div class="rounded-xl border border-border-soft p-4 space-y-4">
                      <label class="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          :checked="resume.data.showOptionalBR"
                          @change="resume.data.showOptionalBR = !resume.data.showOptionalBR; handleUpdate()"
                          class="accent-secondary w-4 h-4"
                        />
                        <span class="text-sm font-semibold text-foreground">Campos opcionais (BR)</span>
                      </label>
                      <template v-if="resume.data.showOptionalBR">
                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label class="block text-xs font-bold text-muted-foreground mb-1.5">Data de nascimento</label>
                            <Input v-model="resume.data.birthDate" @input="handleUpdate" placeholder="00/00/0000" />
                          </div>
                          <div>
                            <label class="block text-xs font-bold text-muted-foreground mb-1.5">Estado civil</label>
                            <Input v-model="resume.data.maritalStatus" @input="handleUpdate" placeholder="Solteiro(a)..." />
                          </div>
                        </div>
                        <div>
                          <label class="block text-xs font-bold text-muted-foreground mb-1.5">Pretensão salarial</label>
                          <Input v-model="resume.data.salaryExpectation" @input="handleUpdate" placeholder="R$ X.XXX,XX" />
                        </div>
                      </template>
                    </div>
                  </div>
                </template>

                <template v-if="section.key === 'experience'">
                  <div class="space-y-4">
                    <Card v-for="(exp, i) in (resume.data.experiences || [])" :key="i" class="p-4 bg-card space-y-3 rounded-md border-border-soft">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-muted-foreground">Experiência {{ Number(i) + 1 }}</span>
                        <div class="flex gap-0.5">
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="duplicateArrayItem('experiences', Number(i))" aria-label="Duplicar experiência" title="Duplicar">
                            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeArrayItem('experiences', Number(i))" aria-label="Remover experiência">
                            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <Input v-model="exp.role" @input="handleUpdate" placeholder="Cargo" inputmode="text" />
                        <Input v-model="exp.company" @input="handleUpdate" placeholder="Empresa" inputmode="text" />
                      </div>
                      <Input v-model="exp.period" @input="handleUpdate" placeholder="Período (ex: 2022 — atual)" inputmode="text" />
                      <Textarea v-model="exp.description" @input="handleUpdate" placeholder="O que você fez lá..." class="resize-none" />
                    </Card>
                    <Button
                      variant="outline"
                      class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50"
                      @click="addArrayItem('experiences', { role: '', company: '', period: '', description: '' })"
                    >
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Experiência
                    </Button>
                  </div>
                </template>

                <template v-if="section.key === 'education'">
                  <div class="space-y-4">
                    <Card v-for="(edu, i) in (resume.data.education || [])" :key="i" class="p-4 bg-card space-y-3 rounded-md border-border-soft">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-muted-foreground">Formação {{ Number(i) + 1 }}</span>
                        <div class="flex gap-0.5">
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="duplicateArrayItem('education', Number(i))" aria-label="Duplicar formação" title="Duplicar">
                            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeArrayItem('education', Number(i))" aria-label="Remover formação">
                            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <Input v-model="edu.course" @input="handleUpdate" placeholder="Curso" inputmode="text" />
                        <Input v-model="edu.institution" @input="handleUpdate" placeholder="Instituição" inputmode="text" />
                      </div>
                    </Card>
                    <Button
                      variant="outline"
                      class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50"
                      @click="addArrayItem('education', { course: '', institution: '' })"
                    >
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Formação
                    </Button>
                  </div>
                </template>

                <template v-if="section.key === 'skills'">
                  <div class="space-y-4">
                    <div v-for="(skill, i) in (resume.data.skills || [])" :key="i" class="flex items-center gap-2">
                      <Input
                        v-model="resume.data.skills[i]"
                        @input="handleUpdate"
                        placeholder="Habilidade"
                        inputmode="text"
                        class="flex-1"
                      />
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeArrayItem('skills', Number(i))">
                        <Icon name="lucide:x" class="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50"
                      @click="addArrayItem('skills', '')"
                    >
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Habilidade
                    </Button>
                  </div>
                </template>

                <!-- Links -->
                <template v-if="section.key === 'links'">
                  <div class="space-y-3">
                    <Card v-for="(link, i) in (resume.data.links || [])" :key="i" class="p-4 bg-card space-y-3 rounded-md border-border-soft">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-muted-foreground">Link {{ Number(i) + 1 }}</span>
                        <div class="flex gap-1">
                          <Button v-if="Number(i) > 0" variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground" @click="moveArrayItem('links', Number(i), -1)" aria-label="Mover para cima">
                            <Icon name="lucide:arrow-up" class="w-3.5 h-3.5" />
                          </Button>
                          <Button v-if="Number(i) < (resume.data.links?.length ?? 1) - 1" variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground" @click="moveArrayItem('links', Number(i), 1)" aria-label="Mover para baixo">
                            <Icon name="lucide:arrow-down" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="duplicateArrayItem('links', Number(i))" aria-label="Duplicar item" title="Duplicar">
                            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeArrayItem('links', Number(i))">
                            <Icon name="lucide:x" class="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <Input v-model="link.label" @input="handleUpdate" placeholder="Rótulo (ex: LinkedIn)" />
                        <select
                          :value="link.kind"
                          @change="link.kind = ($event.target as HTMLSelectElement).value as any; handleUpdate()"
                          class="flex h-[46px] w-full rounded-md border border-input bg-card px-3.5 text-sm"
                        >
                          <option value="linkedin">LinkedIn</option>
                          <option value="github">GitHub</option>
                          <option value="portfolio">Portfólio</option>
                          <option value="other">Outro</option>
                        </select>
                      </div>
                      <Input v-model="link.url" @input="handleUpdate" placeholder="https://..." inputmode="url" />
                    </Card>
                    <Button variant="outline" class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50" @click="addArrayItem('links', { label: '', url: '', kind: 'other' })">
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Link
                    </Button>
                  </div>
                </template>

                <!-- Projetos -->
                <template v-if="section.key === 'projects'">
                  <div class="space-y-3">
                    <Card v-for="(proj, i) in (resume.data.projects || [])" :key="i" class="p-4 bg-card space-y-3 rounded-md border-border-soft">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-muted-foreground">Projeto {{ Number(i) + 1 }}</span>
                        <div class="flex gap-1">
                          <Button v-if="Number(i) > 0" variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground" @click="moveArrayItem('projects', Number(i), -1)" aria-label="Mover para cima">
                            <Icon name="lucide:arrow-up" class="w-3.5 h-3.5" />
                          </Button>
                          <Button v-if="Number(i) < (resume.data.projects?.length ?? 1) - 1" variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground" @click="moveArrayItem('projects', Number(i), 1)" aria-label="Mover para baixo">
                            <Icon name="lucide:arrow-down" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="duplicateArrayItem('projects', Number(i))" aria-label="Duplicar item" title="Duplicar">
                            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeArrayItem('projects', Number(i))">
                            <Icon name="lucide:x" class="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <Input v-model="proj.name" @input="handleUpdate" placeholder="Nome do projeto" />
                        <Input v-model="proj.url" @input="handleUpdate" placeholder="https://..." inputmode="url" />
                      </div>
                      <Input v-model="proj.stack" @input="handleUpdate" placeholder="Tecnologias (ex: Vue, TypeScript)" />
                      <Textarea v-model="proj.description" @input="handleUpdate" placeholder="O que você construiu..." class="resize-none min-h-[70px]" />
                    </Card>
                    <Button variant="outline" class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50" @click="addArrayItem('projects', { name: '', url: '', description: '', stack: '' })">
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Projeto
                    </Button>
                  </div>
                </template>

                <!-- Certificações -->
                <template v-if="section.key === 'certifications'">
                  <div class="space-y-3">
                    <Card v-for="(cert, i) in (resume.data.certifications || [])" :key="i" class="p-4 bg-card space-y-3 rounded-md border-border-soft">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-muted-foreground">Certificação {{ Number(i) + 1 }}</span>
                        <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="duplicateArrayItem('certifications', Number(i))" aria-label="Duplicar item" title="Duplicar">
                            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeArrayItem('certifications', Number(i))">
                          <Icon name="lucide:x" class="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <Input v-model="cert.name" @input="handleUpdate" placeholder="Nome (ex: AWS Certified)" />
                      <div class="grid grid-cols-2 gap-3">
                        <Input v-model="cert.issuer" @input="handleUpdate" placeholder="Emissor" />
                        <Input v-model="cert.year" @input="handleUpdate" placeholder="Ano" inputmode="numeric" />
                      </div>
                    </Card>
                    <Button variant="outline" class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50" @click="addArrayItem('certifications', { name: '', issuer: '', year: '' })">
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Certificação
                    </Button>
                  </div>
                </template>

                <!-- Idiomas -->
                <template v-if="section.key === 'languages'">
                  <div class="space-y-3">
                    <div v-for="(lang, i) in (resume.data.languages || [])" :key="i" class="flex items-center gap-2">
                      <Input
                        :model-value="typeof lang === 'string' ? lang : `${lang.name} (${lang.level})`"
                        @update:model-value="(v) => { if (resume) { const parsed = parseLanguage(String(v)); resume.data.languages[i] = typeof resume.data.languages[i] === 'string' ? String(v) : parsed; handleUpdate(); } }"
                        placeholder="Inglês (B2)"
                        class="flex-1"
                      />
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeLanguage(Number(i))">
                        <Icon name="lucide:x" class="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50" @click="addLanguage">
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Idioma
                    </Button>
                  </div>
                </template>

                <!-- Voluntariado -->
                <template v-if="section.key === 'volunteer'">
                  <div class="space-y-3">
                    <Card v-for="(vol, i) in (resume.data.volunteer || [])" :key="i" class="p-4 bg-card space-y-3 rounded-md border-border-soft">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-muted-foreground">Voluntariado {{ Number(i) + 1 }}</span>
                        <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="duplicateArrayItem('volunteer', Number(i))" aria-label="Duplicar item" title="Duplicar">
                            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive-soft" @click="removeArrayItem('volunteer', Number(i))">
                          <Icon name="lucide:x" class="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <Input v-model="vol.role" @input="handleUpdate" placeholder="Função" />
                        <Input v-model="vol.org" @input="handleUpdate" placeholder="Organização" />
                      </div>
                      <Input v-model="vol.period" @input="handleUpdate" placeholder="Período (ex: 2022 — 2023)" />
                      <Textarea v-model="vol.description" @input="handleUpdate" placeholder="O que você fez..." class="resize-none min-h-[70px]" />
                    </Card>
                    <Button variant="outline" class="w-full h-10 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50" @click="addArrayItem('volunteer', { role: '', org: '', period: '', description: '' })">
                      <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                      Adicionar Voluntariado
                    </Button>
                  </div>
                </template>
              </div>
            </Card>
      </div>

      <div 
        :class="[
          'relative preview-container',
          previewLayout === 'below' ? 'w-full mt-8' : 'min-h-[800px]',
          isPreviewFullscreen ? 'fixed inset-0 z-[120] bg-background p-4 overflow-auto min-h-0' : '',
          activeTab === 'preview' ? 'block' : 'hidden lg:block'
        ]"
      >
        <div class="sticky top-24 space-y-4">
          <div class="rounded-3xl bg-surface border border-border-soft p-5 grid justify-items-center gap-4 overflow-hidden">
            <div class="flex items-center gap-3 w-full max-w-[360px]">
              <label for="zoom" class="text-sm font-bold text-foreground">Zoom</label>
              <input
                id="zoom"
                type="range"
                min="50"
                max="100"
                step="1"
                v-model.number="zoomPercent"
                class="flex-1 accent-secondary min-h-11"
              />
              <output for="zoom" class="text-sm tabular-nums min-w-[44px] text-right text-muted-foreground">{{ zoomPercent }}%</output>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="togglePreviewFullscreen"
                :title="isPreviewFullscreen ? 'Sair da tela cheia (Esc)' : 'Preview em tela cheia'"
                :aria-label="isPreviewFullscreen ? 'Sair da tela cheia' : 'Preview em tela cheia'"
              >
                <Icon :name="isPreviewFullscreen ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 hidden lg:grid"
                @click="previewLayout = previewLayout === 'side' ? 'below' : 'side'"
                :title="previewLayout === 'side' ? 'Mover preview para baixo' : 'Preview ao lado'"
                :aria-label="previewLayout === 'side' ? 'Layout: preview abaixo' : 'Layout: preview ao lado'"
              >
                <Icon :name="previewLayout === 'side' ? 'lucide:panel-bottom' : 'lucide:panel-right'" class="w-4 h-4" />
              </Button>
            </div>

            <div class="overflow-y-auto max-h-[80vh] custom-scrollbar w-full grid justify-items-center">
              <div
                :style="{ transform: `scale(${zoomPercent / 100})`, transformOrigin: 'top center' }"
                class="transition-transform duration-200 scale-zoom"
              >
                <StyledA4 :doc="resume">
                  <component :is="currentTemplate" :data="resume.data" />
                </StyledA4>
              </div>
            </div>
          </div>
          <p class="text-center text-xs text-muted-foreground -mt-2">Visualização em tempo real — é assim que a empresa vai receber</p>

          <!-- Painel de estilo por doc (F3) -->
          <div class="rounded-3xl bg-card border border-border-soft p-5 space-y-4">
            <h3 class="font-display text-sm font-bold text-foreground">Estilo do currículo</h3>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-muted-foreground mb-1.5">Cor de destaque</label>
                <div class="flex gap-1.5 flex-wrap">
                  <button
                    v-for="(hex, key) in ACCENT_CHOICES"
                    :key="key"
                    class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    :class="resume.style.accentColor === key ? 'border-foreground scale-110' : 'border-transparent'"
                    :style="{ background: hex || '#ea580c' }"
                    :aria-label="`Cor ${key || 'padrão'}`"
                    @click="resume.style.accentColor = key; handleUpdate()"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-muted-foreground mb-1.5">Fonte</label>
                <select
                  :value="resume.style.fontScale"
                  @change="resume.style.fontScale = ($event.target as HTMLSelectElement).value as any; handleUpdate()"
                  class="flex h-9 w-full rounded-md border border-input bg-card px-2 text-xs"
                >
                  <option value="compact">Compacta</option>
                  <option value="normal">Normal</option>
                  <option value="large">Grande</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-muted-foreground mb-1.5">Densidade</label>
                <select
                  :value="resume.style.density"
                  @change="resume.style.density = ($event.target as HTMLSelectElement).value as any; handleUpdate()"
                  class="flex h-9 w-full rounded-md border border-input bg-card px-2 text-xs"
                >
                  <option value="compact">Compacta</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Espaçada</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-muted-foreground mb-1.5">Papel</label>
                <select
                  :value="resume.style.paper"
                  @change="resume.style.paper = ($event.target as HTMLSelectElement).value as any; handleUpdate()"
                  class="flex h-9 w-full rounded-md border border-input bg-card px-2 text-xs"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-muted-foreground mb-1.5">Ícones de contato</label>
                <select
                  :value="resume.style.iconTheme"
                  @change="resume.style.iconTheme = ($event.target as HTMLSelectElement).value as any; handleUpdate()"
                  class="flex h-9 w-full rounded-md border border-input bg-card px-2 text-xs"
                >
                  <option value="none">Nenhum</option>
                  <option value="outline">Contorno</option>
                  <option value="filled">Preenchido</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-muted-foreground mb-1.5">Rodapé do PDF</label>
              <Input
                v-model="resume.style.footerText"
                @input="handleUpdate"
                placeholder="Ex: Maria Silva — maria@email.com — atualizado em 11/2026"
                class="text-xs"
              />
              <p class="text-[10px] text-muted-foreground mt-1">Aparece na base de cada página impressa. Vazio = sem rodapé.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de compartilhamento (F7) -->
    <div v-if="showShareModal" class="no-print fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4" @click.self="showShareModal = false">
      <div class="w-full max-w-md bg-card border border-border-soft rounded-2xl shadow-raised p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display text-lg font-bold text-foreground">Compartilhar</h3>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="showShareModal = false" aria-label="Fechar">
            <Icon name="lucide:x" class="w-4 h-4" />
          </Button>
        </div>

        <!-- modo: link simples ou protegido -->
        <div class="flex gap-1 bg-surface p-1 rounded-lg" role="tablist">
          <button
            class="flex-1 py-2 text-sm font-bold rounded-md transition-colors"
            :class="shareMode === 'link' ? 'bg-card shadow-ring text-foreground' : 'text-muted-foreground'"
            @click="shareMode = 'link'"
          >
            Link aberto
          </button>
          <button
            class="flex-1 py-2 text-sm font-bold rounded-md transition-colors"
            :class="shareMode === 'password' ? 'bg-card shadow-ring text-foreground' : 'text-muted-foreground'"
            @click="shareMode = 'password'"
          >
            🔒 Com senha
          </button>
        </div>

        <div v-if="shareMode === 'password'" class="space-y-2">
          <Input v-model="sharePassword" type="password" placeholder="Senha (mín. 4 caracteres)" @keyup.enter="buildProtectedLink" />
          <Button variant="outline" class="w-full" @click="buildProtectedLink">Gerar link protegido</Button>
          <p v-if="shareError" class="text-xs text-destructive">{{ shareError }}</p>
        </div>

        <div v-else class="space-y-2">
          <label class="text-xs font-bold text-muted-foreground">Expira em</label>
          <select
            v-model="shareExpiry"
            class="flex h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
            @change="shareLink = generateShareLink(resume!, { expiresInDays: shareExpiry === 'never' ? undefined : Number(shareExpiry) }); shareQr = generateQrSvg(shareLink, 140)"
          >
            <option value="never">Nunca</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
          </select>
        </div>

        <div class="rounded-lg bg-surface p-3 text-xs text-muted-foreground break-all font-mono">
          {{ shareLink.slice(0, 120) }}{{ shareLink.length > 120 ? '…' : '' }}
        </div>

        <!-- QR (F7) — indisponível para links protegidos/curtos demais -->
        <div v-if="shareQr" class="grid justify-items-center gap-1">
          <div class="text-foreground" v-html="shareQr" />
          <span class="text-[10px] text-muted-foreground">QR aponta para o link</span>
        </div>
        <p v-else class="text-center text-[11px] text-muted-foreground">
          QR indisponível para este link — use o botão copiar acima.
        </p>

        <div class="grid gap-2">
          <Button @click="doShareLink">
            <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
            Copiar link
          </Button>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" @click="shareByEmail">
              <Icon name="lucide:mail" class="w-4 h-4 mr-2" />
              Por e-mail
            </Button>
            <Button variant="outline" @click="copyAsText">
              <Icon name="lucide:clipboard-type" class="w-4 h-4 mr-2" />
              Como texto
            </Button>
          </div>
          <Button variant="outline" @click="shareAsFile" title="Compartilhar o currículo como arquivo TXT (Web Share)">
            <Icon name="lucide:file-up" class="w-4 h-4 mr-2" />
            Como arquivo
          </Button>
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
  background-color: hsl(var(--border));
  border-radius: 9999px;
  transition: background-color 0.2s;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted) / 0.3);
}
</style>