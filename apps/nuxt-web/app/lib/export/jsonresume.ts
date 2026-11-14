/**
 * Interop com o padrão JSON Resume (jsonresume.org) — v3.
 *
 * O JSON proprietário do HireWerk continua sendo o backup fiel; este módulo
 * converte para/desde o schema aberto, para o currículo não ficar preso ao app.
 * Mapeamento é lossy por natureza (o padrão não tem `softSkills`, `volunteer`
 * com período, etc.) — o que não cabe vai para `meta.hirewerk`.
 */

import type { ResumeData, ResumeDoc } from "../storage/schema";

/** Subconjunto do schema JSON Resume que usamos. */
export interface JsonResume {
    basics?: {
        name?: string;
        label?: string;
        email?: string;
        phone?: string;
        url?: string;
        summary?: string;
        location?: { address?: string; city?: string; region?: string; countryCode?: string };
        profiles?: { network?: string; username?: string; url?: string }[];
    };
    work?: { name?: string; position?: string; startDate?: string; endDate?: string; summary?: string; highlights?: string[] }[];
    education?: { institution?: string; area?: string; studyType?: string; startDate?: string; endDate?: string }[];
    skills?: { name?: string; keywords?: string[] }[];
    languages?: { language?: string; fluency?: string }[];
    projects?: { name?: string; description?: string; url?: string; keywords?: string[] }[];
    certificates?: { name?: string; issuer?: string; date?: string }[];
    volunteer?: { organization?: string; position?: string; startDate?: string; endDate?: string; summary?: string }[];
    meta?: { version?: string; canonical?: string; hirewerk?: Record<string, unknown> };
}

function splitPeriod(period: string): { startDate?: string; endDate?: string } {
    const parts = period.split(/\s*[—–-]\s*/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return {};
    if (parts.length === 1) return { startDate: parts[0] };
    return { startDate: parts[0], endDate: parts[1] };
}

function joinPeriod(start?: string, end?: string): string {
    if (start && end) return `${start} — ${end}`;
    return start ?? end ?? "";
}

/** ResumeData → JSON Resume */
export function toJsonResume(doc: ResumeDoc): JsonResume {
    const d = doc.data;
    const email = d.emails.find(e => e.value)?.value;
    const phone = d.phones.find(p => p.value)?.value;

    return {
        basics: {
            name: d.name,
            label: d.headline,
            email,
            phone,
            summary: d.summary,
            location: d.location ? { address: d.location } : undefined,
            profiles: d.links
                .filter(l => l.url)
                .map(l => ({ network: l.kind, username: l.label, url: l.url })),
        },
        work: d.experiences
            .filter(e => e.role || e.company)
            .map(e => ({
                name: e.company,
                position: e.role,
                ...splitPeriod(e.period),
                summary: e.description,
            })),
        education: d.education
            .filter(e => e.course || e.institution)
            .map(e => ({ institution: e.institution, area: e.course })),
        skills: d.skills.filter(Boolean).map(s => ({ name: s })),
        languages: d.languages
            .map(l => typeof l === "string" ? { language: l } : { language: l.name, fluency: l.level })
            .filter(l => l.language),
        projects: d.projects
            .filter(p => p.name)
            .map(p => ({ name: p.name, description: p.description, url: p.url, keywords: p.stack ? p.stack.split(/,\s*/) : undefined })),
        certificates: d.certifications
            .filter(c => c.name)
            .map(c => ({ name: c.name, issuer: c.issuer, date: c.year })),
        volunteer: d.volunteer
            .filter(v => v.role || v.org)
            .map(v => ({ organization: v.org, position: v.role, ...splitPeriod(v.period), summary: v.description })),
        meta: {
            version: "v1.0.0",
            canonical: "https://jsonresume.org/schema/",
            hirewerk: {
                title: doc.title,
                templateId: doc.templateId,
                softSkills: d.softSkills,
                style: doc.style,
            },
        },
    };
}

/** JSON Resume → ResumeData (tolerante a campos ausentes) */
export function fromJsonResume(jr: JsonResume): Partial<ResumeData> {
    const b = jr.basics ?? {};
    const loc = b.location;
    const location = [loc?.address, loc?.city, loc?.region].filter(Boolean).join(", ");

    return {
        name: b.name ?? "",
        headline: b.label ?? "",
        summary: b.summary ?? "",
        location,
        emails: b.email ? [{ value: b.email, label: "pessoal", type: "email" }] : [],
        phones: b.phone ? [{ value: b.phone, label: "pessoal", type: "phone" }] : [],
        links: (b.profiles ?? [])
            .filter(p => p.url)
            .map(p => ({
                label: p.username ?? p.network ?? "",
                url: p.url!,
                kind: p.network === "LinkedIn" ? "linkedin" : p.network === "GitHub" ? "github" : "other",
            })),
        experiences: (jr.work ?? []).map(w => ({
            role: w.position ?? "",
            company: w.name ?? "",
            period: joinPeriod(w.startDate, w.endDate),
            description: w.summary ?? (w.highlights ?? []).join("\n"),
        })),
        education: (jr.education ?? []).map(e => ({
            course: e.area ?? e.studyType ?? "",
            institution: e.institution ?? "",
        })),
        skills: (jr.skills ?? []).flatMap(s => [s.name, ...(s.keywords ?? [])]).filter((s): s is string => Boolean(s)),
        languages: (jr.languages ?? [])
            .filter(l => l.language)
            .map(l => ({ name: l.language!, level: toCefr(l.fluency) })),
        projects: (jr.projects ?? []).map(p => ({
            name: p.name ?? "",
            url: p.url ?? "",
            description: p.description ?? "",
            stack: (p.keywords ?? []).join(", "),
        })),
        certifications: (jr.certificates ?? []).map(c => ({
            name: c.name ?? "",
            issuer: c.issuer ?? "",
            year: c.date ?? "",
        })),
        volunteer: (jr.volunteer ?? []).map(v => ({
            role: v.position ?? "",
            org: v.organization ?? "",
            period: joinPeriod(v.startDate, v.endDate),
            description: v.summary ?? "",
        })),
    };
}

/**
 * Fluência do JSON Resume ("C1", "fluent", "native") → nível CEFR do schema.
 * Termos sem CEFR mapeiam para o degrau equivalente mais próximo.
 */
function toCefr(fluency: string | undefined): "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "nativo" {
    const f = (fluency ?? "").trim().toLowerCase();
    if (/^a1$/.test(f)) return "A1";
    if (/^a2$/.test(f)) return "A2";
    if (/^b2$/.test(f)) return "B2";
    if (/^c1$/.test(f)) return "C1";
    if (/^c2$/.test(f)) return "C2";
    if (/native|nativo|matern/.test(f)) return "nativo";
    if (/fluent|fluente|advanced|avançad/.test(f)) return "C1";
    if (/intermediate|intermedi/.test(f)) return "B1";
    if (/basic|básic|beginner/.test(f)) return "A2";
    return "B1";
}

/** Detecta se um JSON é JSON Resume (e não backup do HireWerk). */
export function looksLikeJsonResume(value: unknown): value is JsonResume {
    if (typeof value !== "object" || value === null) return false;
    const o = value as Record<string, unknown>;
    if (o.app === "hirewerk") return false;
    return "basics" in o || "work" in o || "education" in o;
}
