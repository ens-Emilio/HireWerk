<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'

useSeoMeta({
  title: 'Privacidade — HireWerk',
  description: 'Como o HireWerk trata seus dados: offline por padrão, cifrado de ponta a ponta no sync opcional.',
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16 grid gap-8">
    <div>
      <h1 class="font-display text-3xl font-bold text-foreground">Privacidade</h1>
      <p class="text-muted-foreground mt-2">Atualizado em 11/2026 · vale para o app e para os links compartilhados.</p>
    </div>

    <Card class="p-6 rounded-2xl space-y-3 border-success-soft bg-success-soft/30">
      <h2 class="font-display text-lg font-bold text-foreground">O padrão: nada sai do seu aparelho</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        O HireWerk funciona <strong>100% offline por padrão</strong>. Seus currículos vivem no armazenamento
        local do seu navegador (localStorage), no seu aparelho. Sem cadastro, sem servidor de dados,
        sem telemetria, sem cookies de rastreamento. Se você nunca ativar a sincronização,
        nenhum dado seu chega a qualquer servidor — ponto.
      </p>
    </Card>

    <section class="space-y-3">
      <h2 class="font-display text-xl font-bold text-foreground">Sincronização entre aparelhos (opcional)</h2>
      <div class="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Se você <strong>escolher</strong> criar uma conta de sincronização nas Configurações, seus currículos
          são <strong>cifrados no seu aparelho</strong> (AES-GCM, com chave derivada da sua frase-senha) antes de
          sair dele. O servidor guarda apenas blobs cifrados que <strong>ele mesmo não consegue ler</strong> —
          nem nós, nem quem administra o servidor, nem quem o comprometer.
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li>A frase-senha nunca sai do seu aparelho e não há recuperação: se você a perder, os blobs cifrados são irrecuperáveis (e inúteis para qualquer um).</li>
          <li>O servidor vê: um identificador de conta, timestamps e blobs opacos. Nada mais.</li>
          <li>Desativar = remover a conta nas Configurações apaga todos os blobs do servidor em uma operação (LGPD/GDPR: direito de eliminação).</li>
          <li>Seus currículos locais continuam intactos no aparelho, sempre.</li>
        </ul>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="font-display text-xl font-bold text-foreground">Links compartilhados</h2>
      <div class="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong>Links com senha e links simples</strong> (F7) funcionam sem servidor: todo o conteúdo
          do currículo viaja <em>dentro do próprio link</em> (comprimido e, no caso de senha, cifrado).
          Ninguém registra quem abriu.
        </p>
        <p>
          Se você usar um <strong>link encurtado</strong> (recurso opcional para quem tem conta), o servidor
          registra apenas <em>quantas vezes o link foi aberto</em> e a data da última abertura —
          agregado, sem IP, sem fingerprint, sem cookie. É o único rastro que existe, e só existe
          porque você pediu o encurtamento.
        </p>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="font-display text-xl font-bold text-foreground">Currículos publicados</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Publicar um currículo em página pública (<code class="text-xs bg-surface px-1.5 py-0.5 rounded">/p/…</code>)
        é um ato explícito e revogável: o conteúdo vai para o servidor <strong>em texto claro</strong> porque
        o objetivo é ser lido (por pessoas e ATS), e você pode removê-lo a qualquer momento
        nas Configurações. Só publique o que você quer público.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="font-display text-xl font-bold text-foreground">O que nunca fazemos</h2>
      <ul class="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li>Vender, alugar ou compartilhar dados com terceiros — não temos dados para isso.</li>
        <li>Telemetria automática, pixels de rastreamento ou perfis de uso.</li>
        <li>Leitura dos seus currículos: a criptografia de sync é de ponta a ponta, feita no seu aparelho.</li>
      </ul>
    </section>

    <section class="space-y-3">
      <h2 class="font-display text-xl font-bold text-foreground">Seus direitos (LGPD)</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Como não coletamos dados identificáveis no modo padrão, não há o que acessar ou corrigir.
        No modo sync, você tem controle total: <em>portabilidade</em> (export JSON/ZIP a qualquer momento,
        inclusive do próprio app offline), <em>eliminação</em> (excluir conta apaga tudo do servidor
        imediatamente) e <em>revogação de consentimento</em> (desative o sync e volte ao modo offline pleno).
      </p>
    </section>

    <div class="flex gap-3 pt-4">
      <Button variant="outline" as-child>
        <NuxtLink to="/">← Voltar ao início</NuxtLink>
      </Button>
      <Button variant="ghost" as-child>
        <NuxtLink to="/settings">Configurações de sync</NuxtLink>
      </Button>
    </div>
  </div>
</template>
