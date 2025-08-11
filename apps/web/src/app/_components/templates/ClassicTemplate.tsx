import React from "react";

type ResumeData = {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
};

type Props = { data: ResumeData };

export default function ClassicTemplate({ data }: Props) {
  const name = data.name?.trim() || "Nome Completo";
  const headline = data.headline?.trim() || "Profissão / Título";
  const summary = data.summary?.trim() || "Resumo profissional aparecerá aqui.";
  const skills = (data.skills ?? []).filter(Boolean);

  return (
    <div className="text-black">
      <div className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">{name}</div>
      <div className="mt-0.5 text-xs sm:text-sm opacity-70">{headline}</div>

      <div className="mt-5 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">{summary}</div>

      {skills.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium">Skills</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="rounded-full border border-border bg-black/5 px-2 py-0.5 text-[11px]">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
