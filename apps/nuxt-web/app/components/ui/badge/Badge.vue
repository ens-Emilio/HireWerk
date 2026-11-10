<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        // "Salvo" no editor
        success: 'border-transparent bg-success-soft text-success',
        // "Salvando…" e tags de amostra
        sample: 'border-transparent bg-surface text-foreground',
        destructive: 'border-transparent bg-destructive-soft text-destructive',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeVariants = VariantProps<typeof badgeVariants>

const props = defineProps<{
  variant?: NonNullable<BadgeVariants['variant']>
  class?: HTMLAttributes['class']
}>()

const classes = computed(() =>
  cn(badgeVariants({ variant: props.variant }), props.class),
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>