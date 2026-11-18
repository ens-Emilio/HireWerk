/**
 * Criptografia local em repouso (v3) — opt-in.
 *
 * O sync já cifra blobs no servidor, mas o localStorage guardava tudo em texto
 * puro. Aqui os docs são cifrados no próprio aparelho com AES-GCM, chave
 * derivada da passphrase via PBKDF2 (mesma primitiva de `sync/e2e.ts`).
 *
 * Formato do envelope em `hirewerk:crypto`:
 *   { salt: base64, check: base64 }  — `check` é o texto fixo cifrado, usado
 *   para validar a passphrase sem guardar hash da chave.
 *
 * A chave vive só em memória (nunca persistida). Sem destravar, os docs
 * cifrados não são legíveis — por isso o app avisa antes de ativar.
 */

import { LS_KEYS } from "./keys";
import { readJson, writeJson, removeKey } from "./storage";

const PBKDF2_ITERATIONS = 150_000;
const CHECK_PLAINTEXT = "hirewerk:check:v1";

export interface CryptoEnvelope {
    salt: string;
    check: string;
}

/** Doc cifrado como guardado no localStorage */
export interface EncryptedDoc {
    __enc: true;
    iv: string;
    data: string;
}

let sessionKey: CryptoKey | null = null;

function b64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return btoa(String.fromCharCode(...bytes));
}

function unb64(s: string): Uint8Array {
    return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const material = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );
}

async function encryptWith(key: CryptoKey, plaintext: string): Promise<{ iv: string; data: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as unknown as BufferSource },
        key,
        new TextEncoder().encode(plaintext),
    );
    return { iv: b64(iv), data: b64(cipher) };
}

async function decryptWith(key: CryptoKey, ivB64: string, dataB64: string): Promise<string | null> {
    try {
        const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: unb64(ivB64) as unknown as BufferSource },
            key,
            unb64(dataB64) as unknown as BufferSource,
        );
        return new TextDecoder().decode(plain);
    } catch {
        return null;
    }
}

/** Existe envelope configurado neste aparelho? */
export function isEncryptionEnabled(): boolean {
    return readJson<CryptoEnvelope>(LS_KEYS.crypto) !== null;
}

/** A sessão está destravada (chave em memória)? */
export function isUnlocked(): boolean {
    return sessionKey !== null;
}

/** Ativa a criptografia: cria envelope e devolve a chave de sessão. */
export async function enableEncryption(passphrase: string): Promise<boolean> {
    if (passphrase.length < 8) return false;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(passphrase, salt);
    const check = await encryptWith(key, CHECK_PLAINTEXT);
    writeJson(LS_KEYS.crypto, { salt: b64(salt), check: JSON.stringify(check) } satisfies CryptoEnvelope);
    sessionKey = key;
    return true;
}

/** Destrava a sessão validando a passphrase contra o envelope. */
export async function unlockEncryption(passphrase: string): Promise<boolean> {
    const env = readJson<CryptoEnvelope>(LS_KEYS.crypto);
    if (!env) return false;
    const key = await deriveKey(passphrase, unb64(env.salt));
    const check = JSON.parse(env.check) as { iv: string; data: string };
    const plain = await decryptWith(key, check.iv, check.data);
    if (plain !== CHECK_PLAINTEXT) return false;
    sessionKey = key;
    return true;
}

/** Trava a sessão (descarta a chave da memória). */
export function lockEncryption(): void {
    sessionKey = null;
}

/** Desativa a criptografia (o chamador deve decifrar os docs antes). */
export function disableEncryption(): void {
    sessionKey = null;
    removeKey(LS_KEYS.crypto);
}

/** Cifra um valor arbitrário. Lança se a sessão estiver travada. */
export async function encryptValue(value: unknown): Promise<EncryptedDoc> {
    if (!sessionKey) throw new Error("Criptografia travada — destrave para salvar.");
    const { iv, data } = await encryptWith(sessionKey, JSON.stringify(value));
    return { __enc: true, iv, data };
}

/** Decifra um envelope. Retorna null se travado ou corrompido. */
export async function decryptValue<T = unknown>(enc: EncryptedDoc): Promise<T | null> {
    if (!sessionKey) return null;
    const plain = await decryptWith(sessionKey, enc.iv, enc.data);
    if (plain === null) return null;
    try {
        return JSON.parse(plain) as T;
    } catch {
        return null;
    }
}

/** Type guard para o envelope cifrado. */
export function isEncryptedDoc(value: unknown): value is EncryptedDoc {
    return typeof value === "object" && value !== null && (value as EncryptedDoc).__enc === true;
}

/**
 * Cifra um doc para gravação em repouso.
 * Sem sessão destravada devolve null — o chamador decide (não grava em claro).
 */
export async function encryptAtRest(value: unknown): Promise<EncryptedDoc | null> {
    if (!sessionKey) return null;
    return encryptValue(value);
}

/** Decifra um valor lido do localStorage. Aceita claro (retorna como veio). */
export async function decryptAtRest<T = unknown>(raw: unknown): Promise<T | null> {
    if (!isEncryptedDoc(raw)) return (raw as T) ?? null;
    return decryptValue<T>(raw);
}
