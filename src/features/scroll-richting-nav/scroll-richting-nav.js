/**
 * scroll-richting-nav
 * ------------------------------------------------------------------------
 * Navigatie die wegschuift als je omlaag scrolt en terugkomt zodra je
 * omhoog scrolt. Eén passieve scrolllezer telt de verschuiving op; bij een
 * richtingwissel begint de teller opnieuw, en pas na `drempel` px in één
 * richting wisselt de stand. Bovenaan de pagina is de nav altijd zichtbaar.
 * Hij blijft staan zolang een menu open is (`[aria-expanded="true"]` in de
 * nav, of een open modale dialog) of de toetsenbordfocus erin zit.
 *
 * De JS zet alleen `data-srn-weg`; de CSS doet `translate: 0 -110%` met
 * .45 s power3.out. De nav zelf moet sticky of fixed staan (jouw CSS).
 *
 * Herkomst: gedrag gezien op bureautandem.nl (`initCasesNavbar`: drempel
 * 8 px, teller op 0 bij richtingwissel, binnen 20 px van boven zichtbaar);
 * eigen implementatie zonder GSAP en zonder hun code.
 *
 * @typedef {Object} ScrollRichtingNavOpties
 * @property {number} [drempel=8] Pixels in één richting voordat de stand wisselt.
 * @property {number} [bovenaan=20] Binnen zoveel px van de bovenkant altijd zichtbaar.
 * @property {() => boolean} [blijfStaan] Extra voorwaarde om zichtbaar te blijven (naast menu open en focus).
 * @property {(weg: boolean) => void} [onChange]
 *
 * @param {Element} root De nav of header.
 * @param {ScrollRichtingNavOpties} [opties]
 * @returns {() => void} destroy — listeners en attributen weg. Idempotent.
 */
import { perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

/**
 * Pure kern: nieuwe stand na een scrollstap. Los te testen.
 * @param {{ weg: boolean, som: number, y: number }} s vorige stand
 * @param {number} y nieuwe scrollY
 * @param {{ drempel: number, bovenaan: number, vast: boolean }} o
 */
export function stap(s, y, o) {
  const d = y - s.y;
  let som = s.som;
  if (d !== 0 && Math.sign(d) !== Math.sign(som)) som = 0; // richtingwissel: opnieuw tellen
  som += d;
  let weg = s.weg;
  if (y <= o.bovenaan || o.vast) weg = false;
  else if (som > o.drempel) weg = true;
  else if (som < -o.drempel) weg = false;
  return { weg, som, y };
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'scroll-richting-nav')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const { drempel = 8, bovenaan = 20, blijfStaan, onChange } = opties;

  let s = { weg: false, som: 0, y: win.scrollY };
  let destroyed = false;

  // Toetsenbordfocus houdt de nav vast; een muisklik op een navlink niet (die link houdt de focus, maar de bezoeker leest verder).
  const focusErin = () => root.contains(doc.activeElement) && doc.activeElement.matches(':focus-visible');
  const vast = () =>
    focusErin()
    || !!root.querySelector('[aria-expanded="true"]')
    || !!doc.querySelector('dialog[open]:modal')
    || !!(blijfStaan && blijfStaan());

  function zet(weg) {
    if (weg === root.hasAttribute('data-srn-weg')) return;
    root.toggleAttribute('data-srn-weg', weg);
    if (onChange) onChange(weg);
  }

  const lees = perFrame(() => {
    s = stap(s, win.scrollY, { drempel, bovenaan, vast: vast() });
    zet(s.weg);
  }, doc);

  // Focus erin (Tab vanaf de pagina, overslaanlink): direct terug, ook zonder scroll.
  const opFocus = () => { if (!focusErin()) return; s = { ...s, weg: false, som: 0 }; zet(false); };

  root.setAttribute('data-srn-aan', '');
  win.addEventListener('scroll', lees, { passive: true });
  root.addEventListener('focusin', opFocus);

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    win.removeEventListener('scroll', lees);
    root.removeEventListener('focusin', opFocus);
    lees.cancel();
    root.removeAttribute('data-srn-weg');
    root.removeAttribute('data-srn-aan');
  };
}
