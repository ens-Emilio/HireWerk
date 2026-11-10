/**
 * Seed inicial de dados para localStorage (v2)
 */

import { LS_KEYS, SCHEMA_VERSION } from "./keys";
import { writeJson, readJson } from "./storage";
import { TemplateListSchema, SettingsSchema, StorageMetaSchema, type TemplateList, type StorageMeta, type Settings } from "./schema";

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
    {
        id: "executive",
        slug: "executive",
        name: "Executivo",
        description: "Serifado, uma coluna, conservador",
        isDefault: false,
    },
    {
        id: "creative",
        slug: "creative",
        name: "Criativo",
        description: "Sidebar colorida para áreas criativas",
        isDefault: false,
    },
];

export function isFirstRun(): boolean {
    const meta = readJson<StorageMeta>(LS_KEYS.meta);
    return meta === null;
}

export function seedStorage(): void {
    const meta: StorageMeta = StorageMetaSchema.parse({
        version: SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
    });
    writeJson(LS_KEYS.meta, meta);

    writeJson(LS_KEYS.templates, DEFAULT_TEMPLATES);
    writeJson(LS_KEYS.resumesIndex, []);
    writeJson(LS_KEYS.settings, SettingsSchema.parse({}));
}

export function getSettings(): Settings {
    const raw = readJson<unknown>(LS_KEYS.settings);
    const parsed = SettingsSchema.safeParse(raw ?? {});
    return parsed.success ? parsed.data : SettingsSchema.parse({});
}

export function saveSettings(settings: Settings): void {
    writeJson(LS_KEYS.settings, settings);
}

export function ensureStorageInitialized(): void {
    if (isFirstRun()) {
        seedStorage();
    }
}
