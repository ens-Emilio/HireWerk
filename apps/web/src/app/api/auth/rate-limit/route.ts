import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

type Scope = "login" | "forgot" | "signup";
const CONFIG: Record<Scope, { WINDOW_SECONDS: number; MAX_ATTEMPTS: number }> = {
  login: { WINDOW_SECONDS: 60, MAX_ATTEMPTS: 10 },
  forgot: { WINDOW_SECONDS: 300, MAX_ATTEMPTS: 5 },
  signup: { WINDOW_SECONDS: 3600, MAX_ATTEMPTS: 5 },
};

export async function POST(req: Request) {
  const startedAt = Date.now();
  const admin = getSupabaseAdminClient();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    scope?: Scope;
  };
  const email: string = typeof body?.email === "string" ? body.email.toLowerCase() : "";
  const emailMasked = email ? email.replace(/(.{2}).+(@.*)/, "$1***$2") : "";
  if (!email) {
    console.warn("[api/auth/rate-limit] missing_email", { ip });
    return NextResponse.json({ ok: false, reason: "missing_email" }, { status: 400 });
  }

  const scope = (body?.scope as Scope) ?? "login";
  const { WINDOW_SECONDS, MAX_ATTEMPTS } = CONFIG[scope];

  // Em desenvolvimento, não bloquear (melhora UX durante testes)
  if (process.env.NODE_ENV !== "production") {
    console.log("[api/auth/rate-limit] dev_mode_allow", { scope, ip, emailMasked });
    return NextResponse.json({
      ok: true,
      exceeded: false,
      current: 0,
      limit: MAX_ATTEMPTS,
      windowSeconds: WINDOW_SECONDS,
      scope,
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const windowBucket = Math.floor(now / WINDOW_SECONDS);
  const key = `${scope}:${ip}:${email}`;

  console.log("[api/auth/rate-limit] rpc:start", { scope, ip, emailMasked, windowBucket, limit: MAX_ATTEMPTS });
  const { data, error } = await admin
    .rpc("rate_limit_hit", {
      p_key: key,
      p_window: windowBucket,
      p_limit: MAX_ATTEMPTS,
    })
    .single();

  if (error) {
    console.error("[api/auth/rate-limit] rpc:error", { name: error.name, message: error.message });
    return NextResponse.json({ ok: false, reason: "rl_error" }, { status: 500 });
  }

  type RateLimitResult = { exceeded: boolean; current_count: number } | null;
  const result = data as RateLimitResult;
  const exceeded = result?.exceeded === true;
  const current = Number(result?.current_count ?? 0);
  const durationMs = Date.now() - startedAt;
  console.log("[api/auth/rate-limit] rpc:done", { scope, ip, emailMasked, exceeded, current, limit: MAX_ATTEMPTS, durationMs });
  return NextResponse.json({ ok: true, exceeded, current, limit: MAX_ATTEMPTS, windowSeconds: WINDOW_SECONDS, scope });
}


