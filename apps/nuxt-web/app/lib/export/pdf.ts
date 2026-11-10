/**
 * Exportação de currículo para PDF via window.print()
 * Usa CSS @media print para controlar layout
 */

import type { ResumeDoc } from "../storage/schema";

/**
 * Prepara página para impressão e abre diálogo de print
 * O usuário controla as configurações de PDF
 */
export function exportPdf(resume: ResumeDoc): void {
    document.body.classList.add("printing");
    window.print();
    // Não há callback confiável de conclusão/cancelamento do diálogo
    setTimeout(() => document.body.classList.remove("printing"), 1000);
}
