"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createResume() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const userId = auth.user.id;
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title: "Novo currículo",
      data: {
        name: auth.user.user_metadata?.full_name || "",
        headline: "",
        summary: "",
        skills: [],
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Falha ao criar currículo");
  }

  revalidatePath("/resumes");
  redirect(`/resumes/${data.id}?created=1`);
}

export async function softDeleteResume(id: string) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  await supabase.from("resumes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/resumes");
  redirect(`/resumes?deleted=1`);
}


