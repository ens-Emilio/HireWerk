"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function UpdateEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !confirm) {
      toast.error("Preencha os dois campos de e-mail.");
      return;
    }
    if (email !== confirm) {
      toast.error("Os e-mails não coincidem.");
      return;
    }
    if (email === currentEmail) {
      toast.info("Este já é o seu e-mail atual.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao atualizar e-mail");
      toast.success("Solicitação enviada. Verifique seu e-mail para confirmar a alteração.");
      setEmail("");
      setConfirm("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar e-mail.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-lg">
      <label className="grid gap-1">
        <span className="text-sm text-foreground">Novo e-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-foreground">Confirmar novo e-mail</span>
        <input
          type="email"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        />
      </label>
      <div className="pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar e-mail"}
        </Button>
      </div>
    </form>
  );
}

