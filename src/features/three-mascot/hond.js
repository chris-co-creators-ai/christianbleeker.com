/**
 * three-mascot — vorm "hond"
 * ------------------------------------------------------------------------
 * Eigen procedurele hond, "geboetseerd" in plaats van in elkaar gezet uit
 * bollen: elk lichaamsdeel is een signed-distance-vorm, de vormen smelten
 * met een zachte unie in elkaar (smin) en worden bij het laden met
 * surface nets tot één doorlopende mesh gemaakt. Normalen komen uit de
 * gradiënt van het veld (glad, ook bij een grof raster) en de aftekening
 * is een vertexkleur met zachte overgangen. Geen assets van derden.
 *
 * Losse meshes alleen waar iets beweegt of een ander materiaal heeft:
 * lijf · kop · 2 oren · staart · neus · ogen · tong · halsband · penning.
 *
 * Gedrag: de KOP volgt de muis over de hele pagina, oren zwaaien na, staart
 * kwispelt bij beweging, kop gaat schuin bij stilstand, knipperen, ademen;
 * zonder muis kijkt hij met de scroll mee.
 *
 * Kleuren zijn opties: init(root, { vorm: 'hond', kleuren: { vacht: 0x8a5634, ... } }).
 * Licht en thema: lichtHond() zet het eigen lichtplan; pasThemaToe() stemt
 * randlicht en schaduw af op een lichte of donkere achtergrond.
 */

const STANDAARD = {
  vacht: 0x8f5a35, // warm kaneelbruin: leest op papier én op donker
  vachtDonker: 0x5e3720, // rug, oren
  aftekening: 0xe2bf86, // snuit, bef, poten, wenkbrauwen
  neus: 0x23160f,
  oog: 0x2a170c,
  tong: 0xd9786f,
  bek: 0x4a1d17,
  halsband: 0x5f9e45,
  penning: 0xe0b860,
  schaduw: 0x1d120b,
};

// --- signed distance functions ---------------------------------------------------------------
const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
function ellips(px, py, pz, c, r) {
  const x = (px - c[0]) / r[0], y = (py - c[1]) / r[1], z = (pz - c[2]) / r[2];
  const k0 = len(x, y, z);
  const k1 = len(x / r[0], y / r[1], z / r[2]);
  return k1 > 1e-6 ? (k0 * (k0 - 1)) / k1 : -Math.min(r[0], r[1], r[2]);
}
// kegel met ronde uiteinden van a (straal ra) naar b (straal rb), benadering die voor zachte vormen volstaat
function staaf(px, py, pz, a, b, ra, rb) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const qx = px - a[0], qy = py - a[1], qz = pz - a[2];
  const h = Math.max(0, Math.min(1, (qx * bx + qy * by + qz * bz) / (bx * bx + by * by + bz * bz)));
  return len(qx - bx * h, qy - by * h, qz - bz * h) - (ra + (rb - ra) * h);
}
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function smax(a, b, k) { return -smin(-a, -b, k); }
const sstap = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// --- vormen (lokale coördinaten; +z = naar de kijker, grond op y = -2) ------------------------
function lijfSdf(x, y, z) {
  const ax = Math.abs(x);
  let d = ellips(x, y, z, [0, -0.7, 0.1], [0.66, 0.84, 0.64]); // borstkas
  d = smin(d, ellips(x, y, z, [0, -1.42, -0.42], [0.74, 0.56, 0.78]), 0.45); // achterlijf
  d = smin(d, ellips(ax, y, z, [0.52, -1.5, -0.2], [0.38, 0.47, 0.64]), 0.28); // dijen
  d = smin(d, ellips(ax, y, z, [0.66, -1.9, 0.3], [0.2, 0.12, 0.34]), 0.16); // achterpoten
  d = smin(d, staaf(ax, y, z, [0.26, -0.82, 0.44], [0.27, -1.8, 0.6], 0.18, 0.135), 0.2); // voorpoten
  d = smin(d, ellips(ax, y, z, [0.28, -1.9, 0.7], [0.175, 0.115, 0.23]), 0.1); // voorvoeten
  d = smin(d, staaf(x, y, z, [0, -0.3, 0.06], [0, 0.32, 0.16], 0.44, 0.38), 0.3); // nek
  // zachte groef tussen de voorpoten: twee poten in plaats van één stam
  d = smax(d, -ellips(x, y, z, [0, -1.5, 0.78], [0.075, 0.42, 0.3]), 0.1);
  return smax(d, -1.985 - y, 0.05); // platte, licht afgeronde voetzolen (een harde knik gaf een lichtrand)
}
function lijfKleur(x, y, z, k, uit) {
  const ax = Math.abs(x);
  // bef: druppel op de borst
  // bef: van de keel naar de borst, met een strakkere rand (minder airbrush)
  const bef = 1 - sstap(-0.03, 0.035, Math.min(
    ellips(x, y, z, [0, -0.42, 0.6], [0.2, 0.6, 0.32]),
    ellips(x, y, z, [0, 0.05, 0.42], [0.16, 0.36, 0.3]),
  ));
  // poten: sokken
  const sok = 1 - sstap(-1.7, -1.62, y);
  // rug iets donkerder (zadel)
  const zadel = sstap(-0.3, 0.6, -z * 0.8 + (y + 0.8) * 0.35) * 0.55;
  menging(uit, k.vacht, k.vachtDonker, zadel);
  menging(uit, uit, k.aftekening, Math.max(bef, sok * (ax > 0.1 ? 1 : 0)));
}

function kopSdf(x, y, z) {
  const ax = Math.abs(x);
  let d = ellips(x, y, z, [0, 0.12, -0.05], [0.62, 0.58, 0.6]); // schedel
  d = smin(d, ellips(ax, y, z, [0.3, -0.14, 0.2], [0.34, 0.3, 0.36]), 0.25); // wangen
  d = smin(d, ellips(x, y, z, [0, -0.12, 0.52], [0.31, 0.25, 0.42]), 0.28); // snuit
  d = smin(d, ellips(x, y, z, [0, -0.3, 0.42], [0.22, 0.13, 0.3]), 0.14); // kin
  d = smin(d, ellips(ax, y, z, [0.21, 0.2, 0.42], [0.17, 0.09, 0.13]), 0.14); // wenkbrauwboog
  // oogkassen: zachte uitsparing waarin de ogen liggen
  d = smax(d, -ellips(ax, y, z, [0.24, 0.07, 0.6], [0.1, 0.09, 0.1]), 0.08);
  return d;
}
function kopKleur(x, y, z, k, uit) {
  const ax = Math.abs(x);
  const snuit = 1 - sstap(-0.03, 0.02, ellips(x, y, z, [0, -0.15, 0.5], [0.4, 0.32, 0.6]));
  const brauw = 1 - sstap(-0.02, 0.03, ellips(ax, y, z, [0.21, 0.27, 0.47], [0.08, 0.05, 0.08]));
  const bles = 1 - sstap(-0.03, 0.05, ellips(x, y, z, [0, 0.32, 0.5], [0.06, 0.22, 0.2]));
  const kruin = sstap(0.1, 0.6, y - z * 0.3) * 0.5;
  menging(uit, k.vacht, k.vachtDonker, kruin);
  menging(uit, uit, k.aftekening, Math.max(snuit, brauw, bles * 0.9));

}

function oorSdf(x, y, z) {
  // hangoor: afgeplatte druppel die naar onderen breder en dunner wordt
  const dik = 0.07 + 0.03 * sstap(0, -0.6, y);
  let d = ellips(x, y, z, [0, -0.36, 0.02], [dik, 0.44, 0.24]);
  d = smin(d, ellips(x, y, z, [0, -0.02, 0], [0.1, 0.14, 0.16]), 0.12);
  return d;
}
function staartSdf(x, y, z) {
  let d = staaf(x, y, z, [0, 0, 0], [0.38, 0.06, -0.12], 0.15, 0.13);
  d = smin(d, staaf(x, y, z, [0.38, 0.06, -0.12], [0.64, 0.34, -0.14], 0.13, 0.1), 0.08);
  d = smin(d, staaf(x, y, z, [0.64, 0.34, -0.14], [0.7, 0.7, -0.02], 0.1, 0.06), 0.06);
  return d;
}

// --- surface nets ---------------------------------------------------------------------------
const tmpKleur = { r: 0, g: 0, b: 0 };
function menging(uit, a, b, t) {
  const ar = a.r, ag = a.g, ab = a.b;
  uit.r = ar + (b.r - ar) * t; uit.g = ag + (b.g - ag) * t; uit.b = ab + (b.b - ab) * t;
}

/**
 * Maakt van een afstandsveld een gladde mesh (surface nets, Lysenko 2012) binnen [min,max]
 * met rasterstap `stap`. Hoekpunten worden op het oppervlak geprojecteerd; normaal = gradiënt.
 */
function veldNaarMesh(THREE, sdf, min, max, stap, kleur) {
  const nx = Math.ceil((max[0] - min[0]) / stap) + 1;
  const ny = Math.ceil((max[1] - min[1]) / stap) + 1;
  const nz = Math.ceil((max[2] - min[2]) / stap) + 1;
  const v = new Float32Array(nx * ny * nz);
  for (let k = 0, n = 0; k < nz; k += 1) for (let j = 0; j < ny; j += 1) for (let i = 0; i < nx; i += 1, n += 1) {
    v[n] = sdf(min[0] + i * stap, min[1] + j * stap, min[2] + k * stap);
  }
  const at = (i, j, k) => v[i + nx * (j + ny * k)];
  const cx = nx - 1, cy = ny - 1;
  const cel = new Int32Array(cx * cy * (nz - 1)).fill(-1);
  const pos = [], nor = [], col = [];
  const e = stap * 0.5;
  const grad = (x, y, z) => {
    const gx = sdf(x + e, y, z) - sdf(x - e, y, z);
    const gy = sdf(x, y + e, z) - sdf(x, y - e, z);
    const gz = sdf(x, y, z + e) - sdf(x, y, z - e);
    const l = len(gx, gy, gz) || 1;
    return [gx / l, gy / l, gz / l];
  };
  const H = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const R = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const w = new Float32Array(8);
  for (let k = 0; k < nz - 1; k += 1) for (let j = 0; j < cy; j += 1) for (let i = 0; i < cx; i += 1) {
    let binnen = 0;
    for (let c = 0; c < 8; c += 1) { w[c] = at(i + H[c][0], j + H[c][1], k + H[c][2]); if (w[c] < 0) binnen += 1; }
    if (binnen === 0 || binnen === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of R) {
      if ((w[a] < 0) === (w[b] < 0)) continue;
      const t = w[a] / (w[a] - w[b]);
      sx += H[a][0] + (H[b][0] - H[a][0]) * t;
      sy += H[a][1] + (H[b][1] - H[a][1]) * t;
      sz += H[a][2] + (H[b][2] - H[a][2]) * t;
      n += 1;
    }
    let x = min[0] + (i + sx / n) * stap, y = min[1] + (j + sy / n) * stap, z = min[2] + (k + sz / n) * stap;
    for (let it = 0; it < 2; it += 1) { // op het oppervlak trekken
      const d = sdf(x, y, z); const g = grad(x, y, z);
      x -= g[0] * d; y -= g[1] * d; z -= g[2] * d;
    }
    const g = grad(x, y, z);
    kleur(x, y, z, tmpKleur);
    cel[i + cx * (j + cy * k)] = pos.length / 3;
    pos.push(x, y, z); nor.push(g[0], g[1], g[2]); col.push(tmpKleur.r, tmpKleur.g, tmpKleur.b);
  }
  const idx = [];
  const ci = (i, j, k) => cel[i + cx * (j + cy * k)];
  const quad = (a, b, c, d, binnen) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (binnen) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz - 1; k += 1) for (let j = 1; j < ny - 1; j += 1) for (let i = 1; i < nx - 1; i += 1) {
    const s0 = at(i, j, k) < 0;
    if (i < nx - 1 && s0 !== (at(i + 1, j, k) < 0)) quad(ci(i, j - 1, k - 1), ci(i, j, k - 1), ci(i, j, k), ci(i, j - 1, k), s0);
    if (j < ny - 1 && s0 !== (at(i, j + 1, k) < 0)) quad(ci(i - 1, j, k - 1), ci(i - 1, j, k), ci(i, j, k), ci(i, j, k - 1), s0);
    if (k < nz - 1 && s0 !== (at(i, j, k + 1) < 0)) quad(ci(i - 1, j - 1, k), ci(i, j - 1, k), ci(i, j, k), ci(i - 1, j, k), s0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

// straal van buitenaf op het veld afschieten: waar raakt hij het oppervlak?
function raak(sdf, o, r) {
  let t = 0;
  for (let i = 0; i < 80; i += 1) {
    const d = sdf(o[0] + r[0] * t, o[1] + r[1] * t, o[2] + r[2] * t);
    if (d < 1e-4) break;
    t += d;
  }
  return [o[0] + r[0] * t, o[1] + r[1] * t, o[2] + r[2] * t];
}

export function bouwHond(THREE, kleuren = {}) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const hex = { ...STANDAARD, ...kleuren };
  const k = {};
  for (const n of Object.keys(hex)) k[n] = new THREE.Color(hex[n]); // sRGB → lineair
  const g = new THREE.Group();

  // vacht: mat, met sheen voor het zachte, fluweelachtige randje dat vacht van klei onderscheidt
  const vachtMat = () => new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.82, metalness: 0,
    sheen: 0.7, sheenRoughness: 0.55, sheenColor: new THREE.Color(hex.aftekening),
  });
  // alleen de grond vangt schaduw: zelfschaduw gaf harde vlekken op kop en borst
  const schaduwen = (m) => { m.castShadow = true; return m; };

  const lijf = schaduwen(new THREE.Mesh(
    veldNaarMesh(THREE, lijfSdf, [-1.05, -2.12, -1.4], [1.05, 1.0, 1.2], 0.04, (x, y, z, o) => lijfKleur(x, y, z, k, o)),
    vachtMat(),
  ));
  g.add(lijf);

  const kop = new THREE.Group(); kop.position.set(0, 0.72, 0.3); kop.scale.setScalar(1.2); g.add(kop);
  const kopMesh = schaduwen(new THREE.Mesh(
    veldNaarMesh(THREE, kopSdf, [-0.85, -0.6, -0.8], [0.85, 0.85, 1.05], 0.024, (x, y, z, o) => kopKleur(x, y, z, k, o)),
    vachtMat(),
  ));
  kop.add(kopMesh);

  const neus = schaduwen(new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 32, 20),
    new THREE.MeshPhysicalMaterial({ color: hex.neus, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.35 }),
  ));
  const neusPunt = raak(kopSdf, [0, -0.02, 2], [0, 0, -1]);
  neus.position.set(0, neusPunt[1] + 0.02, neusPunt[2] - 0.02); neus.scale.set(1.25, 0.82, 0.85); kop.add(neus);

  // mond: een dunne buis over het oppervlak (scherp, onafhankelijk van het raster):
  // korte streep onder de neus, dan twee boogjes omhoog naar de mondhoeken
  const mondMat = new THREE.MeshStandardMaterial({ color: hex.bek, roughness: 0.6 });
  const opSnuit = (x, y) => { const q = raak(kopSdf, [x, y, 2], [0, 0, -1]); return new THREE.Vector3(q[0], q[1], q[2] - 0.004); };
  const mondPad = (pts) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.013, 8), mondMat);
  const midY = neusPunt[1] - 0.17;
  kop.add(mondPad([opSnuit(0, neusPunt[1] - 0.07), opSnuit(0, midY + 0.03), opSnuit(0, midY)]));
  for (const s of [-1, 1]) {
    kop.add(mondPad([opSnuit(0, midY), opSnuit(s * 0.07, midY - 0.04), opSnuit(s * 0.15, midY - 0.02), opSnuit(s * 0.21, midY + 0.04)]));
  }
  const tong = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), new THREE.MeshStandardMaterial({ color: hex.tong, roughness: 0.45 }));
  const tongP = opSnuit(0.025, midY - 0.06);
  tong.position.set(0.025, midY - 0.075, tongP.z - 0.03); tong.scale.set(0.62, 0.95, 0.4); tong.rotation.set(-0.35, 0, -0.08); kop.add(tong);

  const oogMat = new THREE.MeshPhysicalMaterial({ color: hex.oog, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
  const glimMat = new THREE.MeshBasicMaterial({ color: 0xfffaf0 });
  const ogen = [];
  for (const s of [-1, 1]) {
    const p = raak(kopSdf, [s * 0.25, 0.07, 2], [0, 0, -1]);
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.092, 32, 20), oogMat);
    o.position.set(s * 0.25, 0.07, p[2] - 0.035); kop.add(o); ogen.push(o);
    const glim = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), glimMat);
    glim.position.set(-0.028, 0.035, 0.074); o.add(glim);
  }

  const oorGeo = veldNaarMesh(THREE, oorSdf, [-0.2, -0.85, -0.3], [0.2, 0.18, 0.32], 0.022, (x, y, z, o) => menging(o, k.vachtDonker, k.vacht, sstap(0.05, -0.2, y) * 0.25));
  const oren = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.52, 0.36, 0.02); kop.add(piv);
    const oor = schaduwen(new THREE.Mesh(oorGeo, vachtMat()));
    oor.scale.set(1, 1.15, 1.1); oor.rotation.set(0.05, s * -0.2, s * 0.12); piv.add(oor);
    piv.userData.s = s; oren.push(piv);
  }

  const staart = new THREE.Group(); staart.position.set(0.4, -1.84, -0.92); g.add(staart);
  staart.add(schaduwen(new THREE.Mesh(
    veldNaarMesh(THREE, staartSdf, [-0.18, -0.18, -0.32], [0.86, 0.8, 0.16], 0.025, (x, y, z, o) => menging(o, k.vacht, k.aftekening, sstap(0.56, 0.63, y))),
    vachtMat(),
  )));

  // halsband op de nek: straal uit het veld gemeten
  const bandY = 0.04;
  const voor = raak(lijfSdf, [0, bandY, 2], [0, 0, -1])[2];
  const achter = raak(lijfSdf, [0, bandY, -2], [0, 0, 1])[2];
  const zij = raak(lijfSdf, [2, bandY, (voor + achter) / 2], [-1, 0, 0])[0];
  const halsband = (new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.085, 16, 64),
    new THREE.MeshStandardMaterial({ color: hex.halsband, roughness: 0.55 }),
  ));
  halsband.rotation.x = Math.PI / 2 - 0.2;
  halsband.position.set(0, bandY, (voor + achter) / 2);
  halsband.scale.set(zij + 0.03, (voor - achter) / 2 + 0.03, 1);
  halsband.castShadow = true; g.add(halsband);
  const penning = (new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.03, 32),
    new THREE.MeshPhysicalMaterial({ color: hex.penning, roughness: 0.3, metalness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  ));
  const penY = bandY - 0.19;
  penning.rotation.set(Math.PI / 2 - 0.35, 0, 0.12); penning.position.set(0, penY, raak(lijfSdf, [0, penY, 2], [0, 0, -1])[2] + 0.03); g.add(penning);
  const ringetje = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 8, 20), penning.material);
  ringetje.position.set(0, penY + 0.12, penning.position.z - 0.005); g.add(ringetje);

  // grond: schaduwvanger + zachte contactschaduw
  const vanger = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: hex.schaduw, opacity: 0.22 }));
  vanger.rotation.x = -Math.PI / 2; vanger.position.y = -2.005; vanger.receiveShadow = true; g.add(vanger);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), new THREE.MeshBasicMaterial({
    map: zachteVlek(THREE), color: hex.schaduw, transparent: true, opacity: 0.4, depthWrite: false,
  }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0, -2.0, -0.05); g.add(blob);
  // contactschaduw per poot: donker waar de poot de grond raakt (ambient occlusion)
  const pootVlekMat = new THREE.MeshBasicMaterial({ map: blob.material.map, color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false });
  for (const [px, pz, sx, sz] of [[-0.28, 0.72, 0.5, 0.6], [0.28, 0.72, 0.5, 0.6], [-0.66, 0.3, 0.55, 0.8], [0.66, 0.3, 0.55, 0.8]]) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), pootVlekMat);
    v.rotation.x = -Math.PI / 2; v.position.set(px, -1.997, pz); v.renderOrder = 1; g.add(v);
  }

  g.position.y = 0.1;
  g.userData.bouwMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
  g.rotation.y = -0.18; // driekwart: leest als vorm, niet als vooraanzicht
  return {
    group: g,
    delen: { kop, ogen, oren, staart, romp: lijf, vanger, blob, pootVlekMat },
    toestand: { kopZ: 0, staartFase: 0, curX: 0, curY: 0, kopY: kop.position.y, rustY: g.rotation.y },
  };
}

function zachteVlek(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * Lichtplan: warm hoofdlicht linksboven (met zachte schaduw), koel vullicht rechts,
 * en een randlicht van achteren dat het silhouet losmaakt van de achtergrond. Geen bloom.
 */
export function lichtHond(THREE, scene, renderer, { schaduw = true } = {}) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const hemi = new THREE.HemisphereLight(0xfff1dc, 0x7a5638, 1.1);
  const key = new THREE.DirectionalLight(0xfff0dc, 2.4);
  key.position.set(-2.2, 7, 3.6);
  const fill = new THREE.DirectionalLight(0xe4edff, 0.9);
  fill.position.set(2.5, -0.6, 5);
  const rand = new THREE.DirectionalLight(0xffe3bd, 1.6);
  rand.position.set(2.5, 3.5, -5);
  const rand2 = new THREE.DirectionalLight(0xdfe9ff, 0.9);
  rand2.position.set(-3.5, 1.5, -4);
  if (schaduw) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.8, bottom: -2.8, near: 1, far: 16 });
    key.shadow.radius = 4;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.01;
  }
  scene.add(hemi, key, fill, rand, rand2);
  return { hemi, key, fill, rand, rand2 };
}

/** Licht of donker grond: op donker meer randlicht en een diepere schaduw. */
export function pasThemaToe(h, licht, donker) {
  if (!h || !licht) return;
  licht.rand.intensity = donker ? 2.6 : 1.4;
  licht.rand2.intensity = donker ? 1.5 : 0.7;
  licht.hemi.intensity = donker ? 1.25 : 1.1;
  h.delen.vanger.material.opacity = donker ? 0.42 : 0.2;
  h.delen.blob.material.opacity = donker ? 0.7 : 0.38;
  h.delen.blob.material.color.setHex(donker ? 0x000000 : STANDAARD.schaduw);
  h.delen.pootVlekMat.opacity = donker ? 0.75 : 0.45;
}

/**
 * Eén frame. `s` = { time, lastMove, targetX, targetY, scroll, kijk }.
 * kijk: rustrichting zonder muis (-0.38 links, 0 midden, 0.38 rechts).
 */
export function animeerHond(h, s) {
  const { delen: d, toestand: t } = h;
  const stil = s.time - s.lastMove;
  const tx = stil > 3 ? -0.12 + s.scroll * 0.25 : s.targetX;
  const ty = stil > 3 ? s.kijk + Math.sin(s.time * 0.35) * 0.12 : s.targetY;
  const vorigY = t.curY;
  t.curX += (tx - t.curX) * 0.08; t.curY += (ty - t.curY) * 0.08;
  const tz = stil > 1.2 && stil < 3.2 ? 0.22 : 0;
  t.kopZ += (tz - t.kopZ) * 0.06;
  d.kop.rotation.set(t.curX, t.curY + 0.18, t.kopZ); // +0.18 compenseert de driekwartdraai: de kop kijkt naar je
  h.group.rotation.y = t.rustY + t.curY * 0.2;
  const adem = Math.sin(s.time * 2.2);
  d.romp.scale.set(1 + adem * 0.006, 1 + adem * 0.01, 1 + adem * 0.008);
  d.kop.position.y = t.kopY + adem * 0.012;
  const vY = t.curY - vorigY;
  d.oren.forEach((o) => {
    o.rotation.z = o.userData.s * (0.04 + Math.sin(s.time * 1.4) * 0.03) - vY * 3;
    o.rotation.x = -t.curX * 0.5;
  });
  t.staartFase += stil < 1 ? 0.32 : 0.07;
  d.staart.rotation.y = Math.sin(t.staartFase) * (stil < 1 ? 0.55 : 0.2);
  const knip = (s.time % 4.3) < 0.12 ? 0.12 : 1;
  d.ogen.forEach((o) => { o.scale.y = knip; });
}
