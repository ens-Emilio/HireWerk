/**
 * Sistema de migração de schema para localStorage
 * Permite atualizar a estrutura de dados sem perder informações
 */

import { LS_KEYS, SCHEMA_VERSION } from "./keys";
import { readJson, writeJson } from "./storage";
import type { StorageMeta } from "./schema";

/**
 * Tipo para função de migração
 */
type MigrationFn = () => void;

/**
 * Registro de migrações por versão
 * Adicione novas migrações aqui conforme o schema evolui
 */
const MIGRATIONS: Record<string, MigrationFn> = {
    // Exemplo de migração futura:
    // "1.1.0": migrateToV1_1_0,
};

/**
 * Executa migrações pendentes
 */
export function runMigrations(): void {
    const meta = readJson<StorageMeta>(LS_KEYS.meta);

    if (!meta) {
        console.log("[Migrations] Nenhuma migração necessária (primeira execução)");
        return;
    }

    const currentVersion = meta.version;

    if (currentVersion === SCHEMA_VERSION) {
        console.log("[Migrations] Schema já está na versão mais recente");
        return;
    }

    console.log(`[Migrations] Migrando de ${currentVersion} para ${SCHEMA_VERSION}...`);

    // Executar migrações em ordem
    const versions = Object.keys(MIGRATIONS).sort();

    for (const version of versions) {
        if (version > currentVersion && version <= SCHEMA_VERSION) {
            console.log(`[Migrations] Executando migração para ${version}...`);
            const migrationFn = MIGRATIONS[version];
            if (migrationFn) {
                migrationFn();
            }
        }
    }

    // Atualizar versão
    const updatedMeta: StorageMeta = {
        ...meta,
        version: SCHEMA_VERSION,
        lastMigration: new Date().toISOString(),
    };
    writeJson(LS_KEYS.meta, updatedMeta);

    console.log("[Migrations] Migrações concluídas!");
}

/**
 * Exemplo de função de migração (comentado)
 */
/*
function migrateToV1_1_0(): void {
  // Exemplo: adicionar campo novo a todos os currículos
  const index = readJson<ResumeIndex>(LS_KEYS.resumesIndex);
  if (!index) return;

  index.forEach(item => {
    const resume = readJson<ResumeDoc>(LS_KEYS.resume(item.id));
    if (resume) {
      // Adicionar novo campo
      const updated = { ...resume, newField: "defaultValue" };
      writeJson(LS_KEYS.resume(item.id), updated);
    }
  });
}
*/
