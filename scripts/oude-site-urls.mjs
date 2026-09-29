#!/usr/bin/env node
/**
 * Haalt de sitemap(s) van een oude site op en schrijft een voorstel voor `redirects.ts`
 * (`src/content/redirects.ts`) naar `redirects-voorstel.tsv` — een mens controleert dat voorstel
 * en zet de regels die kloppen over.
 *
 *   node scripts/oude-site-urls.mjs <oude-domein>
 *
 * Probeert, in volgorde, `sitemap.xml`, `sitemap_index.xml` en `wp-sitemap.xml` op de opgegeven
 * host. Is zo'n bestand zelf een sitemapindex (verwijst naar andere sitemaps), dan volgt het
 * script die geneste sitemaps ook — tot `MAX_DIEPTE` lagen diep, met een `bezocht`-set tegen een
 * sitemap die (per ongeluk of expres) naar zichzelf terugverwijst.
 *
 * Puur regex-based XML-lezen (geen XML-parser-dependency) — sitemaps zijn een vaste, simpele
 * structuur (`<loc>...</loc>` binnen `<url>` of `<sitemap>`), zelfde aanpak als de handgeschreven
 * XML in `src/app/feed.xml/route.ts`.
 *
 * Getest tegen een lokale, nep-sitemap in `scripts/test-oude-site-urls.mjs` — nooit tegen een
 * echte site (zie de opdracht daarvoor).
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { site } from '../src/content/site.ts'

const KANDIDATEN = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']
const MAX_DIEPTE = 3

export function normaliseerBasis(invoer) {
  const zonderSlash = invoer.replace(/\/+$/, '')
  return /^https?:\/\//i.test(zonderSlash) ? zonderSlash : `https://${zonderSlash}`
}

function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(xml)
}

function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s][^<]*?)\s*<\/loc>/gi)].map((m) => m[1])
}

async function haalXml(url, fetchImpl) {
  try {
    const res = await fetchImpl(url)
    if (!res.ok) return null
    const tekst = await res.text()
    if (!/<\?xml|<urlset|<sitemapindex/i.test(tekst)) return null
    return tekst
  } catch {
    return null
  }
}

/** Haalt recursief alle pagina-URL's op uit één sitemap-URL (urlset of sitemapindex). */
async function volgSitemap(url, fetchImpl, bezocht, diepte) {
  if (bezocht.has(url) || diepte > MAX_DIEPTE) return []
  bezocht.add(url)
  const xml = await haalXml(url, fetchImpl)
  if (!xml) return []
  const gevondenLocs = locs(xml)
  if (isSitemapIndex(xml)) {
    const resultaten = await Promise.all(
      gevondenLocs.map((l) => volgSitemap(l, fetchImpl, bezocht, diepte + 1)),
    )
    return resultaten.flat()
  }
  return gevondenLocs
}

/** Probeert alle drie de bekende sitemap-bestandsnamen en voegt hun paden samen (dedup). */
export async function haalOudeSitePaden(basis, fetchImpl = fetch) {
  const bezocht = new Set()
  const gevondenUrls = new Set()
  for (const kandidaat of KANDIDATEN) {
    const urls = await volgSitemap(`${basis}${kandidaat}`, fetchImpl, bezocht, 0)
    for (const u of urls) gevondenUrls.add(u)
  }
  const paden = new Set()
  for (const u of gevondenUrls) {
    try {
      paden.add(new URL(u).pathname || '/')
    } catch {
      // Een relatieve of kapotte <loc> — overslaan, geen crash op één rotte regel.
    }
  }
  return [...paden].sort()
}

/** De paden die déze (nieuwe) site zelf al bedient — zelfde vaste routes als
 *  `src/app/sitemap.ts`, hier los opgebouwd zodat dit script geen Next.js-runtime nodig heeft. Een
 *  klantsite die eigen pagina's/artikelen krijgt (via de PRD) breidt deze lijst zelf uit. */
export function eigenPaden() {
  const paden = ['/']
  if (site.faq.items.length > site.faq.eigenPaginaVanaf) paden.push('/veelgestelde-vragen')
  return new Set(paden)
}

export function bouwVoorstel(oudePaden, eigenPadenSet) {
  return oudePaden.map((van) => {
    const gevonden = eigenPadenSet.has(van)
    return { van, naar: gevonden ? van : '/', gevonden }
  })
}

export function naarTsv(rijen) {
  const header = 'van\tnaar\tgevonden'
  const regels = rijen.map((r) => `${r.van}\t${r.naar}\t${r.gevonden ? 'ja' : 'nee'}`)
  return [header, ...regels].join('\n') + '\n'
}

async function main() {
  const invoer = process.argv[2]
  if (!invoer) {
    console.error('Gebruik: node scripts/oude-site-urls.mjs <oude-domein>')
    process.exitCode = 1
    return
  }
  const basis = normaliseerBasis(invoer)
  console.log(`Sitemap(s) ophalen van ${basis} …`)
  const oudePaden = await haalOudeSitePaden(basis)
  if (oudePaden.length === 0) {
    console.error(`Geen sitemap gevonden op ${basis} (geprobeerd: ${KANDIDATEN.join(', ')}).`)
    process.exitCode = 1
    return
  }
  const voorstel = bouwVoorstel(oudePaden, eigenPaden())
  const tsv = naarTsv(voorstel)
  const uitvoerPad = path.join(process.cwd(), 'redirects-voorstel.tsv')
  await writeFile(uitvoerPad, tsv, 'utf8')
  const nietGevonden = voorstel.filter((r) => !r.gevonden).length
  console.log(`${oudePaden.length} paden gevonden, ${nietGevonden} zonder duidelijke bestemming (→ '/').`)
  console.log(`Voorstel geschreven naar ${uitvoerPad} — controleer en zet regels over naar src/content/redirects.ts.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
