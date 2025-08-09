import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import CurrentContext from "./CurrentContext";
import { Button } from "@/components/ui/Button";
 

export default async function Header() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header className="w-full border-b border-secondary/50 bg-primary/90 backdrop-blur supports-[backdrop-filter]:bg-primary/70">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between text-primary-foreground">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            HireWerk
          </Link>
          {/* Navegação desktop */}
          <nav className="hidden md:flex items-center gap-4 text-sm text-primary-foreground/80">
            {user ? (
              <>
                <Link href="/dashboard" className="hover:text-primary-foreground">Dashboard</Link>
                <Link href="/resumes" className="hover:text-primary-foreground">Currículos</Link>
              </>
            ) : (
              <>
                <a href="#recursos" className="hover:text-primary-foreground">Recursos</a>
                <a href="#como-funciona" className="hover:text-primary-foreground">Como funciona</a>
              </>
            )}
          </nav>
          {/* Navegação mobile simples com details/summary */}
          <details className="md:hidden">
            <summary className="cursor-pointer text-sm text-primary-foreground/90">Menu</summary>
            <nav className="mt-2 grid gap-2 text-sm text-primary-foreground/90">
              {user ? (
                <>
                  <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                  <Link href="/resumes" className="hover:underline">Currículos</Link>
                </>
              ) : (
                <>
                  <a href="#recursos" className="hover:underline">Recursos</a>
                  <a href="#como-funciona" className="hover:underline">Como funciona</a>
                </>
              )}
            </nav>
          </details>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              {/* Ações rápidas do contexto atual (ex.: exportar/selecionar template) */}
              <CurrentContext variant="header" />
              <span className="hidden sm:inline text-primary-foreground/80">{user.email}</span>
              <form action="/auth/signout" method="post">
                <Button variant="secondary" size="md" type="submit">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent/90"
              >
                Entrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


