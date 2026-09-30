#!/usr/bin/env node
/**
 * De onderdelen staan werkend op de pagina — niet alleen in de code (bouwregel "minimaal 40 punten").
 * Per onderdeel: de route waar het staat, een handeling als bezoeker (scrollen, klikken, muis) en het
 * bewijs dat het onderdeel reageert. Telt de punten van wat werkt; faalt onder 40 punten of met
 * minder dan twee onderdelen van 4+. Onderdelen van 1 punt tellen niet mee.
 *
 *   BASIS=http://localhost:PORT node qa/onderdelen.mjs
 */
import { pagina, uitslag, scrollDoor, BROWSER } from './lib.mjs'

const B = process.env.BASIS
const fouten = []
let punten = 0
let vierPlus = 0
const telling = []

/** [naam, punten, route, breedte, toets(page) → true/string] */
const ONDERDELEN = [
  ['heroes/media-hero', 3, '/', 1440, async (p) => (await p.getAttribute('.mh', 'data-mh-status')) === 'speelt'],
  ['typography/rotating-headline', 3, '/', 1440, async (p) => {
    const eerst = await p.textContent('.hero-wissel [data-rh-state="active"]')
    await p.waitForTimeout(3200)
    const later = await p.textContent('.hero-wissel [data-rh-state="active"]')
    return (await p.getAttribute('.hero-wissel-woord', 'data-rh-ready')) !== null && eerst !== later || `woord bleef "${eerst}"`
  }],
  ['stats/count-up', 2, '/', 1440, async (p) => (await p.$$eval('.tel .cu__waarde', (e) => e.map((x) => x.textContent))).join(' ') === '15 9 1'],
  ['scroll/stapelpanelen', 3, '/', 1440, async (p) => {
    await p.locator('#werk').scrollIntoViewIfNeeded()
    const voor = await p.$$eval('[data-sp-actief]', (e) => e.length)
    await p.mouse.wheel(0, 1600); await p.waitForTimeout(700)
    const actief = await p.$eval('[data-stapelpanelen]', (r) => [...r.querySelectorAll('[data-sp-item]')].findIndex((i) => i.hasAttribute('data-sp-actief')))
    return (await p.getAttribute('[data-stapelpanelen]', 'data-sp-modus')) === 'pin' && voor === 1 && actief > 0 || `modus/actief ${actief}`
  }],
  ['media/lottie-icon', 3, '/', 1440, async (p) => {
    await p.locator('#doen').scrollIntoViewIfNeeded(); await p.waitForTimeout(1500)
    return (await p.$$eval('[data-lottie-icon][data-lottie-active]', (e) => e.length)) === 4
  }],
  ['typography/handwritten-accent', 2, '/work', 1440, async (p) => {
    await p.locator('[data-handwritten-accent]').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(1200)
    return (await p.$$eval('[data-handwritten-accent][data-hwa-ready]', (e) => e.length)) >= 1
  }],
  ['layouts/bento-grid', 3, '/work', 1440, async (p) => (await p.$$eval('.bento .tegel[data-tegel]', (e) => e.length)) === 9],
  ['effects/custom-cursor', 3, '/work', 1440, async (p) => {
    const t = p.locator('.tegel__link').first(); await t.scrollIntoViewIfNeeded()
    const box = await t.boundingBox(); await p.mouse.move(box.x + 40, box.y + 40); await p.mouse.move(box.x + 80, box.y + 80); await p.waitForTimeout(400)
    return (await p.$$eval('.vf-cursor', (e) => e.length)) > 0 && (await p.textContent('.vf-cursor__label'))?.includes('Bekijk') || 'geen cursor of label'
  }],
  ['cards/hover-set', 2, '/', 1440, async (p) => {
    const k = p.locator('.hover-card[data-hover="lift"]').first(); await k.scrollIntoViewIfNeeded()
    const voor = await k.evaluate((e) => getComputedStyle(e).transform)
    await k.hover(); await p.waitForTimeout(400)
    const na = await k.evaluate((e) => getComputedStyle(e).transform)
    return voor !== na || `transform bleef ${na}`
  }],
  ['effects/page-transitions', 3, '/work', 1440, async (p) => {
    const l = p.locator('.tegel').first(); await l.scrollIntoViewIfNeeded()
    const actief = await p.evaluate(() => document.documentElement.classList.contains('pt-is-in') || !!document.querySelector('.pt-overlay') || 'startViewTransition' in document)
    await l.click(); await p.waitForURL(/\/work\/.+/, { timeout: 5000 })
    return actief || 'geen overgang actief'
  }],
  ['scroll/reislijn', 4, '/work/fuselabs', 1440, async (p) => {
    await scrollDoor(p, 500, 80)
    const route = await p.getAttribute('[data-reislijn]', 'data-reislijn-route')
    return (await p.$$eval('.rl-punt', (e) => e.length)) >= 4 && (await p.$$eval('.rl-vol', (e) => e.length)) >= 1 && ['css', 'terugval'].includes(route) || `route ${route}, stippen ontbreken`
  }],
  ['typography/marker-highlight', 1, '/work/fuselabs', 1440, async (p) => { await scrollDoor(p, 500, 80); return (await p.$$eval('[data-marker].is-in, [data-mh-active] [data-marker]', (e) => e.length)) >= 1 }],
  ['typography/beeld-letters', 4, '/about', 1440, async (p) => (await p.$$eval('[data-beeld-letters] .bl__vul, [data-beeld-letters] [data-bl-woord]', (e) => e.length)) >= 1],
  ['scroll/marquee', 3, '/about', 1440, async (p) => (await p.getAttribute('.bekend-band', 'data-marquee-ready')) !== null],
  ['effects/krachtveld-logowand', 4, '/about', 1440, async (p) => {
    await p.locator('[data-krachtveld]').scrollIntoViewIfNeeded(); await p.waitForTimeout(1500)
    return (await p.$$eval('[data-krachtveld] .kv__logos img', (e) => e.length)) === 9 && (await p.getAttribute('[data-krachtveld]', 'data-kv-in')) !== null || 'niet ingetekend'
  }],
  ['media/flip-lightbox', 4, '/about', 1440, async (p) => {
    await p.locator('[data-lightbox]').first().click(); await p.waitForTimeout(700)
    const open = await p.$$eval('.flb-dialog', (e) => e.some((d) => d.open || d.hasAttribute('open')))
    await p.keyboard.press('Escape'); await p.waitForTimeout(500)
    return open || 'lightbox ging niet open'
  }],
  ['media/video-facade', 1, '/about', 1440, async (p) => (await p.$$eval('.vf__play', (e) => e.length)) === 2],
  ['navigation/pill-nav', 3, '/', 1440, async (p) => (await p.getAttribute('.pn', 'data-pn-position')) === 'top' && (await p.locator('.pn').boundingBox()).y < 40],
  ['navigation/image-menu', 4, '/', 390, async (p) => {
    await p.click('.im__button'); await p.waitForTimeout(400)
    const open = (await p.getAttribute('.im', 'data-im-open')) !== null
    const links = await p.$$eval('.im__list a', (e) => e.length)
    return open && links === 5 || `open ${open}, ${links} links`
  }],
  ['tools/chatgpt-intake-knop', 2, '/', 1440, async (p) => (await p.$$eval('[data-cik-trigger][data-cik-ready]', (e) => e.length)) >= 1],
  ['conversion/sectie-dock', 3, '/', 1440, async (p) => {
    await p.locator('#werk').scrollIntoViewIfNeeded(); await p.waitForTimeout(900)
    const tekst = await p.evaluate(() => document.querySelector('.sd')?.getAttribute('aria-label') || document.querySelector('.sd')?.textContent)
    return /projecten/i.test(tekst || '') || `dock zegt "${tekst}"`
  }],
  ['typography/letter-reveal', 3, '/', 1440, async (p) => (await p.$$eval('.voet-kop .lr-ch', (e) => e.length)) > 10],
  ['scroll/reveal-on-scroll', 2, '/', 1440, async (p) => { await scrollDoor(p, 500, 80); return (await p.$$eval('[data-reveal].is-in', (e) => e.length)) >= 5 }],
  ['effects/tab-title-lokker', 2, '/', 1440, async (p) => {
    const titel = await p.title()
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
    await p.waitForTimeout(200)
    return (await p.title()) !== titel || 'titel bleef gelijk'
  }],
]

for (const [naam, pt, route, breedte, toets] of ONDERDELEN) {
  const { page, fouten: pf, sluit } = await pagina({ breedte, hoogte: breedte < 600 ? 844 : 900 })
  let uit
  try {
    await page.goto(B + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    uit = await toets(page)
  } catch (e) { uit = e.message.split('\n')[0] }
  const echteFouten = pf.filter((f) => !/Failed to load resource/.test(f))
  const goed = uit === true && echteFouten.length === 0
  telling.push(`${goed ? '✓' : '✗'} ${String(pt).padStart(2)} p  ${naam.padEnd(32)} ${route}`)
  if (goed) { if (pt > 1) punten += pt; if (pt >= 4) vierPlus++ }
  else fouten.push(`${naam} op ${route}: ${uit === true ? echteFouten.join(' | ') : uit}`)
  await sluit()
}
console.log(telling.join('\n'))
console.log(`\nwerkend op de pagina: ${punten} punten, ${vierPlus} onderdelen van 4+ (browser: ${BROWSER})`)
if (punten < 40) fouten.push(`${punten} punten < 40`)
if (vierPlus < 2) fouten.push(`${vierPlus} onderdelen van 4+ < 2`)
uitslag('onderdelen', fouten, ONDERDELEN.length - fouten.length)
