/**
 * Helpers seguros para interação com localStorage
 * Protege contra erros de SSR e parse de JSON
 */

/**
 * Lê e faz parse de JSON do localStorage
 * Retorna null se a chave não existir ou se houver erro de parse
 * Protegido contra SSR (retorna null se window não existir)
 */
export function readJson<T = unknown>(key: string): T | null {
    // Proteção SSR: localStorage só existe no browser
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch (error) {
        console.error(`[Storage] Erro ao ler chave "${key}":`, error);
        return null;
    }
}

/**
 * Escreve valor como JSON no localStorage
 * Lança erro se houver problema (ex: quota excedida)
 */
export function writeJson(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        // QuotaExceededError: localStorage cheio
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
            console.error("[Storage] Quota de localStorage excedida!");
            throw new Error("Espaço de armazenamento cheio. Considere deletar currículos antigos.");
        }
        console.error(`[Storage] Erro ao escrever chave "${key}":`, error);
        throw error;
    }
}

/**
 * Remove uma chave do localStorage
 */
export function removeKey(key: string): void {
    window.localStorage.removeItem(key);
}

/**
 * Limpa todas as chaves do HireWerk
 * CUIDADO: Esta operação é irreversível!
 */
export function clearAll(): void {
    const keys = Object.keys(window.localStorage);
    const hirewerkKeys = keys.filter(k => k.startsWith("hirewerk:"));
    hirewerkKeys.forEach(k => window.localStorage.removeItem(k));
}

/**
 * Estima o uso de storage em bytes
 * Retorna aproximação do espaço usado pelo HireWerk
 */
export function estimateStorageUsage(): number {
    if (typeof window === "undefined") return 0;

    const keys = Object.keys(window.localStorage);
    const hirewerkKeys = keys.filter(k => k.startsWith("hirewerk:"));

    let totalBytes = 0;
    hirewerkKeys.forEach(key => {
        const value = window.localStorage.getItem(key);
        if (value) {
            // Aproximação: cada char = 2 bytes (UTF-16)
            totalBytes += (key.length + value.length) * 2;
        }
    });

    return totalBytes;
}

/**
 * Formata bytes para exibição legível
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
