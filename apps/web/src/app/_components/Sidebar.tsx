"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const currentPath = usePathname() || "";

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "Currículos" },
    { href: "/settings", label: "Configurações" },
  ];

  return (
    <aside className="h-dvh sticky top-0 border-r border-secondary/40 bg-surface p-4 text-foreground">
      <div className="mb-6 px-2 text-sm font-semibold text-foreground/70">Navegação</div>
      <nav className="grid gap-1">
        {nav.map((item) => {
          const isActive = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-2 py-1.5 text-sm hover:bg-secondary/10 ${
                isActive ? "bg-secondary/10 text-foreground" : ""
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


