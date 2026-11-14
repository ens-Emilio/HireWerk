<script setup lang="ts">
import type { CSSProperties } from 'vue'

interface Props {
  class?: string
  style?: CSSProperties
}

defineProps<Props>()
</script>

<template>
  <div class="a4-page shadow-2xl shadow-black/10 border border-black/5" :class="class" :style="style">
    <slot />
  </div>
</template>

<style scoped>
.a4-page {
  background: white;
  color: #1a1a1a;
  /* a folha imprime em branco: tokens de texto no papel travam nos valores do
     light, senão o dark inverte muted-foreground e some na folha branca */
  --muted-foreground: 244 6% 44%;
  box-sizing: border-box;
}
</style>
