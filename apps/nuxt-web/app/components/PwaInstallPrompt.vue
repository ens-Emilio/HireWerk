<script setup lang="ts">
import { Button } from '~/components/ui/button'

const { $pwa } = useNuxtApp()
const showPrompt = computed(() =>
  $pwa?.showInstallPrompt && !$pwa?.isPWAInstalled
)

function handleInstall() {
  $pwa?.install()
}

function handleDismiss() {
  $pwa?.cancelInstall()
}
</script>

<template>
  <div
    v-if="showPrompt"
    class="fixed bottom-4 left-4 right-4 z-50 rounded-xl bg-card border border-border shadow-xl p-4 flex items-center gap-3 md:max-w-sm md:left-auto md:right-4 transition-all animate-slide-up"
  >
    <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
      <Icon name="lucide:download" class="w-5 h-5" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm text-foreground">Instalar HireWerk</p>
      <p class="text-xs text-muted-foreground">Use offline, direto da sua tela inicial</p>
    </div>
    <Button
      size="sm"
      @click="handleInstall"
    >
      Instalar
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="shrink-0"
      @click="handleDismiss"
    >
      <Icon name="lucide:x" class="w-4 h-4" />
    </Button>
  </div>
</template>

<style scoped>
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>