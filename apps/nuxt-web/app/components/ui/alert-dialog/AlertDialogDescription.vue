<script setup lang="ts">
import { DialogDescription as RadixDialogDescription } from 'radix-vue'
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const classes = computed(() => cn('text-sm text-muted-foreground', props.class))
</script>

<template>
  <RadixDialogDescription :class="classes">
    <slot />
  </RadixDialogDescription>
</template>