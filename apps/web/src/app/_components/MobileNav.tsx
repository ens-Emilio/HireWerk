"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname() || "";
  const hidden = pathname.startsWith("/login") || pathname.startsWith("/check-email") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  const resumeId = (() => {
    const m = pathname.match(/^\/resumes\/([^\/?#]+)/);
    return m?.[1] ?? null;
  })();

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "Currículos" },
    { href: resumeId ? `/templates?id=${resumeId}` : "/templates", label: "Templates" },
    { href: "/settings", label: "Conta" },
  ];

  return (
    <nav
      aria-label="Navegação"
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-[var(--color-surface)] text-[var(--color-surface-foreground)] ${hidden ? "hidden" : ""}`}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <ul
        className="mx-auto max-w-6xl grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const baseHref = item.href.split("?")[0];
          const isActive = pathname === baseHref || pathname.startsWith(baseHref + "/");
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 py-3 text-center text-sm ${isActive ? "font-semibold bg-foreground/10" : "opacity-90"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
