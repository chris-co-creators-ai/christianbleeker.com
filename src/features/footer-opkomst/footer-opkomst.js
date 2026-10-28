/**
 * footer-opkomst
 * ------------------------------------------------------------------------
 * De inhoud van de footer schuift tijdens het inscrollen van -25 % naar 0, als
 * een gordijn dat op zijn plek zakt. Waar de browser scroll-gedreven
 * animaties kent (`animation-timeline: view()`) doet de CSS alles en blijft
 * deze module stil. Waar dat niet zo is, meet een IntersectionObserver hoever
 * de footer in beeld is en zet de voortgang in `--opkomst-p` (0..1).
 *
 * Herkomst: gedrag gezien op bureautandem.nl (footer). Eigen code.
 *
 * @typedef {Object} FooterOpkomstOptions
 * @property {'auto'|'native'|'js'} [modus="auto"] 'auto' kiest de CSS-tijdlijn als de browser die kent. 'js' forceert de IntersectionObserver-terugval (ook handig om die te testen).
 * @property {number} [stappen=50] Aantal drempels van de IntersectionObserver in de terugval.
 *
 * @param {Element} root De footer (`[data-opkomst]`) zelf.
 * @param {FooterOpkomstOptions} [opties]
 * @returns {() => void} destroy, idempotent
 */
import { vereisRoot, minderBeweging } from '../../_kwaliteit/basis.js';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'footer-opkomst')) return () => {};
  const { modus = 'auto', stappen = 50 } = opties;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const kentTijdlijn = !!(win.CSS && win.CSS.supports && win.CSS.supports('animation-timeline: view()'));
  if (modus === 'native' || (modus === 'auto' && kentTijdlijn)) return () => {};
  if (!('IntersectionObserver' in win)) return () => {};

  // terugval: JS-schakelaar zet de CSS over van tijdlijn naar variabele
  root.setAttribute('data-opkomst-js', '');
  const drempels = Array.from({ length: stappen + 1 }, (_, i) => i / stappen);
  const io = new win.IntersectionObserver((entries) => {
    const e = entries[entries.length - 1];
    const fh = e.boundingClientRect.height;
    const vh = (e.rootBounds && e.rootBounds.height) || win.innerHeight;
    // een footer hoger dan het scherm kan nooit volledig in beeld: schaal naar wat mogelijk is
    const max = fh > vh ? vh / fh : 1;
    const p = Math.min(1, e.intersectionRatio / max);
    root.style.setProperty('--opkomst-p', p.toFixed(3));
  }, { threshold: drempels });
  io.observe(root);

  // bij minder beweging toont de CSS de eindstand; de observer is dan overbodig
  const mb = minderBeweging((reduced) => {
    if (reduced) root.style.setProperty('--opkomst-p', '1');
  }, doc);

  let klaar = false;
  return function destroy() {
    if (klaar) return;
    klaar = true;
    io.disconnect();
    mb.stop();
    root.removeAttribute('data-opkomst-js');
    root.style.removeProperty('--opkomst-p');
  };
}
