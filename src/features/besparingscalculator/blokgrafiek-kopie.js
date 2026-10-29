/**
 * blokgrafiek
 * ------------------------------------------------------------------------
 * Staafgrafiek waarin elke staaf uit gestapelde blokjes bestaat (bijvoorbeeld
 * één blok per app), met legenda, waarde boven de staaf, label eronder, een
 * gemarkeerde staaf voor de huidige keuze en een tooltip bij hover, focus of
 * tik.
 *
 * Bron van waarheid is een gewone <table>. De module leest de tabel en tekent
 * de grafiek ernaast; de tabel blijft in de DOM (visueel verborgen, of
 * zichtbaar met `tabel: 'zichtbaar'`) en is zonder JavaScript de terugval.
 * Welke kolom wat is, staat op de kopcellen:
 *   data-grafiek="waarde"  hoogte van de staaf (verplicht)
 *   data-grafiek="spook"   gestippelde staaf erachter (optioneel, bv. prijs zonder korting)
 *   data-grafiek="sub"     kleine regel onder het label (optioneel)
 * Aantal blokken per staaf: `data-blokken` op de rij, anders het eerste getal
 * in de rijkop ("3 apps" → 3), anders de waarde zelf als die een heel getal ≤ 24 is.
 *
 * Toegankelijk: de grafiek is één tabstop (role="group"); pijltjes, Home en
 * End lopen langs de staven (role="img" met een aria-label uit de tabelrij).
 * Escape sluit de tooltip. Minder beweging, `html[data-motion="paused"]` en
 * het event `beweging:pauze` slaan de opbouw over.
 *
 * Beweging (gemeten op eu-hosted.com): blok scaleY 0 → 1 in .5 s ease-out met
 * `--delay` = kolom × 45 ms + blok × 22 ms; tooltip tipIn .15 s vanaf
 * opacity 0 en 4 px lager. Alleen transform en opacity.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @typedef {Object} BlokgrafiekOpties
 * @property {Element|string} [bron] De tabel (element of selector). Standaard de eerste <table> in root.
 * @property {'verborgen'|'zichtbaar'} [tabel='verborgen'] Tabel in root visueel verbergen of laten staan. Een tabel buiten root raakt de module nooit aan.
 * @property {string} [label] Toegankelijke naam van de grafiek. Standaard de <caption>.
 * @property {{gekozen?: string, overig?: string, spook?: string}} [legenda] Teksten van de legenda.
 * @property {{grafiek?: string, beschrijving?: string}} [teksten] Vaste zinnen voor schermlezers; `{naam}` en `{n}` worden ingevuld.
 * @property {string} [locale='nl-NL'] Notatie van de tabelgetallen (lezen) en de asgetallen (schrijven), via Intl.NumberFormat.
 * @property {number} [drempel=0.3] Deel in beeld voor de opbouw start.
 *
 * @param {Element} root Container (`.bgf`).
 * @param {BlokgrafiekOpties} [opties]
 * @returns {(() => void) & { kies: (index: number|null) => void }} destroy, met `destroy.kies(i)` om de gemarkeerde staaf te zetten. Idempotent.
 */
import { minderBeweging, inBeeld, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const NF = new Map();
const nf = (locale) => {
  if (!NF.has(locale)) NF.set(locale, new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }));
  return NF.get(locale);
};
/** Vaste zinnen (Nederlandse standaard); overschrijfbaar met de optie `teksten`. */
const TEKSTEN = {
  grafiek: 'Staafgrafiek',
  beschrijving: '{naam}. Staafgrafiek met {n} staven; pijltjes lopen langs de staven.',
};
const MAX_BLOKKEN = 24;
const KOLOM_MS = 45;
const BLOK_MS = 22;

/**
 * Getal uit celtekst in de notatie van `locale`. nl-NL: "€1.006" → 1006, "€17,50" → 17.5, "8%" → 8,
 * "−€84" → -84; en-GB: "€1,006" → 1006, "€17.50" → 17.5.
 */
export function leesGetal(tekst, locale = 'nl-NL') {
  const delen = nf(locale).formatToParts(1234.5);
  const groep = (delen.find((d) => d.type === 'group') || { value: '' }).value;
  const decimaal = (delen.find((d) => d.type === 'decimal') || { value: '.' }).value;
  const s = String(tekst ?? '').replace(/−/g, '-').replace(/[^\d,.-]/g, '');
  if (!/\d/.test(s)) return NaN;
  const n = Number((groep ? s.split(groep).join('') : s).replace(decimaal, '.'));
  return Number.isFinite(n) ? n : NaN;
}

/** Mooie asstap: 1, 2, 2,5 of 5 × 10^k, zodat er hooguit ±5 lijnen zijn. */
function asStap(max) {
  if (!(max > 0)) return 1;
  const ruw = max / 5;
  const macht = 10 ** Math.floor(Math.log10(ruw));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * macht >= ruw) return f * macht;
  return 10 * macht;
}

export function init(root, opties = {}) {
  const leeg = Object.assign(() => {}, { kies() {} });
  if (!vereisRoot(root, 'blokgrafiek')) return leeg;

  const o = { tabel: 'verborgen', drempel: 0.3, legenda: {}, locale: 'nl-NL', ...zonderUndefined(opties) };
  const T = { ...TEKSTEN, ...(o.teksten || {}) };
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const tabel = typeof o.bron === 'string' ? doc.querySelector(o.bron) : (o.bron || root.querySelector('table'));
  if (!tabel || tabel.tagName !== 'TABLE') {
    console.warn('blokgrafiek: geen <table> gevonden als bron — overgeslagen');
    return leeg;
  }

  // ---- tabel lezen --------------------------------------------------------
  const koppen = Array.from(tabel.querySelectorAll('thead th'));
  const kolomVan = (rol) => koppen.findIndex((th) => th.getAttribute('data-grafiek') === rol);
  let iWaarde = kolomVan('waarde');
  if (iWaarde < 0) iWaarde = 1;
  const iSpook = kolomVan('spook');
  const iSub = kolomVan('sub');
  const kopTekst = koppen.map((th) => th.textContent.trim());

  const trs = Array.from(tabel.querySelectorAll('tbody tr'));
  const rijen = trs.map((tr) => {
    const cellen = Array.from(tr.children);
    const tekst = cellen.map((c) => c.textContent.trim());
    const label = tekst[0] || '';
    const waarde = leesGetal(tekst[iWaarde], o.locale);
    const spook = iSpook >= 0 ? leesGetal(tekst[iSpook], o.locale) : NaN;
    const eersteGetal = label.match(/\d+/);
    let blokken = Number(tr.getAttribute('data-blokken'));
    if (!(blokken > 0)) blokken = eersteGetal ? Number(eersteGetal[0]) : (Number.isInteger(waarde) ? waarde : 1);
    blokken = Math.max(1, Math.min(MAX_BLOKKEN, Math.round(blokken) || 1));
    return {
      tr, tekst, label, waarde, spook, blokken,
      kort: eersteGetal ? eersteGetal[0] : label.slice(0, 3),
      sub: iSub >= 0 ? tekst[iSub] : '',
      waardeTekst: tekst[iWaarde] || '',
    };
  });
  if (rijen.length === 0) {
    console.warn('blokgrafiek: de tabel heeft geen rijen in <tbody> — overgeslagen');
    return leeg;
  }

  const voorbeeld = rijen[0].waardeTekst;
  const voor = (voorbeeld.match(/^[^\d−-]*/) || [''])[0];
  const na = (voorbeeld.match(/[^\d]*$/) || [''])[0];
  const opmaak = (n) => `${voor}${nf(o.locale).format(n)}${na}`;

  const hoogste = Math.max(0, ...rijen.map((r) => Math.max(r.waarde || 0, r.spook || 0)));
  const stap = asStap(hoogste);
  const top = Math.max(stap, Math.ceil(hoogste / stap) * stap);

  const origHuidig = trs.findIndex((tr) => tr.hasAttribute('data-huidig'));
  const caption = tabel.querySelector('caption');
  const naam = o.label || (caption ? caption.textContent.trim() : '') || T.grafiek;
  const tekstGekozen = o.legenda.gekozen || 'Huidige keuze';

  // ---- grafiek bouwen ----------------------------------------------------
  const maak = (tag, klasse, ouder) => {
    const el = doc.createElement(tag);
    if (klasse) el.className = klasse;
    if (ouder) ouder.appendChild(el);
    return el;
  };
  const gebouwd = [];

  const legenda = maak('div', 'bgf__legenda');
  legenda.setAttribute('aria-hidden', 'true');
  const legItem = (staalKlasse, tekst) => {
    const s = maak('span', 'bgf__legitem', legenda);
    maak('i', `bgf__staal ${staalKlasse}`, s);
    s.appendChild(doc.createTextNode(tekst));
  };
  legItem('bgf__staal--gekozen', tekstGekozen);
  legItem('', o.legenda.overig || 'Overige');
  if (iSpook >= 0) legItem('bgf__staal--spook', o.legenda.spook || kopTekst[iSpook] || '');

  const vlak = maak('div', 'bgf__vlak');
  vlak.setAttribute('role', 'group');
  vlak.setAttribute('aria-label', String(T.beschrijving).replace(/\{naam\}/g, naam).replace(/\{n\}/g, String(rijen.length)));
  const as = maak('div', 'bgf__as', vlak);
  as.setAttribute('aria-hidden', 'true');
  for (let v = 0; v <= top + 1e-9; v += stap) {
    const lijn = maak('div', 'bgf__lijn', as);
    lijn.style.setProperty('--y', String(v / top));
    maak('span', 'bgf__astekst', lijn).textContent = opmaak(v);
  }
  const staven = maak('div', 'bgf__staven', vlak);
  staven.style.setProperty('--bgf-n', String(rijen.length));

  const kolommen = rijen.map((r, ki) => {
    const kolom = maak('div', 'bgf__kolom', staven);
    kolom.setAttribute('role', 'img');
    kolom.tabIndex = -1;
    const h = Number.isFinite(r.waarde) ? Math.max(0, r.waarde) / top : 0;
    const sp = Number.isFinite(r.spook) ? Math.max(0, r.spook) / top : 0;
    kolom.style.setProperty('--h', String(h));
    kolom.style.setProperty('--top', String(Math.max(h, sp)));
    const staaf = maak('div', 'bgf__staaf', kolom);
    if (sp > 0) {
      const spook = maak('span', 'bgf__spook', staaf);
      spook.style.setProperty('--spook', String(sp));
    }
    const stapel = maak('span', 'bgf__stapel', staaf);
    for (let b = 0; b < r.blokken; b += 1) {
      const blok = maak('i', 'bgf__blok', stapel);
      blok.style.setProperty('--delay', `${ki * KOLOM_MS + b * BLOK_MS}ms`);
    }
    const totaal = maak('span', 'bgf__totaal', staaf);
    totaal.textContent = r.waardeTekst;
    totaal.style.setProperty('--delay', `${ki * KOLOM_MS + r.blokken * BLOK_MS + 250}ms`);
    const label = maak('span', 'bgf__label', kolom);
    maak('span', 'bgf__label-lang', label).textContent = r.label;
    maak('span', 'bgf__label-kort', label).textContent = r.kort;
    if (r.sub) maak('small', 'bgf__sub', label).textContent = r.sub;
    return kolom;
  });

  const tip = maak('div', 'bgf__tip', vlak);
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;

  const beschrijf = (ri) => rijen[ri].tekst
    .map((t, ci) => (ci === 0 ? t : `${kopTekst[ci] || ''} ${t}`.trim()))
    .join(', ');

  // In de DOM: legenda + vlak vóór de tabel (of zijn .bgf__bron-huls) als die in root staat, anders achteraan.
  let verborgen = null;
  if (root.contains(tabel)) {
    const anker = tabel.closest('.bgf__bron') && root.contains(tabel.closest('.bgf__bron')) ? tabel.closest('.bgf__bron') : tabel;
    anker.parentNode.insertBefore(legenda, anker);
    anker.parentNode.insertBefore(vlak, anker);
    if (o.tabel !== 'zichtbaar') verborgen = tabel.closest('.bgf__bron') || tabel;
    if (verborgen) verborgen.setAttribute('data-bgf-verborgen', '');
  } else {
    root.appendChild(legenda);
    root.appendChild(vlak);
  }
  gebouwd.push(legenda, vlak);
  root.setAttribute('data-bgf-actief', '');

  // ---- keuze ---------------------------------------------------------------
  let gekozen = -1;
  let actief = 0; // kolom met tabindex 0
  function zetTabstop(i) {
    actief = i;
    kolommen.forEach((k, ki) => { k.tabIndex = ki === i ? 0 : -1; });
  }
  function kies(index) {
    if (dood) return;
    const i = Number.isInteger(index) && index >= 0 && index < rijen.length ? index : -1;
    gekozen = i;
    rijen.forEach((r, ri) => {
      const aan = ri === i;
      kolommen[ri].toggleAttribute('data-gekozen', aan);
      kolommen[ri].setAttribute('aria-label', `${beschrijf(ri)}${aan ? `. ${tekstGekozen}.` : ''}`);
      r.tr.toggleAttribute('data-huidig', aan);
      if (aan) r.tr.setAttribute('aria-current', 'true');
      else r.tr.removeAttribute('aria-current');
    });
    if (doc.activeElement && kolommen.includes(doc.activeElement)) return;
    zetTabstop(i >= 0 ? i : 0);
  }

  // ---- tooltip -------------------------------------------------------------
  let tipVan = -1;
  function toonTip(i) {
    if (dood || i < 0) return;
    const r = rijen[i];
    tip.replaceChildren();
    maak('strong', 'bgf__tip-kop', tip).textContent = r.label;
    r.tekst.forEach((t, ci) => {
      if (ci === 0) return;
      const regel = maak('span', 'bgf__tip-regel', tip);
      maak('span', 'bgf__tip-naam', regel).textContent = kopTekst[ci] || '';
      maak('span', 'bgf__tip-waarde', regel).textContent = t;
    });
    const nieuw = tipVan !== i || tip.hidden;
    tip.hidden = false;
    tipVan = i;
    const kv = vlak.getBoundingClientRect();
    const staaf = kolommen[i].querySelector('.bgf__staaf').getBoundingClientRect();
    const topWaarde = Number(kolommen[i].style.getPropertyValue('--top')) || 0;
    const breedte = tip.offsetWidth;
    const midden = staaf.left + staaf.width / 2 - kv.left;
    const links = Math.min(Math.max(midden, breedte / 2 + 4), kv.width - breedte / 2 - 4);
    const boven = staaf.bottom - kv.top - staaf.height * topWaarde - 28;
    tip.style.left = `${links}px`;
    tip.style.top = `${Math.max(boven, tip.offsetHeight + 4)}px`;
    if (nieuw) {
      tip.classList.remove('bgf__tip--in');
      void tip.offsetWidth;
      tip.classList.add('bgf__tip--in');
    }
  }
  function verbergTip() {
    tip.hidden = true;
    tipVan = -1;
  }

  const kolomIndex = (el) => kolommen.indexOf(el && el.closest ? el.closest('.bgf__kolom') : null);
  const opOver = (e) => { if (e.pointerType !== 'touch') { const i = kolomIndex(e.target); if (i >= 0) toonTip(i); } };
  const opWeg = (e) => {
    if (e.pointerType === 'touch') return;
    const f = doc.activeElement;
    // Blijf staan als een toetsenbordgebruiker juist op een staaf staat.
    if (!(f && vlak.contains(f) && f.matches(':focus-visible'))) verbergTip();
  };
  const opTik = (e) => {
    if (e.pointerType !== 'touch') return;
    const i = kolomIndex(e.target);
    if (i < 0) return;
    if (tipVan === i) verbergTip(); else toonTip(i);
  };
  const opFocus = (e) => { const i = kolomIndex(e.target); if (i >= 0) { zetTabstop(i); toonTip(i); } };
  const opBlur = (e) => { if (!vlak.contains(e.relatedTarget)) verbergTip(); };
  const opToets = (e) => {
    const i = kolomIndex(e.target);
    if (i < 0) return;
    let doel = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') doel = Math.min(rijen.length - 1, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') doel = Math.max(0, i - 1);
    else if (e.key === 'Home') doel = 0;
    else if (e.key === 'End') doel = rijen.length - 1;
    else if (e.key === 'Escape') { if (!tip.hidden) { verbergTip(); e.preventDefault(); } return; }
    if (doel < 0) return;
    e.preventDefault();
    zetTabstop(doel);
    kolommen[doel].focus();
  };
  const opDocToets = (e) => { if (e.key === 'Escape' && !tip.hidden) verbergTip(); };
  staven.addEventListener('pointerover', opOver);
  vlak.addEventListener('pointerleave', opWeg);
  staven.addEventListener('pointerdown', opTik);
  staven.addEventListener('focusin', opFocus);
  staven.addEventListener('focusout', opBlur);
  staven.addEventListener('keydown', opToets);
  doc.addEventListener('keydown', opDocToets);

  // ---- opbouw --------------------------------------------------------------
  let dood = false;
  let stopIO = () => {};
  const gepauzeerd = () => doc.documentElement.getAttribute('data-motion') === 'paused';
  function bouw(direct) {
    if (dood) return;
    stopIO();
    root.setAttribute('data-bgf-staat', direct ? 'klaar' : 'bouw');
  }
  const mb = minderBeweging((r) => { if (r) bouw(true); }, doc);
  function opPauze(e) {
    const p = !!(e && e.detail && e.detail.gepauzeerd);
    root.toggleAttribute('data-bgf-pauze', p);
    if (p && root.getAttribute('data-bgf-staat') === 'wacht') bouw(true);
  }
  doc.addEventListener('beweging:pauze', opPauze);

  kies(origHuidig);
  if (mb.reduced || gepauzeerd()) bouw(true);
  else {
    root.setAttribute('data-bgf-staat', 'wacht');
    stopIO = inBeeld(vlak, () => bouw(false), { threshold: o.drempel });
  }

  function destroy() {
    if (dood) return;
    dood = true;
    stopIO();
    mb.stop();
    doc.removeEventListener('beweging:pauze', opPauze);
    doc.removeEventListener('keydown', opDocToets);
    for (const el of gebouwd) el.remove();
    if (verborgen) verborgen.removeAttribute('data-bgf-verborgen');
    trs.forEach((tr, i) => {
      tr.removeAttribute('aria-current');
      tr.toggleAttribute('data-huidig', i === origHuidig);
    });
    root.removeAttribute('data-bgf-actief');
    root.removeAttribute('data-bgf-staat');
    root.removeAttribute('data-bgf-pauze');
  }
  destroy.kies = kies;
  return destroy;
}
