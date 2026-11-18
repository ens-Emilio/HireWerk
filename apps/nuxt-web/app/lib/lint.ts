/**
 * Linter de escrita do currículo (v3) — 100% local.
 *
 * O checklist de `quality.ts` mede presença de campos; este mede a qualidade do
 * texto: verbos fracos, bullets sem métrica, frases longas, primeira pessoa e
 * clichês. Cada achado aponta o campo exato para o usuário corrigir.
 */

import type { ResumeData } from "./storage/schema";

export type LintSeverity = "warn" | "info";

export interface LintFinding {
    id: string;
    severity: LintSeverity;
    /** Onde está: "Resumo", "Experiência 2 · Descrição" */
    where: string;
    message: string;
    /** Trecho problemático, para destacar */
    excerpt: string;
}

const WEAK_OPENERS = [
    "responsável por", "responsavel por", "encarregado de", "auxiliei", "auxiliei no",
    "participei de", "participei do", "ajudei a", "ajudei no", "trabalhei com",
    "responsible for", "helped with", "worked on", "assisted with", "involved in",
];

const CLICHES = [
    "proativo", "proativa", "dinâmico", "dinamica", "trabalho em equipe", "team player",
    "pensamento fora da caixa", "think outside the box", "sempre disposto", "multitarefa",
    "hard worker", "go-getter", "detail-oriented", "results-driven",
];

const FIRST_PERSON = /\b(eu|meu|minha|meus|minhas|i|my|me)\b/i;

/** Métrica = número, %, R$, ou multiplicador (2x, 3×) */
const HAS_METRIC = /(\d+([.,]\d+)?\s*%|r\$\s*\d|\$\s*\d|\b\d+([.,]\d+)?\s*(x|×|mil|k|m)\b|\b\d{2,}\b)/i;

const MAX_SENTENCE_WORDS = 28;

function sentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+|\n+/)
        .map(s => s.trim())
        .filter(Boolean);
}

function bullets(text: string): string[] {
    return text
        .split(/\n+/)
        .map(s => s.replace(/^[-•*·]\s*/, "").trim())
        .filter(Boolean);
}

function excerpt(text: string, max = 70): string {
    const t = text.trim().replace(/\s+/g, " ");
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

type Translate = (key: string, params?: Record<string, string | number>) => string

/** Analisa um bloco de texto descritivo (resumo ou descrição de experiência). */
function lintBlock(
    text: string,
    where: string,
    findings: LintFinding[],
    opts: { requireMetric: boolean },
    t: Translate,
): void {
    if (!text.trim()) return;

    for (const s of sentences(text)) {
        const words = s.split(/\s+/).filter(Boolean).length;
        if (words > MAX_SENTENCE_WORDS) {
            findings.push({
                id: `long:${where}:${excerpt(s, 30)}`,
                severity: "info",
                where,
                message: t('lint.longSentence', { n: words }),
                excerpt: excerpt(s),
            });
        }
    }

    const lower = text.toLowerCase();
    for (const weak of WEAK_OPENERS) {
        if (lower.includes(weak)) {
            findings.push({
                id: `weak:${where}:${weak}`,
                severity: "warn",
                where,
                message: t('lint.weakOpener', { word: weak }),
                excerpt: excerpt(text),
            });
            break;
        }
    }

    for (const cliche of CLICHES) {
        if (lower.includes(cliche)) {
            findings.push({
                id: `cliche:${where}:${cliche}`,
                severity: "info",
                where,
                message: t('lint.cliche', { word: cliche }),
                excerpt: excerpt(text),
            });
            break;
        }
    }

    if (FIRST_PERSON.test(text)) {
        findings.push({
            id: `person:${where}`,
            severity: "info",
            where,
            message: t('lint.firstPerson'),
            excerpt: excerpt(text),
        });
    }

    if (opts.requireMetric) {
        const items = bullets(text);
        const withoutMetric = items.filter(b => b.split(/\s+/).length > 6 && !HAS_METRIC.test(b));
        if (items.length > 0 && withoutMetric.length === items.length) {
            findings.push({
                id: `metric:${where}`,
                severity: "warn",
                where,
                message: t('lint.noMetric'),
                excerpt: excerpt(items[0] ?? text),
            });
        }
    }
}

/** Roda o linter no currículo inteiro. */
export function lintResume(data: ResumeData, t: Translate): LintFinding[] {
    const findings: LintFinding[] = [];

    lintBlock(data.summary, t('lint.whereSummary'), findings, { requireMetric: false }, t);

    data.experiences.forEach((exp, i) => {
        if (!exp.role.trim() && !exp.company.trim()) return;
        lintBlock(exp.description, t('lint.whereExperience', { n: i + 1 }), findings, { requireMetric: true }, t);
    });

    data.projects.forEach((proj, i) => {
        if (!proj.name.trim()) return;
        lintBlock(proj.description, t('lint.whereProject', { n: i + 1 }), findings, { requireMetric: true }, t);
    });

    data.volunteer.forEach((vol, i) => {
        if (!vol.role.trim()) return;
        lintBlock(vol.description, t('lint.whereVolunteer', { n: i + 1 }), findings, { requireMetric: false }, t);
    });

    // Skills duplicadas (case-insensitive) — ruído comum ao colar de vagas
    const seen = new Map<string, number>();
    data.skills.forEach((skill, i) => {
        const key = skill.trim().toLowerCase();
        if (!key) return;
        const prev = seen.get(key);
        if (prev !== undefined) {
            findings.push({
                id: `dupskill:${i}`,
                severity: "warn",
                where: t('lint.whereSkills'),
                message: t('lint.duplicateSkill', { skill }),
                excerpt: skill,
            });
        } else {
            seen.set(key, i);
        }
    });

    return findings;
}

/** Contagem por severidade, para o badge do editor. */
export function lintSummary(findings: LintFinding[]): { warn: number; info: number } {
    return {
        warn: findings.filter(f => f.severity === "warn").length,
        info: findings.filter(f => f.severity === "info").length,
    };
}
