import React from "react";

type ResumeData = {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
};

type Props = { data: ResumeData };

export default function MinimalTemplate({ data }: Props) {
  const name = data.name?.trim() || "Nome Completo";
  const headline = data.headline?.trim() || "Profissão / Título";
  const summary = data.summary?.trim() || "Resumo profissional aparecerá aqui.";
  const skills = (data.skills ?? []).filter(Boolean);

  return (
    <div className="text-black">
      <div className="text-xl font-medium tracking-wide">{name}</div>
      <div className="text-xs opacity-60">{headline}</div>

      <div className="mt-4 text-[13px] leading-relaxed whitespace-pre-wrap">{summary}</div>

      {skills.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wider opacity-70">Skills</div>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {skills.map((s, i) => (
              <li key={i} className="truncate">• {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
