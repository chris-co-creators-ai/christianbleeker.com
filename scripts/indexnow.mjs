#!/usr/bin/env node
/**
 * IndexNow-ping — meldt alle URL's uit `sitemap.xml` bij Bing/Copilot (en andere
 * IndexNow-deelnemers) zodat een nieuwe of gewijzigde pagina niet hoeft te wachten tot de
 * volgende crawl. Geen automatische trigger bij elke Vercel-deploy (geen deploy-hook
 * geconfigureerd in dit template) — draai dit handmatig ná livegang en ná grote
 * inhoudswijzigingen, of koppel het zelf aan een Vercel-deploy-hook. Zie `docs/SEO.md`.
 *
 *   node scripts/indexnow.mjs <basis-url> <sleutel>
 *
 * `<sleutel>` is een willekeurige, zelfgekozen string (32 hex-tekens is de IndexNow-conventie,
 * maar elke unieke tekenreeks werkt). Vóór je dit script draait, moet
 * `public/<sleutel>.txt` bestaan met als enige inhoud die sleutel — dat bewijst aan Bing dat jij
 * de site beheert (https://www.bing.com/indexnow). Dit script genereert dat bestand niet: de
 * sleutel hoort net als `RESEND_API_KEY` per klant/deploy te worden aangemaakt, niet als
 * voorbeeldwaarde in de template te staan.
 */
const [, , basisArg, sleutel] = process.argv

if (!basisArg || !sleutel) {
  console.error('Gebruik: node scripts/indexnow.mjs <basis-url> <sleutel>')
  process.exit(1)
}
const basis = basisArg.replace(/\/$/, '')
const host = new URL(basis).hostname
const keyLocation = `${basis}/${sleutel}.txt`

const sleutelCheck = await fetch(keyLocation).catch(() => null)
if (!sleutelCheck || !sleutelCheck.ok) {
  console.error(`Sleutelbestand niet bereikbaar op ${keyLocation} (maak eerst public/${sleutel}.txt aan met de sleutel als inhoud).`)
  process.exit(1)
}

const sitemapRes = await fetch(`${basis}/sitemap.xml`)
if (!sitemapRes.ok) {
  console.error(`sitemap.xml niet bereikbaar op ${basis} (status ${sitemapRes.status})`)
  process.exit(1)
}
const sitemapXml = await sitemapRes.text()
const urlList = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

console.log(`${urlList.length} URL('s) uit sitemap.xml, ping naar IndexNow …`)
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: sleutel, keyLocation, urlList }),
})
console.log(`IndexNow-antwoord: ${res.status} ${res.statusText}`)
process.exitCode = res.ok ? 0 : 1
