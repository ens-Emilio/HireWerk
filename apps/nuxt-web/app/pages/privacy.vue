<script setup lang="ts">
/**
 * Política de privacidade — texto bilíngue.
 *
 * É um documento jurídico: o conteúdo muda inteiro com o idioma, não só os
 * rótulos. Fica como estrutura de dados (título + parágrafos + listas) em vez de
 * dezenas de chaves soltas, para o texto continuar legível no código.
 */
import { computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { useI18n } from '~/composables/useI18n'

const { t, locale } = useI18n()

interface Section {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

const PT = {
  title: 'Privacidade',
  updated: 'Atualizado em 11/2026 · vale para o app e para os links compartilhados.',
  highlightTitle: 'O padrão: nada sai do seu aparelho',
  highlightBody:
    'O HireWerk funciona 100% offline por padrão. Seus currículos vivem no armazenamento local do seu navegador (localStorage), no seu aparelho. Sem cadastro, sem servidor de dados, sem telemetria, sem cookies de rastreamento. Se você nunca ativar a sincronização, nenhum dado seu chega a qualquer servidor — ponto.',
  sections: [
    {
      title: 'Sincronização entre aparelhos (opcional)',
      paragraphs: [
        'Se você escolher criar uma conta de sincronização nas Configurações, seus currículos são cifrados no seu aparelho (AES-GCM, com chave derivada da sua frase-senha) antes de sair dele. O servidor guarda apenas blobs cifrados que ele mesmo não consegue ler — nem nós, nem quem administra o servidor, nem quem o comprometer.',
      ],
      bullets: [
        'A frase-senha nunca sai do seu aparelho e não há recuperação: se você a perder, os blobs cifrados são irrecuperáveis (e inúteis para qualquer um).',
        'O servidor vê: um identificador de conta, timestamps e blobs opacos. Nada mais.',
        'Remover a conta nas Configurações apaga todos os blobs do servidor em uma operação (LGPD/GDPR: direito de eliminação).',
        'Seus currículos locais continuam intactos no aparelho, sempre.',
      ],
    },
    {
      title: 'Links compartilhados',
      paragraphs: [
        'Links com senha e links simples funcionam sem servidor: todo o conteúdo do currículo viaja dentro do próprio link (comprimido e, no caso de senha, cifrado). Ninguém registra quem abriu.',
        'Se você usar um link encurtado (recurso opcional para quem tem conta), o servidor registra apenas quantas vezes o link foi aberto e a data da última abertura — agregado, sem IP, sem fingerprint, sem cookie. É o único rastro que existe, e só existe porque você pediu o encurtamento.',
      ],
    },
    {
      title: 'Currículos publicados',
      paragraphs: [
        'Publicar um currículo em página pública (/p/…) é um ato explícito e revogável: o conteúdo vai para o servidor em texto claro porque o objetivo é ser lido (por pessoas e ATS), e você pode removê-lo a qualquer momento nas Configurações. Só publique o que você quer público.',
      ],
    },
    {
      title: 'O que nunca fazemos',
      paragraphs: [],
      bullets: [
        'Vender, alugar ou compartilhar dados com terceiros — não temos dados para isso.',
        'Telemetria automática, pixels de rastreamento ou perfis de uso.',
        'Leitura dos seus currículos: a criptografia de sync é de ponta a ponta, feita no seu aparelho.',
      ],
    },
    {
      title: 'Seus direitos (LGPD)',
      paragraphs: [
        'Como não coletamos dados identificáveis no modo padrão, não há o que acessar ou corrigir. No modo sync, você tem controle total: portabilidade (export JSON/ZIP a qualquer momento, inclusive do próprio app offline), eliminação (excluir conta apaga tudo do servidor imediatamente) e revogação de consentimento (desative o sync e volte ao modo offline pleno).',
      ],
    },
  ] as Section[],
  back: '← Voltar ao início',
  syncSettings: 'Configurações de sync',
  seoTitle: 'Privacidade — HireWerk',
  seoDesc: 'Como o HireWerk trata seus dados: offline por padrão, cifrado de ponta a ponta no sync opcional.',
}

const EN = {
  title: 'Privacy',
  updated: 'Updated 11/2026 · applies to the app and to shared links.',
  highlightTitle: 'The default: nothing leaves your device',
  highlightBody:
    'HireWerk runs 100% offline by default. Your résumés live in your browser local storage (localStorage), on your device. No sign-up, no data server, no telemetry, no tracking cookies. If you never enable sync, none of your data reaches any server — period.',
  sections: [
    {
      title: 'Cross-device sync (optional)',
      paragraphs: [
        'If you choose to create a sync account in Settings, your résumés are encrypted on your device (AES-GCM, key derived from your passphrase) before leaving it. The server stores only encrypted blobs it cannot read itself — not us, not whoever runs the server, not whoever compromises it.',
      ],
      bullets: [
        'The passphrase never leaves your device and there is no recovery: if you lose it, the encrypted blobs are unrecoverable (and useless to anyone).',
        'What the server sees: an account identifier, timestamps and opaque blobs. Nothing else.',
        'Deleting the account in Settings wipes every blob from the server in one operation (GDPR/LGPD: right to erasure).',
        'Your local résumés stay intact on the device, always.',
      ],
    },
    {
      title: 'Shared links',
      paragraphs: [
        'Password links and plain links work without a server: the whole résumé travels inside the link itself (compressed and, for password links, encrypted). Nobody records who opened it.',
        'If you use a shortened link (optional, requires an account), the server records only how many times the link was opened and when it was last opened — aggregate, no IP, no fingerprint, no cookie. That is the only trace that exists, and it exists only because you asked for shortening.',
      ],
    },
    {
      title: 'Published résumés',
      paragraphs: [
        'Publishing a résumé to a public page (/p/…) is an explicit, revocable act: the content goes to the server in plain text because the goal is to be read (by people and ATS), and you can remove it at any time in Settings. Only publish what you want public.',
      ],
    },
    {
      title: 'What we never do',
      paragraphs: [],
      bullets: [
        'Sell, rent or share data with third parties — we have no data to do that with.',
        'Automatic telemetry, tracking pixels or usage profiles.',
        'Read your résumés: sync encryption is end-to-end, performed on your device.',
      ],
    },
    {
      title: 'Your rights (GDPR)',
      paragraphs: [
        'Since we do not collect identifiable data in the default mode, there is nothing to access or correct. In sync mode you have full control: portability (export JSON/ZIP at any time, even from the offline app), erasure (deleting the account wipes everything from the server immediately) and withdrawal of consent (turn sync off and return to fully offline mode).',
      ],
    },
  ] as Section[],
  back: '← Back to home',
  syncSettings: 'Sync settings',
  seoTitle: 'Privacy — HireWerk',
  seoDesc: 'How HireWerk handles your data: offline by default, end-to-end encrypted on optional sync.',
}

const copy = computed(() => (locale.value === 'en-US' ? EN : PT))

useSeoMeta({
  title: () => copy.value.seoTitle,
  description: () => copy.value.seoDesc,
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16 grid gap-8">
    <div>
      <h1 class="font-display text-3xl font-bold text-foreground">{{ copy.title }}</h1>
      <p class="text-muted-foreground mt-2">{{ copy.updated }}</p>
    </div>

    <Card class="p-6 rounded-2xl space-y-3 border-success-soft bg-success-soft/30">
      <h2 class="font-display text-lg font-bold text-foreground">{{ copy.highlightTitle }}</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">{{ copy.highlightBody }}</p>
    </Card>

    <section v-for="section in copy.sections" :key="section.title" class="space-y-3">
      <h2 class="font-display text-xl font-bold text-foreground">{{ section.title }}</h2>
      <p v-for="(p, i) in section.paragraphs" :key="i" class="text-sm text-muted-foreground leading-relaxed">
        {{ p }}
      </p>
      <ul v-if="section.bullets?.length" class="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
        <li v-for="(b, i) in section.bullets" :key="i">{{ b }}</li>
      </ul>
    </section>

    <div class="flex gap-3 pt-4">
      <Button variant="outline" as-child>
        <NuxtLink to="/">{{ copy.back }}</NuxtLink>
      </Button>
      <Button variant="ghost" as-child>
        <NuxtLink to="/settings">{{ copy.syncSettings }}</NuxtLink>
      </Button>
    </div>
  </div>
</template>
