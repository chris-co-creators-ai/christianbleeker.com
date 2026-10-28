/**
 * Onderdelen-doorloop v3, maker B (beeld en effecten). Wordt aangeroepen vanuit doorloop-onderdelen.mjs,
 * per browser × breedte × minder beweging × systeemthema, op dezelfde pagina.
 *
 *  /ai      diepte-beeld: drie lagen, de kop ertussen, alle beelden geladen; met beweging schuift de voorgrond
 *           bij scrollen (en bij de muis op desktop), bij minder beweging staat alles stil (transform none).
 *           eyebrow-lijn: na inscrollen staat de zin er (opacity 1). parallax: de nummers 01–04 verschuiven met
 *           beweging, staan stil bij minder beweging.
 *  /about   eyebrow-lijn bij "Wie ik ben"; twee section-dividers in de grondkleur; gradient-flow beweegt alleen
 *           met beweging en is aria-hidden.
 *  /work    raster-intro: één h1 met de hele zin; na ≤ 4,5 s (of meteen bij minder beweging) het eindbeeld met
 *           alle woorden zichtbaar. magneet-beelden: alleen met muis en beweging; een muis naast een teamfoto
 *           trekt hem tot ≤ 14 px opzij.
 *  /contact hero-motion: kop heet "Contact" voor de schermlezer, letters en de rest zichtbaar na de intro;
 *           float-decor: kader in de hoofdkleur achter de foto; ghost-text: "€" aria-hidden, geen horizontale scroll.
 */
import { BASIS } from './browser.mjs'

const wacht = (page, ms) => page.waitForTimeout(ms)
const scrollNaar = async (page, sel, extra = 0) => {
  await page.evaluate(([s, e]) => { const el = document.querySelector(s); window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.4 + e), behavior: 'instant' }) }, [sel, extra])
}
const transform = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].map((el) => getComputedStyle(el).transform), sel)

export async function toetsV3b(page, { label, reduced, mobiel, fouten, regels }) {
  const beweging = !reduced

  // ── /ai ────────────────────────────────────────────────────────────────────────────────────────
  await page.goto(BASIS + '/ai', { waitUntil: 'networkidle' })
  await wacht(page, 600)
  const d0 = await page.evaluate(() => {
    const root = document.querySelector('.ai-diepte')
    const lagen = [...root.querySelectorAll(':scope > [data-diepte-laag]')]
    const imgs = [...root.querySelectorAll('img')]
    const h1 = document.querySelectorAll('h1')
    return {
      lagen: lagen.length,
      kopTussen: lagen[1]?.classList.contains('db-tekst') && !!lagen[1].querySelector('h1'),
      geladen: imgs.every((i) => i.complete && i.naturalWidth > 0),
      alt: imgs.map((i) => i.getAttribute('alt')),
      h1: h1.length,
      kop: document.querySelector('.ai-h1').textContent,
      actief: root.hasAttribute('data-db-actief'),
      laden: root.hasAttribute('data-db-laden'),
    }
  })
  if (!(d0.lagen === 3 && d0.kopTussen && d0.geladen && d0.alt[0] && d0.alt[1] === '' && d0.h1 === 1 && d0.kop === 'Technologie met een menselijk doel.' && !d0.laden)) fouten.push(`${label} diepte-beeld: ${JSON.stringify(d0)}`)
  if (!mobiel && beweging) { await page.mouse.move(200, 200); await wacht(page, 120); await page.mouse.move(1200, 600) }
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }))
  await wacht(page, 900)
  const d1 = await transform(page, '.ai-diepte > [data-diepte-laag]')
  const voorBeweegt = d1[2] !== 'none' && d1[2] !== 'matrix(1, 0, 0, 1, 0, 0)'
  if (beweging && !voorBeweegt) fouten.push(`${label} diepte-beeld beweegt niet: ${JSON.stringify(d1)}`)
  if (reduced && d1.some((t) => t !== 'none')) fouten.push(`${label} diepte-beeld bij minder beweging: ${JSON.stringify(d1)}`)

  await scrollNaar(page, '.ai-intro'); await wacht(page, 1600)
  const e0 = await page.evaluate(() => { const r = document.querySelector('.ai-intro'); return { zin: getComputedStyle(r.querySelector('.el__zin')).opacity, label: r.querySelector('.el__label span').textContent, in: r.classList.contains('is-in'), actief: r.hasAttribute('data-el-actief') } })
  if (e0.zin !== '1' || e0.label !== 'AI' || (beweging && !e0.in) || (reduced && e0.actief)) fouten.push(`${label} eyebrow-lijn /ai: ${JSON.stringify(e0)}`)

  await scrollNaar(page, '.ai-lijst', -200); await wacht(page, 300)
  const p0 = await transform(page, '.ai-lijst-diepte .ai-nr')
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'instant' })); await wacht(page, 400)
  const p1 = await transform(page, '.ai-lijst-diepte .ai-nr')
  const pVerschuift = p0.some((t, i) => t !== p1[i])
  if (p0.length !== 4) fouten.push(`${label} parallax: ${p0.length} nummers`)
  if (beweging && !pVerschuift) fouten.push(`${label} parallax beweegt niet: ${JSON.stringify([p0, p1])}`)
  if (reduced && [...p0, ...p1].some((t) => t !== 'none')) fouten.push(`${label} parallax bij minder beweging: ${JSON.stringify(p1)}`)
  regels.push(`${label} v3b /ai diepte ${d0.lagen} lagen, kop ertussen, voorgrond ${voorBeweegt ? 'beweegt' : 'stil'} · eyebrow ${e0.label} zin ${e0.zin} · parallax ${pVerschuift ? 'verschuift' : 'stil'}`)

  // ── /about ─────────────────────────────────────────────────────────────────────────────────────
  await page.goto(BASIS + '/about', { waitUntil: 'networkidle' })
  await scrollNaar(page, '.verhaal-eerste'); await wacht(page, 1600)
  const o0 = await page.evaluate(() => { const r = document.querySelector('.verhaal-eerste'); return { zin: getComputedStyle(r.querySelector('.el__zin')).opacity, label: r.querySelector('.el__label span').textContent, tekst: r.querySelector('.el__zin').textContent.slice(0, 20) } })
  if (o0.zin !== '1' || o0.label !== 'Wie ik ben' || !o0.tekst.startsWith('Hoi, ik ben Chris')) fouten.push(`${label} eyebrow-lijn /about: ${JSON.stringify(o0)}`)
  const o1 = await page.evaluate(() => {
    const grond = getComputedStyle(document.body).backgroundColor
    const randen = [...document.querySelectorAll('.logowand > .sdv')].map((r) => ({ pos: r.dataset.positie, kleur: getComputedStyle(r.querySelector('path')).fill, verborgen: r.querySelector('svg').getAttribute('aria-hidden') }))
    const gf = document.querySelector('.statement > .gf')
    const blob = gf.querySelector('.gf__blob')
    return { grond, randen, gfVerborgen: gf.getAttribute('aria-hidden'), animatie: getComputedStyle(blob).animationName }
  })
  if (!(o1.randen.length === 2 && o1.randen.every((r) => r.kleur === o1.grond && r.verborgen === 'true') && o1.randen.map((r) => r.pos).join() === 'boven,onder')) fouten.push(`${label} section-dividers: ${JSON.stringify(o1)}`)
  if (o1.gfVerborgen !== 'true' || (beweging && o1.animatie === 'none') || (reduced && o1.animatie !== 'none')) fouten.push(`${label} gradient-flow: ${JSON.stringify(o1)}`)
  regels.push(`${label} v3b /about eyebrow "${o0.label}" · randen ${o1.randen.map((r) => r.pos).join('+')} in ${o1.grond} · gradient-flow ${o1.animatie}`)

  // ── /work ──────────────────────────────────────────────────────────────────────────────────────
  await page.goto(BASIS + '/work', { waitUntil: 'networkidle' })
  const w0 = await page.evaluate(() => ({ actief: document.querySelector('.werk-raster').hasAttribute('data-ri-actief'), klaar: document.querySelector('.werk-raster').hasAttribute('data-ri-klaar') }))
  await wacht(page, reduced ? 200 : 4500)
  const w1 = await page.evaluate(() => {
    const r = document.querySelector('.werk-raster')
    const h1 = [...document.querySelectorAll('h1')]
    return { h1: h1.length, kop: h1[0]?.textContent.replace(/\s+/g, ' ').trim(), klaar: r.hasAttribute('data-ri-klaar'), woorden: [...r.querySelectorAll('.ri__woord')].map((w) => getComputedStyle(w).opacity), sub: getComputedStyle(r.querySelector('.werk-raster-sub')).opacity, breed: document.documentElement.scrollWidth <= document.documentElement.clientWidth }
  })
  if (!(w1.h1 === 1 && w1.kop === 'Elk merk heeft een eigen verhaal.' && w1.klaar && w1.woorden.every((o) => o === '1') && w1.sub === '1' && w1.breed)) fouten.push(`${label} raster-intro: ${JSON.stringify(w1)}`)
  if (reduced && w0.actief) fouten.push(`${label} raster-intro speelt bij minder beweging`)
  const m0 = await page.evaluate(() => ({ actief: document.querySelector('.werk-magneet').hasAttribute('data-magneet-actief'), n: document.querySelectorAll('.werk-magneet [data-magneet]').length }))
  let m1 = null
  if (!mobiel && beweging) {
    const foto = page.locator('.werk-magneet [data-magneet]').first()
    await foto.scrollIntoViewIfNeeded(); await wacht(page, 300)
    const b = await foto.boundingBox()
    await page.mouse.move(b.x + b.width / 2 + 90, b.y + b.height / 2, { steps: 4 }); await wacht(page, 700)
    m1 = await page.evaluate(() => getComputedStyle(document.querySelector('.werk-magneet [data-magneet]')).translate)
    const dx = parseFloat(m1)
    if (!(dx > 1 && dx <= 14.5)) fouten.push(`${label} magneet-beelden: translate ${m1}`)
    await page.mouse.move(5, 5)
  }
  if (m0.n !== 3 || m0.actief !== (!mobiel && beweging)) fouten.push(`${label} magneet-beelden actief ${m0.actief} (${m0.n} foto's)`)
  regels.push(`${label} v3b /work raster ${w0.actief ? 'speelt' : 'meteen eindbeeld'} → "${w1.kop}" · magneet ${m0.actief ? 'aan ' + m1 : 'uit'}`)

  // ── /contact ───────────────────────────────────────────────────────────────────────────────────
  await page.goto(BASIS + '/contact', { waitUntil: 'networkidle' })
  await wacht(page, 2000)
  const c0 = await page.evaluate(() => {
    const h1 = document.querySelector('.contact-h1')
    const letters = [...h1.querySelectorAll('[data-hero-ch]')]
    const fades = [...document.querySelectorAll('.contact-links [data-hero-fade]')].map((f) => getComputedStyle(f).opacity)
    const kader = getComputedStyle(document.querySelector('.contact-foto-houder'), '::before')
    const ghost = document.querySelector('.prijzen-ghost [data-ghost-text]')
    const hoofd = getComputedStyle(document.querySelector('.x')).color
    return {
      naam: h1.getAttribute('aria-label') || h1.textContent.replace('×', '').trim(),
      letters: letters.length, lettersZicht: letters.every((l) => getComputedStyle(l).opacity === '1'),
      fades, kaderKleur: kader.borderTopColor, hoofd, kaderInhoud: kader.content,
      ghost: ghost.textContent, ghostVerborgen: ghost.getAttribute('aria-hidden'),
      breed: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    }
  })
  if (c0.naam !== 'Contact' || (beweging && c0.letters !== 7) || (reduced && c0.letters !== 0) || !c0.lettersZicht || c0.fades.some((o) => o !== '1')) fouten.push(`${label} hero-motion: ${JSON.stringify(c0)}`)
  if (c0.kaderKleur !== c0.hoofd || c0.kaderInhoud === 'none') fouten.push(`${label} float-decor: ${JSON.stringify(c0)}`)
  if (c0.ghost !== '€' || c0.ghostVerborgen !== 'true' || !c0.breed) fouten.push(`${label} ghost-text: ${JSON.stringify(c0)}`)
  regels.push(`${label} v3b /contact kop "${c0.naam}" ${c0.letters} letters · kader ${c0.kaderKleur} · ghost ${c0.ghost}`)
}
