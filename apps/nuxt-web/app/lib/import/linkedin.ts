/**
 * Import de export do LinkedIn (F9 #93) — ZIP descompactado com fflate, parse local.
 * Formatos suportados: Profile.csv, Positions.csv, Education.csv (export básico)
 * ou CompleteProfileHtml.html (export completo).
 */

import { unzipSync, strFromU8 } from "fflate";
import type { ResumeData } from "../storage/schema";

export interface LinkedInExtract {
    name?: string
    headline?: string
    summary?: string
    location?: string
    experiences?: Array<{ role: string; company: string; period: string; description: string }>
    education?: Array<{ course: string; institution: string }>
}

export async function importLinkedInZip(file: File): Promise<LinkedInExtract> {
    const buffer = new Uint8Array(await file.arrayBuffer())
    const files = unzipSync(buffer)

    const extract: LinkedInExtract = {}

    // CSVs do export básico
    const profileCsv = files["Profile.csv"]
    if (profileCsv) {
        const rows = parseCsv(strFromU8(profileCsv))
        const first = rows[1]
        if (first) {
            // Layout LinkedIn: FirstName,LastName,...,Headline,...
            extract.name = [first[0], first[1]].filter(Boolean).join(" ") || undefined
            extract.headline = first.find((c, i) => i > 2 && c && c.length > 5 && c.length < 120) || undefined
        }
    }

    const positionsCsv = files["Positions.csv"]
    if (positionsCsv) {
        const rows = parseCsv(strFromU8(positionsCsv))
        extract.experiences = rows.slice(1)
            .filter(cols => cols.some(c => c.trim()))
            .map(cols => ({
                role: cols[3]?.trim() ?? "",      // Company Name / Title varia por layout
                company: cols[5]?.trim() ?? "",
                period: [cols[7], cols[8]].filter(c => c?.trim()).join(" — "),
                description: cols[10]?.trim() ?? "",
            }))
            .filter(e => e.role || e.company)
    }

    const educationCsv = files["Education.csv"]
    if (educationCsv) {
        const rows = parseCsv(strFromU8(educationCsv))
        extract.education = rows.slice(1)
            .filter(cols => cols.some(c => c.trim()))
            .map(cols => ({
                course: cols[3]?.trim() ?? "",
                institution: cols[5]?.trim() ?? "",
            }))
            .filter(e => e.course || e.institution)
    }

    // Fallback: HTML do export completo
    const htmlFile = files["CompleteProfileHtml.html"] ?? files["Profile.html"]
    if (!extract.name && htmlFile) {
        const html = strFromU8(htmlFile)
        const titleMatch = html.match(/<title>([^<]+)/i)
        if (titleMatch) extract.name = titleMatch[1]!.split("|")[0]!.trim()
    }

    if (!extract.name && !extract.experiences?.length && !extract.education?.length) {
        throw new Error("Não encontramos os arquivos esperados do LinkedIn (Profile.csv, Positions.csv...).")
    }

    return extract
}

/** CSV simples (sem aspas multilinha — exports LinkedIn não usam) */
function parseCsv(csv: string): string[][] {
    return csv.split(/\r?\n/).filter(Boolean).map(line =>
        line.split(",").map(cell => cell.replace(/^"|"$/g, "").trim())
    )
}
