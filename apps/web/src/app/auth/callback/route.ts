import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: Request) {
  // Supabase manipula os cookies via getSupabaseServerClient
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    console.warn("[auth/callback] missing_code", { url: request.url });
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  console.log("[auth/callback] exchange:start");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchange:error", { name: error.name, message: error.message, status: (error as any)?.status });
    return NextResponse.redirect(new URL("/login?error=session", request.url));
  }

  console.log("[auth/callback] exchange:success -> redirect:/");
  return NextResponse.redirect(new URL("/", request.url));
}


