/**
 * F6 #74: auditoria de acessibilidade com axe-core nas páginas geradas.
 * Serve .output/public estaticamente, injeta axe-core em cada rota e falha
 * se houver violação critical/serious.
 *
 * Uso: bun run generate && bun run test:a11y
 * ponytail: single-file; puppeteer-core usa o chromium do ambiente do CI.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'

const PORT = 4174
const ROOT = '.output/public'

// rotas estáticas geradas pelo nuxt generate
const ROUTES = ['/', '/dashboard/', '/resumes/', '/templates/', '/settings/', '/about/', '/resumes/trash/']

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' }

function serve() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      let file = join(ROOT, path)
      try {
        const s = await stat(file)
        if (s.isDirectory()) file = join(file, 'index.html')
      } catch {
        // SPA fallback para rotas client-only
        file = join(ROOT, '200.html')
      }
      try {
        const content = await readFile(file)
        res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
        res.end(content)
      } catch {
        res.writeHead(404).end()
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

async function main() {
  const server = await serve()
  const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8')
  const puppeteer = (await import('puppeteer-core')).default

  // localiza o binário do chromium (CI: apt chromium; local: paths comuns)
  const { existsSync } = await import('node:fs')
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean)
  const executablePath = candidates.find((p) => existsSync(p))
  if (!executablePath) {
    console.error('chromium não encontrado — defina CHROMIUM_PATH ou instale chromium')
    process.exit(1)
  }

  const browser = await puppeteer.launch({ headless: true, executablePath, args: ['--no-sandbox', '--disable-gpu'] })
  let failures = 0

  for (const route of ROUTES) {
    const page = await browser.newPage()
    try {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle2', timeout: 30000 })
      await page.evaluate(axeSource)
      const results = await page.evaluate(() =>
        /** @type {any} */ (window).axe.run()
      )
      const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      if (serious.length) {
        failures += serious.length
        console.error(`✗ ${route}: ${serious.length} violação(ões) séria(s)`)
        for (const v of serious) console.error(`   [${v.impact}] ${v.id} — ${v.nodes.length} nó(s)`)
      } else {
        console.log(`✓ ${route}`)
      }
    } catch (err) {
      console.error(`✗ ${route}: erro — ${err.message.slice(0, 120)}`)
      failures++
    }
    await page.close()
  }

  await browser.close()
  server.close()
  console.log(failures ? `\na11y: ${failures} violação(ões) critical/serious` : '\na11y: todas as rotas passaram')
  process.exit(failures ? 1 : 0)
}

main()
