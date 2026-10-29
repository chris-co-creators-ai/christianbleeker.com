/**
 * vergelijkbalk
 * ------------------------------------------------------------------------
 * Twee of meer horizontale balken ("Huidige tools" tegen "Wolkhaven") die
 * groeien tot hun waarde zodra ze in beeld komen. Het bedrag staat rechts in
 * mono met tabular-nums. De gegevens zijn gewone tekst in een <dl>: naam en
 * bedrag lezen voor iedereen, ook zonder JavaScript. De balk is decor
 * (aria-hidden).
 *
 * Eén bron per getal (R9): elk bedrag staat in een <data value="153">€153</data>.
 * De module leest `value`, schaalt de balken op de grootste waarde en schrijft
 * bij `zet()` waarde én tekst tegelijk, zodat ze nooit uiteenlopen.
 *
 * Beweging: alleen transform. De balk is een volle, afgeronde strook die met
 * translateX uit een afgerond spoor schuift (zo blijft de rechterhoek rond,
 * ook bij een korte balk; scaleX zou de radius platdrukken). Eerste groei
 * .9 s ease-out met .08 s per rij; latere updates .45 s. Bij minder beweging,
 * bij `html[data-motion="paused"]` of na `beweging:pauze` staan de balken
 * direct op hun waarde.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas aan
 * in `init()`.
 *
 * @typedef {Object} VergelijkbalkOpties
 * @property {number} [max] Waarde die een volle balk is. Standaard de grootste waarde.
 * @property {number} [drempel=0.35] Deel van het onderdeel dat in beeld moet zijn voor de groei start.
 * @property {string} [locale='nl-NL'] Taal van de standaardnotatie (`en-GB` → `€1,006`).
 * @property {(n: number) => string} [formaat] Tekst bij `zet()`. Standaard `euro(n, locale)` (`€1.006`, `−€84`).
 *
 * @param {Element} root Element met klasse `vgb` en daarin `.vgb__rij`-rijen.
 * @param {VergelijkbalkOpties} [opties]
 * @returns {(() => void) & { zet: (waarden: number[]) => void }} destroy, met `destroy.zet(waarden)` voor live updates (zelfde volgorde als de rijen). Idempotent.
 */
import { minderBeweging, inBeeld, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const NF = new Map();

/**
 * Hele euro's in de notatie van `locale` (Intl.NumberFormat): nl-NL 1006 → "€1.006", -84 → "−€84"
 * (echte minteken vooraan); en-GB/en-IE → "€1,006"; de-DE → "1.006 €". De spatie die nl-NL tussen
 * € en het getal zet, valt weg.
 */
export function euro(n, locale = 'nl-NL') {
  const r = Math.round(Number(n) || 0);
  let nf = NF.get(locale);
  if (!nf) {
    nf = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    NF.set(locale, nf);
  }
  const delen = nf.formatToParts(Math.abs(r));
  const tekst = delen.filter((d, i) => !(i === 1 && d.type === 'literal' && delen[0].type === 'currency')).map((d) => d.value).join('');
  return (r < 0 ? '−' : '') + tekst;
}

function getal(v) {
  if (v === null || v === undefined || v === '') return NaN;
  return Number(v);
}

export function init(root, opties = {}) {
  const leeg = Object.assign(() => {}, { zet() {} });
  if (!vereisRoot(root, 'vergelijkbalk')) return leeg;

  const o = { drempel: 0.35, locale: 'nl-NL', ...zonderUndefined(opties) };
  if (typeof o.formaat !== 'function') o.formaat = (n) => euro(n, o.locale);
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const rijen = Array.from(root.querySelectorAll('.vgb__rij')).map((rij, i) => {
    const data = rij.querySelector('data[value]');
    let spoor = rij.querySelector('.vgb__spoor');
    const spoorGemaakt = !spoor;
    if (!spoor) {
      spoor = doc.createElement('dd');
      spoor.className = 'vgb__spoor';
      spoor.setAttribute('aria-hidden', 'true');
      rij.appendChild(spoor);
    }
    let balk = spoor.querySelector('.vgb__balk');
    const balkGemaakt = !balk;
    if (!balk) {
      balk = doc.createElement('span');
      balk.className = 'vgb__balk';
      spoor.appendChild(balk);
    }
    balk.style.setProperty('--vgb-i', String(i));
    return {
      data, spoor, balk, spoorGemaakt, balkGemaakt,
      origTekst: data ? data.textContent : null,
      origWaarde: data ? data.getAttribute('value') : null,
    };
  });
  if (rijen.length === 0) console.warn('vergelijkbalk: geen .vgb__rij gevonden');

  const waarden = rijen.map((r) => getal(r.data && r.data.value));
  let onthuld = false;
  let dood = false;
  let groeiTimer = 0;
  let stopIO = () => {};

  root.setAttribute('data-vgb-actief', '');

  function schaal() {
    const geldig = waarden.filter(Number.isFinite);
    const max = Number.isFinite(o.max) ? o.max : Math.max(0, ...geldig);
    rijen.forEach((r, i) => {
      const w = Number.isFinite(waarden[i]) ? Math.max(0, waarden[i]) : 0;
      r.balk.style.setProperty('--vgb-s', max > 0 ? String(Math.min(1, w / max)) : '0');
    });
  }

  function onthul(direct) {
    if (onthuld || dood) return;
    onthuld = true;
    stopIO();
    if (!direct) {
      root.setAttribute('data-vgb-groei', '');
      // Stijl vastleggen vóór de nieuwe waarde, anders slaat de browser de overgang over.
      void root.getBoundingClientRect();
      groeiTimer = win.setTimeout(() => root.removeAttribute('data-vgb-groei'), 900 + 80 * rijen.length + 60);
    }
    schaal();
  }

  const gepauzeerd = () => doc.documentElement.getAttribute('data-motion') === 'paused';
  const mb = minderBeweging((r) => { if (r) onthul(true); }, doc);

  function opPauze(e) {
    const p = !!(e && e.detail && e.detail.gepauzeerd);
    if (p) { root.setAttribute('data-vgb-pauze', ''); onthul(true); }
    else root.removeAttribute('data-vgb-pauze');
  }
  doc.addEventListener('beweging:pauze', opPauze);

  if (mb.reduced || gepauzeerd()) onthul(true);
  else stopIO = inBeeld(root, () => onthul(false), { threshold: o.drempel });

  function zet(nieuw) {
    if (dood || !Array.isArray(nieuw)) return;
    rijen.forEach((r, i) => {
      const n = getal(nieuw[i]);
      if (!Number.isFinite(n)) return;
      waarden[i] = n;
      if (r.data) {
        r.data.value = String(n);
        r.data.textContent = o.formaat(n);
      }
    });
    if (onthuld) {
      root.removeAttribute('data-vgb-groei');
      schaal();
    }
  }

  function destroy() {
    if (dood) return;
    dood = true;
    stopIO();
    mb.stop();
    win.clearTimeout(groeiTimer);
    doc.removeEventListener('beweging:pauze', opPauze);
    root.removeAttribute('data-vgb-actief');
    root.removeAttribute('data-vgb-groei');
    root.removeAttribute('data-vgb-pauze');
    for (const r of rijen) {
      r.balk.style.removeProperty('--vgb-s');
      r.balk.style.removeProperty('--vgb-i');
      if (r.balk.getAttribute('style') === '') r.balk.removeAttribute('style');
      if (r.spoorGemaakt) r.spoor.remove();
      else if (r.balkGemaakt) r.balk.remove();
      if (r.data && r.origWaarde !== null) {
        r.data.setAttribute('value', r.origWaarde);
        r.data.textContent = r.origTekst;
      }
    }
  }
  destroy.zet = zet;
  return destroy;
}
