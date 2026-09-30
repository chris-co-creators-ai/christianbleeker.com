/**
 * Gedeelde hulpjes voor de controlescripts in qa/.
 *
 * Browser: Chromium standaard. MEET_BROWSER=webkit of firefox draait hetzelfde script in de engine
 * van Safari of Firefox (met PLAYWRIGHT_BROWSERS_PATH naar een map met die engines).
 * BASIS: het adres van een draaiende productiebouw (`npm run qa` zet dit zelf).
 */
import { chromium, webkit, firefox } from 'playwright-core'
import { readFileSync } from 'node:fs'

export const BASIS = process.env.BASIS || 'http://localhost:4610'
export const BROWSER = process.env.MEET_BROWSER || 'chromium'
const WEBKIT = BROWSER === 'webkit'
/** WebKit op macOS: Tab springt alleen tussen tekstvelden; Option+Tab bereikt alles. */
export const TAB = WEBKIT ? 'Alt+Tab' : 'Tab'
export const wacht = (ms) => new Promise((r) => setTimeout(r, ms))

export async function start() {
  if (BROWSER === 'webkit') return webkit.launch({ headless: true })
  if (BROWSER === 'firefox') return firefox.launch({ headless: true })
  // --single-process: in een macOS-sandbox faalt Chromium anders op de Mach-port. Eén pagina per browser.
  return chromium.launch({ headless: true, args: ['--single-process', '--no-zygote', '--no-sandbox'] })
}

/** Nieuwe browser + pagina; `fouten` verzamelt paginafouten en consolefouten. */
export async function pagina({ breedte = 1440, hoogte = 900, mobiel = breedte < 600, ...extra } = {}) {
  const browser = await start()
  const context = await browser.newContext({
    viewport: { width: breedte, height: hoogte },
    ...(BROWSER === 'firefox' ? {} : { isMobile: mobiel }),
    hasTouch: mobiel,
    ...extra,
  })
  const page = await context.newPage()
  const fouten = []
  page.on('pageerror', (e) => fouten.push(`paginafout: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') fouten.push(`console: ${m.text()}`) })
  return { browser, context, page, fouten, sluit: () => browser.close() }
}

/** Alle routes uit de sitemap van de draaiende site (dezelfde lijst als content/routes.ts). */
export async function routes() {
  const xml = await (await fetch(`${BASIS}/sitemap.xml`)).text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
}

/** Scroll als een bezoeker: echte wielstappen (mobiel WebKit kent geen wiel: dan scrollBy). */
export async function scrollDoor(page, stap = 400, pauze = 90) {
  const hoog = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < hoog; y += stap) {
    if (WEBKIT) await page.evaluate((d) => window.scrollBy(0, d), stap)
    else await page.mouse.wheel(0, stap)
    await page.waitForTimeout(pauze)
  }
}

export function uitslag(naam, fouten, geslaagd) {
  for (const f of fouten) console.log(`  ✗ ${f}`)
  console.log(`${naam} [${BROWSER}]: ${geslaagd} geslaagd, ${fouten.length} gefaald`)
  process.exit(fouten.length ? 1 : 0)
}

export const lees = (pad) => readFileSync(pad, 'utf8')
