/**
 * availability-badge
 * ------------------------------------------------------------------------
 * Klein badge: "Ruimte voor nieuwe projecten in december" met een
 * pulserende stip. De maand komt uit één van twee bronnen — nooit allebei
 * tegelijk (R9, geen tegensprekende data):
 *
 *  - `data-maand="december"` — vaste, door de bouwer getypte maand.
 *  - `data-maanden-vooruit="1"` — berekend: de NL-maandnaam van
 *    (vandaag + N maanden), in Nederlandse tijd (`nlTijd()` uit basis.js,
 *    R10). `data-maand` wint als beide gezet zijn.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan in `init()`. De puls stopt vanzelf bij `prefers-reduced-motion` via
 * een CSS media query — geen JS-koppeling nodig voor R1.
 *
 * @typedef {Object} AvailabilityBadgeOptions
 * @property {string} [maand] Vaste maandnaam; wint van `maandenVooruit`.
 * @property {number} [maandenVooruit] Aantal maanden vooruit vanaf vandaag (NL-tijd).
 *
 * @param {Element} root Element met `[data-ab-maand]` erin (of ergens genest).
 * @param {AvailabilityBadgeOptions} [opties]
 * @returns {() => void} destroy — zet de oorspronkelijke (statische) tekst terug. Idempotent.
 */
import { nlTijd, vereisRoot } from '../../_kwaliteit/basis.js';

export const NL_MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

/** Zuivere rekenfunctie, apart export voor de meting zonder browser nodig te hebben. */
export function maandOverNMaanden(n, nu = new Date()) {
  const t = nlTijd(nu);
  const totaal = (t.maand - 1) + n;
  const idx = ((totaal % 12) + 12) % 12;
  return NL_MAANDEN[idx];
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'availability-badge')) return () => {};

  const span = root.querySelector('[data-ab-maand]');
  const vasteMaand = opties.maand ?? root.getAttribute('data-maand');
  const vooruitAttr = opties.maandenVooruit ?? root.getAttribute('data-maanden-vooruit');

  let origineel = null;
  let gezet = false;

  if (span) {
    origineel = span.textContent;
    if (vasteMaand) {
      span.textContent = vasteMaand;
      gezet = true;
    } else if (vooruitAttr !== null && vooruitAttr !== undefined && vooruitAttr !== '') {
      const n = Number(vooruitAttr);
      if (Number.isFinite(n)) {
        span.textContent = maandOverNMaanden(n);
        gezet = true;
      } else if (typeof console !== 'undefined') {
        console.warn(`availability-badge: data-maanden-vooruit="${vooruitAttr}" is geen getal — standaardtekst blijft staan`);
      }
    }
    // Geen van beide attributen: de statische, door de bouwer getypte tekst
    // in de HTML blijft gewoon staan (R4 — dat IS de zinvolle standaardtekst).
  } else if (typeof console !== 'undefined') {
    console.warn('availability-badge: geen [data-ab-maand] gevonden in root — tekst blijft ongewijzigd');
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (span && gezet && origineel !== null) span.textContent = origineel;
  };
}
