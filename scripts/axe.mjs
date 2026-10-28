#!/usr/bin/env node
/**
 * Axe-telling over alle routes op 1440 en 390 (WCAG 2.0/2.1/2.2 A + AA). Exit 0 alleen bij
 * 0 serious/critical. Draait tegen BASIS_URL (standaard http://localhost:4850); THEMA=licht|donker meet één thema.
 *
 * Bewuste uitzondering: het ongelit woord van `story-word-light` ([data-story-word]) is een
 * scroll-effect (grijs -> inkt met de scroll); in rust is het contrast daar met opzet laag.
 * Bij "minder beweging" is de tekst volledig leesbaar (gemeten in scripts/doorloop.mjs).
 *
 * axe-core wordt gezocht in: $AXE_CORE (pad naar axe.min.js) of node_modules (devDependency).
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { laadChromium, LAUNCH, BASIS, PAGINAS, THEMA } from './browser.mjs'

const KAND = [
  process.env.AXE_CORE,
  path.resolve(import.meta.dirname, '../node_modules/axe-core/axe.min.js'),
].filter(Boolean)
const axePad = KAND.find((k) => existsSync(k))
if (!axePad) throw new Error(`axe-core niet gevonden. Zet AXE_CORE=<pad naar axe.min.js>. Gezocht: ${KAND.join(', ')}`)
const axeBron = readFileSync(axePad, 'utf8')

const chromium = await laadChromium()
let fout = 0
console.log('route'.padEnd(24), 'breedte', 'serious/critical', 'regels')
for (const breedte of [1440, 390]) {
  for (const pad of PAGINAS) {
    // --single-process: sluiten van een pagina beëindigt de browser, dus één browser per route
    const browser = await chromium.launch(LAUNCH)
    const page = await browser.newPage({ viewport: { width: breedte, height: 900 } })
    await page.goto(BASIS + pad, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.evaluate(axeBron)
    const res = await page.evaluate(async () => {
      const r = await window.axe.run(
        { exclude: [['[data-story-word]']] },
        { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } },
      )
      return r.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => `${n.target.join(' ')} :: ${(n.any[0]?.message || n.failureSummary || '').slice(0, 140)}`) }))
    })
    const n = res.reduce((s, v) => s + v.nodes.length, 0)
    fout += n
    console.log(pad.padEnd(24), String(breedte).padEnd(7), String(n).padEnd(16), res.map((v) => `${v.id}(${v.nodes.length})`).join(' ') || '-')
    for (const v of res) for (const nd of v.nodes) console.log('   ', v.id, nd)
    await browser.close()
  }
}
console.log(fout === 0 ? `AXE GROEN${THEMA ? ` (thema ${THEMA})` : ''}: 0 serious/critical` : `AXE ROOD${THEMA ? ` (thema ${THEMA})` : ''}: ${fout} nodes`)
process.exit(fout === 0 ? 0 : 1)
