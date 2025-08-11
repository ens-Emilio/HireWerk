import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data, error } = await supabase
    .from("templates")
    .select("id,slug,name,preview_image_url")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}
