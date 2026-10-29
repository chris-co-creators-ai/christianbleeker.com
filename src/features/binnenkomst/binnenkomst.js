/**
 * binnenkomst
 * ------------------------------------------------------------------------
 * Elementen met `[data-binnenkomst="stijg|kantel|masker|kwart"]` komen in beeld zodra ze de viewport in
 * scrollen. Wat tegelijk binnenkomt, staggert vanzelf (stap per element in dezelfde observer-ronde), dus
 * geen vaste vertraging per index. `data-binnenkomst-groep` op een ouder = elk kind telt als element.
 *
 *  - stijg  : 20 px omhoog met een lichte blur (6 px) naar scherp
 *  - kantel : vanuit een 3D-hoek (rotateX 14°, scharnier onderaan) rechtop draaien
 *  - masker : een beeld schuift binnen zijn eigen kader (overflow: hidden) omhoog open
 *  - kwart  : een nummer of icoon draait een kwartslag op zijn plek
 *
 * Alleen transform en opacity (plus een kleine blur bij `stijg`), één IntersectionObserver, geen
 * scroll-listener. Zonder JS en bij minder beweging wordt de verborgen staat nooit gezet. Na afloop haalt de
 * module al haar attributen weg: het element valt terug op zijn eigen CSS (hover-overgangen blijven heel).
 *
 * Twee fasen, net als reveal-on-scroll: `data-bk-uit` verbergt synchroon zonder overgang, één frame later
 * zet `data-bk-aan` de overgang aan; `data-bk-in` laat het element binnenkomen.
 *
 * Herkomst: eigen implementatie (Seveke Creative, 29-10-2026) voor christianbleeker v3.
 *
 * @param {Element} root container waarin gezocht wordt
 * @param {{ selector?: string, stap?: number, maxStap?: number, marge?: string }} [opties]
 * @returns {() => void} destroy, idempotent
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

const ATTR = ['data-bk-uit', 'data-bk-aan', 'data-bk-in'];

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'binnenkomst')) return () => {};
  const { selector = '[data-binnenkomst]', stap = 0.07, maxStap = 6, marge = '0px 0px -10% 0px' } = opties;
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const mb = minderBeweging(undefined, doc);
  if (mb.reduced || !('IntersectionObserver' in win)) return () => {};

  const items = [];
  for (const el of root.querySelectorAll(selector)) {
    const soort = el.getAttribute('data-binnenkomst') || 'stijg';
    for (const k of el.hasAttribute('data-binnenkomst-groep') ? el.children : [el]) {
      if (k.hasAttribute('data-bk-uit')) continue;
      k.setAttribute('data-bk-uit', soort);
      items.push(k);
    }
  }
  if (!items.length) return () => {};

  const opruimen = (k) => { for (const a of ATTR) k.removeAttribute(a); k.style.removeProperty('--bk-d'); };
  const timers = new Set();
  void root.getBoundingClientRect();
  let raf = win.requestAnimationFrame(() => { raf = 0; for (const k of items) k.setAttribute('data-bk-aan', ''); });

  // Een masker-beeld staat verschoven binnen een kader met overflow: hidden, dus zelf snijdt het de viewport
  // niet: observeer dan het kader (de eerste ouder die afknipt).
  const kader = (k) => {
    for (let o = k.parentElement; o && o !== root; o = o.parentElement) if (win.getComputedStyle(o).overflow !== 'visible') return o;
    return k.parentElement || k;
  };
  const doelVan = new Map();
  for (const k of items) doelVan.set(k.getAttribute('data-bk-uit') === 'masker' ? kader(k) : k, k);

  const io = new win.IntersectionObserver((entries) => {
    let i = 0;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const k = doelVan.get(e.target);
      if (!k) continue;
      const d = Math.min(i++, maxStap) * stap;
      k.style.setProperty('--bk-d', `${d.toFixed(2)}s`);
      k.setAttribute('data-bk-aan', '');
      k.setAttribute('data-bk-in', '');
      // Langste overgang 1,1 s (masker) + vertraging; daarna is het element weer helemaal van zichzelf.
      const t = win.setTimeout(() => { timers.delete(t); opruimen(k); }, (d + 1.3) * 1000);
      timers.add(t);
    }
  }, { threshold: 0, rootMargin: marge });
  for (const doel of doelVan.keys()) io.observe(doel);

  // Zet de bezoeker halverwege "minder beweging" aan: alles direct naar het eindbeeld.
  const live = minderBeweging((r) => { if (r) destroy(); }, doc);

  let klaar = false;
  function destroy() {
    if (klaar) return;
    klaar = true;
    io.disconnect();
    live.stop();
    if (raf) win.cancelAnimationFrame(raf);
    for (const t of timers) win.clearTimeout(t);
    for (const k of items) opruimen(k);
  }
  return destroy;
}
