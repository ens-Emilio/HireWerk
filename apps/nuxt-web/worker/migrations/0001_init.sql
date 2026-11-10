-- F10.1: contas + sync E2E (blobs opacos ao servidor)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,              -- uuid gerado no client
  passkey_id TEXT UNIQUE NOT NULL,  -- credential ID WebAuthn (base64url)
  public_key TEXT NOT NULL,         -- SPKI base64 para verificação de assinatura
  created_at TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free'
);

CREATE TABLE IF NOT EXISTS blobs (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  doc_id TEXT NOT NULL,
  encrypted BLOB NOT NULL,          -- opaco: AES-GCM feito no client
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, doc_id)
);

CREATE INDEX IF NOT EXISTS idx_blobs_updated ON blobs(account_id, updated_at);

-- F10.2: métricas agregadas de shares (sem PII)
CREATE TABLE IF NOT EXISTS shares (
  share_id TEXT PRIMARY KEY,        -- id curto do link encurtado
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  target TEXT NOT NULL,             -- o /view?r=... alvo do redirect
  opens INTEGER NOT NULL DEFAULT 0,
  last_opened_at TEXT
);

-- F10.3: currículos publicados (opcional e revogável)
CREATE TABLE IF NOT EXISTS published (
  slug TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  doc TEXT NOT NULL,                -- JSON do doc (consentimento do dono)
  created_at TEXT NOT NULL,
  expires_at TEXT
);
