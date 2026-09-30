#!/usr/bin/env node
/**
 * Geen horizontale scroll (PRD [S] Techniek): elke pagina op 320, 360, 390, 768, 1024, 1280, 1440 en
 * 1920 px, bovenaan én na doorscrollen, gemeten tegen clientWidth (niet innerWidth: die kan op
 * mobiel meegroeien en dan faalt de toets nooit). Daarnaast: geen woord in een kop over twee regels.
 *
 *   BASIS=http://localhost:PORT node qa/overflow.mjs
 */
import { pagina, routes, uitslag, scrollDoor } from './lib.mjs'

const fouten = []
let geslaagd = 0
const paden = await routes()
for (const breedte of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
  for (const pad of paden) {
    const { page, sluit } = await pagina({ breedte, hoogte: 800 })
    await page.goto(process.env.BASIS + pad, { waitUntil: 'networkidle' })
    const meet = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const boven = await meet()
    await scrollDoor(page, 700, 40)
    const na = await meet()
    if (boven > 0 || na > 0) fouten.push(`${pad} @${breedte}: ${Math.max(boven, na)}px te breed`); else geslaagd++
    // Woordbreuk: geen woord in een kop mag over twee regels verdeeld worden (breken op een koppelteken mag).
    const gebroken = await page.evaluate(() => {
      const uit = []
      for (const kop of document.querySelectorAll('h1, h2, h3, .volgende-naam')) {
        const w = document.createTreeWalker(kop, NodeFilter.SHOW_TEXT)
        for (let t = w.nextNode(); t; t = w.nextNode()) {
          for (const m of t.textContent.matchAll(/[^\s-]{2,}/g)) {
            const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length)
            const regels = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)))
            if (regels.size > 1) uit.push(m[0])
          }
        }
      }
      return uit
    })
    if (gebroken.length) fouten.push(`${pad} @${breedte}: woord over twee regels: ${gebroken.join(', ')}`); else geslaagd++
    await sluit()
  }
}
uitslag('overflow', fouten, geslaagd)
