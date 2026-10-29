/**
 * eigen-naam-preview
 * ------------------------------------------------------------------------
 * Een veld "Bekijk het met je eigen naam". Wat de bezoeker typt, wordt een
 * slug (accenten weg, spaties weg, kleine letters, max. 24 tekens) en
 * verschijnt live op elke `[data-eigen-naam]`-plek op de pagina:
 *   - `domein`     → via `typography/domein-wissel` (sjabloon `wiki.{slug}.nl`)
 *   - `werkruimte` → de naam zoals getypt
 *   - `initiaal`   → de eerste letter
 * Leeg veld = alles terug naar de oorspronkelijke tekst. De naam staat
 * alleen in sessionStorage (via `veiligeOpslag`), nergens anders.
 *
 * Plekken die een ander onderdeel beheert (zoals de adresbalk van
 * `portfolio/app-tour-venster`) krijgen het event `eigennaam` en zeggen met
 * `preventDefault()` dat ze het zelf doen.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt `window`/`document`
 * pas aan in `init`).
 *
 * Herkomst: "met je eigen naam"-veld onder het productvenster op
 * eu-hosted.com (28-10-2026). Eigen code en eigen teksten.
 *
 * @typedef {Object} EigenNaamOpties
 * @property {Element|Document|string} [doel=document] Waar de `[data-eigen-naam]`-plekken staan.
 * @property {string} [sleutel="eigen-naam"] Sleutel in sessionStorage.
 * @property {number} [max=24] Maximale lengte van de slug.
 * @property {number} [wacht=220] Milliseconden stilte na typen voordat de plekken wisselen.
 * @property {Partial<typeof TEKSTEN>} [teksten] Zinnen in de live-regio; `{naam}` en `{slug}` worden ingevuld.
 *
 * @param {Element} root Element met een `<input>` (en optioneel `[data-enp-wis]`).
 * @param {EigenNaamOpties} [opties]
 * @returns {() => void} destroy
 */
import { minderBeweging, veiligeOpslag, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';
// domein-wissel-kopie.js = byte-gelijke kopie van typography/domein-wissel/domein-wissel.js, zodat deze map
// ook als platte kopie werkt (Next: src/features/<naam>/). test/meet.mjs faalt als hij afwijkt.
import { init as domeinWissel, volgBewegingPauze } from './domein-wissel-kopie.js';

/** Zinnen die de JS in de live-regio zet (Nederlandse standaard). */
export const TEKSTEN = {
  bijgewerkt: 'Voorbeeld bijgewerkt voor {naam}, met domeinen op {slug}.nl.',
  standaard: 'Voorbeeld staat weer op de standaardnaam.',
};

const LOS = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };

/**
 * Naam → slug: accenten en leestekens weg, spaties weg, kleine letters, max. `max` tekens.
 * Een koppelteken dat de bezoeker zelf typt blijft staan (niet aan begin of eind).
 * @param {string} naam
 * @param {number} [max=24]
 */
export function maakSlug(naam, max = 24) {
  return String(naam ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[ßæœøłđðþı]/g, (c) => LOS[c])
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, max)
    .replace(/-+$/, '');
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'eigen-naam-preview')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const veld = root.querySelector('input');
  if (!veld) {
    console.warn('eigen-naam-preview: geen <input> gevonden — overgeslagen');
    return () => {};
  }
  const o = { doel: doc, sleutel: 'eigen-naam', max: 24, wacht: 220, ...zonderUndefined(opties) };
  const T = { ...TEKSTEN, ...zonderUndefined(o.teksten || {}) };
  const doel = typeof o.doel === 'string' ? doc.querySelector(o.doel) : o.doel;
  if (!doel || typeof doel.querySelectorAll !== 'function') {
    console.warn('eigen-naam-preview: doel niet gevonden — overgeslagen');
    return () => {};
  }
  const opslag = veiligeOpslag('session', doc);
  const wis = root.querySelector('[data-enp-wis]');

  const plekken = Array.from(doel.querySelectorAll('[data-eigen-naam]'));
  const tekstVan = (el) => (el.querySelector('.dw__sr') || el).textContent.replace(/\s+/g, ' ').trim();
  const origineel = new Map(plekken.map((el) => [el, tekstVan(el)]));
  /** @type {Map<Element, ReturnType<typeof domeinWissel>>} */
  const eigen = new Map();

  let rustig = false;
  const mb = minderBeweging((r) => { rustig = r; }, doc);
  rustig = mb.reduced;
  const pauze = volgBewegingPauze(doc);

  // Live-regio voor schermlezers: één zin nadat de bezoeker stopt met typen.
  const status = doc.createElement('p');
  status.className = 'enp__status';
  status.setAttribute('aria-live', 'polite');
  root.append(status);

  function zetDomein(el, tekst, index, direct) {
    const api = eigen.get(el);
    if (api) { api.wissel(tekst, { index, direct }); return; }
    if (el.hasAttribute('data-dw')) {
      el.dispatchEvent(new win.CustomEvent('domeinwissel', { detail: { tekst, index, direct } }));
      return;
    }
    const nieuw = domeinWissel(el);
    eigen.set(el, nieuw);
    nieuw.wissel(tekst, { index, direct });
  }

  function zetTekst(el, tekst, direct) {
    if (el.textContent === tekst) return;
    el.textContent = tekst;
    if (!direct && !rustig && !pauze.gepauzeerd && typeof el.animate === 'function') {
      el.animate([{ opacity: 0.25, transform: 'translateY(2px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    }
  }

  function pasToe(ruw, { direct = false } = {}) {
    const schoon = String(ruw ?? '').replace(/\s+/g, ' ').trim();
    const slug = maakSlug(schoon, o.max);
    const leeg = !slug;
    const naam = leeg ? null : schoon.slice(0, 40);
    const letter = leeg ? null : (schoon.match(/[\p{L}\p{N}]/u) || [''])[0].toLocaleUpperCase('nl');
    let domeinIndex = 0;
    for (const el of plekken) {
      const soort = el.getAttribute('data-eigen-naam');
      const index = soort === 'domein' ? domeinIndex++ : 0;
      const detail = { naam, slug: leeg ? null : slug, initiaal: letter, leeg, index, direct };
      const beheerd = !el.dispatchEvent(new win.CustomEvent('eigennaam', { detail, cancelable: true }));
      if (beheerd) continue;
      if (soort === 'domein') {
        const sjabloon = el.getAttribute('data-eigen-naam-sjabloon');
        zetDomein(el, leeg || !sjabloon ? origineel.get(el) : sjabloon.replace(/\{slug\}/g, slug), index, direct);
      } else if (soort === 'werkruimte') {
        zetTekst(el, leeg ? origineel.get(el) : naam, direct);
      } else if (soort === 'initiaal') {
        zetTekst(el, leeg ? origineel.get(el) : letter, direct);
      }
    }
    return { leeg, naam, slug };
  }

  let wachtTimer = 0;
  let meldTimer = 0;
  function bijwerken() {
    const ruw = veld.value;
    if (wis) wis.hidden = ruw.length === 0;
    if (ruw.trim()) opslag.set(o.sleutel, ruw); else opslag.del(o.sleutel);
    win.clearTimeout(wachtTimer);
    win.clearTimeout(meldTimer);
    wachtTimer = win.setTimeout(() => {
      const r = pasToe(ruw);
      meldTimer = win.setTimeout(() => {
        status.textContent = r.leeg
          ? T.standaard
          : T.bijgewerkt.replace(/\{naam\}/g, r.naam).replace(/\{slug\}/g, r.slug);
      }, 500);
    }, o.wacht);
  }
  const opInvoer = () => bijwerken();
  const opToets = (e) => {
    if (e.key === 'Escape' && veld.value) { e.preventDefault(); veld.value = ''; bijwerken(); }
    else if (e.key === 'Enter' && veld.form) e.preventDefault(); // het veld verstuurt niets
  };
  const opWis = () => { veld.value = ''; bijwerken(); veld.focus(); };
  veld.addEventListener('input', opInvoer);
  veld.addEventListener('keydown', opToets);
  if (wis) wis.addEventListener('click', opWis);

  // Terug uit de sessie: meteen invullen, zonder animatie en zonder melding.
  const bewaard = opslag.get(o.sleutel);
  if (bewaard && !veld.value) veld.value = bewaard;
  if (veld.value.trim()) pasToe(veld.value, { direct: true });
  if (wis) wis.hidden = veld.value.length === 0;

  let dood = false;
  return function destroy() {
    if (dood) return;
    dood = true;
    win.clearTimeout(wachtTimer);
    win.clearTimeout(meldTimer);
    veld.removeEventListener('input', opInvoer);
    veld.removeEventListener('keydown', opToets);
    if (wis) { wis.removeEventListener('click', opWis); wis.hidden = true; }
    pasToe('', { direct: true });
    for (const api of eigen.values()) api();
    eigen.clear();
    mb.stop();
    pauze.stop();
    status.remove();
  };
}
