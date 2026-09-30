#!/usr/bin/env node
/**
 * Toegankelijkheid ([S]): axe-core op elke pagina (390 en 1440), 0 bevindingen van ernst "serious" of
 * "critical" — ook met het mobiele menu open en met de lightbox open. Daarnaast: skiplink is de
 * eerste tabstop en springt naar #inhoud; de focusring is zichtbaar.
 *
 *   BASIS=http://localhost:PORT node qa/axe.mjs
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pagina, routes, uitslag, TAB } from './lib.mjs'

const axeBron = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const fouten = []
let geslaagd = 0

async function keur(page, label) {
  await page.addScriptTag({ content: axeBron })
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
    return res.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id} (${v.nodes.length}×): ${v.nodes[0]?.target?.join(' ')}`)
  })
  if (r.length) fouten.push(...r.map((x) => `${label}: ${x}`)); else geslaagd++
}

for (const [breedte, hoogte] of [[390, 844], [1440, 900]]) {
  for (const pad of await routes()) {
    const { page, sluit } = await pagina({ breedte, hoogte, reducedMotion: 'reduce' })
    await page.goto(process.env.BASIS + pad, { waitUntil: 'networkidle' })
    await keur(page, `${pad} @${breedte}`)
    if (breedte === 1440 && pad === '/') {
      await page.keyboard.press(TAB)
      const eerste = await page.evaluate(() => ({ href: document.activeElement?.getAttribute('href'), ring: getComputedStyle(document.activeElement).outlineStyle }))
      if (eerste.href === '#inhoud' && eerste.ring !== 'none') geslaagd++
      else fouten.push(`skiplink: eerste tabstop is ${eerste.href}, ring ${eerste.ring}`)
    }
    await sluit()
  }
}

// Met dialogen open.
{
  const { page, sluit } = await pagina({ breedte: 390, hoogte: 844, reducedMotion: 'reduce' })
  await page.goto(process.env.BASIS + '/', { waitUntil: 'networkidle' })
  try {
    await page.click('.im__button', { timeout: 5000 })
    await page.waitForTimeout(300)
    await keur(page, 'menu open @390')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    const dicht = await page.evaluate(() => document.querySelector('.im__button')?.getAttribute('aria-expanded'))
    if (dicht === 'false') geslaagd++; else fouten.push(`menu: Escape sluit het menu niet (aria-expanded=${dicht})`)
  } catch (e) { fouten.push(`menu: de knop Menu is niet te bedienen (${e.message.split('\n')[0]})`) }
  await sluit()
}
{
  const { page, sluit } = await pagina({ breedte: 1440, hoogte: 900, reducedMotion: 'reduce' })
  await page.goto(process.env.BASIS + '/about', { waitUntil: 'networkidle' })
  await page.locator('[data-lightbox]').first().click()
  await page.waitForTimeout(600)
  await keur(page, 'lightbox open @1440')
  await sluit()
}
uitslag('axe', fouten, geslaagd)
