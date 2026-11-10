# 🖥️ F10 — Spec Backend (features [B])

> ⚠️ **GATE DE PRODUTO — NÃO IMPLEMENTAR SEM DECISÃO EXPLÍCITA.**
> Este documento é a *spec* das 7 features que exigem backend. O app atual funciona 100% sem servidor;
> implementar qualquer item desta lista **muda a promessa de privacidade** da landing
> ("nada sai do seu aparelho" → "seus dados são criptografados de ponta a ponta") e exige:
>
> 1. Página de privacidade nova
> 2. Consentimento explícito de opt-in (o modo offline atual permanece o default)
> 3. Revisão da copy da landing, da tela Sobre e da política de dados
>
> **Arquitetura recomendada** (se a decisão for sim): Cloudflare Workers + D1 (SQLite) +
> R2 (assets). Regiões BR, custo ~zero na escala inicial, mesmo provider do deploy atual.

---

## F10.1 — Conta opcional + sync E2E (#100)

**Prioridade:** alta (desbloqueia 94% das outras)

- **Auth:** passkey (WebAuthn) como primário; e-mail mágico como fallback. Sem senhas.
- **Sync E2E:** o cliente deriva uma chave da senha/passkey local; o servidor vê apenas
  blobs cifrados (AES-GCM, mesma primitiva do share protegido da F7). O servidor NÃO consegue
  ler currículos.
- **Merge policy:** `updatedAt` do doc vence (last-write-wins por documento);
  snapshots são append-only, sem conflito.
- **Endpoint:**
  - `POST /api/sync/push` — body: `{ blobs: [{ id, encrypted, version, updatedAt }] }`
  - `GET /api/sync/pull?since=ISO` — retorna blobs alterados
  - `DELETE /api/account` — GDPR/LGPD: apaga tudo em 24h
- **Schema D1:**
  ```sql
  CREATE TABLE accounts (id TEXT PRIMARY KEY, created_at TEXT, plan TEXT DEFAULT 'free');
  CREATE TABLE blobs (
      account_id TEXT REFERENCES accounts(id),
      doc_id TEXT,
      encrypted BLOB,          -- opaco ao servidor
      updated_at TEXT,
      PRIMARY KEY (account_id, doc_id)
  );
  ```
- **UI:** banner "Sincronizar entre aparelhos?" no dashboard; settings ganha seção Conta.
  App funciona idêntico sem conta — sync é opt-in.

## F10.2 — Métricas de abertura de links (#49)

- `GET /api/v/:shareId` → redirect 302 para o `/view?r=…` atual + incrementa contador
- Contadores agregados, sem PII: `opens`, `last_opened_at`
- Endpoint do dono: `GET /api/shares/:id/stats` (autenticado)
- UI: badge "aberto N vezes" na tela de share
- **Privacidade:** sem fingerprint, sem IP log; só contador agregado

## F10.3 — Hosting de currículo público (#50)

- `POST /api/publish` → recebe doc JSON (com consentimento do dono), devolve slug curto
  (`hirewerk.app/p/abc123`)
- Página `/p/:slug` server-rendered (SSR no Worker) — melhor para crawlers/ATS
- `DELETE /api/publish/:slug` — o dono remove a qualquer momento
- Schema: `published (slug PK, doc JSON, created_at, expires_at nullable)`
- Publicação é **opcional e revogável**; link com senha da F7 continua funcionando sem servidor

## F10.4 — Templates da comunidade (#35)

- Galeria em `/gallery` — lista templates submetidos, com preview screenshot
- Submissão: `POST /api/templates` (autenticado) com JSON do template + preview
- Moderação manual inicial (fila de aprovação)
- Import client-side já existe (F3 #41); a galeria só lista e serve os JSONs

## F10.5 — Analytics do app (opt-in)

- Eventos anônimos: `resume_created`, `pdf_exported`, `share_created` (contadores agregados)
- **Opt-in explícito** na primeira execução do tour; default OFF
- Endpoint: `POST /api/metrics` (batch, sem ID de usuário)

## F10.6 — API pública de templates

- `GET /api/templates` — lista JSON pública, cacheada na edge
- Documentação em `/api-docs`
- Rate limit: Cloudflare nativo

## F10.7 — Colaboração no editor (CRDT)

- A mais complexa: Yjs sobre WebSocket (Durable Objects)
- Só faz sentido com F10.1 pronta (identidade) e demanda de usuários simultâneos comprovada
- **Recomendação: adiar indefinidamente** até haver sinal claro de demanda

---

## Checklist de decisão (antes de qualquer linha de código)

- [ ] Decisão de produto documentada: por que abrir mão do "zero servidor"?
- [ ] Copy da landing e da tela Sobre reescritas (promessa de privacidade nova)
- [ ] Página de privacidade + termos escritos (LGPD)
- [ ] Opt-in projetado: modo offline continua default e pleno
- [ ] Custos estimados (Workers/D1/R2 na escala projetada)
- [ ] Plano de saída: o que acontece com os dados se o projeto morrer? (export E2E continua garantido)

**Estimativa:** F10.1+10.2 ≈ 2–3 semanas; F10.3 ≈ 1 semana; F10.4–10.6 ≈ 1 semana cada; F10.7 indefinido.
