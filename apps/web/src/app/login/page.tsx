"use client";
import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-foreground/70">Carregando…</div>}>
      <InnerLoginPage />
    </Suspense>
  );
}

function InnerLoginPage() {
  const searchParams = useSearchParams();
  const nextParam = (searchParams.get("next") || "").toString();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

  // OAuth removido conforme preferência do usuário

  const signInWithPassword = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const emailInput = email.trim();
      const passwordInput = password.trim();
      const localEmailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(emailInput);
      console.log("[login] signInWithPassword:start", { emailMasked: emailInput.replace(/(.{2}).+(@.*)/, "$1***$2") });
      if (!localEmailValid || !passwordInput) {
        setMessage("Informe um e-mail válido e a senha.");
        console.warn("[login] signInWithPassword:invalid_input", { emailValid: localEmailValid, hasPassword: Boolean(passwordInput) });
        return;
      }
      // Checa rate limit antes de tentar autenticar
      console.log("[login] rateLimit:request", { scope: "login" });
      const res = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, scope: "login" }),
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
      const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
      if (error) {
        let status: number | undefined;
        if (typeof error === "object" && error !== null && "status" in error) {
          const s = (error as { status?: unknown }).status;
          if (typeof s === "number") status = s;
        }
        const msg = (error.message || "").toLowerCase();
        console.error("[login] supabase.signInWithPassword:error", { name: error.name, message: error.message, status });
        if (status === 400) {
          if (msg.includes("confirm") || msg.includes("not confirmed")) {
            setMessage("Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.");
          } else {
            setMessage("E-mail ou senha inválidos.");
          }
          return;
        }
        setMessage(error.message || "Falha ao entrar");
        return;
      }
      const dest = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
      console.log("[login] signInWithPassword:success -> redirect:", dest);
      window.location.href = dest;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao entrar";
      console.error("[login] signInWithPassword:catch", { error: e });
      setMessage(msg);
    } finally {
      console.log("[login] signInWithPassword:end");
      setLoading(false);
    }
  }, [email, password, nextParam]);

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
      const dest = nextParam || "/dashboard";
      const emailRedirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(dest)}`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (error) {
        let status: number | undefined;
        let code: string | number | undefined;
        if (typeof error === "object" && error !== null) {
          if ("status" in error) {
            const s = (error as { status?: unknown }).status;
            if (typeof s === "number") status = s;
          }
          if ("code" in error) {
            const c = (error as { code?: unknown }).code;
            if (typeof c === "string" || typeof c === "number") code = c;
          }
        }
        const msg = (error.message || "").toLowerCase();
        const already = status === 422 || msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already") || msg.includes("exists");
        if (already) {
          console.warn("[login] signUp:email_already_registered", { status, code });
          setMessage("E-mail já registrado. Faça login ou recupere a senha.");
          return;
        }
        console.error("[login] supabase.signUp:error", { name: error.name, message: error.message, status, code });
        setMessage(error.message || "Falha ao criar conta");
        return;
      }
      console.log("[login] signUpWithPassword:success -> email_verification_required, redirect:/check-email");
      const checkUrl = `/check-email?email=${encodeURIComponent(email)}${dest ? `&next=${encodeURIComponent(dest)}` : ""}`;
      window.location.href = checkUrl;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao criar conta";
      console.error("[login] signUpWithPassword:catch", { error: e });
      setMessage(msg);
    } finally {
      console.log("[login] signUpWithPassword:end");
      setLoading(false);
    }
  }, [email, password, nextParam, emailValid]);

  // Link mágico removido conforme preferência do usuário

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-sm text-black">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Voltar ao início
        </Link>
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
            className="h-10 rounded-md border border-border bg-white text-black placeholder:text-[#6b7280] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            autoComplete="email"
          />
          <label className="text-sm font-medium text-primary" htmlFor="password">Senha</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-white text-black placeholder:text-[#6b7280] pr-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-[#6b7280] hover:text-primary focus:outline-none"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.57-1.36 1.4-2.61 2.46-3.68M9.88 9.88A3 3 0 1 0 14.12 14.12" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
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
              className="h-10 flex-1 rounded-md border border-transparent text-white bg-secondary px-4 text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
            >
              Criar conta
            </button>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-accent hover:underline justify-self-end"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </main>
  );
}


