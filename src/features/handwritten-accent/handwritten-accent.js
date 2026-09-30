/**
 * handwritten-accent
 * ------------------------------------------------------------------------
 * Klein handgeschreven label boven een kop ("Net opgeleverd", "Binnenkort!"),
 * licht gekanteld, met een optioneel pijltje/krul (inline SVG) dat — samen
 * met het label — bij in beeld komen kan lijken alsof het "geschreven"
 * wordt: de tekst wist zich open (clip-path) en het SVG-pad tekent zich
 * (stroke-dashoffset), beide via een CSS-transition. Vanilla ES-module,
 * 0 dependencies, SSR-veilig: raakt window/document pas aan bij `init()`.
 *
 * Herkomst: eigen implementatie; patroon gezien bij meerdere bureausites
 * (Caveat/Shadows Into Light/Pacifico, gekanteld). Wij voegen de "wordt
 * geschreven"-animatie toe (het label staat anders altijd meteen stil).
 *
 * @typedef {Object} HandwrittenAccentOptions
 * @property {boolean} [animate=true] "Wordt geschreven"-animatie bij in beeld. false = meteen af.
 * @property {boolean} [once=true] Na de animatie niet opnieuw spelen bij terug-scrollen.
 * @property {number} [threshold=0.4] IntersectionObserver-threshold.
 *
 * @param {Element} root Element met `data-handwritten-accent`, bevat `.hwa__label` en optioneel `.hwa__squiggle` (SVG met één of meer `<path>`).
 * @param {HandwrittenAccentOptions} [options]
 * @returns {() => void} destroy — idempotent.
 */
import { minderBeweging, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'handwritten-accent')) return () => {};

  const { animate = true, once = true, threshold = 0.4 } = options;

  const READY_ATTR = 'data-hwa-ready';
  const WRITTEN_CLASS = 'is-written';

  const doc = root.ownerDocument || document;
  const paths = Array.from(root.querySelectorAll('.hwa__squiggle path'));

  // Padlengte vastleggen zodat het pad als "getekend" kan starten.
  for (const p of paths) {
    try {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    } catch {
      /* SVG nog niet gerenderd (bv. display:none) — laat staan, geen crash */
    }
  }

  let destroyed = false;
  let stopReduced = () => {};
  let stopObserver = () => {};

  function playImmediately() {
    root.classList.add(WRITTEN_CLASS);
    for (const p of paths) p.style.strokeDashoffset = '0';
  }

  function reset() {
    root.classList.remove(WRITTEN_CLASS);
    for (const p of paths) {
      const len = p.style.strokeDasharray;
      if (len) p.style.strokeDashoffset = len;
    }
  }

  const reduced = minderBeweging((isReduced) => {
    if (isReduced) playImmediately();
  }, doc);

  if (reduced.reduced || !animate) {
    root.setAttribute(READY_ATTR, '');
    playImmediately();
  } else {
    root.setAttribute(READY_ATTR, '');
    stopObserver = inBeeld(
      root,
      () => {
        root.classList.add(WRITTEN_CLASS);
        for (const p of paths) p.style.strokeDashoffset = '0';
      },
      { once, threshold }
    );
  }
  stopReduced = reduced.stop;

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopObserver();
    stopReduced();
    root.removeAttribute(READY_ATTR);
    reset();
    for (const p of paths) {
      p.style.removeProperty('stroke-dasharray');
      p.style.removeProperty('stroke-dashoffset');
    }
  };
}
