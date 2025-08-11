# HireWerk

Documentação do projeto com base no plano em `plan.md`.

## Status Atual

- CRUD de currículos e templates ✅
- Preview e escolha de template ✅
- Exportação de PDF (GET/POST) ✅
- Renderização SSR privada com token ✅
- Histórico de exportações (`exports`) ✅
- Versionamento automático + snapshots (`resume_versions`) ✅
- Lixeira de currículos (restaurar, esvaziar, toasts, item no sidebar) ✅
- Navegação por setas e atalhos (← →) ✅
- Login social (Google/GitHub) ⏳
- Exportação JSON ⏳

## Visão Geral (MVP)
- Cadastro/Login (OAuth: Google/GitHub)
- Criar/editar currículo via campos estruturados + seções livres
- Escolher template visual (mín. 3 modelos)
- Gerar e baixar PDF
- Salvar versões e exportar JSON

## Stack Sugerida
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend/BaaS: Supabase (Postgres + Auth + Storage)
- ORM: Prisma (opcional) ou cliente Supabase
- Autenticação: Auth.js (NextAuth) ou Clerk
- PDF: Puppeteer/Playwright em função serverless
- Infra: Vercel (Deploy), GitHub Actions (CI/CD), Turborepo (monorepo, opcional)

## Roadmap (Sprints)
- Sprint 0 — Setup & Infra: TS, ESLint, Prettier, Tailwind, Supabase, Boilerplate Next.js
  - Entrega: app blank com login
- Sprint 1 — Modelos + CRUD básico:
  - Modelagem (users, resumes, sections, templates, exports)
  - Endpoints CRUD e UI de formulário
  - Entrega: salvar/editar currículo
- Sprint 2 — Templates & Preview:
  - 2–3 templates responsivos, preview em tempo real, versionamento
  - Entrega: escolher template + preview
- Sprint 3 — PDF & Auth UX:
  - Geração de PDF via Puppeteer, login social, testes e CI
  - Entrega: download PDF + login social
- Sprint 4 (opcional) — Polimento:
  - Storage, e-mails, analytics, integrações, plano pago/limitações
  - Entrega: pronto para beta

## Modelagem de Dados (resumo)
- users: id, email, name, avatar_url, created_at
- resumes: id, user_id, title, template_id, data(jsonb), timestamps, version
- templates: id, slug, name, html_template, css, preview_image_url
- exports: id, resume_id, user_id, format, storage_path, created_at

## Endpoints Principais (REST)
- GET /api/resumes — listar currículos do usuário
- POST /api/resumes — criar currículo
- GET /api/resumes/:id — obter currículo
- PUT /api/resumes/:id — atualizar currículo
- GET /api/resumes/:id/export/pdf — gerar/baixar PDF (navegador)
- POST /api/resumes/:id/export/pdf — gerar PDF programaticamente
- GET /api/templates — listar templates

### Fluxo de PDF

- Rota SSR protegida: `/export/render/:id?token=...` (token assinado via `EXPORT_TOKEN_SECRET`)
- Geração via Puppeteer-Core + `@sparticuz/chromium`
- Endpoint GET retorna PDF inline com cabeçalhos adequados
- Logs em `exports`: status, duração, erro, tamanho, checksum e `resume_version`

## Estrutura de Arquivos (Monorepo sugerido)
```
/HireWerk
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ resume/[id]/page.tsx
│     │  ├─ api/
│     │  │  ├─ resumes/route.ts
│     │  │  └─ export/pdf/route.ts
│     ├─ components/
│     │  ├─ Editor/
│     │  ├─ Preview/
│     │  └─ Templates/
│     ├─ styles/
│     └─ tsconfig.json
├─ packages/
│  ├─ ui/
│  ├─ db/
│  └─ lib/
├─ infra/
│  ├─ supabase/
│  └─ puppeteer/
├─ .github/
│  └─ workflows/ci.yml
├─ package.json
└─ turbo.json
```

## Sistema de Templates
- Templates como componentes React
- Recebem `data` JSON e renderizam HTML imprimível
- Suporte a overrides (tipografia, cores) via JSON
- Renderização SSR para geração de PDF

## Boas Práticas para PDF
- Rota privada HTML `/export/render/:id?token=xxx`
- CSS com `@page` e media queries `print`
- Pré-carregar fontes
- Evitar carregamento dinâmico na renderização

## Execução (Bun)

No diretório `apps/web`:

```bash
bun install
cp .env.example .env.local
bun run dev
```

Variáveis relevantes:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EXPORT_TOKEN_SECRET`
- `CHROME_PATH` ou `PUPPETEER_EXECUTABLE_PATH` (dev local para PDF)

## Segurança
- Autenticação obrigatória nas APIs
- Controle de acesso por usuário
- Sanitização de campos HTML
- Backups regulares do banco

## Justificativa da Stack
- Next.js + Supabase acelera MVP, com SSR e DB integrado
- Puppeteer garante PDF fiel ao HTML/CSS
- Tailwind agiliza criação de templates
- Deploy simplificado com Vercel e CI no GitHub Actions

## Licença
MIT © 2025 ens-Emilio
