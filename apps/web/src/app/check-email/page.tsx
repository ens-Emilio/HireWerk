"use client";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") || "").toString();
  const nextParam = (searchParams.get("next") || "").toString();

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maskedEmail = useMemo(() => {
    if (!email) return "";
    try {
      return email.replace(/(.{2}).+(@.*)/, "$1***$2");
    } catch {
      return email;
    }
  }, [email]);

  const resend = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;
      const dest = nextParam || "/dashboard";
      const emailRedirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(dest)}`;

      // Supabase v2 possui auth.resend para reenvio de confirmação
      const resendFn = (supabase.auth as any)?.resend;
      if (typeof resendFn === "function") {
        const { error } = await resendFn({
          type: "signup",
          email,
          options: { emailRedirectTo },
        });
        if (error) {
          console.error("[check-email] resend:error", { name: error.name, message: error.message, status: (error as any)?.status });
          setMessage(error.message || "Falha ao reenviar e-mail. Tente novamente em instantes.");
          return;
        }
        setMessage("E-mail reenviado. Verifique sua caixa de entrada.");
        return;
      }

      // Fallback: orientar o usuário caso a função não exista
      console.warn("[check-email] resend:unavailable_function");
      setMessage("Não foi possível reenviar automaticamente. Tente novamente mais tarde ou verifique sua caixa de spam.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao reenviar e-mail";
      console.error("[check-email] resend:catch", { error: e });
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [email, nextParam]);

  const loginHref = useMemo(() => {
    const safe = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//");
    return safe ? `/login?next=${encodeURIComponent(nextParam)}` : "/login";
  }, [nextParam]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-sm text-black">
        <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Voltar ao início
        </a>

        <h1 className="mb-2 text-xl font-semibold text-primary">Confirme seu e-mail</h1>
        <p className="mb-4 text-sm text-primary/80">
          Enviamos um link de confirmação para <strong className="text-primary">{maskedEmail || "seu e-mail"}</strong>.
        </p>

        {message && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {message}
          </div>
        )}

        <div className="grid gap-3">
          <button
            onClick={resend}
            disabled={loading || !email}
            className="h-10 rounded-md border border-transparent bg-accent text-white px-4 text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
          >
            Reenviar e-mail
          </button>

          <div className="text-xs text-primary/70 mt-2">
            Dicas:
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Verifique a caixa de spam ou promoções.</li>
              <li>Adicione nosso domínio aos remetentes confiáveis.</li>
              <li>O link expira após algum tempo — se expirar, reenvie.</li>
            </ul>
          </div>

          <div className="mt-4 grid gap-2">
            <a href={loginHref} className="text-sm text-accent hover:underline">Voltar ao login</a>
            <a href="/forgot-password" className="text-sm text-accent hover:underline">Esqueci minha senha</a>
            {nextParam ? (
              <a href={nextParam} className="text-sm text-accent hover:underline">Ir para o destino após confirmar</a>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
