"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const currentPath = usePathname() || "";
  const resumeId = (() => {
    const m = currentPath.match(/^\/resumes\/([^\/?#]+)/);
    return m?.[1] ?? null;
  })();

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "Currículos" },
    { href: "/resumes/trash", label: "Lixeira" },
    { href: resumeId ? `/templates?id=${resumeId}` : "/templates", label: "Templates" },
    { href: "/settings", label: "Configurações" },
  ] as { href: string; label: string }[];

  return (
    <aside className="app-sidebar h-dvh sticky top-0 overflow-y-auto border-r border-border bg-[var(--color-surface)] p-4 text-[var(--color-surface-foreground)]">
      <div className="mb-6 px-2 text-sm font-semibold opacity-90">Navegação</div>
      <nav className="grid gap-1">
        {nav.map((item) => {
          const isActive = (() => {
            if (item.href === "/resumes") {
              // ativo em /resumes e /resumes/<id>, mas não em /resumes/trash
              if (currentPath === "/resumes") return true;
              if (/^\/resumes\/(?!trash($|\/)).+/.test(currentPath)) return true;
              return false;
            }
            return currentPath === item.href || currentPath.startsWith(item.href + "/");
          })();
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-2 py-1.5 text-sm text-[var(--color-surface-foreground)] hover:bg-foreground/10 ${
                isActive ? "bg-foreground/10 font-medium" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


