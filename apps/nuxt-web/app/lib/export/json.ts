/**
 * Exportação de currículo para JSON
 * Download client-side via Blob
 */

import { LS_KEYS } from "../storage/keys";
import { readJson, writeJson } from "../storage/storage";
import {
    ExportLogListSchema,
    type ExportLog,
    type ExportLogList,
    type ResumeDoc,
} from "../storage/schema";

/**
 * Exporta currículo como JSON e faz download
 */
export function exportJson(resume: ResumeDoc): void {
    try {
        // Criar JSON formatado
        const json = JSON.stringify(resume, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const sizeBytes = blob.size;

        // Criar URL temporário
        const url = URL.createObjectURL(blob);

        // Criar link temporário e clicar
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sanitizeFilename(resume.title)}.json`;
        document.body.appendChild(a);
        a.click();

        // Limpar
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Registrar log de exportação
        logExport({
            id: crypto.randomUUID(),
            resumeId: resume.id,
            format: "json",
            status: "succeeded",
            createdAt: new Date().toISOString(),
            sizeBytes,
            resumeVersion: resume.version,
        });
    } catch (error) {
        console.error("[Export] Erro ao exportar JSON:", error);

        // Registrar log de erro
        logExport({
            id: crypto.randomUUID(),
            resumeId: resume.id,
            format: "json",
            status: "failed",
            createdAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Erro desconhecido",
        });

        throw error;
    }
}

/**
 * Sanitiza nome de arquivo removendo caracteres inválidos
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-z0-9_\-]/gi, "_")
        .replace(/_+/g, "_")
        .toLowerCase();
}

/**
 * Registra log de exportação no localStorage
 */
function logExport(log: ExportLog): void {
    const raw = readJson<ExportLogList>(LS_KEYS.exports);
    const parsed = ExportLogListSchema.safeParse(raw);
    const logs = parsed.success ? parsed.data : [];

    // Adicionar no início (mais recente primeiro)
    logs.unshift(log);

    // Limitar a 100 logs (evitar crescimento infinito)
    if (logs.length > 100) {
        logs.pop();
    }

    writeJson(LS_KEYS.exports, logs);
}

/**
 * Obtém histórico de exportações
 */
export function getExportLogs(resumeId?: string): ExportLogList {
    const raw = readJson<ExportLogList>(LS_KEYS.exports);
    const parsed = ExportLogListSchema.safeParse(raw);
    const logs = parsed.success ? parsed.data : [];

    if (resumeId) {
        return logs.filter(log => log.resumeId === resumeId);
    }

    return logs;
}
