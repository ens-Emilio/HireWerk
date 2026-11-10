<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'symbol' | 'lockup'
  size?: number
}>(), {
  variant: 'symbol',
  size: 30,
})
</script>

<template>
  <img
    v-if="variant === 'lockup'"
    src="/logo-hirewerk-lockup.svg"
    alt="HireWerk"
    :width="size * 3.3"
    :height="size"
  />
  <img
    v-else
    src="/logo-hirewerk.svg"
    alt=""
    :width="size"
    :height="size"
    class="rounded-lg"
  />
</template>
