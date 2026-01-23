/**
 * Seed inicial de dados para localStorage
 * Executado na primeira vez que o app é aberto
 */

import { LS_KEYS, SCHEMA_VERSION } from "./keys";
import { writeJson, readJson } from "./storage";
import type { TemplateList, StorageMeta } from "./schema";

/**
 * Templates padrão do HireWerk
 */
const DEFAULT_TEMPLATES: TemplateList = [
    {
        id: "classic",
        slug: "classic",
        name: "Clássico",
        description: "Template tradicional e profissional",
        isDefault: true,
    },
    {
        id: "minimal",
        slug: "minimal",
        name: "Minimalista",
        description: "Design limpo e moderno",
        isDefault: false,
    },
    {
        id: "modern",
        slug: "modern",
        name: "Moderno",
        description: "Template contemporâneo com cores",
        isDefault: false,
    },
];

/**
 * Verifica se é a primeira vez que o app está sendo executado
 */
export function isFirstRun(): boolean {
    const meta = readJson<StorageMeta>(LS_KEYS.meta);
    return meta === null;
}

/**
 * Inicializa o storage com dados padrão
 */
export function seedStorage(): void {
    console.log("[Storage] Inicializando storage pela primeira vez...");

    // Metadados
    const meta: StorageMeta = {
        version: SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
    };
    writeJson(LS_KEYS.meta, meta);

    // Templates
    writeJson(LS_KEYS.templates, DEFAULT_TEMPLATES);

    // Índice de currículos vazio
    writeJson(LS_KEYS.resumesIndex, []);

    // Log de exportações vazio
    writeJson(LS_KEYS.exports, []);

    console.log("[Storage] Storage inicializado com sucesso!");
}

/**
 * Garante que o storage está inicializado
 * Chama seedStorage() se for a primeira execução
 */
export function ensureStorageInitialized(): void {
    if (isFirstRun()) {
        seedStorage();
    }
}
