import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { signExportToken } from "@/lib/exportToken";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  // Variáveis usadas para logging e no catch
  let supabase: Awaited<ReturnType<typeof getSupabaseServerClient>> | null = null;
  let exportId: string | null = null;
  let start: number | null = null;
  let storagePath: string | null = null;
  try {
    const { id } = await ctx.params;
    supabase = await getSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return new NextResponse("Não autorizado", { status: 401 });

    // Verifica se o currículo pertence ao usuário
    const { data: resume, error } = await supabase
      .from("resumes")
      .select("id, user_id, version")
      .eq("id", id)
      .single();

    if (error || !resume) {
      return new NextResponse("Currículo não encontrado", { status: 404 });
    }
    if (resume.user_id !== auth.user.id) {
      return new NextResponse("Acesso não autorizado", { status: 403 });
    }

    // Gera token assinado para a página de renderização
    const exp = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutos
    const token = signExportToken({ sub: auth.user.id, rid: id, exp });

    const url = new URL(`/export/render/${id}?token=${encodeURIComponent(token)}`, request.url);

    // Inicia registro de exportação
    start = Date.now();
    try {
      const inserted = await supabase
        .from("exports")
        .insert({
          resume_id: id,
          user_id: auth.user.id,
          format: "pdf",
          engine: "puppeteer",
          resume_version: resume.version,
          status: "running",
        })
        .select("id")
        .single();
      exportId = inserted.data?.id ?? null;
    } catch {
      // ignora falha de logging para não quebrar exportação
    }

    // Carrega dependências pesadas sob demanda para evitar custo no startup do dev server
    const { default: chromium } = await import("@sparticuz/chromium");
    const { default: puppeteer } = await import("puppeteer-core");

    // Inicializa o Chromium
    const ep = await chromium.executablePath();
    const localAppData = process.env.LOCALAPPDATA;
    const userChrome = localAppData
      ? path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe")
      : undefined;
    const userEdge = localAppData
      ? path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe")
      : undefined;

    const rawCandidates = [
      // Preferir variáveis de ambiente explícitas
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_PATH,
      // Instalações do usuário
      userChrome,
      userEdge,
      // Instalações do sistema
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      // Caminho específico verificado via PowerShell
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      // Por último, o caminho do pacote chromium (pode ser dir temporário em dev)
      ep,
    ].filter(Boolean) as string[];

    const tryResolveExecutable = (p: string): string | null => {
      try {
        const st = fs.statSync(p);
        if (st.isFile()) {
          if (process.platform === "win32" && !p.toLowerCase().endsWith(".exe")) {
            // Arquivo sem extensão .exe no Windows não é executável esperado
            // Tenta localizar executáveis conhecidos dentro do mesmo diretório
            const dir = path.dirname(p);
            const names = ["chrome.exe", "chromium.exe", "msedge.exe", "headless_shell.exe"];
            for (const name of names) {
              const nested = path.join(dir, name);
              if (fs.existsSync(nested) && fs.statSync(nested).isFile()) return nested;
            }
            return null;
          }
          return p;
        }
        if (st.isDirectory()) {
          const names = ["chrome.exe", "chromium.exe", "msedge.exe", "headless_shell.exe"];
          for (const name of names) {
            const nested = path.join(p, name);
            if (fs.existsSync(nested) && fs.statSync(nested).isFile()) return nested;
          }
        }
      } catch {
        // ignore
      }
      return null;
    };

    const executablePath = rawCandidates.map(tryResolveExecutable).find((x) => !!x) || null;
    console.debug("[export/pdf] chromium.executablePath:", ep);
    console.debug("[export/pdf] CHROME_PATH:", process.env.CHROME_PATH);
    console.debug("[export/pdf] PUPPETEER_EXECUTABLE_PATH:", process.env.PUPPETEER_EXECUTABLE_PATH);
    console.debug("[export/pdf] resolved executablePath:", executablePath);
    if (!executablePath) {
      console.error("Nenhum executável do Chromium/Chrome/Edge encontrado.", { ep });
      try {
        if (typeof exportId === "string") {
          await supabase
            .from("exports")
            .update({ status: "failed", error: "Chromium/Chrome/Edge não encontrado" })
            .eq("id", exportId);
        }
      } catch {}
      return new NextResponse(
        "Chromium/Chrome/Edge não encontrado. Defina CHROME_PATH ou PUPPETEER_EXECUTABLE_PATH no .env.local",
        { status: 500 }
      );
    }

    const baseName = path.basename(executablePath);
    const usingInstalledBrowser = /chrome\.exe|msedge\.exe|chromium\.exe/i.test(baseName);
    const launchArgs = usingInstalledBrowser
      ? []
      : (Array.isArray(chromium.args) ? chromium.args : []);

    const browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: chromium.defaultViewport || { width: 1280, height: 800 },
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.goto(url.toString(), { waitUntil: "networkidle2", timeout: 120_000 });
      // Garante que regras @media print sejam aplicadas ao gerar o PDF
      await page.emulateMediaType("print");
      // Oculta/remover elementos de navegação globais
      await page.addStyleTag({
        content: `
          html, body, main { background: #fff !important; }
          body { margin: 0 !important; }
          @page { size: A4; margin: 0 }
          header, nav, footer,
          .site-header, .app-header, .topbar, .navbar,
          [data-site-header], [data-region="topbar"], .no-print {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          @media print {
            header, nav, footer,
            .site-header, .app-header, .topbar, .navbar,
            [data-site-header], [data-region="topbar"], .no-print { display: none !important; }
            html, body, main { background: #fff !important; }
            body { margin: 0 !important; }
          }
        `,
      });
      await page.evaluate(() => {
        const selectors = [
          'header','nav','footer','.site-header','.app-header','.topbar','.navbar','[data-site-header]','[data-region="topbar"]','.no-print'
        ];
        for (const sel of selectors) {
          document.querySelectorAll(sel).forEach(el => el.remove());
        }
      });

      const pdfBuffer = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        format: "A4",
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      // Tenta salvar no Supabase Storage (opcional). Ignora falhas sem quebrar a resposta.
      try {
        const bucket = process.env.SUPABASE_PDF_BUCKET || "exports";
        const fileName = `${auth.user.id}/${id}/${(exportId ?? crypto.randomUUID())}.pdf`;
        const { data: up, error: upErr } = await supabase.storage
          .from(bucket)
          .upload(fileName, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (!upErr && up?.path) {
          storagePath = `${bucket}/${up.path}`;
        }
      } catch {}
      // Atualiza registro de exportação como sucedido
      try {
        const durationMs = typeof start === "number" ? Date.now() - start : null;
        let checksum = "";
        try {
          const hasher = crypto.createHash("sha256");
          hasher.update(pdfBuffer);
          checksum = hasher.digest("hex");
        } catch {}
        if (typeof exportId === "string") {
          await supabase
            .from("exports")
            .update({
              status: "succeeded",
              ...(durationMs !== null ? { duration_ms: durationMs } : {}),
              size_bytes: pdfBuffer.length,
              checksum,
              ...(storagePath ? { storage_path: storagePath } : {}),
            })
            .eq("id", exportId);
        }
      } catch {
        // falha ao registrar não deve impedir resposta
      }
      
      const headers = new Headers({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="hirewerk-resume-${id}.pdf"`,
        "Cache-Control": "private, no-store",
      });
      const bytes = pdfBuffer as unknown as Uint8Array;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
      return new NextResponse(stream, { status: 200, headers });
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    try {
      if (supabase && typeof exportId === "string") {
        const durationMs = typeof start === "number" ? Date.now() - start : null;
        await supabase
          .from("exports")
          .update({
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            ...(durationMs !== null ? { duration_ms: durationMs } : {}),
          })
          .eq("id", exportId);
      }
    } catch {}
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  // Reutiliza a mesma implementação do GET
  return GET(request, ctx);
}
