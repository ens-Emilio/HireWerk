"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import CurrentContext from "@/app/_components/CurrentContext";
import ClassicTemplate from "@/app/_components/templates/ClassicTemplate";
import ModernTemplate from "@/app/_components/templates/ModernTemplate";
import MinimalTemplate from "@/app/_components/templates/MinimalTemplate";
import A4Paper from "@/app/_components/A4Paper";
import { z } from "zod";

const ResumeDataSchema = z.object({
  name: z.string().max(120).optional().default(""),
  headline: z.string().max(200).optional().default(""),
  summary: z.string().max(2000).optional().default(""),
  skills: z.array(z.string().max(60)).max(50).optional().default([]),
  softSkills: z.array(z.string().max(60)).max(50).optional().default([]),
  experiences: z
    .array(
      z.object({
        role: z.string().max(120).optional().default(""),
        company: z.string().max(160).optional().default(""),
        period: z.string().max(120).optional().default(""),
        bullets: z.array(z.string().max(200)).max(20).optional().default([]),
      })
    )
    .max(20)
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        course: z.string().max(160).optional().default(""),
        institution: z.string().max(160).optional().default(""),
      })
    )
    .max(20)
    .optional()
    .default([]),
  languages: z.array(z.string().max(80)).max(20).optional().default([]),
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
  const [zoom, setZoom] = useState<number>(0.8);

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

  const addSoftSkill = useCallback(() => {
    setData((d) => ({ ...d, softSkills: [...(d.softSkills ?? []), ""] }));
  }, []);

  const updateSoftSkill = useCallback((idx: number, value: string) => {
    setData((d) => ({
      ...d,
      softSkills: (d.softSkills ?? []).map((s, i) => (i === idx ? value : s)),
    }));
  }, []);

  // Experiências
  const addExperience = useCallback(() => {
    setData((d) => ({
      ...d,
      experiences: [...(d.experiences ?? []), { role: "", company: "", period: "", bullets: [] }],
    }));
  }, []);

  const updateExperienceField = useCallback(
    (idx: number, field: "role" | "company" | "period", value: string) => {
      setData((d) => ({
        ...d,
        experiences: (d.experiences ?? []).map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
      }));
    },
    []
  );

  const addExperienceBullet = useCallback((idx: number) => {
    setData((d) => ({
      ...d,
      experiences: (d.experiences ?? []).map((e, i) => (i === idx ? { ...e, bullets: [...(e.bullets ?? []), ""] } : e)),
    }));
  }, []);

  const updateExperienceBullet = useCallback((idx: number, bIdx: number, value: string) => {
    setData((d) => ({
      ...d,
      experiences: (d.experiences ?? []).map((e, i) =>
        i === idx ? { ...e, bullets: (e.bullets ?? []).map((b, j) => (j === bIdx ? value : b)) } : e
      ),
    }));
  }, []);

  // Educação
  const addEducation = useCallback(() => {
    setData((d) => ({ ...d, education: [...(d.education ?? []), { course: "", institution: "" }] }));
  }, []);

  const updateEducationField = useCallback((idx: number, field: "course" | "institution", value: string) => {
    setData((d) => ({
      ...d,
      education: (d.education ?? []).map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
    }));
  }, []);

  // Idiomas
  const addLanguage = useCallback(() => {
    setData((d) => ({ ...d, languages: [...(d.languages ?? []), ""] }));
  }, []);

  const updateLanguage = useCallback((idx: number, value: string) => {
    setData((d) => ({
      ...d,
      languages: (d.languages ?? []).map((s, i) => (i === idx ? value : s)),
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
              className="h-10 rounded-md border border-border px-3 text-sm bg-background text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-foreground">Nome completo</label>
            <input
              value={data.name ?? ""}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
              className="h-10 rounded-md border border-border px-3 text-sm bg-background text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-foreground">Headline</label>
            <input
              value={data.headline ?? ""}
              onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))}
              className="h-10 rounded-md border border-border px-3 text-sm bg-background text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-foreground">Resumo</label>
            <textarea
              value={data.summary ?? ""}
              onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
              className="min-h=[120px] rounded-md border border-border p-3 text-sm bg-background text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Skills</label>
              <button onClick={addSkill} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90">
                Adicionar skill
              </button>
            </div>
            <div className="grid gap-2">
              {(data.skills ?? []).map((s, i) => (
                <input
                  key={i}
                  value={s}
                  onChange={(e) => updateSkill(i, e.target.value)}
                  className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Soft Skills</label>
              <button onClick={addSoftSkill} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90">
                Adicionar soft skill
              </button>
            </div>
            <div className="grid gap-2">
              {(data.softSkills ?? []).map((s, i) => (
                <input
                  key={i}
                  value={s}
                  onChange={(e) => updateSoftSkill(i, e.target.value)}
                  className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                />
              ))}
            </div>
          </div>

          {/* Experiência */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Experiência</label>
              <button onClick={addExperience} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90">
                Adicionar experiência
              </button>
            </div>
            <div className="grid gap-3">
              {(data.experiences ?? []).map((exp, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      placeholder="Cargo"
                      value={exp.role ?? ""}
                      onChange={(e) => updateExperienceField(i, "role", e.target.value)}
                      className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                    />
                    <input
                      placeholder="Empresa"
                      value={exp.company ?? ""}
                      onChange={(e) => updateExperienceField(i, "company", e.target.value)}
                      className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                    />
                    <input
                      placeholder="Período (ex: 2022–Atual)"
                      value={exp.period ?? ""}
                      onChange={(e) => updateExperienceField(i, "period", e.target.value)}
                      className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs text-foreground/80">Tópicos (bullet points)</div>
                      <button onClick={() => addExperienceBullet(i)} className="h-7 rounded bg-muted px-2 text-[11px] text-foreground hover:bg-muted/80">
                        Adicionar tópico
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {(exp.bullets ?? []).map((b, j) => (
                        <input
                          key={j}
                          placeholder="Ex: Liderança de time..."
                          value={b}
                          onChange={(e) => updateExperienceBullet(i, j, e.target.value)}
                          className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Educação */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Educação</label>
              <button onClick={addEducation} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90">
                Adicionar formação
              </button>
            </div>
            <div className="grid gap-3">
              {(data.education ?? []).map((ed, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-2">
                  <input
                    placeholder="Curso"
                    value={ed.course ?? ""}
                    onChange={(e) => updateEducationField(i, "course", e.target.value)}
                    className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                  />
                  <input
                    placeholder="Instituição"
                    value={ed.institution ?? ""}
                    onChange={(e) => updateEducationField(i, "institution", e.target.value)}
                    className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Idiomas */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Idiomas</label>
              <button onClick={addLanguage} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90">
                Adicionar idioma
              </button>
            </div>
            <div className="grid gap-2">
              {(data.languages ?? []).map((l, i) => (
                <input
                  key={i}
                  placeholder="Ex: Português (Nativo)"
                  value={l}
                  onChange={(e) => updateLanguage(i, e.target.value)}
                  className="h-9 rounded-md border border-border px-3 text-sm bg-background text-foreground"
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
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium text-foreground/70">Prévia</div>
            <div className="flex w-full min-w-0 items-center gap-2 text-xs text-foreground/80 sm:w-auto">
              <span className="hidden sm:inline">Zoom</span>
              <input
                type="range"
                min={0.6}
                max={1}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.currentTarget.value))}
                aria-label="Zoom do preview"
                className="w-full sm:w-52 accent-accent"
              />
              <span className="tabular-nums w-12 shrink-0 text-right">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          <div className="a4-preview">
            <div style={{ width: "100%", height: "100%", transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <A4Paper>
                <TemplateComp data={data} />
              </A4Paper>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


