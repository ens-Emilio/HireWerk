# Desenvolvimento — HireWerk

## Requisitos

- **Node 22+** (o CI usa 22; `pdfjs-dist@6` e `puppeteer-core@25` exigem ≥22, e
  o Node 20 quebra o `vue-tsc` 3 com erros TS fantasma).
- npm (o CI usa npm) ou Bun.

## Comandos

```bash
cd apps/nuxt-web

npm install
npm run dev         # http://localhost:4000 (cai para 3000 se ocupada)
npm run typecheck   # vue-tsc --noEmit
npm run build       # Nitro
npm run generate    # estático em .output/public
npm run test:unit   # node --test tests/v3.test.ts
npm run test:a11y   # axe-core nas 8 rotas, light + dark
```

`test:a11y` precisa de Chromium instalado (`sudo apt install chromium` no
Linux). Ele sobe o build gerado, então rode `generate` antes se mudou algo.

## Convenções

### i18n

Nenhuma string visível hardcoded. Toda chave existe **nos dois** dicionários
(`pt` e `en` em `app/lib/i18n.ts`) — o conjunto de chaves tem de ser idêntico.
Verificação rápida:

```bash
node -e "
const s=require('fs').readFileSync('app/lib/i18n.ts','utf8');
const k=x=>new Set([...x.matchAll(/^\s*'([^']+)':/gm)].map(m=>m[1]));
const pt=k(s.split('const en: Dict')[0]), en=k(s.split('const en: Dict')[1]);
console.log('pt',pt.size,'en',en.size,'diff',[...pt].filter(x=>!en.has(x)));
"
```

Interpolação usa `{nome}`: `t('toast.backupImported', { n: 3 })`.

### Componentes

- UI base em `app/components/ui/` (Button, Card, Input, Badge, Tooltip,
  AlertDialog, Separator, Textarea) — no estilo shadcn, sem dependência externa.
- Templates de currículo em `app/components/templates/` — cada um recebe
  `data: ResumeData` e renderiza A4. **Sempre** guarde arrays opcionais:
  `(props.data.emails ?? [])`. Um `.map()` em `undefined` derruba o render e
  congela a navegação do Nuxt.
- `formatLanguage()` para idiomas (aceita string ou objeto).

### Acessibilidade

O CI falha em violação `critical`/`serious`. Regras práticas:

- Todo `<button>` só com ícone precisa de `aria-label`.
- Alvos de toque ≥ 32 px (ideal 44). `min-h-11` nos links de navegação.
- Contraste AA: o laranja puro não passa como texto pequeno no tema claro —
  use `text-secondary` ou a variante escurecida já definida.

### Layout

- A raiz do layout é `flex flex-col min-h-screen` e `<main>` é `flex-1` — é
  isso que mantém o footer no fim em páginas curtas. Não remova.
- Colunas dentro de grid precisam de `min-w-0`, senão o `min-content` do
  conteúdo estoura o viewport em telas estreitas.
- Breakpoint da nav desktop é `lg` (1024 px): em 768 px logo + 6 links + 2
  botões não cabem.

### Escritas no localStorage

Nunca chame `writeJson` direto para um documento. Use `store.updateResume()`
(bumpa versão, cria snapshot, atualiza índice) ou `persistDoc()` (respeita a
criptografia e a fila de escrita). Para chaves auxiliares, `writeSecureJson`.

## Testes

`tests/v3.test.ts` cobre lógica pura: merge de sync, ATS, diff, linter, carta,
JSON Resume. Funções que recebem `t` (tradução) recebem um stub nos testes:

```ts
const t = (key: string) => key
```

Novos testes devem pegar bugs que o consumidor veria — não testar wiring nem
texto de implementação.

## Estrutura de arquivos

```
apps/nuxt-web/
├── app/
│   ├── assets/css/main.css      # tokens de design (light/dark)
│   ├── components/              # UI base, templates, editor, PWA
│   ├── composables/             # useI18n, useTheme, useSectionOrder
│   ├── layouts/default.vue      # header, footer, nav mobile
│   ├── lib/                     # lógica pura (ver ARCHITECTURE.md)
│   ├── pages/                   # rotas
│   └── stores/                  # Pinia
├── public/                      # ícones, _redirects, share-target-sw.js
├── scripts/test-a11y.mjs
├── tests/v3.test.ts
└── worker/                      # Cloudflare Worker + D1
```

## Deploy

**Frontend** (Cloudflare Pages):

```bash
npm run generate
npx wrangler pages deploy .output/public --project-name hirewerk --branch main
```

**API** (opcional):

```bash
cd worker
npx wrangler d1 create hirewerk-db     # cole o id em wrangler.toml
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

Depois aponte `API_BASE` em `app/lib/storage/keys.ts`. Sem isso o app funciona
100% offline — a API é opt-in.
