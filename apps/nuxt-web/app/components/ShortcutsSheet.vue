/**
 * Painel de atalhos de teclado (v3) — aberto com "?" ou pelo rodapé da paleta.
 * Os atalhos já existiam no editor; faltava descobribilidade.
 */
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from '~/composables/useI18n'
import { Button } from '~/components/ui/button'

const { t } = useI18n()
const open = ref(false)

const groups = [
    {
        title: 'shortcuts.nav',
        items: [
            { keys: ['Ctrl', 'K'], label: 'shortcuts.palette' },
            { keys: ['?'], label: 'shortcuts.open' },
        ],
    },
    {
        title: 'shortcuts.editor',
        items: [
            { keys: ['Ctrl', 'S'], label: 'shortcuts.save' },
            { keys: ['Ctrl', 'Z'], label: 'shortcuts.undo' },
            { keys: ['Ctrl', 'Y'], label: 'shortcuts.redo' },
            { keys: ['Ctrl', 'F'], label: 'shortcuts.find' },
            { keys: ['Esc'], label: 'shortcuts.close' },
        ],
    },
]

function handleKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null
    const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    if (e.key === '?' && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        open.value = !open.value
    }
    if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => window.addEventListener('keydown', handleKey))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKey))
</script>

<template>
  <div
    v-if="open"
    class="no-print fixed inset-0 z-[115] bg-black/40 flex items-center justify-center p-4"
    @click.self="open = false"
  >
    <div
      class="w-full max-w-md bg-card border border-border-soft rounded-2xl shadow-raised p-6 space-y-5"
      role="dialog"
      aria-modal="true"
      :aria-label="t('shortcuts.title')"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-display text-lg font-bold text-foreground">{{ t('shortcuts.title') }}</h2>
        <Button variant="ghost" size="icon" class="h-8 w-8" :aria-label="t('action.close')" @click="open = false">
          <Icon name="lucide:x" class="w-4 h-4" />
        </Button>
      </div>

      <div v-for="group in groups" :key="group.title" class="space-y-2">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{{ t(group.title) }}</h3>
        <dl class="space-y-1.5">
          <div v-for="item in group.items" :key="item.label" class="flex items-center justify-between gap-4">
            <dt class="text-sm text-foreground">{{ t(item.label) }}</dt>
            <dd class="flex gap-1 shrink-0">
              <kbd
                v-for="key in item.keys"
                :key="key"
                class="text-[10px] font-bold text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-surface"
              >{{ key }}</kbd>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
