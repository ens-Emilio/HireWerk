# Modelo de dados — HireWerk

Tudo é validado por **Zod** em `app/lib/storage/schema.ts`. Os schemas são a
fonte da verdade: os tipos TypeScript são inferidos deles.

## Princípio: tolerância a dados inesperados

Enums usam `.catch(padrão)` em vez de `.default()`. Um valor desconhecido
(import de outra versão, JSON Resume, sync de um aparelho mais novo) cai no
padrão em vez de invalidar o documento inteiro. Antes, um único `label`
inesperado tornava o currículo ilegível.

## Chaves do localStorage

| Chave | Conteúdo | Cifrável |
|---|---|---|
| `hirewerk:meta` | `{ version, createdAt, lastMigration }` | não |
| `hirewerk:resumes:index` | `ResumeIndexItem[]` — lista leve | não |
| `hirewerk:resume:<id>` | `ResumeDoc` completo | **sim** |
| `hirewerk:resume:<id>:versions` | `VersionSnapshot[]` (máx. 30) | **sim** |
| `hirewerk:resume:<id>:future` | `ResumeDoc[]` — pilha de redo | **sim** |
| `hirewerk:templates` | `TemplateList` | não |
| `hirewerk:settings` | `Settings` | não |
| `hirewerk:applications` | `Application[]` | não |
| `hirewerk:account` | credenciais locais do sync | não |
| `hirewerk:sync-since` | ISO do último pull | não |
| `hirewerk:crypto` | `{ salt, check }` | não |
| `hirewerk:shares` | links curtos/publicações deste aparelho | não |

## `ResumeDoc`

```ts
{
  id: string            // uuid
  title: string
  kind: 'resume' | 'coverLetter'
  templateId: string
  style: {
    accentColor: string          // '' = accent do template
    fontScale: 'compact' | 'normal' | 'large'
    density: 'compact' | 'normal' | 'relaxed'
    paper: 'a4' | 'letter'
    footerText: string
    iconTheme: 'none' | 'outline' | 'filled'
    sectionOrder: string[]
  }
  data: ResumeData
  coverLetter: { body, company, role, tone: 'formal' | 'direto' | 'caloroso' }
  jobDescription: string
  atsHistory: { at, score, jobDescription, missing[] }[]   // máx. 20
  locale: string
  version: number
  tags: string[]
  pinned: boolean
  jobTitle: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
```

## `ResumeData`

```ts
{
  name, headline, summary, location: string
  photo: string | null                 // base64 JPEG ≤ 400px

  emails, phones: { value, label, type: 'email' | 'phone' }[]
  links: { label, url, kind: 'linkedin' | 'github' | 'portfolio' | 'other' }[]

  experiences: { role, company, period, description }[]
  education:   { course, institution }[]
  projects:    { name, stack, description, url }[]
  certifications: { name, issuer, year }[]
  volunteer:   { role, org, period, description }[]

  skills, softSkills: string[]
  languages: (string | { name, level: 'A1'…'C2' | 'nativo' })[]

  // Campos opcionais BR — visíveis só quando showOptionalBR
  birthDate, maritalStatus, salaryExpectation: string
  showOptionalBR: boolean
}
```

`languages` aceita string **ou** objeto por compatibilidade: currículos antigos
guardavam texto livre. Sempre renderize com `formatLanguage()` (`lib/utils.ts`).

## `ResumeIndexItem`

Cópia leve usada pela lista — evita ler todos os documentos para desenhar a
tela. Contém `id, title, kind, templateId, tags, pinned, jobTitle, updatedAt,
deletedAt`. O documento completo só é lido ao abrir o editor.

## `Application`

```ts
{
  id, company, role
  status: 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected'
  appliedAt, followUpAt: string   // YYYY-MM-DD ou ''
  resumeId, url, notes: string
  createdAt, updatedAt: string
}
```

`appliedAt`/`followUpAt` têm regex de data: `dueFollowUps()` compara strings
lexicalmente, então formato livre daria resultado silenciosamente errado.

## `VersionSnapshot`

```ts
{ version: number, data: ResumeData, createdAt: string, label: string | null, note: string | null }
```

Máximo de 30 por currículo (FIFO). O primeiro save do dia cria um snapshot
automático com label `📊 <data>`.

## Migrações

`runMigrations()` roda antes do store ler qualquer coisa. É idempotente e
**nunca** sobrescreve dados válidos com vazio:

- Índice é parseado **item a item** — uma entrada corrompida não zera a lista.
- Settings são mesclados **campo a campo** — um valor fora do enum não reseta
  tema/locale/template padrão.
- Documentos que falham o parse são removidos do índice (não ficam como item
  fantasma que abre em branco) e registrados no console.

## Quota

`localStorage` tem ~5 MB. `writeJson` captura `QuotaExceededError`, dispara o
evento `hirewerk:quota` (o `QuotaBanner` escuta) e propaga o erro — nunca falha
em silêncio.
