/**
 * Checklist de qualidade + % de completude do currículo (F5)
 */

import type { ResumeData } from "./storage/schema";

export interface QualityCheck {
    id: string
    label: string
    done: boolean
    /** peso no score de completude */
    weight: number
    hint?: string
}

export function completeness(data: ResumeData): { pct: number; checks: QualityCheck[] } {
    const checks: QualityCheck[] = [
        { id: 'name', label: 'Nome preenchido', done: data.name.trim().length > 1, weight: 10 },
        { id: 'headline', label: 'Título profissional', done: data.headline.trim().length > 2, weight: 10, hint: 'Ex: Desenvolvedor Front-end' },
        { id: 'summary', label: 'Resumo (40+ palavras)', done: data.summary.trim().split(/\s+/).filter(Boolean).length >= 40, weight: 15, hint: 'Duas a quatro linhas sobre sua trajetória' },
        { id: 'contact', label: 'E-mail ou telefone', done: data.emails.some(e => e.value) || data.phones.some(p => p.value), weight: 15 },
        { id: 'exp', label: 'Pelo menos 1 experiência', done: data.experiences.some(e => e.role.trim()), weight: 15 },
        { id: 'expdesc', label: 'Descrição nas experiências', done: data.experiences.filter(e => e.role).every(e => e.description.trim().length > 20), weight: 10, hint: 'Use verbos de ação: liderei, reduzi, migrei' },
        { id: 'edu', label: 'Formação', done: data.education.some(e => e.course.trim()), weight: 10 },
        { id: 'skills', label: '5+ habilidades', done: data.skills.filter(Boolean).length >= 5, weight: 10, hint: 'Habilidades técnicas que a vaga pede' },
        { id: 'links', label: 'LinkedIn ou portfólio', done: data.links.some(l => l.url.trim()), weight: 5 },
    ]

    const total = checks.reduce((s, c) => s + c.weight, 0)
    const done = checks.reduce((s, c) => s + (c.done ? c.weight : 0), 0)
    return { pct: Math.round((done / total) * 100), checks }
}
