#!/usr/bin/env node
/**
 * Schrijft de voetlijn van lottie-scrub (v3, maker C): "— × — × —", het motief van "Websites × marketing × AI".
 * public/voet/lijn.json (Lottie, 1000×40, 90 frames) + src/components/v3c/voet-lijn-svg.ts (het laatste frame als
 * inline SVG voor zonder JS en "minder beweging"). Eén definitie, dus het eindbeeld klopt altijd.
 * Kleur komt uit CSS (stroke wint van het attribuut): lijnen in --color-lijn-sterk, kruisjes in --color-hoofd.
 *   node scripts/voet-lijn.mjs
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const W = 1000, H = 40, Y = 20, F = 90, K = 11
const stil = (k) => ({ a: 0, k })
const kf = (paren) => ({ a: 1, k: paren.map(([t, v], i) => (i === paren.length - 1 ? { t, s: [v] } : { t, s: [v], e: [paren[i + 1][1]], o: { x: [0.4], y: [0] }, i: { x: [0.2], y: [1] } })) })
const lijn = (a, b, teken) => ({ v: [a, b], teken })
const lijnen = [lijn([2, Y], [300, Y], [0, 30]), lijn([360, Y], [640, Y], [34, 62]), lijn([700, Y], [998, Y], [66, 90])]
const kruis = (x, t) => [lijn([x - K, Y - K], [x + K, Y + K], [t, t + 12]), lijn([x + K, Y - K], [x - K, Y + K], [t + 6, t + 18])]
const kruizen = [...kruis(330, 22), ...kruis(670, 56)]

function groep(d, i, w) {
  const it = [
    { ty: 'sh', ks: stil({ v: d.v, o: [[0, 0], [0, 0]], i: [[0, 0], [0, 0]], c: false }) },
    { ty: 'tm', s: stil(0), e: kf([[0, 0], [d.teken[0], 0], [d.teken[1], 100]]), o: stil(0), m: 1 },
    { ty: 'st', c: stil([0.5, 0.5, 0.5, 1]), o: stil(100), w: stil(w), lc: 2, lj: 2, ml: 4 },
    { ty: 'tr', a: stil([0, 0]), p: stil([0, 0]), s: stil([100, 100]), r: stil(0), o: stil(100), sk: stil(0), sa: stil(0) },
  ]
  return { ty: 'gr', nm: `deel${i}`, it, np: it.length, cix: 2, bm: 0, ix: i + 1 }
}
const laag = (ind, nm, cl, delen, w) => ({
  ddd: 0, ind, ty: 4, nm, cl, sr: 1, ao: 0, ip: 0, op: F, st: 0, bm: 0,
  ks: { o: stil(100), r: stil(0), p: stil([0, 0, 0]), a: stil([0, 0, 0]), s: stil([100, 100, 100]) },
  shapes: delen.map((d, i) => groep(d, i, w)),
})
const json = { v: '5.9.0', fr: 30, ip: 0, op: F, w: W, h: H, nm: 'voet-lijn', ddd: 0, assets: [], layers: [laag(1, 'kruizen', 'vl-kruis', kruizen, 3), laag(2, 'lijnen', 'vl-lijn', lijnen, 2)] }

const pad = (d) => `M${d.v[0][0]} ${d.v[0][1]}L${d.v[1][0]} ${d.v[1][1]}`
const svg = { viewBox: `0 0 ${W} ${H}`, lijnen: lijnen.map(pad).join(''), kruizen: kruizen.map(pad).join('') }

writeFileSync(path.join(ROOT, 'public/voet/lijn.json'), JSON.stringify(json))
writeFileSync(path.join(ROOT, 'src/components/v3c/voet-lijn-svg.ts'), `// Gegenereerd door scripts/voet-lijn.mjs: het laatste frame van public/voet/lijn.json.\nexport const voetLijnSvg = ${JSON.stringify(svg, null, 2)} as const\n`)
console.log('geschreven: public/voet/lijn.json + src/components/v3c/voet-lijn-svg.ts')
