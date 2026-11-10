<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const cardClass = computed(() =>
  cn('rounded-lg border border-border-soft bg-card text-card-foreground shadow-ring', props.class),
)
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>