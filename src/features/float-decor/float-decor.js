/**
 * effects/float-decor
 * ------------------------------------------------------------------------
 * Vijf lichte decor-hulpjes onder één contract, elk via een eigen
 * data-attribuut:
 *  - `data-float`   zwevend object (dobberen, verticale bob-animatie)
 *  - `data-tilt`    kantel-utility, waarde in graden, bv. `data-tilt="-6"`
 *  - `data-confetti` confetti-stippen rond een foto
 *  - `data-offset-kader` offset-fotokader
 *  - `data-badge`   draaiende badge/stempel
 *
 * `data-confetti` en `data-offset-kader` zijn **pure CSS** (een
 * `::before`-pseudo-element) — geen JS nodig, werken al zonder script.
 * `data-tilt` heeft JS nodig om de graden-waarde om te zetten naar de CSS-
 * variabele `--fd-tilt` (CSS `attr()` ondersteunt nog geen hoek-types
 * betrouwbaar cross-browser). `data-float` en `data-badge` animeren
 * continu via CSS `@keyframes`; JS's enige taak daar is pauzeren zodra het
 * element buiten beeld is (R18) — `prefers-reduced-motion` regelt de CSS
 * zelf, live, zonder JS (`@media`-query).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

const UIT_BEELD_ATTR = 'data-fd-uit-beeld';
const AANGEZET_ARIA_ATTR = 'data-fd-aria-gezet';

/**
 * @param {Element} root
 * @param {{ rootMargin?: string }} [opties]
 * @returns {() => void} destroy — idempotent.
 */
export function init(root, opties = {}) {
  if (!vereisRoot(root, 'float-decor')) return () => {};
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const { rootMargin = '80px' } = opties;
  const cleanups = [];

  // --- kantel-utility: attribuutwaarde -> CSS-variabele -----------------
  const tiltHosts = [];
  if (typeof root.matches === 'function' && root.matches('[data-tilt]')) tiltHosts.push(root);
  tiltHosts.push(...root.querySelectorAll('[data-tilt]'));
  for (const el of tiltHosts) {
    const graden = Number(el.getAttribute('data-tilt'));
    if (Number.isFinite(graden)) el.style.setProperty('--fd-tilt', `${graden}deg`);
  }

  // --- aria-hidden op pure decoratie (tenzij de auteur al iets zette) ---
  const decoSelector = '[data-float], [data-badge]';
  const decoHosts = [];
  if (typeof root.matches === 'function' && root.matches(decoSelector)) decoHosts.push(root);
  decoHosts.push(...root.querySelectorAll(decoSelector));
  const ariaGezet = [];
  for (const el of decoHosts) {
    if (!el.hasAttribute('aria-hidden')) {
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute(AANGEZET_ARIA_ATTR, '');
      ariaGezet.push(el);
    }
  }

  // --- buiten-beeld-pauze voor de twee continu-animerende varianten -----
  let io = null;
  if (decoHosts.length && 'IntersectionObserver' in win) {
    io = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute(UIT_BEELD_ATTR, !entry.isIntersecting);
        }
      },
      { rootMargin, threshold: 0 },
    );
    for (const el of decoHosts) io.observe(el);
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (io) io.disconnect();
    for (const el of decoHosts) el.removeAttribute(UIT_BEELD_ATTR);
    for (const el of ariaGezet) {
      el.removeAttribute('aria-hidden');
      el.removeAttribute(AANGEZET_ARIA_ATTR);
    }
    for (const el of tiltHosts) el.style.removeProperty('--fd-tilt');
  };
}
