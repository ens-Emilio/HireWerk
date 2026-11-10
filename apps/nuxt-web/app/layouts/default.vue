<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '~/composables/useTheme'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

const isMobileMenuOpen = ref(false)
const { theme, toggleTheme } = useTheme()

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground selection:bg-primary/20 pb-20 md:pb-0">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:font-bold focus:text-sm"
    >
      Pular para o conteúdo
    </a>
    <header class="app-header sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="group flex items-center gap-2" @click="isMobileMenuOpen = false">
          <AppLogo variant="symbol" :size="30" class="group-hover:scale-105 transition-transform" />
          <span class="text-xl font-bold tracking-tight font-display">HireWerk</span>
          <span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary rounded-md border border-primary/20">Beta</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1" aria-label="Navegação principal">
          <NuxtLink to="/dashboard" class="px-3.5 py-2 rounded-md text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface min-h-11 flex items-center transition-colors active-link">Dashboard</NuxtLink>
          <NuxtLink to="/resumes" class="px-3.5 py-2 rounded-md text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface min-h-11 flex items-center transition-colors active-link">Currículos</NuxtLink>
          <NuxtLink to="/templates" class="px-3.5 py-2 rounded-md text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface min-h-11 flex items-center transition-colors active-link">Modelos</NuxtLink>
          <NuxtLink to="/settings" class="px-3.5 py-2 rounded-md text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface min-h-11 flex items-center transition-colors">Config.</NuxtLink>
          <NuxtLink to="/resumes/trash" class="px-3.5 py-2 rounded-md text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface min-h-11 flex items-center transition-colors">Lixeira</NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            class="hidden md:flex"
            @click="toggleTheme"
            :title="theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
          >
            <Icon :name="theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="md:hidden"
            @click="toggleMobileMenu"
          >
            <Icon
              :name="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'"
              class="w-6 h-6"
            />
          </Button>
        </div>
      </div>

      <div
        v-if="isMobileMenuOpen"
        class="md:hidden border-t border-b border-border bg-background shadow-2xl absolute w-full left-0 h-auto z-40 animate-in slide-in-from-top-2"
      >
        <nav class="flex flex-col p-4 gap-2">
          <NuxtLink
            to="/dashboard"
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-semibold hover:bg-surface transition-colors active-link flex items-center gap-2 min-h-11"
          >
            <Icon name="lucide:layout-dashboard" class="w-4 h-4" />
            Painel
          </NuxtLink>
          <NuxtLink
            to="/resumes"
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-semibold hover:bg-surface transition-colors active-link flex items-center gap-2 min-h-11"
          >
            <Icon name="lucide:file-text" class="w-4 h-4" />
            Currículos
          </NuxtLink>
          <NuxtLink
            to="/templates"
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-semibold hover:bg-surface transition-colors active-link flex items-center gap-2 min-h-11"
          >
            <Icon name="lucide:palette" class="w-4 h-4" />
            Modelos
          </NuxtLink>
          <Separator />

          <Button
            variant="ghost"
            class="justify-start px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 min-h-11"
            @click="toggleTheme"
          >
            <Icon :name="theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
            {{ theme === 'dark' ? 'Tema Claro' : 'Tema Escuro' }}
          </Button>

          <NuxtLink
            to="/resumes/trash"
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface transition-colors flex items-center gap-2 min-h-11"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4" />
            Lixeira
          </NuxtLink>
          <NuxtLink
            to="/settings"
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface transition-colors flex items-center gap-2 min-h-11"
          >
            <Icon name="lucide:settings" class="w-4 h-4" />
            Configurações
          </NuxtLink>
          <NuxtLink
            to="/about"
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface transition-colors flex items-center gap-2 min-h-11"
          >
            <Icon name="lucide:info" class="w-4 h-4" />
            Sobre
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main id="main-content" class="container mx-auto px-4 py-11 md:py-16 translate-y-0 transition-transform">
      <slot />
    </main>

    <footer class="app-footer hidden md:block border-t border-border-soft bg-card mt-auto">
      <div class="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>HireWerk · seus dados ficam só com você</span>
        <a
          href="https://github.com/ens-Emilio"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 hover:text-foreground transition-colors group"
        >
          <span>Criado por <span class="font-semibold">ens-Emilio</span></span>
          <Icon name="lucide:github" class="w-4 h-4 group-hover:scale-110 transition-transform" />
        </a>
      </div>
    </footer>

    <nav class="app-footer md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-soft bg-card px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]">
      <div class="flex items-center justify-around">
        <NuxtLink to="/dashboard" class="flex flex-col items-center justify-center gap-0.5 min-w-[60px] min-h-12 py-1 rounded-md text-[11px] font-semibold text-muted-foreground transition-colors" exact-active-class="text-foreground">
          <span class="w-[30px] h-[30px] rounded-[9px] grid place-items-center font-display font-extrabold text-[13px]" :class="$route.path === '/dashboard' ? 'bg-primary text-primary-foreground' : ''">D</span>
          Painel
        </NuxtLink>
        <NuxtLink to="/resumes" class="flex flex-col items-center justify-center gap-0.5 min-w-[60px] min-h-12 py-1 rounded-md text-[11px] font-semibold text-muted-foreground transition-colors" exact-active-class="text-foreground">
          <span class="w-[30px] h-[30px] rounded-[9px] grid place-items-center font-display font-extrabold text-[13px]" :class="$route.path.startsWith('/resumes') && $route.path !== '/resumes/trash' ? 'bg-primary text-primary-foreground' : ''">C</span>
          Currículos
        </NuxtLink>
        <NuxtLink to="/templates" class="flex flex-col items-center justify-center gap-0.5 min-w-[60px] min-h-12 py-1 rounded-md text-[11px] font-semibold text-muted-foreground transition-colors" exact-active-class="text-foreground">
          <span class="w-[30px] h-[30px] rounded-[9px] grid place-items-center font-display font-extrabold text-[13px]" :class="$route.path === '/templates' ? 'bg-primary text-primary-foreground' : ''">M</span>
          Modelos
        </NuxtLink>
        <NuxtLink to="/resumes/trash" class="flex flex-col items-center justify-center gap-0.5 min-w-[60px] min-h-12 py-1 rounded-md text-[11px] font-semibold text-muted-foreground transition-colors" exact-active-class="text-foreground">
          <span class="w-[30px] h-[30px] rounded-[9px] grid place-items-center font-display font-extrabold text-[13px]" :class="$route.path === '/resumes/trash' ? 'bg-primary text-primary-foreground' : ''">L</span>
          Lixeira
        </NuxtLink>
      </div>
    </nav>

    <PwaInstallPrompt />
    <PwaBanners />
    <FirstTour />
    <CommandPalette />
  </div>
</template>

<style scoped>
.router-link-active.active-link {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 0.05);
}
</style>
