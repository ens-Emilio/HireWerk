/**
 * Exportação de currículo para JSON
 * Download client-side via Blob
 */

import type { ResumeDoc } from "../storage/schema";

/**
 * Exporta currículo como JSON e faz download
 */
export function exportJson(resume: ResumeDoc): void {
    const json = JSON.stringify(resume, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(resume.title)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
