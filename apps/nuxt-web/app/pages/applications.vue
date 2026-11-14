<script setup lang="ts">
/**
 * Tracker de candidaturas (v3) — kanban simples por status, com follow-ups.
 * Tudo no localStorage; nada sai do aparelho.
 */
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useApplicationsStore } from '~/stores/applications'
import { useResumeStore } from '~/stores/resume'
import { useI18n } from '~/composables/useI18n'
import { APPLICATION_STATUSES, type Application } from '~/lib/storage/schema'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'

const apps = useApplicationsStore()
const resumes = useResumeStore()
const { t } = useI18n()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const draft = ref<Partial<Application>>({})

const columns = computed(() =>
  APPLICATION_STATUSES.map(status => ({
    status,
    label: t(`tracker.status.${status}`),
    items: apps.list.filter(a => a.status === status),
  }))
)

const due = computed(() => apps.dueFollowUps())
const resumeOptions = computed(() => resumes.index.filter(r => !r.deletedAt))

function startNew() {
  editingId.value = null
  draft.value = { status: 'wishlist', appliedAt: new Date().toISOString().slice(0, 10) }
  showForm.value = true
}

function startEdit(app: Application) {
  editingId.value = app.id
  draft.value = { ...app }
  showForm.value = true
}

function save() {
  if (!draft.value.company?.trim() && !draft.value.role?.trim()) {
    toast.error(t('toast.appNeedsCompany'))
    return
  }
  if (editingId.value) {
    apps.update(editingId.value, draft.value)
  } else {
    apps.create(draft.value)
  }
  showForm.value = false
  draft.value = {}
  toast.success(t('toast.candidateSaved'))
}

function remove(app: Application) {
  if (!window.confirm(t('tracker.deleteConfirm'))) return
  apps.remove(app.id)
}

function move(app: Application, delta: -1 | 1) {
  const i = APPLICATION_STATUSES.indexOf(app.status)
  const next = APPLICATION_STATUSES[i + delta]
  if (!next) return
  apps.update(app.id, { status: next })
}

function resumeTitle(id: string): string {
  return resumes.index.find(r => r.id === id)?.title ?? ''
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight text-foreground">{{ t('tracker.title') }}</h1>
        <p class="text-muted-foreground mt-1 text-sm">{{ t('tracker.subtitle') }}</p>
      </div>
      <Button @click="startNew" class="rounded-xl shadow-lg shadow-primary/25">
        <Icon name="lucide:plus" class="w-5 h-5 mr-2" />
        {{ t('tracker.new') }}
      </Button>
    </div>

    <div
      v-if="due.length"
      class="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex flex-wrap items-center gap-2 text-sm"
      role="status"
    >
      <Icon name="lucide:bell-ring" class="w-4 h-4" />
      <span class="font-semibold">{{ t('tracker.due', { n: due.length }) }}</span>
      <span class="text-muted-foreground">{{ due.map(a => `${a.company || a.role} (${a.followUpAt})`).join(' · ') }}</span>
    </div>

    <!-- Formulário -->
    <Card v-if="showForm" class="p-5 rounded-2xl space-y-3">
      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.company') }}</label>
          <Input v-model="draft.company" :placeholder="t('field.company')" />
        </div>
        <div>
          <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.role') }}</label>
          <Input v-model="draft.role" :placeholder="t('field.role')" />
        </div>
        <div>
          <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.status') }}</label>
          <select v-model="draft.status" class="flex h-[46px] w-full rounded-md border border-input bg-card px-3 text-sm">
            <option v-for="s in APPLICATION_STATUSES" :key="s" :value="s">{{ t(`tracker.status.${s}`) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.resume') }}</label>
          <select v-model="draft.resumeId" class="flex h-[46px] w-full rounded-md border border-input bg-card px-3 text-sm">
            <option value="">—</option>
            <option v-for="r in resumeOptions" :key="r.id" :value="r.id">{{ r.title }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.appliedAt') }}</label>
          <Input v-model="draft.appliedAt" type="date" />
        </div>
        <div>
          <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.followUpAt') }}</label>
          <Input v-model="draft.followUpAt" type="date" />
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.url') }}</label>
        <Input v-model="draft.url" placeholder="https://..." inputmode="url" />
      </div>
      <div>
        <label class="block text-xs font-bold text-muted-foreground mb-1.5">{{ t('tracker.notes') }}</label>
        <Textarea v-model="draft.notes" class="resize-none min-h-[70px]" />
      </div>
      <div class="flex gap-2">
        <Button @click="save">{{ t('action.save') }}</Button>
        <Button variant="ghost" @click="showForm = false">{{ t('action.cancel') }}</Button>
      </div>
    </Card>

    <p v-if="apps.list.length === 0" class="text-sm text-muted-foreground">{{ t('tracker.empty') }}</p>

    <!-- Kanban -->
    <div v-else class="grid gap-4 md:grid-cols-3 xl:grid-cols-5 items-start">
      <div v-for="col in columns" :key="col.status" class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ col.label }}</h2>
          <Badge variant="sample" class="text-[10px] tabular-nums">{{ col.items.length }}</Badge>
        </div>
        <div class="space-y-2">
          <Card v-for="app in col.items" :key="app.id" class="p-3 rounded-xl space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="font-bold text-sm text-foreground truncate">{{ app.company || '—' }}</div>
                <div class="text-xs text-muted-foreground truncate">{{ app.role }}</div>
              </div>
              <div class="flex gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" class="h-6 w-6" :aria-label="t('tracker.movePrev')" @click="move(app, -1)">
                  <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" class="h-6 w-6" :aria-label="t('tracker.moveNext')" @click="move(app, 1)">
                  <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div v-if="app.appliedAt" class="text-[11px] text-muted-foreground">{{ t('tracker.appliedAt') }}: {{ app.appliedAt }}</div>
            <div v-if="app.followUpAt" class="text-[11px]" :class="app.followUpAt <= new Date().toISOString().slice(0, 10) ? 'text-destructive font-semibold' : 'text-muted-foreground'">
              {{ t('tracker.followUpAt') }}: {{ app.followUpAt }}
            </div>
            <div v-if="app.resumeId && resumeTitle(app.resumeId)" class="text-[11px] text-secondary truncate">
              {{ resumeTitle(app.resumeId) }}
            </div>
            <div class="flex gap-1 pt-1">
              <Button variant="ghost" size="sm" class="h-7 text-[11px]" @click="startEdit(app)">{{ t('action.edit') }}</Button>
              <Button variant="ghost" size="sm" class="h-7 text-[11px] text-destructive" @click="remove(app)">{{ t('action.delete') }}</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
