/**
 * Sistema de versionamento com snapshots limitados
 * Mantém histórico de versões sem estourar localStorage
 */

import { LS_KEYS, MAX_SNAPSHOTS_PER_RESUME } from "../storage/keys";
import { readJson, writeJson } from "../storage/storage";
import {
    VersionSnapshotListSchema,
    ResumeDocSchema,
    type VersionSnapshot,
    type VersionSnapshotList,
    type ResumeDoc,
} from "../storage/schema";
/**
 * Cria um snapshot da versão atual do currículo
 * Limita a MAX_SNAPSHOTS_PER_RESUME (FIFO)
 */
export function createSnapshot(resume: ResumeDoc, label?: string): void {
    const key = LS_KEYS.resumeVersions(resume.id);

    // Ler snapshots existentes
    const raw = readJson<VersionSnapshotList>(key);
    const parsed = VersionSnapshotListSchema.safeParse(raw);
    const snapshots = parsed.success ? parsed.data : [];

    // Criar novo snapshot
    const newSnapshot: VersionSnapshot = {
        version: resume.version,
        data: resume.data,
        createdAt: new Date().toISOString(),
        label: label ?? null,
        note: null,
    };

    // Adicionar no início (mais recente primeiro)
    snapshots.unshift(newSnapshot);

    // Limitar ao máximo permitido (FIFO: remove mais antigo)
    if (snapshots.length > MAX_SNAPSHOTS_PER_RESUME) {
        snapshots.pop();
    }

    // Salvar
    writeJson(key, snapshots);
}

/**
 * Todos os snapshots de um currículo (mais recente primeiro)
 */
export function getSnapshots(resumeId: string): VersionSnapshotList {
    const parsed = VersionSnapshotListSchema.safeParse(readJson<VersionSnapshotList>(LS_KEYS.resumeVersions(resumeId)));
    return parsed.success ? parsed.data : [];
}

/**
 * Remove todos os snapshots de um currículo
 */
export function deleteSnapshots(resumeId: string): void {
    window.localStorage.removeItem(LS_KEYS.resumeVersions(resumeId));
}

/**
 * Busca um snapshot por número de versão
 */
export function getSnapshotByVersion(resumeId: string, version: number): VersionSnapshot | null {
    return getSnapshots(resumeId).find(s => s.version === version) ?? null;
}

/**
 * Restaura um snapshot específico como estado atual do doc.
 * O estado atual vai para o redo (recuperável) — não é destrutivo.
 */
export function restoreSnapshot(resumeId: string, version: number): ResumeDoc | null {
    const snap = getSnapshotByVersion(resumeId, version);
    if (!snap) return null;

    // lê doc atual cru para preservar campos fora do snapshot (id, title, style, tags...)
    const current = readJson<ResumeDoc>(LS_KEYS.resume(resumeId));
    if (!current) return null;

    // estado atual → redo
    const future = readJson<ResumeDoc[]>(LS_KEYS.resumeFuture(resumeId)) ?? [];
    writeJson(LS_KEYS.resumeFuture(resumeId), [current, ...future]);

    const restored: ResumeDoc = {
        ...current,
        version: current.version + 1,
        data: ResumeDocSchema.shape.data.safeParse(snap.data).data ?? current.data,
        updatedAt: new Date().toISOString(),
    };
    writeJson(LS_KEYS.resume(resumeId), restored);
    return restored;
}

/**
 * Renomeia um snapshot (label)
 */
export function labelSnapshot(resumeId: string, version: number, label: string | null): void {
    const snaps = getSnapshots(resumeId);
    const target = snaps.find(s => s.version === version);
    if (!target) return;
    target.label = label;
    writeJson(LS_KEYS.resumeVersions(resumeId), snaps);
}

/**
 * Auto-snapshot diário: cria um snapshot com label de data no primeiro save do dia.
 * Chamar antes de createSnapshot no updateResume.
 */
export function ensureDailySnapshot(resume: ResumeDoc): void {
    const snaps = getSnapshots(resume.id);
    const today = new Date().toISOString().slice(0, 10);
    const hasToday = snaps.some(s => s.createdAt.startsWith(today) && s.label?.startsWith("📊"));
    if (hasToday) return;
    if (snaps.length === 0 && resume.version <= 1) return; // nada a marcar ainda
    createSnapshot({ ...resume, version: resume.version }, `📊 ${new Date().toLocaleDateString("pt-BR")}`);
}

/**
 * Snapshots órfãos: chaves de versões sem doc correspondente (recuperação de desastre)
 */
export function findOrphanSnapshotKeys(): string[] {
    const orphans: string[] = [];
    for (const key of Object.keys(window.localStorage)) {
        if (!key.startsWith("hirewerk:resume:") || !key.endsWith(":versions")) continue;
        const resumeId = key.slice("hirewerk:resume:".length, -":versions".length);
        if (!window.localStorage.getItem(`hirewerk:resume:${resumeId}`)) {
            orphans.push(key);
        }
    }
    return orphans;
}

/**
 * Reconstrói um doc mínimo a partir de snapshot órfão e o restaura ao índice.
 * Retorna o doc recuperado ou null.
 */
export function recoverOrphan(orphanKey: string, title: string): ResumeDoc | null {
    const resumeId = orphanKey.slice("hirewerk:resume:".length, -":versions".length);
    const snaps = getSnapshots(resumeId);
    const latest = snaps[0];
    if (!latest) return null;

    const now = new Date().toISOString();
    const doc: ResumeDoc = ResumeDocSchema.parse({
        id: resumeId,
        title,
        templateId: "classic",
        data: latest.data,
        version: latest.version,
        createdAt: latest.createdAt,
        updatedAt: now,
        deletedAt: null,
    });
    writeJson(LS_KEYS.resume(resumeId), doc);
    deleteSnapshots(resumeId); // snapshots viraram o doc; limpa a chave órfã
    return doc;
}

/**
 * Diff textual simples entre dois snapshots (linhas removidas/adicionadas)
 */
export interface SnapshotDiff {
    removed: string[];
    added: string[];
}

export function diffSnapshots(a: VersionSnapshot, b: VersionSnapshot): SnapshotDiff {
    const ta = JSON.stringify(a.data, null, 1).split("\n");
    const tb = JSON.stringify(b.data, null, 1).split("\n");
    const setA = new Set(ta);
    const setB = new Set(tb);
    return {
        removed: ta.filter(l => !setB.has(l)),
        added: tb.filter(l => !setA.has(l)),
    };
}
