/**
 * reislijn
 * ------------------------------------------------------------------------
 * Een of twee dunne lijnen lopen verticaal in de marge langs de hele pagina,
 * met een stip bij elke sectie met `data-reislijn-halte`. Het stuk lijn tot
 * waar je gescrold hebt is "getekend" (vol), de rest staat er gestippeld.
 * Een element met `data-reislijn-aftakking` (open FAQ-vraag, CTA) krijgt een
 * vloeiende bocht vanaf de lijn zodra het open staat.
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan binnen `init()`.
 *
 * Drie routes (root krijgt `data-reislijn-route`):
 *  - "css"       de browser kent `animation-timeline: scroll()`: de JS rekent
 *                alleen de geometrie uit en zet die als CSS-variabelen; het
 *                tekenen en het oplichten van de stippen doet de browser,
 *                zonder scrollhandler.
 *  - "terugval"  geen scroll-driven animations: IntersectionObserver voor de
 *                stippen, één passieve scrolllistener via `perFrame` (één rAF
 *                per frame) voor de lengte van de getekende lijn.
 *  - "statisch"  "minder beweging": de lijn staat er volledig, een stip is
 *                gevuld zodra zijn sectie in beeld is geweest, zonder animatie.
 *
 * Paden worden uit de posities van de haltes berekend, opnieuw bij resize,
 * bij hoogtewijzigingen (ResizeObserver) en als een aftakking opent of sluit
 * (MutationObserver op `open` / `aria-expanded` / `data-open`).
 *
 * Herkomst: het idee (twee lijnen met stippen per sectie en een aftakking
 * naar de open FAQ-vraag) is gezien op de homepage van Co-Creators. Eigen
 * implementatie, geen code overgenomen.
 *
 * @typedef {Object} ReislijnOptions
 * @property {'auto'|'css'|'terugval'} [route='auto'] Forceer een route (voor tests); 'css' zonder ondersteuning valt terug op 'terugval'.
 * @property {1|2} [lijnen=2] Aantal lijnen. Een halte met `data-reislijn-halte="2"` hoort bij lijn 2 (bij lijnen: 1 altijd lijn 1).
 * @property {string} [kolom='[data-reislijn-kolom]'] Selector van de tekstkolom; de lijn loopt `afstand` px links van de binnenkant ervan.
 * @property {number} [afstand=48] Afstand (px) tussen lijn 1 en de tekstkolom op desktop.
 * @property {number} [lijnAfstand=18] Afstand (px) tussen lijn 1 en lijn 2.
 * @property {number} [activatie=0.6] Fractie van de viewporthoogte waarop de "getekende" lijn eindigt en een stip oplicht (0 = boven, 1 = onder).
 * @property {number} [mobielTot=720] Viewportbreedte (px) tot en met waar de mobiele modus geldt.
 * @property {'dun'|'uit'} [mobiel='dun'] Mobiel: één dunne lijn tegen de linkerrand, of helemaal uit.
 * @property {number} [xMobiel=7] Mobiel: x van de lijn (px vanaf de linkerrand van de root).
 *
 * @param {Element} root Container om de hele pagina-inhoud. Krijgt `data-reislijn` (en `position: relative` via de CSS).
 * @param {ReislijnOptions} [options]
 * @returns {() => void} destroy — ruimt observers, listeners, attributen en het toegevoegde element op. Idempotent.
 */
import { minderBeweging, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/** Eerste ondoorzichtige achtergrondkleur van el of een ouder (voor de "ring" van een lege stip). */
function achtergrond(el, win) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const c = win.getComputedStyle(n).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) return c;
  }
  return '';
}

function isOpen(el) {
  return el.open === true || el.getAttribute('aria-expanded') === 'true' || el.hasAttribute('data-open');
}

/** Cubische bocht met verticale raaklijnen tussen twee punten. */
function bocht(a, b) {
  const m = (a.y + b.y) / 2;
  return ` C ${a.x} ${m} ${b.x} ${m} ${b.x} ${b.y}`;
}

export function init(root, options = {}) {
  if (!vereisRoot(root, 'reislijn')) return () => {};

  const {
    route: gevraagd = 'auto',
    lijnen = 2,
    kolom = '[data-reislijn-kolom]',
    afstand = 48,
    lijnAfstand = 18,
    activatie = 0.6,
    mobielTot = 720,
    mobiel = 'dun',
    xMobiel = 7,
  } = options;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const cssKan = !!(win.CSS && win.CSS.supports && win.CSS.supports('animation-timeline: scroll()'));

  let klaar = false;
  let route = 'css';
  let scrollStop = () => {};
  let io = null;
  let dots = []; // { el, halte, lijn }
  let takken = []; // { el, pad, punt }
  let eind = false;
  let geo = { top0: 0, y0: 0, y1: 0, max: 0 };

  // ---- DOM van de laag ----------------------------------------------------
  const laag = doc.createElement('div');
  laag.className = 'rl-laag';
  laag.setAttribute('aria-hidden', 'true');
  const svg = doc.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'rl-svg');
  svg.setAttribute('focusable', 'false');
  const maakPad = (klasse, lijnNr, metLengte) => {
    const p = doc.createElementNS(SVGNS, 'path');
    p.setAttribute('class', klasse);
    p.setAttribute('data-lijn', String(lijnNr));
    if (metLengte) p.setAttribute('pathLength', '1');
    svg.appendChild(p);
    return p;
  };
  const nLijnen = lijnen === 1 ? 1 : 2;
  const dun = [];
  const vol = [];
  for (let k = 1; k <= nLijnen; k++) {
    dun.push(maakPad('rl-dun', k, false));
    vol.push(maakPad('rl-vol', k, true));
  }
  laag.appendChild(svg);
  const puntenLaag = doc.createElement('div');
  puntenLaag.className = 'rl-punten';
  laag.appendChild(puntenLaag);

  const haltes = Array.from(root.querySelectorAll('[data-reislijn-halte]'));
  dots = haltes.map((h) => {
    const el = doc.createElement('span');
    el.className = 'rl-punt';
    puntenLaag.appendChild(el);
    return { el, halte: h, lijn: 1 };
  });
  const takEls = Array.from(root.querySelectorAll('[data-reislijn-aftakking]'));
  takken = takEls.map((h) => {
    const pad = maakPad('rl-tak', 1, true);
    const punt = doc.createElement('span');
    punt.className = 'rl-tak-punt';
    puntenLaag.appendChild(punt);
    return { el: h, pad, punt };
  });

  root.setAttribute('data-reislijn', '');
  root.appendChild(laag);

  // ---- geometrie ------------------------------------------------------------
  function mobielNu() { return win.matchMedia(`(max-width: ${mobielTot}px)`).matches; }

  function herbereken() {
    if (!klaar) return;
    const rr = root.getBoundingClientRect();
    const scrollY = win.scrollY || win.pageYOffset || 0;
    const H = Math.max(1, Math.round(rr.height));
    const mob = mobielNu();
    root.setAttribute('data-reislijn-modus', mob ? 'mobiel' : 'desktop');
    if (mob && mobiel === 'uit') { laag.setAttribute('data-uit', ''); return; }
    laag.removeAttribute('data-uit');

    laag.style.height = `${H}px`;
    svg.setAttribute('viewBox', `0 0 ${Math.round(rr.width)} ${H}`);
    svg.setAttribute('width', String(Math.round(rr.width)));
    svg.setAttribute('height', String(H));

    // x van lijn 1: mobiel vast tegen de rand, desktop naast de tekstkolom.
    let x1 = xMobiel;
    let lijn2 = false;
    if (!mob) {
      const kol = root.querySelector(kolom);
      if (kol) {
        const kr = kol.getBoundingClientRect();
        const pl = parseFloat(win.getComputedStyle(kol).paddingLeft) || 0;
        x1 = kr.left + pl - rr.left - afstand;
      } else x1 = 24;
      x1 = Math.max(10, x1);
      lijn2 = nLijnen === 2;
    }
    const x2 = x1 + lijnAfstand;
    const wiebel = 5;

    // stippen: y uit de kop van de halte (anders de bovenkant + 40)
    const punten = dots.map((d, i) => {
      const r = d.halte.getBoundingClientRect();
      const anker = d.halte.querySelector('[data-reislijn-anker], h1, h2, h3');
      let y;
      if (anker) {
        const ar = anker.getBoundingClientRect();
        y = ar.top - rr.top + (parseFloat(win.getComputedStyle(anker).fontSize) || 16) * 0.7;
      } else y = r.top - rr.top + 40;
      const waarde = d.halte.getAttribute('data-reislijn-halte');
      d.lijn = lijn2 && waarde === '2' ? 2 : 1;
      return { d, y: clamp(y, 0, H), i };
    }).sort((a, b) => a.y - b.y);

    const x1Punt = () => x1;
    const x2Punt = (i) => x2 + (i % 2 ? wiebel : -wiebel);
    const y0 = punten.length ? Math.max(0, punten[0].y - 36) : 0;
    const y1 = punten.length ? Math.min(H, punten[punten.length - 1].y + 56) : H;

    const lijnPunten = (k) => {
      const pts = [{ x: k === 1 ? x1Punt() : x2Punt(0), y: y0 }];
      punten.forEach((p, i) => pts.push({ x: k === 1 ? x1Punt() : x2Punt(i + 1), y: p.y }));
      pts.push({ x: k === 1 ? x1Punt() : x2Punt(punten.length + 1), y: y1 });
      return pts;
    };
    for (let k = 1; k <= nLijnen; k++) {
      const pts = lijnPunten(k);
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) d += bocht(pts[i - 1], pts[i]);
      const zichtbaar = k === 1 || lijn2;
      for (const p of [dun[k - 1], vol[k - 1]]) {
        p.setAttribute('d', d);
        p.style.display = zichtbaar ? '' : 'none';
      }
      if (k === 2 || k === 1) {
        punten.forEach((p, i) => {
          if (p.d.lijn === k) {
            p.x = pts[i + 1].x;
          }
        });
      }
    }
    for (const p of punten) {
      const kleur = achtergrond(p.d.halte, win);
      const ring = p.d.halte.getAttribute('data-reislijn-ring') || kleur;
      p.d.el.style.left = `${p.x}px`;
      p.d.el.style.top = `${p.y}px`;
      p.d.el.setAttribute('data-lijn', String(p.d.lijn));
      if (ring) p.d.el.style.setProperty('--rl-ring', ring);
    }

    // aftakkingen: alleen op desktop, vanaf lijn 1
    for (const t of takken) {
      const open = isOpen(t.el);
      const er = t.el.getBoundingClientRect();
      const sm = t.el.querySelector('summary');
      const sr = sm ? sm.getBoundingClientRect() : null;
      const yt = (sr ? sr.top + sr.height / 2 : er.top + Math.min(er.height / 2, 26)) - rr.top;
      const ex = er.left - rr.left - 10;
      const ys = Math.max(y0, yt - 84);
      const genoeg = !mob && ex - x1 > 30 && er.height > 0;
      const tekenen = open && genoeg ? 'ja' : 'nee';
      t.pad.setAttribute('data-getekend', tekenen);
      t.punt.setAttribute('data-getekend', tekenen);
      if (genoeg) {
        const dx = ex - x1;
        t.pad.setAttribute('d', `M ${x1} ${ys} C ${x1} ${ys + (yt - ys) * 0.8} ${x1 + dx * 0.45} ${yt} ${ex} ${yt}`);
        t.punt.style.left = `${ex}px`;
        t.punt.style.top = `${yt}px`;
      }
    }

    // scrollgeometrie
    const top0 = rr.top + scrollY;
    const max = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
    const a = win.innerHeight * activatie;
    geo = { top0, y0, y1, max, a };
    if (route === 'css') zetCssGeometrie(punten);
    else teken();
  }

  // s = scrollpositie waarbij y (root-coördinaat) op de activatielijn ligt
  const sVoor = (y) => geo.top0 + y - geo.a;
  const fVoor = (s) => clamp((s + geo.a - geo.top0 - geo.y0) / Math.max(1, geo.y1 - geo.y0), 0, 1);

  function zetCssGeometrie(punten) {
    const s0 = clamp(sVoor(geo.y0), 0, geo.max);
    const s1 = Math.max(s0 + 1, clamp(sVoor(geo.y1), 0, geo.max));
    laag.style.setProperty('--rl-r0', `${s0}px`);
    laag.style.setProperty('--rl-r1', `${s1}px`);
    laag.style.setProperty('--rl-o0', String(1 - fVoor(s0)));
    laag.style.setProperty('--rl-o1', String(1 - fVoor(s1)));
    for (const p of punten) {
      const s = sVoor(p.y);
      const el = p.d.el;
      if (s <= 0) el.setAttribute('data-vast', '');
      else {
        el.removeAttribute('data-vast');
        // een stip die de activatielijn nooit haalt (laatste sectie) is klaar aan het einde van de pagina
        const van = clamp(s - 28, 0, Math.max(0, geo.max - 56));
        el.style.setProperty('--rl-van', `${van}px`);
      }
    }
  }

  // ---- terugval-route -------------------------------------------------------
  function zetActief(d) {
    if (d.io || eind) d.el.setAttribute('data-actief', '');
    else d.el.removeAttribute('data-actief');
  }
  function teken() {
    const y = win.scrollY || win.pageYOffset || 0;
    const f = route === 'statisch' ? 1 : fVoor(y);
    laag.style.setProperty('--rl-o', String(1 - f));
    // een stip die de activatielijn nooit haalt (laatste sectie) wordt aan het einde van de pagina alsnog actief
    const nu = geo.max > 0 && y >= geo.max - 2;
    if (nu !== eind) { eind = nu; dots.forEach(zetActief); }
  }
  const tekenFrame = perFrame(teken, doc);

  function startIO() {
    io = new win.IntersectionObserver((entries) => {
      for (const e of entries) {
        const d = dots.find((x) => x.halte === e.target);
        if (!d) continue;
        d.io = e.boundingClientRect.top <= win.innerHeight * activatie;
        zetActief(d);
      }
    }, { rootMargin: `0px 0px -${Math.round((1 - activatie) * 100)}% 0px`, threshold: 0 });
    for (const d of dots) io.observe(d.halte);
  }

  function stopRoute() {
    scrollStop();
    scrollStop = () => {};
    tekenFrame.cancel();
    if (io) { io.disconnect(); io = null; }
    eind = false;
    for (const d of dots) { d.io = false; d.el.removeAttribute('data-actief'); d.el.removeAttribute('data-vast'); }
    laag.style.removeProperty('--rl-o');
  }

  function startRoute(reduced) {
    stopRoute();
    route = reduced ? 'statisch' : gevraagd === 'terugval' || !cssKan ? 'terugval' : 'css';
    root.setAttribute('data-reislijn-route', route);
    if (route !== 'css') {
      startIO();
      const h = () => tekenFrame();
      win.addEventListener('scroll', h, { passive: true });
      scrollStop = () => win.removeEventListener('scroll', h);
    }
    herbereken();
  }

  // ---- opstarten ------------------------------------------------------------
  klaar = true;
  const plan = perFrame(herbereken, doc);
  const mb = minderBeweging((r) => startRoute(r), doc);
  startRoute(mb.reduced);

  win.addEventListener('resize', plan);
  let ro = null;
  if ('ResizeObserver' in win) {
    ro = new win.ResizeObserver(plan);
    ro.observe(doc.documentElement);
    ro.observe(root);
    haltes.forEach((h) => ro.observe(h));
    takEls.forEach((h) => ro.observe(h));
  }
  let mo = null;
  if ('MutationObserver' in win) {
    mo = new win.MutationObserver(plan);
    mo.observe(root, { subtree: true, attributes: true, attributeFilter: ['open', 'aria-expanded', 'data-open'] });
  }
  // lettertypen laden na init verschuift de kopregels
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => plan());

  return function destroy() {
    if (!klaar) return;
    klaar = false;
    stopRoute();
    mb.stop();
    plan.cancel();
    win.removeEventListener('resize', plan);
    if (ro) ro.disconnect();
    if (mo) mo.disconnect();
    laag.remove();
    root.removeAttribute('data-reislijn');
    root.removeAttribute('data-reislijn-route');
    root.removeAttribute('data-reislijn-modus');
  };
}
