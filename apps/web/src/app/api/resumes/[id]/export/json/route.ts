import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

type ResumeRow = {
  id: string;
  user_id: string;
  title: string | null;
  data: Record<string, unknown> | null;
  template_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  version: number | null;
};

async function doExport(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  let supabase: Awaited<ReturnType<typeof getSupabaseServerClient>> | null = null;
  let exportId: string | null = null;
  let start: number | null = null;
  try {
    const { id } = await ctx.params;
    supabase = await getSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return new NextResponse("Não autorizado", { status: 401 });

    // Verifica se o currículo pertence ao usuário e carrega dados
    const { data, error } = await supabase
      .from("resumes")
      .select("id,user_id,title,data,template_id,created_at,updated_at,version")
      .eq("id", id)
      .single();

    if (error || !data) return new NextResponse("Currículo não encontrado", { status: 404 });
    if (data.user_id !== auth.user.id) return new NextResponse("Acesso não autorizado", { status: 403 });

    // Inicia logging
    start = Date.now();
    try {
      const inserted = await supabase
        .from("exports")
        .insert({
          resume_id: id,
          user_id: auth.user.id,
          format: "json",
          engine: "none",
          resume_version: (data as ResumeRow).version ?? null,
          status: "running",
        })
        .select("id")
        .single();
      exportId = inserted.data?.id ?? null;
    } catch {
      // não falhar export por causa do log
    }

    // Monta payload de exportação
    const row = data as ResumeRow;
    const payload = {
      id: row.id,
      title: row.title ?? null,
      template_id: row.template_id ?? null,
      version: row.version ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
      data: row.data ?? {},
    };

    const json = JSON.stringify(payload, null, 2);

    // Atualiza logging como sucesso
    try {
      const durationMs = typeof start === "number" ? Date.now() - start : null;
      let checksum = "";
      try {
        const hasher = crypto.createHash("sha256");
        hasher.update(json);
        checksum = hasher.digest("hex");
      } catch {}
      if (typeof exportId === "string") {
        await supabase
          .from("exports")
          .update({
            status: "succeeded",
            ...(durationMs !== null ? { duration_ms: durationMs } : {}),
            size_bytes: Buffer.byteLength(json, "utf8"),
            checksum,
          })
          .eq("id", exportId);
      }
    } catch {}

    // Define filename seguro
    const rawBase = String((row.title as string | null) || `resume-${id}`)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");
    const safeBase = rawBase
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || `resume-${id}`;

    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="hirewerk-${safeBase}.json"`,
      "Cache-Control": "private, no-store",
    });

    return new NextResponse(json, { status: 200, headers });
  } catch (error) {
    console.error("Erro ao exportar JSON:", error);
    try {
      if (supabase && typeof exportId === "string") {
        const durationMs = typeof start === "number" ? Date.now() - start : null;
        await supabase
          .from("exports")
          .update({
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            ...(durationMs !== null ? { duration_ms: durationMs } : {}),
          })
          .eq("id", exportId);
      }
    } catch {}
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return doExport(request, ctx);
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return doExport(request, ctx);
}
