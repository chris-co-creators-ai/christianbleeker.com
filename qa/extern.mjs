#!/usr/bin/env node
/**
 * Privacy vóór toestemming (PRD P-5, [S] Techniek): op elke pagina 0 verzoeken naar een ander
 * domein en 0 cookies bij de eerste weergave én na doorscrollen. Daarna de tegenkant: pas een klik
 * op de TEDx-video laadt youtube-nocookie.com (anders zou de toets ook groen zijn als de video stuk is).
 *
 *   BASIS=http://localhost:PORT node qa/extern.mjs
 */
import { pagina, routes, uitslag, scrollDoor } from './lib.mjs'

const eigen = new URL(process.env.BASIS).host
const fouten = []
let geslaagd = 0
for (const pad of await routes()) {
  const { page, context, sluit } = await pagina()
  const extern = []
  page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http') && u.host !== eigen) extern.push(u.host) })
  await page.goto(process.env.BASIS + pad, { waitUntil: 'networkidle' })
  await scrollDoor(page, 600, 60)
  await page.waitForTimeout(500)
  const cookies = await context.cookies()
  if (extern.length) fouten.push(`${pad}: ${extern.length} externe verzoeken (${[...new Set(extern)].join(', ')})`)
  else geslaagd++
  if (cookies.length) fouten.push(`${pad}: ${cookies.length} cookies (${cookies.map((c) => c.name).join(', ')})`)
  else geslaagd++
  await sluit()
}

// Tegenproef: na een klik laadt de video wel.
{
  const { page, sluit } = await pagina()
  const naar = []
  page.on('request', (r) => naar.push(new URL(r.url()).host))
  await page.goto(process.env.BASIS + '/about', { waitUntil: 'networkidle' })
  const knop = page.locator('.vf__play').first()
  await knop.scrollIntoViewIfNeeded()
  await knop.click()
  await page.waitForTimeout(1500)
  if (naar.some((h) => h.endsWith('youtube-nocookie.com'))) geslaagd++
  else fouten.push('/about: na een klik op de TEDx-video geen verzoek naar youtube-nocookie.com')
  await sluit()
}
uitslag('extern', fouten, geslaagd)
