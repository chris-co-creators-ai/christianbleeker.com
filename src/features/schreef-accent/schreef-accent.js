/**
 * schreef-accent
 * ------------------------------------------------------------------------
 * Alleen CSS (zie schreef-accent.css). Deze module bestaat voor de vaste
 * vorm van de bibliotheek: `init(root)` doet niets en geeft een destroy terug,
 * zodat het onderdeel net zo wordt aangesloten als de rest.
 *
 * @param {Element} root Element met (of binnen) `data-schreef-accent`.
 * @param {Object} [opties] Niet gebruikt.
 * @returns {() => void} destroy — no-op, idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, opties = {}) { // eslint-disable-line no-unused-vars
  vereisRoot(root, 'schreef-accent');
  return function destroy() {};
}
