import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Editor from "./ui/Editor";
type ResumeRow = { id: string; title: string; data: unknown; updated_at: string; template_id: string | null };

export default async function ResumeEditorPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id,title,data,updated_at,template_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single<ResumeRow>();
  if (error || !data) notFound();

  // Resolve slug do template quando template_id for UUID
  let initialTemplateId: string | null = data.template_id;
  if (data.template_id && /^[0-9a-fA-F-]{36}$/.test(data.template_id)) {
    const { data: tpl } = await supabase
      .from("templates")
      .select("slug")
      .eq("id", data.template_id)
      .single();
    initialTemplateId = tpl?.slug || data.template_id;
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Editar currículo</h1>
      {/* Editor client-side com autosave */}
      <Editor resumeId={data.id} initialTitle={data.title} initialData={data.data} initialTemplateId={initialTemplateId} />
    </div>
  );
}


