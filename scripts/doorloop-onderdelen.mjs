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
 *  5. /work-beeldwand (eindeloos-raster): lus alleen met beweging, 12 cases + 12 demo's, lijst van 33, uitweg zet de focus;
 *  6. casepagina: kader (live-demo-kader) laadt pas na een klik de echte site (nagebootst), stapel (kaartenstapel-zij)
 *     pint op 1440 en is een snap-rij op 390 / bij minder beweging; human-margin (laat zich niet inbedden) zonder laadknop;
 *  7. /contact: badge = volgende maand, ?scan= vult het bericht als platte tekst, ?dienst=&pakket= kiest voor, advies →
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

  // 5. /work: de beeldwand (eindeloos-raster) onder de showcase
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

  // 6. Casepagina: de echte site in het venster (live-demo-kader) en de volgende cases (kaartenstapel-zij).
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

  // 7. Contact: badge, intake (ook ?dienst/&pakket en ?scan van de AI-scan), advies, prijzen en agenda.
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
console.log(`\nONDERDELEN GROEN (${naam}): thema-schakelaar zonder flits, werkfilter, 20 ontwerp-demo's, reveal na scrollen, beeldwand, kader + stapel op de case, intake/advies/prijzen/agenda/badge op Contact`)
