<script setup lang="ts">
/**
 * F8: banner de atualização do SW + banner offline (PWA)
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Button } from '~/components/ui/button'

const needRefresh = ref(false)
const offline = ref(false)
let registration: ServiceWorkerRegistration | null = null

async function reloadForUpdate() {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }
}

function handleOnline() { offline.value = false }
function handleOffline() { offline.value = true }

onMounted(async () => {
  offline.value = !navigator.onLine
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  if ('serviceWorker' in navigator) {
    registration = await navigator.serviceWorker.getRegistration() ?? null
    if (registration) {
      registration.addEventListener('updatefound', () => {
        const installing = registration!.installing
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            needRefresh.value = true
          }
        })
      })
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <!-- Update disponível -->
  <div v-if="needRefresh" class="no-print fixed top-16 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 bg-foreground text-background rounded-xl px-4 py-3 shadow-raised">
    <Icon name="lucide:refresh-cw" class="w-4 h-4 shrink-0" />
    <span class="text-sm font-semibold">Nova versão disponível</span>
    <Button size="sm" variant="blue" @click="reloadForUpdate">Recarregar</Button>
  </div>

  <!-- Offline -->
  <div v-if="offline" class="no-print fixed top-16 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5 shadow-raised">
    <Icon name="lucide:wifi-off" class="w-4 h-4 text-muted-foreground shrink-0" />
    <span class="text-sm text-muted-foreground">Você está offline — tudo continua funcionando normalmente.</span>
  </div>
</template>
