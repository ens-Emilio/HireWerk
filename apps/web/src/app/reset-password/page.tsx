"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-foreground/70">Carregando…</div>}>
      <InnerResetPassword />
    </Suspense>
  );
}

function InnerResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Quando chega por e-mail, Supabase coloca code/type na URL; a troca da sessão ocorre automaticamente
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    if (!code || type !== "recovery") return;
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("As senhas não conferem.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Senha alterada com sucesso. Você já pode acessar o dashboard.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao redefinir a senha";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-sm text-black">
        <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Voltar ao início
        </a>
        <h1 className="mb-2 text-xl font-semibold text-primary">Redefinir senha</h1>
        <p className="mb-6 text-sm text-primary/80">Defina uma nova senha para sua conta.</p>

        {message && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {message}
          </div>
        )}

        <input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 h-10 w-full rounded-md border border-border bg-white text-black placeholder:text-[#6b7280] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          autoComplete="new-password"
          required
        />
        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mb-3 h-10 w-full rounded-md border border-border bg-white text-black placeholder:text-[#6b7280] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          autoComplete="new-password"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-md border border-transparent bg-secondary text-white px-4 text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
        >
          Salvar nova senha
        </button>
      </form>
    </main>
  );
}


