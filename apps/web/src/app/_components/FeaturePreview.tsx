"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import LoginLink from "@/app/_components/LoginLink";

type TemplateRow = { id: string; name: string };

export default function FeaturePreview() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("templates")
          .select("id,name");
        if (!mounted) return;
        if (!error && data) setTemplates(data as TemplateRow[]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 text-xs">
      <select
        disabled
        className="h-9 rounded-md border border-border bg-surface px-2 text-xs text-foreground/70"
        title="Entre para escolher um template"
      >
        <option>
          {loading ? "Carregando templates…" : `Templates (${templates.length})`}
        </option>
      </select>
      <button
        disabled
        className="h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground/70"
        title="Entre para exportar em PDF"
      >
        Exportar PDF
      </button>
      <LoginLink className="ml-1 text-foreground hover:underline">
        Entrar para usar
      </LoginLink>
    </div>
  );
}


