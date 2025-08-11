import { Button } from "./ui/Button";
import { useState } from "react";

type ExportPdfButtonProps = {
  resumeId: string;
  className?: string;
};

export function ExportPdfButton({ resumeId, className = "" }: ExportPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = () => {
    try {
      setIsLoading(true);
      const url = `/api/resumes/${resumeId}/export/pdf`;
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      // não conseguimos saber o status da nova aba, então liberamos o loading
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      className={`gap-2 bg-accent text-white hover:bg-accent/90 ${className}`}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isLoading ? "Exportando..." : "Exportar PDF"}
    </Button>
  );
}
