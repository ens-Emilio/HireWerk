import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(request: Request) {
  console.log("[auth/signout] start");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    let status: number | undefined;
    if (typeof error === "object" && error !== null && "status" in error) {
      const s = (error as { status?: unknown }).status;
      if (typeof s === "number") status = s;
    }
    console.error("[auth/signout] error", { name: error.name, message: error.message, status });
  } else {
    console.log("[auth/signout] success");
  }
  return NextResponse.redirect(new URL("/", request.url));
}


