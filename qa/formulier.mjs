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

// In de browser: controle per veld, dan de melding met LinkedIn.
const { page, sluit, fouten: pf } = await pagina({ breedte: 390, hoogte: 844 })
await page.goto(`${B}/contact`, { waitUntil: 'networkidle' })
await page.click('.formulier button[type="submit"]')
ok(await page.locator('#fout-naam').isVisible(), 'browser: geen foutmelding bij lege naam')
ok(await page.evaluate(() => document.activeElement?.getAttribute('name') === 'naam'), 'browser: focus niet naar het eerste foute veld')
await page.waitForTimeout(1600) // voorbij de minimale invultijd
await page.fill('#veld-naam', 'Testbezoeker')
await page.fill('#veld-email', 'test@voorbeeldbedrijf.nl')
await page.fill('#veld-bericht', 'Een kort testbericht.')
await page.click('.formulier button[type="submit"]')
await page.waitForSelector('.formulier-melding--mislukt', { timeout: 5000 }).catch(() => {})
ok(await page.locator('.formulier-melding--mislukt a[href*="linkedin"]').count() === 1, 'browser: geen "mislukt"-melding met LinkedIn')
ok(pf.filter((f) => !/503|502|Failed to load resource/.test(f)).length === 0, `browser: fouten ${pf.join(' | ')}`)
await sluit()
uitslag('formulier', fouten, geslaagd)
