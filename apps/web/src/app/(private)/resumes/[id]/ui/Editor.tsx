"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import CurrentContext from "@/app/_components/CurrentContext";
import ClassicTemplate from "@/app/_components/templates/ClassicTemplate";
import ModernTemplate from "@/app/_components/templates/ModernTemplate";
import MinimalTemplate from "@/app/_components/templates/MinimalTemplate";
import { z } from "zod";

const ResumeDataSchema = z.object({
  name: z.string().max(120).optional().default(""),
  headline: z.string().max(200).optional().default(""),
  summary: z.string().max(2000).optional().default(""),
  skills: z.array(z.string().max(60)).max(50).optional().default([]),
});

type ResumeData = z.infer<typeof ResumeDataSchema>;

export default function Editor({
  resumeId,
  initialTitle,
  initialData,
  initialTemplateId,
}: {
  resumeId: string;
  initialTitle: string;
  initialData: unknown;
  initialTemplateId?: string | null;
}) {
  const [title, setTitle] = useState<string>(initialTitle);
  const [data, setData] = useState<ResumeData>(() => {
    const parsed = ResumeDataSchema.safeParse(initialData);
    return parsed.success ? parsed.data : ResumeDataSchema.parse({});
  });
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const payload = useMemo(() => ({ title, data }), [title, data]);

  // controla o template atual (atualiza quando o usuário troca no header ou via página de templates)
  const [effectiveTemplateId, setEffectiveTemplateId] = useState<string | null>(initialTemplateId ?? null);

  useEffect(() => {
    // sincroniza quando o SSR mudar (navegação entre currículos, por ex.)
    setEffectiveTemplateId(initialTemplateId ?? null);
  }, [initialTemplateId]);

  useEffect(() => {
    function onTplChanged(e: Event) {
      const ce = e as CustomEvent<{ id?: string; slug?: string }>;
      const next = ce.detail?.slug || ce.detail?.id || null;
      if (next) setEffectiveTemplateId(next);
    }
    window.addEventListener("hirewerk:template-changed", onTplChanged as EventListener);
    return () => window.removeEventListener("hirewerk:template-changed", onTplChanged as EventListener);
  }, []);

  const templateKey = useMemo<"classic" | "modern" | "minimal">(() => {
    const v = (effectiveTemplateId || "").toString().toLowerCase();
    if (v.includes("modern")) return "modern";
    if (v.includes("minimal")) return "minimal";
    return "classic";
  }, [effectiveTemplateId]);

  const TemplateComp = useMemo(() => {
    switch (templateKey) {
      case "modern":
        return ModernTemplate;
      case "minimal":
        return MinimalTemplate;
      default:
        return ClassicTemplate;
    }
  }, [templateKey]);

  // Autosave com debounce ~1.2s
  useEffect(() => {
    setErrorMsg(null);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        const res = await fetch(`/api/resumes/${resumeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Falha ao salvar");
        setLastSavedAt(new Date());
      } catch {
        setErrorMsg("Erro ao salvar. Tentaremos novamente.");
      } finally {
        setSaving(false);
      }
    }, 1200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [resumeId, payload]);

  const addSkill = useCallback(() => {
    setData((d) => ({ ...d, skills: [...(d.skills ?? []), ""] }));
  }, []);

  const updateSkill = useCallback((idx: number, value: string) => {
    setData((d) => ({
      ...d,
      skills: (d.skills ?? []).map((s, i) => (i === idx ? value : s)),
    }));
  }, []);

  return (
    <>
      <div className="mb-2 flex justify-end">
        <CurrentContext variant="header" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[480px_minmax(0,1fr)] text-foreground">
        <div className="grid gap-4 min-w-0">
          <div className="grid gap-2">
            <label className="text-sm text-foreground">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-md border border-border px-3 text-sm bg-white text-black"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-foreground">Nome completo</label>
            <input
              value={data.name ?? ""}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
              className="h-10 rounded-md border border-border px-3 text-sm bg-white text-black"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-foreground">Headline</label>
            <input
              value={data.headline ?? ""}
              onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))}
              className="h-10 rounded-md border border-border px-3 text-sm bg-white text-black"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-foreground">Resumo</label>
            <textarea
              value={data.summary ?? ""}
              onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
              className="min-h-[120px] rounded-md border border-border p-3 text-sm bg-white text-black"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Skills</label>
              <button onClick={addSkill} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90">
                Adicionar skill
              </button>
            </div>
            <div className="grid gap-2">
              {(data.skills ?? []).map((s, i) => (
                <input
                  key={i}
                  value={s}
                  onChange={(e) => updateSkill(i, e.target.value)}
                  className="h-9 rounded-md border border-border px-3 text-sm bg-white text-black"
                />
              ))}
            </div>
          </div>

          <div className="text-xs text-foreground/70">
            {saving ? "Salvando…" : lastSavedAt ? `Salvo às ${lastSavedAt.toLocaleTimeString()}` : ""}
            {errorMsg ? ` • ${errorMsg}` : ""}
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-2 text-sm font-medium text-foreground/70">Prévia</div>
          <div className="rounded-lg border border-border bg-white p-6 text-black w-full max-w-[440px]">
            <TemplateComp data={data} />
          </div>
        </div>
      </div>
    </>
  );
}


