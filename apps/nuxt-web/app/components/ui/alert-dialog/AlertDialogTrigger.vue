<script setup lang="ts">
import { DialogTrigger as RadixDialogTrigger } from 'radix-vue'
</script>

<template>
  <RadixDialogTrigger as-child>
    <slot />
  </RadixDialogTrigger>
</template>