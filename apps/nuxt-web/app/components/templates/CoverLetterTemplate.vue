<script setup lang="ts">
/**
 * Render da carta de apresentação na folha A4 (v3).
 * Mesma tipografia do currículo, mas em formato de carta.
 */
import { computed } from 'vue'
import type { ResumeDoc } from '~/lib/storage/schema'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
const props = defineProps<{ doc: ResumeDoc }>()

const d = computed(() => props.doc.data)
const letter = computed(() => props.doc.coverLetter)
const paragraphs = computed(() =>
  letter.value.body.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
)
const contacts = computed(() =>
  [
    ...d.value.emails.map(e => e.value),
    ...d.value.phones.map(p => p.value),
    ...d.value.links.filter(l => l.url).map(l => l.url),
  ].filter(Boolean)
)
</script>

<template>
  <div class="text-foreground flex flex-col h-full">
    <header class="border-b border-border pb-3">
      <div class="text-2xl font-semibold leading-tight">{{ d.name || 'Seu nome' }}</div>
      <div v-if="d.headline" class="text-xs text-muted-foreground mt-0.5">{{ d.headline }}</div>
      <div v-if="contacts.length" class="text-[10px] text-muted-foreground mt-1.5 break-all">
        {{ contacts.join(' · ') }}
      </div>
    </header>

    <div class="mt-4 text-[11px] text-muted-foreground">
      <div v-if="letter.company">{{ letter.company }}</div>
      <div v-if="letter.role">Ref.: {{ letter.role }}</div>
      <div>{{ new Date().toLocaleDateString('pt-BR') }}</div>
    </div>

    <div class="mt-4 space-y-3 text-[12px] leading-relaxed">
      <p v-for="(p, i) in paragraphs" :key="i" class="whitespace-pre-wrap">{{ p }}</p>
      <p v-if="paragraphs.length === 0" class="text-muted-foreground italic">
        {{ t('cover.emptyBody') }}
      </p>
    </div>
  </div>
</template>
