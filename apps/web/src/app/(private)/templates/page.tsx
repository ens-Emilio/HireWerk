"use client";
import { useState } from "react";

export default function TemplatesPage() {
  const [using, setUsing] = useState<string | null>(null);
  const templates = [
    { id: "classic", name: "Clássico" },
    { id: "modern", name: "Moderno" },
    { id: "minimal", name: "Minimal" },
  ];

  async function applyTemplate(templateId: string) {
    try {
      setUsing(templateId);
      const currentResumeId = new URLSearchParams(window.location.search).get("id");
      if (!currentResumeId) {
        // se não houver contexto, apenas direciona aos currículos
        window.location.href = "/resumes";
        return;
      }
      const res = await fetch(`/api/resumes/${currentResumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });
      if (!res.ok) throw new Error("Falha ao aplicar template");
    } finally {
      setUsing(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Templates</h1>
        <p className="text-foreground/70 text-sm">Escolha um estilo para seu currículo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-lg border border-secondary/40 bg-surface p-3">
            <div className="h-40 rounded-md border border-secondary/40 bg-secondary/10" />
            <div className="mt-3 flex items-center justify-between">
              <div className="font-medium text-foreground">{tpl.name}</div>
              <button
                onClick={() => applyTemplate(tpl.id)}
                disabled={using === tpl.id}
                className="h-8 rounded-md border border-secondary/60 bg-secondary text-primary-foreground px-3 text-xs hover:bg-secondary/90 disabled:opacity-50"
              >
                {using === tpl.id ? "Aplicando…" : "Usar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


