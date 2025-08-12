"use client";
import { useEffect, useState } from "react";

type TemplateItem = { id: string; slug: string; name: string; preview_image_url?: string | null };

export default function TemplatesPage() {
  const [using, setUsing] = useState<string | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/templates", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar templates");
        const json = await res.json();
        if (alive) setItems(Array.isArray(json.items) ? json.items : []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erro ao listar templates";
        if (alive) setErr(message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function applyTemplate(templateId: string) {
    try {
      setUsing(templateId);
      const currentResumeId = new URLSearchParams(window.location.search).get("id");
      if (!currentResumeId) {
        setErr("Sem contexto do currículo. Abra esta página a partir do editor (botão Templates).");
        return; // evita redirecionar silenciosamente
      }
      const res = await fetch(`/api/resumes/${currentResumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });
      if (!res.ok) throw new Error("Falha ao aplicar template");
      // Redireciona de volta ao editor do currículo
      window.location.href = `/resumes/${currentResumeId}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao aplicar template";
      setErr(message);
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
      {err && (
        <div className="rounded-md border border-border bg-foreground/10 p-3 text-xs text-foreground">
          {err}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <div className="rounded-lg border border-border bg-background p-3 text-foreground">
            <div className="h-40 animate-pulse rounded-md border border-border bg-foreground/10" />
            <div className="mt-3 h-4 w-24 animate-pulse rounded bg-foreground/20" />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="col-span-full rounded-lg border border-border bg-background p-4 text-sm text-foreground/70">
            Nenhum template cadastrado. Peça a um admin para popular a tabela `templates` (slugs: classic, modern, minimal).
          </div>
        )}
        {items.map((tpl) => (
          <div key={tpl.id} className="rounded-lg border border-border bg-background p-3 text-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tpl.preview_image_url ?? `/templates/${tpl.slug}.svg`}
              alt={`${tpl.name} preview`}
              className="h-40 w-full rounded-md object-cover bg-foreground/10"
              loading="lazy"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="font-medium">{tpl.name}</div>
              <button
                onClick={() => applyTemplate(tpl.id)}
                disabled={using === tpl.id}
                className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
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


