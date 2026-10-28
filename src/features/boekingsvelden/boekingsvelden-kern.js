/**
 * boekingsvelden
 * ------------------------------------------------------------------------
 * Een compact boekingsblok (hero of balk) dat de keuze van de bezoeker
 * doorstuurt naar een externe boekings- of reserveringsmodule, met de
 * waarden al ingevuld. Twee modi: `verblijf` (aankomst, vertrek, gasten,
 * optioneel kinderen en kamers) en `tafel` (datum, tijd, personen).
 *
 * - Native `<input type="date|time">` en `<select>`: geen datumprikker-lib.
 * - Minimale datum = vandaag in Europe/Amsterdam (`nlTijd()`, R10), ook
 *   als de klok van de bezoeker anders staat. Vertrek ligt altijd na
 *   aankomst; het aantal nachten wordt getoond.
 * - Per dienst een adapter (`ADAPTERS`) die de URL opbouwt. Uitbreidbaar via
 *   `opties.adapters`.
 * - Doel: hetzelfde tabblad, nieuw tabblad of een dialoog met iframe (alleen
 *   als de dienst dat toestaat; anders wordt het een nieuw tabblad).
 * - Zonder JS: de gewone link `[data-bv-fallback]` naar de module.
 * - Event `boekingsvelden:verstuurd` op de root (voor de meting van de klant;
 *   dit onderdeel doet zelf geen tracking).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan in `init()`.
 *
 * Eigen implementatie.
 *
 * @typedef {Object} Waarden
 * @property {'verblijf'|'tafel'} modus
 * @property {string} [aankomst] JJJJ-MM-DD
 * @property {string} [vertrek] JJJJ-MM-DD
 * @property {number} [nachten]
 * @property {number} [gasten] volwassenen (of gasten als er geen kinderen-veld is)
 * @property {number} [kinderen]
 * @property {number} [kamers]
 * @property {string} [datum] JJJJ-MM-DD
 * @property {string} [tijd] UU:MM
 * @property {number} [personen]
 *
 * @typedef {Object} Adapter
 * @property {string} label
 * @property {('verblijf'|'tafel')[]} modi
 * @property {boolean} iframe  mag de dienst standaard in een dialoog? (false = niet bevestigd)
 * @property {(u: URL, w: Waarden, o: object) => URL|string} bouw  krijgt de basis-URL, geeft de URL met waarden
 *
 * @param {Element} root Bevat `[data-bv-fallback]` (link) en draagt data-attributen (zie README).
 * @param {{ modus?: string, dienst?: string, url?: string, doel?: 'zelfde'|'nieuw'|'dialoog', iframe?: boolean,
 *   kinderen?: boolean, kamers?: boolean, ticket?: string, sjabloon?: string, taal?: string, maxGasten?: number,
 *   labels?: object, adapters?: Record<string, Adapter>, nu?: () => Date }} [opties]
 * @returns {() => void} destroy — verwijdert formulier en dialoog, herstelt de link. Idempotent.
 */
import { nlTijd, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

// ---------------------------------------------------------------- rekenwerk
export function isoPlus(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function nachtenTussen(van, tot) {
  return Math.round((Date.parse(`${tot}T00:00:00Z`) - Date.parse(`${van}T00:00:00Z`)) / 864e5);
}
const geldigeIso = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

// ---------------------------------------------------------------- adapters
/** Zet alleen gevulde parameters; bestaande query van de basis-URL blijft staan. */
function zet(u, params) {
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && !Number.isNaN(v)) u.searchParams.set(k, String(v));
  }
  return u;
}
const hhmm = (t) => (t || '').replace(':', '');
const minuten = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };

/** Sjabloon met {aankomst} {vertrek} {gasten} {kinderen} {kamers} {nachten} {datum} {tijd} {tijd_hhmm} {tijd_min} {personen}. */
export function vulSjabloon(sjabloon, w) {
  const v = { ...w, tijd_hhmm: hhmm(w.tijd), tijd_min: w.tijd ? minuten(w.tijd) : '' };
  return sjabloon.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(v[k] ?? ''));
}

function sjabloonAdapter(label, standaard) {
  return {
    label,
    modi: ['verblijf', 'tafel'],
    iframe: false,
    // Geen sjabloon en geen standaard: alleen de link, zonder waarden (crasht niet, R5).
    bouw(u, w, o) {
      if (o.sjabloon) return vulSjabloon(o.sjabloon, w);
      if (!standaard) {
        console.warn(`boekingsvelden: adapter "${label}" heeft een sjabloon nodig (data-sjabloon) — link zonder waarden`);
        return u;
      }
      return zet(u, standaard(w));
    },
  };
}

/** @type {Record<string, Adapter>} */
export const ADAPTERS = {
  // Bevestigd in de Mews-documentatie (Booking Engine > Standalone > Deeplinks).
  mews: {
    label: 'Mews', modi: ['verblijf'], iframe: false,
    bouw: (u, w, o) => zet(u, {
      mewsStart: w.aankomst, mewsEnd: w.vertrek, mewsAdultCount: w.gasten,
      mewsChildCount: w.kinderen > 0 ? w.kinderen : undefined, language: o.taal,
    }),
  },
  // rid/pax/day bevestigd in het voorbeeld van Zenchef; tijd-parameter niet gevonden, dus niet doorgegeven.
  zenchef: {
    label: 'Zenchef', modi: ['tafel'], iframe: false,
    bouw: (u, w) => zet(u, { pax: w.personen, day: w.datum }),
  },
  // ft-ticket/ft-date/ft-time (UUMM)/ft-partysize uit het Formitable-helpcentrum; werkt op de site waar de widget staat.
  formitable: {
    label: 'Formitable', modi: ['tafel'], iframe: false,
    bouw: (u, w, o) => zet(u, {
      'ft-ticket': o.ticket, 'ft-date': w.datum, 'ft-time': hhmm(w.tijd),
      'ft-partysize': w.personen, 'ft-language': o.taal,
    }),
  },
  // date/hour (minuten sinds middernacht)/partySize komen uit de TheFork-zoek-URL; op een restaurantpagina ONGETEST.
  thefork: {
    label: 'TheFork', modi: ['tafel'], iframe: false,
    bouw: (u, w) => zet(u, { date: w.datum, hour: w.tijd ? minuten(w.tijd) : '', partySize: w.personen }),
  },
  // Resengo/Lightspeed: geen openbare parameters gevonden; sjabloon uit je eigen account nodig.
  resengo: sjabloonAdapter('Resengo', null),
  lightspeed: sjabloonAdapter('Lightspeed', null),
  // Booking-achtig: standaard checkin/checkout/group_adults/no_rooms (Booking.com-namen), of eigen sjabloon.
  generiek: sjabloonAdapter('Generiek', (w) => (w.modus === 'tafel'
    ? { datum: w.datum, tijd: w.tijd, personen: w.personen }
    : { checkin: w.aankomst, checkout: w.vertrek, group_adults: w.gasten, group_children: w.kinderen || undefined, no_rooms: w.kamers })),
};
ADAPTERS.booking = ADAPTERS.generiek;

/**
 * Zuivere URL-opbouw, los te testen. Onbekende dienst → generiek (met waarschuwing).
 * @returns {{ url: string, adapter: Adapter, naam: string }}
 */
export function bouwUrl(dienst, basis, w, o = {}, extra = {}) {
  const tabel = { ...ADAPTERS, ...extra };
  let naam = dienst;
  if (!tabel[naam]) {
    if (naam) console.warn(`boekingsvelden: onbekende dienst "${naam}" — generiek sjabloon gebruikt`);
    naam = 'generiek';
  }
  const adapter = tabel[naam];
  let u;
  try { u = new URL(basis, (typeof location !== 'undefined' && location.href) || 'http://localhost/'); } catch { return { url: basis, adapter, naam }; }
  const uit = adapter.bouw(u, w, o);
  return { url: String(uit instanceof URL ? uit.href : uit), adapter, naam };
}

// ---------------------------------------------------------------- init
const LABELS = {
  aankomst: 'Aankomst', vertrek: 'Vertrek', gasten: 'Gasten', volwassenen: 'Volwassenen', kinderen: 'Kinderen', kamers: 'Kamers',
  datum: 'Datum', tijd: 'Tijd', personen: 'Personen', gast: 'gast', gastenM: 'gasten', persoon: 'persoon', personenM: 'personen',
  nacht: 'nacht', nachtenM: 'nachten', knopVerblijf: 'Check beschikbaarheid', knopTafel: 'Reserveer een tafel',
  formulier: 'Boeking', dialoogTitel: 'Boeken', sluit: 'Sluit', sluiten: 'Sluiten', aangepastAankomst: 'Aankomst is aangepast naar vandaag.', aangepastDatum: 'Datum is aangepast naar vandaag.', nieuwTabblad: 'Werkt het niet? Open in een nieuw tabblad',
};

let teller = 0;

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'boekingsvelden')) return () => {};
  if (root.hasAttribute('data-bv-actief')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const ds = root.dataset;
  const link = root.querySelector('[data-bv-fallback]');
  const url = opties.url ?? ds.url ?? (link && link.getAttribute('href'));
  if (!url) { console.warn('boekingsvelden: geen data-url en geen [data-bv-fallback]-link — overgeslagen'); return () => {}; }

  const modus = (opties.modus ?? ds.modus) === 'tafel' ? 'tafel' : 'verblijf';
  const dienst = opties.dienst ?? ds.dienst ?? 'generiek';
  const doelKeuze = ['zelfde', 'nieuw', 'dialoog'].includes(opties.doel ?? ds.doel) ? (opties.doel ?? ds.doel) : 'nieuw';
  const metKinderen = opties.kinderen ?? ds.kinderen !== undefined;
  const metKamers = opties.kamers ?? ds.kamers !== undefined;
  const maxGasten = Number(opties.maxGasten ?? ds.maxGasten) || (modus === 'tafel' ? 12 : 8);
  const uOpt = {
    ticket: opties.ticket ?? ds.ticket, sjabloon: opties.sjabloon ?? ds.sjabloon, taal: opties.taal ?? ds.taal,
  };
  const L = { ...LABELS, ...zonderUndefined(opties.labels) };
  const nu = () => nlTijd(opties.nu ? opties.nu() : new Date());
  const id = `bv${++teller}`;
  const ac = new AbortController();
  const { signal } = ac;
  let dialoog = null;
  let klaar = false;

  const el = (tag, cls, attrs = {}) => {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const veld = (naam, labelTekst, control) => {
    const wrap = el('div', 'bv__veld');
    control.id = `${id}-${naam}`;
    control.name = naam;
    const lab = el('label', 'bv__label', { for: control.id });
    lab.textContent = labelTekst;
    wrap.append(lab, control);
    return wrap;
  };
  const keuze = (van, tot, tekst) => {
    const s = el('select', 'bv__invoer');
    for (let n = van; n <= tot; n++) { const o = el('option'); o.value = String(n); o.textContent = tekst(n); s.append(o); }
    return s;
  };

  // ---- formulier
  const form = el('form', 'bv__form', { 'aria-label': L.formulier, novalidate: '', 'data-bv-form': '' });
  form.dataset.modus = modus;
  const velden = el('div', 'bv__velden');
  const v = {}; // controls

  if (modus === 'verblijf') {
    v.aankomst = el('input', 'bv__invoer', { type: 'date', required: '' });
    v.vertrek = el('input', 'bv__invoer', { type: 'date', required: '' });
    velden.append(veld('aankomst', L.aankomst, v.aankomst), veld('vertrek', L.vertrek, v.vertrek));
    v.gasten = keuze(1, maxGasten, (n) => (metKinderen ? String(n) : `${n} ${n === 1 ? L.gast : L.gastenM}`));
    v.gasten.value = '2';
    velden.append(veld('gasten', metKinderen ? L.volwassenen : L.gasten, v.gasten));
    if (metKinderen) { v.kinderen = keuze(0, 6, String); velden.append(veld('kinderen', L.kinderen, v.kinderen)); }
    if (metKamers) { v.kamers = keuze(1, 5, String); velden.append(veld('kamers', L.kamers, v.kamers)); }
  } else {
    v.datum = el('input', 'bv__invoer', { type: 'date', required: '' });
    v.tijd = el('input', 'bv__invoer', { type: 'time', required: '', step: '900' });
    v.tijd.value = '19:00';
    v.personen = keuze(1, maxGasten, (n) => `${n} ${n === 1 ? L.persoon : L.personenM}`);
    v.personen.value = '2';
    velden.append(veld('datum', L.datum, v.datum), veld('tijd', L.tijd, v.tijd), veld('personen', L.personen, v.personen));
  }

  let nachten = 1;
  const uit = el('output', 'bv__nachten', { for: `${id}-aankomst ${id}-vertrek`, 'aria-live': 'polite', 'data-bv-nachten': '' });
  if (modus === 'verblijf') velden.querySelector('.bv__veld:nth-child(2)').append(uit);

  const knop = el('button', 'bv__knop', { type: 'submit' });
  knop.textContent = modus === 'tafel' ? L.knopTafel : L.knopVerblijf;
  form.append(velden, knop);

  // ---- datumlogica
  const toonNachten = () => { const t = `${nachten} ${nachten === 1 ? L.nacht : L.nachtenM}`; if (uit.textContent !== t) uit.textContent = t; };

  // Het veld waar de bezoeker nu in typt. document.activeElement is daarvoor niet betrouwbaar: Chrome laat het tijdens
  // het typen van een datum even op BODY staan als het naar het volgende deelveld springt.
  let typend = null;
  let onbevestigd = false; // een bijgetrokken datum waar nog niet op is gereageerd
  const melding = el('p', 'bv__melding', { role: 'status', 'aria-live': 'polite', 'data-bv-melding': '' });
  form.append(melding);
  const meld = (t) => { melding.textContent = t; };

  /**
   * Zet minima op vandaag (NL), trek waarden in het verleden bij en houd vertrek na aankomst.
   * Een veld waarin de bezoeker op dit moment typt (de focus staat erop) wordt nooit herschreven:
   * een half ingevuld datumveld is voor de browser al een geldige datum. Dat gebeurt pas bij
   * blur of bij het versturen (`dwing`). Geeft terug of een eerder geldige datum in het verleden is bijgetrokken.
   */
  // Alleen schrijven als het verandert: een nieuw min-attribuut reset in Chrome de half getypte deelvelden.
  const zetMin = (c, m) => { if (c.min !== m) c.min = m; };
  function vernieuw(dwing = false) {
    const min = nu().iso;
    const bezig = (c) => !dwing && typend === c;
    let gecorrigeerd = false;
    const trek = (c, melding_) => {
      if (bezig(c)) return;
      if (!geldigeIso(c.value)) c.value = min;
      else if (c.value < min) { c.value = min; gecorrigeerd = true; onbevestigd = true; meld(melding_); }
    };
    if (modus === 'tafel') { zetMin(v.datum, min); trek(v.datum, L.aangepastDatum); return gecorrigeerd; }
    zetMin(v.aankomst, min);
    trek(v.aankomst, L.aangepastAankomst);
    const a = v.aankomst.value;
    if (!geldigeIso(a) || a < '1000-01-01') return gecorrigeerd; // nog niet af getypt
    const laagsteVertrek = isoPlus(a, 1);
    zetMin(v.vertrek, laagsteVertrek);
    if (!bezig(v.vertrek) && (!geldigeIso(v.vertrek.value) || v.vertrek.value < laagsteVertrek)) v.vertrek.value = isoPlus(a, nachten);
    if (!bezig(v.aankomst) && geldigeIso(v.vertrek.value)) { // tijdens het typen van de aankomst blijft het aantal nachten staan
      const n = nachtenTussen(a, v.vertrek.value);
      if (n >= 1) nachten = n;
    }
    toonNachten();
    return gecorrigeerd;
  }

  function bijAankomst() {
    const val = v.aankomst.value;
    if (geldigeIso(val) && val >= '1000-01-01') {
      const min = nu().iso;
      // Vertrek schuift mee met behoud van het aantal nachten (een half getypte datum in het verleden laat het rustig).
      if (typend !== v.aankomst || val >= min) v.vertrek.value = isoPlus(val < min ? min : val, nachten);
    }
    vernieuw();
  }
  function bijVertrek() {
    const val = v.vertrek.value;
    if (geldigeIso(val) && val >= '1000-01-01' && geldigeIso(v.aankomst.value)) {
      const n = nachtenTussen(v.aankomst.value, val);
      if (typend !== v.vertrek) {
        nachten = n >= 1 ? n : 1;
        if (n < 1) v.vertrek.value = isoPlus(v.aankomst.value, 1);
      } else if (n >= 1) nachten = n;
    }
    vernieuw();
  }

  // Middernacht: een timer laat de datums en het minimum vanzelf meegaan, met een melding.
  let timer = 0;
  function plan() {
    const t = nu();
    const sec = (opties.nu ? opties.nu() : new Date()).getSeconds();
    const ms = ((1440 - (t.uur * 60 + t.minuut)) * 60 - sec) * 1000 + 500;
    timer = win.setTimeout(() => { vernieuw(); plan(); }, Math.min(ms, 2 ** 31 - 1));
  }

  // ---- versturen
  function waarden() {
    if (modus === 'tafel') return { modus, datum: v.datum.value, tijd: v.tijd.value, personen: Number(v.personen.value) };
    const w = { modus, aankomst: v.aankomst.value, vertrek: v.vertrek.value, nachten, gasten: Number(v.gasten.value) };
    if (v.kinderen) w.kinderen = Number(v.kinderen.value);
    if (v.kamers) w.kamers = Number(v.kamers.value);
    return w;
  }

  function verstuur(e) {
    e.preventDefault();
    // Eén regel voor klik en Enter: na een bijgetrokken datum verstuurt de eerstvolgende klik of Enter niets. De melding staat er dan;
    // de volgende verstuurt. Elke wijziging van de bezoeker zelf (input) telt als gezien.
    const bijgetrokken = vernieuw(true) || onbevestigd;
    if (bijgetrokken) { onbevestigd = false; return; }
    const leeg = Object.values(v).find((c) => !c.value);
    if (leeg) { leeg.focus(); return; }
    meld('');
    const w = waarden();
    const { url: doelUrl, adapter, naam } = bouwUrl(dienst, url, w, uOpt, opties.adapters);
    if (adapter.modi && !adapter.modi.includes(modus)) console.warn(`boekingsvelden: adapter "${naam}" is bedoeld voor ${adapter.modi.join('/')}, niet voor ${modus}`);
    const magFrame = opties.iframe ?? (ds.iframe === 'ja' ? true : adapter.iframe);
    const doel = doelKeuze === 'dialoog' && !magFrame ? 'nieuw' : doelKeuze;
    root.dispatchEvent(new win.CustomEvent('boekingsvelden:verstuurd', {
      bubbles: true, detail: { modus, dienst: naam, url: doelUrl, doel, gevraagdDoel: doelKeuze, waarden: w },
    }));
    if (doel === 'zelfde') win.location.assign(doelUrl);
    else if (doel === 'nieuw') win.open(doelUrl, '_blank', 'noopener,noreferrer');
    else toonDialoog(doelUrl);
  }

  function toonDialoog(doelUrl) {
    sluitDialoog();
    const d = el('dialog', 'bv__dialoog', { 'aria-labelledby': `${id}-titel` });
    const kop = el('div', 'bv__dialoog-kop');
    const titel = el('h2', 'bv__dialoog-titel', { id: `${id}-titel` });
    titel.textContent = (link && link.dataset.titel) || L.dialoogTitel;
    const dicht = el('button', 'bv__dicht', { type: 'button', 'aria-label': L.sluit });
    dicht.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    kop.append(titel, dicht);
    const frame = el('iframe', 'bv__frame', { title: titel.textContent, src: doelUrl, referrerpolicy: 'strict-origin-when-cross-origin' });
    const noot = el('a', 'bv__noot', { href: doelUrl, target: '_blank', rel: 'noopener noreferrer' });
    noot.textContent = L.nieuwTabblad;
    const voet = el('div', 'bv__voet');
    const sluit = el('button', 'bv__sluit', { type: 'button' });
    sluit.textContent = L.sluiten;
    voet.append(noot, sluit);
    d.append(kop, frame, voet);
    dicht.addEventListener('click', () => d.close());
    sluit.addEventListener('click', () => d.close());
    // Escape vanuit de iframe: alleen te onderscheppen als de module van hetzelfde domein is (cross-origin kan niet).
    frame.addEventListener('load', () => {
      try { frame.contentDocument.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') d.close(); }); } catch { /* cross-origin */ }
    });
    d.addEventListener('click', (ev) => { if (ev.target === d) d.close(); }); // klik op de achtergrond
    d.addEventListener('close', () => { if (dialoog === d) dialoog = null; d.remove(); });
    root.append(d);
    dialoog = d;
    d.showModal();
    dicht.focus();
  }
  function sluitDialoog() { if (dialoog) { const d = dialoog; dialoog = null; try { d.close(); } catch { /* al dicht */ } d.remove(); } }

  // ---- aansluiten
  if (modus === 'verblijf') {
    v.aankomst.addEventListener('change', bijAankomst, { signal });
    v.vertrek.addEventListener('change', bijVertrek, { signal });
  } else {
    v.datum.addEventListener('change', () => vernieuw(), { signal });
  }
  form.addEventListener('submit', verstuur, { signal });
  // Blijft de pagina open over middernacht heen, dan gaat het minimum mee zodra iemand terugkomt.
  root.addEventListener('focusin', (e) => { typend = e.target.type === 'date' ? e.target : null; if (e.target !== knop) vernieuw(); }, { signal });
  form.addEventListener('focusout', (e) => { if (e.relatedTarget === e.target) return; typend = null; vernieuw(); }, { signal }); // blur: nu pas bijtrekken wat half getypt was
  form.addEventListener('input', () => { meld(''); onbevestigd = false; }, { signal });
  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) vernieuw(); }, { signal });

  root.setAttribute('data-bv-actief', '');
  root.insertBefore(form, root.firstChild);
  vernieuw();
  plan();
  klaar = true;

  return function destroy() {
    if (!klaar) return;
    klaar = false;
    ac.abort();
    win.clearTimeout(timer);
    sluitDialoog();
    form.remove();
    root.removeAttribute('data-bv-actief');
  };
}
