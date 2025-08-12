import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const currentPassword = body?.currentPassword?.toString() ?? "";
    const newPassword = body?.newPassword?.toString() ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "A nova senha deve ter no mínimo 8 caracteres" }, { status: 400 });
    }

    // Verifica a senha atual em um cliente isolado (não mexe nos cookies da sessão atual)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase env não configurado" }, { status: 500 });
    }
    const verifier = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInErr } = await verifier.auth.signInWithPassword({
      email: user.email || "",
      password: currentPassword,
    });
    if (signInErr) {
      let status: number | undefined;
      if (typeof signInErr === "object" && signInErr !== null && "status" in signInErr) {
        const s = (signInErr as { status?: unknown }).status;
        if (typeof s === "number") status = s;
      }
      return NextResponse.json(
        { error: status === 400 ? "Senha atual incorreta" : signInErr.message || "Não foi possível verificar a senha atual" },
        { status: 400 }
      );
    }

    // Atualiza para a nova senha usando a sessão atual
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
