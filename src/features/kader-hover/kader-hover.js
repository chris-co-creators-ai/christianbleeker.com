/**
 * kader-hover
 * ------------------------------------------------------------------------
 * Kaart die bij hover of focus een selectiekader met 8 handvatjes krijgt
 * (zoals een geselecteerd object in een ontwerpprogramma), beige kleurt en
 * onderin een knop laat uitveren. Het effect zelf is CSS (kader-hover.css);
 * deze module doet alleen het opt-in: ze zet `data-kader-actief` (en een frame later `data-kader-anim`, voor de transities) op de root
 * zodat de knop pas ingeklapt wordt als de CSS-versie ook echt draait. Zonder
 * JS blijft de knop gewoon zichtbaar (R4).
 *
 * Herkomst: gedrag gezien op bureautandem.nl (diensten-blok). Eigen code.
 *
 * @typedef {Object} KaderHoverOptions
 * @property {string} [selector="[data-kader]"] Kaarten binnen `root`. Elementen die de selector vindt maar nog geen `data-kader` hebben, krijgen het attribuut (en verliezen het bij destroy).
 *
 * @param {Element} root
 * @param {KaderHoverOptions} [opties]
 * @returns {() => void} destroy, idempotent
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'kader-hover')) return () => {};
  const { selector = '[data-kader]' } = opties;

  const toegevoegd = [];
  for (const kaart of root.querySelectorAll(selector)) {
    if (!kaart.hasAttribute('data-kader')) {
      kaart.setAttribute('data-kader', '');
      toegevoegd.push(kaart);
    }
  }
  root.setAttribute('data-kader-actief', '');
  const win = (root.ownerDocument || document).defaultView || window;
  const raf = win.requestAnimationFrame(() => root.setAttribute('data-kader-anim', ''));

  let klaar = false;
  return function destroy() {
    if (klaar) return;
    klaar = true;
    win.cancelAnimationFrame(raf);
    root.removeAttribute('data-kader-actief');
    root.removeAttribute('data-kader-anim');
    for (const kaart of toegevoegd) kaart.removeAttribute('data-kader');
  };
}
