/**
 * Sistema de versionamento com snapshots limitados
 * Mantém histórico de versões sem estourar localStorage
 */

import { LS_KEYS, MAX_SNAPSHOTS_PER_RESUME } from "../storage/keys";
import { readJson, writeJson } from "../storage/storage";
import {
    VersionSnapshotListSchema,
    type VersionSnapshot,
    type VersionSnapshotList,
    type ResumeDoc,
} from "../storage/schema";

/**
 * Cria um snapshot da versão atual do currículo
 * Limita a MAX_SNAPSHOTS_PER_RESUME (FIFO)
 */
export function createSnapshot(resume: ResumeDoc): void {
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
 * Obtém todos os snapshots de um currículo
 * Retorna array vazio se não houver snapshots
 */
export function getSnapshots(resumeId: string): VersionSnapshotList {
    const key = LS_KEYS.resumeVersions(resumeId);
    const raw = readJson<VersionSnapshotList>(key);
    const parsed = VersionSnapshotListSchema.safeParse(raw);
    return parsed.success ? parsed.data : [];
}

/**
 * Obtém um snapshot específico por versão
 */
export function getSnapshotByVersion(
    resumeId: string,
    version: number
): VersionSnapshot | null {
    const snapshots = getSnapshots(resumeId);
    return snapshots.find(s => s.version === version) || null;
}

/**
 * Remove todos os snapshots de um currículo
 * Usado ao deletar permanentemente um currículo
 */
export function deleteSnapshots(resumeId: string): void {
    const key = LS_KEYS.resumeVersions(resumeId);
    window.localStorage.removeItem(key);
}

/**
 * Calcula o tamanho aproximado dos snapshots em bytes
 */
export function getSnapshotsSize(resumeId: string): number {
    const key = LS_KEYS.resumeVersions(resumeId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    // Aproximação: cada char = 2 bytes (UTF-16)
    return raw.length * 2;
}
