<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const contentClass = computed(() => cn('p-6 pt-0', props.class))
</script>

<template>
  <div :class="contentClass">
    <slot />
  </div>
</template>