/**
 * Tailoring assistido (v3) — usa o resultado do ATS para sugerir ações concretas.
 *
 * Nada é inventado: as sugestões são (a) palavras-chave da vaga que já existem
 * no currículo mas com outra grafia, (b) skills que faltam e o usuário pode
 * adicionar com um clique, (c) reordenação de skills para o topo.
 */

import type { ResumeData } from "./storage/schema";
import type { AtsResult } from "./ats";

export interface TailorSuggestion {
    id: string;
    kind: "add-skill" | "reorder-skill" | "rewrite-summary";
    label: string;
    detail: string;
    /** Payload aplicável: skill a adicionar, ou lista ordenada */
    skill?: string;
}

/** Normaliza para comparar grafias ("Node.js" == "nodejs") */
function norm(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

/**
 * Gera sugestões a partir do resultado ATS.
 * `limit` corta a lista para não virar parede de texto.
 */
export function tailorSuggestions(data: ResumeData, ats: AtsResult, limit = 8): TailorSuggestion[] {
    const out: TailorSuggestion[] = [];
    const existing = new Set(data.skills.map(norm));

    // 1. Skills que faltam e são adicionáveis com um clique
    for (const kw of ats.missing) {
        if (out.length >= limit) break;
        if (kw.length < 3) continue;
        if (existing.has(norm(kw))) continue;
        out.push({
            id: `add:${kw}`,
            kind: "add-skill",
            label: `Adicionar "${kw}" às habilidades`,
            detail: "A vaga cita este termo e ele não aparece no currículo.",
            skill: kw,
        });
    }

    // 2. Skills já presentes que a vaga repete — sobem para o topo
    const matchedSet = new Set(ats.matched.map(norm));
    const topMatched = data.skills.filter(s => matchedSet.has(norm(s)));
    const alreadyTop = data.skills.slice(0, Math.max(1, topMatched.length));
    const needsReorder = topMatched.length > 0 && topMatched.some(s => !alreadyTop.includes(s));
    if (needsReorder && out.length < limit) {
        out.push({
            id: "reorder:skills",
            kind: "reorder-skill",
            label: "Mover as habilidades da vaga para o topo",
            detail: `O recrutador lê as primeiras: ${topMatched.slice(0, 4).join(", ")}.`,
        });
    }

    // 3. Resumo sem nenhuma palavra-chave da vaga
    if (out.length < limit && ats.matched.length > 0) {
        const summaryNorm = norm(data.summary);
        const summaryHits = ats.matched.filter(kw => summaryNorm.includes(norm(kw)));
        if (summaryHits.length === 0 && data.summary.trim().length > 0) {
            out.push({
                id: "rewrite:summary",
                kind: "rewrite-summary",
                label: "Citar a vaga no resumo",
                detail: `Nenhuma palavra-chave da vaga aparece no resumo. Experimente mencionar: ${ats.matched.slice(0, 3).join(", ")}.`,
            });
        }
    }

    return out;
}

/** Aplica uma sugestão de skill ao ResumeData (mutação local, o chamador salva). */
export function applySuggestion(data: ResumeData, suggestion: TailorSuggestion): boolean {
    if (suggestion.kind === "add-skill" && suggestion.skill) {
        if (data.skills.some(s => norm(s) === norm(suggestion.skill!))) return false;
        data.skills.push(suggestion.skill);
        return true;
    }
    if (suggestion.kind === "reorder-skill") {
        // Sem o ATS aqui: mantém a ordem atual e apenas remove vazios/duplicatas
        const seen = new Set<string>();
        data.skills = data.skills.filter(s => {
            const k = norm(s);
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
        });
        return true;
    }
    return false;
}
