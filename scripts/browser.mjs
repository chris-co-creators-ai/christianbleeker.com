/**
 * Gedeelde browserstart voor scripts/{punten,doorloop,doorloop-onderdelen,axe,schermbeelden}.mjs
 * (overgenomen van demo-15-psycholoog, 28-10-2026).
 *
 * playwright-core staat in devDependencies; met $PLAYWRIGHT_CORE kies je een andere versie (bv. de
 * meetversie die bij de gecachete Chromium van de werkplaats hoort).
 *
 * THEMA=licht|donker: elke nieuwe pagina krijgt vóór het laden `localStorage.thema`, zodat het inline
 * script in layout.tsx dat thema zet (net als een bezoeker die eerder koos). Zonder THEMA volgt de site
 * de systeemvoorkeur (Playwright: licht). BROWSER=chromium|webkit|firefox, BASIS_URL (standaard :4850).
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const KANDIDATEN = [
  process.env.PLAYWRIGHT_CORE,
  path.resolve(import.meta.dirname, '../node_modules/playwright-core/index.mjs'),
].filter(Boolean)

export const THEMA = process.env.THEMA || ''
if (THEMA && THEMA !== 'licht' && THEMA !== 'donker') throw new Error(`THEMA=${THEMA}: kies licht of donker`)

export async function laadChromium() {
  const naam = process.env.BROWSER || 'chromium' // chromium | webkit | firefox
  for (const k of KANDIDATEN) {
    const bestand = k.endsWith('.mjs') ? k : path.join(k, 'index.mjs')
    if (!existsSync(bestand)) continue
    const motor = (await import(pathToFileURL(bestand).href))[naam]
    if (!THEMA) return motor
    console.log(`thema: ${THEMA}`)
    // Elke pagina van elke browser krijgt het thema vóór het eerste script.
    const launch = motor.launch.bind(motor)
    motor.launch = async (opties) => {
      const b = await launch(opties)
      const newPage = b.newPage.bind(b)
      b.newPage = async (o) => {
        const p = await newPage(o)
        await p.addInitScript((t) => { try { localStorage.setItem('thema', t) } catch { /* geen opslag */ } }, THEMA)
        return p
      }
      return b
    }
    return motor
  }
  throw new Error(`playwright-core niet gevonden. Zet PLAYWRIGHT_CORE=<pad naar playwright-core>. Gezocht: ${KANDIDATEN.join(', ')}`)
}

/** In een gesandboxte macOS-shell start Chromium alleen met deze vlaggen . */
export const LAUNCH = process.env.BROWSER && process.env.BROWSER !== 'chromium'
  ? { headless: true }
  : { headless: true, args: ['--single-process', '--no-zygote', '--no-sandbox'] }

export const BASIS = process.env.BASIS_URL || 'http://localhost:4850'

export const CASES = ['human-margin', 'hoveniersbedrijf-nijboer', 'stratenova-advisory', 'seveke-creative', 'offbeat-peak', 'digital-waves', 'driftawave', 'radstok-interim', 'fuselabs', 'souplesse-runners-boutique', 'kinderopvang-ikke', 'win-instituut', 'co-creatie-ai']

/** Alle routes; PAGINAS=kort meet alleen de hoofdpagina's + één case (snelle ronde). */
export const PAGINAS = process.env.PAGINAS === 'kort'
  ? ['/', '/about', '/work', '/work/human-margin', '/ai', '/werkplaats', '/contact', '/privacy', '/bestaat-niet']
  : ['/', '/about', '/work', ...CASES.map((c) => `/work/${c}`), '/ai', '/werkplaats', '/contact', '/privacy', '/bestaat-niet']
