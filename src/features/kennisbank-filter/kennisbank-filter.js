/**
 * kennisbank-filter
 * ------------------------------------------------------------------------
 * Filter, zoek, sorteer en "meer laden" voor een lijst kaarten (artikelen,
 * podcasts, video's, vacatures, cases) zonder CMS. De kaarten staan als
 * gewone markup in de pagina (SEO, werkt zonder JS); dit onderdeel bouwt de
 * bediening erbij, verbergt/toont kaarten met het `hidden`-attribuut en
 * bewaart de stand in de querystring (delen, bookmarken, terug/vooruit).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan binnen `init()`.
 *
 * Eigen implementatie.
 *
 * Markup-contract (zie README):
 *   root                     [data-kb]
 *   [data-kb-controls hidden]  lege plek voor de bediening (JS haalt `hidden` weg)
 *   [data-kb-lijst]            de lijst met kaarten
 *   [data-kb-kaart]            per kaart, met
 *     data-kb-categorie="SEO|Websites"   één of meer, gescheiden door |
 *     data-kb-soort="artikel"            één soort (optioneel)
 *     data-kb-datum="2026-09-12"         JJJJ-MM-DD
 *     data-kb-<sleutel>="…"              per extra filter (facetten) of bereik (getal of "min-max")
 *     [data-kb-titel] en [data-kb-samenvatting] = doorzoekbare tekst
 *
 * @typedef {Object} Facet  Extra checkbox-filter op een `data-kb-<sleutel>`-attribuut ("|" = meerdere waarden).
 * @property {string} sleutel  Attribuutnaam en URL-parameter, bv. "locatie".
 * @property {string} label    Legenda in de bediening.
 * @typedef {Object} Bereik  Numeriek bereik op `data-kb-<sleutel>` ("3400" of "3400-4600"; een kaart telt mee als zijn waarde het gekozen bereik overlapt).
 * @property {string} sleutel  Attribuutnaam en URL-parameter, bv. "salaris" (`?salaris=3000-4500`).
 * @property {string} label    Legenda, bv. "Salaris per maand".
 * @property {number} [stap=1]
 * @property {number} [min]    Standaard: laagste waarde uit de kaarten (afgerond op `stap`).
 * @property {number} [max]    Standaard: hoogste waarde uit de kaarten.
 * @property {(n:number)=>string} [formaat]  Weergave, bv. formatEuro.
 *
 * @typedef {Object} KennisbankOpties
 * @property {number} [perPagina=9] Kaarten per "pagina"; "Toon meer" voegt er zoveel toe.
 * @property {number} [debounce=200] Wachttijd (ms) na typen in het zoekveld.
 * @property {boolean} [url=true] Filterstand in de querystring (history).
 * @property {Array<Object>} [bron] JSON in plaats van markup: `{titel, samenvatting, categorieen[], soort, datum, href, meta, waarden:{sleutel:waarde}}`.
 * @property {[string,string]} [eenheid=['item','items']] Enkelvoud/meervoud in de telling.
 * @property {Facet[]} [facetten] Extra checkbox-filters.
 * @property {Bereik[]} [bereiken] Numerieke bereikfilters (twee schuiven + live label).
 * @property {'vacatures'} [modus] Voorinstelling: facetten locatie, uren en contract, bereik salaris per maand, eenheid "vacature(s)".
 * @property {'raster'|'masonry'} [weergave='raster'] Masonry = CSS-kolommen (leesrichting: kolom voor kolom).
 * @property {Record<string,string|Function>} [tekst] Overschrijf labels.
 * @param {Element} root
 * @param {KennisbankOpties} [opties]
 * @returns {() => void} destroy (idempotent)
 */
import { vereisRoot, minderBeweging, zonderUndefined } from '../../_kwaliteit/basis.js';

const TEKST = {
  zoeken: 'Zoeken', zoekHint: 'Titel of samenvatting', sorteren: 'Sorteren',
  nieuwste: 'Nieuwste eerst', oudste: 'Oudste eerst', soort: 'Soort', categorie: 'Categorie',
  filters: 'Filters', wis: 'Wis filters', meer: 'Toon meer', van: 'Van', tot: 'Tot',
  klaar: (n) => (n === 0 ? 'Geen resultaten' : n === 1 ? 'Toon 1 resultaat' : `Toon ${n} resultaten`),
  leegTitel: 'Niets gevonden', leegTekst: 'Er is geen bijdrage die bij deze combinatie past. Haal een filter weg of begin opnieuw.',
};
let teller = 0;

const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const num = (s) => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) ? n : null; };

/** € 3.400 (nl-NL, hele euro's). Bruikbaar als `formaat` van een bereik. */
export const formatEuro = (n) => `€ ${Math.round(n).toLocaleString('nl-NL')}`;

const VACATURES = {
  facetten: [{ sleutel: 'locatie', label: 'Locatie' }, { sleutel: 'uren', label: 'Uren per week' }, { sleutel: 'contract', label: 'Contracttype' }],
  bereiken: [{ sleutel: 'salaris', label: 'Salaris per maand', stap: 100, formaat: formatEuro }],
  eenheid: ['vacature', 'vacatures'],
  tekst: { zoekHint: 'Functie of omschrijving', categorie: 'Vakgebied', leegTekst: 'Er is geen vacature die hierbij past. Haal een filter weg of wis ze allemaal.' },
};

function h(doc, tag, attrs, ...kids) {
  const el = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v);
  for (const k of kids) if (k != null) el.append(k);
  return el;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'kennisbank-filter')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const lijst = root.querySelector('[data-kb-lijst]');
  if (!lijst) { console.warn('kennisbank-filter: geen [data-kb-lijst] gevonden — overgeslagen'); return () => {}; }

  const voor = opties.modus === 'vacatures' ? VACATURES : {};
  const o = { perPagina: 9, debounce: 200, url: true, eenheid: ['item', 'items'], weergave: 'raster', ...voor, ...zonderUndefined(opties) };
  const T = { ...TEKST, ...zonderUndefined(voor.tekst), ...zonderUndefined(opties.tekst) };
  const perPagina = Math.max(1, Math.floor(o.perPagina) || 9);
  const uid = `kb${++teller}`;
  const ac = new AbortController();
  const opt = { signal: ac.signal };
  const undo = [];
  let dood = false;

  // --- kaarten (markup of JSON) ----------------------------------------
  const origLijst = lijst.innerHTML;
  if (Array.isArray(o.bron)) {
    lijst.replaceChildren();
    o.bron.forEach((b) => {
      const li = h(doc, 'li', {
        'data-kb-kaart': '', class: 'kb-kaart',
        'data-kb-categorie': (b.categorieen || []).join('|'), 'data-kb-soort': b.soort || '', 'data-kb-datum': b.datum || '',
      });
      Object.entries(b.waarden || {}).forEach(([k, v]) => li.setAttribute(`data-kb-${k}`, Array.isArray(v) ? v.join('|') : v));
      const a = h(doc, 'a', { class: 'kb-link', href: b.href || '#' });
      const body = h(doc, 'div', { class: 'kb-body' });
      if (b.meta) body.append(h(doc, 'p', { class: 'kb-meta' }, b.meta));
      const t = h(doc, 'h3', { class: 'kb-titel', 'data-kb-titel': '' }); t.textContent = b.titel || '';
      body.append(t);
      if (b.samenvatting) { const s = h(doc, 'p', { class: 'kb-samenvatting', 'data-kb-samenvatting': '' }); s.textContent = b.samenvatting; body.append(s); }
      a.append(body); li.append(a); lijst.append(li);
    });
  }

  // --- groepen (checkbox-filters): soort, categorie, facetten -------------
  const mkGroep = (naam, attr, legend, enkel) => ({ naam, attr, legend, enkel, set: new Set(), labels: new Map(), n: new Map() });
  const groepen = [mkGroep('cat', 'data-kb-categorie', T.categorie, false), mkGroep('soort', 'data-kb-soort', T.soort, true)]; // URL-volgorde; in de bediening staat soort eerst
  (o.facetten || []).forEach((f) => groepen.push(mkGroep(slug(f.sleutel), `data-kb-${slug(f.sleutel)}`, f.label, false)));
  const bereiken = (o.bereiken || []).map((b) => ({ ...b, sleutel: slug(b.sleutel), stap: b.stap || 1, formaat: b.formaat || ((n) => n.toLocaleString('nl-NL')) }));
  const kaartEls = [...lijst.querySelectorAll('[data-kb-kaart]')];

  const kaarten = kaartEls.map((el, i) => {
    const titel = el.querySelector('[data-kb-titel]');
    const sam = el.querySelector('[data-kb-samenvatting]');
    const tekst = titel || sam ? `${titel ? titel.textContent : ''} ${sam ? sam.textContent : ''}` : el.textContent;
    const w = {};
    groepen.forEach((g) => {
      const ruw = el.getAttribute(g.attr) || '';
      const delen = (g.enkel ? [ruw] : ruw.split('|')).map((s) => s.trim()).filter(Boolean);
      w[g.naam] = delen.map((l) => { const sl = slug(l); if (!g.labels.has(sl)) g.labels.set(sl, g.enkel ? cap(l) : l); return sl; });
    });
    const b = {};
    bereiken.forEach((r) => {
      const m = String(el.getAttribute(`data-kb-${r.sleutel}`) || '').match(/^\s*(-?\d+(?:[.,]\d+)?)(?:\s*-\s*(-?\d+(?:[.,]\d+)?))?\s*$/);
      b[r.sleutel] = m ? [num(m[1]), num(m[2] != null ? m[2] : m[1])] : null;
    });
    return { el, i, tekst: norm(tekst), w, b, datum: el.getAttribute('data-kb-datum') || '', hadHidden: el.hidden };
  });
  const origVolgorde = kaartEls.slice();
  groepen.forEach((g) => {
    g.lijst = [...g.labels.entries()];
    if (g.naam !== 'soort') g.lijst.sort((a, b) => a[1].localeCompare(b[1], 'nl', { numeric: true }));
  });
  bereiken.forEach((r) => {
    const waarden = kaarten.map((c) => c.b[r.sleutel]).filter(Boolean).flat();
    const lo = r.min != null ? r.min : waarden.length ? Math.floor(Math.min(...waarden) / r.stap) * r.stap : 0;
    const hi = r.max != null ? r.max : waarden.length ? Math.ceil(Math.max(...waarden) / r.stap) * r.stap : lo;
    r.min = lo; r.max = Math.max(hi, lo); r.lo = r.min; r.hi = r.max;
  });
  const smal = (r) => r.lo > r.min || r.hi < r.max;
  const totaal = kaarten.length;

  // --- stand -----------------------------------------------------------
  const state = { q: '', sort: 'nieuw', n: 1 };
  function leesUrl() {
    const p = new URLSearchParams(win.location.search);
    state.q = (p.get('q') || '').slice(0, 200);
    groepen.forEach((g) => { g.set = new Set((p.get(g.param || g.naam) || '').split(',').map(slug).filter((s) => g.labels.has(s))); });
    bereiken.forEach((r) => {
      r.lo = r.min; r.hi = r.max;
      const m = String(p.get(r.sleutel) || '').match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
      if (m) {
        let a = +m[1]; let b = +m[2];
        if (a > b) [a, b] = [b, a];
        const rond = (x) => Math.min(Math.max(Math.round((x - r.min) / r.stap) * r.stap + r.min, r.min), r.max); // op de stap van de schuif
        r.lo = rond(a); r.hi = rond(b);
      }
    });
    state.sort = p.get('sort') === 'oud' ? 'oud' : 'nieuw';
    const pn = parseInt(p.get('p'), 10);
    state.n = pn >= 1 && pn <= Math.max(1, Math.ceil(totaal / perPagina)) ? pn : 1;
  }
  groepen.forEach((g) => { g.param = g.naam; });
  function schrijfUrl(modus) {
    if (!o.url) return;
    const p = new URLSearchParams(win.location.search);
    ['q', 'sort', 'p', ...groepen.map((g) => g.param), ...bereiken.map((r) => r.sleutel)].forEach((k) => p.delete(k));
    if (state.q.trim()) p.set('q', state.q.trim());
    groepen.forEach((g) => { if (g.set.size) p.set(g.param, [...g.set].join(',')); });
    bereiken.forEach((r) => { if (smal(r)) p.set(r.sleutel, `${r.lo}-${r.hi}`); });
    if (state.sort === 'oud') p.set('sort', 'oud');
    if (state.n > 1) p.set('p', String(state.n));
    const qs = p.toString();
    const url = win.location.pathname + (qs ? `?${qs}` : '') + win.location.hash;
    if (url === win.location.pathname + win.location.search + win.location.hash) return;
    try { win.history[modus === 'replace' ? 'replaceState' : 'pushState'](null, '', url); } catch { /* sandbox/file:// */ }
  }

  // --- bediening bouwen ------------------------------------------------
  let controls = root.querySelector('[data-kb-controls]');
  const controlsOrig = controls ? { html: controls.innerHTML, hidden: controls.hidden } : null;
  let controlsGemaakt = false;
  if (!controls) { controls = h(doc, 'div', { 'data-kb-controls': '' }); root.prepend(controls); controlsGemaakt = true; }
  controls.replaceChildren();

  const idPaneel = `${uid}-paneel`;
  const toggleN = h(doc, 'span', { class: 'kb-toggle__n' });
  const toggle = h(doc, 'button', { type: 'button', class: 'kb-toggle', 'aria-expanded': 'false', 'aria-controls': idPaneel }, h(doc, 'span', {}, T.filters), toggleN);
  const zoek = h(doc, 'input', { type: 'search', id: `${uid}-q`, class: 'kb-invoer', autocomplete: 'off', spellcheck: 'false', placeholder: T.zoekHint, enterkeyhint: 'search' });
  const sorteer = h(doc, 'select', { id: `${uid}-sort`, class: 'kb-invoer' },
    h(doc, 'option', { value: 'nieuw' }, T.nieuwste), h(doc, 'option', { value: 'oud' }, T.oudste));
  const wisKnop = h(doc, 'button', { type: 'button', class: 'kb-wis' }, T.wis);
  const paneel = h(doc, 'div', { class: 'kb-paneel', id: idPaneel, 'data-open': 'false' });

  const teltekst = new Map();
  const boxen = [];
  function groepUi(g) {
    if (!g.lijst.length) return null;
    const fs = h(doc, 'fieldset', { class: 'kb-groep' }, h(doc, 'legend', {}, g.legend));
    g.lijst.forEach(([sl, label], k) => {
      const id = `${uid}-${g.naam}-${k}`;
      const n = h(doc, 'span', { class: 'kb-n' });
      teltekst.set(`${g.naam}:${sl}`, n);
      const cb = h(doc, 'input', { type: 'checkbox', id, value: sl, 'data-kb-groep': g.naam });
      boxen.push(cb);
      fs.append(h(doc, 'div', { class: 'kb-optie' }, cb, h(doc, 'label', { for: id }, label, ' ', n)));
    });
    return fs;
  }
  function bereikUi(r) {
    const fs = h(doc, 'fieldset', { class: 'kb-groep kb-bereik', 'data-kb-bereik': r.sleutel }, h(doc, 'legend', {}, r.label));
    const maak = (naam, tekst) => {
      const id = `${uid}-${r.sleutel}-${naam}`;
      const inp = h(doc, 'input', { type: 'range', id, min: r.min, max: r.max, step: r.stap, class: 'kb-schuif' });
      return [inp, h(doc, 'div', { class: 'kb-schuifrij' }, h(doc, 'label', { for: id }, tekst), inp)];
    };
    const [lo, loRij] = maak('van', T.van); const [hi, hiRij] = maak('tot', T.tot);
    r.slLo = lo; r.slHi = hi;
    r.uit = h(doc, 'output', { class: 'kb-bereik__uit', for: `${lo.id} ${hi.id}` });
    fs.append(r.uit, loRij, hiRij);
    return fs;
  }
  paneel.append(
    h(doc, 'div', { class: 'kb-veld' }, h(doc, 'label', { for: zoek.id }, T.zoeken), zoek),
    h(doc, 'div', { class: 'kb-veld' }, h(doc, 'label', { for: sorteer.id }, T.sorteren), sorteer),
  );
  [groepen[1], groepen[0], ...groepen.slice(2)].forEach((g) => { const ui = groepUi(g); if (ui) paneel.append(ui); });
  bereiken.forEach((r) => paneel.append(bereikUi(r)));
  const klaarKnop = h(doc, 'button', { type: 'button', class: 'kb-klaar' });
  paneel.append(wisKnop, klaarKnop);
  controls.append(toggle, paneel);
  controls.hidden = false;
  root.setAttribute('data-kb-actief', '');
  const hadDataKb = root.hasAttribute('data-kb');
  if (!hadDataKb) root.setAttribute('data-kb', '');
  const weergaveOrig = root.getAttribute('data-kb-weergave');
  if (o.weergave === 'masonry') root.setAttribute('data-kb-weergave', 'masonry');

  const status = h(doc, 'p', { class: 'kb-status', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', 'data-kb-status': '' });
  const meer = h(doc, 'button', { type: 'button', class: 'kb-meer', hidden: true });
  const leeg = h(doc, 'div', { class: 'kb-leeg', hidden: true, 'data-kb-leeg': '' },
    h(doc, 'h3', {}, T.leegTitel), h(doc, 'p', {}, T.leegTekst), h(doc, 'button', { type: 'button', class: 'kb-wis kb-wis--leeg' }, T.wis));
  lijst.before(status);
  lijst.after(leeg, h(doc, 'div', { class: 'kb-meer-wrap' }, meer));
  const meerWrap = meer.parentElement;
  undo.push(() => { status.remove(); leeg.remove(); meerWrap.remove(); });

  // --- filteren ----------------------------------------------------------
  const beweging = minderBeweging(null, doc);
  let eerste = true;
  let volgorde = null;
  let sortGetoond = null;

  function sorteerKaarten() {
    const f = state.sort === 'oud' ? 1 : -1;
    volgorde = kaarten.slice().sort((a, b) => (a.datum < b.datum ? -f : a.datum > b.datum ? f : a.i - b.i));
    if (sortGetoond !== state.sort) {
      const frag = doc.createDocumentFragment();
      volgorde.forEach((c) => frag.append(c.el));
      lijst.append(frag);
      sortGetoond = state.sort;
    }
  }

  const bereikOk = (c, r) => {
    if (!smal(r)) return true;
    const b = c.b[r.sleutel];
    return !!b && b[0] <= r.hi && b[1] >= r.lo;
  };

  function toonBereik(r) {
    r.uit.textContent = `${r.formaat(r.lo)} – ${r.formaat(r.hi)}`;
    r.slLo.value = r.lo; r.slHi.value = r.hi;
    r.slLo.setAttribute('aria-valuetext', r.formaat(r.lo));
    r.slHi.setAttribute('aria-valuetext', r.formaat(r.hi));
  }

  function toepassen() {
    if (dood) return;
    sorteerKaarten();
    const woorden = norm(state.q).split(/\s+/).filter(Boolean);
    groepen.forEach((g) => g.n.clear());
    let treffers = 0; let getoond = 0; const max = state.n * perPagina;
    const nieuw = [];
    for (const c of volgorde) {
      // Welke filters faalt deze kaart? 0 = treffer; precies 1 groep = telt mee in de teller van die groep.
      let falen = 0; let enige = null;
      if (woorden.length && !woorden.every((w) => c.tekst.includes(w))) falen++;
      for (const g of groepen) if (g.set.size && !c.w[g.naam].some((s) => g.set.has(s))) { falen++; enige = g; }
      for (const r of bereiken) if (!bereikOk(c, r)) falen++;
      if (falen === 0) groepen.forEach((g) => c.w[g.naam].forEach((s) => g.n.set(s, (g.n.get(s) || 0) + 1)));
      else if (falen === 1 && enige) c.w[enige.naam].forEach((s) => enige.n.set(s, (enige.n.get(s) || 0) + 1));
      const zichtbaar = falen === 0 && (++treffers) <= max;
      if (zichtbaar) getoond++;
      if (c.el.hidden === zichtbaar) {
        c.el.hidden = !zichtbaar;
        if (zichtbaar && !eerste && !beweging.reduced) { c.el.classList.remove('kb-in'); c.el.classList.add('kb-in'); nieuw.push(c); }
        if (!zichtbaar) c.el.classList.remove('kb-in');
      }
    }
    const gid = new Map(groepen.map((g) => [g.naam, g]));
    teltekst.forEach((span, key) => {
      const [gn, sl] = key.split(':');
      const n = gid.get(gn).n.get(sl) || 0;
      span.textContent = `(${n})`;
      span.parentElement.parentElement.toggleAttribute('data-nul', n === 0);
    });
    bereiken.forEach(toonBereik);
    const [een, meerdere] = o.eenheid;
    status.textContent = `${treffers} van ${totaal} ${totaal === 1 ? een : meerdere}${treffers > getoond ? `, ${getoond} getoond` : ''}`;
    leeg.hidden = treffers !== 0;
    lijst.hidden = treffers === 0;
    const rest = treffers - getoond;
    meer.hidden = rest <= 0;
    if (rest > 0) meer.textContent = `${T.meer} (${Math.min(perPagina, rest)} van ${rest})`;
    const actief = groepen.reduce((s, g) => s + g.set.size, 0) + bereiken.filter(smal).length + (state.q.trim() ? 1 : 0);
    klaarKnop.textContent = T.klaar(treffers);
    toggleN.textContent = actief ? String(actief) : '';
    toggleN.hidden = !actief;
    wisKnop.disabled = !actief;
    root.toggleAttribute('data-kb-gefilterd', !!actief);
    eerste = false;
    return { nieuw, treffers, getoond };
  }

  function syncControls() {
    zoek.value = state.q;
    sorteer.value = state.sort;
    boxen.forEach((cb) => { cb.checked = groepen.find((g) => g.naam === cb.getAttribute('data-kb-groep')).set.has(cb.value); });
    bereiken.forEach(toonBereik);
  }

  // --- events ------------------------------------------------------------
  let timer = 0;
  const vlak = () => { clearTimeout(timer); timer = 0; };
  let reeks = false; // loopt er een zoek- of sleepreeks? eerste stap = push, rest = replace
  let reeksTimer = 0;
  const stap = () => { reeks = false; clearTimeout(reeksTimer); reeksTimer = 0; };
  function zoekNu(modus) {
    vlak();
    if (state.q === zoek.value) return;
    state.q = zoek.value; state.n = 1;
    toepassen(); schrijfUrl(reeks ? 'replace' : 'push');
    reeks = modus !== 'einde';
  }
  zoek.addEventListener('input', () => { vlak(); timer = win.setTimeout(() => zoekNu('reeks'), o.debounce); }, opt);
  zoek.addEventListener('search', () => zoekNu('einde'), opt);
  zoek.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); zoekNu('einde'); } }, opt);
  zoek.addEventListener('blur', () => { zoekNu('einde'); stap(); }, opt);
  sorteer.addEventListener('change', () => { stap(); state.sort = sorteer.value; state.n = 1; toepassen(); schrijfUrl('push'); }, opt);
  boxen.forEach((cb) => cb.addEventListener('change', () => {
    stap();
    const set = groepen.find((g) => g.naam === cb.getAttribute('data-kb-groep')).set;
    cb.checked ? set.add(cb.value) : set.delete(cb.value);
    state.n = 1; toepassen(); schrijfUrl('push');
  }, opt));
  // bereik: slepen of een reeks toetsdrukken = één historiestap (eerste 'input' push, rest replace; sluit na 700 ms pauze of bij blur)
  bereiken.forEach((r) => {
    const bij = (welke) => () => {
      vlak();
      if (welke === 'lo') r.lo = Math.min(+r.slLo.value, r.hi); else r.hi = Math.max(+r.slHi.value, r.lo);
      state.n = 1; toepassen(); schrijfUrl(reeks ? 'replace' : 'push'); reeks = true;
    };
    r.slLo.addEventListener('input', bij('lo'), opt); r.slHi.addEventListener('input', bij('hi'), opt);
    // 'change' komt bij toetsen na elke druk: sluit de reeks pas na een pauze of bij blur, zodat een reeks pijltjes één stap is
    const sluitStraks = () => { clearTimeout(reeksTimer); reeksTimer = win.setTimeout(stap, 700); };
    [r.slLo, r.slHi].forEach((sl) => { sl.addEventListener('change', sluitStraks, opt); sl.addEventListener('blur', stap, opt); });
  });
  function wis() {
    vlak(); stap(); state.q = ''; groepen.forEach((g) => g.set.clear()); bereiken.forEach((r) => { r.lo = r.min; r.hi = r.max; }); state.n = 1;
    syncControls(); toepassen(); schrijfUrl('push');
    zoek.focus({ preventScroll: true });
  }
  wisKnop.addEventListener('click', wis, opt);
  leeg.querySelector('button').addEventListener('click', wis, opt);
  meer.addEventListener('click', () => {
    state.n++;
    const { nieuw } = toepassen();
    schrijfUrl('replace');
    const el = nieuw[0] ? nieuw[0].el : null;
    const doel = el && (el.querySelector('a, button') || el);
    if (doel) { if (!doel.matches('a, button')) doel.setAttribute('tabindex', '-1'); doel.focus({ preventScroll: false }); }
  }, opt);
  function zetPaneel(open) { toggle.setAttribute('aria-expanded', String(open)); paneel.setAttribute('data-open', String(open)); }
  toggle.addEventListener('click', () => zetPaneel(toggle.getAttribute('aria-expanded') !== 'true'), opt);
  klaarKnop.addEventListener('click', () => {
    zetPaneel(false);
    status.setAttribute('tabindex', '-1');
    status.focus({ preventScroll: true });
    status.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, opt);
  controls.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true' && toggle.offsetParent !== null) { zetPaneel(false); toggle.focus(); }
  }, opt);
  win.addEventListener('popstate', () => { if (dood) return; vlak(); stap(); leesUrl(); syncControls(); toepassen(); schrijfUrl('replace'); }, opt);

  leesUrl(); syncControls(); toepassen();
  schrijfUrl('replace'); // ongeldige waarden uit de adresbalk opruimen

  // --- opruimen ----------------------------------------------------------
  return function destroy() {
    if (dood) return;
    dood = true;
    vlak(); clearTimeout(reeksTimer);
    ac.abort();
    beweging.stop();
    undo.forEach((f) => f());
    kaarten.forEach((c) => { c.el.hidden = c.hadHidden; c.el.classList.remove('kb-in'); });
    if (Array.isArray(o.bron)) lijst.innerHTML = origLijst;
    else origVolgorde.forEach((el) => lijst.append(el));
    lijst.hidden = false;
    if (controlsGemaakt) controls.remove();
    else { controls.innerHTML = controlsOrig.html; controls.hidden = controlsOrig.hidden; }
    root.removeAttribute('data-kb-actief');
    root.removeAttribute('data-kb-gefilterd');
    if (weergaveOrig == null) root.removeAttribute('data-kb-weergave'); else root.setAttribute('data-kb-weergave', weergaveOrig);
    if (!hadDataKb) root.removeAttribute('data-kb');
  };
}
