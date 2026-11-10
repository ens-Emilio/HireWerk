<script setup lang="ts">
import { useResumeStore } from '~/stores/resume'
import { useI18n } from '~/composables/useI18n'
import { useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { generateShareLink } from '~/lib/export/share'
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
})
/* ============ F5: ordenar/filtrar/buscar ============ */
const sortBy = ref<'recent' | 'name'>('recent')
const searchQuery = ref('')
const activeTag = ref<string | null>(null)

const allTags = computed(() => {
  const tags = new Set<string>()
  for (const r of store.index) {
    if (!r.deletedAt) r.tags.forEach(t => tags.add(t))
  }
  return [...tags].sort()
})

const activeResumes = computed(() => {
  let list = store.index.filter(r => !r.deletedAt)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(r => r.title.toLowerCase().includes(q) || r.jobTitle.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q)))
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

/* ============ Ações ============ */
function handleCreate() {
  const newResume = store.createResume()
  toast.success('Pronto! Seu currículo foi criado.')
  router.push(`/resumes/${newResume.id}`)
}

function handleDelete(id: string, title: string) {
  store.softDelete(id)
  toast.success(`"${title}" foi para a lixeira. Você pode recuperar depois.`)
}

function handleDuplicate(id: string) {
  const duplicate = store.duplicateResume(id)
  if (duplicate) {
    toast.success('Currículo duplicado!')
  } else {
    toast.error('Não foi possível duplicar este currículo.')
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
  toast.success('Renomeado')
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
  const raw = window.prompt('Tags separadas por vírgula:', current.join(', '))
  if (raw === null) return
  const doc = store.getResume(id)
  if (!doc) return
  store.updateResume({ ...doc, tags: raw.split(',').map(t => t.trim()).filter(Boolean) })
}

function handleShare(id: string) {
  const resume = store.getResume(id)
  if (!resume) {
    toast.error('Currículo não encontrado')
    return
  }
  const link = generateShareLink(resume)
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title: resume.title, url: link }).catch(() => {
      navigator.clipboard.writeText(link)
      toast.success('Link copiado!')
    })
  } else {
    navigator.clipboard.writeText(link)
    toast.success('Link copiado para a área de transferência!')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <div v-if="!store.ready" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-[3px] border-border border-t-secondary" role="status" aria-label="Carregando currículos"></div>
    </div>

    <template v-else>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-foreground">{{ t('list.title') }}</h1>
          <p class="text-muted-foreground mt-1 text-sm">{{ t('list.subtitle') }}</p>
        </div>
        <Button
          @click="handleCreate"
          class="rounded-xl shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform"
        >
          <Icon name="lucide:plus" class="w-5 h-5 mr-2" />
          Novo currículo
        </Button>
      </div>

      <!-- Busca + ordenação + tags (F5) -->
      <div v-if="activeResumes.length > 0 || searchQuery || activeTag" class="space-y-3">
        <div class="flex flex-wrap gap-3">
          <Input
            v-model="searchQuery"
            :placeholder="t('list.search')"
            class="flex-1 min-w-[200px]"
            aria-label="Buscar currículos"
          />
          <select
            v-model="sortBy"
            class="flex h-[46px] rounded-md border border-input bg-card px-3 text-sm"
            aria-label="Ordenar por"
          >
            <option value="recent">Mais recentes</option>
            <option value="name">Nome (A–Z)</option>
          </select>
        </div>
        <div v-if="allTags.length" class="flex flex-wrap gap-1.5 items-center">
          <button
            class="text-xs font-bold px-2.5 py-1 rounded-full border transition-colors"
            :class="!activeTag ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
            @click="activeTag = null"
          >
            todas
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

      <div
        v-if="activeResumes.length > 0"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card
          v-for="r in activeResumes"
          :key="r.id"
          class="group p-5 rounded-2xl flex flex-col gap-3"
          :class="r.pinned ? 'ring-2 ring-primary/40' : ''"
        >
          <!-- Pin no topo -->
          <div class="flex items-start justify-between -mt-1 -mr-1">
            <button
              class="text-muted-foreground hover:text-foreground transition-colors p-1"
              :class="r.pinned ? 'text-primary' : 'opacity-0 group-hover:opacity-100'"
              :title="r.pinned ? 'Desafixar' : 'Fixar no topo'"
              :aria-label="r.pinned ? 'Desafixar' : 'Fixar no topo'"
              @click="togglePin(r.id)"
            >
              <Icon :name="r.pinned ? 'lucide:pin-off' : 'lucide:pin'" class="w-4 h-4" />
            </button>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="text-muted-foreground hover:text-foreground p-1" title="Editar tags" aria-label="Editar tags" @click="editTags(r.id, r.tags)">
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
              aria-label="Novo título"
              autofocus
            />
          </div>
          <h3
            v-else
            class="text-lg font-bold text-foreground truncate cursor-text"
            title="Duplo clique para renomear"
            @dblclick="startRename(r.id, r.title)"
          >
            {{ r.title }}
          </h3>

          <p class="text-xs text-muted-foreground">
            {{ r.templateId === 'classic' ? 'clássico' : r.templateId === 'minimal' ? 'minimalista' : r.templateId === 'modern' ? 'moderno' : r.templateId === 'executive' ? 'executivo' : r.templateId === 'creative' ? 'criativo' : r.templateId }} · atualizado em {{ new Date(r.updatedAt).toLocaleDateString('pt-BR') }}
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
              <NuxtLink :to="`/resumes/${r.id}`">Editar</NuxtLink>
            </Button>
            <div class="flex gap-1.5 mt-2">
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="handleShare(r.id)" title="Compartilhar">
                <Icon name="lucide:share-2" class="w-3.5 h-3.5 mr-1" />
                Compartilhar
              </Button>
              <Button variant="ghost" size="sm" class="flex-1 text-xs" @click="handleDuplicate(r.id)" title="Duplicar">
                <Icon name="lucide:copy" class="w-3.5 h-3.5 mr-1" />
                Duplicar
              </Button>
              <Button variant="ghost" size="sm" class="text-destructive hover:bg-destructive-soft hover:text-destructive" @click="handleDelete(r.id, r.title)" title="Mover para lixeira">
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div
        v-else-if="searchQuery || activeTag"
        class="flex flex-col items-center justify-center py-20 px-4 text-center"
      >
        <div class="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-muted-foreground mb-6 font-display text-2xl font-extrabold">?</div>
        <h2 class="font-display text-xl font-bold text-foreground">Nada encontrado</h2>
        <p class="text-muted-foreground mt-2 max-w-xs mx-auto">Tente outro termo ou limpe os filtros.</p>
        <Button variant="outline" class="mt-6" @click="searchQuery = ''; activeTag = null">Limpar filtros</Button>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-20 px-4 bg-surface/50 border-2 border-dashed border-border rounded-3xl text-center"
      >
        <div class="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center text-foreground mb-6 font-display text-2xl font-extrabold">H</div>
        <h2 class="font-display text-xl font-bold text-foreground">Nenhum currículo ainda</h2>
        <p class="text-muted-foreground mt-2 max-w-xs mx-auto">Crie o primeiro agora, leva menos de um minuto.</p>
        <Button
          @click="handleCreate"
          class="mt-8 rounded-xl shadow-lg shadow-primary/25"
        >
          Criar meu primeiro currículo
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
