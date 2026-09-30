#!/usr/bin/env node
/**
 * De bevindingen van de beta-tester blijven gerepareerd (ronde 1, 30-09-2026). Eén meting per
 * bevinding; de woordbreuk in koppen staat in qa/overflow.mjs.
 *
 *   BASIS=http://localhost:PORT node qa/beta-reparaties.mjs
 */
import { pagina, uitslag } from './lib.mjs'

const B = process.env.BASIS
const fouten = []
let geslaagd = 0
const ok = (v, f) => (v ? geslaagd++ : fouten.push(f))

// G1: een onbekend adres geeft de eigen, Nederlandse 404 met een weg terug.
for (const pad of ['/bestaat-niet', '/work/bestaat-niet']) {
  const r = await fetch(B + pad)
  const html = await r.text()
  ok(r.status === 404 && /<html lang="nl"/.test(html) && /Deze pagina bestaat niet/.test(html) && /href="\/"/.test(html), `${pad}: geen eigen Nederlandse 404 met een link naar home`)
}

// G4: de view-transition-opt-in staat in de CSS die de server meestuurt.
{
  const html = await (await fetch(B + '/')).text()
  const css = await Promise.all([...html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map(async (m) => (await fetch(B + m[1])).text()))
  ok(css.some((c) => /@view-transition\s*\{\s*navigation:\s*auto/.test(c)), 'geen @view-transition in de CSS van de server')
}

// G3: "Pauzeer achtergrond" zet de zoom én het wisselwoord stil.
{
  const { page, sluit } = await pagina()
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.click('[data-mh-pauze]')
  await page.waitForTimeout(300)
  const zoom = await page.$eval('.mh__dia', (e) => getComputedStyle(e).animationPlayState)
  const eerst = await page.textContent('.hero-wissel-woord')
  await page.waitForTimeout(3000)
  const later = await page.textContent('.hero-wissel-woord')
  ok(zoom === 'paused', `pauze: de zoom loopt door (${zoom})`)
  ok(eerst === later, `pauze: het wisselwoord wisselt nog (${eerst} → ${later})`)
  await sluit()
}

// G2: de koppen van de stapelpanelen vallen niet onder de vaste kop.
{
  const { page, sluit } = await pagina()
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.locator('#werk [data-stapelpanelen]').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 1400)
  await page.waitForTimeout(700)
  const m = await page.evaluate(() => {
    const nav = document.querySelector('.pn').getBoundingClientRect()
    const koppen = [...document.querySelectorAll('[data-sp-kop]')].map((k) => k.getBoundingClientRect()).filter((r) => r.bottom > 0 && r.top < innerHeight)
    return { navOnder: nav.bottom, hoogste: Math.min(...koppen.map((r) => r.top)) }
  })
  ok(m.hoogste >= m.navOnder, `stapel: kop op y=${Math.round(m.hoogste)} onder de vaste kop (onderkant ${Math.round(m.navOnder)})`)
  await sluit()
}

// G6: op /work wijst de dock niet naar /work zelf.
{
  const { page, sluit } = await pagina()
  await page.goto(B + '/work', { waitUntil: 'networkidle' })
  await page.mouse.wheel(0, 1800)
  await page.waitForTimeout(800)
  const href = await page.evaluate(() => { const d = document.querySelector('.sd'); return d && getComputedStyle(d).visibility !== 'hidden' && d.getBoundingClientRect().width > 0 ? d.getAttribute('href') : 'verborgen' })
  ok(href !== '/work', `dock op /work wijst naar ${href}`)
  await sluit()
}

// L: /ai onderdeel 04 opent de checklist-prompt zelf.
{
  const html = await (await fetch(B + '/ai')).text()
  ok(/data-cik-trigger[^>]*>Website-checklist prompt/.test(html) || /data-prompt-src="\/website-checklist-prompt.txt"[^>]*class="link"|class="link"[^>]*data-cik-trigger/.test(html), '/ai: onderdeel 04 opent de prompt niet')
}
// Ronde 2: zonder JS is het actieve menu-item zichtbaar (eigen achtergrond).
{
  const { page, sluit } = await pagina({ javaScriptEnabled: false })
  await page.goto(B + '/work', { waitUntil: 'load' })
  const m = await page.$eval('.pn__list a[aria-current="page"]', (a) => ({ kleur: getComputedStyle(a).color, grond: getComputedStyle(a).backgroundColor }))
  ok(m.grond !== 'rgba(0, 0, 0, 0)' && m.kleur !== m.grond, `zonder JS: actief menu-item onzichtbaar (${m.kleur} op ${m.grond})`)
  const dock = await page.$eval('.sd', (d) => getComputedStyle(d).display).catch(() => 'none')
  ok(dock === 'none', `zonder JS: de dock staat nog in beeld (${dock})`)
  await sluit()
}
// Ronde 2: het wisselwoord blijft mint, ook gepauzeerd; de lightbox-hint staat niet op een telefoon.
{
  const { page, sluit } = await pagina()
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  const voor = await page.$eval('.hero-wissel-woord', (e) => getComputedStyle(e).color)
  await page.click('[data-mh-pauze]'); await page.waitForTimeout(300)
  const na = await page.$eval('.hero-wissel-woord', (e) => getComputedStyle(e).color)
  ok(voor === na && /168, 224, 214/.test(na), `wisselwoord verspringt van kleur bij pauze (${voor} → ${na})`)
  await sluit()
}
{
  const { page, sluit } = await pagina({ breedte: 390, hoogte: 844 })
  await page.goto(B + '/about', { waitUntil: 'networkidle' })
  ok(!(await page.locator('.ervaringen-hint').isVisible()), 'op 390 staat "Klik om te vergroten" nog in beeld')
  await sluit()
}
uitslag('beta-reparaties', fouten, geslaagd)
