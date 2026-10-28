/**
 * raster-intro
 * ------------------------------------------------------------------------
 * Hero-intro in ±3 s: een lijnenraster tekent zich (lijnen schalen 0 → 1 met
 * stagger, cirkels en diagonalen tekenen zich via stroke-dashoffset), in het
 * midden verschijnt een merkteken, en een reuzenkop schuift woord voor woord
 * van links in op vaste starttijden met ease circ.out.
 *
 * Geen scrollslot: de pagina is vanaf het eerste frame te gebruiken. Een
 * klik of toets tijdens de intro springt naar het eindbeeld. Minder
 * beweging = eindbeeld meteen (ook als het halverwege wordt omgezet).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig. Alle beweging zit in de CSS
 * (keyframes); deze module zet alleen starttijden en attributen.
 *
 *
 * @typedef {Object} RasterIntroOpties
 * @property {number[]} [woordStarts=[0.76, 1.04, 1.34, 1.59]] Starttijd per woord in seconden (volgorde van de DOM). Ontbreekt er een, dan komt die 0,28 s na de vorige.
 * @property {number} [tempo=1] Vermenigvuldiger voor alle tijden (1.2 = 20 % trager).
 * @property {boolean} [perSessie=false] Intro maar één keer per tabblad-sessie; daarna meteen het eindbeeld.
 * @property {boolean} [overslaan=true] Klik of toets tijdens de intro springt naar het eindbeeld.
 *
 * @param {Element} root Het `[data-raster-intro]`-element.
 * @param {RasterIntroOpties} [opties]
 * @returns {() => void} destroy (idempotent)
 */
import { vereisRoot, minderBeweging, frequentie } from '../../_kwaliteit/basis.js';

const ACTIEF = 'data-ri-actief';
const LOOPT = 'data-ri-loopt';
const KLAAR = 'data-ri-klaar';
const FAILSAFE_MS = 4000; // R2: na uiterlijk 4 s staat het eindbeeld er, wat er ook gebeurt
const FONT_WACHT_MS = 450; // langer wachten op het font is erger dan een late wissel

/** Ritme: start + stagger, met een stagger die krimpt als er meer lijnen zijn. */
function rij(n, start, stagger, uiterlijk) {
  const s = n > 1 ? Math.min(stagger, (uiterlijk - start) / (n - 1)) : 0;
  return (i) => start + i * s;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'raster-intro')) return () => {};
  const {
    woordStarts = [0.76, 1.04, 1.34, 1.59],
    tempo = 1,
    perSessie = false,
    overslaan = true,
  } = opties;

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const q = (s) => Array.from(root.querySelectorAll(s));
  const h = q('[data-ri-lijn="h"]');
  const v = q('[data-ri-lijn="v"]');
  const vormen = q('[data-ri-vorm]');
  const strepen = q('[data-ri-streep]');
  const merk = q('[data-ri-merk]');
  const woorden = q('.ri__woord');
  const getimed = [...h, ...v, ...vormen, ...strepen, ...merk, ...woorden];

  let destroyed = false;
  let failsafe = 0;
  let fontWacht = 0;
  const luisteraars = [];
  const luister = (doel, type, fn, o) => { doel.addEventListener(type, fn, o); luisteraars.push(() => doel.removeEventListener(type, fn, o)); };

  function animaties() {
    try { return root.getAnimations({ subtree: true }); } catch { return []; }
  }

  // De media query live lezen: `matches` klopt meteen, het change-event komt
  // pas bij de volgende rendering-update (onder belasting tot seconden later).
  const mqNu = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const minderNu = () => !!(mqNu && mqNu.matches);

  function klaar() {
    if (destroyed || root.hasAttribute(KLAAR)) return;
    if (minderNu()) { stil(); return; }
    win.clearTimeout(failsafe);
    win.clearTimeout(fontWacht);
    root.setAttribute(LOOPT, '');
    for (const a of animaties()) { try { a.finish(); } catch { /* oneindige of al weg */ } }
    root.setAttribute(KLAAR, '');
    for (const off of luisteraars.splice(0)) off();
  }

  function stil() {
    if (destroyed) return;
    // Eindbeeld zonder beweging: de attributen weghalen is genoeg, de CSS
    // toont zonder data-ri-actief alles in de eindstand.
    win.clearTimeout(failsafe);
    win.clearTimeout(fontWacht);
    root.removeAttribute(ACTIEF);
    root.removeAttribute(LOOPT);
    root.setAttribute(KLAAR, '');
    for (const off of luisteraars.splice(0)) off();
  }

  const mb = minderBeweging((reduced) => { if (reduced) stil(); }, doc);
  const freq = perSessie ? frequentie('raster-intro', { perSessie: true }, doc) : null;

  if (mb.reduced || (freq && !freq.mag)) {
    root.setAttribute(KLAAR, '');
  } else {
    if (freq) freq.markeer();

    // Starttijden. Raster eerst (vanaf 0,2 s, zodat er meteen iets gebeurt),
    // daarna de figuren, het merkteken en de woorden op de gemeten tijden.
    const tH = rij(h.length, 0.2, 0.25, 1.5);
    const tV = rij(v.length, 0.9, 0.2, 1.8);
    const tVorm = rij(vormen.length, 0.45, 0.12, 1.5);
    const tStreep = rij(strepen.length, 0.85, 0.14, 1.6);
    const zet = (el, s) => el.style.setProperty('--ri-v', `${(s * tempo).toFixed(3)}s`);
    h.forEach((el, i) => zet(el, tH(i)));
    v.forEach((el, i) => zet(el, tV(i)));
    vormen.forEach((el, i) => zet(el, tVorm(i)));
    strepen.forEach((el, i) => zet(el, tStreep(i)));
    merk.forEach((el) => zet(el, 1.85));
    let vorige = 0.48;
    woorden.forEach((el, i) => {
      const s = Number.isFinite(woordStarts[i]) ? woordStarts[i] : vorige + 0.28;
      vorige = s;
      zet(el, s);
    });
    if (tempo !== 1) root.style.setProperty('--ri-tempo', String(tempo));

    root.setAttribute(ACTIEF, '');

    // Klok pas laten lopen als het font van de kop er is (max 450 ms wachten).
    const start = () => {
      if (destroyed || root.hasAttribute(KLAAR)) return;
      if (minderNu()) { stil(); return; }
      root.setAttribute(LOOPT, '');
    };
    fontWacht = win.setTimeout(start, FONT_WACHT_MS);
    const fonts = doc.fonts;
    if (fonts && fonts.load && woorden.length) {
      const stijl = win.getComputedStyle(woorden.find((w) => w.classList.contains('ri__woord--groot')) || woorden[0]);
      fonts.load(`${stijl.fontStyle} ${stijl.fontWeight} 1em ${stijl.fontFamily}`).then(start, start);
    } else {
      start();
    }

    failsafe = win.setTimeout(klaar, FAILSAFE_MS);
    // Natuurlijk einde: als alle animaties klaar zijn.
    win.requestAnimationFrame(() => {
      // Elke animatie apart: zet de bezoeker minder beweging aan, dan haalt de CSS
      // (@media no-preference) de animaties bij de eerstvolgende stijlberekening
      // weg. Hun `finished` wordt dan afgewezen, en dat is ons eerste signaal,
      // eerder dan het change-event.
      if (destroyed || root.hasAttribute(KLAAR)) return;
      const lijst = animaties();
      for (const a of lijst) a.finished.catch(() => { if (minderNu()) stil(); });
      if (lijst.length) Promise.all(lijst.map((a) => a.finished)).then(klaar, () => {});
      else if (minderNu()) stil();
    });

    if (overslaan) {
      luister(root, 'pointerdown', klaar);
      luister(doc, 'keydown', klaar);
    }
  }

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    mb.stop();
    win.clearTimeout(failsafe);
    win.clearTimeout(fontWacht);
    for (const off of luisteraars.splice(0)) off();
    root.removeAttribute(ACTIEF);
    root.removeAttribute(LOOPT);
    root.removeAttribute(KLAAR);
    root.style.removeProperty('--ri-tempo');
    for (const el of getimed) el.style.removeProperty('--ri-v');
  };
}
