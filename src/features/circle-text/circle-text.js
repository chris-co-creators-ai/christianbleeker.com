/**
 * circle-text
 * ------------------------------------------------------------------------
 * Tekst rond een cirkel (SVG `<textPath>`) die langzaam ronddraait, met een
 * optioneel icoon/foto in het midden en klikbaar als link. De rotatie zelf
 * is pure CSS (`animation` + `animation-play-state` op hover/focus).
 *
 * G15: de tekst moet de omtrek precies vullen — te weinig herhalingen laat
 * een kaal stuk pad zien, te veel (of te lang) knipt de SVG gewoon af waar
 * het pad ophoudt (geen automatische regelafbreking op een gesloten lus).
 * Vaste, met de hand herhaalde tekst in de markup ("WOORD • WOORD • ") raadt
 * dus altijd: bij de beta-ronde gaf dat een naad zonder scheidingsteken
 * ("AMBACHTWARE") en een afgekapte herhaling. Deze module meet in plaats
 * daarvan de echte padlengte (`path.getTotalLength()`) en de lengte van één
 * "eenheid" tekst (`getComputedTextLength()`), kiest het rondste aantal
 * herhalingen dat daar het dichtst bij komt, en dwingt de rest af met SVG's
 * eigen `textLength`/`lengthAdjust="spacing"` — de tekens verschuiven een
 * fractie op elkaar, maar de lus sluit altijd exact, zonder gat of overlap.
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * Herkomst: draaiende cirkeltekst gezien bij Bij Sidney ("ONTDEK HET MENU"),
 * en verwante draaiende badges/stempels bij Zwaartafelen, Bovenkamp, Prime
 * Padel. Eigen implementatie, geen code overgenomen.
 *
 * @typedef {Object} CircleTextOptions
 * @property {number} [duration=24] Rotatieduur in seconden.
 * @property {string} [separator=' • '] Scheidingsteken tussen de herhalingen.
 *
 * @param {Element} root Het klikbare element (`<a>`) met `data-circle-text`, bevat `.ct__ring` (SVG met textPath, met de tekst ÉÉN keer, zonder handmatige herhaling).
 * @param {CircleTextOptions} [options]
 * @returns {() => void} destroy — idempotent.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

/**
 * Herhaalt de basiszin zo vaak als nodig om de padlengte te benaderen, en
 * dwingt daarna met textLength/lengthAdjust een exacte, naadloze pasvorm af.
 * @param {SVGTextElement} textEl
 * @param {SVGTextPathElement} textPathEl
 * @param {SVGGeometryElement} pathEl
 * @param {string} separator
 */
function vulOmtrek(textEl, textPathEl, pathEl, separator) {
  const basis = (textPathEl.textContent || '').trim();
  if (!basis || typeof pathEl.getTotalLength !== 'function') return;

  const omtrek = pathEl.getTotalLength();
  const eenheid = `${basis}${separator}`;

  // Eén eenheid meten (in dezelfde SVG-gebruikerseenheden als de padlengte).
  textPathEl.textContent = eenheid;
  const eenheidLengte = typeof textPathEl.getComputedTextLength === 'function'
    ? textPathEl.getComputedTextLength()
    : 0;
  if (!eenheidLengte) return; // niet meetbaar (bv. jsdom) — laat de enkele eenheid staan

  const herhalingen = Math.max(1, Math.round(omtrek / eenheidLengte));
  textPathEl.textContent = eenheid.repeat(herhalingen);

  // Exact laten sluiten: SVG rekt/comprimeert de glyph-tussenruimte (niet de
  // glyphs zelf) zodat de totale tekstlengte precies de omtrek dekt.
  textEl.setAttribute('textLength', String(omtrek));
  textEl.setAttribute('lengthAdjust', 'spacing');
}

export function init(root, options = {}) {
  if (!vereisRoot(root, 'circle-text')) return () => {};

  const { duration = 24, separator = ' • ' } = options;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const ring = root.querySelector('.ct__ring');

  root.style.setProperty('--ct-duration', `${duration}s`);
  root.setAttribute('data-ct-ready', '');

  let restoreTextPath = () => {};
  if (ring) {
    const textEl = ring.querySelector('text');
    const textPathEl = ring.querySelector('textPath');
    const pathId = textPathEl && (textPathEl.getAttribute('href') || textPathEl.getAttribute('xlink:href') || '').replace(/^#/, '');
    const pathEl = pathId ? (root.ownerDocument || doc).getElementById(pathId) : null;
    if (textEl && textPathEl && pathEl) {
      const oorspronkelijkeTekst = textPathEl.textContent;
      vulOmtrek(textEl, textPathEl, pathEl, separator);
      restoreTextPath = () => {
        textPathEl.textContent = oorspronkelijkeTekst;
        textEl.removeAttribute('textLength');
        textEl.removeAttribute('lengthAdjust');
      };
    }
  }

  const reduced = minderBeweging(undefined, doc);
  if (reduced.reduced || !ring) {
    return function destroy() {
      root.removeAttribute('data-ct-ready');
      root.style.removeProperty('--ct-duration');
      reduced.stop();
      restoreTextPath();
    };
  }

  // Eigen IntersectionObserver: pauzeert de doorlopende CSS-animatie zodra
  // de cirkel buiten beeld is (basis.js `inBeeld()` meldt alleen het ín
  // beeld komen, niet het weer verdwijnen — hier is precies dat nodig).
  let observer = null;
  if ('IntersectionObserver' in win) {
    observer = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          root.classList.toggle('ct--offscreen', !entry.isIntersecting);
        }
      },
      { threshold: 0 }
    );
    observer.observe(root);
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (observer) observer.disconnect();
    reduced.stop();
    root.classList.remove('ct--offscreen');
    root.removeAttribute('data-ct-ready');
    root.style.removeProperty('--ct-duration');
    restoreTextPath();
  };
}
