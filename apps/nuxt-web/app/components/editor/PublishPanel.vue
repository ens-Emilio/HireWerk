/**
 * Links curtos e publicação pública (v3) — usa os endpoints que já existiam
 * no Worker mas não tinham UI.
 */
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { useI18n } from '~/composables/useI18n'
import { useSyncStore } from '~/stores/sync'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { generateShareLink } from '~/lib/export/share'
import { shortenLink, publishDoc, unpublishDoc, shareStats, listShares, removeShare, type ShareRecord } from '~/lib/api'
import type { ResumeDoc } from '~/lib/storage/schema'

const props = defineProps<{ doc: ResumeDoc }>()
const { t } = useI18n()
const syncStore = useSyncStore()

const shares = ref<ShareRecord[]>([])
const busy = ref<'short' | 'publish' | null>(null)
const publishDays = ref<'never' | '7' | '30'>('never')
const stats = ref<Record<string, { opens: number; lastOpenedAt: string | null }>>({})

const myShares = computed(() => shares.value.filter(s => s.resumeId === props.doc.id))
const canUseApi = computed(() => syncStore.hasAccount)

function refresh() {
  shares.value = listShares()
}

onMounted(async () => {
  refresh()
  for (const s of myShares.value.filter(s => s.kind === 'short')) {
    const st = await shareStats(s.id)
    if (st) stats.value = { ...stats.value, [s.id]: st }
  }
})

async function handleShorten() {
  if (!canUseApi.value) { toast.error(t('publish.needsAccount')); return }
  busy.value = 'short'
  const record = await shortenLink(generateShareLink(props.doc), props.doc.id, props.doc.title)
  busy.value = null
  if (!record) { toast.error(t('short.fail')); return }
  refresh()
  await navigator.clipboard.writeText(record.url)
  toast.success(t('short.done'))
}

async function handlePublish() {
  if (!canUseApi.value) { toast.error(t('publish.needsAccount')); return }
  busy.value = 'publish'
  const record = await publishDoc(
    props.doc,
    props.doc.id,
    props.doc.title,
    publishDays.value === 'never' ? undefined : Number(publishDays.value),
  )
  busy.value = null
  if (!record) { toast.error(t('publish.fail')); return }
  refresh()
  await navigator.clipboard.writeText(record.url)
  toast.success(t('publish.done'))
}

async function handleRevoke(record: ShareRecord) {
  const ok = await unpublishDoc(record.id)
  if (!ok) { toast.error(t('publish.fail')); return }
  removeShare(record.id)
  refresh()
  toast.success(t('publish.revoked'))
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs text-muted-foreground">
      {{ canUseApi ? t('publish.hint') : t('publish.needsAccount') }}
    </p>

    <div class="grid sm:grid-cols-2 gap-3">
      <div class="space-y-2">
        <Button variant="outline" class="w-full" :disabled="busy === 'short' || !canUseApi" @click="handleShorten">
          <Icon name="lucide:link" class="w-4 h-4 mr-2" />
          {{ t('short.cta') }}
        </Button>
        <p class="text-[11px] text-muted-foreground">{{ t('short.hint') }}</p>
      </div>

      <div class="space-y-2">
        <Button class="w-full" :disabled="busy === 'publish' || !canUseApi" @click="handlePublish">
          <Icon name="lucide:globe" class="w-4 h-4 mr-2" />
          {{ t('publish.cta') }}
        </Button>
        <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
          {{ t('publish.expires') }}
          <select v-model="publishDays" class="h-7 rounded border border-input bg-card px-1.5 text-[11px]">
            <option value="never">{{ t('publish.never') }}</option>
            <option value="7">7</option>
            <option value="30">30</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="myShares.length" class="divide-y divide-border-soft rounded-lg border border-border-soft">
      <div v-for="s in myShares" :key="s.id" class="flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs">
        <Badge :variant="s.kind === 'publish' ? 'success' : 'sample'" class="text-[10px]">
          {{ s.kind === 'publish' ? t('publish.done') : t('short.title') }}
        </Badge>
        <a :href="s.url" target="_blank" rel="noopener noreferrer" class="text-secondary underline break-all flex-1 min-w-[140px]">{{ s.url }}</a>
        <span v-if="stats[s.id]" class="text-muted-foreground tabular-nums">
          {{ t('short.opens', { n: stats[s.id]!.opens }) }}
        </span>
        <span v-else-if="s.kind === 'short'" class="text-muted-foreground">{{ t('short.never') }}</span>
        <Button v-if="s.kind === 'publish'" variant="ghost" size="sm" class="h-7 text-destructive" @click="handleRevoke(s)">
          {{ t('publish.revoke') }}
        </Button>
      </div>
    </div>
    <p v-else class="text-[11px] text-muted-foreground">{{ t('shares.empty') }}</p>
  </div>
</template>
