"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function UpdatePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirm) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("A confirmação da nova senha não confere.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("A nova senha deve ser diferente da atual.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao atualizar senha");
      toast.success("Senha atualizada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar senha.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-lg">
      <label className="grid gap-1">
        <span className="text-sm text-foreground">Senha atual</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-foreground">Nova senha</span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-foreground">Confirmar nova senha</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        />
      </label>
      <div className="pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar senha"}
        </Button>
      </div>
    </form>
  );
}
