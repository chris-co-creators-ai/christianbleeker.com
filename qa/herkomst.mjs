#!/usr/bin/env node
/**
 * Herkomst van alle tekst (PRD I-1, I-2, I-4).
 *
 * I-2  Elke zichtbare zin van ≥ 4 woorden op elke pagina staat letterlijk in de tekst van de vorige
 *      site (qa/bron/vorige-site.txt) of in het tekstvoorstel (docs/copy-nieuw.md).
 * I-1  Elke alinea van de vorige site heeft een plek op de nieuwe site — letterlijk, of als voorstel
 *      in docs/copy-nieuw.md (de ik → wij-herschrijvingen). Uitzonderingen hieronder, met reden.
 * I-2  0 bouwinstructies, placeholders of lorem ipsum.
 *
 *   BASIS=http://localhost:PORT node qa/herkomst.mjs
 */
import { pagina, routes, uitslag, lees } from './lib.mjs'

const norm = (t) => t.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[↗→←↑×—–]/g, ' ')
  .replace(/\s+/g, ' ').trim()
const bron = norm(lees('qa/bron/vorige-site.txt'))
const voorstel = norm(lees('docs/copy-nieuw.md'))
/** Sjablonen uit copy-nieuw.md met <naam>/<in het kort>: één zin per case of aanbeveling. */
const sjablonen = [...lees('docs/copy-nieuw.md').matchAll(/"([^"]*<[a-z ]+>[^"]*)"/g)]
  .map((m) => new RegExp('^' + norm(m[1]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/<[a-z ]+>/g, '.+') + '$'))
const bekend = (z) => bron.includes(z) || voorstel.includes(z) || sjablonen.some((r) => r.test(z))

/** Alinea's van de vorige site die bewust niet (letterlijk) terugkomen. */
const UITZONDERING = [
  ['websites (logo', 'beschrijving van een blok, geen tekst: de logo\'s staan op /about'],
  ['ervaringen (zeven', 'beschrijving van een blok: de aanbevelingen staan op /about'],
  ['chris bleeker — websites × marketing', 'de kop van de vorige site als één regel: staat als merk, ondertitel en menu'],
]

const VERBODEN = [/lorem ipsum/i, /\bTODO\b/, /placeholder/i, /voorbeeld\.nl/i, /example\.com/i, /nog-niet-geleverd/i]

const fouten = []
let geslaagd = 0
let alleTekst = ''
for (const pad of await routes()) {
  const { page, sluit } = await pagina()
  await page.goto(process.env.BASIS + pad, { waitUntil: 'networkidle' })
  const blokken = await page.evaluate(() => {
    const uit = []
    document.querySelectorAll('body h1, body h2, body h3, body p, body li, body a, body button, body label, body figcaption, body blockquote')
      .forEach((el) => { if (!el.closest('[aria-hidden="true"], .sr-only')) uit.push(el.innerText) })
    return uit
  })
  const tekst = blokken.join('\n')
  alleTekst += '\n' + tekst
  for (const r of VERBODEN) if (r.test(tekst)) fouten.push(`${pad}: verboden tekst ${r}`)
  const zinnen = new Set(blokken.flatMap((b) => b.split(/(?<=[.?!:])\s+|\n+|•/)).map(norm).filter((z) => z.split(' ').length >= 4))
  for (const z of zinnen) {
    const kern = z.replace(/[.?!:]$/, '')
    if (bekend(kern)) geslaagd++
    else fouten.push(`${pad}: zin zonder herkomst: "${z}"`)
  }
  await sluit()
}

// I-1: elke alinea van de vorige site staat op de site of in het voorstel
const site = norm(alleTekst)
for (const alinea of lees('qa/bron/vorige-site.txt').split(/\n\s*\n/).map(norm).filter(Boolean)) {
  const zonderLabel = alinea.replace(/^in het kort: |^ontwerpdoel: /, '')
  if (UITZONDERING.some(([begin]) => alinea.startsWith(norm(begin)))) { geslaagd++; continue }
  const delen = zonderLabel.split(/ — | · |: /)
  if (delen.every((d) => site.includes(d.trim()) || voorstel.includes(d.trim()) || d.trim().split(' ').length < 2)) geslaagd++
  else fouten.push(`alinea van de vorige site zonder plek: "${alinea.slice(0, 90)}…"`)
}
uitslag('herkomst', fouten, geslaagd)
