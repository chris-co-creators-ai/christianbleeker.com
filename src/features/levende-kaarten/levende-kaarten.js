/**
 * levende-kaarten
 * ------------------------------------------------------------------------
 * Raster van kaarten met elk een kleine lus-animatie als beeld (reis langs
 * pagina's, rollende stapel, schild met signalen, spotlight-rapport, flow met
 * reizende stip, handtekening, agendaslots, balken die vullen, kijkers). Het
 * beeld kies je per kaart met `data-lk-visual`; de lussen zijn pure CSS-
 * keyframes (transform en opacity, buiten de hoofdthread).
 *
 * Deze module doet alleen wat CSS niet kan:
 *  - binnenkomst per kaart bij in beeld (12 px omhoog, .55 s, `--reveal-delay`
 *    .04 s per kaart);
 *  - lussen pauzeren per kaart buiten beeld, en overal bij een verborgen tab,
 *    `html[data-motion=paused]` of het event `beweging:pauze`.
 * Minder beweging regelt de CSS (stilstaand, zinvol eindbeeld per visual).
 * Zonder JS lopen de lussen gewoon en staan de kaarten zichtbaar.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * Herkomst: eu-hosted.com/nl (28-10-2026), sectie "Negen apps". Keyframes
 * en duren als vertrekpunt (zie README); de code en de beelden zijn van ons.
 *
 * @typedef {Object} LevendeKaartenOpties
 * @property {number} [stap=0.04] Seconden extra vertraging per kaart bij binnenkomst.
 * @property {string} [rootMargin="0px 0px -8% 0px"] Wanneer een kaart "in beeld" telt voor de binnenkomst.
 *
 * @param {HTMLElement} root Element met `[data-levende-kaarten]`.
 * @param {LevendeKaartenOpties} [opties]
 * @returns {() => void} destroy — idempotent.
 */
import { vereisRoot, minderBeweging, zonderUndefined } from '../../_kwaliteit/basis.js';

const STANDAARD = { stap: 0.04, rootMargin: '0px 0px -8% 0px' };
const ROOT_ATTR = ['data-lk-verborgen', 'data-lk-actief', 'data-lk-pauze', 'data-lk-verstopt', 'data-lk-direct'];
const KAART_ATTR = ['data-lk-in', 'data-lk-uitbeeld'];

/** Pauzeknop van de site: `html[data-motion=paused]` of het event `beweging:pauze`. */
function luisterPauze(doc, onChange) {
  const html = doc.documentElement;
  let staat = html.getAttribute('data-motion') === 'paused';
  const zet = (v) => { if (v !== staat) { staat = v; onChange(v); } };
  const mo = new doc.defaultView.MutationObserver(() => zet(html.getAttribute('data-motion') === 'paused'));
  mo.observe(html, { attributes: true, attributeFilter: ['data-motion'] });
  const ev = (e) => zet(!!(e.detail && e.detail.gepauzeerd));
  doc.addEventListener('beweging:pauze', ev);
  return { get gepauzeerd() { return staat; }, stop() { mo.disconnect(); doc.removeEventListener('beweging:pauze', ev); } };
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'levende-kaarten')) return () => {};
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const kaarten = [...root.querySelectorAll('.lk-kaart')];
  const stoppers = [];
  let vernietigd = false;

  // --reveal-delay per kaart, tenzij de bouwer hem zelf al zette.
  kaarten.forEach((k, i) => {
    if (k.style.getPropertyValue('--reveal-delay')) return;
    k.style.setProperty('--reveal-delay', `${(i * o.stap).toFixed(2)}s`);
    stoppers.push(() => k.style.removeProperty('--reveal-delay'));
  });

  // Lussen staan stil tot een kaart echt in beeld is.
  for (const k of kaarten) k.setAttribute('data-lk-uitbeeld', '');

  function allesDirect() {
    root.setAttribute('data-lk-direct', '');
    for (const k of kaarten) k.setAttribute('data-lk-in', '');
  }

  const mb = minderBeweging((r) => { if (r) allesDirect(); }, doc);
  stoppers.push(() => mb.stop());
  const pauze = luisterPauze(doc, (p) => {
    root.toggleAttribute('data-lk-pauze', p);
    if (p) allesDirect();
  });
  stoppers.push(() => pauze.stop());
  if (pauze.gepauzeerd) root.setAttribute('data-lk-pauze', '');

  const heeftIO = 'IntersectionObserver' in win;
  if (mb.reduced || pauze.gepauzeerd || !heeftIO) {
    allesDirect();
    if (!heeftIO) for (const k of kaarten) k.removeAttribute('data-lk-uitbeeld');
  } else {
    // Twee fasen (zie reveal-on-scroll): verbergen zonder overgang, één frame later de overgang aan.
    root.setAttribute('data-lk-verborgen', '');
    void root.getBoundingClientRect();
    const raf = win.requestAnimationFrame(() => root.setAttribute('data-lk-actief', ''));
    stoppers.push(() => win.cancelAnimationFrame(raf));
  }

  if (heeftIO) {
    // Binnenkomst (eenmalig, iets vóór de onderrand).
    const binnen = new win.IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute('data-lk-in', ''); binnen.unobserve(e.target); }
    }, { rootMargin: o.rootMargin });
    // Lussen: lopen alleen zolang de kaart (een stukje) in beeld is.
    const lus = new win.IntersectionObserver((entries) => {
      for (const e of entries) e.target.toggleAttribute('data-lk-uitbeeld', !e.isIntersecting);
    });
    for (const k of kaarten) { binnen.observe(k); lus.observe(k); }
    stoppers.push(() => { binnen.disconnect(); lus.disconnect(); });
  }

  const opZicht = () => root.toggleAttribute('data-lk-verstopt', doc.hidden);
  doc.addEventListener('visibilitychange', opZicht);
  stoppers.push(() => doc.removeEventListener('visibilitychange', opZicht));

  return function destroy() {
    if (vernietigd) return;
    vernietigd = true;
    for (const s of stoppers) s();
    for (const a of ROOT_ATTR) root.removeAttribute(a);
    for (const k of kaarten) for (const a of KAART_ATTR) k.removeAttribute(a);
  };
}
