# HireWerk

Construtor de currículos com templates, preview em tempo real e exportação para PDF.

- **Status:** Em desenvolvimento (MVP com CRUD, Templates, Exportação PDF, Lixeira e navegação por setas/atalhos)
- **Stack:** Next.js (App Router) + TypeScript + Tailwind + Supabase
- **Licença:** MIT

Documentação detalhada: [docs/README.md](docs/README.md)

## Funcionalidades atuais

- CRUD de currículos e templates
- Preview e escolha de template
- Exportação de PDF:
  - GET `/api/resumes/[id]/export/pdf` (fluxo via navegador)
  - POST `/api/resumes/[id]/export/pdf` (programática)
  - Renderização SSR privada em `/export/render/[id]` com token assinado
- Histórico de exportações em `exports` (status, duração, erro, tamanho, checksum, versão do currículo)
- Lixeira de currículos:
  - Página `/resumes/trash`, Restaurar e Esvaziar lixeira, toasts, item no sidebar
- Navegação fluida por setas:
  - Setas visuais e atalhos de teclado (← →), respeitando contexto (não navega enquanto digita)
- Versionamento automático de currículos (trigger + snapshots em `resume_versions`)

## Como rodar (Bun)

No diretório `apps/web`:

```bash
bun install
cp .env.example .env.local  # configure as variáveis abaixo
bun run dev
```

### Variáveis de ambiente importantes

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — frontend
- `SUPABASE_SERVICE_ROLE_KEY` (se aplicável a ações server-side específicas)
- `EXPORT_TOKEN_SECRET` — assina o token do render SSR de PDF
- Para PDF headless em dev/produção local: informe um navegador
  - `CHROME_PATH` ou `PUPPETEER_EXECUTABLE_PATH` apontando para Chrome/Edge/Chromium

Se necessário, veja detalhes em `docs/README.md`.
