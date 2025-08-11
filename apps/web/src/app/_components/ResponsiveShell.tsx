"use client";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import AdaptiveContext from "./AdaptiveContext";
import MobileNav from "@/app/_components/MobileNav";
import NavArrows from "./NavArrows";

export default function ResponsiveShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block">
          <Sidebar />
          {/* Contexto removido da sidebar (desktop) */}
        </aside>
        {/* Main */}
        <main className="p-4 md:p-6 pb-24 min-w-0">
          <div className="max-w-full">
            {/* Contexto atual (Mobile) */}
            <AdaptiveContext mode="mobile" />
            <NavArrows />
            {children}
          </div>
        </main>
      </div>
      {/* Navegação inferior (Mobile) */}
      <MobileNav />
    </div>
  );
}
