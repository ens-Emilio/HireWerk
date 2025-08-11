import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data, error } = await supabase
    .from("resumes")
    .select("id,title,updated_at,deleted_at")
    .eq("user_id", auth.user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false }, { status: 401 });

  let payload: { title?: string; data?: unknown } = {};
  try {
    payload = await req.json();
  } catch {}

  const title = typeof payload.title === "string" && payload.title.trim() ? payload.title.trim() : "Novo currículo";
  const resumeData =
    typeof payload.data === "object" && payload.data !== null
      ? payload.data
      : { name: "", headline: "", summary: "", skills: [] };

  const { data, error } = await supabase
    .from("resumes")
    .insert({ user_id: auth.user.id, title, data: resumeData })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ ok: false, error: error?.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
