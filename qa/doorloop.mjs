#!/usr/bin/env node
/**
 * Doorloop als bezoeker (PRD §12): per pagina, op 390 × 844 en 1440 × 900, met echte wielstappen
 * en een lopende klok. Maakt per pagina een contactblad van ≥ 12 beelden (qa/uitvoer/doorloop/) en
 * faalt op: paginafouten, consolefouten, horizontale overflow, en een scherm dat helemaal leeg is
 * (één kleur over ≥ 98 % van de pixels).
 *
 *   BASIS=http://localhost:PORT node qa/doorloop.mjs [/pad …]
 */
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'
import { pagina, routes, uitslag, BROWSER } from './lib.mjs'

const paden = process.argv.slice(2).length ? process.argv.slice(2) : await routes()
const uit = `qa/uitvoer/doorloop/${BROWSER}`
mkdirSync(uit, { recursive: true })
const fouten = []
let geslaagd = 0

async function leeg(buf) {
  const { data, info } = await sharp(buf).resize(64, 64, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
  const tel = new Map()
  for (let i = 0; i < data.length; i += info.channels) {
    const k = `${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`
    tel.set(k, (tel.get(k) || 0) + 1)
  }
  return Math.max(...tel.values()) / (64 * 64) >= 0.98
}

for (const [breedte, hoogte] of [[390, 844], [1440, 900]]) {
  for (const pad of paden) {
    const { page, fouten: pf, sluit } = await pagina({ breedte, hoogte })
    await page.goto(new URL(pad, process.env.BASIS).href, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    const totaal = await page.evaluate(() => document.documentElement.scrollHeight)
    const stappen = Math.max(12, Math.ceil(totaal / (hoogte * 0.8)))
    const stap = Math.max(1, Math.floor((totaal - hoogte) / (stappen - 1)))
    const beelden = []
    let legeSchermen = 0
    for (let i = 0; i < stappen; i++) {
      const doel = Math.min(i * stap, totaal - hoogte)
      // Echte wielstappen richting het doel; stopt zodra de pagina niet verder kan (einde bereikt).
      for (let poging = 0; poging < 60; poging++) {
        const nu = await page.evaluate(() => window.scrollY)
        const rest = doel - nu
        if (Math.abs(rest) <= 1) break
        const d = Math.sign(rest) * Math.min(Math.abs(rest), 240)
        if (BROWSER === 'webkit') await page.evaluate((y) => window.scrollBy(0, y), d)
        else await page.mouse.wheel(0, d)
        await page.waitForTimeout(40)
        if ((await page.evaluate(() => window.scrollY)) === nu) break
      }
      await page.waitForTimeout(450)
      const buf = await page.screenshot()
      if (await leeg(buf)) legeSchermen++
      beelden.push(buf)
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const naam = `${pad === '/' ? 'home' : pad.slice(1).replace(/\//g, '_')}-${breedte}`
    // contactblad: 4 kolommen
    const w = breedte < 600 ? 195 : 360, h = Math.round((w / breedte) * hoogte), kol = 4
    const rijen = Math.ceil(beelden.length / kol)
    const tegels = await Promise.all(beelden.map((b) => sharp(b).resize(w, h).png().toBuffer()))
    await sharp({ create: { width: kol * w + (kol + 1) * 8, height: rijen * h + (rijen + 1) * 8, channels: 3, background: '#555' } })
      .composite(tegels.map((t, i) => ({ input: t, left: 8 + (i % kol) * (w + 8), top: 8 + Math.floor(i / kol) * (h + 8) })))
      .jpeg({ quality: 72 }).toFile(`${uit}/${naam}.jpg`)
    const f = [...pf]
    if (overflow > 0) f.push(`${overflow}px horizontale overflow`)
    if (legeSchermen) f.push(`${legeSchermen} leeg scherm(en)`)
    if (f.length) fouten.push(...f.map((x) => `${naam}: ${x}`)); else geslaagd++
    console.log(`${f.length ? '✗' : '✓'} ${naam}: ${beelden.length} beelden, ${totaal}px hoog${f.length ? ' — ' + f.join('; ') : ''}`)
    await sluit()
  }
}
uitslag('doorloop', fouten, geslaagd)
