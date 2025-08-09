"use client";
import { useCallback, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

  // OAuth removido conforme preferência do usuário

  const signInWithPassword = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      console.log("[login] signInWithPassword:start", { emailMasked: email.replace(/(.{2}).+(@.*)/, "$1***$2") });
      if (!emailValid || !password) {
        setMessage("Informe um e-mail válido e a senha.");
        console.warn("[login] signInWithPassword:invalid_input", { emailValid, hasPassword: Boolean(password) });
        return;
      }
      // Checa rate limit antes de tentar autenticar
      console.log("[login] rateLimit:request", { scope: "login" });
      const res = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scope: "login" }),
      });
      const rl = await res.json();
      console.log("[login] rateLimit:response", { status: res.status, rl });
      if (!res.ok || rl?.exceeded) {
        setMessage("Muitas tentativas. Tente novamente em instantes.");
        console.warn("[login] rateLimit:block", { ok: res.ok, exceeded: rl?.exceeded, current: rl?.current, limit: rl?.limit });
        return;
      }

      const supabase = getSupabaseBrowserClient();
      console.log("[login] supabase.signInWithPassword:call");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[login] supabase.signInWithPassword:error", { name: error.name, message: error.message, status: (error as any)?.status });
      }
      if (error) throw error;
      console.log("[login] signInWithPassword:success -> redirect:/dashboard");
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao entrar";
      console.error("[login] signInWithPassword:catch", { error: e });
      setMessage(msg);
    } finally {
      console.log("[login] signInWithPassword:end");
      setLoading(false);
    }
  }, [email, password]);

  const signUpWithPassword = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;
      console.log("[login] signUpWithPassword:start", { emailMasked: email.replace(/(.{2}).+(@.*)/, "$1***$2") });
      if (!emailValid || password.length < 8) {
        setMessage("Use um e-mail válido e senha com no mínimo 8 caracteres.");
        console.warn("[login] signUpWithPassword:invalid_input", { emailValid, passwordLen: password.length });
        return;
      }
      console.log("[login] rateLimit:request", { scope: "signup" });
      const rlRes = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scope: "signup" }),
      });
      const rl2 = await rlRes.json();
      console.log("[login] rateLimit:response", { status: rlRes.status, rl: rl2 });
      if (!rlRes.ok || rl2?.exceeded) {
        setMessage("Muitas tentativas de cadastro. Tente novamente mais tarde.");
        console.warn("[login] rateLimit:block", { ok: rlRes.ok, exceeded: rl2?.exceeded, current: rl2?.current, limit: rl2?.limit });
        return;
      }

      console.log("[login] supabase.signUp:call");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) {
        console.error("[login] supabase.signUp:error", { name: error.name, message: error.message, status: (error as any)?.status });
      }
      if (error) throw error;
      console.log("[login] signUpWithPassword:success -> email_verification_required");
      setMessage("Conta criada. Verifique seu e-mail para confirmar o acesso.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao criar conta";
      console.error("[login] signUpWithPassword:catch", { error: e });
      setMessage(msg);
    } finally {
      console.log("[login] signUpWithPassword:end");
      setLoading(false);
    }
  }, [email, password]);

  // Link mágico removido conforme preferência do usuário

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm rounded-xl border border-secondary/50 bg-surface p-6 shadow-sm">
        <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Voltar ao início
        </a>
        <h1 className="mb-2 text-xl font-semibold text-primary">Entrar no HireWerk</h1>
        <p className="mb-6 text-sm text-primary/80">Use e-mail e senha para acessar sua conta.</p>

        {message && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {message}
          </div>
        )}

        <div className="grid gap-3 mb-3">
          <label className="text-sm font-medium text-primary" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-md border border-secondary/70 bg-surface text-primary placeholder:text-[#6b7280] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            autoComplete="email"
          />
          <label className="text-sm font-medium text-primary" htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 rounded-md border border-secondary/70 bg-surface text-primary placeholder:text-[#6b7280] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            autoComplete="current-password"
          />
          <div className="flex gap-2">
            <button
              onClick={signInWithPassword}
              disabled={loading}
              className="h-10 flex-1 rounded-md border border-transparent bg-accent text-white px-4 text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
            >
              Entrar
            </button>
            <button
              onClick={signUpWithPassword}
              disabled={loading}
              className="h-10 flex-1 rounded-md border border-secondary/70 text-white bg-secondary px-4 text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
            >
              Criar conta
            </button>
          </div>
          <a
            href="/forgot-password"
            className="text-sm text-accent hover:underline justify-self-end"
          >
            Esqueci minha senha
          </a>
        </div>
      </div>
    </main>
  );
}


