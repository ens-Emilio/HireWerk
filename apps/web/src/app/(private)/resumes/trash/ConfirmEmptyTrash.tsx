"use client";
import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useFormStatus } from "react-dom";

type Props = {
  // Server Action serializada pelo Next.js (não recebe campos do formulário)
  action: (formData: FormData) => void | Promise<void>;
};

function ConfirmSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="danger" size="sm" type="submit" disabled={pending}>
      {pending ? "Esvaziando…" : "Esvaziar"}
    </Button>
  );
}

export default function ConfirmEmptyTrash({ action }: Props) {
  const [open, setOpen] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (open) {
      // Foco inicial no botão Cancelar para acessibilidade
      cancelRef.current?.focus();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button variant="danger" size="sm" type="button" onClick={() => setOpen(true)}>
        Esvaziar lixeira
      </Button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto mt-24 w-full max-w-md px-4">
            <Card
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={`${titleId}-desc`}
              className="bg-white text-black"
            >
              <div className="space-y-4">
                <div id={titleId} className="text-lg font-semibold">
                  Esvaziar lixeira
                </div>
                <p id={`${titleId}-desc`} className="text-sm text-black/80">
                  Tem certeza de que deseja esvaziar a lixeira? Esta ação é permanente e não pode ser desfeita.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    ref={cancelRef}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <form action={action}>
                    <ConfirmSubmitButton />
                  </form>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
