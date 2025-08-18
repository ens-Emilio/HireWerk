import React from "react";

type ResumeData = {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  softSkills?: string[];
};

type Props = { data: ResumeData };

export default function ModernTemplate({ data }: Props) {
  const name = data.name?.trim() || "Nome Completo";
  const headline = data.headline?.trim() || "Profissão / Título";
  const summary = data.summary?.trim() || "Resumo profissional aparecerá aqui.";
  const skills = (data.skills ?? []).filter(Boolean);
  const softSkills = (data.softSkills ?? []).filter(Boolean);

  return (
    <div className="text-foreground">
      <header className="border-b border-border pb-3">
        <div className="text-3xl font-bold tracking-tight">{name}</div>
        <div className="mt-0.5 text-sm text-foreground/70">{headline}</div>
      </header>

      <section className="mt-5 grid gap-6 md:grid-cols-[1fr_260px]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">Resumo</h3>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
        <aside>
          {skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="rounded-md border border-border bg-foreground/10 px-2 py-1 text-xs text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {softSkills.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">Soft Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {softSkills.map((s, i) => (
                  <span key={i} className="rounded-md border border-border bg-foreground/10 px-2 py-1 text-xs text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
