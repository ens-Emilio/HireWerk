<script setup lang="ts">
import { Toaster } from 'vue-sonner'

useHead({
  htmlAttrs: { lang: 'pt-BR' },
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster position="top-right" />
  </div>
</template>
