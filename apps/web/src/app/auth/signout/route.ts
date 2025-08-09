import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(request: Request) {
  console.log("[auth/signout] start");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth/signout] error", { name: error.name, message: error.message, status: (error as any)?.status });
  } else {
    console.log("[auth/signout] success");
  }
  return NextResponse.redirect(new URL("/", request.url));
}


