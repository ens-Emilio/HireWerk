/**
 * Diff estruturado entre duas versões de currículo (v3).
 *
 * Compara folha a folha do ResumeData e devolve mudanças legíveis, em vez do
 * diff textual de JSON que existia antes (ruído de pontuação, sem rótulo).
 */

import type { ResumeData } from "../storage/schema";

export interface FieldChange {
    /** Caminho estável, ex.: experiences[0].role */
    path: string;
    /** Rótulo humano, ex.: Experiência 1 · Cargo */
    label: string;
    before: string;
    after: string;
}

const SCALAR_LABELS: Record<string, string> = {
    name: "Nome",
    headline: "Título",
    summary: "Resumo",
    location: "Localização",
    birthDate: "Nascimento",
    maritalStatus: "Estado civil",
    salaryExpectation: "Pretensão",
};

const ARRAY_LABELS: Record<string, string> = {
    experiences: "Experiência",
    education: "Formação",
    projects: "Projeto",
    certifications: "Certificação",
    volunteer: "Voluntariado",
    links: "Link",
    emails: "E-mail",
    phones: "Telefone",
    languages: "Idioma",
};

const ITEM_FIELD_LABELS: Record<string, string> = {
    role: "Cargo",
    company: "Empresa",
    period: "Período",
    description: "Descrição",
    course: "Curso",
    institution: "Instituição",
    name: "Nome",
    url: "URL",
    stack: "Tecnologias",
    issuer: "Emissor",
    year: "Ano",
    org: "Organização",
    label: "Rótulo",
    kind: "Tipo",
    value: "Valor",
    type: "Tipo",
    level: "Nível",
};

function asText(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
    if (typeof value === "object") {
        const o = value as Record<string, unknown>;
        return [o.name, o.level].filter(Boolean).map(asText).join(" ");
    }
    return "";
}

/** Diff de dois ResumeData, campo a campo. */
export function diffResumeData(before: unknown, after: unknown): FieldChange[] {
    const a = (before ?? {}) as Record<string, unknown>;
    const b = (after ?? {}) as Record<string, unknown>;
    const changes: FieldChange[] = [];

    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
        const va = a[key];
        const vb = b[key];

        if (Array.isArray(va) || Array.isArray(vb)) {
            const arrA = Array.isArray(va) ? va : [];
            const arrB = Array.isArray(vb) ? vb : [];
            const base = ARRAY_LABELS[key] ?? key;
            const len = Math.max(arrA.length, arrB.length);

            for (let i = 0; i < len; i++) {
                const itemA = arrA[i];
                const itemB = arrB[i];
                const path = `${key}[${i}]`;

                if (itemA === undefined) {
                    changes.push({ path, label: `${base} ${i + 1}`, before: "", after: asText(itemB) });
                    continue;
                }
                if (itemB === undefined) {
                    changes.push({ path, label: `${base} ${i + 1}`, before: asText(itemA), after: "" });
                    continue;
                }
                if (typeof itemA === "object" && typeof itemB === "object" && itemA && itemB) {
                    const oa = itemA as Record<string, unknown>;
                    const ob = itemB as Record<string, unknown>;
                    for (const field of new Set([...Object.keys(oa), ...Object.keys(ob)])) {
                        const ta = asText(oa[field]);
                        const tb = asText(ob[field]);
                        if (ta === tb) continue;
                        changes.push({
                            path: `${path}.${field}`,
                            label: `${base} ${i + 1} · ${ITEM_FIELD_LABELS[field] ?? field}`,
                            before: ta,
                            after: tb,
                        });
                    }
                    continue;
                }
                const ta = asText(itemA);
                const tb = asText(itemB);
                if (ta !== tb) changes.push({ path, label: `${base} ${i + 1}`, before: ta, after: tb });
            }
            continue;
        }

        const ta = asText(va);
        const tb = asText(vb);
        if (ta === tb) continue;
        changes.push({ path: key, label: SCALAR_LABELS[key] ?? key, before: ta, after: tb });
    }

    return changes;
}

export type { ResumeData };
