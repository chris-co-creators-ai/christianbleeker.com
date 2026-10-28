/**
 * three-mascot — vorm "hond"
 * ------------------------------------------------------------------------
 * Eigen procedurele hond (zittend, mat klei-achtig): chocolade vacht, hooi-
 * kleurige aftekening, groene halsband. Gebouwd voor demo-16 (De Staldeur).
 * Gedrag: de KOP volgt de muis over de hele pagina (niet het hele dier),
 * oren zwaaien na, staart kwispelt bij beweging, kop gaat schuin bij
 * stilstand ("en nu?"), knipperen; zonder muis kijkt hij met de scroll mee.
 *
 * Kleuren zijn opties zodat een andere site een andere vacht kan geven:
 * init(root, { vorm: 'hond', kleuren: { vacht: 0x4a2c17, ... } }).
 */

const STANDAARD = {
  vacht: 0x4a2c17,
  vachtDonker: 0x35200f,
  aftekening: 0xd9b874,
  neus: 0x1a0f0a,
  halsband: 0x7fbf3a,
  penning: 0xc9a656,
  schaduw: 0x2b1810,
};

export function bouwHond(THREE, kleuren = {}) {
  const k = { ...STANDAARD, ...kleuren };
  const g = new THREE.Group();
  // Mat: hoge roughness, geen metaal — minder speelgoed, meer vacht/klei.
  const M = (c, r = 0.94) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
  const vacht = M(k.vacht), vachtD = M(k.vachtDonker), aft = M(k.aftekening);
  const neus = M(k.neus, 0.5), oog = M(0x140b06, 0.3);
  const glim = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  const band = M(k.halsband, 0.8), pen = M(k.penning, 0.55);
  const bol = (r, mat, pos, sc = [1, 1, 1], par = g) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat);
    m.position.set(...pos); m.scale.set(...sc); par.add(m); return m;
  };

  // romp iets naar achteren gekanteld, borst naar voren: natuurlijker zit
  const romp = bol(1, vacht, [0, -0.6, -0.12], [0.9, 1.1, 0.88]); romp.rotation.x = -0.2;
  bol(0.6, aft, [0, -0.25, 0.5], [0.6, 1.15, 0.5]);
  for (const s of [-1, 1]) {
    bol(0.62, vacht, [s * 0.72, -1.2, -0.12], [0.7, 0.8, 1.08]);
    bol(0.27, aft, [s * 0.8, -1.88, 0.4], [1, 0.5, 1.5]);
    const been = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.9, 8, 16), vacht);
    been.position.set(s * 0.3, -1.32, 0.56); been.rotation.x = 0.06; g.add(been);
    bol(0.24, aft, [s * 0.31, -1.9, 0.74], [1, 0.55, 1.35]);
  }
  const staart = new THREE.Group(); staart.position.set(0.32, -1.6, -0.7); g.add(staart);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.6, 0.05, -0.1),
    new THREE.Vector3(1.0, 0.35, -0.05), new THREE.Vector3(1.15, 0.7, 0.05),
  ]);
  staart.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.1, 12), vacht));
  bol(0.11, aft, [1.15, 0.72, 0.05], [1, 1.3, 1], staart);

  bol(0.55, vacht, [0, 0.32, 0.1]);
  const halsband = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.07, 12, 40), band);
  halsband.rotation.x = Math.PI / 2 - 0.25; halsband.position.set(0, 0.18, 0.12); g.add(halsband);
  const penning = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 24), pen);
  penning.rotation.x = Math.PI / 2; penning.position.set(0, -0.1, 0.66); g.add(penning);

  const kop = new THREE.Group(); kop.position.set(0, 0.92, 0.2); g.add(kop);
  bol(0.7, vacht, [0, 0.12, 0], [1, 0.9, 0.98], kop);
  bol(0.1, aft, [0, 0.36, 0.6], [0.5, 1.5, 0.35], kop);
  // langere snuit dan de schets: minder knuffel, meer hond
  bol(0.4, aft, [0, -0.1, 0.66], [0.95, 0.68, 1.3], kop);
  bol(0.19, aft, [0, -0.32, 0.54], [1, 0.6, 1], kop);
  bol(0.115, neus, [0, 0.0, 1.16], [1.3, 0.85, 1], kop);
  const ogen = [];
  for (const s of [-1, 1]) {
    const o = bol(0.085, oog, [s * 0.27, 0.22, 0.6], [1, 1, 1], kop); ogen.push(o);
    bol(0.022, glim, [0.025, 0.03, 0.07], [1, 1, 1], o);
    bol(0.07, aft, [s * 0.26, 0.37, 0.55], [1.25, 0.55, 0.5], kop);
  }
  const oren = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.56, 0.42, 0.0); kop.add(piv);
    const oor = bol(0.44, vachtD, [s * 0.1, -0.48, 0.04], [0.28, 1.05, 0.64], piv); oor.rotation.z = s * 0.16;
    piv.userData.s = s; oren.push(piv);
  }
  const schaduw = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 40),
    new THREE.MeshBasicMaterial({ color: k.schaduw, transparent: true, opacity: 0.14 }),
  );
  schaduw.rotation.x = -Math.PI / 2; schaduw.scale.set(1, 0.55, 1); schaduw.position.set(0.1, -2.04, 0.2); g.add(schaduw);
  g.position.y = 0.05;
  return { group: g, delen: { kop, ogen, oren, staart, romp }, toestand: { kopZ: 0, staartFase: 0, curX: 0, curY: 0 } };
}

/**
 * Eén frame. `s` = { time, lastMove, targetX, targetY, scroll, kijk }.
 * kijk: rustrichting zonder muis (-0.38 links, 0 midden, 0.38 rechts).
 */
export function animeerHond(h, s) {
  const { delen: d, toestand: t } = h;
  const stil = s.time - s.lastMove;
  const tx = stil > 3 ? -0.16 + s.scroll * 0.3 : s.targetX;
  const ty = stil > 3 ? s.kijk + Math.sin(s.time * 0.35) * 0.12 : s.targetY;
  const vorigY = t.curY;
  t.curX += (tx - t.curX) * 0.08; t.curY += (ty - t.curY) * 0.08;
  const tz = stil > 1.2 && stil < 3.2 ? 0.24 : 0;
  t.kopZ += (tz - t.kopZ) * 0.06;
  d.kop.rotation.set(t.curX, t.curY, t.kopZ);
  h.group.rotation.y = t.curY * 0.22;
  d.romp.scale.y = 1.1 + Math.sin(s.time * 2.2) * 0.012;
  const vY = t.curY - vorigY;
  d.oren.forEach((o) => { o.rotation.z = o.userData.s * (0.04 + Math.sin(s.time * 1.4) * 0.03) - vY * 3; o.rotation.x = -t.curX * 0.5; });
  t.staartFase += stil < 1 ? 0.32 : 0.07;
  d.staart.rotation.y = Math.sin(t.staartFase) * (stil < 1 ? 0.55 : 0.22);
  const knip = (s.time % 4.3) < 0.12 ? 0.12 : 1;
  d.ogen.forEach((o) => { o.scale.y = knip; });
}
