/**
 * Sistema de migração de schema para localStorage
 * v1.0.0 → v2.0.0: docs ganham estilo/tags/pinned/jobTitle; snapshots ganham label/note;
 * novos arrays de seções com defaults; settings key criada.
 * v2.0.0 → v3.0.0: docs ganham kind/coverLetter/jobDescription/atsHistory e
 * style.sectionOrder; índice ganha kind; settings ganha quotaWarnPct; chaves novas
 * (applications, crypto, shares) são criadas vazias.
 */

import { LS_KEYS, SCHEMA_VERSION, SCHEMA_VERSION_V1 } from "./keys";
import { readJson, writeJson, removeKey } from "./storage";
import { ResumeIndexSchema, ResumeIndexItemSchema, ResumeDocSchema, SettingsSchema, type StorageMeta, type ResumeIndex, type ResumeDoc } from "./schema";

type MigrationFn = () => void;

/** Migração v1 → v2: normaliza docs, índice e snapshots para o schema v2 */
function migrateV1toV2(): void {
    // 1. Re-normalizar cada doc via Zod (defaults preenchem campos novos)
    const rawIndex = readJson<ResumeIndex>(LS_KEYS.resumesIndex) ?? [];
    const index = ResumeIndexSchema.catch([]).parse(rawIndex);

    for (const item of index) {
        const rawDoc = readJson<unknown>(LS_KEYS.resume(item.id));
        const doc = ResumeDocSchema.safeParse(rawDoc).data ?? null;
        if (doc) {
            writeJson(LS_KEYS.resume(item.id), doc);
        }
    }

    // 2. Snapshots: label/note têm default null — Zod .catch normaliza na leitura;
    //    reescrever para persistir o formato novo.
    for (const item of index) {
        const key = LS_KEYS.resumeVersions(item.id);
        const raw = readJson<unknown[]>(key);
        if (!Array.isArray(raw)) continue;
        const normalized = raw.map(s => {
            if (!s || typeof s !== "object") return s;
            const o = s as Record<string, unknown>;
            return {
                version: typeof o.version === "number" ? o.version : 1,
                data: o.data ?? {},
                createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
                label: null,
                note: null,
            };
        });
        writeJson(key, normalized);
        // Pilha de redo v1 não tem mais formato próprio — invalidar com segurança
        removeKey(LS_KEYS.resumeFuture(item.id));
    }

    // 3. Índice re-normalizado de volta
    writeJson(LS_KEYS.resumesIndex, index);

    // 4. Settings defaults
    writeJson(LS_KEYS.settings, SettingsSchema.parse({}));
}

/**
 * Migração v2 → v3: re-normaliza docs (defaults preenchem kind/coverLetter/
 * jobDescription/atsHistory/sectionOrder), índice ganha kind, settings ganha
 * quotaWarnPct e as chaves novas nascem vazias.
 */
function migrateV2toV3(): void {
    // Parse item a item: uma entrada corrompida não pode zerar o índice inteiro
    // (isso apagaria todos os currículos da UI, embora os docs sigam no disco).
    const rawIndex = readJson<unknown[]>(LS_KEYS.resumesIndex);
    const index: ResumeIndex = Array.isArray(rawIndex)
        ? rawIndex.flatMap(item => {
            const parsed = ResumeIndexItemSchema.safeParse(item);
            return parsed.success ? [parsed.data] : [];
        })
        : [];

    const broken: string[] = [];
    for (const item of index) {
        const rawDoc = readJson<unknown>(LS_KEYS.resume(item.id));
        const parsed = ResumeDocSchema.safeParse(rawDoc);
        if (parsed.success) writeJson(LS_KEYS.resume(item.id), parsed.data);
        else if (rawDoc !== null) broken.push(item.id);
    }
    // Índice apontando para doc ilegível = item fantasma que abre em branco.
    const cleanIndex = broken.length > 0 ? index.filter(i => !broken.includes(i.id)) : index;
    if (broken.length > 0) console.warn('[migrations] docs ilegíveis removidos do índice:', broken);

    // Só grava se havia índice: sobrescrever com [] destruiria dados
    if (Array.isArray(rawIndex)) writeJson(LS_KEYS.resumesIndex, cleanIndex);
    // Campo a campo: um valor fora do enum não pode resetar tema/locale/etc.
    const rawSettings = readJson<Record<string, unknown>>(LS_KEYS.settings) ?? {};
    const defaults = SettingsSchema.parse({});
    const merged: Record<string, unknown> = { ...defaults };
    for (const [k, v] of Object.entries(rawSettings)) {
        if (!(k in defaults)) continue;
        const single = SettingsSchema.pick({ [k]: true } as never).safeParse({ [k]: v });
        if (single.success) merged[k] = (single.data as Record<string, unknown>)[k];
    }
    writeJson(LS_KEYS.settings, SettingsSchema.parse(merged));

    if (readJson(LS_KEYS.applications) === null) writeJson(LS_KEYS.applications, []);
    if (readJson(LS_KEYS.shares) === null) writeJson(LS_KEYS.shares, []);
}

const MIGRATIONS: Record<string, MigrationFn> = {
    // "1.1.0": migrateToV1_1_0,
    "2.0.0": migrateV1toV2,
    "3.0.0": migrateV2toV3,
};

export function runMigrations(): void {
    const meta = readJson<StorageMeta>(LS_KEYS.meta);
    if (!meta) return; // primeira execução: seed já cria v2

    if (meta.version === SCHEMA_VERSION) return;

    const versions = Object.keys(MIGRATIONS).sort();
    for (const version of versions) {
        if (version > meta.version && version <= SCHEMA_VERSION) {
            MIGRATIONS[version]?.();
        }
    }

    const updatedMeta: StorageMeta = {
        ...meta,
        version: SCHEMA_VERSION,
        lastMigration: new Date().toISOString(),
    };
    writeJson(LS_KEYS.meta, updatedMeta);
}

// Export para testes
export { SCHEMA_VERSION_V1 };
