import type { Metadata } from "next";
import { verifyExportToken } from "@/lib/exportToken";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
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
  user_id: string;
};

export default async function ExportRenderPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const searchParams = (await props.searchParams) || {};
  const token = (searchParams["token"] as string | undefined) || "";

  // Valida token de exportação
  const payload = token ? verifyExportToken(token) : null;
  if (!payload || payload.rid !== id) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-xl rounded border border-red-300 bg-red-50 p-6 text-red-800">
          Token inválido ou expirado.
        </div>
      </main>
    );
  }

  const supabase = getSupabaseAdminClient();

  // Carrega currículo com cliente admin (RLS bypass) após validar token
  const { data: resume } = await supabase
    .from("resumes")
    .select("id,title,data,template_id,user_id")
    .eq("id", id)
    .single<ResumeRow>();

  if (!resume || resume.user_id !== payload.sub) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-xl rounded border border-red-300 bg-red-50 p-6 text-red-800">
          Acesso negado.
        </div>
      </main>
    );
  }

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
          __html: `
            @media print {
              @page { size: A4; margin: 0; }
              :root, html, body, main { background: #fff !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0 !important; }
              /* Ocultar elementos de navegação/cabeçalho/rodapé no PDF */
              header, nav, footer,
              .site-header, .app-header, .topbar, .navbar,
              [data-site-header], [data-region="topbar"], .no-print {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                overflow: hidden !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}


