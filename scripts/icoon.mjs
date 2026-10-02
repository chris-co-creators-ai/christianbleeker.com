#!/usr/bin/env node
/**
 * Tabblad- en app-iconen uit het beeldmerk van Co-Creators.ai (blauwe C, van co-creators.ai) op de
 * crème grond van de site, met rand (maskable snijdt tot 20% weg). Schrijft public/favicon.ico (16, 32, 48)
 * en public/icoon-cc-180.png (Apple), -192.png en -512.png (manifest).
 *
 *   node scripts/icoon.mjs --bron <map met brand/co-creators-mark.svg>
 */
import { writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const i = process.argv.indexOf('--bron')
const bron = i > 0 ? path.join(process.argv[i + 1], 'brand/co-creators-mark.svg') : null
if (!bron || !existsSync(bron)) { console.error('Gebruik: node scripts/icoon.mjs --bron <map>'); process.exit(1) }
const GROND = '#f5ece3'

async function icoon(maat, deel) {
  const teken = await sharp(bron, { density: 600 }).trim().resize({ width: Math.round(maat * deel), height: Math.round(maat * deel), fit: 'inside' }).toBuffer()
  return sharp({ create: { width: maat, height: maat, channels: 4, background: GROND } })
    .composite([{ input: teken, gravity: 'center' }]).png().toBuffer()
}

for (const [maat, deel] of [[180, 0.7], [192, 0.62], [512, 0.62]]) writeFileSync(`public/icoon-cc-${maat}.png`, await icoon(maat, deel))

// ICO met PNG-afbeeldingen erin (door alle huidige browsers gelezen).
const pngs = await Promise.all([16, 32, 48].map((m) => icoon(m, 0.86)))
const kop = Buffer.alloc(6 + 16 * pngs.length)
kop.writeUInt16LE(0, 0); kop.writeUInt16LE(1, 2); kop.writeUInt16LE(pngs.length, 4)
let plek = kop.length
pngs.forEach((p, n) => {
  const m = [16, 32, 48][n], o = 6 + 16 * n
  kop.writeUInt8(m, o); kop.writeUInt8(m, o + 1); kop.writeUInt16LE(1, o + 4); kop.writeUInt16LE(32, o + 6)
  kop.writeUInt32LE(p.length, o + 8); kop.writeUInt32LE(plek, o + 12); plek += p.length
})
writeFileSync('public/favicon.ico', Buffer.concat([kop, ...pngs]))
console.log('iconen geschreven: favicon.ico (16/32/48), icoon-cc-180/192/512.png')
