"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ToastEvents() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const created = searchParams.get("created");
    const deleted = searchParams.get("deleted");
    const restored = searchParams.get("restored");
    const emptied = searchParams.get("emptied");

    if (created === "1") {
      toast.success("Currículo criado com sucesso.");
    }
    if (deleted === "1") {
      toast.success("Currículo movido para a lixeira.");
    }
    if (restored === "1") {
      toast.success("Currículo restaurado.");
    }
    if (emptied === "1") {
      toast.success("Lixeira esvaziada.");
    }

    if (created === "1" || deleted === "1" || restored === "1" || emptied === "1") {
      // Remove os parâmetros da URL após exibir o toast
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  return null;
}
