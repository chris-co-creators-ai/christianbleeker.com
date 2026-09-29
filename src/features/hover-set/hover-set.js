/**
 * hover-set
 * ------------------------------------------------------------------------
 * Eén set kaart-hover-effecten via `data-hover="lift|tilt|grow|zoom|arrow|corners"`
 * op elke kaart. De meeste varianten zijn puur CSS (transition op `:hover`
 * en `:has(a:focus-visible)`); deze module doet alleen wat CSS niet kan:
 * de "tilt"-variant volgt de muispositie (3D-kanteling), via CSS custom
 * properties `--tilt-x`/`--tilt-y` op de kaart.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan bij `init()`, niet bij import.
 *
 * Toegankelijkheid: elke kaart heeft precies één echte `<a>` die de hele
 * kaart beslaat (stretched-link, CSS `inset:0`) — geen JS-klik op een niet-
 * interactief element. Toetsenbordfocus op die link triggert dezelfde
 * hover-stijl via `:has(a:focus-visible)`.
 *
 * @typedef {Object} HoverSetOptions
 * @property {number} [maxTilt=6] Maximale kantelhoek in graden voor `data-hover="tilt"`.
 *
 * @param {Element} root Container waarbinnen naar `[data-hover]`-kaarten wordt gezocht.
 * @param {HoverSetOptions} [options]
 * @returns {() => void} destroy — ruimt listeners en inline custom properties op. Idempotent.
 */
import { minderBeweging, isTouch, vereisRoot, perFrame } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'hover-set')) return () => {};

  const doc = root.ownerDocument || document;
  const { maxTilt = 6 } = options;

  let reduced = minderBeweging().reduced;
  const touch = isTouch(doc);
  const cleanups = [];

  const tiltCards = Array.from(root.querySelectorAll('[data-hover="tilt"]'));

  for (const card of tiltCards) {
    const onMove = perFrame((event) => {
      if (touch || reduced) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const ry = (Math.min(1, Math.max(0, px)) - 0.5) * 2 * maxTilt;
      const rx = (0.5 - Math.min(1, Math.max(0, py))) * 2 * maxTilt;
      card.style.setProperty('--tilt-x', `${rx.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${ry.toFixed(2)}deg`);
    }, doc);

    function reset() {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }

    card.addEventListener('pointermove', onMove, { passive: true });
    card.addEventListener('pointerleave', reset);
    reset();

    cleanups.push(() => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', reset);
      onMove.cancel();
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  }

  const mm = minderBeweging((value) => { reduced = value; }, doc);
  cleanups.push(mm.stop);

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const fn of cleanups.splice(0)) fn();
  };
}
