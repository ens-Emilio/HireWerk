/**
 * Chaves do localStorage para o HireWerk
 * Todas as chaves são prefixadas com "hirewerk:" para evitar conflitos
 */

export const LS_KEYS = {
    /** Versão do schema de dados (para migrações futuras) */
    meta: "hirewerk:meta",

    /** Índice de currículos (lista resumida para performance) */
    resumesIndex: "hirewerk:resumes:index",

    /** Documento completo de um currículo */
    resume: (id: string) => `hirewerk:resume:${id}`,

    /** Snapshots de versões de um currículo (limitado a 30) */
    resumeVersions: (id: string) => `hirewerk:resume:${id}:versions`,

    /** Pilha de redo de um currículo (persistida para sobreviver a refresh) */
    resumeFuture: (id: string) => `hirewerk:resume:${id}:future`,

    /** Templates disponíveis */
    templates: "hirewerk:templates",

    /** Configurações globais do app */
    settings: "hirewerk:settings",
} as const;

/** Versão atual do schema */
export const SCHEMA_VERSION = "2.0.0";

/** Versão anterior (para migração) */
export const SCHEMA_VERSION_V1 = "1.0.0";

/** Limite de snapshots por currículo */
export const MAX_SNAPSHOTS_PER_RESUME = 30;
