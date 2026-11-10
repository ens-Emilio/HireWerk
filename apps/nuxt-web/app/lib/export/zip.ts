/**
 * Export múltiplo: ZIP com PDF instrução + JSON + TXT de todos os currículos.
 * O PDF usa window.print (um por vez), então o ZIP leva JSON+TXT por currículo
 * e um README explicando como gerar o PDF de cada um.
 * ponytail: PDF direto no zip exigiria headless render — fora de escopo client-side.
 */

import { zipSync, strToU8 } from "fflate";
import type { ResumeDoc } from "../storage/schema";
import { resumeToText, sanitizeFilename } from "./formats";
import { downloadBlob } from "./download";

export function exportAllZip(docs: ResumeDoc[], schemaVersion: string): void {
    const files: Record<string, Uint8Array> = {};

    files["LEIA-ME.txt"] = strToU8(
        `HireWerk — backup de currículos\n\n` +
        `Exportado em ${new Date().toLocaleString("pt-BR")}\n` +
        `Schema: ${schemaVersion}\n\n` +
        `Cada pasta contém:\n` +
        `  dados.json — currículo completo (reimportável no app)\n` +
        `  texto.txt  — versão texto puro para parsers ATS\n\n` +
        `Para gerar o PDF de um currículo: importe o dados.json no app e use "Baixar PDF".\n`
    );

    for (const doc of docs) {
        const folder = sanitizeFilename(doc.title) || "currículo";
        files[`${folder}/dados.json`] = strToU8(JSON.stringify(doc, null, 2));
        files[`${folder}/texto.txt`] = strToU8(resumeToText(doc.data));
    }

    const zipped = zipSync(files);
    const blob = new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
    downloadBlob(blob, `hirewerk-cv-${new Date().toISOString().slice(0, 10)}.zip`);
}
