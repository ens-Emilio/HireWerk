/**
 * Extração de texto de PDF (F9 #92) — pdf.js, 100% client-side.
 * ponytail: extração por posição/colunas do PDF é heurística; extraímos o texto
 * corrido e o editor faz o mapeamento manual. OCR (PDF escaneado) fora de escopo.
 */

export async function extractTextFromPdf(file: File): Promise<string> {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
    // worker via CDN não funciona offline; usar o worker embutido do pacote
    GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
    ).toString()

    const buffer = await file.arrayBuffer()
    const pdf = await getDocument({ data: buffer }).promise

    const pages: string[] = []
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
            .map(item => ('str' in item ? item.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
        if (pageText) pages.push(pageText)
    }

    // libera recursos do worker (método público do PDFDocumentProxy)
    void pdf.cleanup()
    const text = pages.join('\n')
    if (!text) throw new Error('O PDF parece estar escaneado (sem texto selecionável).')
    return text
}
