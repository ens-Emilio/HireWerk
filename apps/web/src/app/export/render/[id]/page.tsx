import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import ClassicTemplate from "@/app/_components/templates/ClassicTemplate";
import ModernTemplate from "@/app/_components/templates/ModernTemplate";
import MinimalTemplate from "@/app/_components/templates/MinimalTemplate";

export const metadata: Metadata = {
  title: "Exportar PDF | HireWerk",
};

type ResumeRow = {
  id: string;
  title: string;
  data: any;
  template_id: string | null;
};

export default async function ExportRenderPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await getSupabaseServerClient();

  // Carrega currículo
  const { data: resume } = await supabase
    .from("resumes")
    .select("id,title,data,template_id")
    .eq("id", id)
    .single<ResumeRow>();

  // Resolve slug do template: se template_id for UUID, buscar na tabela templates; senão tratar como slug.
  let slug: string = "classic";
  if (resume?.template_id) {
    const maybeUuid = resume.template_id;
    const { data: tpl } = await supabase
      .from("templates")
      .select("slug")
      .eq("id", maybeUuid)
      .single();
    slug = (tpl?.slug || resume.template_id || "classic").toString().toLowerCase();
  }

  const Template = slug.includes("modern")
    ? ModernTemplate
    : slug.includes("minimal")
    ? MinimalTemplate
    : ClassicTemplate;

  const data = resume?.data ?? { name: "", headline: "", summary: "", skills: [] };

  return (
    <main className="p-8 print:p-0">
      <section className="w-[794px] mx-auto bg-white text-black shadow print:shadow-none">
        <div className="px-[24mm] py-[18mm]">
          <Template data={data} />
        </div>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { @page { size: A4; margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print{ display:none!important } }`,
        }}
      />
    </main>
  );
}


