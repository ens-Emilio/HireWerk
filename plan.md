# HireWerk — Plano de Desenvolvimento

## 1 — Visão geral (MVP)
- Criar conta/login (OAuth: Google/GitHub)
- Criar/editar currículo via campos estruturados + seções livres ✅
- Escolher template visual (mín. 3 modelos) ✅
- Gerar e baixar PDF ✅
- Salvar versões e exportar JSON

---

## Status & Checklist

- **Exportação PDF**
  - [x] GET `/api/resumes/[id]/export/pdf`
  - [x] POST `/api/resumes/[id]/export/pdf`
  - [x] Render SSR `/export/render/[id]` com token assinado
  - [x] Logging em `exports` (status, erro, duração, tamanho, checksum)
  - [x] Armazenar PDF no Supabase Storage (`storage_path`)
  - [ ] Boas práticas finais (fontes, `@page`, `@media print`)

- **Exportação JSON**
  - [x] GET `/api/resumes/[id]/export/json`
  - [x] POST `/api/resumes/[id]/export/json`
  - [x] Logging em `exports` (status, duração, tamanho, checksum)
  - [x] Links na UI em `@/app/_components/CurrentContext`

- **Versionamento**
  - [x] Trigger para incremento automático de `resumes.version`
  - [x] Snapshot em `resume_versions` (AFTER UPDATE)
  - [x] `exports.resume_version` gravado nas exportações

- **Navegação**
  - [x] Setas de navegação visuais em `@/app/_components/NavArrows`
  - [x] Atalhos de teclado ← → com detecção de foco para ignorar inputs/textarea/select/contenteditable
  - [x] Fluxo ajustado entre páginas principais (Dashboard, Resumes, Resume editor, Templates, Trash, Settings)
  - [ ] Acessibilidade adicional (aria-labels, foco visível) e testes E2E

- **Lixeira**
  - [x] Página `/resumes/trash` com restauração
  - [x] Esvaziar lixeira (delete permanente) via server action `emptyTrash`
  - [x] Toasts e item "Lixeira" no sidebar
  - [x] Modal de confirmação para "Esvaziar lixeira"

- **Correções**
  - [x] Import de `MobileNav` corrigido para alias `@/app/_components/MobileNav`
  - [x] Rota de PDF: retorno via `ReadableStream` com `NextResponse` (compatibilidade de tipos)

- **Backlog imediato**
  - [x] Exportar currículo em JSON
  - [ ] Login social (Google/GitHub)
  - [ ] Testes/CI para rotas, geração de PDF e navegação (Jest para unitários/integrados; Playwright para E2E)
  - [x] Modal de confirmação para esvaziar lixeira
  - [ ] Acessibilidade das setas/atalhos (aria, foco, e2e)

- **Próxima entrega**
  - Login social (Google/GitHub)


## 2 — Stack sugerido

**Frontend**
- Next.js (App Router) + TypeScript
- Tailwind CSS

**Backend / BaaS**
- Supabase (Postgres + Auth + Storage)

**ORM**
- Prisma (opcional) ou cliente Supabase

**Autenticação**
- Auth.js (NextAuth) ou Clerk

**PDF**
- Puppeteer / Playwright em função serverless

**Infra**
- Deploy: Vercel
- CI/CD: GitHub Actions
- Monorepo: Turborepo (opcional)

---

## 3 — Plano de desenvolvimento (Sprints)

### Sprint 0 — Setup & Infra
- Criar repositório 
- Configurar TypeScript, ESLint, Prettier, Tailwind
- Criar projeto Supabase e configurar 
- Boilerplate Next.js + Tailwind + Supabase 

**Entrega:** app blank com login 

### Sprint 1 — Modelos + CRUD básico
- Modelagem do banco (users, resumes, sections, templates, exports) 
- Endpoints CRUD de currículos 
- UI com formulário básico 

**Entrega:** salvar/editar currículo 

### Sprint 2 — Templates & Preview
- Implementar 2–3 templates responsivos 
- Preview em tempo real 
- Versionamento

**Entrega:** escolher template + preview 

### Sprint 3 — PDF & Auth UX
- Geração de PDF via Puppeteer 
- Login social (Google/GitHub)
- Testes e CI

**Entrega:** download PDF + login social

### Sprint 4 (opcional) — Polimento
- Storage de arquivos, e-mails transacionais
- Analytics, integrações externas
- Plano pago / limitações

**Entrega:** pronto para beta

---

## 4 — Modelagem de dados

**Tabela: users**
```sql
id uuid PK
email text
name text
avatar_url text
created_at timestamp
```

**Tabela: resumes**

```sql
id uuid PK
user_id uuid FK -> users.id
title text
template_id uuid
data jsonb
created_at timestamp
updated_at timestamp
version integer
```

**Tabela: templates**

```sql
id uuid PK
slug text
name text
html_template text
css text
preview_image_url text
```

**Tabela: exports**

```sql
id uuid PK
resume_id uuid FK
user_id uuid FK
format text
engine text
status text -- running | succeeded | failed
error text
duration_ms integer
size_bytes integer
checksum text
storage_path text
created_at timestamp
```

---

## 5 — Endpoints principais (REST)

* `GET /api/resumes` — listar currículos do usuário
* `POST /api/resumes` — criar currículo
* `GET /api/resumes/:id` — obter currículo
* `PUT /api/resumes/:id` — atualizar currículo
* `GET /api/resumes/:id/export/pdf` — gerar/baixar PDF (fluxo via navegador)
* `POST /api/resumes/:id/export/pdf` — gerar PDF programaticamente (server-to-server)
* `GET /api/resumes/:id/export/json` — baixar JSON do currículo
* `POST /api/resumes/:id/export/json` — exportar JSON programaticamente
* `GET /export/render/:id?token=...` — render privado SSR para geração de PDF
* `GET /api/templates` — listar templates

---

## 6 — Estrutura de arquivos (monorepo sugerido)

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

---

## 7 — Sistema de templates

* Templates como componentes React
* Recebem `data` JSON e renderizam HTML imprimível
* Suporte a overrides (tipografia, cores) via JSON
* Renderização SSR para geração de PDF

---

## 8 — Boas práticas para PDF

* Criar rota privada HTML `/export/render/:id?token=xxx`
* CSS com `@page` e media queries `print`
* Pré-carregar fontes
* Evitar carregamento dinâmico no momento da renderização

---

## 9 — Segurança

* Autenticação obrigatória nas APIs
* Controle de acesso por usuário
* Sanitização de campos HTML
* Backups regulares do banco

---

## 10 — Justificativa da stack

* **Next.js + Supabase** acelera MVP, com SSR e DB integrado
* **Puppeteer** garante PDF fiel ao HTML/CSS
* **Tailwind** agiliza criação de templates
* Deploy simplificado com **Vercel**


