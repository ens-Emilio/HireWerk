<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useI18n } from '~/composables/useI18n'
import { useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { generateShareLink } from '~/lib/export/share'
import { exportAllZip } from '~/lib/export/zip'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'

const store = useResumeStore()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

/* ============ F8: atalhos do manifest + Share Target ============ */
// ?new=1 (atalho "Novo currículo") cria e abre o editor
// ?title= (Share Target) sugere o título recebido
onMounted(() => {
  if (store.ready && route.query.new === '1') {
    const sharedTitle = typeof route.query.title === 'string' ? route.query.title : undefined
    const doc = store.createResume()
    if (sharedTitle) {
      store.updateResume({ ...doc, title: sharedTitle })
    }
    router.replace(`/resumes/${doc.id}`)
  }
  // v3: Share Target com arquivo — o service worker repassa o PDF/texto recebido
  const shared = sessionStorage.getItem('hirewerk:shared-content')
  if (shared) {
    sessionStorage.removeItem('hirewerk:shared-content')
    handleSharedContent(shared)
  }
})

/** v3: conteúdo compartilhado de outro app (texto ou nome de arquivo) */
function handleSharedContent(raw: string) {
  const text = raw.trim()
  if (!text) return
  const title = text.split('\n')[0]?.slice(0, 80) ?? 'Currículo recebido'
  const doc = store.createResume()
  store.updateResume({ ...doc, title })
  toast.success(t('toast.sharedContent'))
  router.replace(`/resumes/${doc.id}`)
}

/* ============ F5 + v3: ordenar/filtrar/buscar (título e conteúdo) ============ */
const sortBy = ref<'recent' | 'name'>('recent')
const searchQuery = ref('')
const activeTag = ref<string | null>(null)
const kindFilter = ref<'all' | 'resume' | 'coverLetter'>('all')

const allTags = computed(() => {
  const tags = new Set<string>()
  for (const r of store.index) {
    if (!r.deletedAt) r.tags.forEach(t => tags.add(t))
  }
  return [...tags].sort()
})

const activeResumes = computed(() => {
  let list = store.index.filter(r => !r.deletedAt)
  if (kindFilter.value !== 'all') {
    list = list.filter(r => r.kind === kindFilter.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    // v3: busca também no conteúdo (skills, bullets, resumo, carta)
    const contentHits = store.searchInContent(q)
    list = list.filter(r =>
      r.title.toLowerCase().includes(q)
      || r.jobTitle.toLowerCase().includes(q)
      || r.tags.some(t => t.toLowerCase().includes(q))
      || contentHits.has(r.id)
    )
  }
  if (activeTag.value) {
    list = list.filter(r => r.tags.includes(activeTag.value!))
  }
  // pinned primeiro, depois critério
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (sortBy.value === 'name') return a.title.localeCompare(b.title, 'pt-BR')
    return b.updatedAt.localeCompare(a.updatedAt)
  })
})

/* ============ v3: multi-seleção e ações em lote ============ */
const selectionMode = ref(false)
const selected = ref<Set<string>>(new Set())

const allSelected = computed(() =>
  activeResumes.value.length > 0 && activeResumes.value.every(r => selected.value.has(r.id))
)

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value
  selected.value = new Set()
}

function toggleSelect(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function toggleSelectAll() {
  selected.value = allSelected.value
    ? new Set()
    : new Set(activeResumes.value.map(r => r.id))
}

function bulkDelete() {
  if (selected.value.size === 0) return
  const n = store.bulkSoftDelete([...selected.value])
  selected.value = new Set()
  toast.success(t('bulk.done', { n }))
}

function bulkExport() {
  const docs = [...selected.value]
    .map(id => store.getResume(id))
    .filter((d): d is NonNullable<typeof d> => d !== null)
  if (docs.length === 0) return
  exportAllZip(docs, '3.0.0')
  toast.success(t('bulk.done', { n: docs.length }))
}

/* ============ Ações ============ */
function handleCreate() {
  const newResume = store.createResume()
  toast.success(t('toast.resumeCreated'))
  router.push(`/resumes/${newResume.id}`)
}

function handleCreateLetter() {
  const letter = store.createCoverLetter()
  toast.success(t('cover.new'))
  router.push(`/resumes/${letter.id}`)
}

function handleDelete(id: string, title: string) {
  store.softDelete(id)
  toast.success(t('toast.movedToTrash', { title }))
}

function handleDuplicate(id: string) {
  const duplicate = store.duplicateResume(id)
  if (duplicate) {
    toast.success(t('toast.duplicated'))
  } else {
    toast.error(t('toast.duplicateFailed'))
  }
}

/** Renomear inline (F5 #73): duplo clique no título */
const renamingId = ref<string | null>(null)
const renameValue = ref('')

function startRename(id: string, current: string) {
  renamingId.value = id
  renameValue.value = current
}

function commitRename(id: string) {
  const doc = store.getResume(id)
  const title = renameValue.value.trim()
  renamingId.value = null
  if (!doc || !title || title === doc.title) return
  store.updateResume({ ...doc, title })
  toast.success(t('toast.renamed'))
}

function cancelRename() {
  renamingId.value = null
}

/** Pin/unpin */
function togglePin(id: string) {
  const doc = store.getResume(id)
  if (!doc) return
  store.updateResume({ ...doc, pinned: !doc.pinned })
}

/** Tags: prompt simples (F5 #75) */
function editTags(id: string, current: string[]) {
  const raw = window.prompt(t('list.tagsPrompt'), current.join(', '))
  if (raw === null) return
  const doc = store.getResume(id)
  if (!doc) return
  store.updateResume({ ...doc, tags: raw.split(',').map(t => t.trim()).filter(Boolean) })
}

function handleShare(id: string) {
  const resume = store.getResume(id)
  if (!resume) {
    toast.error(t('toast.resumeNotFound'))
    return
  }
  const link = generateShareLink(resume)
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title: resume.title, url: link }).catch(() => {
      navigator.clipboard.writeText(link)
      toast.success(t('toast.linkCopied'))
    })
  } else {
    navigator.clipboard.writeText(link)
    toast.success(t('toast.linkCopiedClipboard'))
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <div v-if="!store.ready" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-[3px] border-border border-t-secondary" role="status" :aria-label="t('list.loadingAria')"></div>
    </div>

    <template v-else>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-foreground">{{ t('list.title') }}</h1>
          <p class="text-muted-foreground mt-1 text-sm">{{ t('list.subtitle') }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button v-if="activeResumes.length > 0" variant="outline" @click="toggleSelectionMode">
            <Icon name="lucide:check-square" class="w-4 h-4 mr-2" />
            {{ selectionMode ? t('bulk.clear') : t('bulk.select') }}
          </Button>
          <Button variant="outline" @click="handleCreateLetter">
            <Icon name="lucide:mail-plus" class="w-4 h-4 mr-2" />
            {{ t('cover.new') }}
          </Button>
          <Button
            @click="handleCreate"
            class="rounded-xl shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform"
          >
            <Icon name="lucide:plus" class="w-5 h-5 mr-2" />
            {{ t('action.new') }}
          </Button>
        </div>
      </div>

      <!-- Busca + ordenação + tags + filtro de tipo (F5/v3) -->
      <div v-if="activeResumes.length > 0 || searchQuery || activeTag" class="space-y-3">
        <div class="flex flex-wrap gap-3">
          <Input
            v-model="searchQuery"
            :placeholder="t('list.search')"
            class="flex-1 min-w-[200px]"
            :aria-label="t('list.searchAria')"
          />
          <select
            v-model="kindFilter"
            class="flex h-[46px] rounded-md border border-input bg-card px-3 text-sm"
            :aria-label="t('list.kindAria')"
          >
            <option value="all">{{ t('list.kindAll') }}</option>
            <option value="resume">{{ t('list.kindResume') }}</option>
            <option value="coverLetter">{{ t('list.kindLetter') }}</option>
          </select>
          <select
            v-model="sortBy"
            class="flex h-[46px] rounded-md border border-input bg-card px-3 text-sm"
            :aria-label="t('list.sortAria')"
          >
            <option value="recent">{{ t('list.sort.recent') }}</option>
            <option value="name">{{ t('list.sort.name') }}</option>
          </select>
        </div>
        <div v-if="allTags.length" class="flex flex-wrap gap-1.5 items-center">
          <button
            class="text-xs font-bold px-2.5 py-1 rounded-full border transition-colors"
            :class="!activeTag ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
            @click="activeTag = null"
          >
            {{ t('list.tagAll') }}
          </button>
          <button
            v-for="tag in allTags"
            :key="tag"
            class="text-xs font-bold px-2.5 py-1 rounded-full border transition-colors"
            :class="activeTag === tag ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
            @click="activeTag = activeTag === tag ? null : tag"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Barra de ações em lote (v3) -->
      <div
        v-if="selectionMode && activeResumes.length > 0"
        class="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5"
      >
        <label class="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
          <input type="checkbox" :checked="allSelected" class="accent-secondary w-4 h-4" @change="toggleSelectAll" />
          {{ t('bulk.selected', { n: selected.size }) }}
        </label>
        <div class="flex-1"></div>
        <Button variant="outline" size="sm" :disabled="selected.size === 0" @click="bulkExport">
          <Icon name="lucide:archive" class="w-3.5 h-3.5 mr-1.5" />
          {{ t('bulk.export') }}
        </Button>
        <Button variant="destructive" size="sm" :disabled="selected.size === 0" @click="bulkDelete">
          <Icon name="lucide:trash-2" class="w-3.5 h-3.5 mr-1.5" />
          {{ t('bulk.delete') }}
        </Button>
      </div>

      <div
        v-if="activeResumes.length > 0"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card
          v-for="r in activeResumes"
          :key="r.id"
          class="group p-5 rounded-2xl flex flex-col gap-3"
          :class="[r.pinned ? 'ring-2 ring-primary/40' : '', selected.has(r.id) ? 'ring-2 ring-secondary' : '']"
        >
          <!-- Pin + seleção no topo -->
          <div class="flex items-start justify-between -mt-1 -mr-1">
            <label v-if="selectionMode" class="p-1 cursor-pointer">
              <input
                type="checkbox"
                :checked="selected.has(r.id)"
                class="accent-secondary w-4 h-4"
                :aria-label="t('list.selectAria', { title: r.title })"
                @change="toggleSelect(r.id)"
              />
            </label>
            <button
              v-else
              class="text-muted-foreground hover:text-foreground transition-colors p-1"
              :class="r.pinned ? 'text-primary' : 'opacity-0 group-hover:opacity-100'"
              :title="r.pinned ? t('list.unpin') : t('list.pin')"
              :aria-label="r.pinned ? t('list.unpin') : t('list.pin')"
              @click="togglePin(r.id)"
            >
              <Icon :name="r.pinned ? 'lucide:pin-off' : 'lucide:pin'" class="w-4 h-4" />
            </button>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="text-muted-foreground hover:text-foreground p-1" :title="t('list.editTags')" :aria-label="t('list.editTags')" @click="editTags(r.id, r.tags)">
                <Icon name="lucide:tag" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="rounded-md border border-border-soft bg-surface p-4 grid gap-1.5">
            <span class="font-display font-bold text-sm text-foreground truncate">{{ r.title }}</span>
            <span class="a4-line w-3/5"></span>
            <span class="a4-line w-4/5"></span>
          </div>

          <!-- Título: duplo clique renomeia (F5 #73) -->
          <div v-if="renamingId === r.id">
            <Input
              v-model="renameValue"
              @keyup.enter="commitRename(r.id)"
              @keyup.escape="cancelRename()"
              @blur="commitRename(r.id)"
              :aria-label="t('list.renameAria')"
              autofocus
            />
          </div>
          <h3
            v-else
            class="text-lg font-bold text-foreground truncate cursor-text"
            :title="t('list.renameHint')"
            @dblclick="startRename(r.id, r.title)"
          >
            {{ r.title }}
          </h3>

          <p class="text-xs text-muted-foreground">
            <span v-if="r.kind === 'coverLetter'" class="font-semibold text-secondary">{{ t('cover.title') }}</span>
            <span v-else>{{ t(`tpl.${r.templateId}.name`) }}</span>
            · {{ t('list.updated') }} {{ new Date(r.updatedAt).toLocaleDateString('pt-BR') }}
          </p>

          <!-- Tags -->
          <div v-if="r.tags.length" class="flex flex-wrap gap-1">
            <Badge v-for="tag in r.tags" :key="tag" variant="sample" class="text-[10px]">{{ tag }}</Badge>
          </div>
          <p v-if="r.jobTitle" class="text-xs text-secondary font-semibold">🎯 {{ r.jobTitle }}</p>

          <div class="mt-auto">
            <Button
              variant="outline"
              class="w-full hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 transition-all"
              as-child
            >
              <NuxtLink :to="`/resumes/${r.id}`">{{ t('action.edit') }}</NuxtLink>
            </Button>
            <div class="flex gap-1.5 mt-2">
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="handleShare(r.id)" :title="t('action.share')">
                <Icon name="lucide:share-2" class="w-3.5 h-3.5 mr-1" />
                {{ t('action.share') }}
              </Button>
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="handleDuplicate(r.id)" :title="t('action.duplicate')">
                <Icon name="lucide:copy" class="w-3.5 h-3.5 mr-1" />
                {{ t('action.duplicate') }}
              </Button>
              <Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive-soft hover:text-destructive" @click="handleDelete(r.id, r.title)" :title="t('bulk.delete')">
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div
        v-else-if="searchQuery || activeTag || kindFilter !== 'all'"
        class="flex flex-col items-center justify-center py-20 px-4 text-center"
      >
        <div class="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-muted-foreground mb-6 font-display text-2xl font-extrabold">?</div>
        <h2 class="font-display text-xl font-bold text-foreground">{{ t('list.noResults') }}</h2>
        <p class="text-muted-foreground mt-2 max-w-xs mx-auto">{{ t('list.noResultsHint') }}</p>
        <Button variant="outline" class="mt-6" @click="searchQuery = ''; activeTag = null; kindFilter = 'all'">{{ t('list.clearFilters') }}</Button>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-20 px-4 bg-surface/50 border-2 border-dashed border-border rounded-3xl text-center"
      >
        <div class="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center text-foreground mb-6 font-display text-2xl font-extrabold">H</div>
        <h2 class="font-display text-xl font-bold text-foreground">{{ t('state.empty.title') }}</h2>
        <p class="text-muted-foreground mt-2 max-w-xs mx-auto">{{ t('state.empty.text') }}</p>
        <Button
          @click="handleCreate"
          class="mt-8 rounded-xl shadow-lg shadow-primary/25"
        >
          {{ t('state.empty.cta') }}
        </Button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.a4-line {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: hsl(var(--border));
}
</style>
