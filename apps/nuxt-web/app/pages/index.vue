<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
const sheet = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)

function handleMove(e: MouseEvent) {
  if (!stage.value || !sheet.value) return
  const r = stage.value.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  sheet.value.style.transform = `rotateY(${x * 26}deg) rotateX(${-y * 18}deg)`
}

function handleLeave() {
  if (sheet.value) sheet.value.style.transform = 'rotateY(0) rotateX(0)'
}

let reduced = false
onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || localStorage.getItem('hirewerk-3d-off') === '1'
  if (reduced || !stage.value) return
  stage.value.addEventListener('mousemove', handleMove)
  stage.value.addEventListener('mouseleave', handleLeave)
})

onBeforeUnmount(() => {
  if (!stage.value) return
  stage.value.removeEventListener('mousemove', handleMove)
  stage.value.removeEventListener('mouseleave', handleLeave)
})
</script>

<template>
  <div class="relative overflow-hidden">
    <div class="max-w-5xl mx-auto pt-20 pb-24 px-4">
      <div class="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
        <div>
          <p class="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground mb-3 before:content-[''] before:w-6 before:h-[3px] before:rounded before:bg-primary">
            Grátis, sem cadastro obrigatório, e seus dados ficam só com você
          </p>
          <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            O currículo pronto em minutos, não em horas
          </h1>
          <p class="mt-4 text-lg text-muted-foreground max-w-[52ch] leading-relaxed">
            Escreva, escolha o visual e compartilhe um link bonito. Tudo funciona no seu aparelho: nada é enviado para servidores, nada é vendido, nada desaparece. <NuxtLink to="/privacy" class="underline underline-offset-2 hover:text-foreground">Como tratamos seus dados</NuxtLink>.
          </p>
          <div class="flex flex-wrap gap-3 mt-6">
            <Button as-child size="lg" class="rounded-xl font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform">
              <NuxtLink to="/dashboard">Criar meu primeiro currículo</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="lg" class="rounded-xl font-bold">
              <NuxtLink to="/templates">Explorar os modelos</NuxtLink>
            </Button>
          </div>
        </div>

        <figure class="stage-3d hidden lg:grid place-items-center min-h-[420px]" ref="stage">
          <div class="a4-3d" ref="sheet">
            <div class="a4-face">
              <div>
                <div class="font-display font-bold text-lg md:text-xl">Maria Silva</div>
                <div class="text-[11px] text-[#6b6a78] uppercase tracking-widest mt-0.5">Designer de produto</div>
              </div>
              <div>
                <div class="a4-line w-[85%]"></div>
                <div class="a4-line w-[60%]"></div>
                <div class="a4-line w-[75%]"></div>
                <div class="flex gap-1.5 flex-wrap mt-2.5">
                  <span class="a4-chip" style="background:#FFF1EB">Figma</span>
                  <span class="a4-chip bg-[#DCFCE7]">Pesquisa</span>
                  <span class="a4-chip bg-[#F4F4F6]">Protótipos</span>
                </div>
              </div>
            </div>
          </div>
          <figcaption class="mt-4 text-xs text-muted-foreground text-center max-w-[40ch]">
            Passe o cursor sobre a folha: é assim que seu currículo aparece enquanto você escreve.
          </figcaption>
        </figure>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 pb-28 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div class="rounded-3xl bg-surface p-8 grid gap-3 content-start border border-border-soft">
        <h3 class="font-display text-2xl font-bold text-foreground">Seus dados são só seus</h3>
        <p class="text-muted-foreground leading-relaxed">
          Por padrão, não existe servidor para vazar nada: seus currículos ficam apenas no seu aparelho, invisíveis para qualquer outra pessoa. Se quiser sincronizar entre aparelhos, o opcional é criptografado de ponta a ponta — o servidor guarda blobs que nem ele consegue ler. Baixe uma cópia com um clique, quando quiser.
        </p>
        <Button as-child variant="blue" class="self-start rounded-xl font-bold">
          <NuxtLink to="/dashboard">Ver como funciona</NuxtLink>
        </Button>
      </div>
      <div class="grid gap-6">
        <Card class="p-6 rounded-3xl">
          <h3 class="font-display text-xl font-bold text-foreground">Salva sozinho, sempre</h3>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            Enquanto você escreve, tudo é salvo automaticamente. Errou? Dê um passo atrás e recupere qualquer versão anterior, mesmo depois de fechar a página.
          </p>
        </Card>
        <Card class="p-6 rounded-3xl">
          <h3 class="font-display text-xl font-bold text-foreground">Sai exatamente como você vê</h3>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            Um clique e o PDF sai limpo: só a folha, sem menus nem botões. O que a empresa recebe é exatamente o que você vê na tela.
          </p>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-3d { perspective: 1200px; }
.a4-3d {
  width: min(320px, 78vw);
  aspect-ratio: 210 / 297;
  transform-style: preserve-3d;
  transition: transform 120ms linear;
  will-change: transform;
  position: relative;
}
.a4-face {
  position: absolute;
  inset: 0;
  background: #fff;
  color: #1e1e24;
  border-radius: 6px;
  box-shadow: 0 18px 44px rgba(30, 30, 36, 0.18);
  padding: 8%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 6%;
}
.dark .a4-face { background: #1b1b22; color: #FAFAFA; }
.a4-line {
  height: 6px;
  border-radius: 3px;
  background: #E4E4E8;
  margin-top: 7px;
}
.a4-chip {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 99px;
  color: #1e1e24;
}
</style>
