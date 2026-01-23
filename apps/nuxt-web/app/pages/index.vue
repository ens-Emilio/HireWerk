<script setup lang="ts">
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- Background Glows -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
    
    <!-- Hero Section -->
    <div class="max-w-5xl mx-auto pt-20 pb-24 px-4 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
        🚀 100% Client-Side & Gratuito
      </div>
      
      <h1 class="text-5xl md:text-7xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">
        Crie currículos que chamam a <span class="text-primary">atenção</span>.
      </h1>
      
      <p class="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
        Edite, visualize em tempo real e exporte para PDF em segundos. Seus dados nunca saem do seu navegador.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <NuxtLink 
          to="/dashboard"
          class="w-full sm:w-auto inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 hover:-translate-y-1 transition-all active:scale-95"
        >
          Começar Agora
        </NuxtLink>
        <NuxtLink 
          to="/templates"
          class="w-full sm:w-auto inline-flex h-14 items-center justify-center rounded-2xl border border-border bg-surface px-10 text-lg font-bold text-foreground hover:bg-background transition-all"
        >
          Ver Modelos
        </NuxtLink>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="max-w-6xl mx-auto px-4 pb-32">
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:border-primary/20">
          <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Icon name="lucide:zap" class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold mb-3 text-foreground">Velocidade Extrema</h3>
          <p class="text-muted leading-relaxed">Interface ultra responsiva com preview em tempo real enquanto você digita.</p>
        </div>

        <div class="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:border-primary/20">
          <div class="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6">
            <Icon name="lucide:shield-check" class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold mb-3 text-foreground">Privacidade Total</h3>
          <p class="text-muted leading-relaxed">Seus dados são salvos apenas no seu localStorage. Privacidade por design.</p>
        </div>

        <div class="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:border-primary/20">
          <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Icon name="lucide:layout" class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold mb-3 text-foreground">Design Profissional</h3>
          <p class="text-muted leading-relaxed">Modelos otimizados para sistemas de leitura de currículos (ATS).</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}
</style>
