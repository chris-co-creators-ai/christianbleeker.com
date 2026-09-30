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

// Een onbekend adres geeft de eigen, Nederlandse 404 met een weg terug.
for (const pad of ['/bestaat-niet', '/work/bestaat-niet']) {
  const r = await fetch(B + pad)
  const html = await r.text()
  ok(r.status === 404 && /<html lang="nl"/.test(html) && /Deze pagina bestaat niet/.test(html) && /href="\/"/.test(html), `${pad}: geen eigen Nederlandse 404 met een link naar home`)
}

// De view-transition-opt-in staat in de CSS die de server meestuurt.
{
  const html = await (await fetch(B + '/')).text()
  const css = await Promise.all([...html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map(async (m) => (await fetch(B + m[1])).text()))
  ok(css.some((c) => /@view-transition\s*\{\s*navigation:\s*auto/.test(c)), 'geen @view-transition in de CSS van de server')
}

// "Pauzeer achtergrond" zet de zoom én het wisselwoord stil.
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

// De koppen van de stapelpanelen vallen niet onder de vaste kop.
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

// Op /work wijst de dock niet naar /work zelf.
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
// Geen kruisje in de Home-kop; de uitnodiging "Een goed idee?" alleen op Home en /contact;
// de checklist-knop draagt de hele prompt in de link; Co-Creators.ai linkt naar de wachtlijst.
{
  const html = async (pad) => (await fetch(B + pad)).text()
  ok(!/hero-x/.test(await html('/')), 'Home: het kruisje staat nog in de kop')
  for (const [pad, verwacht] of [['/', true], ['/contact', true], ['/about', false], ['/work', false], ['/work/fuselabs', false], ['/ai', false], ['/privacy', false]]) {
    const heeft = /class="voet-kop/.test(await html(pad))
    ok(heeft === verwacht, `${pad}: uitnodiging in de voet ${heeft ? 'staat er' : 'ontbreekt'}, verwacht ${verwacht ? 'wel' : 'niet'}`)
  }
  ok(/href="https:\/\/www\.co-creators\.ai\/#wachtlijst"/.test(await html('/')) && /href="https:\/\/www\.co-creators\.ai\/#wachtlijst"/.test(await html('/work')), 'Co-Creators.ai: geen link naar de wachtlijst op Home en /work')
  const prompt = await (await fetch(B + '/website-checklist-prompt.txt')).text()
  const { page, sluit } = await pagina()
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-cik-trigger][data-cik-ready]')
  const knoppen = await page.$$eval('[data-cik-trigger]', (e) => e.map((a) => ({ modus: a.getAttribute('data-cik-modus'), href: a.href })))
  ok(knoppen.length >= 2 && knoppen.every((k) => k.modus === 'direct' && k.href.startsWith('https://chatgpt.com/?prompt=') && decodeURIComponent(k.href.split('?prompt=')[1]) === prompt),
    `checklist-knop: de link draagt niet de hele prompt (${knoppen.map((k) => `${k.modus} ${k.href.length}`).join(', ')})`)
  await sluit()
}
// Op een telefoon is de checklist op elke pagina te vinden (korte voet).
{
  const { page, sluit } = await pagina({ breedte: 390, hoogte: 844 })
  for (const pad of ['/about', '/work', '/work/fuselabs', '/privacy']) {
    await page.goto(B + pad, { waitUntil: 'networkidle' })
    ok(await page.locator('footer [data-cik-trigger]').isVisible(), `${pad} @390: geen checklist-link in de voet`)
  }
  await sluit()
}
// Audit 30-09 avond: brede schermen, lage vensters, telefoon liggend, zonder JS.
{
  const { page, sluit } = await pagina({ breedte: 1920, hoogte: 900 })
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  const kop = await page.$eval('.hero-kop', (k) => k.getBoundingClientRect().height / parseFloat(getComputedStyle(k).fontSize))
  ok(kop < 2.2, `1920: de Home-kop staat op meer dan twee regels (${kop.toFixed(2)} em hoog)`)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(2200)
  const x = await page.$$eval('.voet-kop [data-lr-line]', (ls) => ls.map((l) => { const r = document.createRange(); r.selectNodeContents(l); return [...r.getClientRects()].filter((q) => q.width > 1).map((q) => Math.round(q.left)) }))
  const starts = x.flatMap((l) => l.slice(0, 1))
  ok(new Set(starts).size === 1, `voetkop: regels beginnen op verschillende x (${starts.join(', ')})`)
  await sluit()
}
{
  const { page, sluit } = await pagina({ breedte: 1440, hoogte: 800 })
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.click('.stapel [data-sp-item]:nth-child(2) [data-sp-knop]'); await page.waitForTimeout(1500)
  const r = await page.$eval('.stapel [data-sp-item][data-sp-actief]', (it) => ({ k: it.querySelector('.stapel-tekst .knop').getBoundingClientRect().bottom, p: it.querySelector('[data-sp-paneel]').getBoundingClientRect().bottom }))
  ok(r.k <= r.p, `1440x800: "Bekijk de case" valt onder het paneel (${Math.round(r.k)} > ${Math.round(r.p)})`)
  await page.click('.stapel [data-sp-item]:nth-child(5) [data-sp-knop]'); await page.waitForTimeout(1800)
  const top = await page.$eval('.stapel [data-sp-item]:nth-child(1) [data-sp-knop]', (e) => e.getBoundingClientRect().top)
  ok(top >= 80, `klik op kop 05: kop 01 schuift onder de pil (top ${Math.round(top)})`)
  for (const pad of ['/privacy', '/bestaat-niet']) {
    await page.goto(B + pad, { waitUntil: 'networkidle' })
    ok((await page.$$('.pn__list a[aria-current]')).length === 0, `${pad}: een menu-item staat als huidige pagina`)
  }
  await sluit()
}
{
  const { page, sluit } = await pagina({ breedte: 844, hoogte: 390 })
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  const o = await page.evaluate(() => { const a = document.querySelector('.mh__pauze').getBoundingClientRect(), b = document.querySelector('.hero-rij .knop').getBoundingClientRect(); return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) })
  ok(o === 0, `844x390: de pauzeknop ligt over "Bekijk alle projecten" (${Math.round(o)} px²)`)
  await sluit()
}
{
  const { page, sluit } = await pagina({ javaScriptEnabled: false })
  await page.goto(B + '/', { waitUntil: 'load' })
  ok((await page.$eval('.mh__dia', (i) => getComputedStyle(i).opacity)) === '1', 'zonder JS: de herofoto is onzichtbaar')
  await page.goto(B + '/about', { waitUntil: 'load' })
  ok((await page.$$eval('.bekend-item', (e) => e.filter((x) => x.getBoundingClientRect().width > 0).length)) === 3, 'zonder JS: "Bekend van" staat dubbel')
  ok((await page.$$eval('a.vf__fallback', (a) => a.every((x) => (x.getAttribute('aria-label') || '').length > 3))), 'zonder JS: een videolink heeft geen naam')
  await sluit()
}
// Hertest r4: /ai-kop boven het verloop; dock-schijf op telefoon met donkere ringtekst.
{
  const { page, sluit } = await pagina({ breedte: 1440, hoogte: 900 })
  await page.goto(B + '/ai', { waitUntil: 'networkidle' })
  const boven = await page.evaluate(() => ['.ai-h1', '.ai-intro', '.ai-tweede'].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); const el = document.elementFromPoint(r.left + 20, r.top + r.height / 2); return !!el && !!el.closest(s) }))
  ok(boven.every(Boolean), `/ai: een laag ligt over de koptekst (${boven.join(', ')})`)
  await sluit()
}
{
  const { page, sluit } = await pagina({ breedte: 390, hoogte: 844 })
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, document.getElementById('doen').getBoundingClientRect().top + scrollY)); await page.mouse.wheel(0, 40); await page.waitForTimeout(1500)
  const k = await page.$eval('.sd', (d) => ({ tekst: getComputedStyle(d).color, grond: getComputedStyle(d).backgroundColor }))
  ok(k.tekst !== k.grond && /23, 17, 15/.test(k.tekst), `390: ringtekst van de dock onleesbaar (${k.tekst} op ${k.grond})`)
  await sluit()
}
uitslag('beta-reparaties', fouten, geslaagd)
