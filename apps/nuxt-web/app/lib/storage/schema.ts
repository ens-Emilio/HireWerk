/**
 * Schemas Zod para validação de dados do localStorage
 */

import { z } from "zod";

/**
 * Schema para dados do currículo (estrutura flexível)
 * TODO: Definir schema mais específico baseado nos campos reais
 */
export const ResumeDataSchema = z.record(z.string(), z.any());

/**
 * Schema para documento completo de currículo
 */
export const ResumeDocSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    templateId: z.string(),
    data: ResumeDataSchema,
    locale: z.string().default("pt-BR"),
    version: z.number().int().min(1).default(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().default(null),
});

export type ResumeDoc = z.infer<typeof ResumeDocSchema>;

/**
 * Schema para item do índice de currículos (versão resumida)
 */
export const ResumeIndexItemSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    templateId: z.string(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().default(null),
});

export type ResumeIndexItem = z.infer<typeof ResumeIndexItemSchema>;

/**
 * Schema para o índice completo de currículos
 */
export const ResumeIndexSchema = z.array(ResumeIndexItemSchema);

export type ResumeIndex = z.infer<typeof ResumeIndexSchema>;

/**
 * Schema para snapshot de versão
 */
export const VersionSnapshotSchema = z.object({
    version: z.number().int().min(1),
    data: ResumeDataSchema,
    createdAt: z.string().datetime(),
});

export type VersionSnapshot = z.infer<typeof VersionSnapshotSchema>;

/**
 * Schema para lista de snapshots
 */
export const VersionSnapshotListSchema = z.array(VersionSnapshotSchema);

export type VersionSnapshotList = z.infer<typeof VersionSnapshotListSchema>;

/**
 * Schema para log de exportação
 */
export const ExportLogSchema = z.object({
    id: z.string().uuid(),
    resumeId: z.string().uuid(),
    format: z.enum(["pdf", "json"]),
    status: z.enum(["succeeded", "failed"]),
    createdAt: z.string().datetime(),
    sizeBytes: z.number().int().nonnegative().optional(),
    error: z.string().optional(),
    resumeVersion: z.number().int().min(1).optional(),
});

export type ExportLog = z.infer<typeof ExportLogSchema>;

/**
 * Schema para lista de logs de exportação
 */
export const ExportLogListSchema = z.array(ExportLogSchema);

export type ExportLogList = z.infer<typeof ExportLogListSchema>;

/**
 * Schema para template de currículo
 */
export const TemplateSchema = z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
    previewImageUrl: z.string().optional(),
    isDefault: z.boolean().default(false),
});

export type Template = z.infer<typeof TemplateSchema>;

/**
 * Schema para lista de templates
 */
export const TemplateListSchema = z.array(TemplateSchema);

export type TemplateList = z.infer<typeof TemplateListSchema>;

/**
 * Schema para metadados do storage
 */
export const StorageMetaSchema = z.object({
    version: z.string(),
    createdAt: z.string().datetime(),
    lastMigration: z.string().datetime().optional(),
});

export type StorageMeta = z.infer<typeof StorageMetaSchema>;
