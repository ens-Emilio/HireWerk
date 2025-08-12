import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Supabase manipula os cookies via getSupabaseServerClient
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");
  if (!code) {
    console.warn("[auth/callback] missing_code", { url: request.url });
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  console.log("[auth/callback] exchange:start");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    let status: number | undefined;
    if (typeof error === "object" && error !== null && "status" in error) {
      const s = (error as { status?: unknown }).status;
      if (typeof s === "number") status = s;
    }
    console.error("[auth/callback] exchange:error", { name: error.name, message: error.message, status });
    return NextResponse.redirect(new URL("/login?error=session", request.url));
  }

  const isSafePath = (p: string | null) => !!p && p.startsWith("/") && !p.startsWith("//");
  const to = isSafePath(redirect) ? (redirect as string) : "/dashboard";
  console.log("[auth/callback] exchange:success -> redirect:", to);
  return NextResponse.redirect(new URL(to, request.url));
}


