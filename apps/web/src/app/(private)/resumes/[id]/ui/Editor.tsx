"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
}: {
  resumeId: string;
  initialTitle: string;
  initialData: unknown;
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
    <div className="grid gap-6 lg:grid-cols-[480px_1fr] text-foreground">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm text-foreground">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 rounded-md border border-secondary/60 px-3 text-sm bg-surface text-foreground"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-foreground">Nome completo</label>
          <input
            value={data.name ?? ""}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            className="h-10 rounded-md border border-secondary/60 px-3 text-sm bg-surface text-foreground"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-foreground">Headline</label>
          <input
            value={data.headline ?? ""}
            onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))}
            className="h-10 rounded-md border border-secondary/60 px-3 text-sm bg-surface text-foreground"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-foreground">Resumo</label>
          <textarea
            value={data.summary ?? ""}
            onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
            className="min-h-[120px] rounded-md border border-secondary/60 p-3 text-sm bg-surface text-foreground"
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-foreground">Skills</label>
            <button onClick={addSkill} className="h-8 rounded-md border border-secondary/60 bg-secondary text-primary-foreground px-3 text-xs hover:bg-secondary/90">
              Adicionar skill
            </button>
          </div>
          <div className="grid gap-2">
            {(data.skills ?? []).map((s, i) => (
              <input
                key={i}
                value={s}
                onChange={(e) => updateSkill(i, e.target.value)}
                className="h-9 rounded-md border border-secondary/60 px-3 text-sm bg-surface text-foreground"
              />
            ))}
          </div>
        </div>

        <div className="text-xs text-foreground/70">
          {saving ? "Salvando…" : lastSavedAt ? `Salvo às ${lastSavedAt.toLocaleTimeString()}` : ""}
          {errorMsg ? ` • ${errorMsg}` : ""}
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-foreground/70">Prévia</div>
        <div className="rounded-lg border border-secondary/40 bg-surface p-6">
          <div className="text-xl font-semibold text-foreground">{data.name || "Nome Completo"}</div>
          <div className="text-sm text-foreground/70">{data.headline || "Profissão / Título"}</div>
          <div className="mt-4 text-foreground whitespace-pre-wrap text-sm">
            {data.summary || "Resumo profissional aparecerá aqui."}
          </div>
          {data.skills && data.skills.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-foreground">Skills</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="rounded-full border border-secondary/60 bg-surface px-2 py-0.5 text-xs text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


