/**
 * Gerador de rascunho de carta de apresentação (v3) — 100% local.
 *
 * Monta um texto a partir do que o usuário já escreveu (nome, título, resumo,
 * experiências, skills) e da vaga. Não inventa fatos: só reorganiza o que
 * existe, com conectivos por tom. O usuário revisa antes de enviar.
 */

import type { CoverLetter, ResumeData } from "./storage/schema";

export interface CoverLetterInput {
    data: ResumeData;
    company: string;
    role: string;
    tone: CoverLetter["tone"];
    /** Palavras-chave da vaga que já aparecem no currículo (do ATS) */
    matched?: string[];
}

const OPENERS: Record<CoverLetter["tone"], (role: string, company: string) => string> = {
    formal: (role, company) =>
        `Prezado(a) time de recrutamento da ${company || "empresa"},`,
    direto: (role, company) =>
        `Olá, equipe da ${company || "empresa"},`,
    caloroso: (role, company) =>
        `Olá! Fiquei muito animado(a) com a oportunidade de ${role || "fazer parte do time"} na ${company || "empresa"}.`,
};

const CLOSERS: Record<CoverLetter["tone"], string> = {
    formal: "Fico à disposição para uma conversa e para detalhar qualquer ponto do meu histórico.\n\nAtenciosamente,",
    direto: "Podemos conversar esta semana? Fico à disposição.\n\nAbraço,",
    caloroso: "Adoraria conversar mais sobre como posso contribuir com o time. Obrigado(a) pelo tempo!\n\nAbraço,",
};

function firstSentence(text: string): string {
    const s = text.trim().split(/(?<=[.!?])\s+/)[0] ?? "";
    return s.trim();
}

/** Gera o corpo da carta. Retorna string vazia se não houver dados suficientes. */
export function generateCoverLetter(input: CoverLetterInput): string {
    const { data, company, role, tone } = input;
    const name = data.name.trim();
    const headline = data.headline.trim();
    if (!name && !headline) return "";

    const parts: string[] = [];
    parts.push(OPENERS[tone](role, company));

    // Parágrafo 1: quem sou + por que esta vaga
    const intro: string[] = [];
    if (headline) intro.push(`Sou ${headline.toLowerCase()}`);
    if (role) intro.push(`e estou me candidatando à vaga de ${role}${company ? ` na ${company}` : ""}`);
    const introLine = intro.length ? `${intro.join(" ")}.` : "";
    if (introLine) parts.push(introLine);

    // Parágrafo 2: resumo (primeira frase, para não copiar o CV inteiro)
    const summary = firstSentence(data.summary);
    if (summary) parts.push(summary);

    // Parágrafo 3: evidência concreta — a experiência mais recente
    const latest = data.experiences.find(e => e.role.trim() || e.company.trim());
    if (latest) {
        const where = [latest.role, latest.company].filter(Boolean).join(" na ");
        const detail = firstSentence(latest.description);
        parts.push(
            detail
                ? `Na minha experiência mais recente como ${where}, ${detail.charAt(0).toLowerCase()}${detail.slice(1)}`
                : `Minha experiência mais recente foi como ${where}.`,
        );
    }

    // Parágrafo 4: aderência à vaga (só o que já existe no currículo)
    const matched = (input.matched ?? []).slice(0, 5);
    if (matched.length > 0) {
        parts.push(
            `Os pontos que mais conectam meu perfil a esta vaga são ${matched.join(", ")} — todos presentes no meu dia a dia profissional.`,
        );
    } else if (data.skills.length > 0) {
        parts.push(`Trabalho principalmente com ${data.skills.slice(0, 5).join(", ")}.`);
    }

    parts.push(CLOSERS[tone]);
    if (name) parts.push(name);

    return parts.join("\n\n");
}
