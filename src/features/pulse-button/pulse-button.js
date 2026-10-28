/**
 * pulse-button
 * ------------------------------------------------------------------------
 * CTA-knop met een uitdijende ring (`box-shadow`-keyframes) die de aandacht
 * trekt zonder blijvend te lopen. De animatie zelf staat in de CSS
 * (`@keyframes pulse-button-ring`); deze module beperkt hoe vaak hij loopt:
 * maximaal N keer (`data-pulse-max`, standaard 3) of alleen zolang de knop
 * in beeld is (`data-pulse-in-view`).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan bij `init()`.
 *
 * @typedef {Object} PulseButtonOptions
 * @property {number} [maxPulses] Stopt de ring-animatie na dit aantal cycli (overschrijft `data-pulse-max`).
 * @property {boolean} [onlyInView] Pulseert alleen zolang de knop in beeld is (overschrijft `data-pulse-in-view`).
 *
 * @param {Element} root Container waarbinnen naar `.pulse-button` wordt gezocht.
 * @param {PulseButtonOptions} [options]
 * @returns {() => void} destroy — verwijdert observers/listeners/klassen. Idempotent.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

const RUNNING_CLASS = 'is-pulsing';
const DONE_ATTR = 'data-pulse-done';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'pulse-button')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const buttons = Array.from(root.querySelectorAll('.pulse-button'));
  const cleanups = [];

  let reduced = minderBeweging().reduced;

  const states = buttons.map((btn) => {
    const max = options.maxPulses ?? Number(btn.getAttribute('data-pulse-max') || 3);
    const onlyInView = options.onlyInView ?? btn.hasAttribute('data-pulse-in-view');
    return { btn, max, onlyInView, cycles: 0, visible: !onlyInView, done: false };
  });

  function evaluate(state) {
    const shouldRun = !reduced && !state.done && state.visible;
    state.btn.classList.toggle(RUNNING_CLASS, shouldRun);
  }

  for (const state of states) {
    const { btn } = state;

    const onIteration = () => {
      state.cycles += 1;
      if (state.max > 0 && state.cycles >= state.max) {
        state.done = true;
        btn.setAttribute(DONE_ATTR, '1');
        evaluate(state);
      }
    };
    btn.addEventListener('animationiteration', onIteration);
    cleanups.push(() => btn.removeEventListener('animationiteration', onIteration));

    if (state.onlyInView) {
      const io = new win.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            state.visible = entry.isIntersecting;
            evaluate(state);
          }
        },
        { threshold: 0.4 }
      );
      io.observe(btn);
      cleanups.push(() => io.disconnect());
    }

    evaluate(state);
    cleanups.push(() => { btn.classList.remove(RUNNING_CLASS); btn.removeAttribute(DONE_ATTR); });
  }

  const mm = minderBeweging((value) => {
    reduced = value;
    for (const state of states) evaluate(state);
  }, doc);
  cleanups.push(mm.stop);

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const fn of cleanups.splice(0)) fn();
  };
}
