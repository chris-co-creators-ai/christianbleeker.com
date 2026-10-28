#!/usr/bin/env node
/**
 * animaties/maak.mjs — schrijft de 8 kaart-Lotties, de hoofd-Lottie en de
 * statische SVG's (iconen/*.svg) uit één definitie. Zo is frame 0 van elke
 * kaart-Lottie altijd exact gelijk aan zijn SVG-terugval, en is het laatste
 * frame van de hoofd-Lottie exact het icoon van kaart 1: de overdracht valt
 * daardoor niet op.
 *
 * Draaien: `node animaties/maak.mjs` (vanuit de featuremap). Alleen nodig als
 * je een icoon of de lijnkleur wijzigt; de uitvoer staat al in de map.
 *
 * Eigen tekeningen (Seveke Creative), 100×100, lijndikte 2,5, 30 fps.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// christianbleeker.com: uitvoer naar public/kaartenrij/ (Lottie en SVG naast elkaar), in de hoofdkleur van het donkere thema;
// het witte thema dimt het icoon met een filter (site.css), zodat SVG en Lottie altijd dezelfde kleur hebben.
const HIER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../public/kaartenrij");
const KLEUR = [0.941, 0.325, 0.227]; // #f0533a, --color-hoofd (donker)
const KLEUR_HEX = '#f0533a';
const LIJN = 2.5;
const FPS = 30;

// ---------- kleine Lottie-bouwers ----------
const stil = (k) => ({ a: 0, k });
function kf(paren) {
  // paren: [[frame, waarde], …]; waarde is getal of array
  return {
    a: 1,
    k: paren.map(([t, v], i) => {
      const s = Array.isArray(v) ? v : [v];
      if (i === paren.length - 1) return { t, s };
      const e = paren[i + 1][1];
      return { t, s, e: Array.isArray(e) ? e : [e], o: { x: [0.45], y: [0] }, i: { x: [0.55], y: [1] } };
    }),
  };
}
const ellips = (p, s) => ({ ty: 'el', d: 1, p: stil(p), s: stil(s) });
const rechthoek = (p, s, r = 0) => ({ ty: 'rc', d: 1, p: stil(p), s: stil(s), r: stil(r) });
/** pad: v = punten; optioneel o/i = raaklijnen (relatief), dicht = gesloten */
function pad(v, { o, i, dicht = false } = {}) {
  const nul = v.map(() => [0, 0]);
  return { ty: 'sh', ks: stil({ v, o: o || nul, i: i || nul, c: dicht }), _svg: { v, o: o || nul, i: i || nul, dicht } };
}

/**
 * groep: items + optionele animatie (offsets t.o.v. rust) en tekenbereik.
 * anim: { p: [[t,[dx,dy]]…], r: [[t,graden]…], s: [[t,[sx,sy]]…], o: [[t,%]…] }
 * teken: [beginFrame, eindFrame] → trim paths 0 → 100 %.
 */
function groep(items, { anker = [50, 50], anim = {}, teken } = {}) {
  return { items, anker, anim, teken };
}

function lottieGroep({ items, anker, anim, teken }, idx) {
  const it = items.map(({ _svg, ...rest }) => rest);
  if (teken) {
    it.push({ ty: 'tm', s: stil(0), e: kf([[0, 0], [teken[0], 0], [teken[1], 100]]), o: stil(0), m: 1 });
  }
  it.push({ ty: 'st', c: stil([...KLEUR, 1]), o: stil(100), w: stil(LIJN), lc: 2, lj: 2, ml: 4 });
  it.push({
    ty: 'tr',
    a: stil(anker),
    p: anim.p ? kf(anim.p.map(([t, d]) => [t, [anker[0] + d[0], anker[1] + d[1]]])) : stil(anker),
    s: anim.s ? kf(anim.s) : stil([100, 100]),
    r: anim.r ? kf(anim.r) : stil(0),
    o: anim.o ? kf(anim.o) : stil(100),
    sk: stil(0),
    sa: stil(0),
  });
  return { ty: 'gr', nm: `g${idx}`, it, np: it.length, cix: 2, bm: 0, ix: idx + 1 };
}

function lottie(naam, groepen, frames) {
  return {
    v: '5.9.0', fr: FPS, ip: 0, op: frames, w: 100, h: 100, nm: naam, ddd: 0, assets: [],
    layers: [{
      ddd: 0, ind: 1, ty: 4, nm: naam, sr: 1, ao: 0, ip: 0, op: frames, st: 0, bm: 0,
      ks: { o: stil(100), r: stil(0), p: stil([0, 0, 0]), a: stil([0, 0, 0]), s: stil([100, 100, 100]) },
      shapes: groepen.map(lottieGroep),
    }],
  };
}

// ---------- SVG (rusttoestand = frame 0) ----------
function svgItem(item) {
  if (item.ty === 'el') {
    const [cx, cy] = item.p.k; const [w, h] = item.s.k;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}"/>`;
  }
  if (item.ty === 'rc') {
    const [cx, cy] = item.p.k; const [w, h] = item.s.k;
    return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${item.r.k}"/>`;
  }
  const { v, o, i, dicht } = item._svg;
  let d = `M${v[0][0]} ${v[0][1]}`;
  const n = dicht ? v.length : v.length - 1;
  for (let k = 0; k < n; k++) {
    const a = v[k]; const b = v[(k + 1) % v.length];
    const c1 = [a[0] + o[k][0], a[1] + o[k][1]];
    const c2 = [b[0] + i[(k + 1) % v.length][0], b[1] + i[(k + 1) % v.length][1]];
    const recht = !o[k][0] && !o[k][1] && !i[(k + 1) % v.length][0] && !i[(k + 1) % v.length][1];
    d += recht ? ` L${b[0]} ${b[1]}` : ` C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
  }
  if (dicht) d += ' Z';
  return `<path d="${d}"/>`;
}
function svg(groepen) {
  const delen = groepen
    .filter((g) => !(g.anim.o && g.anim.o[0][1] === 0)) // onzichtbaar in rust → niet in de terugval
    .flatMap((g) => g.items.map(svgItem));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="${KLEUR_HEX}" stroke-width="${LIJN}" stroke-linecap="round" stroke-linejoin="round">${delen.join('')}</svg>\n`;
}

// ---------- de acht iconen (rust = frame 0 = frame 90) ----------
const L = 90; // 3 s per lus
const iconen = {
  doelgroep: [
    groep([ellips([50, 38], [26, 26])], { anker: [50, 38], anim: { p: [[0, [0, 0]], [14, [0, -5]], [28, [0, 0]], [40, [0, -2]], [52, [0, 0]], [L, [0, 0]]] } }),
    groep([pad([[26, 82], [74, 82]], { o: [[0, -26], [0, 0]], i: [[0, 0], [0, -26]] })], { anker: [50, 82], anim: { s: [[0, [100, 100]], [14, [104, 96]], [28, [100, 100]], [L, [100, 100]]] } }),
  ],
  positionering: [
    groep([ellips([50, 50], [56, 56])], { anim: { s: [[0, [100, 100]], [30, [110, 110]], [60, [100, 100]], [L, [100, 100]]] } }),
    groep([pad([[50, 12], [50, 22]]), pad([[50, 78], [50, 88]]), pad([[12, 50], [22, 50]]), pad([[78, 50], [88, 50]])]),
    groep([ellips([50, 50], [8, 8])], { anim: { p: [[0, [0, 0]], [22, [13, -11]], [46, [-9, 7]], [68, [0, 0]], [L, [0, 0]]] } }),
  ],
  plaats: [
    groep([ellips([50, 86], [30, 6])], { anker: [50, 86], anim: { s: [[0, [100, 100]], [18, [70, 100]], [36, [100, 100]], [L, [100, 100]]] } }),
    groep([
      pad([[50, 80], [30, 42], [50, 22], [70, 42]], { dicht: true, o: [[-8, -14], [0, -11], [11, 0], [0, 14]], i: [[8, -14], [0, 14], [-11, 0], [0, -11]] }),
      ellips([50, 42], [14, 14]),
    ], { anker: [50, 80], anim: { p: [[0, [0, 0]], [18, [0, -9]], [36, [0, 0]], [46, [0, -3]], [56, [0, 0]], [L, [0, 0]]] } }),
  ],
  prijs: [
    groep([pad([[50, 60], [41, 76], [59, 76]], { dicht: true }), pad([[28, 82], [72, 82]])]),
    groep([pad([[18, 60], [82, 60]]), rechthoek([27, 51], [14, 14], 1.5), ellips([73, 52], [14, 14])], { anker: [50, 60], anim: { r: [[0, 0], [24, -11], [50, 8], [72, 0], [L, 0]] } }),
  ],
  product: [
    groep([rechthoek([50, 62], [46, 36], 2.5), pad([[50, 44], [50, 80]])]),
    groep([rechthoek([50, 38], [52, 10], 2.5)], { anker: [24, 43], anim: { r: [[0, 0], [22, -20], [44, 0], [L, 0]] } }),
    groep([pad([[50, 22], [50, 13]]), pad([[37, 26], [31, 19]]), pad([[63, 26], [69, 19]])], { anker: [50, 26], anim: { o: [[0, 0], [14, 0], [24, 100], [40, 0], [L, 0]], s: [[0, [80, 80]], [24, [105, 105]], [40, [115, 115]], [L, [80, 80]]] } }),
  ],
  promotie: [
    groep([pad([[22, 44], [50, 30], [50, 70], [22, 56]], { dicht: true }), pad([[30, 59], [35, 74]])], { anker: [36, 50], anim: { r: [[0, 0], [16, -4], [32, 0], [L, 0]] } }),
    groep([
      pad([[60, 40], [60, 60]], { o: [[6, 5], [0, 0]], i: [[0, 0], [6, -5]] }),
      pad([[67, 31], [67, 69]], { o: [[12, 9], [0, 0]], i: [[0, 0], [12, -9]] }),
    ], { anker: [56, 50], anim: { s: [[0, [100, 100]], [16, [116, 116]], [32, [100, 100]], [L, [100, 100]]], o: [[0, 100], [16, 35], [32, 100], [L, 100]] } }),
  ],
  presentatie: [
    groep([rechthoek([50, 44], [62, 42], 3), pad([[50, 65], [50, 76]]), pad([[37, 78], [63, 78]])]),
    groep([pad([[38, 56], [38, 47]]), pad([[50, 56], [50, 36]]), pad([[62, 56], [62, 42]])], { anker: [50, 56], anim: { s: [[0, [100, 100]], [20, [100, 45]], [44, [100, 112]], [60, [100, 100]], [L, [100, 100]]] } }),
  ],
  prestaties: [
    groep([pad([[20, 20], [20, 80], [82, 80]])]),
    groep([pad([[28, 68], [43, 55], [55, 61], [74, 36]]), pad([[64, 36], [74, 36], [74, 46]])], { anker: [28, 68], anim: { p: [[0, [0, 0]], [24, [2, -6]], [48, [0, 0]], [L, [0, 0]]], s: [[0, [100, 100]], [24, [104, 108]], [48, [100, 100]], [L, [100, 100]]] } }),
  ],
};

for (const [naam, groepen] of Object.entries(iconen)) {
  writeFileSync(path.join(HIER, `${naam}.json`), JSON.stringify(lottie(naam, groepen, L)));
  writeFileSync(path.join(HIER, `${naam}.svg`), svg(groepen));
}

// Hoofd-Lottie: het doelgroep-icoon tekent zich (geen lus). Laatste frame = rust van kaart 1.
const hoofd = [
  groep(iconen.doelgroep[0].items, { anker: [50, 38], teken: [0, 40] }),
  groep(iconen.doelgroep[1].items, { anker: [50, 82], teken: [18, 60] }),
];
writeFileSync(path.join(HIER, 'hoofd.json'), JSON.stringify(lottie('hoofd', hoofd, 61)));

console.log(`geschreven: ${Object.keys(iconen).length} kaart-Lotties + hoofd.json + ${Object.keys(iconen).length} SVG's`);
