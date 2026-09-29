#!/usr/bin/env node
/**
 * Maakt de vier Lottie-iconen van de vorige site geschikt voor de donkere grond: zwart wordt de
 * tekstkleur (#f5ece3), wit de grondkleur (#17110f), en getallen worden op 3 decimalen afgerond
 * (kleiner bestand, zelfde beeld).
 *
 *   node scripts/lottie.mjs --bron <map met service-1..4.json>
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import path from 'node:path'

const i = process.argv.indexOf('--bron')
if (i < 0) { console.error('Gebruik: node scripts/lottie.mjs --bron <map>'); process.exit(1) }
const TEKST = [0.961, 0.925, 0.89]
const GROND = [0.09, 0.067, 0.059]
mkdirSync('public/lottie', { recursive: true })

const afronden = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
function loop(knoop) {
  if (Array.isArray(knoop)) return knoop.map(loop)
  if (knoop && typeof knoop === 'object') {
    for (const [k, v] of Object.entries(knoop)) {
      if (k === 'c' && v && v.a === 0 && Array.isArray(v.k) && v.k.length >= 3) {
        const [r, g, b] = v.k
        const alfa = v.k.length === 4 ? [v.k[3]] : []
        if (r === 0 && g === 0 && b === 0) v.k = [...TEKST, ...alfa]
        else if (r === 1 && g === 1 && b === 1) v.k = [...GROND, ...alfa]
      }
      knoop[k] = loop(knoop[k])
    }
    return knoop
  }
  return afronden(knoop)
}
for (const n of [1, 2, 3, 4]) {
  const bron = path.join(process.argv[i + 1], `service-${n}.json`)
  const doel = `public/lottie/service-${n}.json`
  writeFileSync(doel, JSON.stringify(loop(JSON.parse(readFileSync(bron, 'utf8')))))
  console.log(doel, (statSync(bron).size / 1024).toFixed(0), '→', (statSync(doel).size / 1024).toFixed(0), 'KB')
}
