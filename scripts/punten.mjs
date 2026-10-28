#!/usr/bin/env node
/**
 * Toetst docs/PUNTEN.md tegen de draaiende site (overgenomen van demo-15, aangepast voor christianbleeker v2).
 *
 *   npm run build && npm start -- -p 4320 &   # of: BASIS_URL=https://… node scripts/punten.mjs
 *   node scripts/punten.mjs
 *
 * Per tabelrij: (1) de punten moeten gelijk zijn aan catalogus.json (met CATALOGUS=<pad>);
 * (2) de selector moet op die pagina in de DOM staan (pagina `*` = op elke pagina, ook de 404).
 * Daarna rekent het script het totaal opnieuw uit: elk onderdeel één keer, alleen rijen met
 * "Telt = ja" en punten > 1. Exit 0 alleen als alle selectors gevonden zijn, het totaal ≥ 50 is
 * en er minstens vier onderdelen van 4+ punten tellen (MINIMUM 150 en WOW_MIN 4, het v2-doel; THEMA=licht|donker).
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { laadChromium, LAUNCH, BASIS, PAGINAS } from './browser.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
// catalogus.json van de onderdelenbibliotheek: CATALOGUS=<pad>. Zonder pad worden de punten niet nagekeken.
const CATALOGUS = process.env.CATALOGUS || '(geen CATALOGUS gezet)'
const MINIMUM = Number(process.env.MINIMUM || 150) // v2-doel (BOUWPLAN-V2.md)

const md = readFileSync(path.join(ROOT, 'docs/PUNTEN.md'), 'utf8')
// Eén tabel per pagina (fase 2: elke maker zijn eigen blok); alle tabelrijen van het hele bestand tellen.
const rijen = md.split('\n')
  .filter((r) => r.startsWith('|') && !r.startsWith('|---') && !r.startsWith('| Pagina |'))
  .map((r) => r.split('|').slice(1, -1).map((c) => c.trim()))
  .filter((c) => c.length === 7)
  .map(([pagina, onderdeel, map, punten, telt, selector, waar]) => ({
    pagina, onderdeel, map, punten: Number(punten), telt: telt.startsWith('ja'), selector: selector.replace(/^`|`$/g, ''), waar,
  }))
if (rijen.length === 0) { console.error('Geen tabelrijen gevonden in docs/PUNTEN.md'); process.exit(1) }

const fouten = []

// 1. Punten tegen de catalogus
if (existsSync(CATALOGUS)) {
  console.log(`catalogus: ${CATALOGUS}`)
  const cat = JSON.parse(readFileSync(CATALOGUS, 'utf8'))
  for (const r of rijen) {
    const e = cat.find((x) => x.map === r.map)
    if (!e) fouten.push(`${r.map}: niet in catalogus.json`)
    else if (e.punten !== r.punten) fouten.push(`${r.map}: tabel zegt ${r.punten}, catalogus ${e.punten}`)
  }
} else {
  console.log(`(catalogus niet gevonden op ${CATALOGUS}; punten niet nagekeken)`)
}

// 2. Selectors in de echte DOM
const chromium = await laadChromium()
const paginas = [...new Set(rijen.flatMap((r) => (r.pagina === '*' ? PAGINAS : [r.pagina])))]
const gevonden = new Map() // `${pagina} ${selector}` -> aantal
for (const pad of paginas) {
  const browser = await chromium.launch(LAUNCH)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASIS + pad, { waitUntil: 'networkidle' })
  // Een keer langs de hele pagina, zodat onderdelen die pas in beeld starten ook draaien.
  const hoogte = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < Math.min(hoogte, 20000); y += 700) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(60)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(800)
  for (const r of rijen.filter((x) => x.pagina === pad || x.pagina === '*')) {
    // `js:<expressie>` = een meting in de pagina in plaats van een selector (onderdelen zonder DOM-spoor).
    const n = r.selector.startsWith('js:')
      ? Number(Boolean(await page.evaluate(`(async () => (${r.selector.slice(3)}))()`)))
      : await page.locator(r.selector).count()
    gevonden.set(`${pad} ${r.selector}`, n)
  }
  await browser.close()
}

console.log('\nPagina                 Onderdeel              Punten Telt  Gevonden')
for (const r of rijen) {
  const doelen = r.pagina === '*' ? PAGINAS : [r.pagina]
  const tellingen = doelen.map((p) => gevonden.get(`${p} ${r.selector}`) ?? 0)
  const ok = tellingen.every((n) => n > 0)
  if (!ok) fouten.push(`${r.onderdeel} niet gevonden (${r.selector}) op ${doelen.filter((_, i) => tellingen[i] === 0).join(', ')}`)
  console.log(`${r.pagina.padEnd(22)} ${r.onderdeel.padEnd(22)} ${String(r.punten).padStart(6)} ${(r.telt ? 'ja' : 'nee').padEnd(5)} ${ok ? 'ja' : 'NEE'} (${tellingen.join('/')})`)
}

// 3. Totaal: elk onderdeel één keer, alleen tellende rijen met > 1 punt
const tellend = new Map()
for (const r of rijen) if (r.telt && r.punten > 1 && !tellend.has(r.map)) tellend.set(r.map, r.punten)
const totaal = [...tellend.values()].reduce((a, b) => a + b, 0)
const vierPlus = [...tellend.values()].filter((p) => p >= 4).length
console.log(`\nTellende onderdelen: ${tellend.size} · totaal ${totaal} punten (minimum ${MINIMUM}) · onderdelen van 4+: ${vierPlus}`)
if (totaal < MINIMUM) fouten.push(`totaal ${totaal} < ${MINIMUM}`)
if (vierPlus < Number(process.env.WOW_MIN || 4)) fouten.push(`maar ${vierPlus} onderdelen van 4+`)

if (fouten.length) {
  console.error(`\nNIET GOED (${fouten.length}):\n- ${fouten.join('\n- ')}`)
  process.exit(1)
}
console.log(`\nGOED: alle onderdelen gevonden in de DOM, totaal ≥ ${MINIMUM}, genoeg onderdelen van 4+.`)
