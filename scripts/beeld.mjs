#!/usr/bin/env node
/**
 * Zet het bronbeeld van de oude site om naar AVIF + WebP in de maten die de pagina's gebruiken.
 *
 *   node scripts/beeld.mjs --bron <map met de oude public/chris>
 *
 * De bron is de map `public/chris/` van de vorige versie (tak main). Uitvoer: `public/beeld/`.
 * Human Margin, Hoveniersbedrijf Nijboer en Co-Creators kwamen er op 30-09-2026 bij: hun bron is
 * een schermbeeld van de site zelf (omslag 1086 × 1448, scherm 1499 × 1049), in dezelfde mappen.
 * Elke uitvoer wordt gecontroleerd op het plafond uit de PRD (hero ≤ 200 KB, de rest ≤ 300 KB);
 * een bestand erboven laat het script met exit 1 stoppen.
 */
import { mkdirSync, copyFileSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const i = process.argv.indexOf('--bron')
const bron = i > 0 ? process.argv[i + 1] : null
if (!bron || !existsSync(bron)) {
  console.error('Gebruik: node scripts/beeld.mjs --bron <map met de oude public/chris>')
  process.exit(1)
}
const uit = path.join(process.cwd(), 'public', 'beeld')
mkdirSync(uit, { recursive: true })

const CASES = ['human-margin', 'hoveniersbedrijf-nijboer', 'offbeat-peak', 'digital-waves', 'driftawave', 'radstok-interim', 'fuselabs',
  'souplesse-runners-boutique', 'kinderopvang-ikke', 'win-instituut', 'co-creatie-ai']
const REVIEWS = ['sven', 'gina', 'els', 'annemieke', 'bernard', 'edwin', 'ela']

/** [bronbestand, uitvoernaam, breedtes, plafond in KB] */
const taken = [
  ['media/tedx-stage-original.png', 'tedx', [768, 1280, 1920, 2560], 200],
  ['chris-hero.jpg', 'chris-duimen', [540, 900], 300],
  ['team/chris.png', 'team-chris', [526], 300],
  ['team/brian.jpeg', 'team-brian', [526], 300],
  ['team/lars.png', 'team-lars', [526], 300],
  ['brand/dicteren.png', 'dicteren', [800], 300],
  ['brand/co-creatie.png', 'co-creatie', [600], 300],
  ['brand/co-creators.png', 'co-creators', [640, 1200], 300],
  ['brand/fuselabs.png', 'logo-fuselabs', [256], 300],
  ['brand/kinderopvang-ikke.png', 'logo-kinderopvang-ikke', [150], 300],
  ['brand/offbeat-peak.png', 'logo-offbeat-peak', [291], 300],
  ['brand/win-instituut.png', 'logo-win-instituut', [256], 300],
  ['media/dat_is_wel_speciaal_podcast.jpg', 'podcast', [544], 300],
  ['media/denkproducties_logo.jpg', 'logo-denkproducties', [300], 300],
  ['media/tedxeindhoven-logo.jpeg', 'logo-tedxeindhoven', [200], 300],
  ['media/denkproducties-group.jpg', 'denktank', [800], 300],
  ...CASES.flatMap((c) => [
    [`projects/${c}-cover.png`, `${c}-omslag`, [480, 720, 960], 300],
    [`projects/${c}-hero.png`, `${c}-scherm`, [900, 1500], 300],
  ]),
  ...REVIEWS.map((r) => [`reviews/review_${r}_christian_bleeker_ai_expert.png`, `aanbeveling-${r}`, [800], 300]),
]

const RAND = { 'team/lars.png': 4 }
const SVG = ['digital-waves', 'driftawave', 'radstok-interim', 'souplesse']

let teZwaar = 0
for (const [bestand, naam, breedtes, plafond] of taken) {
  const invoer = path.join(bron, bestand)
  const meta = await sharp(invoer).metadata()
  const rand = RAND[bestand] ?? 0 // witte rand in de bron: links wegsnijden
  for (const b of breedtes) {
    const w = Math.min(b, meta.width)
    const achtervoegsel = breedtes.length > 1 ? `-${b}` : ''
    for (const [fmt, opties] of [['avif', { quality: 55, effort: 6 }], ['webp', { quality: 72 }]]) {
      const doel = path.join(uit, `${naam}${achtervoegsel}.${fmt}`)
      await sharp(invoer).extract({ left: rand, top: 0, width: meta.width - rand, height: meta.height }).resize({ width: w, withoutEnlargement: true })[fmt](opties).toFile(doel)
      const kb = statSync(doel).size / 1024
      if (kb > plafond) { teZwaar++; console.log(`TE ZWAAR ${path.basename(doel)} ${kb.toFixed(0)} KB > ${plafond} KB`) }
    }
  }
}
// Deelplaatje per case (og:image) als JPG: LinkedIn toont geen WebP.
for (const c of CASES) await sharp(path.join(bron, `projects/${c}-hero.png`)).resize({ width: 1200 }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(uit, `${c}-deel.jpg`))
for (const s of SVG) copyFileSync(path.join(bron, 'brand', `${s}.svg`), path.join(uit, `logo-${s}.svg`))
console.log(`${taken.length} beelden omgezet, ${SVG.length} svg-logo's gekopieerd, ${teZwaar} boven het plafond`)
process.exit(teZwaar ? 1 : 0)
