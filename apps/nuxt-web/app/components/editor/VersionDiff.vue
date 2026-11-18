/**
 * Diff visual entre duas versões do currículo (v3).
 * Usa o diff estruturado de `lib/versioning/diff.ts` — campo a campo, com rótulo.
 */
<script setup lang="ts">
import { computed } from 'vue'
import { diffResumeData } from '~/lib/versioning/diff'
import { useI18n } from '~/composables/useI18n'
import type { VersionSnapshot } from '~/lib/storage/schema'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
    /** Versão mais antiga (base) */
    before: VersionSnapshot
    /** Versão mais nova (alvo) */
    after: VersionSnapshot
}>()

const { t } = useI18n()
const changes = computed(() => diffResumeData(props.before.data, props.after.data))
const summary = computed(() => {
  const n = changes.value.length
  return n === 0 ? t('diff.none') : n === 1 ? '1 campo alterado' : `${n} campos alterados`
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <Badge variant="sample" class="text-[10px] tabular-nums">v{{ before.version }} → v{{ after.version }}</Badge>
      <span class="text-xs text-muted-foreground">{{ summary }}</span>
    </div>

    <p v-if="changes.length === 0" class="text-xs text-muted-foreground">
      {{ t('diff.none') }}
    </p>

    <ul v-else class="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
      <li
        v-for="change in changes"
        :key="change.path"
        class="rounded-lg border border-border-soft bg-surface/60 px-3 py-2 text-xs"
      >
        <div class="font-bold text-foreground">{{ change.label }}</div>
        <div class="mt-1 grid gap-0.5">
          <div v-if="change.before" class="text-destructive line-through decoration-destructive/40 break-words">
            {{ change.before }}
          </div>
          <div v-if="change.after" class="text-success break-words">
            {{ change.after }}
          </div>
          <div v-if="!change.before && !change.after" class="text-muted-foreground">(vazio)</div>
        </div>
      </li>
    </ul>
  </div>
</template>
