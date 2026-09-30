/**
 * page-transitions
 * ------------------------------------------------------------------------
 * Paginaovergangen tussen gewone (niet-SPA) pagina's. Waar de browser
 * cross-document View Transitions ondersteunt, voegt deze module zelf de
 * activerende regel (`@view-transition { navigation: auto; }`) toe als
 * losse `<style>` in de `<head>` — daarna doet de browser al het werk
 * (geen `preventDefault`, gewoon een normale navigatie, de browser
 * animeert zelf). Waar dat niet ondersteund wordt (of bij
 * `forceerFallback`, zie hieronder), onderschept deze module interne
 * linkklikken zelf, faded een overlay in, navigeert daarna echt
 * (`location.href`), en faded op de nieuwe pagina weer uit — met een
 * sessievlag zodat de twee pagina's, ondanks de volledige navigatie
 * ertussen, ogen als één doorlopende overgang.
 *
 * `.pt-share` (in `page-transitions.css`) blijft een gewone, statische
 * klasse: die geeft een element alleen een `view-transition-name` mee,
 * wat pas iets doet zodra er ook echt een native transitie loopt.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan zodra `init()` draait.
 *
 * @typedef {Object} PageTransitionsOptions
 * @property {number} [duur=320] Duur van de fade in ms (moet in de pas lopen met de CSS `--pt-duur`).
 * @property {boolean} [forceerFallback=false] Negeer eventuele native ondersteuning en gebruik altijd de JS-fallback — handig om de fallback te testen/demonstreren ongeacht de browser.
 *
 * @param {Element} root Container waarbinnen linkklikken worden onderschept (bv. `document.body`). De module voegt er zelf één `<div class="pt-overlay">` aan toe.
 * @param {PageTransitionsOptions} [opties]
 * @returns {() => void} destroy — idempotent, verwijdert de overlay en alle listeners (herstelt geen navigatie — dit is geen "undo", puur opruimen).
 */
import { minderBeweging, veiligeOpslag, vereisRoot } from '../../_kwaliteit/basis.js';

const NAAM = 'page-transitions';
const VLAG_SLEUTEL = 'page-transitions:onderweg';

export function init(root, opties = {}) {
  if (!vereisRoot(root, NAAM)) return () => {};

  const opts = { duur: 320, forceerFallback: false, ...opties };

  const doc = root.ownerDocument || root;
  const win = doc.defaultView || window;
  const opslag = veiligeOpslag('session', doc);

  let destroyed = false;
  let reduced = false;
  const beweging = minderBeweging((isReduced) => { reduced = isReduced; }, doc);
  reduced = beweging.reduced;

  // Cross-document View Transitions zijn puur CSS-gedreven
  // (`@view-transition { navigation: auto }`); pageswap/pagereveal bestaan
  // alleen in browsers die dat pad ook echt aanzetten. Bij `forceerFallback`
  // wordt die regel bewust NIET ingevoegd — anders probeert de browser zijn
  // eigen native overgang te starten op dezelfde script-navigatie die de
  // JS-fallback hieronder al met een overlay afhandelt, wat een
  // "AbortError: Transition was skipped" in de console oplevert. Zo blijft
  // precies één pad tegelijk actief.
  const kanNative = typeof win.PageSwapEvent !== 'undefined';
  const gebruikNative = kanNative && !opts.forceerFallback;

  let stijlTag = null;
  if (gebruikNative) {
    stijlTag = doc.createElement('style');
    stijlTag.textContent = '@view-transition { navigation: auto; }';
    doc.head.appendChild(stijlTag);
  }

  const overlay = doc.createElement('div');
  overlay.className = 'pt-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  if (opts.duur) overlay.style.setProperty('--pt-duur', `${opts.duur}ms`);
  root.appendChild(overlay);

  function magOnderscheppen(a) {
    if (!a) return false;
    if (a.target && a.target !== '_self') return false; // _blank, etc.
    if (a.hasAttribute('download')) return false;
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return false; // leeg of zuiver hash-anker
    let url;
    try { url = new URL(href, doc.baseURI); } catch { return false; }
    if (url.origin !== win.location.origin) return false; // andere origin (ook mailto:/tel:)
    // Hash-wissel op dezelfde pagina: laat de browser gewoon scrollen.
    if (url.pathname === win.location.pathname && url.search === win.location.search && url.hash) return false;
    return true;
  }

  function naarWeg(bestemming) {
    overlay.classList.add('pt-is-in');
    opslag.set(VLAG_SLEUTEL, '1');
    win.setTimeout(() => { win.location.href = bestemming; }, opts.duur);
  }

  function onClick(e) {
    if (destroyed || reduced || gebruikNative) return;
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // nieuw tabblad/venster
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !root.contains(a)) return;
    if (!magOnderscheppen(a)) return;
    e.preventDefault();
    naarWeg(a.href);
  }
  root.addEventListener('click', onClick);

  // Twee fasen, zelfde reden als bij reveal-on-scroll: eerst instant en
  // zonder transition volledig bedekt tonen (voorkomt een flits van de
  // kale nieuwe pagina), dan een frame later de transition weer aanzetten
  // en meteen laten faden — dat animeert wél.
  function toonAankomst() {
    overlay.classList.add('pt-geen-transitie', 'pt-is-in');
    win.requestAnimationFrame(() => {
      overlay.classList.remove('pt-geen-transitie');
      win.requestAnimationFrame(() => overlay.classList.remove('pt-is-in'));
    });
  }

  if (opslag.get(VLAG_SLEUTEL) === '1') {
    opslag.del(VLAG_SLEUTEL);
    toonAankomst();
  }

  // bfcache: als deze pagina "bevroren" werd terwijl de overlay nog aan
  // stond (net vertrokken via naarWeg()) en de bezoeker komt terug via
  // vorige/volgende, herstelt pageshow (persisted=true) de overlay
  // meteen — anders blijft de teruggekomen pagina onzichtbaar achter een
  // opaque laag staan.
  function onPageshow(e) {
    if (!e.persisted) return;
    overlay.classList.add('pt-geen-transitie');
    overlay.classList.remove('pt-is-in');
    win.requestAnimationFrame(() => overlay.classList.remove('pt-geen-transitie'));
  }
  win.addEventListener('pageshow', onPageshow);

  // Een native cross-document transitie die de browser zelf overslaat
  // (snel opeenvolgend navigeren, een tab die sluit vóórdat hij klaar is,
  // reduced-motion die tussentijds omslaat) verwerpt zijn eigen `.ready`/
  // `.finished`-promise met een AbortError ("Transition was skipped"). Niets
  // op de pagina ving die ooit op, dus die kwam als onafgevangen
  // promise-rejection (pageerror) in de console terecht — een R20-keuring
  // zou dat als JS-fout tellen. `pageswap` (vertrekkende pagina) en
  // `pagereveal` (aankomende pagina) geven toegang tot exact deze promises
  // via `event.viewTransition`, dus die vangen we hier ook af — maar gemeten
  // (Chromium 151, headless) is dat vangnet vaak al te laat: dit is een
  // `type="module"`-script, en modules draaien pas ná het hele document
  // geparsed is, terwijl `pagereveal`/de eerste afwijzing op de nieuwe
  // pagina soms al eerder plaatsvindt. DE ECHTE FIX staat daarom in de
  // demo's `<head>`, vóór alle andere scripts (zie README "Installatie"):
  // een `unhandledrejection`-listener die synchroon, meteen bij het parsen
  // meeluistert en wél op tijd is. Wat hieronder staat is verdediging in de
  // diepte voor trage/latere consumers, geen vervanging van die regel.
  function vangTransitieAf(e) {
    const vt = e && e.viewTransition;
    if (!vt) return;
    if (vt.ready && typeof vt.ready.catch === 'function') vt.ready.catch(() => {});
    if (vt.finished && typeof vt.finished.catch === 'function') vt.finished.catch(() => {});
    if (vt.updateCallbackDone && typeof vt.updateCallbackDone.catch === 'function') vt.updateCallbackDone.catch(() => {});
  }
  win.addEventListener('pageswap', vangTransitieAf);
  win.addEventListener('pagereveal', vangTransitieAf);

  function onUnhandledRejection(e) {
    const reason = e && e.reason;
    const isTransitieAbort =
      reason && (reason.name === 'AbortError') && /transition was skipped/i.test(String(reason.message || ''));
    if (isTransitieAbort) e.preventDefault();
  }
  win.addEventListener('unhandledrejection', onUnhandledRejection);

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    root.removeEventListener('click', onClick);
    win.removeEventListener('pageshow', onPageshow);
    win.removeEventListener('pageswap', vangTransitieAf);
    win.removeEventListener('pagereveal', vangTransitieAf);
    win.removeEventListener('unhandledrejection', onUnhandledRejection);
    beweging.stop();
    if (overlay.parentNode) overlay.remove();
    if (stijlTag && stijlTag.parentNode) stijlTag.remove();
  };
}
