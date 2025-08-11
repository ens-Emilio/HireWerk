"use client";
import { usePathname } from "next/navigation";
import CurrentContext from "./CurrentContext";

export default function AdaptiveContext({ mode }: { mode: "mobile" | "desktop" }) {
  const pathname = usePathname() || "";
  const isEditor = /^\/resumes\/[^\/?#]+$/.test(pathname);

  if (mode === "desktop") {
    return (
      <div className="hidden lg:block">
        <CurrentContext variant="sidebar" />
      </div>
    );
  }
  // mobile: evita duplicar no editor, que já exibe CurrentContext no topo via variant="header"
  if (isEditor) return null;
  return (
    <div className="lg:hidden mb-4">
      <CurrentContext variant="sidebar" />
    </div>
  );
}
