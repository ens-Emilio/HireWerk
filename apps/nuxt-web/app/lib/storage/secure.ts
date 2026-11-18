/**
 * JSON cifrado em repouso para chaves auxiliares do doc (snapshots, pilha de
 * redo, histórico ATS), v3.
 *
 * `persistDoc` já cifra o documento principal, mas snapshots e redo guardavam o
 * `ResumeData` inteiro em texto puro — anulando a promessa da UI. Aqui:
 *
 *  - criptografia desligada → grava/led JSON normal;
 *  - ligada e destravada → grava envelope `{__enc}` e mantém o valor em memória;
 *  - ligada e travada → não grava (retorna false) e a leitura devolve null.
 *
 * A ordem é preservada por uma fila por chave, como em `persistDoc`.
 */

import { readJson, writeJson } from "./storage";
import { encryptAtRest, isEncryptedDoc, isEncryptionEnabled, decryptAtRest } from "./crypto";

const memory = new Map<string, unknown>();
const chains = new Map<string, Promise<void>>();

/** Lê um valor auxiliar. Prefere a cópia em memória (quando destravado). */
export function readSecureJson<T>(key: string): T | null {
    if (memory.has(key)) return memory.get(key) as T;
    const raw = readJson<unknown>(key);
    // Envelope cifrado sem chave em memória = sessão travada
    if (isEncryptedDoc(raw)) return null;
    return (raw as T) ?? null;
}

/** Grava um valor auxiliar respeitando a criptografia. */
export function writeSecureJson(key: string, value: unknown): boolean {
    if (!isEncryptionEnabled()) {
        memory.delete(key);
        writeJson(key, value);
        return true;
    }

    memory.set(key, value);
    let ok = true;
    const previous = chains.get(key) ?? Promise.resolve();
    const chain = previous
        .then(async () => {
            const enc = await encryptAtRest(value);
            if (!enc) {
                ok = false;
                return;
            }
            writeJson(key, enc);
        })
        .catch((e) => {
            ok = false;
            console.error(`[SecureStorage] falha ao gravar "${key}":`, e);
        })
        .finally(() => {
            if (chains.get(key) === chain) chains.delete(key);
        });
    chains.set(key, chain);
    return ok;
}

/** Remove a chave (memória + disco), invalidando escritas pendentes. */
export function removeSecureKey(key: string): void {
    memory.delete(key);
    chains.delete(key);
    window.localStorage.removeItem(key);
}

/**
 * Destrava as chaves auxiliares de um doc para a memória.
 * Chamado pelo store depois de `unlockEncryption()`, junto com `unlockDocs`.
 */
export async function unlockSecureKeys(keys: string[]): Promise<number> {
    let n = 0;
    for (const key of keys) {
        const raw = readJson<unknown>(key);
        if (!isEncryptedDoc(raw)) continue;
        const value = await decryptAtRest<unknown>(raw);
        if (value !== null) {
            memory.set(key, value);
            n++;
        }
    }
    return n;
}

/** Cifra chaves auxiliares que ainda estejam em claro. */
export async function encryptSecureKeys(keys: string[]): Promise<number> {
    let n = 0;
    for (const key of keys) {
        const raw = readJson<unknown>(key);
        if (raw === null || isEncryptedDoc(raw)) continue;
        memory.set(key, raw);
        const enc = await encryptAtRest(raw);
        if (enc) {
            writeJson(key, enc);
            n++;
        }
    }
    return n;
}

/** Devolve as chaves auxiliares ao claro (antes de desativar a criptografia). */
export function decryptSecureKeys(keys: string[]): void {
    for (const key of keys) {
        if (!memory.has(key)) continue;
        writeJson(key, memory.get(key));
        memory.delete(key);
    }
}

/** Descarta a memória (ao travar a sessão). */
export function clearSecureMemory(): void {
    memory.clear();
}
