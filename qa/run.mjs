#!/usr/bin/env node
/**
 * De hele controlereeks in één commando: `npm run qa`. Exit 0 = alles groen.
 *
 * Volgorde: eerst wat geen server nodig heeft (openbaar, lint, typen, bouw), dan alles tegen een
 * draaiende productiebouw op een vrije poort (een vaste poort meet soms een oude server).
 *
 * Lighthouse draait mee als LH_CLI naar lighthouse/cli/index.js wijst; anders is die stap rood.
 *
 *   npm run qa             de hele reeks (stopt bij de eerste rode stap)
 *   npm run qa -- --alles  alles draaien, ook na een rode stap
 */
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:net'

const alles = process.argv.includes('--alles')
const streep = '─'.repeat(78)
const uitslagen = []
const wacht = (ms) => new Promise((r) => setTimeout(r, ms))
const vrijePoort = () => new Promise((r) => { const s = createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)) }) })

function draai(naam, cmd, args, env = {}) {
  console.log(`\n${streep}\n▸ ${naam}\n${streep}`)
  const t = Date.now()
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } })
  const code = r.status ?? 1
  const s = ((Date.now() - t) / 1000).toFixed(1)
  uitslagen.push({ naam, code, s })
  console.log(`${code === 0 ? '✓' : '✗'} ${naam} — ${code === 0 ? 'groen' : `exit ${code}`} (${s}s)`)
  return code === 0
}

let goed = true
for (const [naam, cmd, args] of [
  ['openbaar — geen dossier, interne paden of sleutels in de repo', 'node', ['qa/openbaar.mjs']],
  ['lint', 'npm', ['run', 'lint']],
  ['typen', 'npm', ['run', 'typecheck']],
  ['bouw', 'npm', ['run', 'build']],
]) {
  goed = draai(naam, cmd, args) && goed
  if (!goed && !alles) break
}

let server
if (goed || alles) {
  const poort = await vrijePoort()
  const basis = `http://localhost:${poort}`
  server = spawn('npx', ['next', 'start', '-p', String(poort)], { stdio: 'ignore' })
  let op = false
  for (let i = 0; i < 80 && !op; i++) { await wacht(250); try { op = (await fetch(basis, { signal: AbortSignal.timeout(1000) })).ok } catch { /* nog niet */ } }
  const bouw = readFileSync('.next/BUILD_ID', 'utf8').trim()
  const html = op ? await (await fetch(basis)).text() : ''
  if (!op || !html.includes(bouw)) { console.log(`✗ de server op ${basis} levert niet bouw ${bouw}`); uitslagen.push({ naam: 'server', code: 1, s: '—' }); goed = false }
  else {
    console.log(`\nserver op ${basis} · bouw ${bouw}`)
    const stappen = [
      ['keuring — SEO, toegankelijkheid, veiligheid', 'node', ['scripts/keuring.mjs', '--url', basis]],
      ['site — routes, h1, canonical, deelplaatje, JSON-LD, 404', 'node', ['qa/site.mjs']],
      ['herkomst — elke zin uit de vorige site of het tekstvoorstel', 'node', ['qa/herkomst.mjs']],
      ['extern — 0 externe verzoeken en 0 cookies vóór een klik', 'node', ['qa/extern.mjs']],
      ['gewicht — home ≤ 1 MB, LCP-beeld ≤ 200 KB, beelden ≤ 300 KB', 'node', ['qa/gewicht.mjs']],
      ['overflow — geen horizontale scroll en geen woordbreuk van 320 tot 1920 px', 'node', ['qa/overflow.mjs']],
      ['axe — 0 ernstige toegankelijkheidsfouten, ook met dialogen open', 'node', ['qa/axe.mjs']],
      ['formulier — controle, spamval, mislukken met uitweg', 'node', ['qa/formulier.mjs']],
      ['onderdelen — werkend op de pagina, ≥ 40 punten', 'node', ['qa/onderdelen.mjs']],
      ['beta — de bevindingen van de beta-tester blijven gerepareerd', 'node', ['qa/beta-reparaties.mjs']],
      ['doorloop — als bezoeker op 390 en 1440, contactbladen', 'node', ['qa/doorloop.mjs']],
      ['lighthouse — toegankelijkheid en praktijk 100, SEO ≥ 95', 'node', ['qa/lighthouse.mjs']],
    ]
    for (const [naam, cmd, args] of stappen) {
      goed = draai(naam, cmd, args, { BASIS: basis }) && goed
      if (!goed && !alles) break
    }
  }
}
server?.kill('SIGTERM')
await wacht(300)

console.log(`\n${streep}\nUITSLAG\n${streep}`)
for (const u of uitslagen) console.log(`${u.code === 0 ? '✓' : '✗'} ${u.naam.padEnd(70)} ${String(u.s).padStart(6)}s`)
const rood = uitslagen.filter((u) => u.code !== 0).length
console.log(`\n${rood ? `${rood} van de ${uitslagen.length} stappen is rood` : `alle ${uitslagen.length} stappen groen`}`)
process.exit(rood ? 1 : 0)
