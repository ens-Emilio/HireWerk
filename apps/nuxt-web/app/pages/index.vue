<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
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
            {{ t('landing.badge') }}
          </p>
          <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {{ t('landing.title') }}
          </h1>
          <p class="mt-4 text-lg text-muted-foreground max-w-[52ch] leading-relaxed">
            {{ t('landing.subtitle') }} <NuxtLink to="/privacy" class="underline underline-offset-2 hover:text-foreground">{{ t('landing.privacyLink') }}</NuxtLink>.
          </p>
          <div class="flex flex-wrap gap-3 mt-6">
            <Button as-child size="lg" class="rounded-xl font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform">
              <NuxtLink to="/dashboard">{{ t('landing.ctaPrimary') }}</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="lg" class="rounded-xl font-bold">
              <NuxtLink to="/templates">{{ t('landing.ctaSecondary') }}</NuxtLink>
            </Button>
          </div>
        </div>

        <figure class="stage-3d hidden lg:grid place-items-center min-h-[420px]" ref="stage">
          <div class="a4-3d" ref="sheet">
            <div class="a4-face">
              <div>
                <div class="font-display font-bold text-lg md:text-xl">{{ t('landing.sampleName') }}</div>
                <div class="text-[11px] text-[#6b6a78] uppercase tracking-widest mt-0.5">{{ t('landing.sampleRole') }}</div>
              </div>
              <div>
                <div class="a4-line w-[85%]"></div>
                <div class="a4-line w-[60%]"></div>
                <div class="a4-line w-[75%]"></div>
                <div class="flex gap-1.5 flex-wrap mt-2.5">
                  <span class="a4-chip" style="background:#FFF1EB">{{ t('landing.sampleSkill1') }}</span>
                  <span class="a4-chip bg-[#DCFCE7]">{{ t('landing.sampleSkill2') }}</span>
                  <span class="a4-chip bg-[#F4F4F6]">{{ t('landing.sampleSkill3') }}</span>
                </div>
              </div>
            </div>
          </div>
          <figcaption class="mt-4 text-xs text-muted-foreground text-center max-w-[40ch]">
            {{ t('landing.figureCaption') }}
          </figcaption>
        </figure>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 pb-28 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div class="rounded-3xl bg-surface p-8 grid gap-3 content-start border border-border-soft">
        <h3 class="font-display text-2xl font-bold text-foreground">{{ t('landing.privacyTitle') }}</h3>
        <p class="text-muted-foreground leading-relaxed">
          {{ t('landing.privacyBody') }}
        </p>
        <Button as-child variant="blue" class="self-start rounded-xl font-bold">
          <NuxtLink to="/dashboard">{{ t('landing.howItWorks') }}</NuxtLink>
        </Button>
      </div>
      <div class="grid gap-6">
        <Card class="p-6 rounded-3xl">
          <h3 class="font-display text-xl font-bold text-foreground">{{ t('landing.autosaveTitle') }}</h3>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            {{ t('landing.autosaveBody') }}
          </p>
        </Card>
        <Card class="p-6 rounded-3xl">
          <h3 class="font-display text-xl font-bold text-foreground">{{ t('landing.wysiwygTitle') }}</h3>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            {{ t('landing.wysiwygBody') }}
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
