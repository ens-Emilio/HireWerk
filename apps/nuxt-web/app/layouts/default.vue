<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '~/composables/useTheme'

const isMobileMenuOpen = ref(false)
const { theme, toggleTheme } = useTheme()

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground selection:bg-primary/20">
    <header class="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="group flex items-center gap-2" @click="isMobileMenuOpen = false">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform">
            <Icon name="lucide:briefcase-business" class="w-5 h-5" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold tracking-tight">HireWerk</span>
            <span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary rounded-md border border-primary/20">Beta</span>
          </div>
        </NuxtLink>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink to="/dashboard" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-surface transition-colors active-link">Dashboard</NuxtLink>
          <NuxtLink to="/resumes" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-surface transition-colors active-link">Currículos</NuxtLink>
          <NuxtLink to="/templates" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-surface transition-colors active-link">Templates</NuxtLink>
          <div class="w-px h-4 bg-border mx-2"></div>
          <NuxtLink to="/resumes/trash" class="px-3 py-2 rounded-md text-sm font-medium text-muted hover:text-foreground transition-colors">Lixeira</NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <!-- Theme Toggle (Desktop) -->
          <button 
            @click="toggleTheme" 
            class="hidden md:flex w-9 h-9 items-center justify-center rounded-md hover:bg-surface transition-colors text-foreground"
            :title="theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
          >
            <Icon :name="theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="w-5 h-5" />
          </button>

          <!-- Mobile Menu Button -->
          <button 
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-md hover:bg-surface transition-colors"
          >
            <Icon 
              :name="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'" 
              class="w-6 h-6 text-foreground" 
            />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div 
        v-if="isMobileMenuOpen"
        class="md:hidden border-t border-b border-border bg-background shadow-2xl absolute w-full left-0 h-auto z-40 animate-in slide-in-from-top-2"
      >
        <nav class="flex flex-col p-4 gap-2">
          <NuxtLink 
            to="/dashboard" 
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-medium hover:bg-surface transition-colors active-link flex items-center gap-2"
          >
            <Icon name="lucide:layout-dashboard" class="w-4 h-4" />
            Dashboard
          </NuxtLink>
          <NuxtLink 
            to="/resumes" 
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-medium hover:bg-surface transition-colors active-link flex items-center gap-2"
          >
            <Icon name="lucide:file-text" class="w-4 h-4" />
            Currículos
          </NuxtLink>
          <NuxtLink 
            to="/templates" 
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-medium hover:bg-surface transition-colors active-link flex items-center gap-2"
          >
            <Icon name="lucide:palette" class="w-4 h-4" />
            Templates
          </NuxtLink>
          <div class="h-px bg-border my-1"></div>
          
          <!-- Theme Toggle (Mobile Item) -->
          <button 
            @click="toggleTheme" 
            class="px-4 py-3 rounded-lg text-sm font-medium hover:bg-surface transition-colors flex items-center gap-2 text-left w-full"
          >
             <Icon :name="theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
             {{ theme === 'dark' ? 'Tema Claro' : 'Tema Escuro' }}
          </button>

          <NuxtLink 
            to="/resumes/trash" 
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-lg text-sm font-medium text-muted hover:text-foreground transition-colors flex items-center gap-2"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4" />
            Lixeira
          </NuxtLink>
        </nav>
      </div>
    </header>
    
    <main class="container mx-auto px-4 py-8 md:py-12 translate-y-0 transition-transform">
      <slot />
    </main>

    <footer class="border-t border-border bg-surface/30 mt-auto">
      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-sm text-muted">
            <Icon name="lucide:briefcase-business" class="w-4 h-4" />
            <span>© {{ new Date().getFullYear() }} HireWerk <span class="text-xs ml-1 opacity-70">Beta 1.0.0</span></span>
            <span class="hidden md:inline">•</span>
            <span class="hidden md:inline">Privacidade por design</span>
          </div>
          
          <div class="flex items-center gap-4">
            <a 
              href="https://github.com/ens-Emilio" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors group"
            >
              <span>Criado por <span class="font-semibold">ens-Emilio</span></span>
              <Icon name="lucide:github" class="w-4 h-4 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.router-link-active.active-link {
  color: var(--primary);
  background-color: color-mix(in srgb, var(--primary) 5%, transparent);
}
</style>
