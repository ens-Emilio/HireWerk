/**
 * Cliente da API opcional (Worker) — v3.
 *
 * Cobre o que já existia no Worker mas não tinha UI: publicação pública
 * revogável, link curto e métricas agregadas. Tudo falha em silêncio: sem
 * conta ou sem rede, o app continua 100% offline.
 */

import { API_BASE, LS_KEYS } from "./storage/keys";
import { readJson, writeJson } from "./storage/storage";
import { getAccount } from "./sync/e2e";

/** Registro local de links criados neste aparelho */
export interface ShareRecord {
    kind: "short" | "publish";
    /** shareId (curto) ou slug (publicado) */
    id: string;
    url: string;
    resumeId: string;
    title: string;
    createdAt: string;
    expiresAt: string | null;
}

function authHeaders(): Record<string, string> {
    const account = getAccount();
    return account ? { authorization: `Bearer ${account.token}` } : {};
}

export function listShares(): ShareRecord[] {
    return readJson<ShareRecord[]>(LS_KEYS.shares) ?? [];
}

function saveShares(list: ShareRecord[]): void {
    writeJson(LS_KEYS.shares, list);
}

function addShare(record: ShareRecord): void {
    saveShares([record, ...listShares()]);
}

export function removeShare(id: string): void {
    saveShares(listShares().filter(s => s.id !== id));
}

/** Encurta um link /view?r=... já gerado. Requer conta. */
export async function shortenLink(target: string, resumeId: string, title: string): Promise<ShareRecord | null> {
    if (!getAccount()) return null;
    try {
        const res = await fetch(`${API_BASE}/shorten`, {
            method: "POST",
            headers: { "content-type": "application/json", ...authHeaders() },
            body: JSON.stringify({ target }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { shareId?: string; shortUrl?: string };
        if (!data.shareId) return null;
        const record: ShareRecord = {
            kind: "short",
            id: data.shareId,
            url: `${new URL(API_BASE).origin}${data.shortUrl ?? `/v/${data.shareId}`}`,
            resumeId,
            title,
            createdAt: new Date().toISOString(),
            expiresAt: null,
        };
        addShare(record);
        return record;
    } catch {
        return null;
    }
}

/** Métricas de um link curto (aberturas agregadas, sem PII). */
export async function shareStats(shareId: string): Promise<{ opens: number; lastOpenedAt: string | null } | null> {
    if (!getAccount()) return null;
    try {
        const res = await fetch(`${API_BASE}/shares/${shareId}/stats`, { headers: authHeaders() });
        if (!res.ok) return null;
        return (await res.json()) as { opens: number; lastOpenedAt: string | null };
    } catch {
        return null;
    }
}

/** Publica o doc numa página pública revogável. Requer conta. */
export async function publishDoc(
    doc: unknown,
    resumeId: string,
    title: string,
    expiresInDays?: number,
): Promise<ShareRecord | null> {
    if (!getAccount()) return null;
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString() : null;
    try {
        const res = await fetch(`${API_BASE}/publish`, {
            method: "POST",
            headers: { "content-type": "application/json", ...authHeaders() },
            body: JSON.stringify({ doc, expiresAt }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { slug?: string; url?: string };
        if (!data.slug) return null;
        const record: ShareRecord = {
            kind: "publish",
            id: data.slug,
            url: `${new URL(API_BASE).origin}${data.url ?? `/p/${data.slug}`}`,
            resumeId,
            title,
            createdAt: new Date().toISOString(),
            expiresAt,
        };
        addShare(record);
        return record;
    } catch {
        return null;
    }
}

/** Revoga uma publicação. */
export async function unpublishDoc(slug: string): Promise<boolean> {
    if (!getAccount()) return false;
    try {
        const res = await fetch(`${API_BASE}/publish/${slug}`, { method: "DELETE", headers: authHeaders() });
        if (!res.ok) return false;
        removeShare(slug);
        return true;
    } catch {
        return false;
    }
}
