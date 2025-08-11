"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
}>;

export default function LoginLink({ className, children }: Props) {
  const pathname = usePathname() || "/";
  // Heurística simples: considere privadas rotas conhecidas
  const isPrivate = pathname.startsWith("/dashboard") || pathname.startsWith("/resumes");
  const href = isPrivate ? `/login?next=${encodeURIComponent(pathname)}` : "/login";
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
