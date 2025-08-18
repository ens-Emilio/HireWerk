"use client";
import { useEffect, useState } from "react";

const MODE_KEY = "hw-theme-mode"; // "light" | "dark"
function applyTheme(dark: boolean) {
  const body = document.body;
  // Remove classes de tema conhecidas para evitar conflito
  const toRemove = [
    "theme-dark",
    "theme-light",
  ];
  for (const c of toRemove) body.classList.remove(c);
  body.classList.add(dark ? "theme-dark" : "theme-light");
}

export default function ThemeSelector() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Carrega preferências
    try {
      const savedMode = localStorage.getItem(MODE_KEY);
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialDark = savedMode ? savedMode === "dark" : prefersDark;
      setDark(initialDark);
      applyTheme(initialDark);
    } catch {}
    setMounted(true);

    // Sincroniza entre abas
    function onStorage(e: StorageEvent) {
      if (e.key === MODE_KEY) {
        const m = localStorage.getItem(MODE_KEY) === "dark";
        setDark(m);
        applyTheme(m);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Persiste e aplica a cada alteração
    try {
      localStorage.setItem(MODE_KEY, dark ? "dark" : "light");
    } catch {}
    applyTheme(dark);
  }, [dark, mounted]);

  const label = dark ? "Escuro" : "Claro";

  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label="Alternar modo escuro"
        aria-pressed={dark}
        onClick={() => setDark((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/40 text-primary-foreground hover:bg-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-foreground/80"
        title={`Modo ${label}`}
      >
        {dark ? (
          // Ícone lua
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z" />
          </svg>
        ) : (
          // Ícone sol
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 0 1-1v-1a1 1 0 1 0-2 0v1a1 1 0 0 0 1 1Zm0-20a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1Zm10 11a1 1 0 0 0-1-1h-1a1 1 0 1 0 0 2h1a1 1 0 0 0 1-1ZM4 12a1 1 0 0 0-1-1H2a1 1 0 1 0 0 2h1a1 1 0 0 0 1-1Zm14.95 6.364a1 1 0 0 0 0-1.414l-.707-.707a1 1 0 1 0-1.414 1.414l.707.707a1 1 0 0 0 1.414 0ZM6.172 6.172a1 1 0 0 0 0-1.414L5.464 4.05a1 1 0 1 0-1.414 1.414l.707.707a1 1 0 0 0 1.414 0ZM6.172 17.828a1 1 0 0 0-1.414 0l-.707.707a1 1 0 1 0 1.414 1.414l.707-.707a1 1 0 0 0 0-1.414Zm12.02-12.02a1 1 0 0 0-1.414 0l-.707.707A1 1 0 0 0 17.485 6.9l.707-.707a1 1 0 0 0 0-1.414Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
