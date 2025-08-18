import React from "react";

type ResumeData = {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  softSkills?: string[];
  experiences?: Array<{
    role?: string;
    company?: string;
    period?: string; // ex: "2022–Atual"
    bullets?: string[];
  }>;
  education?: Array<{
    course?: string;
    institution?: string;
  }>;
  languages?: string[]; // ex: ["Português (Nativo)", "Inglês (Avançado)"]
};

type Props = { data: ResumeData };

export default function ClassicTemplate({ data }: Props) {
  const name = data.name?.trim() || "Nome Completo";
  const headline = data.headline?.trim() || "Profissão / Título";
  const summary = data.summary?.trim() || "Resumo profissional aparecerá aqui.";
  const skills = (data.skills ?? []).filter(Boolean);
  const softSkills = (data.softSkills ?? []).filter(Boolean);
  const experiences = (data.experiences ?? []).filter((e) => e && (e.role || e.company));
  const education = (data.education ?? []).filter((e) => e && (e.course || e.institution));
  const languages = (data.languages ?? []).filter(Boolean);

  return (
    <div className="text-foreground">
      <div className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">{name}</div>
      <div className="mt-0.5 text-xs sm:text-sm text-foreground/70">{headline}</div>

      <div className="mt-5 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">{summary}</div>

      {(skills.length > 0 || softSkills.length > 0) && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {skills.length > 0 && (
            <div>
              <div className="text-sm font-medium">Skills</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="chip text-[11px] border border-border bg-foreground/10">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {softSkills.length > 0 && (
            <div>
              <div className="text-sm font-medium">Soft Skills</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {softSkills.map((s, i) => (
                  <span key={i} className="chip text-[11px] border border-border bg-foreground/10">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(experiences.length > 0 || education.length > 0 || languages.length > 0) && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {/* Experiência: ocupa 2 colunas em telas maiores */}
          {experiences.length > 0 && (
            <div className="md:col-span-2 rounded-md p-3 border border-border">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-foreground/70">Experiência</div>
              <div className="mt-1 grid gap-3">
                {experiences.map((exp, i) => (
                  <div key={i}>
                    <div className="font-medium">
                      {exp.role || "Cargo"}
                      {exp.company ? <span> — {exp.company}</span> : null}
                    </div>
                    {exp.period ? <div className="muted text-[11px]">{exp.period}</div> : null}
                    {(exp.bullets ?? []).length > 0 && (
                      <ul className="mt-1 list-disc pl-4 text-[11px]">
                        {(exp.bullets ?? []).map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educação */}
          {education.length > 0 && (
            <div className="rounded-md p-3 border border-border">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-foreground/70">Educação</div>
              <div className="mt-1 grid gap-2">
                {education.map((ed, i) => (
                  <div key={i}>
                    <div>{ed.course || "Curso"}</div>
                    {ed.institution ? <div className="muted text-[11px]">{ed.institution}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idiomas */}
          {languages.length > 0 && (
            <div className="rounded-md p-3 border border-border">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-foreground/70">Idiomas</div>
              <div className="mt-1 grid gap-1 text-[12px]">
                {languages.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
