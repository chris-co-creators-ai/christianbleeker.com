/**
 * password-reveal
 * ------------------------------------------------------------------------
 * "BE********" wordt letter voor letter het echte woord terwijl je scrolt.
 * Instelbaar startpunt (welk deel van de viewporthoogte het triggert) en
 * afstand (hoeveel scroll-pixels voor de volledige onthulling). Zonder JS
 * staat gewoon het echte woord er, onverborgen; de echte tekst is ook mét
 * JS altijd beschikbaar voor schermlezers (niet als sterretjes). Vanilla
 * ES-module, 0 dependencies, SSR-veilig.
 *
 * Herkomst: wachtwoord-onthulling gezien op een bureausite ("Beveiligd."
 * i.p.v. "BE********"). Eigen implementatie: geen code overgenomen,
 * herschreven met een eigen sr-only-structuur, een
 * IntersectionObserver-gate en `prefers-reduced-motion`-ondersteuning, geen
 * van beide aanwezig in het origineel).
 *
 * @typedef {Object} PasswordRevealOptions
 * @property {number} [start=0.75] Fractie van de viewporthoogte waarop de onthulling begint (0..1). Overschrijft `data-pr-start`.
 * @property {number} [distance=350] Scroll-afstand in px voor volledige onthulling. Overschrijft `data-pr-distance`.
 * @property {string} [mask='*'] Maskeerteken.
 *
 * @param {Element} root Element met `data-password-reveal`, bevat `.pr__real` met de echte tekst.
 * @param {PasswordRevealOptions} [options]
 * @returns {() => void} destroy — idempotent, herstelt de oorspronkelijke DOM.
 */
import { minderBeweging, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'password-reveal')) return () => {};

  const realEl = root.querySelector('.pr__real');
  if (!realEl) {
    if (typeof console !== 'undefined') console.warn('password-reveal: geen .pr__real gevonden — overgeslagen');
    return () => {};
  }

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const text = realEl.textContent;
  const start = Number(options.start ?? root.getAttribute('data-pr-start') ?? 0.75);
  const distance = Number(options.distance ?? root.getAttribute('data-pr-distance') ?? 350);
  const mask = options.mask ?? '*';

  const reduced = minderBeweging((isReduced) => {
    if (isReduced) showFull();
  }, doc);

  const maskEl = doc.createElement('span');
  maskEl.className = 'pr__mask';
  maskEl.setAttribute('aria-hidden', 'true');
  maskEl.textContent = mask.repeat(text.length);
  root.insertBefore(maskEl, realEl);
  root.setAttribute('data-pr-ready', '');

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  function showFull() {
    maskEl.textContent = text;
  }

  function update() {
    const rect = root.getBoundingClientRect();
    const startY = win.innerHeight * start;
    const progress = clamp((startY - rect.top) / distance, 0, 1);
    const visible = Math.floor(progress * text.length);
    maskEl.textContent = text.slice(0, visible) + mask.repeat(text.length - visible);
  }

  const throttled = perFrame(update, doc);

  if (reduced.reduced) {
    showFull();
  } else {
    // Eigen IntersectionObserver i.p.v. basis.js `inBeeld()`: die roept de
    // callback alleen aan bij het ín beeld komen, nooit bij het weer uit
    // beeld gaan — hier moet de scroll-listener ook weer loskoppelen
    // zodra de tekst ver buiten beeld is (R18).
    let listening = false;
    function startListening() {
      if (listening) return;
      listening = true;
      win.addEventListener('scroll', throttled, { passive: true });
      win.addEventListener('resize', throttled, { passive: true });
      update();
    }
    function stopListening() {
      if (!listening) return;
      listening = false;
      win.removeEventListener('scroll', throttled, { passive: true });
      win.removeEventListener('resize', throttled, { passive: true });
      throttled.cancel();
    }

    var observer = null;
    if ('IntersectionObserver' in win) {
      observer = new win.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) startListening();
            else stopListening();
          }
        },
        { rootMargin: '100% 0px 100% 0px' }
      );
      observer.observe(root);
    } else {
      startListening();
    }
    var stopObserve = () => { if (observer) observer.disconnect(); stopListening(); };
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    reduced.stop();
    if (typeof stopObserve === 'function') stopObserve();
    maskEl.remove();
    root.removeAttribute('data-pr-ready');
  };
}
