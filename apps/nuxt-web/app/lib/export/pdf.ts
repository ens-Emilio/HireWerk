/**
 * Exportação de currículo para PDF via window.print()
 * Usa CSS @media print para controlar layout
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
 * Prepara página para impressão e abre diálogo de print
 * O usuário controla as configurações de PDF
 */
export function exportPdf(resume: ResumeDoc): void {
    try {
        // Adicionar classe ao body para CSS @media print
        document.body.classList.add("printing");

        // Abrir diálogo de impressão
        window.print();

        // Remover classe após impressão (ou cancelamento)
        // Nota: não há callback confiável para saber se foi concluído
        setTimeout(() => {
            document.body.classList.remove("printing");
        }, 1000);

        // Registrar log de exportação
        // Nota: não sabemos se o usuário realmente salvou o PDF
        logExport({
            id: crypto.randomUUID(),
            resumeId: resume.id,
            format: "pdf",
            status: "succeeded",
            createdAt: new Date().toISOString(),
            resumeVersion: resume.version,
        });
    } catch (error) {
        console.error("[Export] Erro ao exportar PDF:", error);

        document.body.classList.remove("printing");

        // Registrar log de erro
        logExport({
            id: crypto.randomUUID(),
            resumeId: resume.id,
            format: "pdf",
            status: "failed",
            createdAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Erro desconhecido",
        });

        throw error;
    }
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

/**
 * CSS para impressão (adicionar ao globals.css)
 * 
 * @media print {
 *   @page {
 *     size: A4;
 *     margin: 2cm;
 *   }
 * 
 *   // Ocultar elementos de UI
 *   nav, header, footer, .no-print {
 *     display: none !important;
 *   }
 * 
 *   // Forçar quebras de página
 *   .page-break {
 *     page-break-after: always;
 *   }
 * 
 *   // Evitar quebras dentro de elementos
 *   .no-break {
 *     page-break-inside: avoid;
 *   }
 * }
 */
