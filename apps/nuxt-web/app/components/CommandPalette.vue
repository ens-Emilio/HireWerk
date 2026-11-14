/**
 * Command palette (F5 #80, ampliada na v3): Ctrl+K — navegar, criar, exportar,
 * duplicar, compartilhar, publicar e abrir painéis do editor.
 *
 * ponytail: keyboard-first, sem dependências. As ações do editor só aparecem
 * quando há um currículo aberto (rota /resumes/:id).
 */
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResumeStore } from '~/stores/resume'
import { useI18n } from '~/composables/useI18n'
import { toast } from 'vue-sonner'
import { exportTxt, exportDocx } from '~/lib/export/formats'
import { exportPng } from '~/lib/export/png'
import { generateShareLink } from '~/lib/export/share'

const open = ref(false)
const query = ref('')
const selected = ref(0)
const router = useRouter()
const route = useRoute()
const store = useResumeStore()
const { t } = useI18n()

interface Command {
  id: string
  label: string
  hint: string
  icon: string
  action: () => void
}

/** Id do currículo aberto no editor, se houver */
const currentId = computed(() => {
  const m = route.path.match(/^\/resumes\/([0-9a-f-]{36})$/)
  return m?.[1] ?? null
})

const commands = computed<Command[]>(() => {
  const nav: Command[] = [
    { id: 'nav-dashboard', label: t('nav.dashboard'), hint: t('palette.hintNav'), icon: 'lucide:layout-dashboard', action: () => router.push('/dashboard') },
    { id: 'nav-resumes', label: t('list.title'), hint: t('palette.hintNav'), icon: 'lucide:file-text', action: () => router.push('/resumes') },
    { id: 'nav-templates', label: t('nav.templates'), hint: t('palette.hintNav'), icon: 'lucide:palette', action: () => router.push('/templates') },
    { id: 'nav-tracker', label: t('tracker.title'), hint: t('palette.hintNav'), icon: 'lucide:kanban', action: () => router.push('/applications') },
    { id: 'nav-settings', label: t('nav.settings'), hint: t('palette.hintNav'), icon: 'lucide:settings', action: () => router.push('/settings') },
    { id: 'nav-trash', label: t('nav.trash'), hint: t('palette.hintNav'), icon: 'lucide:trash-2', action: () => router.push('/resumes/trash') },
    { id: 'nav-guide', label: t('nav.guide'), hint: t('palette.hintNav'), icon: 'lucide:book-open', action: () => router.push('/guide') },
    { id: 'nav-about', label: t('nav.about'), hint: t('palette.hintNav'), icon: 'lucide:info', action: () => router.push('/about') },
    { id: 'new', label: t('action.new'), hint: t('palette.hintAction'), icon: 'lucide:plus', action: () => { const d = store.createResume(); router.push(`/resumes/${d.id}`) } },
    { id: 'new-letter', label: t('cover.new'), hint: t('palette.hintAction'), icon: 'lucide:mail-plus', action: () => { const d = store.createCoverLetter(); router.push(`/resumes/${d.id}`) } },
  ]

  const doc = currentId.value ? store.getResume(currentId.value) : null
  const editor: Command[] = doc ? [
    { id: 'ed-pdf', label: t('editor.pdf'), hint: t('palette.hintExport'), icon: 'lucide:download', action: () => store.exportPdf(doc.id) },
    { id: 'ed-txt', label: t('palette.exportTxt'), hint: t('palette.hintExport'), icon: 'lucide:file-type', action: () => { exportTxt(doc); toast.success(t('toast.exported', { format: 'TXT' })) } },
    { id: 'ed-docx', label: t('palette.exportDocx'), hint: t('palette.hintExport'), icon: 'lucide:file-text', action: () => { void exportDocx(doc); toast.success(t('toast.exported', { format: 'DOCX' })) } },
    { id: 'ed-png', label: t('palette.exportPng'), hint: t('palette.hintExport'), icon: 'lucide:image', action: () => { exportPng(doc, null); toast.success(t('toast.exported', { format: 'PNG' })) } },
    { id: 'ed-json', label: t('palette.exportJson'), hint: t('palette.hintExport'), icon: 'lucide:file-json', action: () => store.exportJson(doc.id) },
    { id: 'ed-dup', label: t('action.duplicate'), hint: t('palette.hintAction'), icon: 'lucide:copy', action: () => { const d = store.duplicateResume(doc.id); if (d) { toast.success(t('action.duplicate')); router.push(`/resumes/${d.id}`) } } },
    { id: 'ed-share', label: t('share.copyLink'), hint: t('palette.hintAction'), icon: 'lucide:share-2', action: () => { void navigator.clipboard.writeText(generateShareLink(doc)); toast.success(t('share.linkCopied')) } },
    { id: 'ed-template', label: t('editor.template'), hint: t('palette.hintNav'), icon: 'lucide:layout-template', action: () => router.push(`/templates?id=${doc.id}`) },
    { id: 'ed-letter', label: t('cover.fromResume'), hint: t('palette.hintAction'), icon: 'lucide:mail-plus', action: () => { const d = store.createCoverLetter(doc.id); router.push(`/resumes/${d.id}`) } },
  ] : []

  const resumes: Command[] = store.index
    .filter(r => !r.deletedAt)
    .slice(0, 8)
    .map(r => ({
      id: `resume-${r.id}`,
      label: r.title,
      hint: r.kind === 'coverLetter' ? t('palette.kindLetter') : t('palette.kindResume'),
      icon: r.kind === 'coverLetter' ? 'lucide:mail' : 'lucide:file-text',
      action: () => router.push(`/resumes/${r.id}`),
    }))

  const all = [...nav, ...editor, ...resumes]
  const q = query.value.trim().toLowerCase()
  if (!q) return all
  return all.filter(c => c.label.toLowerCase().includes(q) || c.hint.includes(q))
})

function handleGlobalKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
    query.value = ''
    selected.value = 0
  }
  if (e.key === 'Escape' && open.value) open.value = false
}

function move(delta: 1 | -1) {
  if (commands.value.length === 0) return
  selected.value = (selected.value + delta + commands.value.length) % commands.value.length
}

function run(cmd: Command) {
  open.value = false
  cmd.action()
}

onMounted(() => window.addEventListener('keydown', handleGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', handleGlobalKey))
</script>

<template>
  <div
    v-if="open"
    class="no-print fixed inset-0 z-[110] bg-black/40 flex items-start justify-center pt-[12vh] px-4"
    @click.self="open = false"
  >
    <div class="w-full max-w-lg bg-card border border-border-soft rounded-2xl shadow-raised overflow-hidden">
      <div class="flex items-center gap-3 px-4 border-b border-border-soft">
        <Icon name="lucide:search" class="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          v-model="query"
          :placeholder="t('palette.placeholder')"
          class="flex-1 h-12 bg-transparent outline-none text-sm"
          :aria-label="t('palette.aria')"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter="commands[selected] && run(commands[selected]!)"
        />
        <kbd class="text-[10px] font-bold text-muted-foreground border border-border rounded px-1.5 py-0.5">esc</kbd>
      </div>
      <div class="max-h-[50vh] overflow-y-auto py-1">
        <button
          v-for="(cmd, i) in commands"
          :key="cmd.id"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
          :class="i === selected ? 'bg-surface' : ''"
          @mouseenter="selected = i"
          @click="run(cmd)"
        >
          <Icon :name="cmd.icon" class="w-4 h-4 text-muted-foreground shrink-0" />
          <span class="flex-1 text-foreground">{{ cmd.label }}</span>
          <span class="text-[10px] text-muted-foreground uppercase tracking-wider">{{ cmd.hint }}</span>
        </button>
        <p v-if="commands.length === 0" class="px-4 py-6 text-sm text-muted-foreground text-center">
          {{ t('palette.noResults') }}
        </p>
      </div>
      <div class="px-4 py-2 border-t border-border-soft flex items-center gap-3 text-[10px] text-muted-foreground">
        <span><kbd class="font-bold">↑↓</kbd> {{ t('palette.navigate') }}</span>
        <span><kbd class="font-bold">enter</kbd> {{ t('palette.execute') }}</span>
        <span class="ml-auto">Ctrl+K</span>
      </div>
    </div>
  </div>
</template>
