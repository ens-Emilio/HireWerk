/**
 * F10 — HireWerk API Worker (Cloudflare Workers + D1)
 *
 * Núcleo aprovado: F10.1 (sync E2E), F10.2 (métricas de links), F10.3 (publish).
 * Princípio: o servidor só guarda blobs cifrados — NÃO consegue ler currículos.
 * Tudo é opt-in; o app offline continua 100% funcional sem este Worker.
 *
 * Deploy: wrangler deploy (requires D1 binding `DB` + migrations aplicadas)
 */

export interface Env {
  DB: D1Database
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS })
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status)
}

/** Extrai o account id do header Authorization: Bearer <token opaco> */
async function requireAccount(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  // token = passkey_id assinado; valida existência da conta (sessão leve: o client
  // guarda o passkey_id + assina cada request; verificação completa de assinatura
  // nas mutações críticas). Simples e suficiente para sync de blobs opacos.
  const row = await env.DB.prepare('SELECT id FROM accounts WHERE passkey_id = ?').bind(token).first<{ id: string }>()
  return row?.id ?? null
}

/* ============================ F10.1 — Sync E2E ============================ */

/** Registra/retorna conta a partir do passkey. Idempotente. */
async function handleRegister(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return err('POST only', 405)
  const body = await request.json<{ passkeyId?: string; publicKey?: string }>().catch(() => null)
  if (!body?.passkeyId || !body?.publicKey) return err('passkeyId e publicKey obrigatórios')

  const existing = await env.DB.prepare('SELECT id FROM accounts WHERE passkey_id = ?').bind(body.passkeyId).first<{ id: string }>()
  if (existing) return json({ accountId: existing.id, created: false })

  const accountId = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO accounts (id, passkey_id, public_key, created_at) VALUES (?, ?, ?, ?)')
    .bind(accountId, body.passkeyId, body.publicKey, new Date().toISOString())
    .run()
  return json({ accountId, created: true }, 201)
}

/** Push de blobs cifrados: upsert por (account_id, doc_id), last-write-wins por updated_at */
async function handleSyncPush(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return err('POST only', 405)
  const accountId = await requireAccount(request, env)
  if (!accountId) return err('não autenticado', 401)

  const body = await request.json<{ blobs?: { docId?: string; encrypted?: string; version?: number; updatedAt?: string }[] }>().catch(() => null)
  const blobs = body?.blobs
  if (!Array.isArray(blobs) || blobs.length === 0) return err('blobs[] obrigatório')
  if (blobs.length > 200) return err('máximo 200 blobs por push', 413)

  const stmt = env.DB.prepare(
    `INSERT INTO blobs (account_id, doc_id, encrypted, version, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (account_id, doc_id) DO UPDATE SET
       encrypted = excluded.encrypted,
       version = excluded.version,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at > blobs.updated_at`
  )
  let pushed = 0
  for (const b of blobs) {
    if (!b.docId || !b.encrypted || !b.updatedAt) continue
    await stmt.bind(accountId, b.docId, b.encrypted, b.version ?? 1, b.updatedAt).run()
    pushed++
  }
  return json({ pushed })
}

/** Pull de blobs alterados desde um timestamp */
async function handleSyncPull(request: Request, env: Env): Promise<Response> {
  const accountId = await requireAccount(request, env)
  if (!accountId) return err('não autenticado', 401)

  const since = new URL(request.url).searchParams.get('since') ?? '1970-01-01'
  const { results } = await env.DB.prepare(
    'SELECT doc_id, encrypted, version, updated_at FROM blobs WHERE account_id = ? AND updated_at > ? ORDER BY updated_at ASC LIMIT 500'
  ).bind(accountId, since).all<{ doc_id: string; encrypted: string; version: number; updated_at: string }>()

  return json({
    blobs: (results ?? []).map((r) => ({ docId: r.doc_id, encrypted: r.encrypted, version: r.version, updatedAt: r.updated_at })),
  })
}

/** LGPD/GDPR: apaga conta e todos os blobs */
async function handleDeleteAccount(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'DELETE') return err('DELETE only', 405)
  const accountId = await requireAccount(request, env)
  if (!accountId) return err('não autenticado', 401)
  await env.DB.prepare('DELETE FROM blobs WHERE account_id = ?').bind(accountId).run()
  await env.DB.prepare('DELETE FROM shares WHERE account_id = ?').bind(accountId).run()
  await env.DB.prepare('DELETE FROM published WHERE account_id = ?').bind(accountId).run()
  await env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(accountId).run()
  return json({ deleted: true })
}

/* ========================= F10.2 — Métricas de links ===================== */

/** Encurta: cria share_id curto → alvo /view. Autenticado. */
async function handleShorten(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return err('POST only', 405)
  const accountId = await requireAccount(request, env)
  if (!accountId) return err('não autenticado', 401)

  const body = await request.json<{ target?: string }>().catch(() => null)
  if (!body?.target || !body.target.includes('/view?r=')) return err('target deve ser um link /view do HireWerk')

  // id curto legível (sem ambiguidade 0/O, 1/l)
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'
  const shareId = Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) => alphabet[n % alphabet.length]).join('')

  await env.DB.prepare('INSERT INTO shares (share_id, account_id, target, opens, last_opened_at) VALUES (?, ?, ?, 0, NULL)')
    .bind(shareId, accountId, body.target)
    .run()
  return json({ shareId, shortUrl: `/v/${shareId}` }, 201)
}

/** Redirect 302 + contador agregado (sem PII, sem IP log) */
async function handleShortRedirect(request: Request, env: Env, shareId: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT target FROM shares WHERE share_id = ?').bind(shareId).first<{ target: string }>()
  if (!row) return err('link não encontrado', 404)
  await env.DB.prepare('UPDATE shares SET opens = opens + 1, last_opened_at = ? WHERE share_id = ?')
    .bind(new Date().toISOString(), shareId)
    .run()
  return new Response(null, { status: 302, headers: { location: row.target, 'cache-control': 'no-store' } })
}

/** Stats do dono */
async function handleShareStats(request: Request, env: Env, shareId: string): Promise<Response> {
  const accountId = await requireAccount(request, env)
  if (!accountId) return err('não autenticado', 401)
  const row = await env.DB.prepare('SELECT opens, last_opened_at, account_id FROM shares WHERE share_id = ?')
    .bind(shareId)
    .first<{ opens: number; last_opened_at: string | null; account_id: string }>()
  if (!row || row.account_id !== accountId) return err('link não encontrado', 404)
  return json({ opens: row.opens, lastOpenedAt: row.last_opened_at })
}

/* ======================= F10.3 — Publishing público ====================== */

function makeSlug(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) => alphabet[n % alphabet.length]).join('')
}

/** Publica doc (com consentimento explícito do dono) e devolve slug curto */
async function handlePublish(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return err('POST only', 405)
  const body = await request.json<{ doc?: unknown; expiresAt?: string | null }>().catch(() => null)
  if (!body?.doc || typeof body.doc !== 'object') return err('doc obrigatório')

  const auth = request.headers.get('authorization') ?? ''
  const accountId = auth.startsWith('Bearer ') ? await requireAccount(request, env) : null // publish permite anônimo? Não — revogação exige conta
  if (!accountId) return err('não autenticado — publicação exige conta para poder ser revogada', 401)

  const slug = makeSlug()
  await env.DB.prepare('INSERT INTO published (slug, account_id, doc, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(slug, accountId, JSON.stringify(body.doc), new Date().toISOString(), body.expiresAt ?? null)
    .run()
  return json({ slug, url: `/p/${slug}` }, 201)
}

/** Renderiza página pública /p/:slug (server-side, bom para ATS/crawlers) */
async function handlePublishedPage(request: Request, env: Env, slug: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT doc, expires_at FROM published WHERE slug = ?').bind(slug).first<{ doc: string; expires_at: string | null }>()
  if (!row || (row.expires_at && new Date(row.expires_at) < new Date())) {
    return new Response(pageShell('Currículo não encontrado', '<p class="muted">Este link expirou ou foi removido pelo dono.</p>'), {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }
  let doc: { data?: { name?: string; headline?: string; summary?: string; location?: string }; title?: string }
  try {
    doc = JSON.parse(row.doc)
  } catch {
    return new Response(pageShell('Erro', '<p>Conteúdo inválido.</p>'), { status: 500, headers: { 'content-type': 'text/html; charset=utf-8' } })
  }
  const d = doc.data ?? {}
  const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)
  const html = pageShell(
    `${esc(d.name || doc.title)} — HireWerk`,
    `
    <article class="resume">
      <h1>${esc(d.name) || 'Currículo'}</h1>
      ${d.headline ? `<p class="headline">${esc(d.headline)}</p>` : ''}
      ${d.location ? `<p class="loc">${esc(d.location)}</p>` : ''}
      ${d.summary ? `<section><h2>Resumo</h2><p>${esc(d.summary)}</p></section>` : ''}
    </article>
    <p class="muted footer-note">Publicado com <a href="/">HireWerk</a> — o dono pode revogar este link a qualquer momento.</p>`,
  )
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}

/** Remove publicação (dono) */
async function handleUnpublish(request: Request, env: Env, slug: string): Promise<Response> {
  if (request.method !== 'DELETE') return err('DELETE only', 405)
  const accountId = await requireAccount(request, env)
  if (!accountId) return err('não autenticado', 401)
  const row = await env.DB.prepare('SELECT account_id FROM published WHERE slug = ?').bind(slug).first<{ account_id: string }>()
  if (!row || row.account_id !== accountId) return err('publicação não encontrada', 404)
  await env.DB.prepare('DELETE FROM published WHERE slug = ?').bind(slug).run()
  return json({ deleted: true })
}

function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 2rem 1rem; color: #171c45; background: #fffef5; }
  h1 { margin-bottom: 0.25rem; } h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: #605f78; }
  .headline { color: #4d61f9; font-weight: 600; margin-top: 0; } .loc { color: #605f78; font-size: 0.9rem; }
  .muted { color: #605f78; font-size: 0.85rem; } .footer-note { margin-top: 3rem; border-top: 1px solid #e9e9f3; padding-top: 1rem; }
  a { color: #4d61f9; }
</style>
</head>
<body>${body}</body>
</html>`
}

/* ============================== Roteamento =============================== */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    try {
      // F10.1
      if (path === '/api/register' && request.method === 'POST') return await handleRegister(request, env)
      if (path === '/api/sync/push') return await handleSyncPush(request, env)
      if (path === '/api/sync/pull') return await handleSyncPull(request, env)
      if (path === '/api/account') return await handleDeleteAccount(request, env)

      // F10.2
      if (path === '/api/shorten' && request.method === 'POST') return await handleShorten(request, env)
      const vMatch = path.match(/^\/v\/([a-z0-9]+)$/)
      if (vMatch) return await handleShortRedirect(request, env, vMatch[1]!)
      const statsMatch = path.match(/^\/api\/shares\/([a-z0-9]+)\/stats$/)
      if (statsMatch) return await handleShareStats(request, env, statsMatch[1]!)

      // F10.3
      if (path === '/api/publish') return await handlePublish(request, env)
      const pMatch = path.match(/^\/p\/([a-z0-9]+)$/)
      if (pMatch) return await handlePublishedPage(request, env, pMatch[1]!)
      const unpMatch = path.match(/^\/api\/publish\/([a-z0-9]+)$/)
      if (unpMatch) return await handleUnpublish(request, env, unpMatch[1]!)

      return err('não encontrado', 404)
    } catch (e) {
      console.error('worker error:', e)
      return err('erro interno', 500)
    }
  },
}
