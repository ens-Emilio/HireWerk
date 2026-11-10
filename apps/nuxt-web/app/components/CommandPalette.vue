<script setup lang="ts">
/**
 * Command palette (F5 #80): Ctrl+K — navegar, criar, exportar.
 * ponytail: keyboard-first, sem dependências; foco em ações globais principais.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useResumeStore } from '~/stores/resume'

const open = ref(false)
const query = ref('')
const selected = ref(0)
const router = useRouter()
const store = useResumeStore()

interface Command {
  id: string
  label: string
  hint: string
  icon: string
  action: () => void
}

const commands = computed<Command[]>(() => {
  const nav: Command[] = [
    { id: 'nav-dashboard', label: 'Ir para o Painel', hint: 'navegar', icon: 'lucide:layout-dashboard', action: () => router.push('/dashboard') },
    { id: 'nav-resumes', label: 'Meus currículos', hint: 'navegar', icon: 'lucide:file-text', action: () => router.push('/resumes') },
    { id: 'nav-templates', label: 'Modelos', hint: 'navegar', icon: 'lucide:palette', action: () => router.push('/templates') },
    { id: 'nav-settings', label: 'Configurações', hint: 'navegar', icon: 'lucide:settings', action: () => router.push('/settings') },
    { id: 'nav-about', label: 'Sobre o HireWerk', hint: 'navegar', icon: 'lucide:info', action: () => router.push('/about') },
    { id: 'new', label: 'Criar novo currículo', hint: 'ação', icon: 'lucide:plus', action: () => { const d = store.createResume(); router.push(`/resumes/${d.id}`) } },
  ]

  const resumes: Command[] = store.index
    .filter(r => !r.deletedAt)
    .slice(0, 8)
    .map(r => ({
      id: `resume-${r.id}`,
      label: r.title,
      hint: 'currículo',
      icon: 'lucide:file-text',
      action: () => router.push(`/resumes/${r.id}`),
    }))

  const all = [...nav, ...resumes]
  const q = query.value.trim().toLowerCase()
  if (!q) return all
  return all.filter(c => c.label.toLowerCase().includes(q))
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
          placeholder="Digite um comando ou busque um currículo..."
          class="flex-1 h-12 bg-transparent outline-none text-sm"
          aria-label="Busca de comandos"
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
          Nenhum resultado.
        </p>
      </div>
      <div class="px-4 py-2 border-t border-border-soft flex items-center gap-3 text-[10px] text-muted-foreground">
        <span><kbd class="font-bold">↑↓</kbd> navegar</span>
        <span><kbd class="font-bold">enter</kbd> executar</span>
        <span class="ml-auto">Ctrl+K</span>
      </div>
    </div>
  </div>
</template>
