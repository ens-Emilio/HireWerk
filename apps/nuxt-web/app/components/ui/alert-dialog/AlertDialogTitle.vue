<script setup lang="ts">
import { DialogTitle as RadixDialogTitle } from 'radix-vue'
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const classes = computed(() => cn('text-lg font-semibold', props.class))
</script>

<template>
  <RadixDialogTitle :class="classes">
    <slot />
  </RadixDialogTitle>
</template>