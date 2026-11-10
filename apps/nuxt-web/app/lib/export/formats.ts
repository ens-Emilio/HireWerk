/**
 * Exportação em TXT puro (parsers ATS antigos) e DOCX (docx.js).
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { ResumeDoc, ResumeData } from "../storage/schema";
import { downloadBlob } from "./download";

/* ============ TXT ============ */

export function resumeToText(d: ResumeData): string {
    const lines: string[] = [];

    if (d.name) lines.push(d.name.toUpperCase());
    if (d.headline) lines.push(d.headline);
    if (d.location) lines.push(d.location);
    const contacts = [
        ...d.emails.map(e => e.value),
        ...d.phones.map(p => p.value),
        ...d.links.filter(l => l.url).map(l => l.url),
    ];
    if (contacts.length) lines.push(contacts.join(" | "));

    if (d.summary) lines.push("", "RESUMO", d.summary);

    if (d.experiences.length) {
        lines.push("", "EXPERIÊNCIA");
        for (const e of d.experiences) {
            if (!e.role && !e.company) continue;
            lines.push([e.role, e.company, e.period].filter(Boolean).join(" — "));
            if (e.description) lines.push(e.description);
        }
    }

    if (d.education.length) {
        lines.push("", "FORMAÇÃO");
        for (const e of d.education) {
            lines.push([e.course, e.institution].filter(Boolean).join(" — "));
        }
    }

    if (d.skills.length) lines.push("", "HABILIDADES", d.skills.join(", "));
    if (d.softSkills.length) lines.push("", "COMPETÊNCIAS", d.softSkills.join(", "));

    const langs = d.languages.map(l => typeof l === "string" ? l : `${l.name} (${l.level})`).filter(Boolean);
    if (langs.length) lines.push("", "IDIOMAS", langs.join(", "));

    if (d.projects.length) {
        lines.push("", "PROJETOS");
        for (const p of d.projects) {
            lines.push([p.name, p.url].filter(Boolean).join(" — "));
            if (p.description) lines.push(p.description);
        }
    }

    if (d.certifications.length) {
        lines.push("", "CERTIFICAÇÕES");
        for (const c of d.certifications) {
            lines.push([c.name, c.issuer, c.year].filter(Boolean).join(" — "));
        }
    }

    if (d.volunteer.length) {
        lines.push("", "VOLUNTARIADO");
        for (const v of d.volunteer) {
            lines.push([v.role, v.org, v.period].filter(Boolean).join(" — "));
            if (v.description) lines.push(v.description);
        }
    }

    return lines.join("\n");
}

export function exportTxt(resume: ResumeDoc): void {
    downloadFile(resumeToText(resume.data), `${sanitizeFilename(resume.title)}.txt`, "text/plain;charset=utf-8");
}

/* ============ DOCX ============ */

export async function exportDocx(resume: ResumeDoc): Promise<void> {
    const d = resume.data;

    const p = (text: string, opts?: { bold?: boolean; heading?: boolean; size?: number }) =>
        new Paragraph({
            heading: opts?.heading ? HeadingLevel.HEADING_2 : undefined,
            children: [new TextRun({ text, bold: opts?.bold, size: opts?.size })],
        });

    const children: Paragraph[] = [];
    if (d.name) children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(d.name)] }));
    if (d.headline) children.push(p(d.headline, { size: 24 }));
    const contacts = [...d.emails.map(e => e.value), ...d.phones.map(x => x.value), ...d.links.map(l => l.url)].filter(Boolean);
    if (contacts.length) children.push(p(contacts.join(" | ")));
    if (d.summary) { children.push(p("Resumo", { heading: true })); children.push(p(d.summary)); }

    if (d.experiences.length) {
        children.push(p("Experiência", { heading: true }));
        for (const e of d.experiences) {
            children.push(p([e.role, e.company, e.period].filter(Boolean).join(" — "), { bold: true }));
            if (e.description) children.push(p(e.description));
        }
    }
    if (d.education.length) {
        children.push(p("Formação", { heading: true }));
        for (const e of d.education) children.push(p([e.course, e.institution].filter(Boolean).join(" — ")));
    }
    if (d.skills.length) { children.push(p("Habilidades", { heading: true })); children.push(p(d.skills.join(", "))); }
    const langs = d.languages.map(l => typeof l === "string" ? l : `${l.name} (${l.level})`).filter(Boolean);
    if (langs.length) { children.push(p("Idiomas", { heading: true })); children.push(p(langs.join(", "))); }
    if (d.projects.length) {
        children.push(p("Projetos", { heading: true }));
        for (const pr of d.projects) {
            children.push(p([pr.name, pr.url].filter(Boolean).join(" — "), { bold: true }));
            if (pr.description) children.push(p(pr.description));
        }
    }
    if (d.certifications.length) {
        children.push(p("Certificações", { heading: true }));
        for (const c of d.certifications) children.push(p([c.name, c.issuer, c.year].filter(Boolean).join(" — ")));
    }
    if (d.volunteer.length) {
        children.push(p("Voluntariado", { heading: true }));
        for (const v of d.volunteer) {
            children.push(p([v.role, v.org, v.period].filter(Boolean).join(" — "), { bold: true }));
            if (v.description) children.push(p(v.description));
        }
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${sanitizeFilename(resume.title)}.docx`);
}

/* ============ helpers ============ */

export function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9_\-]/gi, "_").replace(/_+/g, "_").toLowerCase();
}

export function downloadFile(content: string, filename: string, mime: string): void {
    downloadBlob(new Blob([content], { type: mime }), filename);
}
