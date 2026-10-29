/**
 * Onderdelen-doorloop v3x (29-10): de nieuwe blokken. Wordt aangeroepen vanuit doorloop-onderdelen.mjs,
 * per breedte × minder beweging × systeemthema, op dezelfde pagina.
 *
 *  /werkplaats #interne-apps  app-tour-venster: vier tabs, een tab kiezen wisselt het paneel en het subdomein
 *             (domein-wissel), pauzeknop alleen met beweging. eigen-naam-preview: "Bakkerij Groot" komt in de
 *             werkruimte en de domeinen, leeg = terug. levende-kaarten: zes kaarten in beeld. blokgrafiek: drie
 *             staven, Teamapp gemarkeerd. besparingscalculator: uitkomst met bedrag, CTA met dienst en pakket,
 *             pakketkorting verborgen.
 *  /contact   #werkwijze stappen-mini-ui: kopieerknop zichtbaar, SSL op "actief", zes stappen in tekst.
 *  /about     #team verbindingshub: lijnen getekend; loopt met beweging, stil bij minder beweging.
 */
import { BASIS } from './browser.mjs'

const wacht = (page, ms) => page.waitForTimeout(ms)
const naar = (page, sel) => page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel)
const breedteOk = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)

export async function toetsV3x(page, { label, reduced, fouten, regels }) {
  // ── /werkplaats ──────────────────────────────────────────────────────────────────────────────
  await page.goto(BASIS + '/werkplaats#interne-apps', { waitUntil: 'networkidle' })
  await page.evaluate(() => sessionStorage.removeItem('cb-eigen-naam'))
  await naar(page, '.ia .atv'); await wacht(page, 700)
  const t0 = await page.evaluate(() => {
    const r = document.querySelector('.ia .atv')
    return { actief: r.hasAttribute('data-atv-actief'), tabs: r.querySelectorAll('[role="tab"]').length, knop: !r.querySelector('[data-atv-pauze-knop]').hidden, dw: !!r.querySelector('[data-atv-adres][data-dw]') }
  })
  await page.locator('.ia .atv [role="tab"]').nth(1).click(); await wacht(page, 1200)
  const t1 = await page.evaluate(() => {
    const r = document.querySelector('.ia .atv')
    const tab = r.querySelectorAll('[role="tab"]')[1]
    return { gekozen: tab.getAttribute('aria-selected'), paneel: getComputedStyle(document.getElementById(tab.getAttribute('aria-controls'))).visibility, adres: r.querySelector('[data-atv-adres]').textContent }
  })
  if (!t0.actief || t0.tabs !== 4 || !t0.dw || t0.knop === reduced || t1.gekozen !== 'true' || t1.paneel !== 'visible' || !t1.adres.startsWith('rooster.jouwbedrijf.nl')) fouten.push(`${label} app-tour: ${JSON.stringify({ ...t0, ...t1 })}`)

  const veld = page.locator('.ia .enp input')
  await veld.scrollIntoViewIfNeeded(); await veld.fill('Bakkerij Groot'); await wacht(page, 1400)
  const n0 = await page.evaluate(() => ({
    adres: document.querySelector('.ia .atv [data-atv-adres]').textContent,
    werkruimte: document.querySelector('.ia [data-eigen-naam="werkruimte"]').textContent,
    kaart: document.querySelector('.ia-kaarten .lk-meta code').textContent,
  }))
  await veld.fill(''); await wacht(page, 1400)
  const n1 = await page.evaluate(() => document.querySelector('.ia [data-eigen-naam="werkruimte"]').textContent)
  if (!n0.adres.startsWith('rooster.bakkerijgroot.nl') || n0.werkruimte !== 'Bakkerij Groot' || !n0.kaart.startsWith('uren.bakkerijgroot.nl') || n1 !== 'Jouw bedrijf') fouten.push(`${label} eigen naam: ${JSON.stringify({ ...n0, terug: n1 })}`)

  // de domein-wissel zet de eindtekst ook voor schermlezers in het element: lees het begin
  for (let i = 0; i < 6; i++) { await naar(page, `.ia-kaarten .lk-kaart:nth-child(${i + 1})`); await wacht(page, 250) }
  for (const sel of ['.ia-varianten .bgf', '.ia-rekenen .bc']) { await naar(page, sel); await wacht(page, 700) }
  await wacht(page, 600)
  const k = await page.evaluate(() => ({
    kaarten: document.querySelectorAll('.ia-kaarten .lk-kaart').length,
    binnen: document.querySelectorAll('.ia-kaarten .lk-kaart[data-lk-in]').length,
    staven: document.querySelectorAll('.ia-varianten .bgf [role="img"]').length,
    gekozen: document.querySelector('.ia-varianten .bgf [data-gekozen] .bgf__label-lang')?.textContent,
    bc: document.querySelector('.ia-rekenen .bc').hasAttribute('data-bc-actief'),
    groot: document.querySelector('.ia-rekenen [data-bc="groot"]')?.textContent,
    cta: document.querySelector('.ia-rekenen [data-bc="cta"]')?.getAttribute('href'),
    korting: getComputedStyle(document.querySelector('.ia-rekenen .bc__korting')).display,
    breed: document.documentElement.scrollWidth <= innerWidth,
  }))
  if (k.kaarten !== 6 || k.binnen !== 6 || k.staven !== 3 || k.gekozen !== 'Teamapp' || !k.bc || !/€\s?600/.test(k.groot || '') || !/^\/contact\?dienst=apps&pakket=proces&team=8&apps=uren,verlof,klanten$/.test(k.cta || '') || k.korting !== 'none' || !k.breed) fouten.push(`${label} interne apps: ${JSON.stringify(k)}`)
  regels.push(`${label} v3x werkplaats: tour ${t0.tabs} tabs → ${t1.adres}, pauzeknop ${t0.knop ? 'zichtbaar' : 'weg'} · eigen naam → ${n0.adres} / ${n0.werkruimte} → terug "${n1}" · kaarten ${k.binnen}/${k.kaarten} · staven ${k.staven} (${k.gekozen}) · rekenhulp "${k.groot}" ${k.cta}`)

  // ── /contact ─────────────────────────────────────────────────────────────────────────────────
  await page.goto(BASIS + '/contact', { waitUntil: 'networkidle' })
  await naar(page, '#werkwijze .smu-rij'); await wacht(page, reduced ? 600 : 3500)
  const w = await page.evaluate(() => ({
    actief: document.querySelector('.ww [data-stappen-mini-ui]').matches('[data-smu-actief], [data-smu-direct]'),
    knop: !document.querySelector('.ww [data-smu-kopieer]').hidden,
    ssl: [...document.querySelectorAll('.ww [data-smu-ssl]')].map((s) => s.getAttribute('data-staat')).join(','),
    teller: document.querySelector('.ww [data-smu-teller]').textContent,
    stappen: document.querySelectorAll('.ww-stappen li').length,
    breed: document.documentElement.scrollWidth <= innerWidth,
  }))
  if (!w.actief || !w.knop || w.ssl !== 'actief,actief' || w.teller !== '3 van 3 klaar' || w.stappen !== 6 || !w.breed) fouten.push(`${label} werkwijze: ${JSON.stringify(w)}`)

  // ── /about ───────────────────────────────────────────────────────────────────────────────────
  await page.goto(BASIS + '/about', { waitUntil: 'networkidle' })
  await naar(page, '.team-hub .vh'); await wacht(page, 900)
  const h = await page.evaluate(() => {
    const r = document.querySelector('.team-hub .vh')
    return { actief: r.classList.contains('vh--actief'), staat: r.getAttribute('data-vh'), paden: r.querySelectorAll('svg.vh__lijnen path').length, namen: [...r.querySelectorAll('.vh__naam')].map((n) => n.textContent.trim()).join('|') }
  })
  const breed = await breedteOk(page)
  if (!h.actief || h.staat !== (reduced ? 'stil' : 'loopt') || h.paden < 6 || !breed) fouten.push(`${label} team-hub: ${JSON.stringify({ ...h, breed })}`)
  regels.push(`${label} v3x contact: smu ${w.actief ? 'actief/direct' : 'UIT'}, ssl ${w.ssl}, ${w.stappen} stappen · about: hub ${h.staat}, ${h.paden} paden`)
}
