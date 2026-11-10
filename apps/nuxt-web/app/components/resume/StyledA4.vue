<script setup lang="ts">
import { computed } from 'vue'
import A4Paper from '~/components/resume/A4Paper.vue'
import type { ResumeDoc } from '~/lib/storage/schema'

/**
 * Wrapper do preview que aplica o estilo por doc:
 * cor de destaque (CSS var local), escala de fonte, densidade e papel (A4/Letter).
 */

const props = defineProps<{
  doc: ResumeDoc
}>()

const ACCENTS: Record<string, string> = {
  '': '',           // accent do design system (padrão)
  blue: '#2563eb',
  green: '#16a34a',
  violet: '#7c3aed',
  rose: '#e11d48',
  orange: '#ea580c',
  teal: '#0d9488',
  red: '#dc2626',
  ink: '#1e1e24',
}

const accent = computed(() => {
  const key = props.doc.style?.accentColor ?? ''
  return ACCENTS[key] ?? ''
})

const fontPx = computed(() => {
  const scale = props.doc.style?.fontScale ?? 'normal'
  return scale === 'compact' ? '11px' : scale === 'large' ? '14px' : '12.5px'
})

const density = computed(() => {
  const d = props.doc.style?.density ?? 'normal'
  return d === 'compact' ? '0.85' : d === 'relaxed' ? '1.2' : '1'
})

const aspect = computed(() => (props.doc.style?.paper ?? 'a4') === 'letter' ? '8.5 / 11' : '210 / 297')
const footer = computed(() => props.doc.style?.footerText ?? '')
const iconTheme = computed(() => props.doc.style?.iconTheme ?? 'outline')
</script>

<template>
  <div
    class="styled-a4"
    :style="{
      '--doc-accent': accent || undefined,
      fontSize: fontPx,
      lineHeight: density,
    }"
  >
    <A4Paper :style="{ aspectRatio: aspect }">
      <div class="flex flex-col h-full">
        <div class="flex-1 min-h-0">
          <slot />
        </div>
        <div
          v-if="footer.trim()"
          class="no-print:contents pdf-footer shrink-0 pt-2 mt-2 border-t border-border text-center text-[9px] text-muted-foreground px-4"
        >{{ footer }}</div>
      </div>
    </A4Paper>
  </div>
</template>

<style scoped>
/* accentColor sobrescreve o accent só dentro da folha */
.styled-a4 :deep(.text-primary) { color: var(--doc-accent, hsl(var(--primary))); }
.styled-a4 :deep(.text-secondary) { color: var(--doc-accent, hsl(var(--secondary))); }
.styled-a4 :deep(.bg-primary) { background-color: var(--doc-accent, hsl(var(--primary))); }
.styled-a4 :deep(.bg-secondary) { background-color: var(--doc-accent, hsl(var(--secondary))); }
.styled-a4 :deep(.border-primary) { border-color: var(--doc-accent, hsl(var(--primary))); }
</style>
