#!/usr/bin/env node
/**
 * Gewicht en beeld (PRD P-6, [S] Techniek): home ≤ 1,0 MB tot `load`; het LCP-beeld ≤ 200 KB; elk ander
 * beeld ≤ 300 KB (gemeten als overdracht); hoogstens één voorrangsbeeld, en precies één als er bij binnenkomst
 * een beeld in beeld staat; geen beeld zonder breedte en
 * hoogte (CLS).
 *
 *   BASIS=http://localhost:PORT node qa/gewicht.mjs
 */
import { pagina, routes, uitslag } from './lib.mjs'

const fouten = []
let geslaagd = 0
for (const pad of await routes()) {
  const { page, sluit } = await pagina()
  const grootte = new Map()
  // Overdracht (gecomprimeerd), zoals een bezoeker hem binnenkrijgt; beelden zijn al gecomprimeerd.
  page.on('requestfinished', async (req) => {
    try { const z = await req.sizes(); grootte.set(req.url(), z.responseBodySize + z.responseHeadersSize) } catch { /* geen maten */ }
  })
  await page.goto(process.env.BASIS + pad, { waitUntil: 'load' })
  await page.waitForTimeout(300)
  const totaal = [...grootte.values()].reduce((a, b) => a + b, 0)
  const info = await page.evaluate(() => ({
    prio: [...document.querySelectorAll('img[fetchpriority="high"]')].map((i) => i.currentSrc || i.src),
    // Staat er bij binnenkomst een beeld in beeld? Dan hoort er precies één voorrangsbeeld te zijn.
    beeldBoven: [...document.querySelectorAll('main img')].some((i) => { const r = i.getBoundingClientRect(); return r.width > 50 && r.top < innerHeight && r.bottom > 0 }),
    preload: [...document.querySelectorAll('link[rel="preload"][as="image"][fetchpriority="high"]')].map((l) => l.href),
    // Zonder width/height verspringt de pagina, tenzij het beeld absoluut staat of in een vak met vaste verhouding.
    zonderMaat: [...document.querySelectorAll('main img')].filter((i) => {
      if (i.getAttribute('width') && i.getAttribute('height')) return false
      if (getComputedStyle(i).position === 'absolute') return false
      for (let e = i.parentElement; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).aspectRatio !== 'auto') return false
      return true
    }).map((i) => i.src),
  }))
  if (pad === '/') {
    if (totaal > 1_000_000) fouten.push(`/: ${Math.round(totaal / 1024)} KB tot load (> 1000 KB)`); else geslaagd++
  }
  // Eén beeld telt één keer: React zet bij fetchpriority="high" zelf een preload van hetzelfde bestand.
  const bestand = (u) => new URL(u, process.env.BASIS).pathname.replace(/-\d+\.(avif|webp)$/, '')
  const prioTotaal = new Set([...info.prio, ...info.preload].filter(Boolean).map(bestand)).size
  if (prioTotaal > 1 || (info.beeldBoven && prioTotaal !== 1)) fouten.push(`${pad}: ${prioTotaal}× voorrang (fetchpriority="high"), beeld bij binnenkomst: ${info.beeldBoven}`); else geslaagd++
  for (const [url, n] of grootte) {
    if (!/\.(avif|webp|png|jpe?g|svg)(\?|$)/.test(url)) continue
    const lcp = info.prio.some((p) => p && url.endsWith(new URL(p).pathname))
    const plafond = lcp ? 200 : 300
    if (n / 1024 > plafond) fouten.push(`${pad}: ${url.split('/').pop()} ${Math.round(n / 1024)} KB > ${plafond} KB`); else geslaagd++
  }
  for (const s of info.zonderMaat) fouten.push(`${pad}: beeld zonder width/height: ${s}`)
  console.log(`  ${pad}: ${Math.round(totaal / 1024)} KB tot load`)
  await sluit()
}
uitslag('gewicht', fouten, geslaagd)
