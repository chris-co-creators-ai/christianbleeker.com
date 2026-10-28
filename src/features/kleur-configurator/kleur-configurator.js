/**
 * kleur-configurator
 * ------------------------------------------------------------------------
 * Kleur kiezen = de productfoto wisselt. Kleurstalen zijn een gewone
 * `<input type="radio">`-groep (native pijltjestoetsnavigatie, geen eigen
 * JS-toetsenbordcode nodig — zie R14). Bij een wissel wordt de nieuwe foto
 * eerst vooraf geladen en dan pas ingekruist (geen "flits" van een kapotte
 * afbeelding); de keuze komt in de URL (`?kleur=`) en in een verborgen
 * formulierveld, plus de naam en meerprijs van de gekozen kleur.
 *
 * Let op het onderscheid in de markup: elke radio draagt zijn eigen kleurdata
 * via `data-kleur-src`/`data-kleur-label`/`data-kleur-prijs` (invoer); de
 * losse weergave-elementen `[data-kleur-naam]`/`[data-kleur-meerprijs]`
 * (uitvoer) krijgen daaruit hun tekst. Bewust andere attribuutnamen, anders
 * matcht dezelfde CSS-selector zowel de radio's als het weergave-element.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @module kleur-configurator
 */
import { minderBeweging, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const FADE_MS = 220;

/**
 * @param {Element} root Container met de radiogroep + `[data-kleur-img]`.
 * @param {object} [options]
 * @param {string} [options.queryParam="kleur"] Naam van de querystring-parameter.
 * @param {(waarde: number) => string} [options.formatMeerprijs] Formatteert het meerprijs-getal.
 * @returns {() => void} destroy
 */
export function init(root, options = {}) {
  if (!vereisRoot(root, 'kleur-configurator')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!doc || !win) return () => {};

  const opts = {
    queryParam: 'kleur',
    formatMeerprijs: (n) => (n > 0 ? `+ €${n.toFixed(2).replace('.', ',')}` : 'Geen meerprijs'),
    ...zonderUndefined(options),
  };

  const img = root.querySelector('[data-kleur-img]');
  const radios = Array.from(root.querySelectorAll('input[type=radio][data-kleur-src]'));
  if (!img || radios.length === 0) {
    console.warn('kleur-configurator: init(root) mist [data-kleur-img] of radio-swatches — overgeslagen');
    return () => {};
  }
  const naamEl = root.querySelector('[data-kleur-naam]');
  const meerprijsEl = root.querySelector('[data-kleur-meerprijs]');
  const hiddenInput = root.querySelector('[data-kleur-hidden]');

  let destroyed = false;
  let fadeTimerId = 0;

  function vanUrl() {
    try {
      const params = new win.URLSearchParams(win.location.search);
      return params.get(opts.queryParam) || '';
    } catch {
      return '';
    }
  }

  function zetUrl(waarde) {
    try {
      const url = new win.URL(win.location.href);
      url.searchParams.set(opts.queryParam, waarde);
      win.history.replaceState(win.history.state, '', url);
    } catch { /* niets: URL-sync is een extraatje, geen harde eis */ }
  }

  function toon(radio, { animeer = true } = {}) {
    const src = radio.getAttribute('data-kleur-src');
    const naam = radio.getAttribute('data-kleur-label') || radio.value;
    const meerprijs = Number(radio.getAttribute('data-kleur-prijs') || 0);

    if (naamEl) naamEl.textContent = naam;
    if (meerprijsEl) meerprijsEl.textContent = opts.formatMeerprijs(meerprijs);
    if (hiddenInput) hiddenInput.value = radio.value;
    root.setAttribute('data-kleur-actief', radio.value);

    if (!src || src === img.getAttribute('src')) return;

    const reduced = minderBeweging(null, doc).reduced;
    const preload = new win.Image();
    preload.onload = () => {
      if (destroyed) return;
      if (!animeer || reduced) {
        img.src = src;
        return;
      }
      img.classList.add('kc-fading');
      win.clearTimeout(fadeTimerId);
      fadeTimerId = win.setTimeout(() => {
        if (destroyed) return;
        img.src = src;
        // Volgend frame pas de klasse weghalen zodat de browser de src-wissel eerst verwerkt
        // (anders is er niets om vanaf te faden — zelfde tweefasen-truc als reveal-on-scroll).
        (win.requestAnimationFrame || ((fn) => fn()))(() => img.classList.remove('kc-fading'));
      }, FADE_MS);
    };
    preload.onerror = () => {
      if (!destroyed) img.src = src; // laat de browser zijn eigen "gebroken beeld" tonen i.p.v. crashen
    };
    preload.src = src;
  }

  function onChange(event) {
    zetUrl(event.target.value);
    toon(event.target);
  }

  radios.forEach((r) => r.addEventListener('change', onChange));

  // Startkeuze: ?kleur= in de URL wint van de al aangevinkte radio in de markup.
  const startWaarde = vanUrl();
  const startRadio = (startWaarde && radios.find((r) => r.value === startWaarde)) || radios.find((r) => r.checked) || radios[0];
  radios.forEach((r) => { r.checked = r === startRadio; });
  toon(startRadio, { animeer: false });

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    win.clearTimeout(fadeTimerId);
    radios.forEach((r) => r.removeEventListener('change', onChange));
    img.classList.remove('kc-fading');
    root.removeAttribute('data-kleur-actief');
  }

  return destroy;
}
