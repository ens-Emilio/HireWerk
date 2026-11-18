# Arquitetura — HireWerk

Editor de currículos **offline-first**. Todo o estado vive no `localStorage` do
navegador; a rede é **opt-in** e nunca necessária para criar, editar ou exportar.

- **Frontend**: Nuxt 4 (Vue 3, `ssr: false` — SPA), Pinia, Tailwind v3, Zod v4.
- **Backend (opcional)**: Cloudflare Worker + D1 — só para sync E2E, encurtador
  de links e publicação pública.
- **Sem banco de dados relacional no cliente**: o "banco" é o `localStorage`,
  com índice + documentos + chaves auxiliares.

```
┌─────────────────────────── navegador ───────────────────────────┐
│                                                                  │
│  pages/  ──►  stores/  ──►  lib/                                 │
│              (Pinia)       ├── storage/   localStorage + Zod     │
│                            ├── versioning/ snapshots + diff      │
│                            ├── export/     PDF·PNG·DOCX·TXT·ZIP  │
│                            ├── import/     PDF·LinkedIn          │
│                            ├── sync/       E2E + merge           │
│                            ├── ats.ts      score local           │
│                            └── i18n.ts     pt-BR · en-US         │
│                                                                  │
└───────────────┬──────────────────────────────────────────────────┘
                │  opt-in (fetch)
                ▼
        Cloudflare Worker ──► D1
        /api/register  /api/sync/push  /api/sync/pull
        /api/shorten   /api/publish    /v/:id  /p/:slug
```

## Camadas

### 1. `app/pages/` — rotas

Nuxt gera as rotas por arquivo. As páginas **não** falam com o
`localStorage` diretamente: elas chamam os stores.

| Rota | Arquivo | Papel |
|---|---|---|
| `/` | `index.vue` | Landing (marketing, CTA) |
| `/dashboard` | `dashboard.vue` | Visão geral: recentes, candidaturas, completude |
| `/resumes` | `resumes/index.vue` | Lista: busca, tags, pin, lote, duplicar, excluir |
| `/resumes/:id` | `resumes/[id].vue` | **Editor** (a maior parte da lógica de UI) |
| `/resumes/trash` | `resumes/trash.vue` | Lixeira: restaurar, excluir de vez, esvaziar |
| `/templates` | `templates.vue` | Grade de modelos + aplicar/importar/exportar |
| `/applications` | `applications.vue` | Kanban de candidaturas |
| `/settings` | `settings.vue` | Preferências, backup, sync, criptografia, wipe |
| `/view` | `view.vue` | Leitor de link compartilhado (`?r=` ou `?r=&p=1`) |
| `/about` | `about.vue` | Changelog e créditos |
| `/privacy` | `privacy.vue` | Política de privacidade (bilíngue) |
| `/guide` | `guide.vue` | **Como usar** — tutoriais |

### 2. `app/stores/` — estado

- **`resume.ts`** — o coração. Índice (`index`), settings, e todas as operações
  de documento: criar, duplicar, atualizar, undo/redo, lixeira, versões,
  import/export, criptografia em repouso. Toda escrita passa por `persistDoc()`.
- **`sync.ts`** — conta, passphrase, push/pull, conflitos.
- **`applications.ts`** — tracker de candidaturas.

### 3. `app/lib/` — lógica pura (testável, sem Vue)

| Módulo | Responsabilidade |
|---|---|
| `storage/schema.ts` | Todos os schemas Zod + tipos inferidos |
| `storage/keys.ts` | Nomes de chave, versão do schema, limites |
| `storage/storage.ts` | `readJson` / `writeJson` / `removeKey` com tratamento de quota |
| `storage/secure.ts` | JSON cifrado para chaves auxiliares (snapshots, redo) |
| `storage/crypto.ts` | AES-GCM + PBKDF2 (150k) para o repouso no aparelho |
| `storage/migrations.ts` | v1→v2→v3, idempotente |
| `storage/seed.ts` | Primeira execução, settings defaults |
| `versioning/snapshot.ts` | Snapshots limitados, auto-diário, restauração, órfãos |
| `versioning/diff.ts` | Diff estruturado campo a campo |
| `export/*` | PDF (print), PNG (canvas), DOCX (`docx`), TXT, ZIP, JSON, JSON Resume, links |
| `import/*` | PDF (`pdfjs-dist`, 100% local), LinkedIn ZIP |
| `sync/e2e.ts` | Cifra/decifra blobs, cliente HTTP |
| `sync/merge.ts` | `decideMerge()` — função pura, sem I/O |
| `ats.ts` | Score TF ponderado + stopwords PT/EN |
| `tailor.ts` | Sugestões aplicáveis a partir do ATS |
| `lint.ts` | Linter de escrita (verbo fraco, métrica, frase longa, clichê) |
| `quality.ts` | Checklist e % de completude |
| `coverletter.ts` | Rascunho de carta local |
| `i18n.ts` | Dicionários pt-BR / en-US (chaves planas) |
| `utils.ts` | `cn()` e `formatLanguage()` |

## Fluxo de uma edição

```
input do usuário
  └─► handleUpdate()            (debounce ~800 ms)
        └─► store.updateResume(doc)
              ├─ createSnapshot(doc atual)     → resume:<id>:versions
              ├─ doc.version += 1
              ├─ doc.updatedAt = agora
              ├─ persistDoc(doc)               → resume:<id> (cifra se ativo)
              ├─ remove redo                   → resume:<id>:future
              └─ atualiza índice               → resumes:index
```

`persistDoc` devolve `false` quando a sessão cifrada está travada — nesse caso
o chamador **não** atualiza o índice, para UI e disco não divergirem.

## Escritas assíncronas

Criptografia em repouso é assíncrona (`crypto.subtle`). Para evitar que dois
saves se sobreponham e que um save tardio "ressuscite" um documento apagado:

- `writeChains: Map<id, Promise>` — uma fila por documento, ordem garantida.
- `deletedIds: Set<id>` — `cancelPendingWrites()` invalida o que está em voo
  antes de `hardDelete`/`wipeAll`.

O mesmo padrão existe em `secure.ts` para as chaves auxiliares.

## Sync (opt-in)

1. `createAccount(passphrase)` — gera `accountId` no cliente; a chave de
   cifra é derivada da passphrase (PBKDF2) e **nunca** sai do aparelho.
2. `syncNow()`:
   - **push** — lê cada doc pelo store (resolve o `plainCache`), cifra com
     `encryptDoc()` e envia. Docs ilegíveis (sessão travada) são pulados.
   - **pull** — decifra os blobs remotos e decide por documento com
     `decideMerge({local, remote, since})`.
   - `since` só avança quando o push pôde ser considerado bem-sucedido.
3. Conflito = **ambos** os lados mudaram desde o último sync. Nada é
   sobrescrito; o usuário escolhe e `resolveConflict` grava a escolha com
   `updatedAt` novo, para o servidor aceitar o upsert.

## Criptografia

Duas camadas independentes:

| Camada | Onde | Primitiva | Chave |
|---|---|---|---|
| Repouso no aparelho | `storage/crypto.ts` | AES-GCM-256 | derivada da frase-senha (PBKDF2, 150k), só em memória |
| Sync E2E | `sync/e2e.ts` | AES-GCM-256 | derivada da passphrase de sync (PBKDF2, 100k) |

Envelope em `hirewerk:crypto`: `{ salt, check }`. `check` é um texto fixo
cifrado — valida a passphrase sem guardar hash da chave. Não há recuperação.

## Build e deploy

```bash
cd apps/nuxt-web
npm run typecheck   # vue-tsc, 0 erros
npm run build       # Nitro
npm run generate    # estático em .output/public
npm run test:unit   # node --test (17 testes)
npm run test:a11y   # axe-core, 8 rotas × 2 temas
```

SPA fallback em `public/_redirects`. O Worker é deployado à parte
(`worker/wrangler.toml`) e a URL entra em `API_BASE` (`storage/keys.ts`).
