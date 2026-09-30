/**
 * count-up
 * ------------------------------------------------------------------------
 * Eerlijke teller: telt van 0 naar een écht getal dat de bouwer opgeeft via
 * `data-waarde`. Zonder die waarde toont het component NIETS (verborgen +
 * console-waarschuwing) — er is bewust geen "oplopend" getal zonder bron
 * (R8). Geen enkele willekeurige-getalfunctie in dit bestand, nergens: zie
 * README "Herkomst" voor waarom dat een harde regel is (een teller met een
 * willekeurig startgetal toont een verzonnen aantal).
 *
 * `data-koppel` (CSS-selector) schrijft dezelfde geformatteerde eindtekst
 * ook naar andere elementen, zodat twee plekken op de pagina nooit een
 * verschillend getal voor dezelfde claim kunnen tonen (R9).
 *
 * Telt maximaal 1× — pas zodra het element in beeld komt (`inBeeld()`,
 * once). Bij `prefers-reduced-motion: reduce` springt de teller direct naar
 * het eindgetal (R1), ook als de instelling halverwege de animatie wisselt.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan in `init()`.
 *
 * @typedef {Object} CountUpOptions
 * @property {number} [waarde] Het te tonen getal. Verplicht (via optie of `data-waarde`) — zonder geldige waarde blijft het element verborgen.
 * @property {number} [decimalen] Aantal decimalen (NL-notatie: komma). Standaard 0.
 * @property {string} [suffix] Tekst ná het getal, bv. "+" of "%".
 * @property {string} [koppel] CSS-selector: andere elementen die dezelfde eindtekst krijgen.
 * @property {string} [bron] Bronvermelding, zichtbaar getoond als toegevoegd element.
 * @property {string} [bronDatum] Datum/jaar bij de bron.
 * @property {number} [duurMs] Animatieduur in ms. Standaard 1600.
 *
 * @param {Element} root Element met (optioneel) een `[data-cu-waarde]`-kind; zonder dat kind is `root` zelf de tekstdrager.
 * @param {CountUpOptions} [opties]
 * @returns {() => void} destroy — stopt de animatie/observer en zet de oorspronkelijke tekst + zichtbaarheid terug. Idempotent.
 */
import { minderBeweging, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';

/** NL-notatie: punt als duizendtal-scheiding, komma als decimaalteken. */
export function formatteerNL(waarde, decimalen = 0) {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  }).format(waarde);
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'count-up')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const waardeAttr = opties.waarde ?? root.getAttribute('data-waarde');
  const waarde = waardeAttr === null || waardeAttr === undefined || waardeAttr === '' ? NaN : Number(waardeAttr);

  if (!Number.isFinite(waarde)) {
    console.warn('count-up: [data-waarde] ontbreekt of is geen getal — element blijft verborgen (R8: geen cijfer zonder bron)');
    const wasAlVerborgen = root.hasAttribute('hidden');
    root.setAttribute('hidden', '');
    let destroyed = false;
    return function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (!wasAlVerborgen) root.removeAttribute('hidden');
    };
  }

  const cijferEl = root.querySelector('[data-cu-waarde]') || root;
  const origineleCijferTekst = cijferEl.textContent;

  const decimalen = opties.decimalen ?? (Number(root.getAttribute('data-decimalen')) || 0);
  const suffix = opties.suffix ?? (root.getAttribute('data-suffix') ?? '');
  const koppelSelector = opties.koppel ?? root.getAttribute('data-koppel');
  const eindTekst = `${formatteerNL(waarde, decimalen)}${suffix}`;

  // Bron-citaat: alleen toegevoegd als er nog geen [data-cu-bron] bestaat (voorkomt dubbels bij twee keer init()).
  const bron = opties.bron ?? root.getAttribute('data-bron');
  const bronDatum = opties.bronDatum ?? root.getAttribute('data-bron-datum');
  let bronEl = null;
  if (bron && !root.querySelector('[data-cu-bron]')) {
    bronEl = doc.createElement('small');
    bronEl.className = 'cu__bron';
    bronEl.setAttribute('data-cu-bron', '');
    bronEl.textContent = bronDatum ? `Bron: ${bron} · ${bronDatum}` : `Bron: ${bron}`;
    root.appendChild(bronEl);
  }

  function zetKoppels() {
    if (!koppelSelector) return;
    doc.querySelectorAll(koppelSelector).forEach((el) => {
      if (el !== cijferEl) el.textContent = eindTekst;
    });
  }

  let rafId = 0;
  let klaar = false;

  function naarEind() {
    if (rafId) { win.cancelAnimationFrame(rafId); rafId = 0; }
    cijferEl.textContent = eindTekst;
    zetKoppels();
    klaar = true;
  }

  const { reduced, stop: stopReducedListener } = minderBeweging((isReduced) => {
    if (isReduced && !klaar) naarEind();
  }, doc);

  function animeer() {
    if (reduced) { naarEind(); return; }
    const duur = opties.duurMs ?? 1600;
    const start = win.performance.now();
    function tick(nu) {
      const t = Math.min(1, (nu - start) / duur);
      const eased = 1 - (1 - t) ** 3; // ease-out-cubic
      cijferEl.textContent = `${formatteerNL(waarde * eased, decimalen)}${suffix}`;
      if (t < 1) {
        rafId = win.requestAnimationFrame(tick);
      } else {
        naarEind();
      }
    }
    rafId = win.requestAnimationFrame(tick);
  }

  const stopInBeeld = inBeeld(root, animeer, { once: true, rootMargin: '0px' });

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopInBeeld();
    stopReducedListener();
    if (rafId) win.cancelAnimationFrame(rafId);
    cijferEl.textContent = origineleCijferTekst;
    if (bronEl) bronEl.remove();
  };
}
