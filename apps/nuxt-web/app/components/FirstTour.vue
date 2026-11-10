<script setup lang="ts">
/**
 * Tour de primeira visita (F5 #79) — 3 dicas, dismissível, localStorage.
 */
import { ref, onMounted } from 'vue'
import { Button } from '~/components/ui/button'

const STORAGE_KEY = 'hirewerk:tour-done'

const visible = ref(false)
const step = ref(0)

const STEPS = [
  {
    title: 'Bem-vindo ao HireWerk!',
    text: 'Um construtor de currículos que funciona inteiro no seu aparelho. Sem cadastro, sem servidor, sem custo.',
    icon: 'lucide:sparkles',
  },
  {
    title: 'Tudo salvo sozinho',
    text: 'Enquanto você escreve, cada versão anterior é guardada. Errou? Desfaça — mesmo depois de fechar a página.',
    icon: 'lucide:history',
  },
  {
    title: 'Compartilhe um link bonito',
    text: 'No editor, o botão "Compartilhar" cria um link que abre seu currículo em qualquer aparelho.',
    icon: 'lucide:share-2',
  },
]

onMounted(() => {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) visible.value = true
  } catch {
    visible.value = false
  }
})

function next() {
  if (step.value < STEPS.length - 1) {
    step.value++
  } else {
    finish()
  }
}

function finish() {
  visible.value = false
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* storage bloqueado: só não persiste */ }
}
</script>

<template>
  <div v-if="visible" class="no-print fixed bottom-4 left-4 right-4 z-[100] flex justify-center md:justify-end md:right-6 md:bottom-6">
    <div class="w-full max-w-sm bg-card border border-border-soft rounded-2xl shadow-raised p-5 space-y-3">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-primary/15 rounded-xl grid place-items-center text-foreground shrink-0">
          <Icon :name="STEPS[step]!.icon" class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <h3 class="font-display font-bold text-foreground">{{ STEPS[step]!.title }}</h3>
          <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ STEPS[step]!.text }}</p>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex gap-1.5">
          <span
            v-for="(_, i) in STEPS"
            :key="i"
            class="w-2 h-2 rounded-full transition-colors"
            :class="i === step ? 'bg-primary' : 'bg-border'"
          />
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" @click="finish">Pular</Button>
          <Button size="sm" @click="next">{{ step < STEPS.length - 1 ? 'Próximo' : 'Começar' }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>
