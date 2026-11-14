/**
 * Share Target com arquivo (v3).
 *
 * O manifest declara `method: POST` + `enctype: multipart/form-data`, que é o
 * único formato que o Android aceita para compartilhar arquivos. O service
 * worker intercepta o POST, extrai o texto do arquivo (PDF/TXT/JSON) e
 * redireciona para /resumes com o conteúdo guardado em sessionStorage.
 *
 * Importado pelo service worker gerado pelo Workbox via `importScripts`.
 */

const SHARE_PATH = '/resumes'
const STORAGE_KEY = 'hirewerk:shared-content'

/** Extrai texto legível de um Blob, sem dependências (PDF fica como nome do arquivo). */
async function extractText(file) {
    const type = file.type || ''
    if (type.startsWith('text/') || type === 'application/json') {
        try {
            return await file.text()
        } catch {
            return ''
        }
    }
    // PDF: sem pdf.js no SW — devolve o nome para o app abrir o importador
    return file.name || ''
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)
    if (event.request.method !== 'POST' || url.pathname !== SHARE_PATH) return

    event.respondWith((async () => {
        try {
            const form = await event.request.formData()
            const file = form.get('file')
            const text = form.get('text') || ''
            const title = form.get('title') || ''

            let content = String(text || '')
            if (file && typeof file === 'object' && 'name' in file) {
                const extracted = await extractText(file)
                content = [title, content, extracted].filter(Boolean).join('\n')
            } else if (title) {
                content = [title, content].filter(Boolean).join('\n')
            }

            // sessionStorage não existe no SW: devolve uma página que grava e redireciona
            const payload = JSON.stringify(content)
            return new Response(
                `<!DOCTYPE html><meta charset="utf-8"><title>HireWerk</title>
<script>
try { sessionStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${payload}); } catch (e) {}
location.replace(${JSON.stringify(SHARE_PATH)});
</script>
<p>Recebendo conteúdo…</p>`,
                { headers: { 'content-type': 'text/html; charset=utf-8' } },
            )
        } catch {
            return Response.redirect(SHARE_PATH, 303)
        }
    })())
})
