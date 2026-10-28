/**
 * magneet-beelden
 * ------------------------------------------------------------------------
 * Beelden binnen `radius` px van de muis buigen er tot `sterkte` px naartoe.
 * Doel = richting x sterkte x (1 - afstand / radius). De beweging volgt het
 * doel met een lerp: `aantrekken` (0,12) zolang het beeld verder naar de muis
 * toe gaat, `terug` (0,18) zodra het terugkeert. Alleen bij een fijne pointer
 * en zonder "minder beweging", live aan en uit te zetten. De rAF-lus draait
 * alleen zolang er iets beweegt en stopt als alles stilstaat.
 *
 *
 * @typedef {Object} MagneetBeeldenOptions
 * @property {string} [selector="[data-magneet]"] Beelden binnen `root`.
 * @property {number} [radius=250] Afstand (px) tot het middelpunt van het beeld waarbinnen de muis trekt.
 * @property {number} [sterkte=30] Maximale verschuiving in px (bij afstand 0).
 * @property {number} [aantrekken=.12] Lerp-factor zolang het beeld naar de muis toe beweegt.
 * @property {number} [terug=.18] Lerp-factor terwijl het beeld terugkeert.
 *
 * @param {Element} root
 * @param {MagneetBeeldenOptions} [opties]
 * @returns {() => void} destroy, idempotent
 */
import { vereisRoot, minderBeweging } from '../../_kwaliteit/basis.js';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'magneet-beelden')) return () => {};
  const {
    selector = '[data-magneet]',
    radius = 250,
    sterkte = 30,
    aantrekken = 0.12,
    terug = 0.18,
  } = opties;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const EPS = 0.05; // onder dit verschil (px) is een beeld "stil"

  const items = [...root.querySelectorAll(selector)].map((el) => ({ el, x: 0, y: 0 }));
  let muis = null; // { x, y } of null als de muis weg is
  let raf = 0;
  let aan = false;
  const luisteraars = [];

  function stap() {
    raf = 0;
    let beweegt = false;
    for (const it of items) {
      // natuurlijk middelpunt = huidige positie min de eigen verschuiving
      const r = it.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - it.x;
      const cy = r.top + r.height / 2 - it.y;
      let tx = 0; let ty = 0;
      if (muis) {
        const dx = muis.x - cx; const dy = muis.y - cy;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < radius) {
          const k = sterkte * (1 - d / radius);
          tx = (dx / d) * k; ty = (dy / d) * k;
        }
      }
      const naarMuis = Math.hypot(tx, ty) > Math.hypot(it.x, it.y);
      const f = naarMuis ? aantrekken : terug;
      let nx = it.x + (tx - it.x) * f;
      let ny = it.y + (ty - it.y) * f;
      if (Math.abs(tx - nx) < EPS && Math.abs(ty - ny) < EPS) { nx = tx; ny = ty; }
      else beweegt = true;
      if (nx !== it.x || ny !== it.y) {
        it.x = nx; it.y = ny;
        if (nx === 0 && ny === 0) it.el.style.removeProperty('translate');
        else it.el.style.translate = `${nx.toFixed(2)}px ${ny.toFixed(2)}px`;
      }
    }
    if (beweegt) raf = win.requestAnimationFrame(stap);
  }
  const start = () => { if (!raf && aan) raf = win.requestAnimationFrame(stap); };

  const bijBeweging = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    muis = { x: e.clientX, y: e.clientY };
    start();
  };
  const bijVertrek = () => { muis = null; start(); };
  const bijScroll = () => { if (muis) start(); };

  function zetAan() {
    if (aan) return;
    aan = true;
    root.setAttribute('data-magneet-actief', '');
    win.addEventListener('pointermove', bijBeweging, { passive: true });
    doc.documentElement.addEventListener('pointerleave', bijVertrek, { passive: true });
    win.addEventListener('scroll', bijScroll, { passive: true });
  }
  function zetUit() {
    if (!aan) return;
    aan = false;
    win.removeEventListener('pointermove', bijBeweging);
    doc.documentElement.removeEventListener('pointerleave', bijVertrek);
    win.removeEventListener('scroll', bijScroll);
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0; muis = null;
    root.removeAttribute('data-magneet-actief');
    for (const it of items) { it.x = 0; it.y = 0; it.el.style.removeProperty('translate'); }
  }

  const fijn = win.matchMedia ? win.matchMedia('(hover: hover) and (pointer: fine)') : null;
  let reduced = false;
  const bepaal = () => ((fijn ? fijn.matches : true) && !reduced ? zetAan() : zetUit());
  const mb = minderBeweging((r) => { reduced = r; bepaal(); }, doc);
  reduced = mb.reduced;
  const fijnH = () => bepaal();
  if (fijn) fijn.addEventListener ? fijn.addEventListener('change', fijnH) : fijn.addListener(fijnH);
  luisteraars.push(() => { if (fijn) fijn.removeEventListener ? fijn.removeEventListener('change', fijnH) : fijn.removeListener(fijnH); });
  bepaal();

  let klaar = false;
  return function destroy() {
    if (klaar) return;
    klaar = true;
    zetUit();
    mb.stop();
    for (const f of luisteraars) f();
  };
}
