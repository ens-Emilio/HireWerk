 "use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import HeaderAuth from "@/app/_components/HeaderAuth";
import ThemeSelector from "./ThemeSelector";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 md:static w-full border-b border-border bg-primary">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between text-primary-foreground">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            HireWerk
          </Link>
          {/* Navegação desktop */}
          <nav className="hidden md:flex items-center gap-4 text-sm text-primary-foreground/80">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/resumes" className="hover:underline">Currículos</Link>
          </nav>
          {/* Navegação mobile (somente público, rotas autenticadas usam MobileNav) */}
          <div className="md:hidden relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={open}
              aria-controls="menu-mobile-header"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md p-2 text-primary-foreground/90 hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-foreground/80"
            >
              {/* Ícone hamburger */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M3.75 6.75h16.5a.75.75 0 0 0 0-1.5H3.75a.75.75 0 0 0 0 1.5Zm16.5 5.25H3.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5Zm0 6H3.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5Z" />
              </svg>
            </button>
            {open && (
              <nav
                id="menu-mobile-header"
                className="absolute left-0 top-full mt-2 w-56 rounded-md border border-border bg-primary text-primary-foreground shadow-lg p-2"
              >
                <a href="#recursos" onClick={() => setOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-foreground/10">Recursos</a>
                <a href="#como-funciona" onClick={() => setOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-foreground/10">Como funciona</a>
              </nav>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}


