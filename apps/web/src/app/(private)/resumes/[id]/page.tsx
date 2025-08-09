import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Editor from "./ui/Editor";
type ResumeRow = { id: string; title: string; data: unknown; updated_at: string };

export default async function ResumeEditorPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id,title,data,updated_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single<ResumeRow>();
  if (error || !data) notFound();

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Editar currículo</h1>
      {/* Editor client-side com autosave */}
      <Editor resumeId={data.id} initialTitle={data.title} initialData={data.data} />
    </div>
  );
}


