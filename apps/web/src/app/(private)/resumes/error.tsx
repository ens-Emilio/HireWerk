"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Não foi possível carregar seus currículos</h2>
      <p className="text-sm text-foreground/70">{error.message || "Erro inesperado."}</p>
      <button
        onClick={() => reset()}
        className="h-9 rounded-md bg-accent text-white px-3 text-sm hover:bg-accent/90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
