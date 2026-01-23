# HireWerk - Nuxt 4

Construtor de currículos **100% client-side** com Vue 3, Nuxt 4 e localStorage.

## 🚀 Stack

- **Framework:** Nuxt 4 (Vue 3)
- **State Management:** Pinia
- **Estilização:** Tailwind CSS v3 + Design System customizado
- **Validação:** Zod v4
- **Ícones:** @nuxt/icon (Lucide Icons)
- **Notificações:** vue-sonner
- **Storage:** localStorage (sem backend)
- **Deploy:** Netlify

## ✨ Funcionalidades

- ✅ CRUD completo de currículos
- ✅ 3 templates profissionais (Classic, Minimal, Modern)
- ✅ Auto-save local com debounce
- ✅ Exportação PDF (window.print)
- ✅ Exportação JSON
- ✅ Versionamento automático (max 30 snapshots)
- ✅ Lixeira com restauração
- ✅ 100% client-side (SPA mode)
- ✅ Design "Wow Factor" com micro-interações
- ✅ Dark mode otimizado

## 📦 Instalação

```bash
# Instalar dependências
bun install

# Desenvolvimento (porta 1000)
bun run dev

# Build para produção
bun run build

# Gerar site estático
bun run generate

# Preview da build
bun run preview

# Type checking
bun run typecheck
```

## 🌐 Deploy Netlify

### Automático via Git

1. Conecte seu repositório ao Netlify
2. Configure:
   - **Base directory:** `apps/nuxt-web`
   - **Build command:** `bun run generate`
   - **Publish directory:** `.output/public`
3. Deploy automático a cada push

### Manual via Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build e deploy
cd apps/nuxt-web
bun run generate
netlify deploy --prod --dir=.output/public
```

## 📁 Estrutura

```
apps/nuxt-web/
├── app/
│   ├── assets/css/          # Estilos globais + Design System
│   ├── components/          # Componentes Vue
│   │   ├── resume/          # Componentes de currículo
│   │   └── templates/       # Templates de CV
│   ├── layouts/             # Layouts (default.vue)
│   ├── pages/               # Rotas (auto-routing)
│   │   ├── index.vue        # Landing page
│   │   ├── dashboard.vue    # Dashboard
│   │   ├── templates.vue    # Seleção de templates
│   │   └── resumes/         # CRUD de currículos
│   ├── stores/              # Pinia stores
│   └── lib/                 # Lógica de negócio
│       ├── storage/         # localStorage + schemas
│       ├── versioning/      # Sistema de snapshots
│       └── export/          # PDF/JSON export
├── app.vue                  # App principal
├── nuxt.config.ts           # Configuração Nuxt
├── tailwind.config.ts       # Configuração Tailwind
└── package.json
```

## 🎯 Arquitetura

### Client-Side Only

- **SPA Mode:** `ssr: false` no nuxt.config
- **localStorage:** Todos os dados persistidos localmente
- **Sem backend:** Não há API ou banco de dados
- **Privacidade por design:** Dados nunca saem do navegador

### Pinia Store

```ts
import { useResumeStore } from '~/stores/resume'

const store = useResumeStore()

// CRUD
store.createResume()
store.updateResume(doc)
store.softDelete(id)
store.restore(id)

// Exportação
store.exportPdf(id)
store.exportJson(id)
```

### Design System

O projeto utiliza um design system customizado com:
- Cores definidas em `tailwind.config.ts` (Slate/Blue)
- Tipografia "Plus Jakarta Sans" via Google Fonts
- Componentes com bordas arredondadas (16px-24px)
- Efeitos de glassmorphism e backdrop-blur
- Micro-animações e hover states

## 🔧 Configuração

### nuxt.config.ts

```ts
export default defineNuxtConfig({
  ssr: false,  // SPA mode
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/icon',
  ],
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&display=swap' }
      ]
    }
  }
})
```

### netlify.toml (raiz do projeto)

```toml
[build]
  base = "apps/nuxt-web"
  command = "bun run generate"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## ⚠️ Limitações

- **localStorage:** ~5MB por origem
- **Sem sincronização:** Dados locais ao navegador
- **PDF:** Qualidade varia por navegador (recomendado Chrome/Edge)

## 🎨 Ícones

O projeto utiliza `@nuxt/icon` com ícones do Lucide:

```vue
<Icon name="lucide:briefcase-business" class="w-6 h-6" />
```

## 📝 Licença

MIT © 2025 ens-Emilio

---

**Migrado de Next.js para Nuxt 4 em 23/01/2026**
