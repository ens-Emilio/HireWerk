"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function HeaderAuth() {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setIsAuthed(!!data.user);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Enquanto carrega, mostra uma versão leve (sem bloquear LCP)
  if (loading) {
    return (
      <nav className="flex items-center gap-3 text-sm" aria-label="Ações de conta">
        <div className="h-9 w-16 rounded-md bg-white/10 animate-pulse" />
      </nav>
    );
  }

  if (!isAuthed) {
    return (
      <nav className="flex items-center gap-3 text-sm" aria-label="Ações de conta">
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          Entrar
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm" aria-label="Ações de conta">
      <Link href="/settings" className="hidden sm:inline text-primary-foreground/70 hover:underline">
        Conta
      </Link>
      <form action="/auth/signout" method="post">
        <Button variant="secondary" size="md" type="submit">
          Sair
        </Button>
      </form>
    </nav>
  );
}
