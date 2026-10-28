#!/usr/bin/env node
/**
 * Doorloop in Chromium tegen de draaiende site (BASIS_URL, standaard http://localhost:4850; THEMA=licht|donker).
 * Per pagina op 1440×900 en 390×844, met gewone beweging én met "minder beweging":
 *  - 0 consolefouten en 0 paginafouten (de 404-status van de 404-pagina zelf telt niet);
 *  - scrollWidth ≤ clientWidth, ook na de hele pagina langs te scrollen;
 *  - precies één <h1>;
 *  - de juiste status (200, en 404 voor /bestaat-niet);
 *  - minder beweging: geen tekst in main/footer onzichtbaar (opacity < 0,1 of verborgen),
 *    behalve de bewust verborgen achterkant van een omdraaikaart ([inert]).
 *  - met THEMA: <html data-thema> is dat thema op elke pagina.
 * Plus: elke interne link geeft 200. (Overgenomen van demo-15; formulier en tel-melding horen daar, de
 * thema-schakelaar en het werkfilter toetst scripts/doorloop-onderdelen.mjs.)
 */
import { laadChromium, LAUNCH, BASIS, PAGINAS, THEMA } from './browser.mjs'

const chromium = await laadChromium()
const MATEN = [{ naam: 'desktop', width: 1440, height: 900 }, { naam: 'mobiel', width: 390, height: 844 }]
const fouten = []
const regels = []

async function nieuwePagina(maat, reduced) {
  const browser = await chromium.launch(LAUNCH)
  const page = await browser.newPage({ viewport: { width: maat.width, height: maat.height }, deviceScaleFactor: 1, hasTouch: maat.naam === 'mobiel', isMobile: maat.naam === 'mobiel' && process.env.BROWSER !== 'firefox', reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const cons = []
  page.on('console', (m) => {
    if (m.type() === 'warning' && /preloaded using link preload but not used/.test(m.text())) { cons.push(m.text()); return }
    if (m.type() !== 'error') return
    const bron = m.location()?.url || ''
    // De 404-status van de 404-pagina zelf. WebKit meldt die soms vóórdat page.url() is bijgewerkt, dus ook op het pad zelf.
    if (/status of 404/.test(m.text()) && (!bron || /\/bestaat-niet\/?$/.test(bron) || bron.replace(/\/$/, '') === page.url().replace(/\/$/, ''))) return
    cons.push(m.text())
  })
  page.on('pageerror', (e) => cons.push(`pageerror: ${e.message}`))
  return { browser, page, cons }
}

for (const reduced of [false, true]) {
  for (const maat of MATEN) {
    for (const pad of PAGINAS) {
      const { browser, page, cons } = await nieuwePagina(maat, reduced)
      const res = await page.goto(BASIS + pad, { waitUntil: 'networkidle' })
      const laadBreed = await page.evaluate(() => document.documentElement.scrollWidth)
      await page.waitForTimeout(reduced ? 500 : 2500)
      const label = `${reduced ? 'minder-beweging' : 'beweging'} ${maat.naam} ${pad}`
      const h1 = await page.locator('h1').count()
      const h = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y <= h; y += 600) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await page.waitForTimeout(40) }
      await page.waitForTimeout(400)
      const breed = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      if (laadBreed > breed.cw) fouten.push(`${label}: scrollWidth tijdens laden ${laadBreed}`)
      let onz = []
      if (reduced) {
        onz = await page.evaluate(() => {
          const uit = []
          for (const el of document.querySelectorAll('main *, footer *')) {
            // Bewust verborgen: "Klik om te vergroten" op een telefoon (daar vergroot de lightbox niet, site.css).
            // Werkplaats (v3): de no-JS-terugval van boekingsvelden en rechtenmatrix (JS zet het onderdeel ervoor in de
            // plaats), de dichte lijst van de zoek-keuzelijst, de filterknoppen en het uitklapbare filterpaneel van de kennisbank
            // (smal achter "Filters") en de functie onder een rol in de smalle rechtenmatrix (staat ook in het paneel).
            // Werkgebied-kaart: een plaatsnaam die over de kaartrand zou vallen krijgt .wk-af (de stip houdt zijn aria-label).
            if (el.closest('.wk-af, script, style, [aria-hidden="true"], [hidden], [inert], dialog:not([open]), template, .sr-only, .ervaringen-hint, [data-bv-actief] .bv__fallback, [data-rm-actief] .rm-fallback, .zk__lijst, .kb-toggle, .kb-klaar, .kb-paneel, .rm-tab__functie')) continue
            if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
            let e = el; let op = 1; let vis = true
            while (e && e !== document.body) { const cs = getComputedStyle(e); op *= Number(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') vis = false; e = e.parentElement }
            if (!vis || op < 0.1) uit.push(`${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 40)}`)
          }
          return uit
        })
        if (onz.length) fouten.push(`${label}: ${onz.length} onzichtbare tekst(en): ${onz.slice(0, 4).join(' | ')}`)
      }
      const status = res?.status()
      const verwacht = pad === '/bestaat-niet' ? 404 : 200
      if (status !== verwacht) fouten.push(`${label}: status ${status}, verwacht ${verwacht}`)
      if (cons.length) fouten.push(`${label}: ${cons.length} consolefout(en): ${cons.slice(0, 3).join(' | ')}`)
      if (breed.sw > breed.cw) fouten.push(`${label}: scrollWidth ${breed.sw} > clientWidth ${breed.cw}`)
      if (h1 !== 1) fouten.push(`${label}: ${h1} × h1`)
      const thema = await page.evaluate(() => document.documentElement.dataset.thema)
      if (THEMA && thema !== THEMA) fouten.push(`${label}: data-thema ${thema}, verwacht ${THEMA}`)
      regels.push(`${label.padEnd(44)} status ${status} · console ${cons.length} · sw ${breed.sw}/${breed.cw} · h1 ${h1} · thema ${thema}${reduced ? ` · onzichtbaar ${onz.length}` : ''}`)
      await browser.close()
    }
  }
}

// Alle interne links op alle pagina's moeten 200 geven.
{
  const { browser, page } = await nieuwePagina(MATEN[0], false)
  const hrefs = new Set()
  for (const pad of PAGINAS.filter((p) => p !== '/bestaat-niet')) {
    await page.goto(BASIS + pad, { waitUntil: 'networkidle' })
    for (const h of await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))) {
      if (h && h.startsWith('/')) hrefs.add(h.split('#')[0] || '/')
    }
  }
  await page.goto(BASIS + '/', { waitUntil: 'networkidle' })
  for (const href of hrefs) {
    const r = await page.request.get(BASIS + href, { maxRedirects: 5 })
    regels.push(`link ${href.padEnd(38)} ${r.status()}`)
    if (r.status() !== 200) fouten.push(`link ${href} geeft ${r.status()}`)
  }
  await browser.close()
}

console.log(regels.join('\n'))
if (fouten.length) { console.error(`\nDOORLOOP ROOD (${fouten.length}):\n- ${fouten.join('\n- ')}`); process.exit(1) }
console.log(`\nDOORLOOP GROEN${THEMA ? ` (thema ${THEMA})` : ''}: ${PAGINAS.length} pagina's × 2 maten × 2 bewegingsstanden en alle interne links.`)
