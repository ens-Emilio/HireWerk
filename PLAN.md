# 📐 Plano — Portar o Design System do protótipo para o app Nuxt (paridade total)

> Fonte: conversa OpenDesign (protótipo `hirewerk-design-system.html` + `logo-hirewerk.svg` + `logo-hirewerk-lockup.svg`).
> Base atual: Tailwind v3 + tokens HSL shadcn em `app/assets/css/main.css`, `darkMode: ['class']`.
> Contraste validado (WCAG AA): todos os 11 pares passam (4.59–16.21).

## Direção visual (resumo da conversa)

- **Papel branco quente** (`#fffdf5`), **tinta índigo-quase-preta** (`#17153a`), **amarelo ensolarado** `#ffd02f` como ÚNICO accent de ação
- **Azul** `#4a5df9` só para links/wordmark; acentos pastel por contexto (success/danger/coral/teal/rose soft)
- Tipografia: **Sora** (display) + **Noto Sans** (corpo) — substitui Plus Jakarta Sans
- Raios generosos (8/14/22px), sombra de anel leve `0 0 0 1px border`, motion `220ms cubic-bezier(.22,1,.36,1)`
- 3D funcional: folha A4 com tilt que segue o cursor no hero da landing
- Copy de produto sem jargões (o protótipo já traz os textos prontos, pt-BR)

## Decisões de port

| Protótipo | App Nuxt | Motivo |
|---|---|---|
| `--bg`, `--fg`, `--accent`… (hex) | **Tokens shadcn HSL existentes, re-valued** | Zero mudança de API nas classes Tailwind (`bg-background`, `text-foreground`… continuam); paridade total sem reescrever 12 componentes |
| `data-theme="dark"` | `.dark` no `<html>` (atual) | Tailwind `darkMode: ['class']` já configurado; script anti-FOUC só troca de atributo |
| `<dialog>` nativo | AlertDialog radix-vue existente | Já em uso na lixeira; re-estilizar com os novos tokens |
| `.panel` por abas | Páginas reais (rotas já existem) | SPA multi-rota, não showcase |
| Sora/Noto via Google Fonts | `<link>` no `nuxt.config.ts` head | Mesmo mecanismo atual |
| SVGs `logo-hirewerk*.svg` | `public/` + componente `AppLogo.vue` | Uso no layout e landing |

## Fases

### F1 — Tokens (fundação, ~1 arquivo + config)
1. `main.css`: substituir os valores HSL em `:root`/`.dark` pelos novos (convertidos de hex para HSL, mantendo os NOMES das variáveis):
   - light: `background 45 100% 98%` (#fffdf5), `foreground 244 45% 16%` (#17153a), `primary 47 100% 59%` (#ffd02f), `primary-foreground 244 45% 16%`, `accent` (mantém amarelo como secondary-accent), `secondary` azul `233 94% 64%` (#4a5df9) com `secondary-foreground` branco, `surface 45 100% 96%` (#fff7d6), `muted-foreground 246 16% 44%` (#5d5a80), `destructive 0 58% 47%` (#c22f2f), `success 152 79% 27%` (#0e7a4a), `border 244 39% 92%`, `ring 233 94% 64%`, `radius` em `--r-*` novos (0.5rem/0.875rem/1.375rem)
   - dark: `background 250 32% 11%` (#131126), `surface 246 33% 16%` (#1c1936), `foreground 250 100% 97%` (#f2f0ff), `primary` amarelo mantém, `secondary 229 100% 74%` (#7b8bff) com foreground escuro, `muted-foreground 248 26% 71%` (#a49fcd), `destructive 0 100% 77%` (#ff8a8a), `success 149 55% 55%` (#4ccf95)
2. `tailwind.config.ts`: fontFamily `display: ['Sora'…]`, `sans: ['Noto Sans'…]`; remover keyframes accordion (componente deletado) e manter `tailwindcss-animate`
3. `nuxt.config.ts` head: trocar link de fonte para Sora + Noto Sans
4. `useTheme.ts`/script anti-FOUC: inalterados (mesma chave, mesma lógica)

### F2 — Logo + Layout (2 arquivos novos + 1 edit)
5. Copiar `logo-hirewerk.svg` e `logo-hirewerk-lockup.svg` para `public/` (fonte: conversa OpenDesign, já baixados)
6. Novo `components/AppLogo.vue`: `<img src="/logo-hirewerk.svg">` + slot opcional de wordmark
7. `layouts/default.vue`: header usa `AppLogo` (substitui quadradinho com ícone lucide); footer e bottom-nav mantêm estrutura, só recebem os novos tokens via classes existentes
8. Landing `index.vue`: hero em grid 2 colunas; à direita a **folha A4 3D** (novo `components/A4Hero.vue` com `perspective`, tilt por mousemove ±26°/±18°, `prefers-reduced-motion` respeitado); copy nova do protótipo ("O currículo pronto em minutos, não em horas", kicker "Grátis, sem cadastro…", cards de benefício reescritos)

### F3 — Componentes base (edits pontuais)
9. `ui/button` → variantes mapeadas: `default`=btn-primary (amarelo), nova `blue`=btn-blue, `outline`=btn-ghost, `destructive`=btn-danger; `min-h-11` (44px), `active:translate-y-px`
10. `ui/badge` → variants `success` (badge-save), `sample` (badge-sample), `destructive` (badge-del) — usados no editor (Salvo/Salvando) e lixeira
11. `ui/card` → raio `--r-lg` (22px) + `shadow-ring` (`0 0 0 1px var(--border)`) em vez de sombra difusa
12. `ui/input`/`textarea` → `min-h-[46px]`, `focus-visible: border-blue` (via `--ring`)
13. `ui/tooltip`/`alert-dialog` → apenas herdam tokens novos (sem mudança estrutural)

### F4 — Telas (paridade 1:1 com o protótipo)
14. `dashboard.vue`: 3 métricas ("currículos prontos", "na lixeira, recuperável", "100% privado…") + 2 shortcuts com hover `translateY(-2px) rotate(-0.3deg)` + sombra raised
15. `resumes/index.vue`: cards com **thumb de miniatura** (linhas fictícias como no protótipo), meta "moderno · atualizado hoje", ações visíveis em botões (não só hover) — copy: "Novo currículo", "Editar"
16. `resumes/[id].vue`: toolbar com badge Salvo (success-soft) / Salvando… (sample); seções colapsáveis com chevron rotativo; item-row com borda; **Experiência com Início/Fim separados** (protótipo tem `f-inicio`/`f-fim` — mapear para `period` existente: um input "Período" OU dois inputs compostos em `period`; decisão: manter 1 campo `period` com placeholder "2022 — atual" para não quebrar schema); zoom 50–100 com `<output>`; preview-shell em `surface-warm`
17. `resumes/trash.vue`: linhas com "removido em 4 de novembro de 2025" (`Intl.DateTimeFormat` long), botões Restaurar (ghost) + Excluir de vez (danger-soft); empty state com glyph "H"
18. `templates.vue`: previews A4 reais escalados (já implementado na revisão anterior) + fundos pastel por template (warm/rose/teal) + descrições de produto ("Estrutura tradicional, seguro para processos formais")
19. `view.vue`: card de erro "Este link não contém um currículo válido. Peça um novo link a quem compartilhou." + A4 centrado + footer "Criado com HireWerk · ao imprimir esta tela, sai apenas a página A4"
20. Toasts: revisar textos para copy de produto ("Cópia de segurança salva" em vez de "JSON exportado")

### F5 — Detalhes de UX do protótipo
21. Focus ring global: `box-shadow: 0 0 0 3px rgba(74,93,249,.45)` no `:focus-visible` (substitui outline atual)
22. `@media (prefers-reduced-motion: reduce)`: matar animações/transitions globalmente
23. Print CSS: inalterado (já corrigido na revisão)
24. PWA manifest: `theme_color` amarelo `#ffd02f` (era azul), icons → logo nova (gerar 192/512 a partir do SVG)

## Copy pronta (do protótipo, colar como está)

- Landing kicker: "Grátis, sem cadastro, e seus dados ficam só com você"
- H1: "O currículo pronto em minutos, não em horas"
- Lede: "Escreva, escolha o visual e compartilhe um link bonito. Tudo funciona no seu aparelho: nada é enviado para servidores, nada é vendido, nada desaparece."
- CTA1: "Criar meu primeiro currículo" · CTA2: "Explorar os modelos"
- Benefício principal: "Seus dados são só seus — Não existe servidor para vazar nada…"
- Benefício 2: "Salva sozinho, sempre — …recupere qualquer versão anterior, mesmo depois de fechar a página."
- Benefício 3: "Sai exatamente como você vê — Um clique e o PDF sai limpo: só a folha, sem menus nem botões."
- Dashboard: "Olá 👋 seu painel" / métricas: "currículos prontos", "na lixeira, recuperável", "100% privado: nada sai do seu aparelho"
- Editor JSON → "Salvar cópia" + toast "Cópia de segurança salva"
- Viewer erro: "Este link não contém um currículo válido. Peça um novo link a quem compartilhou."
- Diálogo excluir: "…será apagado junto com o histórico de versões. Isto não pode ser desfeito."

## Verificação (por fase)

- F1: `bun run typecheck` + visual: todas as páginas com tokens novos, dark mode sem flash
- F2: screenshot landing (3D tilt funcional, logo nova); logo renderiza claro/escuro
- F3–F4: smoke E2E Chromium — criar, editar, undo/redo+reload, share roundtrip, lixeira, templates; screenshots de cada tela claro/escuro
- F5: tab-cycle foco visível; `matchMedia('print')` não esconde template; manifest atualizado

## Fora de escopo (explícito)

- Sem backend, sem mudança de schema/rotas — o versionamento e o storage atuais ficam intactos
- Protótipo continua sendo a referência viva (não substitui `MAPEAMENTO-TELAS.md`)
