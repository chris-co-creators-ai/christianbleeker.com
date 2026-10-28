/**
 * diepte-beeld
 * ------------------------------------------------------------------------
 * Eén foto, opgedeeld in 3–4 lagen (achtergrond, midden, voorgrond, eventueel
 * een kop ertussen). De lagen schuiven licht ten opzichte van elkaar bij
 * muisbeweging (alleen desktop) en bij scrollen (alle apparaten): het beeld
 * krijgt diepte zonder 3D-model. Vanilla ES-module, 0 dependencies, SSR-veilig
 * (raakt window/document pas aan in `init()`).
 *
 * Rustig: kleine uitslag (een paar procent), gedempt met lerp, en er loopt
 * alleen een animatieframe zolang de lagen nog onderweg zijn. Buiten beeld
 * gebeurt niets. Alleen `transform` wordt per frame geschreven (R18).
 *
 * Markup: zie README. Elke laag is een kind met `data-diepte-laag` en een
 * diepte in `data-diepte` (0 = achtergrond, 1 = voorgrond; standaard 0,5).
 *
 * @typedef {Object} DiepteBeeldOptions
 * @property {string} [laag="[data-diepte-laag]"] Selector voor de lagen binnen het beeld.
 * @property {number} [muis=0.02] Maximale muisuitslag van de voorgrond (diepte 1), als fractie van de eigen breedte/hoogte van het beeld.
 * @property {number} [scroll=0.05] Maximale scrolluitslag van de voorgrond, als fractie van de hoogte van het beeld.
 * @property {number} [scrollTouch=0.12] Idem voor touch (geen muis, dus meer ruimte): telefoons hebben alleen scroll-diepte en een klein beeld. Hoort bij `--db-overscan` 14% op touch in de CSS.
 * @property {number} [demping=0.09] Lerp-factor per frame (0–1): kleiner = trager en zachter.
 *
 * @param {Element} root Het beeld zelf (`[data-diepte-beeld]`), of een container met meerdere beelden.
 * @param {DiepteBeeldOptions} [opties]
 * @returns {() => void} destroy: ruimt listeners, observers, frames, inline-stijlen en attributen op. Idempotent.
 */
import { minderBeweging, isTouch, perFrame, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';

const RUST = 0.05; // px: onder dit verschil stopt de lerp-lus

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'diepte-beeld')) return () => {};
  const beelden = root.matches('[data-diepte-beeld]') ? [root] : [...root.querySelectorAll('[data-diepte-beeld]')];
  const stops = beelden.map((el) => initBeeld(el, opties));
  return () => stops.forEach((s) => s());
}

function initBeeld(el, { laag = '[data-diepte-laag]', muis = 0.02, scroll = 0.05, scrollTouch = 0.12, demping = 0.09 } = {}) {
  const doc = el.ownerDocument;
  const win = doc.defaultView;
  const lagen = [...el.querySelectorAll(laag)].map((node) => {
    const d = parseFloat(node.getAttribute('data-diepte'));
    return { node, diepte: Number.isFinite(d) ? d : 0.5, x: 0, y: 0 };
  });
  if (!lagen.length) {
    console.warn('diepte-beeld: geen lagen gevonden — overgeslagen');
    return () => {};
  }

  const touch = isTouch(doc);
  const scrollAmp = touch ? scrollTouch : scroll;
  let breed = 1; let hoog = 1; // gemeten bij resize, niet per frame
  let mx = 0; let my = 0; // muisdoel, -1..1
  let sy = 0; // scrolldoel, -1..1
  let cx = 0; let cy = 0; let cs = 0; // huidige (gedempte) waarden
  let zichtbaar = false;
  let raf = 0;
  let klaar = false;

  const schrijf = () => {
    for (const l of lagen) {
      const x = -cx * muis * breed * l.diepte;
      const y = -cy * muis * hoog * l.diepte + cs * scrollAmp * hoog * l.diepte;
      const tekst = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (tekst !== l.laatst) { l.node.style.transform = tekst; l.laatst = tekst; }
    }
  };
  const wis = () => {
    for (const l of lagen) { l.node.style.transform = ''; l.laatst = ''; }
    cx = cy = cs = 0;
  };

  const stap = () => {
    raf = 0;
    if (!zichtbaar || reduced) return;
    cx += (mx - cx) * demping;
    cy += (my - cy) * demping;
    cs += (sy - cs) * demping;
    const rust = Math.abs(mx - cx) * breed < RUST && Math.abs(my - cy) * hoog < RUST && Math.abs(sy - cs) * hoog < RUST;
    if (rust) { cx = mx; cy = my; cs = sy; }
    schrijf();
    if (!rust) raf = win.requestAnimationFrame(stap);
  };
  const wek = () => { if (!raf && zichtbaar && !reduced) raf = win.requestAnimationFrame(stap); };

  const meet = () => {
    const r = el.getBoundingClientRect();
    breed = r.width || 1; hoog = r.height || 1;
  };
  // Scrollpositie van het beeld: +1 net onder de viewport, -1 net erboven.
  const leesScroll = () => {
    const r = el.getBoundingClientRect();
    const vh = win.innerHeight || 1;
    const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
    sy = Math.max(-1, Math.min(1, p));
  };

  // Buiten beeld of bij minder beweging vragen scroll en resize niet eens een frame aan.
  const opScrollFrame = perFrame(() => { leesScroll(); wek(); }, doc);
  const opScroll = () => { if (zichtbaar && !reduced) opScrollFrame(); };
  const opMuis = (e) => {
    if (!zichtbaar || reduced || touch || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    mx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / (r.width || 1)) * 2 - 1));
    my = Math.max(-1, Math.min(1, ((e.clientY - r.top) / (r.height || 1)) * 2 - 1));
    wek();
  };
  const opWeg = () => { mx = 0; my = 0; wek(); };
  const opResizeFrame = perFrame(() => { meet(); leesScroll(); wek(); }, doc);
  const opResize = () => { if (zichtbaar && !reduced) opResizeFrame(); };

  let reduced = false;
  const mb = minderBeweging((r) => {
    reduced = r;
    if (r) { win.cancelAnimationFrame(raf); raf = 0; wis(); } else if (zichtbaar) { meet(); leesScroll(); wek(); }
  }, doc);
  reduced = mb.reduced;

  el.setAttribute('data-db-actief', '');

  // Lagen samen tonen: zolang niet alle afbeeldingen binnen zijn, blijven alle lagen behalve de
  // eerste (de achtergrond) onzichtbaar (CSS op data-db-laden); dan komt het gras niet los na de duinen.
  // Terugval: fout of na 4 s tonen we wat er is (R2), en zonder JS staat alles er gewoon.
  const wacht = [...el.querySelectorAll('img')].filter((i) => !i.complete && i.loading !== 'lazy'); // lui geladen lagen (onder de vouw) wachten we niet op
  let laadTimer = 0;
  const klaarLaden = () => { win.clearTimeout(laadTimer); wacht.forEach((i) => { i.removeEventListener('load', geteld); i.removeEventListener('error', geteld); }); el.removeAttribute('data-db-laden'); };
  const geteld = () => { if (wacht.every((i) => i.complete)) klaarLaden(); };
  if (wacht.length) {
    el.setAttribute('data-db-laden', '');
    wacht.forEach((i) => { i.addEventListener('load', geteld); i.addEventListener('error', geteld); });
    laadTimer = win.setTimeout(klaarLaden, 4000);
  }
  meet();
  const stopBeeld = inBeeld(el, () => {
    zichtbaar = true;
    if (!reduced) { meet(); leesScroll(); wek(); }
  }, {
    once: false,
    rootMargin: '100px',
    bijUit: () => { zichtbaar = false; win.cancelAnimationFrame(raf); raf = 0; opScrollFrame.cancel(); opResizeFrame.cancel(); },
  });

  win.addEventListener('scroll', opScroll, { passive: true });
  win.addEventListener('resize', opResize, { passive: true });
  if (!touch) {
    el.addEventListener('pointermove', opMuis, { passive: true });
    el.addEventListener('pointerleave', opWeg, { passive: true });
  }

  return () => {
    if (klaar) return;
    klaar = true;
    stopBeeld(); mb.stop(); klaarLaden();
    opScrollFrame.cancel(); opResizeFrame.cancel();
    win.cancelAnimationFrame(raf); raf = 0;
    win.removeEventListener('scroll', opScroll);
    win.removeEventListener('resize', opResize);
    el.removeEventListener('pointermove', opMuis);
    el.removeEventListener('pointerleave', opWeg);
    for (const l of lagen) l.node.style.removeProperty('transform');
    el.removeAttribute('data-db-actief');
  };
}
