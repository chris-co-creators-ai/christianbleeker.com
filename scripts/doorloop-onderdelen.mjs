#!/usr/bin/env node
/**
 * Onderdelen-doorloop v2 (BROWSER=chromium|webkit|firefox, BASIS_URL). Opzet van demo-15, eigen toetsen.
 * Op 1440 en 390, met en zonder minder beweging, en met een systeemvoorkeur licht én donker:
 *  1. thema: de eerste paint heeft al het thema van de systeemvoorkeur (geen flits); de schakelaar
 *     (zon/maan, aria-pressed) wisselt data-thema, de grondkleur en localStorage; na herladen blijft de
 *     keuze staan, ook bij de eerste paint;
 *  2. /work-filter: Klanten verbergt de demo's, Demo's verbergt de klanten, Alles toont beide; ?toon=
 *     volgt; de echte klanten staan vóór de demo's;
 *  3. de demo-rij (drag-carousel + device-mockup): 20 demo's met label "Ontwerp-demo" en een link naar
 *     https://<slug>.portfolio.seveke.nl (nieuw tabblad); de pijl naar rechts schuift door en de
 *     statusregel meldt "Dia n van 20"; het laptopscherm is geladen;
 *  4. /work-raadsel: na één keer langs de pagina staat alles van reveal-on-scroll op opacity 1;
 *  5. Home (v2-a): punt-zoom-intro, film-grain, letter-rol, beeldexplosie, kinetic-type, story-word-light,
 *     review-wall en footer-opkomst doen wat ze beloven, en staan stil (maar leesbaar) bij minder beweging.
 */
import { laadChromium, LAUNCH, BASIS } from './browser.mjs'
const motor = await laadChromium()
const naam = process.env.BROWSER || 'chromium'
const fouten = [], regels = []
const LICHT = 'rgb(246, 239, 230)', DONKER = 'rgb(23, 17, 15)'

for (const schema of ['light', 'dark']) for (const reduced of [false, true]) for (const [w, h] of [[1440, 900], [390, 844]]) {
  const label = `${naam} ${w} ${reduced ? 'minder' : 'beweging'} systeem-${schema}`
  const b = await motor.launch(LAUNCH)
  const mobiel = w < 500
  const page = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mobiel, isMobile: mobiel && naam !== 'firefox', reducedMotion: reduced ? 'reduce' : 'no-preference', colorScheme: schema })
  // Het thema op het moment van de eerste paint: rAF loopt vóór het eerste beeld.
  await page.addInitScript(() => { requestAnimationFrame(() => { window.__eerstePaint = { thema: document.documentElement.dataset.thema, grond: getComputedStyle(document.body || document.documentElement).backgroundColor } }) })
  const cons = []
  page.on('console', (m) => { if (m.type() === 'error') cons.push(m.text()) })
  page.on('pageerror', (e) => cons.push('pageerror ' + e.message))

  // 1. Thema
  await page.goto(BASIS + '/', { waitUntil: 'networkidle' })
  const verwacht = schema === 'light' ? 'licht' : 'donker'
  const t0 = await page.evaluate(() => ({ eerste: window.__eerstePaint, nu: document.documentElement.dataset.thema, grond: getComputedStyle(document.body).backgroundColor }))
  if (t0.eerste?.thema !== verwacht || t0.nu !== verwacht) fouten.push(`${label} thema: systeem ${schema} gaf ${JSON.stringify(t0)}`)
  if (t0.grond !== (verwacht === 'licht' ? LICHT : DONKER)) fouten.push(`${label} thema: grond ${t0.grond}`)
  const knop = page.locator(mobiel ? '.thema-knop--mobiel' : '.kop-desktop .thema-knop')
  const p0 = await knop.getAttribute('aria-pressed')
  if (p0 !== String(verwacht === 'licht')) fouten.push(`${label} thema: aria-pressed ${p0} bij ${verwacht}`)
  if (!(await knop.getAttribute('aria-label'))) fouten.push(`${label} thema: knop zonder aria-label`)
  await knop.click(); await page.waitForTimeout(300)
  const ander = verwacht === 'licht' ? 'donker' : 'licht'
  const t1 = await page.evaluate(() => ({ nu: document.documentElement.dataset.thema, opslag: localStorage.getItem('thema'), grond: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]')?.content }))
  const p1 = await knop.getAttribute('aria-pressed')
  if (t1.nu !== ander || t1.opslag !== ander || p1 !== String(ander === 'licht') || t1.grond !== (ander === 'licht' ? LICHT : DONKER)) fouten.push(`${label} schakelaar: ${JSON.stringify({ ...t1, p1 })}`)
  await page.reload({ waitUntil: 'networkidle' })
  const t2 = await page.evaluate(() => ({ eerste: window.__eerstePaint, nu: document.documentElement.dataset.thema }))
  if (t2.eerste?.thema !== ander || t2.nu !== ander) fouten.push(`${label} onthouden: ${JSON.stringify(t2)}`)
  regels.push(`${label} thema eerste paint ${t0.eerste?.thema} (${t0.eerste?.grond}) → klik ${t1.nu} (opslag ${t1.opslag}, aria-pressed ${p0}→${p1}, balk ${t1.meta}) → herladen eerste paint ${t2.eerste?.thema}`)
  await page.evaluate(() => localStorage.removeItem('thema'))

  // 2. Werkfilter
  await page.goto(BASIS + '/work', { waitUntil: 'networkidle' })
  const zicht = () => page.evaluate(() => ({
    klanten: getComputedStyle(document.querySelector('.klant-groep')).display !== 'none',
    demos: getComputedStyle(document.querySelector('.demo-sectie')).display !== 'none',
    toon: new URLSearchParams(location.search).get('toon'),
    volgorde: document.querySelector('.klant-groep').compareDocumentPosition(document.querySelector('.demo-sectie')) & Node.DOCUMENT_POSITION_FOLLOWING ? 'klanten-eerst' : 'demos-eerst',
  }))
  const f0 = await zicht()
  const filterKnop = (t) => page.locator('.werk-filter__knop').filter({ hasText: t })
  await filterKnop('Klanten').click(); const f1 = await zicht()
  await filterKnop("Demo's").click(); const f2 = await zicht()
  const druk = await filterKnop("Demo's").getAttribute('aria-pressed')
  await filterKnop('Alles').click(); const f3 = await zicht()
  if (!(f0.klanten && f0.demos && f0.volgorde === 'klanten-eerst')) fouten.push(`${label} filter begin: ${JSON.stringify(f0)}`)
  if (!(f1.klanten && !f1.demos && f1.toon === 'klanten')) fouten.push(`${label} filter Klanten: ${JSON.stringify(f1)}`)
  if (!(!f2.klanten && f2.demos && f2.toon === 'demos' && druk === 'true')) fouten.push(`${label} filter Demo's: ${JSON.stringify(f2)} pressed ${druk}`)
  if (!(f3.klanten && f3.demos && f3.toon === null)) fouten.push(`${label} filter Alles: ${JSON.stringify(f3)}`)
  regels.push(`${label} filter alles ${+f0.klanten}${+f0.demos} · klanten ${+f1.klanten}${+f1.demos} · demo's ${+f2.klanten}${+f2.demos} (?toon=${f2.toon}) · alles ${+f3.klanten}${+f3.demos} · ${f0.volgorde}`)

  // 3. De demo-rij
  const rij = page.locator('.demo-rij')
  await rij.scrollIntoViewIfNeeded(); await page.waitForTimeout(600)
  const d0 = await page.evaluate(() => {
    const kaarten = [...document.querySelectorAll('.demo-kaart')]
    const links = kaarten.map((k) => k.querySelector('.demo-link'))
    const img = document.querySelector('.demo-laptop img')
    return {
      n: kaarten.length,
      label: kaarten.filter((k) => k.querySelector('.demo-label')?.textContent === 'Ontwerp-demo').length,
      hrefOk: links.filter((a) => /^https:\/\/[a-z]+\.portfolio\.seveke\.nl$/.test(a.getAttribute('href')) && a.target === '_blank' && /noopener/.test(a.rel)).length,
      beeld: img.complete && img.naturalWidth > 0,
      duur: document.querySelector('.demo-laptop [data-device-screen]').style.getPropertyValue('--dm-duration'),
      sl: Math.round(document.querySelector('.demo-rij .carousel__viewport').scrollLeft),
    }
  })
  await page.locator('.demo-rij .carousel__arrow--next').click()
  await page.waitForTimeout(reduced ? 300 : 900)
  const d1 = await page.evaluate(() => ({ sl: Math.round(document.querySelector('.demo-rij .carousel__viewport').scrollLeft), status: document.querySelector('.demo-rij [data-carousel-status]').textContent }))
  if (d0.n !== 20 || d0.label !== 20 || d0.hrefOk !== 20) fouten.push(`${label} demo's: ${JSON.stringify(d0)}`)
  if (!d0.beeld || !d0.duur) fouten.push(`${label} device-mockup: beeld ${d0.beeld} duur ${d0.duur}`)
  if (!(d1.sl > d0.sl) || !/Dia 2 van 20/.test(d1.status)) fouten.push(`${label} carousel: ${d0.sl} → ${JSON.stringify(d1)}`)
  const breed = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  if (breed[0] > breed[1]) fouten.push(`${label} /work: sw ${breed[0]} > cw ${breed[1]}`)
  regels.push(`${label} demo's ${d0.n} · label ${d0.label} · links ${d0.hrefOk} · beeld ${d0.beeld} (${d0.duur}) · pijl ${d0.sl}→${d1.sl} "${d1.status}" · sw ${breed.join('/')}`)

  // 4. Het /work-raadsel: alles wat bij het scrollen binnenkomt, staat er na één keer scrollen.
  const hoog = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= hoog; y += 500) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await page.waitForTimeout(60) }
  await page.waitForTimeout(900)
  const rv = await page.evaluate(() => { const els = [...document.querySelectorAll('[data-reveal]')]; return { n: els.length, onzichtbaar: els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length } })
  if (rv.onzichtbaar) fouten.push(`${label} reveal: ${rv.onzichtbaar} van ${rv.n} nog onzichtbaar na scrollen`)
  regels.push(`${label} reveal na scrollen: ${rv.n - rv.onzichtbaar}/${rv.n} zichtbaar`)


  // 5. Home (v2-a): de acht onderdelen van maker A. Eigen browser (één pagina per browser in de sandbox): een verse sessie, dus de intro speelt.
  {
    const b2 = await motor.launch(LAUNCH)
    const hp = await b2.newPage({ viewport: { width: w, height: h }, hasTouch: mobiel, isMobile: mobiel && naam !== 'firefox', reducedMotion: reduced ? 'reduce' : 'no-preference', colorScheme: schema })
    hp.on('console', (m) => { if (m.type() === 'error') cons.push(m.text()) })
    hp.on('pageerror', (e) => cons.push('pageerror ' + e.message))
    const fout = (wat, info) => fouten.push(`${label} home ${wat}: ${typeof info === 'string' ? info : JSON.stringify(info)}`)
    await hp.goto(BASIS + '/', { waitUntil: 'domcontentloaded' })
    await hp.waitForTimeout(250)
    const zicht = () => hp.evaluate(() => { const e = document.querySelector('[data-punt-zoom-intro]'); return !!e && !e.hidden && getComputedStyle(e).display !== 'none' })
    const intro0 = await zicht()
    await hp.waitForLoadState('networkidle'); await hp.waitForTimeout(2600)
    const intro1 = await zicht()
    // punt-zoom-intro: zichtbaar bij binnenkomst en binnen 2,6 s weg; bij minder beweging nooit.
    if (reduced ? intro0 || intro1 : !intro0 || intro1) fout('punt-zoom-intro', { intro0, intro1 })
    // tweede bezoek in dezelfde sessie: geen intro
    await hp.reload({ waitUntil: 'domcontentloaded' }); await hp.waitForTimeout(150)
    const intro2 = await zicht()
    if (intro2) fout('punt-zoom-intro', 'tweede bezoek toont de intro nog')
    await hp.waitForLoadState('networkidle'); await hp.waitForTimeout(600)

    // film-grain: laag in de hero; beweegt, of staat stil bij minder beweging.
    const fg = async () => hp.evaluate(() => { const l = document.querySelector('.hero > .fg-laag'); return l ? { t: l.style.transform, pos: getComputedStyle(l).position, o: Number(getComputedStyle(l).opacity) } : null })
    const g0 = await fg(); await hp.waitForTimeout(400); const g1 = await fg()
    if (!g0 || g0.pos !== 'absolute' || !(g0.o > 0) || (reduced ? g0.t !== g1.t : g0.t === g1.t)) fout('film-grain', { g0, g1 })

    // letter-rol: de knoptekst in letters (de naam blijft heel); bij minder beweging niet geknipt.
    const lr = await hp.evaluate(() => { const k = document.querySelector('.hero-rij .knop'); return { letters: k.querySelectorAll('.lr-letter').length, actief: !!k.querySelector('[data-letter-rol][data-lr-actief]'), naam: k.textContent.replace(/\s+/g, ' ').trim() } })
    if (reduced ? lr.letters || lr.actief : lr.letters < 10 || !lr.actief) fout('letter-rol', lr)
    if (!/Bekijk alle projecten/.test(lr.naam)) fout('letter-rol naam', lr)
    if (!reduced && !mobiel) {
      await hp.hover('.hero-rij .knop'); await hp.waitForTimeout(700)
      const ty = await hp.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.hero-rij .knop .lr-letter:last-of-type')).transform).m42)
      if (!(ty < -5)) fout('letter-rol hover', `laatste letter ty ${ty}`)
      await hp.mouse.move(2, 2)
    }

    // beeldexplosie: aan het eind van het spoor staat de reel groot in beeld; stil = vaste compositie.
    const bx = await hp.evaluate(() => { const r = document.querySelector('.werk-explosie'); return { top: r.getBoundingClientRect().top + scrollY, hoog: r.offsetHeight, actief: r.hasAttribute('data-bx-actief'), stil: r.hasAttribute('data-bx-stil'), beelden: r.querySelectorAll('[data-bx-beeld]').length, h2: r.querySelector('h2')?.id } })
    await hp.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), bx.top + (bx.hoog - h) * 0.97); await hp.waitForTimeout(700)
    const kaart = await hp.evaluate(() => { const k = document.querySelector('.werk-explosie .bx__kaart').getBoundingClientRect(); return { b: Math.round(k.width), zicht: k.top < innerHeight && k.bottom > 0, aan: document.querySelector('.werk-explosie').hasAttribute('data-bx-kaart-aan'), knop: !!document.querySelector('.werk-explosie [data-bx-pauze]') } })
    if (!bx.actief || bx.beelden !== 11 || bx.h2 !== 'werk-explosie-kop' || bx.stil !== reduced) fout('beeldexplosie', bx)
    if (!(kaart.b > w * 0.5) || !kaart.knop || (!reduced && (!kaart.aan || !kaart.zicht))) fout('beeldexplosie kaart', kaart)

    // kinetic-type: in het midden vetter dan bovenin; bij minder beweging de gewone kop (600, vol).
    const kt = async (frac) => {
      await hp.evaluate((f) => { const e = document.querySelector('.doen [data-kinetic-type]'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight * f, behavior: 'instant' }) }, frac)
      await hp.waitForTimeout(450)
      return hp.evaluate(() => { const e = document.querySelector('.doen [data-kinetic-type]'); const cs = getComputedStyle(e); return { wght: Number((cs.fontVariationSettings.match(/"wght" ([\d.]+)/) || [])[1]), kleur: cs.color } })
    }
    const ktMidden = await kt(0.5), ktBoven = await kt(0.02)
    if (reduced ? ktMidden.wght !== 600 || /0\.\d+\)$/.test(ktMidden.kleur) : !(ktMidden.wght > ktBoven.wght + 150)) fout('kinetic-type', { ktMidden, ktBoven })

    // story-word-light: woorden lichten op met de scroll; bij minder beweging meteen alles.
    const swl = async (f) => {
      await hp.evaluate((ff) => { const s = document.querySelector('.over-swl'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY + (s.offsetHeight - innerHeight) * ff, behavior: 'instant' }) }, f)
      await hp.waitForTimeout(500)
      return hp.evaluate(() => { const ws = [...document.querySelectorAll('.over-swl [data-story-word]')]; return { n: ws.length, lit: ws.filter((x) => x.classList.contains('is-lit')).length, sticky: getComputedStyle(document.querySelector('.over-swl .swl__sticky')).position } })
    }
    const s0 = await swl(0), s1 = await swl(0.95)
    if (s0.n < 30 || s1.lit !== s1.n || (!reduced && !(s0.lit < s0.n * 0.6))) fout('story-word-light', { s0, s1 })

    // review-wall: zes voorbeeldreviews, elk gelabeld, zonder score-badge, datum of bron.
    const rw = await hp.evaluate(() => { const r = document.querySelector('.reviews-wand'); const k = [...r.querySelectorAll('.rw__kaart')]; return { hidden: r.hidden, n: k.length, label: k.filter((x) => getComputedStyle(x.querySelector('.rw__kop'), '::after').content === '"Voorbeeld"').length, score: r.querySelectorAll('.rw__score, [data-rw-score]').length, tijd: r.querySelectorAll('time, .rw__bron').length, toelichting: /verzonnen/.test(document.querySelector('#reviews .sectie-tekst').textContent) } })
    if (rw.hidden || rw.n !== 6 || rw.label !== 6 || rw.score !== 0 || rw.tijd || !rw.toelichting) fout('review-wall', rw)

    // footer-opkomst: de inhoud zakt bij het inscrollen naar 0; bij minder beweging staat hij meteen.
    const fo = async (f) => {
      await hp.evaluate((ff) => { const v = document.querySelector('footer[data-opkomst]'); window.scrollTo({ top: v.getBoundingClientRect().top + scrollY - innerHeight + v.offsetHeight * ff, behavior: 'instant' }) }, f)
      await hp.waitForTimeout(400)
      return hp.evaluate(() => { const v = document.querySelector('footer[data-opkomst]'); const i = v.querySelector('[data-opkomst-inhoud]'); return Math.round(i.getBoundingClientRect().top - v.getBoundingClientRect().top) })
    }
    const f0 = await fo(0.15), f1 = await fo(1.2)
    if (reduced ? Math.abs(f0 - f1) > 1 : !(f0 < f1 - 20)) fout('footer-opkomst', { f0, f1 })

    const sw = await hp.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
    if (sw[0] > sw[1]) fout('breedte', sw)
    regels.push(`${label} home intro ${+intro0}${+intro1}${+intro2} · korrel ${g0?.t !== g1?.t ? 'beweegt' : 'stil'} · rol ${lr.letters} · explosie ${bx.beelden} kaart ${kaart.b}px aan ${+kaart.aan} stil ${+bx.stil} · kinetisch ${ktBoven.wght}→${ktMidden.wght} · verhaal ${s0.lit}/${s0.n}→${s1.lit}/${s1.n} · reviews ${rw.n}/${rw.label} · voet ${f0}→${f1}`)
    await b2.close()
  }
  if (cons.length) fouten.push(`${label}: ${cons.length} consolefout(en): ${cons.slice(0, 3).join(' | ')}`)
  regels.push(`${label} console ${cons.length}`)
  await b.close()
}
console.log(regels.join('\n'))
if (fouten.length) { console.error(`\nONDERDELEN ROOD (${fouten.length}):\n- ${fouten.join('\n- ')}`); process.exit(1) }
console.log(`\nONDERDELEN GROEN (${naam}): thema-schakelaar zonder flits, werkfilter, 20 ontwerp-demo's, reveal na scrollen, acht Home-onderdelen`)
