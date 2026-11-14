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

export function completeness(data: ResumeData, t: (key: string) => string): { pct: number; checks: QualityCheck[] } {
    const checks: QualityCheck[] = [
        { id: 'name', label: t('quality.name'), done: data.name.trim().length > 1, weight: 10 },
        { id: 'headline', label: t('quality.headline'), done: data.headline.trim().length > 2, weight: 10, hint: t('quality.headlineHint') },
        { id: 'summary', label: t('quality.summary'), done: data.summary.trim().split(/\s+/).filter(Boolean).length >= 40, weight: 15, hint: t('quality.summaryHint') },
        { id: 'contact', label: t('quality.contact'), done: data.emails.some(e => e.value) || data.phones.some(p => p.value), weight: 15 },
        { id: 'exp', label: t('quality.exp'), done: data.experiences.some(e => e.role.trim()), weight: 15 },
        { id: 'expdesc', label: t('quality.expdesc'), done: data.experiences.filter(e => e.role).every(e => e.description.trim().length > 20), weight: 10, hint: t('quality.expdescHint') },
        { id: 'edu', label: t('quality.edu'), done: data.education.some(e => e.course.trim()), weight: 10 },
        { id: 'skills', label: t('quality.skills'), done: data.skills.filter(Boolean).length >= 5, weight: 10, hint: t('quality.skillsHint') },
        { id: 'links', label: t('quality.links'), done: data.links.some(l => l.url.trim()), weight: 5 },
    ]

    const total = checks.reduce((s, c) => s + c.weight, 0)
    const done = checks.reduce((s, c) => s + (c.done ? c.weight : 0), 0)
    return { pct: Math.round((done / total) * 100), checks }
}
