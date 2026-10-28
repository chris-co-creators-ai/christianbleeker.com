/**
 * logo-kleurwissel
 * ------------------------------------------------------------------------
 * Een vast (fixed of sticky) SVG-logo met `fill="currentColor"` wisselt van
 * kleur zodra het boven een sectie met `data-logo="licht"` hangt (de sectie is
 * donker, dus het logo wordt licht). Geen scroll-listener: een
 * IntersectionObserver met een `rootMargin` die de viewport tot een band ter
 * hoogte van het logo versmalt. Bij een treffer toetst de callback welke
 * sectie het midden van het logo bevat.
 *
 * Mobiel menu: als de menuknop `aria-expanded="true"` krijgt, volgt het logo
 * de kleur van het menupaneel (`data-logo-menu="licht"|"donker"`) in plaats van
 * die van de sectie eronder.
 *
 * Staat: `data-lk-staat="licht"|"donker"` op het logo. De kleuren staan in CSS.
 *
 * @typedef {Object} LogoKleurwisselOptions
 * @property {string} [secties] Selector voor de secties (standaard `[data-logo]`).
 * @property {string} [menuKnop] Selector voor de menuknop met aria-expanded (standaard `[data-logo-menu-knop]`).
 * @property {string} [menuPaneel] Selector voor het menupaneel (standaard `[data-logo-menu]`).
 *
 * @param {Element} root Het logo-element (fixed of sticky).
 * @param {LogoKleurwisselOptions} [opties]
 * @returns {() => void} destroy. Idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

const STAAT = 'data-lk-staat';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'logo-kleurwissel')) return () => {};
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const { secties = '[data-logo]', menuKnop = '[data-logo-menu-knop]', menuPaneel = '[data-logo-menu]' } = opties;

  const lijst = Array.from(doc.querySelectorAll(secties));
  const knop = doc.querySelector(menuKnop);
  const paneel = doc.querySelector(menuPaneel);
  const raken = new Set();
  let sectieStaat = 'donker';
  let io = null;
  let ro = null;
  let mo = null;

  const waarde = (v) => (v === 'licht' ? 'licht' : 'donker');
  const menuOpen = () => !!knop && knop.getAttribute('aria-expanded') === 'true';

  function zet() {
    const staat = menuOpen() && paneel ? waarde(paneel.getAttribute('data-logo-menu')) : sectieStaat;
    if (root.getAttribute(STAAT) !== staat) root.setAttribute(STAAT, staat);
  }

  // Welke geraakte sectie bevat het midden van het logo? Alleen aangeroepen vanuit de observer.
  function bepaalSectie() {
    const r = root.getBoundingClientRect();
    const midden = r.top + r.height / 2;
    sectieStaat = 'donker';
    for (const el of raken) {
      const b = el.getBoundingClientRect();
      if (b.top <= midden && b.bottom > midden) sectieStaat = waarde(el.getAttribute('data-logo'));
    }
    zet();
  }

  function bouwObserver() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in win)) return;
    // christianbleeker v3: een band van 1 px op het midden van het logo. De observer meldt alleen een wissel van
    // "raakt de band"; met de hele logohoogte als band bleef het logo hangen als een sectie binnenkwam tussen de
    // onderrand en het midden (langzaam scrollen). Nu is "raakt de band" precies "bevat het midden".
    const r = root.getBoundingClientRect();
    const mid = Math.round(r.top + r.height / 2);
    const top = Math.max(0, mid);
    const onder = Math.max(0, Math.round(win.innerHeight - mid - 1));
    raken.clear();
    io = new win.IntersectionObserver((entries) => {
      for (const e of entries) (e.isIntersecting ? raken.add(e.target) : raken.delete(e.target));
      bepaalSectie();
    }, { rootMargin: `-${top}px 0px -${onder}px 0px`, threshold: 0 });
    lijst.forEach((el) => io.observe(el));
  }

  root.setAttribute(STAAT, 'donker');
  bouwObserver();

  // Venstermaat of logomaat verandert: band opnieuw bepalen.
  if ('ResizeObserver' in win) {
    ro = new win.ResizeObserver(() => bouwObserver());
    ro.observe(root);
    ro.observe(doc.documentElement);
  }
  if (knop && 'MutationObserver' in win) {
    mo = new win.MutationObserver(zet);
    mo.observe(knop, { attributes: true, attributeFilter: ['aria-expanded'] });
  }
  zet();

  let klaar = false;
  return function destroy() {
    if (klaar) return;
    klaar = true;
    if (io) io.disconnect();
    if (ro) ro.disconnect();
    if (mo) mo.disconnect();
    raken.clear();
    root.removeAttribute(STAAT);
  };
}
