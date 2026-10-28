/**
 * media/agenda-facade
 * ------------------------------------------------------------------------
 * Een afspraakagenda van een externe dienst (Cal.com, Calendly, HubSpot
 * Meetings, Google Agenda-afspraakplanning, TidyCal of een losse iframe-URL)
 * pas laden na een klik. Vóór de klik staat er alleen een eigen kaart (wie,
 * duur, waarover) met een knop "Kies een moment" en een gewone link "Open de
 * agenda in een nieuw tabblad": geen enkel verzoek naar de dienst, dus geen
 * gegevens naar een derde partij en geen cookies vóór een bewuste keuze.
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan binnen `init()`.
 *
 * Wij laden de dienst als gewone iframe (geen embed.js van de dienst): de
 * CSP hoeft dus alleen `frame-src` te openen, zie README.
 *
 * Herkomst: eigen bouw, zelfde patroon als `media/video-facade` en
 * `media/map-facade`. Brandfabric (B5) laadt HubSpot Meetings op elke pagina
 * direct mee; wij pas na de klik.
 *
 * @typedef {Object} AgendaFacadeOptions
 * @property {string} [selector="[data-agenda-facade]"] CSS-selector voor de facades binnen `root`.
 * @property {boolean} [vooraf=false] Laad de agenda al zodra de kaart in beeld komt (zonder klik, zonder de focus te verplaatsen). Ook per facade: `data-vooraf`.
 * @property {boolean} [mobielNieuwTabblad=true] Op een smal scherm opent de knop de dienst in een nieuw tabblad in plaats van een krappe iframe.
 * @property {string} [mobielQuery="(max-width: 640px)"] Media query die "mobiel" bepaalt.
 * @property {number} [timeout=12000] Na zoveel ms zonder load-event verschijnt een melding met de link.
 *
 * @param {Element} root Container waarbinnen naar facades gezocht wordt.
 * @param {AgendaFacadeOptions} [opties]
 * @returns {() => void} destroy: verwijdert knop, scherm, iframe en listeners en herstelt de kaart. Idempotent.
 */
import { vereisRoot, inBeeld } from '../../_kwaliteit/basis.js';

const KLOK =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2v3M17 2v3M3.5 9h17M5 4h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Per dienst: naam en de query-parameters die de embed-weergave aanzetten. */
const DIENSTEN = {
  cal: { naam: 'Cal.com', meldt: true, params: () => ({ embed: 'true', layout: 'month_view' }) },
  calendly: {
    naam: 'Calendly',
    meldt: true,
    params: (host) => ({ embed_domain: host, embed_type: 'Inline', hide_gdpr_banner: '1' }),
  },
  hubspot: { naam: 'HubSpot Meetings', params: () => ({ embed: 'true' }) },
  google: { naam: 'Google Agenda', params: () => ({ gv: 'true' }) },
  tidycal: { naam: 'TidyCal', params: () => ({ embed: '1' }) },
  iframe: { naam: 'agenda', params: () => ({}) },
};

/**
 * De embed-URL van een dienst. Alleen https. `null` bij een ongeldige URL.
 * @param {string} dienst sleutel uit DIENSTEN
 * @param {string} url de publieke boekingspagina
 * @param {string} host hostnaam van de eigen site (voor Calendly's embed_domain)
 */
function bouwEmbedUrl(dienst, url, host) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  for (const [k, v] of Object.entries(DIENSTEN[dienst].params(host))) u.searchParams.set(k, v);
  return u.href;
}

/** Hoogte (px) uit een postMessage van Calendly of Cal.com; 0 als het er geen is. */
function hoogteUitBericht(d) {
  if (!d || typeof d !== 'object') return 0;
  if (d.event === 'calendly.page_height') return parseInt(d.payload && d.payload.height, 10) || 0;
  if (d.originator === 'CAL' && d.data) return Number(d.data.iframeHeight) || 0;
  return 0;
}

let teller = 0;

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'agenda-facade')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const {
    selector = '[data-agenda-facade]',
    vooraf = false,
    mobielNieuwTabblad = true,
    mobielQuery = '(max-width: 640px)',
    timeout = 12000,
  } = opties;

  const facades = Array.from(root.querySelectorAll(selector));
  if (facades.length === 0) {
    console.warn(`agenda-facade: geen elementen gevonden voor ${selector}`);
    return () => {};
  }

  const mq = win.matchMedia ? win.matchMedia(mobielQuery) : { matches: false };
  const cleanups = facades.map(setupFacade);
  let destroyed = false;

  function setupFacade(facade) {
    const dienstKey = (facade.getAttribute('data-dienst') || 'iframe').toLowerCase();
    const link = facade.querySelector('[data-af-fallback]');
    const kaart = facade.querySelector('.af__kaart');
    const titel = facade.getAttribute('data-titel') || 'afspraak';
    const url = facade.getAttribute('data-url') || (link && link.href) || '';
    const voorbeeld = facade.getAttribute('data-voorbeeld-src');

    let embedSrc = null;
    if (DIENSTEN[dienstKey] && link && kaart) {
      embedSrc = voorbeeld
        // Alleen voor demo's: een eigen voorbeeldpagina in plaats van de echte dienst.
        ? new URL(voorbeeld, doc.baseURI).href + `?dienst=${encodeURIComponent(dienstKey)}`
        : bouwEmbedUrl(dienstKey, url, win.location.hostname);
    }
    if (!embedSrc) {
      console.warn(
        'agenda-facade: onbekende data-dienst, ongeldige (niet-https) URL, of .af__kaart / [data-af-fallback] ontbreekt: overgeslagen',
        facade,
      );
      return () => {};
    }

    // De demo-voorbeeldagenda vervangt ook het nieuw-tabblad-pad, anders belooft de demo iets anders dan hij doet.
    const openUrl = voorbeeld ? embedSrc : link.href;
    const meldt = !!DIENSTEN[dienstKey].meldt; // stuurt de dienst postMessage? Dan is dat ons bewijs van "geladen".
    const id = `af-${++teller}`;
    const naam = DIENSTEN[dienstKey].naam;
    const knop = doc.createElement('button');
    knop.type = 'button';
    knop.className = 'af__knop';
    knop.innerHTML = '<span>Kies een moment</span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const zetLabel = () => {
      const nieuw = mobielNieuwTabblad && mq.matches;
      knop.setAttribute('aria-label', `Kies een moment: ${titel}${nieuw ? ' (opent in een nieuw tabblad)' : ''}`);
    };
    zetLabel();
    const bijMqWissel = () => zetLabel();
    if (mq.addEventListener) mq.addEventListener('change', bijMqWissel);
    link.insertAdjacentElement('beforebegin', knop);
    facade.setAttribute('data-af-klaar', '');

    let scherm = null;
    let iframe = null;
    let status = null;
    let timer = 0;
    let stopIO = () => {};

    function bijBericht(e) {
      if (!iframe || e.source !== iframe.contentWindow) return;
      const h = hoogteUitBericht(e.data);
      if (h > 0) {
        iframe.style.height = `${Math.min(Math.max(h, 320), 2400)}px`;
        klaar('Agenda geladen. Kies een dag en tijd.');
      }
    }

    function laad(vanKlik) {
      if (iframe) return;
      stopIO();
      scherm = doc.createElement('div');
      scherm.className = 'af__scherm';
      scherm.setAttribute('role', 'region');
      scherm.setAttribute('aria-labelledby', `${id}-kop`);
      scherm.setAttribute('aria-busy', 'true');
      scherm.innerHTML = `
        <div class="af__kopregel">
          <p class="af__kop" id="${id}-kop" tabindex="-1"></p>
          <a class="af__link af__link--klein" target="_blank" rel="noopener noreferrer">Werkt het niet? Open in een nieuw tabblad</a>
        </div>
        <p class="af__status" role="status"></p>
        <div class="af__kader">
          <div class="af__laad" aria-hidden="true"><span class="af__spinner"></span><span>Agenda laden…</span></div>
        </div>`;
      scherm.querySelector('.af__kop').textContent = `Kies een moment: ${titel}`;
      scherm.querySelector('.af__link').href = openUrl;
      status = scherm.querySelector('.af__status');
      status.textContent = 'Agenda laden…';

      iframe = doc.createElement('iframe');
      iframe.className = 'af__iframe';
      iframe.title = dienstKey === 'iframe' ? `Afspraakagenda: ${titel}` : `Afspraakagenda ${naam}: ${titel}`;
      iframe.setAttribute('allow', 'fullscreen; clipboard-write');
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.addEventListener('load', bijLoad);
      win.addEventListener('message', bijBericht);
      iframe.src = embedSrc; // vóór het invoegen: anders vuurt een about:blank-load te vroeg
      scherm.querySelector('.af__kader').prepend(iframe);

      kaart.hidden = true;
      facade.appendChild(scherm);
      // Focus verhuist mee naar de kop, zodat die niet in het niets valt als de knop verdwijnt;
      // met `vooraf` blijft de focus waar hij was.
      if (vanKlik) scherm.querySelector('.af__kop').focus();
      timer = win.setTimeout(() => {
        // Spinner weg, melding staat boven de iframe (in beeld) naast de noodlink.
        const laadvlak = scherm.querySelector('.af__laad');
        if (laadvlak) laadvlak.remove();
        scherm.setAttribute('aria-busy', 'false');
        status.textContent = 'De agenda laadt niet. Gebruik de link om hem in een nieuw tabblad te openen.';
        scherm.classList.add('af__scherm--fout');
        if (status.scrollIntoView) status.scrollIntoView({ block: 'nearest' });
      }, timeout);
    }

    function klaar(tekst) {
      win.clearTimeout(timer);
      scherm.classList.remove('af__scherm--fout');
      scherm.setAttribute('aria-busy', 'false');
      const laadvlak = scherm.querySelector('.af__laad');
      if (laadvlak) laadvlak.remove();
      status.textContent = tekst;
    }

    // Het load-event zegt niets over succes (ook een geweigerde verbinding of X-Frame-Options
    // vuurt het). Diensten met postMessage bewijzen zichzelf via hun eerste bericht; voor de rest
    // blijft de tekst neutraal en de noodlink zichtbaar.
    function bijLoad() {
      if (meldt) return;
      klaar('De agenda wordt getoond. Lukt dat niet? Open hem in een nieuw tabblad.');
    }

    function bijKlik() {
      if (mobielNieuwTabblad && mq.matches) {
        win.open(openUrl, '_blank', 'noopener');
        return;
      }
      laad(true);
    }
    knop.addEventListener('click', bijKlik);

    if (vooraf || facade.hasAttribute('data-vooraf')) {
      stopIO = inBeeld(facade, () => { if (!(mobielNieuwTabblad && mq.matches)) laad(false); }, { rootMargin: '200px' });
    }

    return function cleanupFacade() {
      stopIO();
      win.clearTimeout(timer);
      win.removeEventListener('message', bijBericht);
      if (mq.removeEventListener) mq.removeEventListener('change', bijMqWissel);
      knop.removeEventListener('click', bijKlik);
      knop.remove();
      if (iframe) iframe.removeEventListener('load', bijLoad);
      if (scherm) scherm.remove();
      kaart.hidden = false;
      facade.removeAttribute('data-af-klaar');
    };
  }

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    cleanups.forEach((fn) => fn());
  };
}
