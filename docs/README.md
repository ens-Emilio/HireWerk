# HireWerk - Documentação Técnica (Nuxt.js)

## Visão Geral

HireWerk é uma aplicação SPA (Single Page Application) construída com Nuxt 4 que permite criar, gerenciar e exportar currículos inteiramente no navegador.

## Arquitetura

### Client-Side First

- **Framework:** Nuxt 4 (SSR: false)
- **Persistência:** localStorage
- **Estado:** Pinia

### Estrutura de Dados

Os dados são armazenados no localStorage com validação Zod 4.

```ts
// Schema do Currículo
interface ResumeDoc {
  id: string
  title: string
  templateId: string // 'classic' | 'minimal' | 'modern'
  data: ResumeData   // Campos do currículo
  version: number    // Auto-incremento
  updatedAt: string  // ISO date
  deletedAt: string | null // Soft delete
}
```

## Fluxos Principais

### Criação de Currículo

1. `store.createResume()` gera um UUID v4.
2. Salva o documento inicial em `hirewerk:resume:{id}`.
3. Adiciona entrada no índice `hirewerk:resumes:index`.

### Auto-Save e Versionamento

1. Usuário edita campos no Editor.
2. Observador (watcher) dispara `store.updateResume()` com debounce de 500ms.
3. Versão anterior é salva como snapshot em `hirewerk:resume:{id}:versions`.
4. Versão atual é incrementada e salva.

### Exportação PDF

1. `store.exportPdf(id)` aciona `window.print()`.
2. CSS `@media print` formata a página para A4.
3. Elementos de UI (sidebar, botões) são ocultados.
4. Navegador gera o PDF nativamente.

## Componentes

### Editor

O Editor (`pages/resumes/[id].vue`) combina formulários reativos com preview em tempo real.
Utiliza **componentes dinâmicos** para renderizar o template escolhido:

```vue
<component :is="currentTemplate" :data="resume.data" />
```

### Templates

Templates são componentes Vue puros que recebem `data` via props.
Localizados em `components/templates/`.

- `ClassicTemplate.vue`
- `MinimalTemplate.vue`
- `ModernTemplate.vue`

## Deploy (Netlify)

Configurado via `netlify.toml`:

```toml
[build]
  command = "bun run build"
  publish = ".output/public" # Output estático do Nuxt
```

Build command gera arquivos estáticos prontos para CDN.
