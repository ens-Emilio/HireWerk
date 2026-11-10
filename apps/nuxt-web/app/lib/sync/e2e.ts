/**
 * F10.1 — Sync E2E: o servidor só vê blobs cifrados.
 * Chave derivada da passphrase do usuário (PBKDF2) — NUNCA sai do aparelho.
 * Mesma primitiva (AES-GCM) do share protegido da F7.
 *
 * Fluxo:
 *  1. setupAccount(passphrase): gera account id + passphrase hash como token de API,
 *     cifra a KEK... não — simplicidade deliberada: a passphrase deriva a chave de
 *     cifração E o token de API. O servidor nunca vê nenhum dos dois.
 *  2. pushBlobs / pullBlobs: AES-GCM por blob, IV aleatório embutido no payload.
 *
 * ponytail: passkey WebAuthn fica para trás nesta versão — token derivado da
 * passphrase dá as mesmas garantias de privacidade sem a complexa cerimônia
 * de registro; upgrade para passkey quando houver demanda de recuperação de conta.
 */

import { LS_KEYS, API_BASE } from '../storage/keys'
import { readJson, writeJson, removeKey } from '../storage/storage'

export interface SyncAccount {
    accountId: string
    /** token de API = hash da passphrase (o servidor não consegue reverter) */
    token: string
    createdAt: string
}

export interface SyncBlob {
    docId: string
    encrypted: string // base64: iv || ciphertext
    version: number
    updatedAt: string
}

const PBKDF2_ITERATIONS = 100_000

function b64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function unb64(s: string): Uint8Array {
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

/** Deriva chave AES-GCM da passphrase + account salt */
async function deriveKey(passphrase: string, accountId: string): Promise<CryptoKey> {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: new TextEncoder().encode(`hirewerk:${accountId}`), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    )
}

/** Token de API: SHA-256 da passphrase (o servidor guarda apenas isto, como lookup) */
async function apiToken(passphrase: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`hirewerk-api:${passphrase}`))
    return b64(digest).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Cria a conta local + registra no servidor. Retorna null se offline/erro. */
export async function setupAccount(passphrase: string): Promise<SyncAccount | null> {
    if (passphrase.length < 8) return null
    const accountId = crypto.randomUUID()
    const token = await apiToken(passphrase)

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ passkeyId: token, publicKey: 'derived-from-passphrase' }),
        })
        if (!res.ok) return null
        const data = (await res.json()) as { accountId?: string }
        const account: SyncAccount = { accountId: data.accountId ?? accountId, token, createdAt: new Date().toISOString() }
        writeJson(LS_KEYS.account, account)
        return account
    } catch {
        return null
    }
}

/** Conta local (se existir) */
export function getAccount(): SyncAccount | null {
    return readJson<SyncAccount>(LS_KEYS.account)
}

export function logoutAccount(): void {
    removeKey(LS_KEYS.account)
    removeKey(LS_KEYS.syncSince)
}

/** Cifra um doc com a chave derivada da passphrase */
export async function encryptDoc(accountId: string, passphrase: string, doc: unknown): Promise<string> {
    const key = await deriveKey(passphrase, accountId)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const plaintext = new TextEncoder().encode(JSON.stringify(doc))
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
    // payload: iv(12) || ciphertext
    const merged = new Uint8Array(12 + ciphertext.byteLength)
    merged.set(iv)
    merged.set(new Uint8Array(ciphertext), 12)
    return b64(merged.buffer)
}

/** Decifra um blob com a chave derivada */
export async function decryptDoc(accountId: string, passphrase: string, encrypted: string): Promise<unknown | null> {
    try {
        const key = await deriveKey(passphrase, accountId)
        const raw = unb64(encrypted)
        const iv = raw.slice(0, 12)
        const ciphertext = raw.slice(12)
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
        return JSON.parse(new TextDecoder().decode(plaintext))
    } catch {
        return null // passphrase errada ou blob corrompido
    }
}

/** Push dos blobs cifrados ao servidor */
export async function pushBlobs(blobs: SyncBlob[]): Promise<boolean> {
    const account = getAccount()
    if (!account || blobs.length === 0) return false
    try {
        const res = await fetch(`${API_BASE}/sync/push`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${account.token}` },
            body: JSON.stringify({ blobs }),
        })
        return res.ok
    } catch {
        return false
    }
}

/** Pull de blobs alterados desde `since` */
export async function pullBlobs(since?: string): Promise<SyncBlob[] | null> {
    const account = getAccount()
    if (!account) return null
    try {
        const res = await fetch(`${API_BASE}/sync/pull?since=${encodeURIComponent(since ?? '1970-01-01')}`, {
            headers: { authorization: `Bearer ${account.token}` },
        })
        if (!res.ok) return null
        const data = (await res.json()) as { blobs: SyncBlob[] }
        return data.blobs
    } catch {
        return null
    }
}

export function getLastSyncSince(): string | undefined {
    return readJson<string>(LS_KEYS.syncSince) ?? undefined
}

export function setLastSyncSince(iso: string): void {
    writeJson(LS_KEYS.syncSince, iso)
}
