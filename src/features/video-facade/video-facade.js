/**
 * media/video-facade
 * ------------------------------------------------------------------------
 * YouTube/Vimeo pas laden na een klik. Vóór de klik staat er alleen een
 * eigen poster-afbeelding (geen thumbnail-request naar youtube/vimeo) met
 * een ronde ▶-knop (een echte `<button>`); pas ná de klik komt de iframe
 * (`youtube-nocookie.com` of Vimeo met `dnt=1`) erin. Vanilla ES-module,
 * 0 dependencies, SSR-veilig: raakt window/document pas aan binnen `init()`.
 *
 * Herkomst: patroon gezien op christianbleeker.com (research/christianbleeker/
 * OVERZICHT.md, feature C7): een TEDx-video als poster met een ronde
 * ▶-knop, de echte YouTube-iframe komt pas na een klik. Eigen implementatie,
 * geen code overgenomen: wij gebruiken bewust `-nocookie.com` (geen
 * trackingcookies vóór een bewuste keuze), zetten preconnect pas bij
 * pointerdown/Enter (Chris laadt meteen via `next/image`, zonder
 * preconnect-timing) en garanderen een vaste aspect-ratio zodat er nooit een
 * layout-shift is.
 *
 * @typedef {Object} VideoFacadeOptions
 * Bronnen: youtube (standaard), vimeo, loom (`data-provider="loom"`, of automatisch
 * herkend aan een loom.com/share/<id>- of /embed/<id>-URL in de fallback-link).
 * @property {string} [selector="[data-video-facade]"] CSS-selector voor de facades binnen `root`.
 *
 * @param {Element} root Container waarbinnen naar facades gezocht wordt.
 * @param {VideoFacadeOptions} [opties]
 * @returns {() => void} destroy — verwijdert elke ingeladen iframe/knop en herstelt de no-JS-link. Idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

const EMBED = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`,
  // Loom: hide_* verbergt titel, eigenaar en "delen"; hideEmbedTopBar de hele balk.
  loom: (id) =>
    `https://www.loom.com/embed/${id}?autoplay=1&hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`,
};

const PRECONNECT_HOST = {
  youtube: 'https://www.youtube-nocookie.com',
  vimeo: 'https://player.vimeo.com',
  loom: 'https://www.loom.com',
};

// loom.com/share/<id> of loom.com/embed/<id> (ook met ?sid=… erachter).
const LOOM_URL_RE = /^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([A-Za-z0-9]+)/;
const LOOM_ID_RE = /^[A-Za-z0-9]+$/;

// Loom heeft geen stabiele publieke thumbnail: een eigen poster (`data-poster`)
// of deze standaardposter. Nooit een verzoek naar loom.com vóór de klik.
const STANDAARD_LOOM_POSTER = new URL('./assets/poster-loom.svg', import.meta.url).href;

const PLAY_ICOON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor"/></svg>';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'video-facade')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const { selector = '[data-video-facade]' } = opties;

  const facades = Array.from(root.querySelectorAll(selector));
  if (facades.length === 0) {
    if (typeof console !== 'undefined') {
      console.warn(`video-facade: geen elementen gevonden voor ${selector}`);
    }
    return () => {};
  }

  const cleanups = facades.map((facade) => setupFacade(facade));
  let destroyed = false;

  function setupFacade(facade) {
    const link = facade.querySelector('[data-vf-fallback]');
    const href = (link && link.getAttribute('href')) || '';
    const dataId = facade.getAttribute('data-id') || '';
    const loomUrl = LOOM_URL_RE.exec(dataId) || LOOM_URL_RE.exec(href);
    const gekozen = facade.getAttribute('data-provider');
    const provider =
      gekozen === 'vimeo' || gekozen === 'loom' ? gekozen : !gekozen && loomUrl ? 'loom' : 'youtube';
    let id = dataId;
    if (provider === 'loom') {
      // data-id mag het kale ID of een volledige share-/embed-URL zijn; zonder
      // data-id komt het ID uit de href van de fallback-link.
      const m = LOOM_URL_RE.exec(dataId);
      id = m ? m[1] : dataId || (loomUrl ? loomUrl[1] : '');
      if (!LOOM_ID_RE.test(id)) id = '';
    }
    const titel = facade.getAttribute('data-title') || 'video';

    if (!id || !link) {
      if (typeof console !== 'undefined') {
        console.warn('video-facade: element mist data-id of de fallback-link [data-vf-fallback] — overgeslagen', facade);
      }
      return () => {};
    }

    // i.ytimg-thumbnail is een expliciete opt-in (derde-partij-request vóór
    // klik); standaard blijft de eigen posterafbeelding staan.
    if (provider === 'youtube' && facade.hasAttribute('data-ytimg-poster')) {
      const img = link.querySelector('img');
      if (img) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }

    // Poster: `data-poster` wint; Loom valt terug op de standaardposter als er
    // ook geen <img> in de link staat (of die geen src heeft).
    let img = link.querySelector('img');
    let posterOrigineel = null; // null = niets aangeraakt; { gemaakt } of { src }
    const eigenPoster = facade.getAttribute('data-poster');
    if (eigenPoster || (provider === 'loom' && !(img && img.getAttribute('src')))) {
      const nieuweSrc = eigenPoster || STANDAARD_LOOM_POSTER;
      if (img) {
        posterOrigineel = { src: img.getAttribute('src') };
        img.src = nieuweSrc;
      } else {
        img = doc.createElement('img');
        img.alt = '';
        img.width = 1280;
        img.height = 720;
        img.src = nieuweSrc;
        link.appendChild(img);
        posterOrigineel = { gemaakt: true };
      }
    }

    // Fallback-link neutraliseren als interactief element (de knop hieronder
    // neemt het over), maar de poster erin blijft gewoon zichtbaar.
    const oorspronkelijk = {
      tabindex: link.getAttribute('tabindex'),
      ariaHidden: link.getAttribute('aria-hidden'),
    };
    link.setAttribute('tabindex', '-1');
    link.setAttribute('aria-hidden', 'true');
    const onLinkClick = (e) => e.preventDefault();
    link.addEventListener('click', onLinkClick);

    const knop = doc.createElement('button');
    knop.type = 'button';
    knop.className = 'vf__play';
    knop.setAttribute('aria-label', `Video afspelen: ${titel}`);
    knop.innerHTML = PLAY_ICOON;
    facade.appendChild(knop);

    let preconnected = false;
    let preconnectEl = null;
    function zetPreconnect() {
      if (preconnected) return;
      preconnected = true;
      const href = PRECONNECT_HOST[provider];
      if (doc.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
      preconnectEl = doc.createElement('link');
      preconnectEl.rel = 'preconnect';
      preconnectEl.href = href;
      preconnectEl.crossOrigin = '';
      doc.head.appendChild(preconnectEl);
    }
    // N3-fix (beta-herronde 25-09): `data-placeholder` markeert een facade
    // met een bewust nep-ID (zoals in deze bibliotheek se demo — "VUL-JE-
    // VIDEO-ID-IN" / "000000000", L1-fix hierboven). Zonder deze afweer laadt
    // een klik gewoon een iframe die YouTube/Vimeo's eigen foutscherm toont
    // ("video niet beschikbaar") — verwarrend voor wie de demo bekijkt. Een
    // echte bouwer die zijn eigen `data-id` invult, zet dit attribuut niet.
    const isPlaceholder = facade.hasAttribute('data-placeholder');

    // L3-fix (beta 24-09): op hover/focus ging er al vóór een klik een TLS-
    // verbinding (dus het IP-adres van de bezoeker) naar Google, puur van
    // langslopen of Tab-bewegen. `pointerdown`/`keydown` (Enter/Spatie)
    // vuren vlak vóórdat de daadwerkelijke klik het embed laadt — nog steeds
    // een kleine kop-start-winst, maar nooit meer zonder een echte,
    // bedoelde interactie. Bij een placeholder is er sowieso niets om voor
    // te verbinden.
    function opInteractieStart(e) {
      if (isPlaceholder) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      zetPreconnect();
    }
    knop.addEventListener('pointerdown', opInteractieStart);
    knop.addEventListener('keydown', opInteractieStart);

    let geladen = false;
    let iframe = null;
    let plaatshouderMelding = null;

    function toonPlaatshouderMelding() {
      plaatshouderMelding = doc.createElement('p');
      plaatshouderMelding.className = 'vf__placeholder';
      plaatshouderMelding.setAttribute('role', 'status');
      plaatshouderMelding.textContent = 'Vul je video-ID in — dit is een voorbeeld, geen echte video.';
      plaatshouderMelding.tabIndex = -1;
      facade.appendChild(plaatshouderMelding);
      link.hidden = true;
      knop.hidden = true;
      // De knop verdwijnt; zonder dit valt de focus naar <body>.
      plaatshouderMelding.focus();
    }

    function laadVideo() {
      if (geladen) return;
      geladen = true;

      if (isPlaceholder) {
        toonPlaatshouderMelding();
        return;
      }

      zetPreconnect();

      iframe = doc.createElement('iframe');
      iframe.className = 'vf__iframe';
      iframe.src = EMBED[provider](id);
      iframe.title = titel;
      // L2-fix (beta 24-09): alléén het moderne `allow="fullscreen"` gebruiken
      // gaf een console-warning "Allow attribute will take precedence over
      // 'allowfullscreen'." — het legacy `allowfullscreen`-attribuut (en de
      // IDL-property) weglaten lost dat op; `allow` dekt fullscreen al.
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.setAttribute('frameborder', '0');
      facade.appendChild(iframe);

      link.hidden = true;
      knop.hidden = true;

      iframe.focus();
    }

    knop.addEventListener('click', laadVideo);

    return function cleanupFacade() {
      knop.removeEventListener('pointerdown', opInteractieStart);
      knop.removeEventListener('keydown', opInteractieStart);
      knop.removeEventListener('click', laadVideo);
      knop.remove();
      link.removeEventListener('click', onLinkClick);
      setOrRemove(link, 'tabindex', oorspronkelijk.tabindex);
      setOrRemove(link, 'aria-hidden', oorspronkelijk.ariaHidden);
      link.hidden = false;
      if (posterOrigineel) {
        if (posterOrigineel.gemaakt) img.remove();
        else setOrRemove(img, 'src', posterOrigineel.src);
      }
      if (iframe) iframe.remove();
      if (plaatshouderMelding) plaatshouderMelding.remove();
      if (preconnectEl) preconnectEl.remove();
    };
  }

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    cleanups.forEach((fn) => fn());
  };
}

function setOrRemove(el, attr, waarde) {
  if (waarde === null || waarde === undefined) el.removeAttribute(attr);
  else el.setAttribute(attr, waarde);
}
