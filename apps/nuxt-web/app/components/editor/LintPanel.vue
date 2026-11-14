<script setup lang="ts">
/**
 * Painel do linter de escrita (v3) — achados clicáveis, agrupados por severidade.
 */
import { computed } from 'vue'
import { useI18n } from '~/composables/useI18n'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { LintFinding } from '~/lib/lint'

const props = defineProps<{ findings: LintFinding[] }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const warns = computed(() => props.findings.filter(f => f.severity === 'warn'))
const infos = computed(() => props.findings.filter(f => f.severity === 'info'))
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-display text-base font-bold text-foreground">{{ t('lint.title') }}</h3>
        <p class="text-xs text-muted-foreground">{{ t('lint.subtitle') }}</p>
      </div>
      <Button variant="ghost" size="icon" class="h-8 w-8" :aria-label="t('action.close')" @click="emit('close')">
        <Icon name="lucide:x" class="w-4 h-4" />
      </Button>
    </div>

    <p v-if="findings.length === 0" class="text-sm text-success flex items-center gap-2">
      <Icon name="lucide:check-circle-2" class="w-4 h-4" />
      {{ t('lint.clean') }}
    </p>

    <div v-else class="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
      <div v-if="warns.length" class="space-y-2">
        <p class="text-[11px] font-bold uppercase tracking-wider text-destructive">
          {{ t('lint.important') }} ({{ warns.length }})
        </p>
        <div v-for="f in warns" :key="f.id" class="rounded-lg border border-destructive/25 bg-destructive-soft/50 px-3 py-2">
          <div class="flex items-center gap-2">
            <Badge variant="destructive" class="text-[10px]">{{ f.where }}</Badge>
          </div>
          <p class="text-xs text-foreground mt-1">{{ f.message }}</p>
          <p class="text-[11px] text-muted-foreground mt-1 italic truncate">{{ f.excerpt }}</p>
        </div>
      </div>

      <div v-if="infos.length" class="space-y-2">
        <p class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {{ t('lint.suggestions') }} ({{ infos.length }})
        </p>
        <div v-for="f in infos" :key="f.id" class="rounded-lg border border-border-soft bg-surface/60 px-3 py-2">
          <div class="flex items-center gap-2">
            <Badge variant="sample" class="text-[10px]">{{ f.where }}</Badge>
          </div>
          <p class="text-xs text-foreground mt-1">{{ f.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
