/**
 * Schemas Zod para validação de dados do localStorage — v3
 *
 * v3 adiciona: kind/coverLetter (cartas), jobDescription + atsHistory (vaga),
 * style.sectionOrder (ordem das seções) e ApplicationSchema (tracker).
 */

import { z } from "zod";

/* ============ Sub-schemas de conteúdo ============ */

export const LinkItemSchema = z.object({
    label: z.string().default(""),
    url: z.string().default(""),
    kind: z.enum(["linkedin", "github", "portfolio", "other"]).catch("other"),
});

export const ProjectItemSchema = z.object({
    name: z.string().default(""),
    url: z.string().default(""),
    description: z.string().default(""),
    stack: z.string().default(""),
});

export const CertificationItemSchema = z.object({
    name: z.string().default(""),
    issuer: z.string().default(""),
    year: z.string().default(""),
});

export const LanguageItemSchema = z.object({
    name: z.string().default(""),
    level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "nativo"]).catch("B1"),
});

export const VolunteerItemSchema = z.object({
    role: z.string().default(""),
    org: z.string().default(""),
    period: z.string().default(""),
    description: z.string().default(""),
});

export const ContactItemSchema = z.object({
    value: z.string().default(""),
    // ponytail: string livre — o rótulo é exibição, não invariante; enum quebrava
    // o doc inteiro (import JSON Resume, sync de outra versão) por um valor inesperado.
    label: z.string().default("pessoal"),
    type: z.enum(["email", "phone"]).catch("email"),
});

/* ============ Dados do currículo ============ */

export const ResumeDataSchema = z.object({
    name: z.string().default(""),
    headline: z.string().default(""),
    summary: z.string().default(""),
    location: z.string().default(""),
    photo: z.string().nullable().default(null), // Base64 JPEG comprimido

    emails: z.array(ContactItemSchema).default([]),
    phones: z.array(ContactItemSchema).default([]),
    links: z.array(LinkItemSchema).default([]),

    experiences: z.array(z.object({
        role: z.string().default(""),
        company: z.string().default(""),
        period: z.string().default(""),
        description: z.string().default(""),
    })).default([]),

    education: z.array(z.object({
        course: z.string().default(""),
        institution: z.string().default(""),
    })).default([]),

    skills: z.array(z.string()).default([]),
    softSkills: z.array(z.string()).default([]),
    languages: z.array(z.union([z.string(), LanguageItemSchema])).default([]),

    projects: z.array(ProjectItemSchema).default([]),
    certifications: z.array(CertificationItemSchema).default([]),
    volunteer: z.array(VolunteerItemSchema).default([]),

    // Campos opcionais BR (visíveis só quando showOptionalBR)
    birthDate: z.string().default(""),
    maritalStatus: z.string().default(""),
    salaryExpectation: z.string().default(""),
    showOptionalBR: z.boolean().default(false),
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;

/* ============ Carta de apresentação (v3) ============ */

export const CoverLetterSchema = z.object({
    /** Corpo da carta em texto puro (parágrafos separados por linha em branco) */
    body: z.string().default(""),
    /** Empresa e vaga alvo, para o cabeçalho da carta */
    company: z.string().default(""),
    role: z.string().default(""),
    /** Tom usado na geração assistida (informativo, não altera o texto) */
    tone: z.enum(["formal", "direto", "caloroso"]).catch("formal"),
});

export type CoverLetter = z.infer<typeof CoverLetterSchema>;

/* ============ Histórico de análise ATS (v3) ============ */

export const AtsEntrySchema = z.object({
    at: z.string().datetime(),
    score: z.number().int().min(0).max(100),
    jobDescription: z.string().default(""),
    missing: z.array(z.string()).default([]),
});

export type AtsEntry = z.infer<typeof AtsEntrySchema>;

/* ============ Documento ============ */

export const ResumeDocSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    /** v3: currículo ou carta de apresentação (mesma estrutura, render diferente) */
    kind: z.enum(["resume", "coverLetter"]).catch("resume"),
    templateId: z.string(),
    // Estilo por doc (F3): cor de destaque, escala de fonte, densidade, papel
    style: z.object({
        accentColor: z.string().default(""),       // vazio = accent do template
        fontScale: z.enum(["compact", "normal", "large"]).catch("normal"),
        density: z.enum(["compact", "normal", "relaxed"]).catch("normal"),
        paper: z.enum(["a4", "letter"]).catch("a4"),
        footerText: z.string().default(""),        // rodapé impresso no PDF (vazio = sem rodapé)
        iconTheme: z.enum(["none", "outline", "filled"]).catch("outline"),
        /** v3: ordem das seções no editor e no preview (vazio = ordem padrão) */
        sectionOrder: z.array(z.string()).default([]),
    }).default({ accentColor: "", fontScale: "normal", density: "normal", paper: "a4", footerText: "", iconTheme: "outline", sectionOrder: [] }),
    data: ResumeDataSchema,
    /** v3: carta de apresentação (só usada quando kind === 'coverLetter') */
    coverLetter: CoverLetterSchema.default({ body: "", company: "", role: "", tone: "formal" }),
    /** v3: descrição da vaga persistida (o score ATS deixa de ser volátil) */
    jobDescription: z.string().default(""),
    /** v3: histórico de análises ATS (mais recente primeiro, máx. 20) */
    atsHistory: z.array(AtsEntrySchema).default([]),
    locale: z.string().default("pt-BR"),
    version: z.number().int().min(1).default(1),
    // Metadados de organização (F5)
    tags: z.array(z.string()).default([]),
    pinned: z.boolean().default(false),
    jobTitle: z.string().default(""), // "para a vaga X" (F9)
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().default(null),
});

export type ResumeDoc = z.infer<typeof ResumeDocSchema>;

/* ============ Índice ============ */

export const ResumeIndexItemSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    kind: z.enum(["resume", "coverLetter"]).catch("resume"),
    templateId: z.string(),
    tags: z.array(z.string()).default([]),
    pinned: z.boolean().default(false),
    jobTitle: z.string().default(""),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().default(null),
});

export type ResumeIndexItem = z.infer<typeof ResumeIndexItemSchema>;

export const ResumeIndexSchema = z.array(ResumeIndexItemSchema);

export type ResumeIndex = z.infer<typeof ResumeIndexSchema>;

/* ============ Snapshots ============ */

export const VersionSnapshotSchema = z.object({
    version: z.number().int().min(1),
    data: z.unknown(), // ResumeData no formato da época; validação é histórica
    createdAt: z.string().datetime(),
    label: z.string().nullable().default(null),   // nome dado pelo usuário
    note: z.string().nullable().default(null),    // nota opcional
});

export type VersionSnapshot = z.infer<typeof VersionSnapshotSchema>;

export const VersionSnapshotListSchema = z.array(VersionSnapshotSchema);

export type VersionSnapshotList = z.infer<typeof VersionSnapshotListSchema>;

/* ============ Templates ============ */

export const TemplateSchema = z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
    previewImageUrl: z.string().optional(),
    isDefault: z.boolean().default(false),
    // Template importável da comunidade (F3/F10): estrutura serializada
    importable: z.boolean().optional(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const TemplateListSchema = z.array(TemplateSchema);

export type TemplateList = z.infer<typeof TemplateListSchema>;

/* ============ Tracker de candidaturas (v3) ============ */

export const APPLICATION_STATUSES = ["wishlist", "applied", "interview", "offer", "rejected"] as const;

export const ApplicationSchema = z.object({
    id: z.string().uuid(),
    company: z.string().default(""),
    role: z.string().default(""),
    status: z.enum(APPLICATION_STATUSES).catch("wishlist"),
    /** Data da candidatura (ISO date, YYYY-MM-DD) — comparação lexical exige formato fixo */
    appliedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).catch(""),
    /** Próximo passo / follow-up (ISO date) */
    followUpAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).catch(""),
    /** Currículo usado nesta candidatura */
    resumeId: z.string().default(""),
    url: z.string().default(""),
    notes: z.string().default(""),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Application = z.infer<typeof ApplicationSchema>;

export const ApplicationListSchema = z.array(ApplicationSchema);

export type ApplicationList = z.infer<typeof ApplicationListSchema>;

/* ============ Settings globais (F0) ============ */

export const SettingsSchema = z.object({
    theme: z.enum(["light", "dark", "system"]).catch("system"),
    defaultTemplateId: z.string().default("classic"),
    paper: z.enum(["a4", "letter"]).catch("a4"),
    fontScale: z.enum(["compact", "normal", "large"]).catch("normal"),
    locale: z.string().default("pt-BR"),
    disable3d: z.boolean().default(false), // tilt do hero (F6)
    previewPosition: z.enum(["side", "below"]).catch("side"), // F5
    /** v3: aviso de quota do localStorage a partir deste percentual */
    quotaWarnPct: z.number().int().min(50).max(99).default(80),
});

export type Settings = z.infer<typeof SettingsSchema>;

/* ============ Metadados do storage ============ */

export const StorageMetaSchema = z.object({
    version: z.string(),
    createdAt: z.string().datetime(),
    lastMigration: z.string().datetime().optional(),
});

export type StorageMeta = z.infer<typeof StorageMetaSchema>;
