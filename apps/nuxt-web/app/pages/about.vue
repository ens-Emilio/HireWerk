<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { useI18n } from '~/composables/useI18n'

const { t, locale } = useI18n()

// Changelog do app (F5 #78) — conteúdo por idioma, não só rótulos
const CHANGELOG_PT = [
  {
    version: '3.0.0',
    date: '2026',
    items: [
      'Carta de apresentação com rascunho gerado localmente',
      'Tracker de candidaturas com follow-ups',
      'Histórico de análises ATS e sugestões de tailoring',
      'Criptografia opcional no aparelho (AES-GCM)',
      'Import/export no padrão JSON Resume',
      'Diff campo a campo entre versões',
      'Revisão de escrita e contagem de páginas A4',
      'Publicação pública revogável e links curtos com métricas',
    ],
  },
  {
    version: '2.0.0',
    date: '2026',
    items: [
      '5 modelos de currículo (Clássico, Minimalista, Moderno, Executivo, Criativo)',
      'Seções de Projetos, Certificações, Idiomas, Links e Voluntariado',
      'Cor de destaque, tamanho de fonte, densidade e papel por currículo',
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

const CHANGELOG_EN = [
  {
    version: '3.0.0',
    date: '2026',
    items: [
      'Cover letter with a locally generated draft',
      'Application tracker with follow-ups',
      'ATS analysis history and tailoring suggestions',
      'Optional on-device encryption (AES-GCM)',
      'JSON Resume import/export',
      'Field-by-field diff between versions',
      'Writing review and A4 page count',
      'Revocable public publishing and short links with metrics',
    ],
  },
  {
    version: '2.0.0',
    date: '2026',
    items: [
      '5 résumé templates (Classic, Minimal, Modern, Executive, Creative)',
      'Projects, Certifications, Languages, Links and Volunteering sections',
      'Accent color, font size, density and paper per résumé',
      'Version history with names and point restore',
      'Export to PDF, JSON, TXT, DOCX and PNG',
      'Full backup and restore across devices',
      'Search, tags, pins and sorting in the list',
      'Quality checklist and completeness %',
    ],
  },
  {
    version: '1.0.0',
    date: '2026',
    items: [
      'Editor with live preview',
      'Automatic versions (undo/redo)',
      'Trash with restore',
      'Serverless share link',
      'Works offline (PWA)',
    ],
  },
]

const CHANGELOG = computed(() => locale.value === 'en-US' ? CHANGELOG_EN : CHANGELOG_PT)
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-10">
    <div>
      <h1 class="font-display text-3xl font-bold text-foreground">{{ t('about.title') }}</h1>
      <p class="text-muted-foreground mt-1 text-sm">{{ t('about.subtitle') }}</p>
    </div>

    <Card class="p-6 rounded-2xl space-y-2">
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('about.privacy') }}</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        {{ t('about.privacyBody') }}
        <NuxtLink to="/privacy" class="underline underline-offset-2">{{ t('about.privacyLink') }}</NuxtLink>.
      </p>
    </Card>

    <div class="space-y-8">
      <div v-for="release in CHANGELOG" :key="release.version" class="space-y-3">
        <div class="flex items-baseline gap-3">
          <h2 class="font-display text-xl font-bold text-foreground">{{ t('about.changelog', { v: release.version }) }}</h2>
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
      <h2 class="font-display text-lg font-bold text-foreground">{{ t('about.madeBy') }}</h2>
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
          <NuxtLink to="/dashboard">{{ t('about.backToDashboard') }}</NuxtLink>
        </Button>
      </div>
    </Card>
  </div>
</template>
