/**
 * afstand-postcode
 * ------------------------------------------------------------------------
 * "Bij jou in de buurt": een postcode (via PDOK) of de eigen locatie
 * (geolocation) wordt vergeleken met een lijst locaties uit de markup
 * (`[data-locatie][data-lat][data-lng]`). Berekent de afstand (haversine),
 * sorteert de lijst, toont "12 km", en kan filteren op een straal.
 *
 * Zonder JavaScript is dit gewoon een `<ul>` met links — de module voegt
 * alleen toe, verbergt niets waar geen fallback voor is (R4).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @module afstand-postcode
 */
import { vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const PDOK_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';

const DEFAULT_TEXTS = {
  searching: 'Locatie zoeken…',
  notFound: 'Geen postcode gevonden. Controleer je invoer.',
  networkError: 'Kon de postcode niet opzoeken. Probeer het later opnieuw.',
  geoDenied: 'Locatie delen is geweigerd. Vul in plaats daarvan je postcode in.',
  geoUnavailable: 'Je locatie kon niet bepaald worden. Vul in plaats daarvan je postcode in.',
  geoTimeout: 'Het bepalen van je locatie duurde te lang. Vul in plaats daarvan je postcode in.',
  noResultsInRadius: 'Geen locaties binnen deze straal.',
  straalZonderZoek: 'Vul eerst je postcode in (of gebruik "Gebruik mijn locatie") om op straal te filteren.',
};

/** Straal van de aarde in km. */
const AARDE_KM = 6371;

/** @returns {number} Afstand in km tussen twee coördinaten (haversine). */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return AARDE_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Minimale NL-postcodenormalisatie (los van forms/nl-postcode: elke feature blijft zelfstandig kopieerbaar). */
function normalizePostcode(raw) {
  const upper = String(raw || '').toUpperCase();
  let digits = '';
  let letters = '';
  for (const ch of upper) {
    if (digits.length < 4) { if (ch >= '0' && ch <= '9') digits += ch; }
    else if (letters.length < 2) { if (ch >= 'A' && ch <= 'Z') letters += ch; }
    else break;
  }
  return letters ? `${digits} ${letters}` : digits;
}
function isValidPostcode(v) {
  return /^\d{4}\s[A-Z]{2}$/.test(String(v || '').trim());
}

/**
 * @param {Element} root Container met `[data-afstand-form]`, `[data-afstand-postcode-input]`,
 *   `[data-afstand-lijst]` (met `[data-locatie][data-lat][data-lng]`-items erin).
 * @param {object} [options]
 * @param {string} [options.pdokUrl]
 * @param {object} [options.texts]
 * @returns {() => void} destroy
 */
export function init(root, options = {}) {
  if (!vereisRoot(root, 'afstand-postcode')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!doc || !win) return () => {};

  const opts = { pdokUrl: PDOK_URL, ...zonderUndefined(options), texts: { ...DEFAULT_TEXTS, ...zonderUndefined(options.texts) } };

  const form = root.querySelector('[data-afstand-form]');
  const input = root.querySelector('[data-afstand-postcode-input]');
  const lijst = root.querySelector('[data-afstand-lijst]');
  const statusEl = root.querySelector('[data-afstand-status]');
  const geoBtn = root.querySelector('[data-afstand-locatie]');
  const straalSelect = root.querySelector('[data-afstand-straal]');

  if (!form || !input || !lijst) {
    console.warn('afstand-postcode: init(root) mist [data-afstand-form]/[data-afstand-postcode-input]/[data-afstand-lijst] — overgeslagen');
    return () => {};
  }

  let destroyed = false;
  let fetchToken = 0;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || '';
  }

  function locatieItems() {
    return Array.from(lijst.querySelectorAll('[data-locatie]'));
  }

  function toepassen(vanuit) {
    const straal = straalSelect ? Number(straalSelect.value) || 0 : 0;
    const items = locatieItems();
    const metAfstand = items.map((el) => {
      const lat = Number(el.getAttribute('data-lat'));
      const lng = Number(el.getAttribute('data-lng'));
      const km = Number.isFinite(lat) && Number.isFinite(lng) ? haversineKm(vanuit.lat, vanuit.lng, lat, lng) : null;
      return { el, km };
    });
    metAfstand.sort((a, b) => {
      if (a.km === null) return 1;
      if (b.km === null) return -1;
      return a.km - b.km;
    });
    let zichtbaar = 0;
    metAfstand.forEach(({ el, km }) => {
      const kmEl = el.querySelector('[data-afstand-km]');
      const buitenStraal = straal > 0 && (km === null || km > straal);
      el.hidden = buitenStraal;
      if (!buitenStraal) zichtbaar += 1;
      if (kmEl) kmEl.textContent = km === null ? '' : `${Math.round(km)} km`;
      lijst.appendChild(el); // herordenen op afstand
    });
    setStatus(zichtbaar === 0 ? opts.texts.noResultsInRadius : '');
  }

  async function zoekOpPostcode(postcode) {
    const token = ++fetchToken;
    setStatus(opts.texts.searching);
    try {
      const url = new win.URL(opts.pdokUrl);
      url.searchParams.set('q', postcode);
      url.searchParams.set('fq', 'type:postcode');
      url.searchParams.set('rows', '1');
      const response = await win.fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (token !== fetchToken || destroyed) return;
      if (!response.ok) throw new Error(`PDOK gaf status ${response.status}`);
      const data = await response.json();
      if (token !== fetchToken || destroyed) return;
      const doc0 = data && data.response && data.response.docs && data.response.docs[0];
      const punt = doc0 && parsePoint(doc0.centroide_ll);
      if (!punt) {
        setStatus(opts.texts.notFound);
        return;
      }
      toepassen(punt);
    } catch {
      if (token !== fetchToken || destroyed) return;
      setStatus(opts.texts.networkError);
    }
  }

  function parsePoint(wkt) {
    // PDOK geeft centroide_ll als "POINT(4.895 52.370)" (lon lat).
    const m = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(String(wkt || ''));
    if (!m) return null;
    return { lng: Number(m[1]), lat: Number(m[2]) };
  }

  function onSubmit(event) {
    event.preventDefault();
    input.value = normalizePostcode(input.value);
    if (!isValidPostcode(input.value)) {
      setStatus(opts.texts.notFound);
      return;
    }
    zoekOpPostcode(input.value);
  }

  function onInput() {
    input.value = normalizePostcode(input.value);
  }

  function onGeoClick() {
    if (!win.navigator || !win.navigator.geolocation) {
      setStatus(opts.texts.geoUnavailable);
      return;
    }
    setStatus(opts.texts.searching);
    win.navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (destroyed) return;
        toepassen({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (destroyed) return;
        if (err && err.code === 1) setStatus(opts.texts.geoDenied);
        else if (err && err.code === 3) setStatus(opts.texts.geoTimeout);
        else setStatus(opts.texts.geoUnavailable);
      },
      { timeout: 8000 }
    );
  }

  function onStraalChange() {
    // Filter opnieuw toepassen op de laatst bekende afstanden (al berekend, staan in de DOM).
    const straal = straalSelect ? Number(straalSelect.value) || 0 : 0;
    const items = locatieItems();
    const heeftAfstanden = items.some((el) => el.querySelector('[data-afstand-km]')?.textContent);

    // G1: zonder een eerdere zoekopdracht is er geen afstand om op te filteren —
    // straal toch toepassen verborg alle vestigingen zonder melding. Wacht op
    // een postcode/locatie en leg uit waarom er (nog) niets gefilterd wordt.
    if (straal > 0 && !heeftAfstanden) {
      setStatus(opts.texts.straalZonderZoek);
      return;
    }

    let zichtbaar = 0;
    items.forEach((el) => {
      const kmText = el.querySelector('[data-afstand-km]')?.textContent || '';
      const km = kmText ? Number(kmText.replace(/[^\d.]/g, '')) : null;
      const buitenStraal = straal > 0 && (km === null || Number.isNaN(km) || km > straal);
      el.hidden = buitenStraal;
      if (!buitenStraal) zichtbaar += 1;
    });
    if (heeftAfstanden) {
      setStatus(zichtbaar === 0 ? opts.texts.noResultsInRadius : '');
    }
  }

  form.addEventListener('submit', onSubmit);
  input.addEventListener('input', onInput);
  if (geoBtn) geoBtn.addEventListener('click', onGeoClick);
  if (straalSelect) straalSelect.addEventListener('change', onStraalChange);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    form.removeEventListener('submit', onSubmit);
    input.removeEventListener('input', onInput);
    if (geoBtn) geoBtn.removeEventListener('click', onGeoClick);
    if (straalSelect) straalSelect.removeEventListener('change', onStraalChange);
    setStatus('');
    locatieItems().forEach((el) => {
      el.hidden = false;
      const kmEl = el.querySelector('[data-afstand-km]');
      if (kmEl) kmEl.textContent = '';
    });
  }

  return destroy;
}
