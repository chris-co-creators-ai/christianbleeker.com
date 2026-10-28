// Reproductie WebKit-slot op de Home (maker A, 28-10). Draai vanuit wt-a-home of de site-map:
//   PLAYWRIGHT_BROWSERS_PATH=/Users/sevekecreative/Documents/bouwen-werk/machine/playwright-browsers BROWSER=webkit BASIS_URL=http://localhost:<poort> node qa/v2-a/webkit-slot.mjs
import { laadChromium, LAUNCH, BASIS } from '../../scripts/browser.mjs'
const motor = await laadChromium()
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const b = await motor.launch(LAUNCH)
  const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: w < 500 })
  const stand = () => p.evaluate(() => ({ y: Math.round(scrollY), htmlOv: getComputedStyle(document.documentElement).overflow, htmlInline: document.documentElement.style.overflow, bodyOv: getComputedStyle(document.body).overflow, bodyInline: document.body.style.overflow, intro: (() => { const e = document.querySelector('[data-punt-zoom-intro]'); return e ? { hidden: e.hidden, display: getComputedStyle(e).display } : null })() }))
  await p.goto(BASIS + '/', { waitUntil: 'networkidle' })
  console.log(w, 'na laden', JSON.stringify(await stand()))
  await p.waitForTimeout(4000)
  console.log(w, 'na 4 s', JSON.stringify(await stand()))
  await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(1200)
  console.log(w, 'na scrollTo(0,2000)', JSON.stringify(await stand()))
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(1200)
  await p.mouse.move(w / 2, h / 2); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 400); await p.waitForTimeout(150) }
  await p.waitForTimeout(1000)
  console.log(w, 'na wheel 6x400', JSON.stringify(await stand()))
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(1200)
  console.log(w, 'tweede bezoek, scrollTo(0,2000)', JSON.stringify(await stand()))
  await b.close()
}
