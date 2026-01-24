# HireWerk 💼

> **Construtor de currículos 100% client-side** com Nuxt 4, Vue 3 e design premium.

---

[![Status](https://img.shields.io/badge/Status-Dispon%C3%ADvel-success?style=for-the-badge)]()
[![Framework](https://img.shields.io/badge/Framework-Nuxt_4-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)]()
[![Type](https://img.shields.io/badge/Type-SPA_/_Client--Side-blue?style=for-the-badge)]()
[![Versioning](https://img.shields.io/badge/Version-Beta_1.0.0-orange?style=for-the-badge)]()

**HireWerk** é um editor de currículos moderno que prioriza a privacidade e a rapidez. Seus dados nunca saem do seu navegador — tudo é processado localmente usando `localStorage` com um sistema de versionamento automático integrado.

---

## ✨ Destaques & Diferenciais

- 🎨 **Design "Wow Factor"**: Interface premium com efeitos de glassmorphism, micro-interações e transições suaves.
- 📱 **Totalmente Responsivo**: Navegação adaptativa com menu hamburguer e editor otimizado para mobile usando sistema de abas.
- 🌓 **Dark Mode Nativo**: Alternância entre temas claro e escuro com persistência de preferência.
- 🔒 **Privacidade por Design**: Sem banco de dados, sem nuvem, sem rastreio. Seus currículos pertencem a você.
- ⚡ **Preview em Tempo Real**: Visualize instantaneamente as mudanças no formato A4 enquanto digita.
- 💾 **Versionamento Inteligente**: Sistema de snapshots que permite desfazer/refazer até 30 versões de cada currículo.
- 🎯 **ATS-Friendly**: Templates validados para passarem por sistemas de triagem automática (ATS).

## 🚀 Como Rodar Localmente

O projeto utiliza o **Bun** como runtime e gerenciador de pacotes para máxima performance.

```bash
# Entre na pasta do app
cd apps/nuxt-web

# Instale as dependências
bun install

# Inicie o servidor de desenvolvimento
bun run dev
```

Acesse: `http://localhost:4000` (ou a porta indicada no terminal).

## 🛠️ Stack Tecnológica

- **Core**: [Nuxt 4](https://nuxt.com/) (Vue 3, SPA Mode)
- **Estado**: [Pinia](https://pinia.vuejs.org/)
- **Estilização**: [Tailwind CSS v3](https://tailwindcss.com/) + Custom Design System
- **Validação**: [Zod](https://zod.dev/) (Schemas de dados e migrações)
- **Ícones**: [Lucide Icons](https://lucide.dev/) (via `@nuxt/icon`)
- **Feedback**: [Vue Sonner](https://vue-sonner.com/)
- **Build/Runtime**: [Bun](https://bun.sh/)

## 📂 Arquitetura & Estrutura

### Client-Side First
Diferente de outros construtores, o HireWerk não possui backend. Toda a lógica de negócio está no diretório `app/lib`:
- `storage/`: Gerenciamento do `localStorage`, schemas Zod e migrações automáticas de versão.
- `versioning/`: Lógica de snapshots para o "Time Travel" (Undo/Redo).
- `export/`: Geradores de arquivos PDF (via `window.print`) e JSON.

### Estrutura de Pastas
```text
apps/nuxt-web/app/
├── assets/css/        # Design tokens e Tailwind
├── components/        # Componentes base e Templates de CV
├── composables/       # Lógica compartilhada (Tema, etc)
├── layouts/           # Layout principal responsivo
├── lib/               # Lógica de negócio (Storage, Export, Versioning)
├── pages/             # Rotas da aplicação (Dashboard, Editor, Templates)
└── stores/            # Estado global com Pinia
```

## 📦 Deploy (Netlify)

O projeto está configurado para deploy contínuo via `netlify.toml`.

```toml
[build]
  base = "apps/nuxt-web"
  command = "bun run generate" # Gera site estático puro
  publish = ".output/public"
```

## 📝 Documentação Complementar

- [Mapeamento da Codebase](MAPEAMENTO.md) - Guia detalhado de cada arquivo e função.

---

### Versão Beta 1.0.0
Desenvolvido com foco em performance e privacidade.  
MIT © 2026 [ens-Emilio](https://github.com/ens-Emilio)
