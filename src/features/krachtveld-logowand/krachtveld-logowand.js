/**
 * krachtveld-logowand
 * ------------------------------------------------------------------------
 * Een logo- of partnerwand op magnetische veldlijnen. In het midden een
 * ronde CTA-schijf (echte link, optioneel met draaiende tekst via
 * `typography/circle-text`), daaromheen de veldlijnen van een dipool met de
 * klantlogo's óp de lijnen. Vanilla ES-module, 0 dependencies (buiten
 * circle-text en `_kwaliteit/basis.js`), SSR-veilig: niets raakt `window` of
 * `document` bij import.
 *
 * Wat waar staat:
 *  - de GEOMETRIE (`berekenLaag`, `lusPunten`, `naarD`) is pure wiskunde en
 *    draait overal: in `genereer-paden.mjs`, in de React-wrapper tijdens
 *    server-render, en hier in de browser. De paden staan dus altijd al
 *    voorgerekend in de markup — zonder JS klopt alles.
 *  - `init()` voegt alleen toe: intekenen bij binnenkomst (stroke-dashoffset
 *    via CSS-attributen), en met een fijne muis licht meebuigen onder de
 *    cursor. `pointermove` schrijft alleen twee getallen weg; één rAF-lus
 *    rekent en schrijft de `d`-waarden. Bij loslaten (pointer verlaat de
 *    wand) veren de lijnen terug en krijgen ze exact hun rust-`d` terug.
 *
 * De veldlijn: een dipool met de schijf als magneet volgt r = L·sin²θ, met θ
 * gemeten vanaf de as. Punt (x, y) = (L·sin³θ, L·sin²θ·cosθ). Catmull-Rom
 * naar kubische Bézier houdt de paden kort. Bekende wiskunde, eigen code.
 *
 * @typedef {Object} KrachtveldOptions
 * @property {boolean} [entree=true]  Lijnen tekenen in bij binnenkomst.
 * @property {boolean} [buigen=true]  Lijnen buigen mee onder een fijne muis.
 * @property {number}  [kracht=16]    Maximale verplaatsing bij het buigen, in viewBox-eenheden.
 * @property {number}  [bereik=120]   Straal van de invloed van de cursor (viewBox-eenheden).
 * @property {number}  [ringDuur=28]  Rotatieduur van de cirkeltekst in seconden.
 * @property {boolean} [ring=true]    Cirkeltekst starten (circle-text) als `[data-circle-text]` aanwezig is.
 *
 * @param {Element} root Element met `data-krachtveld`, bevat `.kv__wand` met één of twee `svg[data-kv-veld]`.
 * @param {KrachtveldOptions} [opties]
 * @returns {() => void} destroy — idempotent.
 */
import { minderBeweging, isTouch, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';
import { init as initRing } from '../circle-text/circle-text.js';

const RAD = Math.PI / 180;

/**
 * De opzet per laag. `d` = desktop (as horizontaal), `m` = mobiel (as
 * verticaal, "gedraaid"). Eenheden = viewBox-eenheden; R = straal van de
 * schijf, `lijnen` = de L-waarden van binnen naar buiten. Een plek is
 * `{ lijn, theta, kant, helft }`: op welke lijn, bij welke hoek, aan welke
 * kant van de as, in welke helft. Plek n = het n-de logo in de markup.
 */
export const OPZET = {
  d: {
    vb: [-600, -240, 1200, 480], R: 135, draai: false,
    lijnen: [172, 200, 236, 290, 360, 450, 560],
    plekken: [
      { lijn: 6, theta: 69, kant: -1, helft: -1 }, { lijn: 6, theta: 69, kant: 1, helft: -1 },
      { lijn: 4, theta: 64, kant: -1, helft: -1 }, { lijn: 4, theta: 64, kant: 1, helft: -1 },
      { lijn: 4, theta: 64, kant: -1, helft: 1 }, { lijn: 4, theta: 64, kant: 1, helft: 1 },
      { lijn: 6, theta: 69, kant: -1, helft: 1 }, { lijn: 6, theta: 69, kant: 1, helft: 1 },
      { lijn: 3, theta: 90, kant: -1, helft: 1 }, { lijn: 3, theta: 90, kant: 1, helft: 1 },
    ],
  },
  m: {
    vb: [-190, -352, 380, 704], R: 80, draai: true,
    lijnen: [96, 116, 140, 175, 215, 255, 300, 330],
    plekken: [
      { lijn: 6, theta: 71, kant: -1, helft: -1 }, { lijn: 6, theta: 71, kant: -1, helft: 1 },
      { lijn: 3, theta: 63, kant: -1, helft: -1 }, { lijn: 3, theta: 63, kant: -1, helft: 1 },
      { lijn: 3, theta: 63, kant: 1, helft: -1 }, { lijn: 3, theta: 63, kant: 1, helft: 1 },
      { lijn: 6, theta: 71, kant: 1, helft: -1 }, { lijn: 6, theta: 71, kant: 1, helft: 1 },
      { lijn: 7, theta: 90, kant: -1, helft: 1 }, { lijn: 7, theta: 90, kant: 1, helft: 1 },
    ],
  },
};

function punt(L, th, kant, helft, draai) {
  const s = Math.sin(th);
  const a = L * s * s * s;
  const b = L * s * s * Math.cos(th);
  return draai ? [helft * b, kant * a] : [kant * a, helft * b];
}

/** Hoek waarop de veldlijn de schijfrand raakt: L·sin²θ = R. */
const beginHoek = (L, R) => Math.asin(Math.sqrt(Math.min(1, R / L)));

/**
 * De punten van één volledige lus (schijfrand → evenaar → schijfrand) aan één
 * kant van de as. Eerste en laatste punt zijn hulppunten voor de Catmull-Rom.
 */
export function lusPunten(L, kant, R, draai) {
  const a0 = beginHoek(L, R);
  const n = Math.max(8, Math.ceil((Math.PI / 2 - a0) / (5 * RAD)));
  const st = (Math.PI / 2 - a0) / n;
  const pts = [];
  for (let i = -1; i <= n; i++) pts.push(punt(L, a0 + i * st, kant, -1, draai));
  for (let i = n - 1; i >= -1; i--) pts.push(punt(L, a0 + i * st, kant, 1, draai));
  return pts;
}

const f1 = (v) => String(Math.round(v * 10) / 10);

/** Catmull-Rom → kubische Bézier. Tekent van pts[1] tot pts[len-2]. */
export function naarD(pts) {
  let d = `M${f1(pts[1][0])} ${f1(pts[1][1])}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} `
      + `${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
}

/**
 * Rekent één laag volledig uit: paden (met `d`) en de plekken van de logo's
 * (in viewBox-eenheden en als percentage van de wand).
 * @param {typeof OPZET.d} opzet
 */
export function berekenLaag(opzet) {
  const { vb, R, draai, lijnen, plekken } = opzet;
  const paden = [];
  lijnen.forEach((L, lijn) => {
    [-1, 1].forEach((kant) => {
      const pts = lusPunten(L, kant, R, draai);
      paden.push({ L, kant, lijn, d: naarD(pts) });
    });
  });
  const logos = plekken.map((p, i) => {
    const [x, y] = punt(lijnen[p.lijn], p.theta * RAD, p.kant, p.helft, draai);
    const pct = (v, o, gr) => Math.round(((v - o) / gr) * 1e4) / 100;
    return { n: i + 1, x, y, px: pct(x, vb[0], vb[2]), py: pct(y, vb[1], vb[3]) };
  });
  return { vb, R, draai, paden, logos };
}

/** Kleine helper: is dit element bruikbaar voor bochtberekening? */
const getal = (el, naam, terug) => {
  const v = parseFloat(el.getAttribute(naam));
  return Number.isFinite(v) ? v : terug;
};

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'krachtveld-logowand')) return () => {};

  const {
    entree = true, buigen = true, kracht = 16, bereik = 120, ringDuur = 28, ring = true,
  } = opties;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const wand = root.querySelector('.kv__wand') || root;

  // Lagen: per svg de paden met hun rust-`d` en de punten om te buigen.
  const lagen = Array.from(root.querySelectorAll('svg[data-kv-veld]')).map((svg) => {
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const R = getal(svg, 'data-kv-r', 0);
    const draai = svg.getAttribute('data-kv-draai') === '1';
    const paden = Array.from(svg.querySelectorAll('path[data-kv-l]')).map((el) => {
      const L = getal(el, 'data-kv-l', 0);
      const kant = getal(el, 'data-kv-kant', 1);
      return { el, rust: el.getAttribute('d') || '', laatst: null, pts: L && R ? lusPunten(L, kant, R, draai) : null };
    }).filter((p) => p.pts);
    return { svg, vb, paden };
  }).filter((l) => l.vb && l.vb.width && l.paden.length);

  // Cirkeltekst rond de schijf (hergebruik van typography/circle-text).
  const schijf = ring ? root.querySelector('[data-circle-text]') : null;
  const ringOp = schijf ? initRing(schijf, { duration: ringDuur }) : () => {};

  let vernietigd = false;
  let stopBeeld = () => {};
  let rafEntree = 0;
  let ontkoppelMuis = () => {};

  // ---- entree: lijnen tekenen in --------------------------------------
  // Twee fasen, net als reveal-on-scroll: `wacht` verbergt zonder transitie,
  // één frame later zet `actief` de transitie aan, en `in` laat de lijnen komen.
  let entreeGestart = false;
  function startEntree() {
    if (entreeGestart || vernietigd) return;
    entreeGestart = true;
    root.setAttribute('data-kv-wacht', '');
    rafEntree = win.requestAnimationFrame(() => {
      rafEntree = 0;
      if (vernietigd) return;
      root.setAttribute('data-kv-actief', '');
      stopBeeld = inBeeld(wand, () => { if (!vernietigd) root.setAttribute('data-kv-in', ''); }, { threshold: 0.25 });
    });
  }
  function stopEntree() {
    if (rafEntree) win.cancelAnimationFrame(rafEntree);
    rafEntree = 0;
    stopBeeld();
    stopBeeld = () => {};
    ['data-kv-wacht', 'data-kv-actief', 'data-kv-in'].forEach((a) => root.removeAttribute(a));
    entreeGestart = false;
  }

  // ---- buigen onder de muis -------------------------------------------
  // Toestand: cursorpositie (tx, ty) en of hij in de wand is; `s` = sterkte
  // (0..1) als veer met lichte nasprong, zodat het terugveren levend voelt.
  let tx = 0, ty = 0, cx = 0, cy = 0, binnen = false, s = 0, v = 0, raf = 0;
  const VEER = 0.085, DEMP = 0.8;

  function herstelLaag(l) {
    for (const p of l.paden) {
      if (p.laatst !== null) { p.el.setAttribute('d', p.rust); p.laatst = null; }
    }
  }
  const herstel = () => lagen.forEach(herstelLaag);

  function tik() {
    raf = 0;
    if (vernietigd) return;
    v += ((binnen ? 1 : 0) - s) * VEER;
    v *= DEMP;
    s += v;
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;

    if (!binnen && Math.abs(s) < 0.003 && Math.abs(v) < 0.003) { s = 0; v = 0; herstel(); return; }

    const sigma2 = 2 * bereik * bereik;
    for (const l of lagen) {
      const r = l.svg.getBoundingClientRect();
      if (!r.width) { herstelLaag(l); continue; } // laag is verborgen (andere breakpoint)
      const ux = l.vb.x + ((cx - r.left) / r.width) * l.vb.width;
      const uy = l.vb.y + ((cy - r.top) / r.height) * l.vb.height;
      for (const p of l.paden) {
        const n = p.pts.length - 3; // zichtbare segmenten
        const uit = p.pts.map(([x, y], k) => {
          const t = Math.min(1, Math.max(0, (k - 1) / n));
          const dx = ux - x, dy = uy - y;
          const afstand = Math.hypot(dx, dy);
          if (afstand < 1e-6) return [x, y];
          // Uiteinden blijven aan de schijf vastzitten: gewicht = sin(πt).
          const m = Math.min(kracht * s * Math.exp(-(afstand * afstand) / sigma2) * Math.sin(Math.PI * t), afstand * 0.6);
          return [x + (dx / afstand) * m, y + (dy / afstand) * m];
        });
        const d = naarD(uit);
        if (d !== p.laatst) { p.el.setAttribute('d', d); p.laatst = d; }
      }
    }
    raf = win.requestAnimationFrame(tik);
  }
  const wek = () => { if (!raf && !vernietigd) raf = win.requestAnimationFrame(tik); };

  function koppelMuis() {
    if (!buigen || isTouch(doc) || !lagen.length) return;
    const beweeg = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!binnen) { cx = e.clientX; cy = e.clientY; }
      tx = e.clientX; ty = e.clientY; binnen = true; wek();
    };
    const weg = () => { binnen = false; wek(); };
    wand.addEventListener('pointermove', beweeg, { passive: true });
    wand.addEventListener('pointerleave', weg, { passive: true });
    wand.addEventListener('pointercancel', weg, { passive: true });
    ontkoppelMuis = () => {
      wand.removeEventListener('pointermove', beweeg);
      wand.removeEventListener('pointerleave', weg);
      wand.removeEventListener('pointercancel', weg);
      ontkoppelMuis = () => {};
    };
  }

  // ---- minder beweging: live omschakelen -------------------------------
  function pas(minder) {
    if (vernietigd) return;
    if (minder) {
      stopEntree();
      ontkoppelMuis();
      if (raf) win.cancelAnimationFrame(raf);
      raf = 0; binnen = false; s = 0; v = 0;
      herstel();
    } else {
      if (entree) startEntree();
      koppelMuis();
    }
  }
  const mb = minderBeweging((r) => pas(r), doc);
  pas(mb.reduced);

  return function destroy() {
    if (vernietigd) return;
    vernietigd = true;
    mb.stop();
    stopEntree();
    ontkoppelMuis();
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
    herstel();
    ringOp();
  };
}
