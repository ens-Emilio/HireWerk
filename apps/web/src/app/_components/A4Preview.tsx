"use client";

import { useState } from "react";
import A4Paper from "@/app/_components/A4Paper";
import ClassicTemplate from "@/app/_components/templates/ClassicTemplate";

type Variant = "tech" | "marketing" | "admin" | "health";

export default function A4Preview() {
  const [zoom, setZoom] = useState<number>(0.8);
  const [variant, setVariant] = useState<Variant>("tech");

  const sampleData = () => {
    if (variant === "marketing") {
      return {
        name: "Ana Souza",
        headline: "Estrategista de Marketing",
        summary:
          "• Planejamento e execução de campanhas 360º\n• Crescimento orgânico com SEO e conteúdo",
        skills: ["SEO", "Branding", "Social Media", "Analytics"],
        softSkills: ["Comunicação", "Criatividade", "Colaboração"],
      };
    }
    if (variant === "admin") {
      return {
        name: "Marcos Lima",
        headline: "Assistente Administrativo",
        summary:
          "• Rotinas de escritório e controle de documentos\n• Suporte a finanças e atendimento",
        skills: ["Excel", "Atendimento", "Notas Fiscais", "Organização"],
        softSkills: ["Atenção a detalhes", "Proatividade"],
      };
    }
    if (variant === "health") {
      return {
        name: "Camila Torres",
        headline: "Enfermeira",
        summary:
          "• Atendimento humanizado e triagem\n• Protocolos de segurança e medicação",
        skills: ["Urgência", "Curativos", "Pediatria", "Prontuário"],
        softSkills: ["Empatia", "Trabalho em equipe"],
      };
    }
    // default tech
    return {
      name: "João Silva",
      headline: "Desenvolvedor Frontend",
      summary: "• React/Next.js e TypeScript\n• Foco em performance e acessibilidade",
      skills: ["React", "Next.js", "TypeScript"],
      softSkills: ["Comunicação", "Resolução de problemas"],
    };
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-3">
        <div className="flex items-center gap-2 text-xs text-foreground/80">
          <span className="hidden sm:inline">Zoom</span>
          <input
            type="range"
            min={0.6}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.currentTarget.value))}
            aria-label="Zoom do preview"
            className="w-40 sm:w-56 accent-accent"
          />
          <span className="tabular-nums w-10 text-right">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="a4-preview">
        <div style={{ width: "100%", height: "100%", transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <A4Paper>
            <ClassicTemplate data={sampleData()} />
          </A4Paper>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => setVariant("tech")}
          className={`h-8 rounded-md border px-2 text-xs ${
            variant === "tech"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-foreground border-border hover:bg-surface/80"
          }`}
          aria-pressed={variant === "tech"}
        >
          Tecnologia
        </button>
        <button
          type="button"
          onClick={() => setVariant("marketing")}
          className={`h-8 rounded-md border px-2 text-xs ${
            variant === "marketing"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-foreground border-border hover:bg-surface/80"
          }`}
          aria-pressed={variant === "marketing"}
        >
          Marketing
        </button>
        <button
          type="button"
          onClick={() => setVariant("admin")}
          className={`h-8 rounded-md border px-2 text-xs ${
            variant === "admin"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-foreground border-border hover:bg-surface/80"
          }`}
          aria-pressed={variant === "admin"}
        >
          Administrativo
        </button>
        <button
          type="button"
          onClick={() => setVariant("health")}
          className={`h-8 rounded-md border px-2 text-xs ${
            variant === "health"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-foreground border-border hover:bg-surface/80"
          }`}
          aria-pressed={variant === "health"}
        >
          Saúde
        </button>
      </div>
    </div>
  );
}
