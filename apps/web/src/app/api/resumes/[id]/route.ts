import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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


