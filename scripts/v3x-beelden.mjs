#!/usr/bin/env node
/**
 * v3x (29-10): schermbeelden van de nieuwe blokken (interne apps, werkwijze, team-hub) in licht en donker,
 * op 1440 en 390, met en zonder minder beweging, plus console-fouten. BASIS_URL (standaard :4850).
 *   node scripts/v3x-beelden.mjs [uitmap]
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { LAUNCH } from './browser.mjs'

const BASIS = process.env.BASIS_URL || 'http://localhost:4850'
const UIT = path.resolve(process.argv[2] || 'qa/v3x')
mkdirSync(UIT, { recursive: true })
const { chromium } = await import('playwright-core')
const BLOKKEN = [['/werkplaats', '#interne-apps', 'interne-apps'], ['/contact', '#werkwijze', 'werkwijze'], ['/about', '#team', 'team']]
const fouten = []
for (const thema of ['licht', 'donker']) for (const breedte of [1440, 390]) for (const reduced of [false, true]) {
  const browser = await chromium.launch(LAUNCH) // --single-process: één browser per context
  const ctx = await browser.newContext({ viewport: { width: breedte, height: breedte > 500 ? 900 : 844 }, reducedMotion: reduced ? 'reduce' : 'no-preference', deviceScaleFactor: 1 })
  await ctx.addInitScript((t) => { try { localStorage.setItem('thema', t) } catch { /* geen opslag */ } }, thema)
  const page = await ctx.newPage()
  page.on('pageerror', (e) => fouten.push(`${thema} ${breedte} pageerror ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') fouten.push(`${thema} ${breedte} console ${m.text().slice(0, 160)}`) })
  for (const [pad, sel, naam] of BLOKKEN) {
    await page.goto(BASIS + pad, { waitUntil: 'networkidle' })
    const el = page.locator(sel)
    await el.scrollIntoViewIfNeeded()
    // langzaam door het blok, zodat alles wat bij in beeld start ook start
    const h = await el.evaluate((e) => e.getBoundingClientRect().height)
    for (let y = 0; y < h; y += 400) { await page.evaluate(([s, yy]) => window.scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY + yy), [sel, y]); await page.waitForTimeout(150) }
    await page.waitForTimeout(2500)
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    if (scroll > 0) fouten.push(`${thema} ${breedte} ${naam}: ${scroll}px horizontale scroll`)
    const bestand = path.join(UIT, `${naam}-${thema}-${breedte}${reduced ? '-rm' : ''}.png`)
    await el.screenshot({ path: bestand, animations: 'disabled' })
    console.log(bestand)
  }
  await browser.close()
}
if (fouten.length) { console.error(`\nFOUTEN (${fouten.length}):\n- ${[...new Set(fouten)].join('\n- ')}`); process.exit(1) }
console.log('\nGOED: geen console-fouten, geen horizontale scroll.')
