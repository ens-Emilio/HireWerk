import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
 ) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  const { data, error } = await supabase
    .from("resumes")
    .select("id,user_id,title,data,template_id,created_at,updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ ok: false }, { status: 404 });
  if (data.user_id !== auth.user.id) return NextResponse.json({ ok: false }, { status: 403 });

  const { user_id: _user_id, ...item } = data as { user_id: string } & Record<string, unknown>;
  void _user_id; // omitido da resposta
  return NextResponse.json({ item });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
 ) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (typeof body?.title === "string") update.title = body.title;
  if (typeof body?.data === "object" && body?.data !== null) update.data = body.data;
  if (typeof body?.template_id === "string") update.template_id = body.template_id;

  // Verifica posse do recurso
  const { data: existing } = await supabase
    .from("resumes")
    .select("user_id")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });
  if (existing.user_id !== auth.user.id) return NextResponse.json({ ok: false }, { status: 403 });

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("resumes").update(update).eq("id", id);
  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body?.title === "string") update.title = body.title;
  if (typeof body?.data === "object" && body?.data !== null) update.data = body.data;
  if (typeof body?.template_id === "string") update.template_id = body.template_id;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { id } = await ctx.params;
  const { error } = await supabase.from("resumes").update(update).eq("id", id);
  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}


