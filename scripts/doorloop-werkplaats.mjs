#!/usr/bin/env node
/**
 * Doorloop van de Werkplaats (v3, maker A): de twaalf proefstukken op /werkplaats doen wat ze beloven, op 1440 en 390,
 * met en zonder minder beweging, in het thema van de systeemvoorkeur. Aangeroepen vanuit doorloop-onderdelen.mjs
 * (blok 11); los te draaien met `node scripts/doorloop-werkplaats.mjs` (BASIS_URL, BROWSER, THEMA).
 *
 * PDOK (afstand-postcode) wordt nagebootst: de toets meet ons onderdeel, niet hun server. Verder 0 externe verzoeken.
 */
import { pathToFileURL } from 'node:url'
import { laadChromium, LAUNCH, BASIS } from './browser.mjs'

const nlDatum = (plus = 0) => {
  const [j, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number)
  return new Date(Date.UTC(j, m - 1, d + plus)).toISOString().slice(0, 10)
}

export async function werkplaats(motor, { w, h, reduced, schema, naam, label }, fouten, regels) {
  const mobiel = w < 500
  const b = await motor.launch(LAUNCH)
  const page = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mobiel, isMobile: mobiel && naam !== 'firefox', reducedMotion: reduced ? 'reduce' : 'no-preference', colorScheme: schema })
  const fout = (wat, info) => fouten.push(`${label} werkplaats ${wat}: ${typeof info === 'string' ? info : JSON.stringify(info)}`)
  const cons = [], extern = [], pdok = []
  page.on('console', (m) => { if (m.type() === 'error') cons.push(m.text()) })
  page.on('pageerror', (e) => cons.push('pageerror ' + e.message))
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(BASIS) && !u.startsWith('data:') && !u.startsWith('blob:')) (u.includes('api.pdok.nl') ? pdok : extern).push(u) })
  await page.route('https://api.pdok.nl/**', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ response: { numFound: 1, docs: [{ centroide_ll: 'POINT(6.0950 52.5100)', weergavenaam: '8011 AB' }] } }) }))
  const naar = async (sel, blok = 'center') => { await page.evaluate(([s, bl]) => document.querySelector(s).scrollIntoView({ block: bl, behavior: 'instant' }), [sel, blok]); await page.waitForTimeout(reduced ? 250 : 700) }

  await page.goto(BASIS + '/werkplaats', { waitUntil: 'networkidle' })
  await page.waitForTimeout(reduced ? 400 : 1500)

  // 1. three-mascot: 3D alleen met beweging op desktop; anders de poster en geen three.js
  const m = await page.evaluate(() => ({ canvas: !!document.querySelector('.wp-hond canvas.tm-canvas:not([hidden])'), poster: !document.querySelector('.wp-hond [data-mascot-poster]').hidden, three: performance.getEntriesByType('resource').some((r) => r.name.includes('/vendor/three/')) }))
  const m3d = !mobiel && !reduced
  if (m3d ? !(m.canvas && !m.poster) : !(m.poster && !m.canvas && !m.three)) fout('three-mascot', m)

  // 2. werkgebied-kaart: scrollen maakt het tweede project actief; de knop "Medemblik" springt erheen
  await naar('#wk-enkhuizen')
  await page.waitForTimeout(reduced ? 200 : 1200)
  const k1 = await page.evaluate(() => ({ actief: document.querySelector('.wk')?.getAttribute('data-wk-actief'), punt: document.querySelector('[data-wk-punt][aria-current="true"]')?.getAttribute('data-wk-punt') }))
  await page.locator('.wk-nav-knop', { hasText: 'Medemblik' }).click()
  await page.waitForTimeout(reduced ? 400 : 1800)
  const k2 = await page.evaluate(() => ({ punt: document.querySelector('[data-wk-punt][aria-current="true"]')?.getAttribute('data-wk-punt'), kaartje: document.querySelector('#wk-medemblik').getAttribute('aria-current') || document.querySelector('#wk-medemblik .wk-kaartje')?.closest('[aria-current]')?.id }))
  if (k1.punt !== 'enkhuizen' || k2.punt !== 'medemblik') fout('werkgebied-kaart', { k1, k2 })

  // 3. afstand-postcode: postcode → op afstand, Zwolle eerst; straal 10 km verbergt de verre praktijken
  await naar('.wp-afstand')
  await page.fill('#wp-postcode', '8011 AB')
  await page.locator('.wp-afstand-rij .knop').click()
  await page.waitForTimeout(600)
  const a1 = await page.evaluate(() => [...document.querySelectorAll('.wp-afstand-lijst li')].map((li) => ({ naam: li.querySelector('.wp-afstand-naam').textContent, km: li.querySelector('[data-afstand-km]').textContent, verborgen: li.hidden })))
  await page.selectOption('#wp-straal', '10')
  await page.waitForTimeout(300)
  const a2 = await page.evaluate(() => [...document.querySelectorAll('.wp-afstand-lijst li')].filter((li) => !li.hidden).length)
  if (a1[0]?.naam !== 'Praktijk Zwolle' || !/km/.test(a1[0]?.km) || pdok.length !== 1 || !(a2 >= 1 && a2 < 5)) fout('afstand-postcode', { a1: a1.slice(0, 2), a2, pdok: pdok.length })

  // 4. open-status: een echte status in Nederlandse tijd
  const o = await page.evaluate(() => ({ status: document.querySelector('.wp-open-status')?.getAttribute('data-os-status'), tekst: document.querySelector('.wp-open-status [data-os-tekst]')?.textContent }))
  if (!['open', 'dicht'].includes(o.status) || !/^(Nu open|Gesloten)/.test(o.tekst || '')) fout('open-status', o)

  // 5. kleur-configurator: Ossenbloed wisselt de deur, de meerprijs en ?kleur=
  await naar('.wp-kleur')
  await page.locator('.wp-kleur .kc-swatch', { hasText: 'Ossenbloed' }).click()
  await page.waitForTimeout(reduced ? 300 : 800)
  const kc = await page.evaluate(() => ({ src: document.querySelector('[data-kleur-img]').getAttribute('src'), naam: document.querySelector('.wp-kleur [data-kleur-naam]').textContent, prijs: document.querySelector('.wp-kleur [data-kleur-meerprijs]').textContent, url: new URLSearchParams(location.search).get('kleur') }))
  if (!kc.src.endsWith('deur-ossenbloed.svg') || kc.naam !== 'Ossenbloed' || !/85/.test(kc.prijs) || kc.url !== 'ossenbloed') fout('kleur-configurator', kc)

  // 6. besteldeadline: min = vandaag of morgen (NL); een zondag springt naar de volgende open dag met een melding
  const zondag = (() => { for (let i = 1; i < 9; i++) { const d = nlDatum(i); if (new Date(d + 'T12:00:00Z').getUTCDay() === 0) return d } })()
  const bd0 = await page.evaluate(() => document.querySelector('#wp-ophaaldag').min)
  await page.evaluate((d) => { const i = document.querySelector('#wp-ophaaldag'); i.value = d; i.dispatchEvent(new Event('change', { bubbles: true })) }, zondag)
  await page.waitForTimeout(200)
  const bd1 = await page.evaluate(() => ({ waarde: document.querySelector('#wp-ophaaldag').value, melding: document.querySelector('.wp-deadline [data-besteldeadline-melding]').textContent }))
  if (![nlDatum(0), nlDatum(1)].includes(bd0) || bd1.waarde === zondag || !bd1.melding) fout('besteldeadline', { bd0, zondag, ...bd1 })

  // 7. drempelteller: 9 van 12, "Nog 3 aanmeldingen"
  await naar('.wp-drempel')
  await page.waitForTimeout(reduced ? 200 : 1600)
  const dt = await page.evaluate(() => { const r = document.querySelector('.wp-drempel'); const bar = r.querySelector('[role="progressbar"]'); return { nu: bar?.getAttribute('aria-valuenow'), max: bar?.getAttribute('aria-valuemax'), tekst: r.textContent.replace(/\s+/g, ' ').trim() } })
  if (dt.nu !== '9' || dt.max !== '12' || !/Nog 3 aanmeldingen/.test(dt.tekst)) fout('drempelteller', dt)

  // 8. boekingsvelden: versturen opent onze voorbeeldpagina in een dialoog, met datum/tijd/personen in het adres
  await naar('.wp-boeking')
  await page.locator('.wp-boeking button[type="submit"]').click()
  await page.waitForTimeout(800)
  const bv = await page.evaluate(() => ({ open: !!document.querySelector('.bv__dialoog[open]'), src: document.querySelector('.bv__dialoog iframe')?.getAttribute('src') }))
  if (bv.open) { await page.keyboard.press('Escape'); await page.waitForTimeout(300) }
  const bvDicht = await page.evaluate(() => !document.querySelector('.bv__dialoog[open]'))
  if (!bv.open || !/^(https?:\/\/[^/]+)?\/werkplaats\/voorbeeld-boeking\.html\?datum=\d{4}-\d\d-\d\d&tijd=\d\d%3A\d\d&personen=\d$/.test(bv.src || '') || !bvDicht) fout('boekingsvelden', { ...bv, bvDicht })

  // 9. link-dialog-funnel: "second opinion" opent de dialoog met die keuze; versturen verstuurt niets
  await naar('.wp-intake')
  const posts = []
  page.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()) })
  await page.locator('.wp-intake a', { hasText: 'second opinion' }).click()
  await page.waitForTimeout(reduced ? 200 : 500)
  // met een interesse uit de link slaat de funnel stap 1 over: meteen de contactvelden. Terug laat de keuze zien.
  const open0 = await page.evaluate(() => ({ open: !!document.querySelector('dialog.ldf-dialog[open]'), naamVeld: !!document.querySelector('dialog.ldf-dialog[open] input[name="naam"]:not([hidden])'), url: location.pathname }))
  await page.locator('dialog.ldf-dialog[open] button:visible', { hasText: 'Terug' }).click()
  await page.waitForTimeout(150)
  const f0 = { ...open0, gekozen: await page.evaluate(() => document.querySelector('dialog.ldf-dialog input[name="ldf-interesse-radio"]:checked')?.value) }
  await page.locator('dialog.ldf-dialog[open] button:visible', { hasText: 'Volgende' }).click()
  await page.waitForTimeout(150)
  await page.fill('dialog.ldf-dialog[open] input[name="naam"]', 'Test')
  await page.fill('dialog.ldf-dialog[open] input[name="email"]', 'test@voorbeeld.invalid')
  await page.locator('dialog.ldf-dialog[open] button:visible', { hasText: 'Aanvraag versturen' }).click()
  await page.waitForTimeout(900)
  const f1 = await page.evaluate(() => document.querySelector('dialog.ldf-dialog[open] .ldf-success')?.innerText || '')
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  const fDicht = await page.evaluate(() => !document.querySelector('dialog.ldf-dialog[open]'))
  if (!f0.open || f0.gekozen !== 'second-opinion' || f0.url !== '/werkplaats' || !/Dit was een voorbeeld/.test(f1) || posts.length || !fDicht) fout('link-dialog-funnel', { ...f0, f1, posts, fDicht })

  // 10. zoek-keuzelijst: "kapper" vindt Haarstylist (synoniem), Enter kiest hem in de echte select
  await naar('.wp-keuzelijst')
  await page.locator('.wp-keuzelijst .zk__input').click()
  await page.keyboard.type('kapper')
  await page.waitForTimeout(250)
  const zk0 = await page.evaluate(() => [...document.querySelectorAll('.wp-keuzelijst .zk__optie')].filter((o) => o.offsetParent).map((o) => o.textContent.trim()).slice(0, 3))
  await page.keyboard.press('Enter') // de eerste treffer staat al actief
  await page.waitForTimeout(200)
  const zk1 = await page.evaluate(() => document.querySelector('#wp-beroep').value)
  if (!zk0.some((t) => /Haarstylist/.test(t)) || zk1 !== 'haarstylist') fout('zoek-keuzelijst', { zk0, zk1 })

  // 11. kennisbank-filter: zoeken op "slaap" laat één bijdrage zien (titel en samenvatting; "slapengaan" telt niet) en zet ?q= in het adres
  await naar('.wp-kennis', 'start')
  const zoek = page.locator('.wp-kennis input[type="search"], .wp-kennis .kb-invoer').first()
  if (mobiel && !(await zoek.isVisible())) { await page.locator('.wp-kennis .kb-toggle').click(); await page.waitForTimeout(300) }
  await zoek.fill('slaap')
  await page.waitForTimeout(600)
  const kb = await page.evaluate(() => ({ zichtbaar: [...document.querySelectorAll('.wp-kennis [data-kb-kaart]')].filter((k) => !k.hidden && k.offsetParent).length, q: new URLSearchParams(location.search).get('q') }))
  if (mobiel) { const dicht = page.locator('.wp-kennis .kb-paneel button', { hasText: /Toon|Sluit|Klaar/ }).first(); if (await dicht.isVisible().catch(() => false)) await dicht.click() }
  if (kb.zichtbaar !== 1 || kb.q !== 'slaap') fout('kennisbank-filter', kb)

  // 12. rechtenmatrix: "Nooit" bij Mail sorteren verandert de samenvatting en het verborgen veld
  await page.keyboard.press('Escape')
  await naar('.wp-rechten')
  const r0 = await page.evaluate(() => document.querySelector('.wp-rechten .rm-sam__tekst, .wp-rechten .rm-sam')?.textContent.replace(/\s+/g, ' ').trim())
  await page.locator('.wp-rechten .rm-rij', { hasText: 'Mail sorteren' }).locator('.rm-opt', { hasText: 'Nooit' }).click()
  await page.waitForTimeout(300)
  const r1 = await page.evaluate(() => ({ sam: document.querySelector('.wp-rechten .rm-sam__tekst, .wp-rechten .rm-sam')?.textContent.replace(/\s+/g, ' ').trim(), veld: JSON.parse(document.querySelector('.wp-rechten input[name="werkverdeling"]')?.value || '{}')?.inbox?.sorteren }))
  if (r0 === r1.sam || r1.veld !== 'nooit') fout('rechtenmatrix', { r0, ...r1 })

  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  if (sw[0] > sw[1]) fout('breedte', sw)
  if (extern.length) fout('externe verzoeken', extern.slice(0, 4))
  if (cons.length) fout('console', cons.slice(0, 3))
  regels.push(`${label} werkplaats hond ${m.canvas ? '3D' : 'poster'} · kaart ${k1.punt}→${k2.punt} · afstand ${a1[0]?.naam} ${a1[0]?.km} (straal 10: ${a2}) · open "${o.tekst}" · deur ${kc.naam} ${kc.prijs} · taart min ${bd0}, zondag→${bd1.waarde} · teller ${dt.nu}/${dt.max} · boeking ${bv.open ? 'dialoog' : '-'} · intake ${f0.gekozen} ${posts.length} posts · beroep ${zk1} · kennis "slaap" ${kb.zichtbaar} · rechten ${r1.veld} · extern ${extern.length} · console ${cons.length}`)
  await b.close()
}

// Los draaien
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const motor = await laadChromium()
  const naam = process.env.BROWSER || 'chromium'
  const fouten = [], regels = []
  for (const schema of ['light', 'dark']) for (const reduced of [false, true]) for (const [w, h] of [[1440, 900], [390, 844]]) {
    await werkplaats(motor, { w, h, reduced, schema, naam, label: `${naam} ${w} ${reduced ? 'minder' : 'beweging'} systeem-${schema}` }, fouten, regels)
  }
  console.log(regels.join('\n'))
  if (fouten.length) { console.error(`\nWERKPLAATS ROOD (${fouten.length}):\n- ${fouten.join('\n- ')}`); process.exit(1) }
  console.log(`\nWERKPLAATS GROEN (${naam}): twaalf proefstukken op 1440/390, met en zonder minder beweging, licht en donker`)
}
