<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  type?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (val !== undefined) emit('update:modelValue', val)
  },
})
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn(
      'flex h-[46px] w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-secondary disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    :type="type"
  />
</template>