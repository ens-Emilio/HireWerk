import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "./_components/Header";
import ToasterProvider from "@/components/ui/ToasterProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireWerk",
  description: "Currículos rápidos e bonitos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} theme-light antialiased bg-background text-foreground overflow-x-hidden`}>
        <Script id="theme-init" strategy="beforeInteractive">{`
          try {
            var MODE_KEY = 'hw-theme-mode';
            var body = document.body;
            var toRemove = ['theme-light','theme-dark','theme-corp','theme-criativo','theme-academico','theme-corp-dark','theme-criativo-dark','theme-academico-dark'];
            var m = localStorage.getItem(MODE_KEY);
            var dark = m ? m === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            var cls = dark ? 'theme-dark' : 'theme-light';
            for (var i = 0; i < toRemove.length; i++) body.classList.remove(toRemove[i]);
            body.classList.add(cls);
          } catch (e) {}
        `}</Script>
        {/* Skip to content for keyboard users */}
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:text-white focus:px-3 focus:py-2 focus:rounded-md"
        >
          Pular para o conteúdo
        </a>
        <Header />
        <ToasterProvider />
        <div id="conteudo-principal">{children}</div>
      </body>
    </html>
  );
}
