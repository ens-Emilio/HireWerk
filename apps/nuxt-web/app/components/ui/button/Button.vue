<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { Slot } from 'radix-vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold active:translate-y-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Ação primária: amarelo, único accent de clique
        default: 'bg-primary text-primary-foreground hover:bg-accent-hover',
        // Ação de apoio: azul (links, "Ver como funciona")
        blue: 'bg-secondary text-secondary-foreground hover:brightness-110',
        destructive: 'bg-destructive-soft text-destructive hover:bg-destructive/10',
        outline: 'border border-input bg-card text-foreground hover:border-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-surface hover:text-foreground',
        link: 'text-secondary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-md px-3 text-[13px]',
        lg: 'h-12 rounded-md px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  variant?: NonNullable<ButtonVariants['variant']>
  size?: NonNullable<ButtonVariants['size']>
  as?: string
  // Quando o filho é um componente (NuxtLink), aplica as variantes no elemento renderizado
  asChild?: boolean
  class?: HTMLAttributes['class']
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  as: 'button',
  asChild: false,
})

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
)

const delegateProps = computed(() => {
  const base: Record<string, unknown> = { class: classes.value }
  if (props.disabled !== undefined) base.disabled = props.disabled
  return base
})
</script>

<template>
  <!-- asChild: mescla classes/attrs no elemento-filho (NuxtLink, a, etc.) via Slot do radix-vue -->
  <Slot v-if="asChild" v-bind="delegateProps">
    <slot />
  </Slot>
  <component v-else :is="as" v-bind="delegateProps">
    <slot />
  </component>
</template>
