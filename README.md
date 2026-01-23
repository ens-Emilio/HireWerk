# HireWerk 💼

Construtor de currículos **100% client-side** com design premium, templates profissionais e exportação para PDF.

- **Status:** ✅ Disponível
- **Framework:** Nuxt 4 (Vue 3)
- **Local:** `apps/nuxt-web`
- **Deploy:** Netlify
- **Live Demo:** [Em breve]

## ✨ Destaques

- 🎨 **Design "Wow Factor"** - Interface moderna com micro-interações e glassmorphism
- ⚡ **Preview em Tempo Real** - Veja as mudanças instantaneamente enquanto edita
- 🔒 **100% Privado** - Seus dados nunca saem do navegador (localStorage)
- 📱 **Responsivo** - Funciona perfeitamente em desktop e mobile
- 🎯 **ATS-Friendly** - Templates otimizados para sistemas de recrutamento

## 🚀 Como rodar

```bash
cd apps/nuxt-web
bun install
bun run dev
```

Acesse: `http://localhost:1000`

## 🎯 Funcionalidades

- ✅ CRUD completo de currículos
- ✅ 3 templates profissionais (Classic, Minimal, Modern)
- ✅ Exportação PDF/JSON
- ✅ Lixeira com restauração
- ✅ Versionamento automático (até 30 snapshots)
- ✅ Auto-save com debounce
- ✅ Dark mode otimizado
- ✅ Ícones modernos (Lucide Icons)

## 🛠️ Stack Tecnológica

- **Framework:** Nuxt 4 (Vue 3, SPA mode)
- **State Management:** Pinia
- **Estilização:** Tailwind CSS v3 + Design System customizado
- **Tipagem:** TypeScript + Zod v4
- **Ícones:** @nuxt/icon (Lucide)
- **Notificações:** vue-sonner
- **Build Tool:** Bun

## 📦 Deploy

O projeto está configurado para deploy automático no Netlify:

```bash
# Build de produção
bun run build

# Gerar site estático
bun run generate
```

Veja `netlify.toml` para configurações de deploy.

## 📄 Documentação

- [README Técnico](apps/nuxt-web/README.md) - Detalhes de implementação
- [Documentação Completa](docs/README.md) - Arquitetura e fluxos

## 🎨 Design System

O projeto utiliza um design system premium com:
- Paleta de cores Slate/Blue de alto contraste
- Tipografia "Plus Jakarta Sans"
- Bordas arredondadas (16px-24px)
- Sombras suaves e efeitos de blur
- Micro-animações e hover states

## 📝 Licença

MIT © 2025 ens-Emilio

---

**Migrado de Next.js para Nuxt 4 em 23/01/2026**
