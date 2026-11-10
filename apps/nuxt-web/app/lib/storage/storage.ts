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

