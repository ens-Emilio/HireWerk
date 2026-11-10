<script setup lang="ts">
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

// Changelog do app (F5 #78)
const CHANGELOG = [
  {
    version: '2.0.0',
    date: '2026',
    items: [
      '5 novos modelos de currículo (Clássico, Minimalista, Moderno, Executivo, Criativo)',
      'Seções de Projetos, Certificações, Idiomas, Links e Voluntariado',
      'Cor de destaque, tamanho de fonte, densidade e papel (A4/Letter) por currículo',
      'Histórico de versões com nomes e restauração pontual',
      'Exportação em PDF, JSON, TXT, DOCX e PNG',
      'Backup completo e restauração entre aparelhos',
      'Busca, tags, favoritos e ordenação na lista',
      'Checklist de qualidade e % de completude',
    ],
  },
  {
    version: '1.0.0',
    date: '2026',
    items: [
      'Editor com preview em tempo real',
      'Versões automáticas (desfazer/refazer)',
      'Lixeira com restauração',
      'Link de compartilhamento sem servidor',
      'Funciona offline (PWA)',
    ],
  },
]
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-10">
    <div>
      <h1 class="font-display text-3xl font-bold text-foreground">Sobre o HireWerk</h1>
      <p class="text-muted-foreground mt-1 text-sm">O que mudou, o que vem por aí, e por que este app é diferente.</p>
    </div>

    <Card class="p-6 rounded-2xl space-y-2">
      <h2 class="font-display text-lg font-bold text-foreground">100% no seu aparelho</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Não existe servidor. Seus currículos ficam guardados apenas no seu navegador — invisíveis para
        qualquer outra pessoa, inclusive para nós. Funciona offline e não pede cadastro.
      </p>
    </Card>

    <div class="space-y-8">
      <div v-for="release in CHANGELOG" :key="release.version" class="space-y-3">
        <div class="flex items-baseline gap-3">
          <h2 class="font-display text-xl font-bold text-foreground">Versão {{ release.version }}</h2>
          <span class="text-xs text-muted-foreground">{{ release.date }}</span>
        </div>
        <ul class="space-y-1.5">
          <li v-for="(item, i) in release.items" :key="i" class="flex gap-2 text-sm text-muted-foreground">
            <Icon name="lucide:check" class="w-4 h-4 text-success shrink-0 mt-0.5" />
            {{ item }}
          </li>
        </ul>
      </div>
    </div>

    <Card class="p-6 rounded-2xl space-y-3">
      <h2 class="font-display text-lg font-bold text-foreground">Feito por</h2>
      <a
        href="https://github.com/ens-Emilio"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 text-sm text-secondary hover:underline"
      >
        <Icon name="lucide:github" class="w-4 h-4" />
        ens-Emilio
      </a>
      <div class="pt-2">
        <Button variant="outline" as-child>
          <NuxtLink to="/dashboard">Voltar ao painel</NuxtLink>
        </Button>
      </div>
    </Card>
  </div>
</template>
