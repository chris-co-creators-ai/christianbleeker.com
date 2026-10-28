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
 *  6. /about: tijdlijn vult tot 4/4, schreef-accent in Instrument Serif 400, de zin vult elke regel uit, hotspot
 *     opent binnen het beeld en sluit met Escape;
 *  7. /ai: voor-na-schuif Home→End (stap 3 van 3), kaartenrij (6 kaarten; pin alleen met beweging), "onzichtbaar."
 *     onthuld, AI-scan met 7× Ja geeft "8 van 8" en sluit met Escape.
 *  8. /work-beeldwand (eindeloos-raster): lus alleen met beweging, 12 cases + 12 demo's, lijst van 33, uitweg zet de focus;
 *  9. casepagina: kader (live-demo-kader) laadt pas na een klik de echte site (nagebootst), stapel (kaartenstapel-zij)
 *     pint op 1440 en is een snap-rij op 390 / bij minder beweging; human-margin (laat zich niet inbedden) zonder laadknop;
 * 10. /contact: badge = volgende maand, ?scan= vult het bericht als platte tekst, ?dienst=&pakket= kiest voor, advies →
 *     tabblad bij de prijzen, prijs-CTA met parameters, agenda zonder verzoek naar cal.com vóór de klik.
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
  // 6. Over (maker B): sticky-timeline, hotspots, justify-fill, schreef-accent.
  const langs = async (sel) => {
    const [top, h] = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [scrollY + r.top, r.height] }, sel)
    for (let y = top - 900; y <= top + h; y += 120) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await page.waitForTimeout(25) }
    await page.waitForTimeout(500)
  }
  await page.goto(BASIS + '/about', { waitUntil: 'networkidle' })
  await langs('.reis')
  const o1 = await page.evaluate(() => {
    const root = document.querySelector('.reis-lijn')
    const p = Number(getComputedStyle(root).getPropertyValue('--stl-progress'))
    const stappen = root.querySelectorAll('[data-sticky-timeline-step]')
    const aan = root.querySelectorAll('[data-sticky-timeline-step].is-active').length
    const em = document.querySelector('.reis-kop h2 em')
    return { klaar: root.hasAttribute('data-sticky-timeline-ready'), p: Math.round(p * 100) / 100, stappen: stappen.length, aan, ol: !!root.querySelector('ol[data-sticky-timeline] > li'), schreef: getComputedStyle(em).fontFamily.includes('Instrument Serif'), schreefGewicht: getComputedStyle(em).fontWeight }
  })
  if (!(o1.klaar && o1.p > 0.9 && o1.stappen === 4 && o1.aan === 4 && o1.ol)) fouten.push(`${label} sticky-timeline: ${JSON.stringify(o1)}`)
  if (!(o1.schreef && o1.schreefGewicht === '400')) fouten.push(`${label} schreef-accent: ${JSON.stringify(o1)}`)
  await langs('.statement')
  const o2 = await page.evaluate(() => {
    const el = document.querySelector('.statement-tekst')
    const regels = [...el.querySelectorAll('.jf__line')].map((l) => { const ws = [...l.querySelectorAll('.jf__word')]; const lb = l.getBoundingClientRect(); const eind = ws.length ? ws[ws.length - 1].getBoundingClientRect().right : 0; return { n: ws.length, gat: Math.round(lb.right - eind) } })
    return { klaar: el.hasAttribute('data-jf-ready'), tekst: el.innerText.replace(/\s+/g, ' ').trim(), regels }
  })
  const volRegels = o2.regels.filter((r) => r.n > 1)
  if (!(o2.klaar && o2.tekst === 'Een goede website begint bij de mensen erachter.' && volRegels.length && volRegels.every((r) => Math.abs(r.gat) <= 2))) fouten.push(`${label} justify-fill: ${JSON.stringify(o2)}`)
  const punt = page.locator('.over-hotspots .hotspots__point').first()
  await punt.scrollIntoViewIfNeeded(); await punt.click(); await page.waitForTimeout(200)
  const o3 = await page.evaluate(() => {
    const b = document.querySelector('.over-hotspots .hotspots__point'); const pan = document.getElementById(b.getAttribute('aria-controls'))
    const m = document.querySelector('.over-hotspots .hotspots__media').getBoundingClientRect(); const r = pan.getBoundingClientRect()
    return { open: b.getAttribute('aria-expanded'), zichtbaar: !pan.hidden, binnen: r.left >= m.left - 1 && r.right <= m.right + 1 && r.top >= m.top - 1 && r.bottom <= m.bottom + 1, n: document.querySelectorAll('.over-hotspots .hotspots__point').length }
  })
  await page.keyboard.press('Escape'); await page.waitForTimeout(150)
  const o3b = await page.evaluate(() => ({ dicht: document.querySelector('.over-hotspots .hotspots__point').getAttribute('aria-expanded'), focus: document.activeElement?.classList.contains('hotspots__point') }))
  if (!(o3.open === 'true' && o3.zichtbaar && o3.binnen && o3.n === 3 && o3b.dicht === 'false')) fouten.push(`${label} hotspots: ${JSON.stringify({ ...o3, ...o3b })}`)
  regels.push(`${label} /about tijdlijn ${o1.aan}/${o1.stappen} aan (vulling ${o1.p}) · schreef ${o1.schreef} · justify ${o2.regels.map((r) => r.n + 'w/' + r.gat + 'px').join(' ')} · hotspots ${o3.n} open ${o3.open} binnen ${o3.binnen} → esc ${o3b.dicht}`)

  // 7. AI (maker B): voor-na-verhaal, kaartenrij-lottie, password-reveal, impact-scan.
  await page.goto(BASIS + '/ai', { waitUntil: 'networkidle' })
  await langs('.ai-vnv')
  const schuif = page.locator('.ai-vnv [role="slider"]')
  await schuif.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(400)
  const a0 = await page.evaluate(() => document.querySelector('.ai-vnv').getAttribute('data-vnv-actief'))
  await page.keyboard.press('End'); await page.waitForTimeout(reduced ? 300 : 900)
  const a1 = await page.evaluate(() => { const r = document.querySelector('.ai-vnv'); const s = r.querySelector('[role="slider"]'); const img = r.querySelector('[data-vnv-stap] img'); return { klaar: r.hasAttribute('data-vnv-klaar'), actief: r.getAttribute('data-vnv-actief'), nu: s.getAttribute('aria-valuenow'), tekst: s.getAttribute('aria-valuetext'), stappen: r.querySelectorAll('[data-vnv-stap]').length, beeld: img.complete && img.naturalWidth > 0 } })
  if (!(a1.klaar && a0 === '0' && a1.actief === '2' && a1.nu === '100' && a1.stappen === 3 && a1.beeld)) fouten.push(`${label} voor-na-verhaal: begin ${a0} ${JSON.stringify(a1)}`)
  await langs('.ai-vragen')
  const a2 = await page.evaluate(() => { const r = document.querySelector('.ai-vragen'); return { aan: r.hasAttribute('data-kaartenrij-aan'), kaarten: r.querySelectorAll('[data-kaartenrij-kaart]').length, speelt: r.querySelectorAll('[data-kaartenrij-speelt]').length, lotties: r.querySelectorAll('[data-kaartenrij-klaar]').length, h3: r.querySelectorAll('ol > li h3').length } })
  if (!(a2.kaarten === 6 && a2.h3 === 6 && (reduced ? !a2.aan : a2.aan && a2.lotties > 0))) fouten.push(`${label} kaartenrij-lottie: ${JSON.stringify(a2)}`)
  await langs('.ai-scan')
  await page.evaluate(() => window.scrollBy(0, 400)); await page.waitForTimeout(400)
  const a3 = await page.evaluate(() => { const r = document.querySelector('.ai-scan-woord'); return { klaar: r.hasAttribute('data-pr-ready'), masker: r.querySelector('.pr__mask')?.textContent, echt: r.querySelector('.pr__real')?.textContent } })
  if (!(a3.klaar && a3.masker === 'onzichtbaar.' && a3.echt === 'onzichtbaar.')) fouten.push(`${label} password-reveal: ${JSON.stringify(a3)}`)
  await page.locator('.ai-scan-knoppen [data-impact-scan-open]').click(); await page.waitForTimeout(reduced ? 200 : 600)
  const open = await page.evaluate(() => document.querySelector('.ai-scan-knoppen dialog.isc')?.open)
  for (let i = 0; i < 7; i++) {
    await page.locator('dialog.isc[open] .isc__optie').filter({ hasText: /^Ja$/ }).first().click()
    await page.locator('dialog.isc[open] .isc__knop--hoofd').click(); await page.waitForTimeout(reduced ? 80 : 350)
  }
  await page.waitForTimeout(reduced ? 300 : 2200)
  const a4 = await page.evaluate(() => ({ score: document.querySelector('dialog.isc [data-isc-scoretal]')?.textContent, kop: document.querySelector('dialog.isc [data-isc-uitslag-kop]')?.textContent, meter: document.querySelector('dialog.isc [role="meter"]')?.getAttribute('aria-valuenow') }))
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  const dicht = await page.evaluate(() => !document.querySelector('dialog.isc')?.open)
  if (!(open && a4.score === '8 van 8' && a4.meter === '8' && dicht)) fouten.push(`${label} impact-scan: open ${open} ${JSON.stringify(a4)} dicht ${dicht}`)
  regels.push(`${label} /ai voor-na ${a0}→${a1.actief} (${a1.nu}%, ${a1.stappen} stappen) · kaartenrij ${a2.kaarten} kaarten, pin ${a2.aan}, lotties ${a2.lotties} · onthulling "${a3.masker}" · scan ${a4.score} "${a4.kop}" dicht ${dicht}`)
  // 8. /work: de beeldwand (eindeloos-raster) onder de showcase
  {
    await page.goto(BASIS + '/work', { waitUntil: 'networkidle' })
    const w0 = await page.evaluate(() => {
      const r = document.querySelector('.alles-wand')
      return { actief: r.hasAttribute('data-er-actief'), kopie: r.querySelectorAll('[data-er-kloon]').length, case: r.querySelectorAll('.er__raster:not([data-er-kloon]) .er__case').length, tegel: r.querySelectorAll('.er__raster:not([data-er-kloon]) .er__tegel').length, lijst: document.querySelectorAll('.alles-lijst .er__lijst a').length }
    })
    await page.locator('.alles-wand .er__uitweg').focus()
    await page.keyboard.press('Enter'); await page.waitForTimeout(reduced ? 300 : 900)
    const w1 = await page.evaluate(() => ({ focus: document.activeElement?.id, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    if (w0.actief === reduced || (reduced && w0.kopie) || w0.case !== 12 || w0.tegel !== 12 || w0.lijst !== 33) fouten.push(`${label} beeldwand: ${JSON.stringify(w0)}`)
    if (w1.focus !== 'alles-lijst' || w1.sw > w1.cw) fouten.push(`${label} beeldwand uitweg: ${JSON.stringify(w1)}`)
    regels.push(`${label} beeldwand lus ${w0.actief} (kopieën ${w0.kopie}) · ${w0.case} cases + ${w0.tegel} demo's · lijst ${w0.lijst} · uitweg → #${w1.focus}`)
  }

  // 9. Casepagina: de echte site in het venster (live-demo-kader) en de volgende cases (kaartenstapel-zij).
  // De klantsite zelf wordt hier nagebootst (page.route): de toets meet ons kader, niet hun server.
  {
    const nep = []
    await page.route('https://offbeatpeak.com/**', (r) => { nep.push(r.request().url()); r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>nep</title><h1>Offbeat Peak</h1>' }) })
    await page.goto(BASIS + '/work/offbeat-peak', { waitUntil: 'networkidle' })
    const k0 = await page.evaluate(() => { const k = document.querySelector('.case-kader'); return { modus: k.dataset.ldkModus, w: Math.round(k.getBoundingClientRect().width), adres: k.querySelector('[data-demo-adres]').textContent, laad: !!k.querySelector('.case-kader__laad'), iframe: !!k.querySelector('iframe') } })
    const vooraf = nep.length
    if (mobiel) {
      await page.locator('.case-kader .ldk-teaser .ldk-knop').click(); await page.waitForTimeout(800)
    } else {
      await page.locator('.case-kader__laad').click(); await page.waitForTimeout(800)
    }
    const k1 = await page.evaluate(() => { const k = document.querySelector('.case-kader'); const f = document.querySelector('.case-kader iframe'); return { src: f?.getAttribute('src'), titel: f?.title, markering: k.querySelector('[data-demo-markering]').textContent, dialoog: !!document.querySelector('.ldk-dialoog[open]') } })
    if (mobiel) { await page.keyboard.press('Escape'); await page.waitForTimeout(300) }
    const wantModus = mobiel ? 'teaser' : 'kader'
    if (k0.modus !== wantModus || !k0.w || k0.adres !== 'offbeatpeak.com/' || k0.iframe || vooraf) fouten.push(`${label} kader vooraf: ${JSON.stringify(k0)} verzoeken ${vooraf}`)
    if (k1.src !== 'https://offbeatpeak.com' || !/live/.test(k1.markering) || (mobiel && !k1.dialoog)) fouten.push(`${label} kader na klik: ${JSON.stringify(k1)}`)
    regels.push(`${label} kader ${k0.modus} ${k0.w}px "${k0.adres}" · 0 verzoeken vooraf (${vooraf}) · na klik iframe ${k1.src}${mobiel ? ' in dialoog ' + k1.dialoog : ''}`)
    const st = await page.evaluate(() => { const s = document.querySelector('.volgende-stapel'); return { modus: s.dataset.kzModus, n: s.querySelectorAll('[data-kz-kaart]').length, links: [...s.querySelectorAll('a[data-kz-knop]')].map((a) => a.getAttribute('href')) } })
    const wantStapel = !mobiel && !reduced ? 'pin' : 'snap'
    if (st.modus !== wantStapel || st.n !== 5 || st.links.length !== 5 || st.links[0] !== '/work/digital-waves' || st.links[4] !== '/work') fouten.push(`${label} stapel: ${JSON.stringify(st)}`)
    regels.push(`${label} stapel ${st.modus} · ${st.n} kaarten · ${st.links.join(' ')}`)
    // Een site die zich niet laat inbedden: alleen het schermbeeld, geen laadknop.
    await page.goto(BASIS + '/work/human-margin', { waitUntil: 'networkidle' })
    const hm = await page.evaluate(() => ({ laad: !!document.querySelector('.case-kader__laad'), knop: (() => { const b = document.querySelector('.case-kader .ldk-teaser .ldk-knop'); return b ? getComputedStyle(b).display : 'geen' })() }))
    if (hm.laad || (mobiel && hm.knop !== 'none')) fouten.push(`${label} kader human-margin: ${JSON.stringify(hm)}`)
    await page.unroute('https://offbeatpeak.com/**')
  }

  // 10. Contact: badge, intake (ook ?dienst/&pakket en ?scan van de AI-scan), advies, prijzen en agenda.
  {
    const cal = []
    page.on('request', (r) => { if (/cal\.com/.test(r.url())) cal.push(r.url()) })
    await page.route('https://cal.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>agenda</title>' }))
    await page.goto(BASIS + '/contact?scan=' + encodeURIComponent('test <b>vet</b>'), { waitUntil: 'networkidle' })
    const c0 = await page.evaluate(() => ({
      maand: document.querySelector('.contact-badge [data-ab-maand]').textContent,
      scan: document.querySelector('#veld-bericht').value,
      html: !!document.querySelector('#intake-formulier b'),
      doel: document.querySelector('#intake-formulier input[name="doel"]:checked')?.value,
      stappen: document.querySelectorAll('#intake-formulier [data-sp-stap]:not([hidden])').length,
    }))
    const volgende = new Intl.DateTimeFormat('nl-NL', { month: 'long' }).format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) // badge = volgende maand
    if (c0.maand !== volgende || c0.scan !== 'test <b>vet</b>' || c0.html || c0.doel !== 'ai' || c0.stappen !== 1) fouten.push(`${label} contact ?scan: ${JSON.stringify(c0)} (badge verwacht ${volgende})`)
    await page.goto(BASIS + '/contact?dienst=marketing&pakket=plan#intake', { waitUntil: 'networkidle' })
    const c1 = await page.evaluate(() => ({ doel: document.querySelector('#intake-formulier input[name="doel"]:checked')?.value, pakket: document.querySelector('#intake-formulier input[name="pakket"]').value }))
    if (c1.doel !== 'marketing' || c1.pakket !== 'plan') fouten.push(`${label} contact ?dienst: ${JSON.stringify(c1)}`)
    // advies: website → klein geeft Start, en de knop opent het tabblad Websites bij de prijzen
    await page.evaluate(() => sessionStorage.clear()); await page.reload({ waitUntil: 'networkidle' })
    const af = page.locator('.pakket-advies')
    await af.scrollIntoViewIfNeeded()
    await af.locator('.af-keuze', { hasText: 'Een website' }).click(); await af.locator('.af-next').click()
    await af.locator('.af-keuze', { hasText: 'Eén verhaal' }).click(); await af.locator('.af-next').click()
    await page.waitForSelector('.pakket-advies .af-advies-heading', { timeout: 3000 }).catch(() => {})
    const a0 = await page.evaluate(() => ({ kop: document.querySelector('.af-advies-heading')?.textContent, prijs: document.querySelector('.af-advies-prijs')?.textContent }))
    await af.locator('.af-cta-link').click(); await page.waitForTimeout(500)
    const a1 = await page.evaluate(() => ({ hash: location.hash, tab: document.querySelector('.prijzen [role="tab"][aria-selected="true"]')?.textContent }))
    if (a0.kop !== 'Websites: Start' || !/€ 2\.450/.test(a0.prijs || '') || a1.hash !== '#dienst-website' || a1.tab !== 'Websites') fouten.push(`${label} advies: ${JSON.stringify({ ...a0, ...a1 })}`)
    // prijzen: tab Marketing, CTA met dienst en pakket
    await page.locator('.prijzen [role="tab"]', { hasText: 'Marketing' }).click(); await page.waitForTimeout(300)
    const p0 = await page.evaluate(() => { const pan = document.querySelector('.prijzen [data-dienst="marketing"]'); return { zicht: !pan.hidden, cta: pan.querySelector('[data-ppd-cta]').getAttribute('href'), bedrag: pan.querySelector('.ppd__bedrag').textContent.replace(/\s/g, ' ') } })
    if (!p0.zicht || !/dienst=marketing&pakket=klankbord/.test(p0.cta) || p0.bedrag !== '€ 750') fouten.push(`${label} prijzen: ${JSON.stringify(p0)}`)
    // agenda: niets naar cal.com vóór de klik
    const agendaKnop = page.locator('.kennismaken .af__knop')
    await agendaKnop.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
    const g0 = { verzoeken: cal.length, label: await agendaKnop.getAttribute('aria-label') }
    let g1 = {}
    if (!mobiel) {
      await agendaKnop.click(); await page.waitForTimeout(800)
      g1 = await page.evaluate(() => ({ src: document.querySelector('.kennismaken iframe')?.getAttribute('src') }))
      if (!/^https:\/\/cal\.com\/christianbleeker\/kennismaking\?embed=true/.test(g1.src || '')) fouten.push(`${label} agenda na klik: ${JSON.stringify(g1)}`)
    } else if (!/nieuw tabblad/.test(g0.label || '')) fouten.push(`${label} agenda mobiel: ${JSON.stringify(g0)}`)
    if (g0.verzoeken) fouten.push(`${label} agenda: ${g0.verzoeken} verzoeken naar cal.com vóór de klik`)
    regels.push(`${label} contact badge "${c0.maand}" · ?scan → "${c0.scan}" (doel ${c0.doel}) · ?dienst → ${c1.doel}/${c1.pakket} · advies "${a0.kop}" ${a0.prijs} → ${a1.hash} · prijzen ${p0.bedrag} ${p0.cta} · agenda vooraf ${g0.verzoeken} verzoeken${g1.src ? ' → ' + g1.src.slice(0, 48) : ' (mobiel: ' + g0.label + ')'}`)
    await page.unroute('https://cal.com/**')
  }

  if (cons.length) fouten.push(`${label}: ${cons.length} consolefout(en): ${cons.slice(0, 3).join(' | ')}`)
  regels.push(`${label} console ${cons.length}`)
  await b.close()
}
console.log(regels.join('\n'))
if (fouten.length) { console.error(`\nONDERDELEN ROOD (${fouten.length}):\n- ${fouten.join('\n- ')}`); process.exit(1) }
console.log(`\nONDERDELEN GROEN (${naam}): thema-schakelaar zonder flits, werkfilter, 20 ontwerp-demo's, reveal na scrollen, acht Home-onderdelen; Over: tijdlijn, hotspots, uitvullen, schreef; AI: voor-na, kaartenrij, onthulling, scan; beeldwand, kader + stapel op de case, intake/advies/prijzen/agenda/badge op Contact`)
