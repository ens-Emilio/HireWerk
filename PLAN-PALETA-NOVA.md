# Plano — Nova Paleta "Carbono & Laranja Queimado" (substitui Índigo & Amarelo)

> Aprovação prévia: contraste WCAG verificado numericamente (abaixo).
> Duração estimada: 1 sessão. Nenhum layout muda — só tokens + ~10 hardcodes órfãos.

---

## 0. Verificação de contraste da paleta nova (feita antes do plano)

| Par | Ratio | AA (4.5) | Large-text (3.0) |
|---|---|---|---|
| Light fg `#1E1E24` / bg `#FAFAFA` | 15.89 | ✓ | ✓ |
| Light **primary-fg `#FAFAFA` / laranja `#EA580C`** | **3.41** | ✗ | ✓ |
| Light muted-fg `#6B6A78` / bg | 5.08 | ✓ | ✓ |
| Light secondary verde `#3B7A57` / bg | 4.90 | ✓ | ✓ |
| Light destructive `#DC2626` / bg | 4.63 | ✓ | ✓ |
| Dark fg `#FAFAFA` / bg `#121216` | 17.90 | ✓ | ✓ |
| Dark **primary-fg `#121216` / laranja `#F97316`** | **6.67** | ✓ | ✓ |
| Dark muted-fg `#9D9DAE` / bg | 7.00 | ✓ | ✓ |
| Dark secondary `#56A378` / bg | 6.14 | ✓ | ✓ |

**Única decisão de design**: no light, `#FAFAFA` sobre o laranja dá 3.41 — falha AA para texto normal (4.5) e passa só como large-text (botões bold ✓). **Fix**: `--primary-foreground` no light vira `#1E1E24`-escuro? Não — 4.66 ✓ passaria, mas inverte a identidade do botão (texto escuro sobre laranja queimado fica sujo). **Adotado**: manter `#FAFAFA` no light (botões são large-text; nenhum texto normal de corpo usa bg-primary) + `accent-hover` escurecido para `#c2410c` (4.96 no hover, mantém o botão AA no estado interativo). O axe-core do CI valida no fim — se o axe apontar texto normal sobre laranja, escurecemos o fg aí.

---

## 1. Tokens (`app/assets/css/main.css`) — o núcleo

Substituir os dois blocos inteiros (`:root` e `.dark`):

**Light**: background `0 0% 98%` · foreground `240 9% 13%` · primary/accent `21 90% 48%` com fg `0 0% 98%` · secondary/ring `147 35% 35%` · muted `240 7% 96%` · muted-fg `244 6% 44%` · destructive `0 72% 51%` (+soft `0 93% 94%`) · success `142 76% 36%` (+soft `138 76% 93%`) · border/input `240 8% 90%` · border-soft `240 8% 93%` · surface `18 100% 96%` (fg = foreground) · card/popover branco.

**Dark**: background `240 10% 8%` · foreground `0 0% 98%` · primary/accent `25 95% 53%` com fg `240 10% 8%` · secondary/ring `146 31% 49%` · muted `240 12% 15%` · muted-fg `242 10% 65%` · destructive `0 91% 71%` (+soft `0 38% 17%`) · success `142 70% 58%` (+soft `145 45% 15%`) · border/input `240 11% 19%` · border-soft `240 11% 16%` · surface `15 13% 13%` (fg = foreground) · card/popover `240 11% 12%`.

Extras no mesmo commit:
- `--destructive-foreground` no light: trocar branco por `#FAFAFA` (consistência).
- `--secondary-foreground`: **branco puro** no light (5.11 sobre o verde, melhor que 4.90 do #FAFAFA); no dark, `240 10% 8%` (6.14 ✓).

## 2. Tailwind (`tailwind.config.ts`) — hardcodes órfãos viram tokens

- `rose-soft` → **remover** (sem consumidor fora do índice) ou re-mapear p/ `--destructive-soft` se algum consumidor aparecer.
- `teal-soft`, `coral-soft` → remover (mesmo critério).
- `accent-hover` `#f5c414` → `#c2410c` (laranja queimado escurecido; 4.96 AA no hover).
- `boxShadow.raised` `rgba(23, 21, 58, 0.14)` → `rgba(30, 30, 36, 0.14)` (sombra neutra carbono).
- Manter `success`/`success-soft`/`danger` mapeados em vars (já são).

## 3. Ícones de accent por doc (editor + StyledA4) — paleta de personalização

`ACCENT_CHOICES` (`[id].vue`) e `ACCENTS` (`StyledA4.vue`) — 8 cores idênticas nos dois arquivos. Re-espelhar a nova paleta:

```ts
blue: '#2563eb', green: '#16a34a', violet: '#7c3aed', rose: '#e11d48',
orange: '#ea580c', teal: '#0d9488', red: '#dc2626', ink: '#1e1e24',
```

(`''` continua = accent do DS, que agora é o laranja.)

## 4. Hardcodes órfãos por arquivo

| Arquivo | O quê | Ação |
|---|---|---|
| `templates/CreativeTemplate.vue` | sidebar `#17153a`, chips `#ffd02f`, títulos `#4a5df9` | sidebar → `#1e1e24`; chips → `--doc-accent`-based (laranja) ou `bg-surface text-foreground`; títulos → `#ea580c` |
| `pages/index.vue` (mockup 3D do hero) | `#6b67a0`, chips pastel `#fff7d6/#ffe3f3/#d8f6f2`, `.a4-face` branco/`#fdfcff`, `.a4-line` `#e9e7f6` | mockup é decorativo mas deve casar com o app: chips → tons da nova paleta (`#FFF1EB`, `#DCFCE7`, `#F4F4F6`), linhas → `#E4E4E8`, texto → `#6B6A78`, face dark → `#1B1B22` |
| `resume/A4Paper.vue` | `background: white; color: #1a1a1a` | **não mexer** (folha de impressão real é branca; contraste 16+ ok) |
| `public/logo-hirewerk.svg` | `#17153a` + `#ffd02f` + `#e9e7f6` | regenerar: símbolo → laranja `#EA580C` + carbono `#1E1E24` |
| `nuxt.config.ts` manifest | `theme_color: '#ffd02f'` | → `#EA580C` (barra do PWA) |
| favicon.ico | binário amarelo | regenerar a partir do logo novo (boto na lista; se não houver pipeline, sinalizo) |

## 5. CSS do DS fora dos tokens (`main.css`)

- `.a4-page .chip` e demais regras usam vars — nada a fazer.
- Buscar `hsl(var(--` fora de padrão / rgba hardcoded em `main.css` — `box-shadow` do `shadow-raised` já coberto no item 2.
- Seletores `text-primary`, `bg-primary` etc. herdam automaticamente (nada a fazer — essa é a vantagem da paleta em tokens).

## 6. Verificação (a mesma barra de sempre)

1. `bun run typecheck` — 0 erros.
2. `bun run generate` + `bun run test:a11y` — **axe em todas as rotas, ambos os temas** (o script atual testa o tema default; estender: rodar 2× com `document.documentElement.classList.toggle('dark')`).
3. Contraste numérico dos pares novos (já feito acima; re-executar nos soft-badges: `text-success` sobre `success-soft`, `text-destructive` sobre `destructive-soft`).
4. Screenshot light + dark da home e do editor (a olho: laranja como guia, verde como secundário, zero amarelo remanescente).
5. `grep` final: `#ffd02f`, `#4a5df9`, `#17153a`, `#6b67a0` → **0 ocorrências** fora do git history.
6. Redeploy Pages (deploy direto, como de costume) + commit/push.

## 7. O que não muda

- A4Paper (folha de impressão branca real).
- Estrutura de layout, componentes, radius `0.875rem` (a paleta nova mantém).
- Paleta de accent *por doc* do usuário (só re-espelhada nos novos tons).
- Dark mode toggle, tokens de spacing/typography.

---

**Riscos**: (1) axe pode apontar texto normal sobre laranja em algum componente — correção pronta: escurecer `--primary-foreground` do light para `#1e1e24` (4.66); (2) logo novo muda identidade visual do ícone — se preferir manter o logo atual amarelo por enquanto, corta só o item 4-logo/favicon do escopo.
