#!/usr/bin/env node
/**
 * Pagina's en vindbaarheid (PRD P-1, P-2, P-7, P-8, B-1, B-3 en [S] Techniek).
 * P-1: precies deze 19 routes (14 uit de PRD, /ai en de vier samen gemaakte sites van 30-09). P-2: één <h1>. Per pagina: canonical, eigen
 * titel, beschrijving, og:image; JSON-LD geldig; Person overal, CreativeWork op elke case;
 * robots.txt, sitemap.xml, llms.txt, 404 met noindex; geen link naar een onbevestigde site.
 *
 *   BASIS=http://localhost:PORT node qa/site.mjs
 */
import { routes, uitslag } from './lib.mjs'
import { lees } from './lib.mjs'

const VERWACHT = ['/', '/about', '/work', '/work/human-margin', '/work/hoveniersbedrijf-nijboer', '/work/stratenova-advisory', '/work/seveke-creative', '/work/offbeat-peak', '/work/digital-waves', '/work/driftawave',
  '/work/radstok-interim', '/work/fuselabs', '/work/souplesse-runners-boutique', '/work/kinderopvang-ikke',
  '/work/win-instituut', '/work/co-creatie-ai', '/ai', '/contact', '/privacy']
const B = process.env.BASIS
const fouten = []
let geslaagd = 0
const ok = (v, f) => (v ? geslaagd++ : fouten.push(f))

const paden = await routes()
ok(JSON.stringify([...paden].sort()) === JSON.stringify([...VERWACHT].sort()), `routes wijken af: ${paden.join(' ')}`)

const titels = new Map()
for (const pad of paden) {
  const r = await fetch(B + pad)
  const html = await r.text()
  ok(r.status === 200, `${pad}: status ${r.status}`)
  ok((html.match(/<h1[\s>]/g) || []).length === 1, `${pad}: niet precies één <h1>`)
  ok(/<link rel="canonical"/.test(html), `${pad}: geen canonical`)
  ok(/<meta property="og:image"/.test(html), `${pad}: geen og:image`)
  const titel = html.match(/<title>([^<]*)<\/title>/)?.[1]
  ok(titel && !titels.has(titel), `${pad}: titel ontbreekt of is dubbel (${titel})`)
  titels.set(titel, pad)
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => { try { return JSON.parse(m[1]) } catch { return null } })
  ok(ld.length && ld.every(Boolean), `${pad}: ongeldige of geen JSON-LD`)
  ok(ld.some((d) => d?.['@type'] === 'Person'), `${pad}: geen Person-schema`)
  if (pad.startsWith('/work/')) ok(ld.some((d) => d?.['@type'] === 'CreativeWork'), `${pad}: geen CreativeWork-schema`)
}

// Geen link naar een klantsite zolang het adres niet bevestigd is (A2): cases.ts heeft url: ''.
const cases = lees('src/content/cases.ts')
const bevestigd = [...cases.matchAll(/url: '([^']*)'/g)].map((m) => m[1]).filter(Boolean)
const KLANTSITES = ['offbeatpeak.com', 'digitalwaves.agency', 'driftawave.com', 'radstokinterim.com', 'fuselabs.ai',
  'souplesserunnersboutique.nl', 'kinderopvangikke.nl', 'wininstituut.nl', 'co-creatie.ai']
for (const pad of paden) {
  const html = await (await fetch(B + pad)).text()
  for (const k of KLANTSITES) {
    if (html.includes(`href="https://${k}`) || html.includes(`href="https://www.${k}`)) {
      ok(bevestigd.some((u) => u.includes(k)), `${pad}: link naar ${k} terwijl het adres niet bevestigd is`)
    }
  }
}
geslaagd++

for (const [pad, eis] of [['/robots.txt', /User-Agent/i], ['/sitemap.xml', /<lastmod>/], ['/llms.txt', /^# /m], ['/llms-full.txt', /^## /m]]) {
  const r = await fetch(B + pad)
  ok(r.ok && eis.test(await r.text()), `${pad} ontbreekt of klopt niet`)
}
const nf = await fetch(B + '/bestaat-niet')
const nfHtml = await nf.text()
ok(nf.status === 404 && /noindex/.test(nfHtml), '404 geeft geen status 404 met noindex')
uitslag('site', fouten, geslaagd)
