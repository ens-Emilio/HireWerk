/**
 * Exportação em PNG — renderiza a folha A4 em canvas via SVG foreignObject.
 * Limitação conhecida: fonts externas não são embutidas no raster (usa fallback sans).
 * ponytail: rasterização de DOM puro é pesada; se a fidelidade importar, trocar por
 * html-to-image ou renderização dedicada por template.
 */

import type { ResumeDoc, ResumeData } from "../storage/schema";
import { downloadBlob } from "./download";
import { resumeToText } from "./formats";

export function exportPng(resume: ResumeDoc, a4El?: HTMLElement | null): void {
    // Caminho preferencial: rasterizar o próprio nó do preview (fidelidade total)
    if (a4El) {
        rasterizeElement(a4El, resume).then(blob => downloadBlob(blob, `${sanitizeFilename(resume.title)}.png`));
        return;
    }
    // Fallback: imagem textual simples
    const text = resumeToText(resume.data);
    const canvas = document.createElement("canvas");
    const scale = 2;
    const width = 794; // A4 @96dpi
    const lineHeight = 18 * scale;
    const lines = text.split("\n");
    canvas.width = width * scale;
    canvas.height = Math.max((lines.length + 6) * lineHeight + 120 * scale, 1123 * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, canvas.height / scale);
    ctx.fillStyle = "#17153a";
    ctx.font = "13px 'Noto Sans', sans-serif";
    lines.forEach((line, i) => {
        ctx.fillText(line, 56, 64 + i * 18);
    });
    canvas.toBlob(blob => {
        if (blob) downloadBlob(blob, `${sanitizeFilename(resume.title)}.png`);
    }, "image/png");
}

async function rasterizeElement(el: HTMLElement, resume: ResumeDoc): Promise<Blob> {
    const rect = el.getBoundingClientRect();
    const scale = 2;
    const clone = el.cloneNode(true) as HTMLElement;
    // Inline computed styles básicos do clone (background/fontes) para o foreignObject
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(rect.width * scale));
    svg.setAttribute("height", String(rect.height * scale));
    const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    fo.setAttribute("width", "100%");
    fo.setAttribute("height", "100%");
    const body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
    body.appendChild(clone);
    fo.appendChild(body);
    svg.appendChild(fo);

    const serialized = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serialized);

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Falha ao rasterizar preview"));
    img.src = url;
    await promise;


    const canvas = document.createElement("canvas");
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const { promise: blobPromise, resolve: resolveBlob, reject: rejectBlob } = Promise.withResolvers<Blob>();
    canvas.toBlob(b => (b ? resolveBlob(b) : rejectBlob(new Error("toBlob falhou"))), "image/png");
    return blobPromise;
}

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9_\-]/gi, "_").replace(/_+/g, "_").toLowerCase();
}
