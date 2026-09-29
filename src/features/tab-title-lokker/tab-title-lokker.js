/**
 * tab-title-lokker
 * ------------------------------------------------------------------------
 * Zodra de bezoeker naar een ander tabblad wisselt, wisselt de titel van
 * het tabblad (en optioneel het favicon) tussen de originele titel en een
 * lokzin — bedoeld om de aandacht terug te trekken. Bij terugkomst wordt
 * alles direct hersteld.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan zodra `init()` draait.
 *
 * @typedef {Object} TabTitleLokkerOptions
 * @property {string} [lokzin="Je koffie wordt koud ☕"] Tekst die afwisselt met de originele titel.
 * @property {number} [interval=1200] Tijd in ms tussen elke wissel, zolang het tabblad verborgen is.
 * @property {string|null} [favicon=null] URL/data-URI voor een tweede favicon. `null` = favicon blijft ongemoeid.
 *
 * @param {Document} root De `document` (of een element binnen dat document — alleen gebruikt om het juiste `document`/`window` te vinden; er wordt geen andere inhoud van `root` aangeraakt).
 * @param {TabTitleLokkerOptions} [opties]
 * @returns {() => void} destroy — idempotent, herstelt de originele titel/favicon en stopt alle timers/listeners.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

const NAAM = 'tab-title-lokker';

export function init(root, opties = {}) {
  if (!vereisRoot(root, NAAM)) return () => {};

  const opts = { lokzin: 'Je koffie wordt koud ☕', interval: 1200, favicon: null, ...opties };

  // `root` mag het document zelf zijn (heeft geen ownerDocument) of een
  // gewoon element (heeft er wel een) — dit werkt voor beide.
  const doc = root.ownerDocument || root;
  const win = doc.defaultView || window;

  const origineleTitel = doc.title;
  const faviconEl = opts.favicon ? doc.querySelector('link[rel~="icon"]') : null;
  if (opts.favicon && !faviconEl && typeof console !== 'undefined') {
    console.warn(`${NAAM}: optie "favicon" meegegeven maar geen <link rel="icon"> gevonden — alleen de titel wisselt`);
  }
  const origineleFaviconHref = faviconEl ? faviconEl.getAttribute('href') : null;

  let destroyed = false;
  let intervalId = 0;
  let lokzinActief = false;

  function zetTitel(lok) {
    doc.title = lok ? opts.lokzin : origineleTitel;
    if (faviconEl && opts.favicon) faviconEl.setAttribute('href', lok ? opts.favicon : origineleFaviconHref);
    lokzinActief = lok;
  }

  function stopKnipperen() {
    if (intervalId) win.clearInterval(intervalId);
    intervalId = 0;
  }

  function herstel() {
    stopKnipperen();
    zetTitel(false);
  }

  function startWeg() {
    stopKnipperen();
    if (beweging.reduced) {
      // R1: minder beweging = één keer wisselen, niet knipperen.
      zetTitel(true);
      return;
    }
    zetTitel(true);
    intervalId = win.setInterval(() => zetTitel(!lokzinActief), opts.interval);
  }

  function onZichtbaarheid() {
    if (destroyed) return;
    if (doc.hidden) startWeg(); else herstel();
  }

  const beweging = minderBeweging((isReduced) => {
    if (destroyed || !doc.hidden) return;
    // Live wissel van de voorkeur terwijl het tabblad al weg is: knipperen
    // stopt/start direct in plaats van te wachten op de volgende wissel.
    if (isReduced) { stopKnipperen(); zetTitel(true); } else { startWeg(); }
  }, doc);

  doc.addEventListener('visibilitychange', onZichtbaarheid);

  if (doc.hidden) startWeg();

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopKnipperen();
    doc.removeEventListener('visibilitychange', onZichtbaarheid);
    beweging.stop();
    doc.title = origineleTitel;
    if (faviconEl && origineleFaviconHref !== null) faviconEl.setAttribute('href', origineleFaviconHref);
  };
}
