import type { ReactNode } from "react";
import ToastEvents from "./ToastEvents";

export default function ResumesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Dispara toasts baseados em query params em qualquer rota de resumes */}
      <ToastEvents />
      {children}
    </>
  );
}
