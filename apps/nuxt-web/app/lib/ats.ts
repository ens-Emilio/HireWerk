/**
 * Score ATS local (F9 #97): compara o currículo com a descrição da vaga.
 * TF ponderado + stopwords PT/EN, tudo client-side — nada sai do aparelho.
 */

import type { ResumeData } from "./storage/schema";

const STOPWORDS = new Set([
    // PT
    'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'um', 'uma', 'para', 'com',
    'por', 'que', 'no', 'na', 'nos', 'nas', 'ao', 'aos', 'se', 'ou', 'ser', 'sua', 'seu', 'sao',
    'mais', 'como', 'pelo', 'pela', 'ate', 'nao', 'tambem', 'voce', 'sobre',
    'experiencia', 'conhecimento', 'desejavel', 'necessario', 'empresa', 'vaga', 'candidato',
    // vocabulário de anúncio de vaga (não é skill)
    'requisito', 'requisitos', 'responsabilidade', 'responsabilidades', 'atividade', 'atividades',
    'diferencial', 'diferenciais', 'beneficio', 'beneficios', 'oferecemos', 'buscamos', 'procuramos',
    'profissional', 'area', 'atuacao', 'nivel', 'senior', 'junior', 'pleno', 'remoto', 'hibrido',
    'presencial', 'jornada', 'salario', 'contratacao', 'clt', 'pj', 'time', 'equipe', 'projeto',
    // EN
    'the', 'a', 'an', 'of', 'in', 'on', 'to', 'for', 'with', 'and', 'or', 'is', 'are', 'be',
    'at', 'by', 'from', 'as', 'that', 'this', 'it', 'will', 'you', 'your', 'we', 'our', 'not',
    'experience', 'knowledge', 'required', 'company', 'job', 'candidate', 'role', 'work',
    'requirements', 'responsibilities', 'benefits', 'senior', 'junior', 'remote', 'hybrid',
])

/**
 * Normaliza e tokeniza texto em palavras relevantes.
 * Pontuação de fim de frase é removida ("digital." → "digital"), mas pontuação
 * interna é preservada ("node.js", "c++", "c#"). Tokens curtos com símbolo
 * (c#, c++, go) sobrevivem ao filtro de tamanho — são nomes de tecnologia.
 */
export function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s+.#]/g, ' ')
        .split(/\s+/)
        .map(w => w.replace(/^\.+|\.+$/g, ''))
        .filter(w => w.length > 0 && !STOPWORDS.has(w))
        .filter(w => w.length > 2 || /[#+]/.test(w) || w === 'go' || w === 'r')
}

function termFreq(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>()
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
    return tf
}

export interface AtsMatch {
    keyword: string
    inResume: boolean
    /** vezes que aparece na vaga — relevância */
    jobCount: number
}

export interface AtsResult {
    /** 0–100 */
    score: number
    matches: AtsMatch[]
    /** keywords da vaga que faltam no currículo, ordenadas por relevância */
    missing: string[]
    matched: string[]
}

/**
 * Compara currículo com a vaga.
 * Score = cobertura ponderada dos termos da vaga presentes no currículo.
 */
export function scoreAts(data: ResumeData, jobDescription: string): AtsResult {
    const resumeTokens = new Set(tokenize(resumeText(data)))
    const jobTokens = tokenize(jobDescription)
    const jobTf = termFreq(jobTokens)

    const maxCount = Math.max(...jobTf.values(), 1)
    let weightedTotal = 0
    let weightedHit = 0
    const matches: AtsMatch[] = []

    for (const [keyword, count] of jobTf) {
        // termos muito repetidos pesam mais (cap em 3× para não saturar)
        const weight = Math.min(count / maxCount, 1) * 2 + 1
        const hit = resumeTokens.has(keyword) || [...resumeTokens].some(rt => rt.startsWith(keyword) && keyword.length > 4)
        weightedTotal += weight
        if (hit) weightedHit += weight
        matches.push({ keyword, inResume: hit, jobCount: count })
    }

    matches.sort((a, b) => b.jobCount - a.jobCount)

    return {
        score: weightedTotal > 0 ? Math.round((weightedHit / weightedTotal) * 100) : 0,
        matches,
        missing: matches.filter(m => !m.inResume).map(m => m.keyword),
        matched: matches.filter(m => m.inResume).map(m => m.keyword),
    }
}

function resumeText(d: ResumeData): string {
    return [
        d.headline,
        d.summary,
        ...d.skills,
        ...d.softSkills,
        ...d.experiences.flatMap(e => [e.role, e.company, e.description]),
        ...d.education.flatMap(e => [e.course, e.institution]),
        ...d.projects.flatMap(p => [p.name, p.stack, p.description]),
        ...d.certifications.flatMap(c => [c.name, c.issuer]),
    ].filter(Boolean).join(' ')
}
