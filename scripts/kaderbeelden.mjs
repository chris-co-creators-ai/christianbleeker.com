#!/usr/bin/env node
/**
 * Schermbeelden van de echte klantsites voor het kader op /work/<slug> (live-demo-kader): het eerste scherm
 * op 1120×680 (de ontwerpmaat van het venster), zonder cookiemelding, naar public/beeld/<slug>-kader-{1680,900}.webp.
 * Opnieuw draaien als een klantsite zichtbaar verandert:  node scripts/kaderbeelden.mjs [slug]
 * Achter een proxy (HTTPS_PROXY) gaat Chromium via die proxy.
 */
import sharp from 'sharp'
import { laadChromium, LAUNCH } from './browser.mjs'
import { cases } from '../src/content/cases.ts'

const alleen = process.argv[2]
const c = await laadChromium()
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null
for (const k of cases.filter((x) => x.url && (!alleen || x.slug === alleen))) {
  // Eén browser per site: met --single-process sluit een gesloten pagina de hele browser.
  const b = await c.launch({ ...LAUNCH, ...(proxy ? { proxy: { server: `http://${proxy.host}`, username: decodeURIComponent(proxy.username), password: decodeURIComponent(proxy.password) } } : {}) })
  const p = await b.newPage({ viewport: { width: 1120, height: 680 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce', locale: 'nl-NL' })
  try {
    await p.goto(k.slug === 'stratenova-advisory' ? `${k.url}/nl/` : k.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {})
    await p.waitForTimeout(2500)
    const knop = p.getByRole('button', { name: /^(accepteren|alles accepteren|accept all|accepteer)$/i }).first()
    if (await knop.count()) { await knop.click().catch(() => {}); await p.waitForTimeout(1500) }
    // Cookiemelding zonder knop met een bekende naam: het vaste blok weghalen (alleen in deze opname).
    await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (/cookies/i.test(el.textContent || '') && getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height < 420) el.remove() }).catch(() => {})
    const png = await p.screenshot()
    await sharp(png).resize(1680).webp({ quality: 72 }).toFile(`public/beeld/${k.slug}-kader-1680.webp`)
    await sharp(png).resize(900).webp({ quality: 74 }).toFile(`public/beeld/${k.slug}-kader-900.webp`)
    console.log('ok', k.slug)
  } catch (e) { console.log('mislukt', k.slug, e.message.slice(0, 120)) }
  await b.close()
}
