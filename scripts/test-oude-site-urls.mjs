#!/usr/bin/env node
/**
 * End-to-end check voor `scripts/oude-site-urls.mjs` — spawnt het echte CLI-script tegen een
 * lokaal http-servertje dat een nep-sitemap serveert (een sitemapindex met twee geneste
 * sitemaps), nooit tegen een echte site. Leest daarna de daadwerkelijk geschreven
 * `redirects-voorstel.tsv` en ruimt 'm weer op.
 *
 *   node scripts/test-oude-site-urls.mjs
 */
import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = path.dirname(fileURLToPath(import.meta.url))
const CLI = path.join(HIER, 'oude-site-urls.mjs')
const TSV_PAD = path.join(process.cwd(), 'redirects-voorstel.tsv')

let n = 0
function check(naam, ok) {
  n += 1
  assert.ok(ok, naam)
}

const routes = {}
const server = http.createServer((req, res) => {
  const inhoud = routes[req.url]
  if (!inhoud) {
    res.writeHead(404)
    res.end()
    return
  }
  res.writeHead(200, { 'Content-Type': 'application/xml' })
  res.end(inhoud)
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()
const basis = `http://127.0.0.1:${port}`

// `/sitemap.xml` is zelf een sitemapindex — het meest voorkomende geval (WordPress/Yoast doet dit
// standaard) — die naar twee geneste sitemaps verwijst. `/sitemap_index.xml`/`/wp-sitemap.xml`
// bestaan hier bewust niet (404): het script moet dat gewoon overslaan, niet crashen.
routes['/sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${basis}/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>${basis}/sitemap-posts.xml</loc></sitemap>
</sitemapindex>`

routes['/sitemap-pages.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${basis}/</loc></url>
  <url><loc>${basis}/oude-diensten/manuele-therapie</loc></url>
</urlset>`

routes['/sitemap-posts.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${basis}/blog/oud-artikel-dat-niet-meer-bestaat</loc></url>
</urlset>`

await rm(TSV_PAD, { force: true })

try {
  const exitCode = await new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [CLI, basis], { stdio: 'inherit' })
    proc.on('error', reject)
    proc.on('exit', resolve)
  })
  check('CLI sluit af met exit 0', exitCode === 0)

  const tsv = await readFile(TSV_PAD, 'utf8')
  console.log('\n--- redirects-voorstel.tsv (uit deze testrun) ---')
  console.log(tsv)

  check('bevat de headerregel', tsv.startsWith('van\tnaar\tgevonden'))
  check('homepage → zichzelf (bestaat al)', /^\/\t\/\tja$/m.test(tsv))
  check('onbekend oud pad → / (fallback, gevonden=nee)', /^\/oude-diensten\/manuele-therapie\t\/\tnee$/m.test(tsv))
  check(
    'geneste sitemap: ander onbekend pad → / (fallback, gevonden=nee)',
    /^\/blog\/oud-artikel-dat-niet-meer-bestaat\t\/\tnee$/m.test(tsv),
  )
  check('precies 3 datarijen (header + 3, geen duplicaten)', tsv.trim().split('\n').length === 4)
} finally {
  server.close()
  await rm(TSV_PAD, { force: true })
}

console.log(`oude-site-urls: alle checks geslaagd (${n}/${n})`)
