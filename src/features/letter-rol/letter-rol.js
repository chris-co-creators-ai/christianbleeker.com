/**
 * letter-rol
 * ------------------------------------------------------------------------
 * Bij hover of toetsenbordfocus rolt de tekst van een knop of link letter
 * voor letter omhoog; een kopie komt van onder. De kopie is geen tweede
 * element maar de `text-shadow` van dezelfde letter (zie CSS); deze module
 * knipt de tekst alleen in letters en geeft elke letter een index `--i`
 * voor de vertraging.
 *
 * Zonder JS en bij "minder beweging" blijft het gewone tekst (we knippen dan
 * niet eens). De naam staat als schermlezertekst (`.lr-sr`) in de knop zelf, de
 * letters zijn `aria-hidden`; er komt geen `aria-label` bij, zodat de naam altijd
 * de zichtbare tekst bevat (WCAG 2.5.3, Lighthouse label-content-name-mismatch).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @typedef {Object} LetterRolOptions
 * @property {string} [selector] Welke elementen binnen root (standaard `[data-letter-rol]`).
 * @property {number} [stagger] Totale spreiding in seconden over alle letters (standaard 0,23).
 *
 * @param {Element} root
 * @param {LetterRolOptions} [options]
 * @returns {() => void} destroy — zet de originele tekst terug. Idempotent.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'letter-rol')) return () => {};
  const selector = options.selector || '[data-letter-rol]';
  const stagger = options.stagger ?? 0.23;
  const doc = root.ownerDocument || document;
  const hosts = Array.from(root.querySelectorAll(selector));
  if (root.matches && root.matches(selector)) hosts.unshift(root);

  /** @type {Map<Element, {kinderen: Node[]}>} */
  const gesplitst = new Map();

  function knip(host) {
    if (gesplitst.has(host)) return;
    const tekst = (host.textContent || '').replace(/\s+/g, ' ').trim();
    if (!tekst) return;
    const letters = Array.from(tekst);
    const stap = letters.length > 1 ? stagger / (letters.length - 1) : 0;
    gesplitst.set(host, { kinderen: Array.from(host.childNodes) });
    const frag = doc.createDocumentFragment();
    // De naam komt uit de inhoud (geen aria-label): de letters hieronder zijn aria-hidden.
    const sr = doc.createElement('span');
    sr.className = 'lr-sr';
    sr.textContent = tekst;
    frag.appendChild(sr);
    letters.forEach((l, i) => {
      const s = doc.createElement('span');
      s.className = 'lr-letter';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', String(i));
      s.textContent = l;
      frag.appendChild(s);
    });
    host.style.setProperty('--lr-step', `${stap.toFixed(4)}s`);
    host.replaceChildren(frag);
    host.setAttribute('data-lr-actief', '');
  }

  function herstel(host) {
    const st = gesplitst.get(host);
    if (!st) return;
    host.replaceChildren(...st.kinderen);
    host.removeAttribute('data-lr-actief');
    host.style.removeProperty('--lr-step');
    if (!host.getAttribute('style')) host.removeAttribute('style');
    gesplitst.delete(host);
  }

  const beweging = minderBeweging((reduced) => {
    for (const h of hosts) (reduced ? herstel : knip)(h);
  }, doc);
  if (!beweging.reduced) hosts.forEach(knip);

  let klaar = false;
  return function destroy() {
    if (klaar) return;
    klaar = true;
    beweging.stop();
    for (const h of Array.from(gesplitst.keys())) herstel(h);
  };
}
