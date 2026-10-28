#!/usr/bin/env node
/**
 * Schermbeelden op 1440 en 390 (boven + volle pagina), per thema.
 *   THEMA=licht node scripts/schermbeelden.mjs          → qa/v2/home-licht-{1440,390}{,-lang}.png
 *   THEMA=donker node scripts/schermbeelden.mjs /work   → qa/v2/work-donker-*.png
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { laadChromium, LAUNCH, BASIS, THEMA } from './browser.mjs'

const PAD = process.argv[2] || '/'
const NAAM = (PAD === '/' ? 'home' : PAD.slice(1).replace(/[/?=&]/g, '-')) + (THEMA ? `-${THEMA}` : '')
const UIT = process.env.UIT || path.resolve(import.meta.dirname, '../qa/v2')
mkdirSync(UIT, { recursive: true })
const chromium = await laadChromium()
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const browser = await chromium.launch(LAUNCH)
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 500 })
  await page.goto(BASIS + PAD, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600)
  await page.screenshot({ path: path.join(UIT, `${NAAM}-${w}.png`) })
  // Lang beeld met "minder beweging": de koerslijn staat dan helemaal getekend (zoals in de schetsen).
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  // langs de hele pagina, zodat alles wat bij scrollen binnenkomt in zijn eindstand staat
  const hoogte = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= hoogte; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(90) }
  await page.waitForTimeout(1200)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(800)
    // Alleen voor deze opname: footer en oplichtende tekst in hun eindstand zetten (de band blijft lopen).
  await page.addStyleTag({ content: '[data-opkomst-inhoud]{translate:none!important;animation:none!important} .swl [data-story-word]{color:var(--swl-ink)!important} .wm .wm__deel{transform:none!important} .ob{--p:1!important;height:auto!important} .ob__pin{position:static!important;height:auto!important} .ob__trap{flex:none!important;height:520px!important} .ob__kaart{display:none!important} [data-sp-track]{height:auto!important} [data-sp-stage]{position:static!important;height:auto!important} [data-sp-item]{position:relative!important;transform:none!important;top:auto!important;opacity:1!important} [data-sp-paneel]{height:auto!important;opacity:1!important;visibility:visible!important} [data-sp-inhoud]{opacity:1!important;transform:none!important;height:auto!important} [data-sp-stage]{overflow:visible!important}' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(UIT, `${NAAM}-${w}-lang.png`), fullPage: true })
  console.log(`${NAAM}-${w}.png + ${NAAM}-${w}-lang.png (${hoogte}px)`)
  await browser.close()
}
