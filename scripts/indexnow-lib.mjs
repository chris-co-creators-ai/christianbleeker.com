#!/usr/bin/env node
/**
 * Kernlogica voor de automatische IndexNow-ping ná een PRODUCTIE-uitrol. Apart van
 * `scripts/keuring.mjs` (die dit aanroept vanuit `vercel-build`, ná een groene keuring) en
 * `scripts/indexnow.mjs` (de losse, handmatige CLI tegen een al-live site — blijft bestaan voor
 * een losstaande her-ping, bv. ná een grote contentwijziging zonder nieuwe deploy) — zo is dit
 * stukje te testen zonder een `next build`/`next start` op te tuigen, zie
 * `scripts/test-indexnow-lib.mjs`.
 *
 * Draait ALLEEN als `vercelEnv === 'production'` — preview en lokaal doen helemaal niets: geen
 * fetch, geen bestandsschrijf. Zie `docs/SEO.md` § 8 voor de volledige afweging (plek in de
 * pipeline, "alle URL's i.p.v. alleen gewijzigd", de sleutel-aanpak).
 */
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * De IndexNow-sleutel is puur afgeleid van het domein (sha256, eerste 32 hex-tekens) — stabiel
 * zolang het domein niet wijzigt, per site uniek, en hoeft niet geheim te zijn (IndexNow-sleutels
 * zijn publiek, zie bing.com/indexnow). Geen env-var of handmatige `public/<sleutel>.txt`-stap
 * meer nodig: `pingIndexNow` hieronder schrijft 'm zelf, bij elke productie-build opnieuw (net als
 * `.next` bouwoutput, nooit gecommit).
 */
export function indexNowSleutel(domein) {
  return createHash('sha256').update(domein).digest('hex').slice(0, 32)
}

/**
 * @param {object} opties
 * @param {string} opties.domein - `site.domein`, bv. "https://www.voorbeeld.nl" (geen trailing slash).
 * @param {string[]} opties.paden - interne paden uit de sitemap, bv. ["/", "/artikelen"].
 * @param {string|undefined} opties.vercelEnv - `process.env.VERCEL_ENV`.
 * @param {string|undefined} opties.publicDir - map om `<sleutel>.txt` in te schrijven (overslaan = niet schrijven, handig voor een test).
 * @param {string} [opties.endpoint] - IndexNow-endpoint, overschrijfbaar voor een test tegen een lokale mock.
 * @returns {Promise<{gepingd: boolean, reden?: string, status?: number, aantalUrls?: number, body?: object}>}
 */
export async function pingIndexNow({ domein, paden, vercelEnv, publicDir, endpoint = 'https://api.indexnow.org/indexnow' }) {
  if (vercelEnv !== 'production') {
    return { gepingd: false, reden: `VERCEL_ENV=${vercelEnv || '(leeg)'} — geen productie-uitrol, geen ping` }
  }

  const sleutel = indexNowSleutel(domein)
  if (publicDir) {
    await writeFile(path.join(publicDir, `${sleutel}.txt`), sleutel)
  }

  const host = new URL(domein).hostname
  const keyLocation = `${domein}/${sleutel}.txt`
  const urlList = paden.map((pad) => `${domein}${pad}`)
  const body = { host, key: sleutel, keyLocation, urlList }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  return { gepingd: true, status: res.status, aantalUrls: urlList.length, body }
}
