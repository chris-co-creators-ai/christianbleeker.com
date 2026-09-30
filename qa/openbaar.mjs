#!/usr/bin/env node
/**
 * De repo is openbaar: geen PRD, intake, notities, interne paden of geheimen in wat er gecommit
 * wordt. Leest alle bestanden die git zou meenemen (gevolgd + nieuw, zonder .gitignore) en faalt op
 * elk verboden patroon, met bestand en regel.
 *
 *   node qa/openbaar.mjs
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'

const PATRONEN = [
  [/\/Users\/[a-z]/i, 'absoluut pad op een Mac'],
  [/\bbouwen\/(lab|klanten|plugins|component-library|research|scripts)\b/, 'intern pad van de werkplaats'],
  [/bouwen-werk/, 'intern pad van de werkplaats'],
  [/limabuddy/i, 'privé-account'],
  [/sevekecreative@|limabuddy@/i, 'privé-mailadres'],
  [/\bPRD-\d{3}\b|MEESTERPROMPT|intake\.md|BESLUITEN\.md|BACKLOG\.md/, 'verwijzing naar het dossier'],
  [/human-margin-voorbeeld|klanten\/human-margin/i, 'andere klant'],
  [/(re_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|vercel_[A-Za-z0-9]{20,})/, 'iets dat op een sleutel lijkt'],
  [/RESEND_API_KEY\s*=\s*\S+/, 'ingevulde sleutel'],
]
const UITGEZONDERD = new Set(['qa/openbaar.mjs', 'package-lock.json'])

const bestanden = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split('\n').filter(Boolean).filter((f) => !UITGEZONDERD.has(f))
const fouten = []
let bekeken = 0
for (const f of bestanden) {
  let st
  try { st = statSync(f) } catch { continue }
  if (!st.isFile() || st.size > 2_000_000) continue
  const buf = readFileSync(f)
  if (buf.includes(0)) continue // binair
  bekeken++
  buf.toString('utf8').split('\n').forEach((regel, i) => {
    for (const [re, waarom] of PATRONEN) if (re.test(regel)) fouten.push(`${f}:${i + 1} ${waarom}: ${regel.trim().slice(0, 100)}`)
  })
}
for (const f of fouten.slice(0, 60)) console.log(`  ✗ ${f}`)
if (fouten.length > 60) console.log(`  … en nog ${fouten.length - 60}`)
console.log(`openbaar: ${bekeken} bestanden bekeken, ${fouten.length} gefaald`)
process.exit(fouten.length ? 1 : 0)
