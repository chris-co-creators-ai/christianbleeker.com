/**
 * backgrounds/gradient-flow
 * ------------------------------------------------------------------------
 * Bewegend pastel-gradiëntveld ("lavaflow"): 3–4 vage kleurblobs die
 * langzaam ronddrijven achter een gedeelde blur. De CSS doet al het werk
 * (blobs + `@keyframes gf-drift-*` op `transform`, zie R18); JS is hier
 * uitsluitend een pauze-schakelaar voor twee gevallen die CSS niet kan
 * zien: buiten beeld (IntersectionObserver) en een verborgen tabblad
 * (`visibilitychange`). `prefers-reduced-motion` regelt de CSS zelf, live,
 * zonder JS.
 *
 * Ander middel dan `backgrounds/aurora-dream-css`: aurora is één statische
 * laag met vier gestapelde radial-gradients (geen DOM, geen animatie, geen
 * JS). Deze module beweegt (transform-only) en pauzeert actief buiten
 * beeld/tabblad — een ander gebruiksdoel (sfeer die leeft) met een andere
 * performance-afweging (continue GPU-animatie, dus de pauze is hier wél
 * nodig).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @param {Element} root Element met de klasse `.gf` (bevat `.gf__blob`-kinderen).
 * @returns {() => void} destroy — idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

const PAUZE_ATTR = 'data-gf-pauze';

export function init(root) {
  if (!vereisRoot(root, 'gradient-flow')) return () => {};
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const cleanups = [];

  let buitenBeeld = false;
  let tabVerborgen = doc.visibilityState === 'hidden';

  function update() {
    root.toggleAttribute(PAUZE_ATTR, buitenBeeld || tabVerborgen);
  }

  if ('IntersectionObserver' in win) {
    const io = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) buitenBeeld = !entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    io.observe(root);
    cleanups.push(() => io.disconnect());
  }

  const onVisibility = () => {
    tabVerborgen = doc.visibilityState === 'hidden';
    update();
  };
  doc.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => doc.removeEventListener('visibilitychange', onVisibility));

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const fn of cleanups) fn();
    root.removeAttribute(PAUZE_ATTR);
  };
}
