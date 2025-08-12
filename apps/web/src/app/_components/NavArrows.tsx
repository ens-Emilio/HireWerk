"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function NavArrows() {
  return (
    <Suspense fallback={null}>
      <InnerNavArrows />
    </Suspense>
  );
}

function InnerNavArrows() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const resumeId = (() => {
    const m = pathname.match(/^\/resumes\/(?!trash($|\/))([^\/?#]+)/);
    return m?.[1] ?? null;
  })();

  let leftHref: string | null = null;
  let rightHref: string | null = null;

  if (pathname === "/dashboard") {
    rightHref = "/resumes";
  } else if (pathname === "/resumes") {
    leftHref = "/dashboard";
    rightHref = null; // sem próximo direto a partir da lista
  } else if (/^\/resumes\/(?!trash($|\/)).+/.test(pathname)) {
    leftHref = "/resumes";
    rightHref = resumeId ? `/templates?id=${resumeId}` : "/templates";
  } else if (pathname === "/resumes/trash") {
    leftHref = "/resumes";
    rightHref = null;
  } else if (pathname.startsWith("/templates")) {
    const id = searchParams.get("id");
    leftHref = id ? `/resumes/${id}` : "/resumes";
    rightHref = null;
  } else if (pathname.startsWith("/settings")) {
    leftHref = "/dashboard";
    rightHref = null;
  } else {
    rightHref = "/resumes";
  }

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm hover:bg-foreground/10 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ring-offset-background";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        const isTextInput = tag === "input" || tag === "textarea" || tag === "select";
        const isEditable = (target as HTMLElement).isContentEditable || target.getAttribute?.("role") === "textbox";
        if (isTextInput || isEditable) return;
      }
      if (e.key === "ArrowLeft" && leftHref) {
        router.push(leftHref);
      } else if (e.key === "ArrowRight" && rightHref) {
        router.push(rightHref);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leftHref, rightHref, router]);

  return (
    <div className="mb-3 flex items-center justify-between" role="navigation" aria-label="Navegação por setas">
      <div>
        {leftHref ? (
          <Link
            href={leftHref}
            className={btn}
            aria-label="Voltar"
            aria-keyshortcuts="ArrowLeft"
            title="Voltar (←)"
          >
            ←
          </Link>
        ) : (
          <button className={btn} aria-label="Voltar" aria-keyshortcuts="ArrowLeft" title="Voltar (←)" disabled>
            ←
          </button>
        )}
      </div>
      <div>
        {rightHref ? (
          <Link
            href={rightHref}
            className={btn}
            aria-label="Avançar"
            aria-keyshortcuts="ArrowRight"
            title="Avançar (→)"
          >
            →
          </Link>
        ) : (
          <button className={btn} aria-label="Avançar" aria-keyshortcuts="ArrowRight" title="Avançar (→)" disabled>
            →
          </button>
        )}
      </div>
    </div>
  );
}
