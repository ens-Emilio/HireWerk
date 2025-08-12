import Link from "next/link";
import HeaderAuth from "@/app/_components/HeaderAuth";
 

export default function Header() {
  return (
    <header className="w-full border-b border-secondary/50 bg-primary">
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
          <details className="md:hidden">
            <summary className="cursor-pointer text-sm text-primary-foreground/90">Menu</summary>
            <nav className="mt-2 grid gap-2 text-sm text-primary-foreground/90">
              <a href="#recursos" className="hover:underline">Recursos</a>
              <a href="#como-funciona" className="hover:underline">Como funciona</a>
            </nav>
          </details>
        </div>
        <HeaderAuth />
      </div>
    </header>
  );
}


