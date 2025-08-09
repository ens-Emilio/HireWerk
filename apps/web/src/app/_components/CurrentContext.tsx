"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Variant = "sidebar" | "header";

type TemplateRow = { id: string; name: string };
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
            .select("id,name"),
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
    } finally {
      setSaving(false);
    }
  }

  if (!resumeId) return null;

  if (variant === "header") {
    return (
      <div className="hidden md:flex items-center gap-2">
        <a
          href={`/export/render/${resumeId}`}
          className="h-9 rounded-md border border-secondary/60 bg-secondary text-primary-foreground px-3 text-xs hover:bg-secondary/90"
        >
          Exportar PDF
        </a>
        <select
          value={resume?.template_id ?? ""}
          onChange={onChangeTemplate}
          disabled={loading || saving}
          className="h-9 rounded-md border border-secondary/60 bg-surface px-2 text-xs text-foreground"
        >
          <option value="" disabled>
            {loading ? "Carregando…" : "Template"}
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-secondary/40 bg-surface p-3">
      <div className="text-xs font-semibold text-foreground/70">Currículo</div>
      <div className="mt-1 text-sm text-foreground truncate" title={resume?.title || ""}>
        {resume?.title || "Carregando…"}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <select
          value={resume?.template_id ?? ""}
          onChange={onChangeTemplate}
          disabled={loading || saving}
          className="h-8 flex-1 rounded-md border border-secondary/60 bg-surface px-2 text-xs text-foreground"
        >
          <option value="" disabled>
            {loading ? "Carregando…" : "Escolher template"}
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <a
          href={`/export/render/${resumeId}`}
          className="h-8 rounded-md border border-secondary/60 bg-secondary text-primary-foreground px-2 text-xs hover:bg-secondary/90"
        >
          Exportar
        </a>
      </div>
    </div>
  );
}


