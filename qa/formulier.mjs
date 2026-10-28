#!/usr/bin/env node
/**
 * Contactformulier ([S] Formulieren). Zonder Resend-sleutel (zo draait de
 * reeks lokaal) moet elke geldige inzending "mislukt" melden — nooit "gelukt" — en de bezoeker naar
 * LinkedIn verwijzen. Verder: veldcontrole op de server (422), spamval (honeypot en te snel = stil
 * geaccepteerd, niets verstuurd), versie zonder JavaScript (HTML-antwoord) en de melding in de browser.
 *
 *   BASIS=http://localhost:PORT node qa/formulier.mjs
 */
import { pagina, uitslag } from './lib.mjs'

const B = process.env.BASIS
const fouten = []
let geslaagd = 0
const ok = (v, f) => (v ? geslaagd++ : fouten.push(f))
const post = (velden, json = true) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(velden)) fd.set(k, v)
  return fetch(`${B}/api/contact`, { method: 'POST', body: fd, headers: json ? { Accept: 'application/json' } : {} })
}
const geldig = { naam: 'Testbezoeker', email: 'test@voorbeeldbedrijf.nl', bericht: 'Een kort testbericht.', website: '', _geopend: String(Date.now() - 5000) }

let r = await post({ ...geldig, naam: '', email: 'geen-mail' })
let j = await r.json()
ok(r.status === 422 && j.fouten?.naam && j.fouten?.email, `lege naam en foute mail: verwacht 422 met twee fouten, kreeg ${r.status}`)

r = await post({ ...geldig, website: 'http://spam.example' })
ok(r.status === 200 && (await r.json()).status === 'gelukt', 'honeypot: verwacht stil "gelukt"')

r = await post({ ...geldig, _geopend: String(Date.now()) })
ok(r.status === 200, 'te snel ingevuld: verwacht stil "gelukt"')

r = await post(geldig)
j = await r.json()
ok(j.status === 'mislukt' && r.status >= 500, `zonder sleutel: verwacht "mislukt" (5xx), kreeg ${r.status} ${j.status}`)

r = await post(geldig, false)
const html = await r.text()
ok(/text\/html/.test(r.headers.get('content-type') || '') && /linkedin\.com\/in\/christianbleeker/.test(html), 'zonder JS: geen HTML-antwoord met LinkedIn')

// In de browser: de intake in drie stappen (stappen-persoonlijk). Controle per stap, dan "mislukt" met LinkedIn.
// De keuze uit stap 2 en het bedrijf gaan als regels bovenaan het bericht mee; de route zelf is dezelfde.
const { page, sluit, fouten: pf } = await pagina({ breedte: 390, hoogte: 844 })
await page.goto(`${B}/contact`, { waitUntil: 'networkidle' })
const F = '#intake-formulier'
await page.click(`${F} [data-sp-volgende]`)
ok(await page.locator('#veld-naam').getAttribute('aria-invalid') === 'true', 'browser: lege naam niet als fout gemarkeerd')
ok(await page.evaluate(() => document.activeElement?.getAttribute('name') === 'naam'), 'browser: focus niet naar het eerste foute veld')
await page.waitForTimeout(1600) // voorbij de minimale invultijd
await page.fill('#veld-naam', 'Testbezoeker')
await page.fill('#veld-email', 'test@voorbeeldbedrijf.nl')
await page.fill('#veld-bedrijf', 'Testbedrijf')
await page.click(`${F} [data-sp-volgende]`)
await page.waitForTimeout(500) // stapwissel (300 ms)
ok(/Testbedrijf/.test(await page.locator(`${F} [data-sp-stap]:not([hidden]) [data-sp-kop]`).innerText()), 'browser: stap 2 noemt het bedrijf niet')
await page.click(`${F} .sp-kaart:has(input[value="website"])`)
await page.click(`${F} [data-sp-volgende]`)
await page.waitForTimeout(500)
await page.fill('#veld-bericht', 'Een kort testbericht.')
let verstuurd = ''
page.on('request', (r) => { if (r.url().endsWith('/api/contact')) verstuurd = r.postData() || '' })
await page.click(`${F} button[type="submit"]`)
await page.waitForSelector(`${F} .sp-fout:not([hidden]) a[href*="linkedin"]`, { timeout: 5000 }).catch(() => {})
ok(await page.locator(`${F} .sp-fout:not([hidden]) a[href*="linkedin"]`).count() === 1, 'browser: geen "mislukt"-melding met LinkedIn')
ok(/Waar het om gaat: Een nieuwe website/.test(verstuurd) && /Bedrijf of project: Testbedrijf/.test(verstuurd) && /name="_geopend"/.test(verstuurd), 'browser: keuze, bedrijf of _geopend niet in de verzending')
ok(pf.filter((f) => !/503|502|Failed to load resource/.test(f)).length === 0, `browser: fouten ${pf.join(' | ')}`)
await sluit()
uitslag('formulier', fouten, geslaagd)
