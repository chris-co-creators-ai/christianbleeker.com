/**
 * eyebrow-lijn
 * ------------------------------------------------------------------------
 * Bij in beeld komen: het label komt omhoog uit een masker, een lijn met
 * pijlpunt trekt uit (transform-origin links) tot aan de zin, en de zin
 * schuift van links in. De eerste regel van de zin springt in om ruimte te
 * maken voor label en lijn (CSS, werkt ook zonder JS).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt window pas aan in init).
 *
 *
 * @typedef {Object} EyebrowLijnOpties
 * @property {string} [selector="[data-eyebrow-lijn]"] Welke blokken binnen root (root zelf telt ook mee).
 * @property {string} [rootMargin="0px 0px -20% 0px"] Trigger: bovenkant blok op 80 % van het scherm.
 * @property {boolean} [once=true] Eén keer afspelen; false = opnieuw bij terugkomen van onder.
 *
 * @param {Element} root
 * @param {EyebrowLijnOpties} [opties]
 * @returns {() => void} destroy (idempotent)
 */
import { vereisRoot, minderBeweging } from '../../_kwaliteit/basis.js';

const ACTIEF = 'data-el-actief';
const IN = 'is-in';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'eyebrow-lijn')) return () => {};
  const { selector = '[data-eyebrow-lijn]', rootMargin = '0px 0px -20% 0px', once = true } = opties;
  const doc = root.ownerDocument;
  const win = doc.defaultView;

  const blokken = [
    ...(root.matches(selector) ? [root] : []),
    ...root.querySelectorAll(selector),
  ];
  let io = null;
  let destroyed = false;

  function stil() {
    // Minder beweging of geen IO: eindbeeld, geen observer.
    if (io) { io.disconnect(); io = null; }
    for (const b of blokken) { b.removeAttribute(ACTIEF); b.classList.remove(IN); }
  }

  function start() {
    for (const b of blokken) b.setAttribute(ACTIEF, '');
    io = new win.IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add(IN);
          if (once) io.unobserve(e.target);
        } else if (!once && e.boundingClientRect.top > 0) {
          // Alleen terugzetten als het blok onder het scherm verdwijnt, zodat
          // het bij terugscrollen van boven niet opnieuw speelt.
          e.target.classList.remove(IN);
        }
      }
    }, { rootMargin, threshold: 0 });
    for (const b of blokken) io.observe(b);
  }

  const mb = minderBeweging((reduced) => { if (reduced) stil(); }, doc);
  if (blokken.length && !mb.reduced && 'IntersectionObserver' in win) start();

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    mb.stop();
    stil();
  };
}
