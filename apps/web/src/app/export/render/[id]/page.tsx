import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exportar PDF | HireWerk",
};

export default async function ExportRenderPage() {
  // TODO: carregar dados do currículo via Supabase com token
  return (
    <main className="p-8 print:p-0">
      <section className="w-[794px] mx-auto bg-white text-black shadow print:shadow-none">
        <div className="px-[24mm] py-[18mm]">
          <h1 className="text-[22pt] font-semibold leading-tight">Nome Completo</h1>
          <div className="mt-1 text-[11pt] opacity-80">Profissão / Título</div>
          <div className="mt-6 text-[10pt] leading-relaxed">
            Resumo profissional. Esta é uma prévia A4 simplificada. O template final aplicará tipografia e layout específicos.
          </div>
          <div className="mt-8">
            <div className="text-[11pt] font-semibold">Skills</div>
            <div className="mt-4 flex flex-wrap gap-6 text-[10pt]">
              <span>JavaScript</span>
              <span>React</span>
              <span>Node.js</span>
            </div>
          </div>
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


