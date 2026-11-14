/**
 * Aviso de quota do localStorage (v3).
 *
 * `writeJson` já lançava em QuotaExceededError, mas ninguém mostrava nada — o
 * save falhava em silêncio. Aqui o app avisa antes (80%) e depois (cheio).
 */
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useResumeStore } from '~/stores/resume'
import { useI18n } from '~/composables/useI18n'
import { LOCALSTORAGE_QUOTA_BYTES } from '~/lib/storage/keys'
import { Button } from '~/components/ui/button'

const store = useResumeStore()
const { t } = useI18n()
const dismissed = ref(false)
const full = ref(false)

const pct = computed(() => Math.min(100, Math.round((store.estimateUsage() / LOCALSTORAGE_QUOTA_BYTES) * 100)))
const threshold = computed(() => store.settings?.quotaWarnPct ?? 80)
const visible = computed(() => !dismissed.value && (full.value || pct.value >= threshold.value))

function onQuotaError(e: Event) {
  const detail = (e as CustomEvent<{ message?: string }>).detail
  if (detail?.message) full.value = true
}

onMounted(() => window.addEventListener('hirewerk:quota', onQuotaError))
onBeforeUnmount(() => window.removeEventListener('hirewerk:quota', onQuotaError))
</script>

<template>
  <div
    v-if="visible"
    class="no-print mb-6 rounded-xl border px-4 py-3 flex flex-wrap items-center gap-3 text-sm"
    :class="full ? 'border-destructive/40 bg-destructive-soft text-destructive' : 'border-primary/30 bg-primary/10 text-foreground'"
    role="alert"
  >
    <Icon :name="full ? 'lucide:alert-octagon' : 'lucide:hard-drive'" class="w-4 h-4 shrink-0" />
    <span class="flex-1 min-w-[200px]">
      {{ full ? t('quota.full') : t('quota.warn', { pct }) }}
    </span>
    <Button variant="outline" size="sm" as-child>
      <NuxtLink to="/settings">{{ t('settings.backup') }}</NuxtLink>
    </Button>
    <Button variant="ghost" size="sm" :aria-label="t('action.close')" @click="dismissed = true">
      <Icon name="lucide:x" class="w-4 h-4" />
    </Button>
  </div>
</template>
