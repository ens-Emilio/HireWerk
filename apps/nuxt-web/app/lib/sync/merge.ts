/**
 * Decisão de merge do sync (v3) — função pura, sem I/O.
 *
 * Antes era LWW por `updatedAt` inline no store: se os dois lados editassem
 * offline, uma versão desaparecia sem aviso. Agora:
 *   - só um lado mudou desde o último sync → ele vence;
 *   - os dois mudaram e divergem → conflito, nada é sobrescrito;
 *   - nada mudou → mantém o local.
 */

export type MergeDecision = "keep-local" | "take-remote" | "conflict";

export interface MergeInput {
    /** Doc local (null se não existe neste aparelho) */
    local: { updatedAt?: string } | null;
    /** Doc vindo do servidor */
    remote: { updatedAt?: string };
    /** Timestamp do último sync bem-sucedido (null = primeiro sync) */
    since: string | null;
}

const ts = (v: string | undefined) => v ?? "";

/** Decide o que fazer com um doc recebido do servidor. */
export function decideMerge({ local, remote, since }: MergeInput): MergeDecision {
    if (!local) return "take-remote";

    const localAt = ts(local.updatedAt);
    const remoteAt = ts(remote.updatedAt);
    if (localAt === remoteAt) return "keep-local";

    // Sem histórico de sync: LWW clássico (não há como saber o que mudou)
    if (!since) return remoteAt > localAt ? "take-remote" : "keep-local";

    const localChanged = localAt > since;
    const remoteChanged = remoteAt > since;

    if (localChanged && remoteChanged) return "conflict";
    if (remoteChanged) return "take-remote";
    return "keep-local";
}
