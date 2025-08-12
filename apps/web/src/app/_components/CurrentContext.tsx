"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Variant = "sidebar" | "header";

type TemplateRow = { id: string; name: string; slug: string };
type ResumeRow = { id: string; title: string; template_id: string | null };

export default function CurrentContext({ variant = "sidebar" }: { variant?: Variant }) {
  const pathname = usePathname() || "";
  const resumeId = useMemo(() => {
    const m = pathname.match(/^\/resumes\/([^\/\?]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<ResumeRow | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!resumeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const [r1, r2] = await Promise.all([
          supabase
            .from("resumes")
            .select("id,title,template_id")
            .eq("id", resumeId)
            .single(),
          supabase
            .from("templates")
            .select("id,name,slug"),
        ]);
        if (!mounted) return;
        if (!r1.error && r1.data) setResume(r1.data as ResumeRow);
        if (!r2.error && r2.data) setTemplates(r2.data as TemplateRow[]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [resumeId]);

  async function onChangeTemplate(e: React.ChangeEvent<HTMLSelectElement>) {
    const tplId = e.target.value;
    if (!resumeId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: tplId }),
      });
      if (!res.ok) throw new Error("Falha ao salvar template");
      setResume((r) => (r ? { ...r, template_id: tplId } : r));
      // Notifica a prévia para trocar o template imediatamente
      const slug = templates.find((t) => t.id === tplId)?.slug;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hirewerk:template-changed", { detail: { id: tplId, slug } })
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (!resumeId) return null;

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={resumeId ? `/templates?id=${resumeId}` : "/templates"}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-foreground/10"
          aria-label="Abrir Templates"
        >
          Templates
        </a>
        <a
          href={`/api/resumes/${resumeId}/export/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90 text-center"
          aria-label="Exportar PDF"
        >
          Exportar PDF
        </a>
        <a
          href={`/api/resumes/${resumeId}/export/json`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-foreground/10"
          aria-label="Exportar JSON"
        >
          Exportar JSON
        </a>
        <select
          value={resume?.template_id ?? ""}
          onChange={onChangeTemplate}
          disabled={loading || saving}
          className="hidden md:inline-block h-9 rounded-md border border-border bg-surface px-2 text-xs text-foreground"
          style={{ colorScheme: "dark" }}
          aria-label="Selecionar template"
        >
          <option
            value=""
            disabled
            className="bg-surface text-foreground/70"
            style={{ backgroundColor: "hsl(var(--surface))", color: "hsl(var(--foreground) / 0.7)" }}
          >
            {loading ? "Carregando…" : "Template"}
          </option>
          {templates.map((t) => (
            <option
              key={t.id}
              value={t.id}
              className="bg-surface text-foreground"
              style={{ backgroundColor: "hsl(var(--surface))", color: "hsl(var(--foreground))" }}
            >
              {t.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-white p-3 text-black">
      <div className="text-xs font-semibold text-black/60">Currículo</div>
      <div className="mt-1 text-sm text-black truncate" title={resume?.title || ""}>
        {resume?.title || "Carregando…"}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <select
          value={resume?.template_id ?? ""}
          onChange={onChangeTemplate}
          disabled={loading || saving}
          className="h-8 flex-1 rounded-md border border-border bg-surface px-2 text-xs text-foreground"
          style={{ colorScheme: "dark" }}
        >
          <option
            value=""
            disabled
            className="bg-surface text-foreground/70"
            style={{ backgroundColor: "hsl(var(--surface))", color: "hsl(var(--foreground) / 0.7)" }}
          >
            {loading ? "Carregando…" : "Escolher template"}
          </option>
          {templates.map((t) => (
            <option
              key={t.id}
              value={t.id}
              className="bg-surface text-foreground"
              style={{ backgroundColor: "hsl(var(--surface))", color: "hsl(var(--foreground))" }}
            >
              {t.name}
            </option>
          ))}
        </select>
        <a
          href={resumeId ? `/templates?id=${resumeId}` : "/templates"}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-foreground hover:bg-foreground/10"
        >
          Templates
        </a>
        <a
          href={`/api/resumes/${resumeId}/export/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center justify-center rounded-md bg-accent px-2 text-xs font-medium text-white hover:bg-accent/90 text-center"
        >
          Exportar PDF
        </a>
        <a
          href={`/api/resumes/${resumeId}/export/json`}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-foreground hover:bg-foreground/10"
        >
          Exportar JSON
        </a>
      </div>
    </div>
  );
}


