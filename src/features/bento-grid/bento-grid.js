/**
 * layouts/bento-grid
 * ------------------------------------------------------------------------
 * Portfolioraster met benoemde tegelmaten (`data-tegel="groot|breed|hoog|
 * klein"`). De layout, de hover-zoom én de focus-zoom/-ring zijn met
 * opzet **pure CSS** (grid-auto-flow op attribute-selectors, en
 * `:has(.tegel__link:focus-visible)` voor de focusring om de hele tegel) —
 * dat werkt daardoor ook zonder JavaScript (R4/R14), zie
 * `bento-grid.css`. De volgorde van de tegels in de HTML bepaalt de
 * vulling (gewone, niet-"dense" grid-auto-flow); zie README
 * "Markup-contract" voor de volgorde die een gatenloos raster oplevert.
 *
 * Wat deze module dus doet is geen gedrag toevoegen, maar het
 * markup-contract bewaken (R5, in dezelfde geest als `vereisRoot`): elke
 * tegel moet precies 1 stretched-link hebben ("de hele tegel klikbaar via
 * 1 link") en een bekende `data-tegel`-waarde. Bij een afwijking loggen we
 * een waarschuwing in plaats van iets kapot te laten renderen.
 *
 * Herkomst: layout gezien op christianbleeker.com (research/christianbleeker/
 * OVERZICHT.md, feature C10): de Werk-sectie toont 2 grote projectkaarten
 * plus een blok van 4 kleine ("Meer projecten"), met Tailwind-grid. Eigen
 * implementatie (geen code overgenomen): wij voegen `breed`/`hoog` toe als
 * generieke tegelmaten en een echte stretched-link.
 *
 * @typedef {Object} BentoGridOptions
 * @property {string} [tegelSelector="[data-tegel]"] CSS-selector voor de tegels binnen `root`.
 * @property {string} [linkSelector=".tegel__link"] CSS-selector (binnen elke tegel) voor de stretched-link.
 *
 * @param {Element} root Container waarbinnen naar tegels gezocht wordt (het bento-grid-element).
 * @param {BentoGridOptions} [opties]
 * @returns {() => void} destroy — idempotent; deze module voegt zelf niets aan de DOM toe om weer op te ruimen.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

const BEKENDE_MATEN = new Set(['groot', 'breed', 'hoog', 'klein']);

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'bento-grid')) return () => {};

  const { tegelSelector = '[data-tegel]', linkSelector = '.tegel__link' } = opties;

  const tegels = Array.from(root.querySelectorAll(tegelSelector));
  if (tegels.length === 0) {
    if (typeof console !== 'undefined') {
      console.warn(`bento-grid: geen tegels gevonden voor ${tegelSelector}`);
    }
    return () => {};
  }

  if (typeof console !== 'undefined') {
    for (const tegel of tegels) {
      const maat = tegel.getAttribute('data-tegel');
      if (!BEKENDE_MATEN.has(maat)) {
        console.warn(`bento-grid: onbekende data-tegel="${maat}" (verwacht groot/breed/hoog/klein)`, tegel);
      }
      const links = tegel.querySelectorAll(linkSelector);
      if (links.length !== 1) {
        console.warn(`bento-grid: tegel heeft ${links.length} stretched-links i.p.v. precies 1 (${linkSelector})`, tegel);
      }
    }
  }

  // Niets toegevoegd aan de DOM (de layout/interactie is pure CSS) — destroy
  // is aanwezig voor een consistent contract en is vanzelf idempotent (een
  // functie die niets doet, doet ook de tweede keer niets).
  return function destroy() {};
}
