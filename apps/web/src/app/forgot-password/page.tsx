"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const emailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
      if (!emailValid) {
        setMessage("Informe um e-mail válido.");
        return;
      }
      const rlRes = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scope: "forgot" }),
      });
      const rl = await rlRes.json();
      if (!rlRes.ok || rl?.exceeded) {
        setMessage("Muitas solicitações. Tente novamente em alguns minutos.");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) throw error;
      setMessage("Se o e-mail existir, enviaremos instruções para redefinir a senha.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar e-mail";
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
        <h1 className="mb-2 text-xl font-semibold text-primary">Esqueci minha senha</h1>
        <p className="mb-6 text-sm text-primary/80">Informe seu e-mail para receber o link de redefinição.</p>

        {message && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 h-10 w-full rounded-md border border-border bg-white text-black placeholder:text-[#6b7280] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          autoComplete="email"
          required
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="h-10 w-full rounded-md border border-transparent bg-secondary text-white px-4 text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}


