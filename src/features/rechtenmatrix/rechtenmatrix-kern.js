/**
 * rechtenmatrix
 * ------------------------------------------------------------------------
 * "Wie mag wat": links een lijst met rollen of personen, rechts per
 * categorie (inklapbaar) de handelingen, elk met een schakelaar van 2 tot 4
 * standen. Bedoeld om vertrouwen te wekken ("wat doet ons AI-team zelf, wat
 * vraagt het eerst, wat nooit") en breder bruikbaar: "wat doen wij, wat doet
 * u" in een dienstverlening, of rollen in een team.
 *
 * Alles komt uit één config (JSON): standen en labels, teksten, rollen,
 * categorieën, handelingen en beginwaarden. Er staan geen zichtbare teksten
 * in deze code.
 *
 * Twee modi:
 *  - `toon`   alleen lezen (marketing). De schakelaars zijn focusbaar maar
 *             niet te wijzigen (`aria-readonly`).
 *  - `bewerk` de bezoeker klikt of gebruikt de pijltjestoetsen. Elke wijziging
 *             gaat als `rechtenmatrix:wijziging` (CustomEvent, bubbelt) de
 *             wereld in en de hele stand staat als JSON in een verborgen
 *             formulierveld.
 *
 * Eigen implementatie.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan binnen `init()`.
 *
 * @typedef {Object} Stand
 * @property {string} id
 * @property {string} label  Volledige naam ("Doet dit zelf") — zichtbaar op de schakelaar.
 * @property {string} [kort] Korte vorm voor de samenvatting ("zelf"). Standaard = label.
 * @property {string} [icoon] check | pauze | ban | vraag | user | users | samen | pen
 * @property {string} [kleur] Tekstkleur (donker genoeg voor 4,5:1 op lichte tint); standaard per volgorde.
 *
 * @typedef {Object} RechtenmatrixOpties
 * @property {object} [config] Config-object. Ontbreekt het, dan wordt `<script type="application/json" data-rm-config>` in `root` gelezen.
 * @property {'toon'|'bewerk'} [modus] Overschrijft `config.modus`.
 *
 * @param {Element} root Element met `data-rechtenmatrix`.
 * @param {RechtenmatrixOpties} [opties]
 * @returns {() => void} destroy — ruimt alles op, idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const ICONEN = {
  check: '<circle cx="12" cy="12" r="9"/><path d="M8.2 12.4l2.6 2.6 5-5.4"/>',
  pauze: '<circle cx="12" cy="12" r="9"/><path d="M10 8.8v6.4M14 8.8v6.4"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  vraag: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.6M12 16.5v.1"/>',
  user: '<circle cx="12" cy="8.5" r="3.4"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/>',
  users: '<circle cx="9" cy="9" r="3"/><path d="M3.5 18.5a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.6" r="2.4"/><path d="M16.2 14.1a5 5 0 0 1 5.3 4.4"/>',
  samen: '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
  pen: '<path d="M4 20l4.2-1 10-10a2 2 0 0 0-2.8-2.8l-10 10L4 20z"/>',
  slot: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  pijl: '<path d="M9 6l6 6-6 6"/>',
};

let teller = 0;

/** Vult `{naam}`-plekken in een sjabloon. */
function vul(sjabloon, vars) {
  return String(sjabloon).replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : vars[k]));
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/**
 * Controleert de config en vult beginwaarden aan. Geeft null bij een
 * onbruikbare config (dan doet de feature niets in plaats van te crashen).
 */
function normaliseer(ruw, modusOpt) {
  if (!ruw || typeof ruw !== 'object') return null;
  const standen = (Array.isArray(ruw.standen) ? ruw.standen : []).slice(0, 4).map((s, i) => ({
    id: String(s.id ?? i),
    label: String(s.label ?? ''),
    kort: String(s.kort ?? s.label ?? ''),
    icoon: ICONEN[s.icoon] ? s.icoon : 'check',
    kleur: s.kleur || '',
  }));
  const rollen = (Array.isArray(ruw.rollen) ? ruw.rollen : []).filter((r) => r && r.id !== undefined && r.naam);
  const ruweCats = ruw.categorieen || ruw['categorieën'] || [];
  const categorieen = (Array.isArray(ruweCats) ? ruweCats : []).filter((c) => c && c.id !== undefined && Array.isArray(c.handelingen)).map((c) => ({
    ...c,
    handelingen: c.handelingen.filter((h) => h && h.id !== undefined && h.naam),
  }));
  if (standen.length < 2 || !rollen.length || !categorieen.length) return null;

  const ids = new Set(standen.map((s) => s.id));
  const geldig = (v, terug) => (ids.has(String(v)) ? String(v) : terug);
  const eerste = geldig(ruw.standaard, standen[0].id);
  const waarden = {};
  for (const r of rollen) {
    waarden[r.id] = {};
    for (const c of categorieen) {
      for (const h of c.handelingen) {
        const beginstand = ruw.waarden && ruw.waarden[r.id] ? ruw.waarden[r.id][h.id] : undefined;
        waarden[r.id][h.id] = geldig(beginstand, geldig(h.standaard, eerste));
      }
    }
  }
  return {
    modus: (modusOpt || ruw.modus) === 'bewerk' ? 'bewerk' : 'toon',
    veldnaam: ruw.veldnaam || 'rechtenmatrix',
    teksten: ruw.teksten || {},
    standen, rollen, categorieen, waarden,
  };
}

function laadConfig(root, opties) {
  let ruw = opties.config;
  if (!ruw) {
    const s = root.querySelector('script[data-rm-config]');
    if (s) {
      try { ruw = JSON.parse(s.textContent); } catch (e) { console.warn('rechtenmatrix: config is geen geldige JSON', e); }
    }
  }
  const cfg = normaliseer(ruw, opties.modus);
  if (!cfg) console.warn('rechtenmatrix: geen bruikbare config (2-4 standen, rollen en categorieën nodig) — overgeslagen');
  return cfg;
}

/**
 * HTML van de leesbare tabel (voor gebruik zonder JavaScript). Server-side
 * of in een bouwstap aanroepen met dezelfde config als `init()`, zodat tabel
 * en schakelaars uit één bron komen. Alle tekst wordt ge-escaped.
 * @param {object} config
 * @returns {string}
 */
export function tabelHtml(config) {
  const cfg = normaliseer(config);
  if (!cfg) return '';
  const t = cfg.teksten;
  const label = (id) => (cfg.standen.find((s) => s.id === id) || {}).label || '';
  const koppen = cfg.rollen.map((r) => `<th scope="col">${esc(r.naam)}${r.functie ? `<span>${esc(r.functie)}</span>` : ''}</th>`).join('');
  const groepen = cfg.categorieen.map((c) => {
    const rijen = c.handelingen.map((h) => `<tr><th scope="row">${esc(h.naam)}</th>${cfg.rollen.map((r) => {
      const id = cfg.waarden[r.id][h.id];
      return `<td data-i="${cfg.standen.findIndex((s) => s.id === id)}">${esc(label(id))}</td>`;
    }).join('')}</tr>`).join('');
    return `<tbody><tr class="rm-tabel__cat"><th scope="colgroup" colspan="${cfg.rollen.length + 1}">${esc(c.naam)}</th></tr>${rijen}</tbody>`;
  }).join('');
  return `<div class="rm-fallback" data-rm-fallback><table class="rm-tabel"><caption>${esc(t.tabelTitel || '')}</caption>`
    + `<thead><tr><th scope="col">${esc(t.kolomHandeling || '')}</th>${koppen}</tr></thead>${groepen}</table></div>`;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'rechtenmatrix')) return () => {};
  const cfg = laadConfig(root, opties);
  if (!cfg) return () => {};

  const doc = root.ownerDocument || document;
  const { standen, rollen, categorieen, waarden, teksten: t } = cfg;
  const bewerk = cfg.modus === 'bewerk';
  const n = standen.length;
  const uid = `rm${++teller}`;
  const opruim = [];
  let klaar = false;

  // ---- kleine bouwhulpen ------------------------------------------------
  const el = (tag, klasse, attrs, ...kinderen) => {
    const e = doc.createElement(tag);
    if (klasse) e.className = klasse;
    if (attrs) for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
    for (const k of kinderen) if (k !== undefined && k !== null) e.append(k);
    return e;
  };
  const icoon = (naam) => {
    const s = doc.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.setAttribute('class', 'rm-ico');
    s.innerHTML = ICONEN[naam] || ICONEN.check; // vaste, eigen strings — geen invoer
    return s;
  };
  const on = (doel, type, fn) => { doel.addEventListener(type, fn); opruim.push(() => doel.removeEventListener(type, fn)); };
  const avatar = (r) => {
    const a = el('span', 'rm-av', { 'aria-hidden': 'true' });
    if (r.tint) a.style.setProperty('--rm-tint', r.tint);
    if (r.foto) {
      const img = el('img', null, { src: r.foto, alt: '', loading: 'lazy', decoding: 'async' });
      a.append(img);
    } else if (r.icoon && ICONEN[r.icoon]) a.append(icoon(r.icoon));
    else a.append(String(r.initialen || Array.from(r.naam).slice(0, 2).join('')).toUpperCase());
    return a;
  };

  // ---- tellen ------------------------------------------------------------
  const tel = (rolId, hs) => {
    const c = standen.map(() => 0);
    for (const h of hs) c[standen.findIndex((s) => s.id === waarden[rolId][h.id])] += 1;
    return c;
  };
  const alleHandelingen = categorieen.flatMap((c) => c.handelingen);

  // ---- skelet ------------------------------------------------------------
  const app = el('div', 'rm-app', { 'data-modus': cfg.modus });
  standen.forEach((s, i) => { if (s.kleur) app.style.setProperty(`--rm-c${i}`, s.kleur); });
  app.style.setProperty('--rm-n', String(n));

  const kopId = `${uid}-lijstkop`;
  const paneelId = `${uid}-paneel`;
  const lijst = el('div', 'rm-lijst');
  lijst.append(el('p', 'rm-lijst__kop', { id: kopId }, t.lijstTitel || ''));
  const tablijst = el('div', 'rm-tabs', { role: 'tablist', 'aria-orientation': 'vertical', 'aria-labelledby': kopId });
  const tabs = rollen.map((r, i) => el('button', 'rm-tab', {
    type: 'button', role: 'tab', id: `${uid}-tab${i}`, 'aria-controls': paneelId, 'aria-selected': 'false', tabindex: '-1',
  }, avatar(r), el('span', 'rm-tab__tekst', null, el('span', 'rm-tab__naam', null, r.naam), r.functie ? el('span', 'rm-tab__functie', null, r.functie) : null)));
  tablijst.append(...tabs);
  lijst.append(tablijst);

  const paneel = el('section', 'rm-paneel', { role: 'tabpanel', id: paneelId });
  const kopAv = el('span', 'rm-paneel__av');
  const kopNaam = el('h3', 'rm-paneel__naam');
  const kopFunctie = el('p', 'rm-paneel__functie');
  const kopUitleg = el('p', 'rm-paneel__uitleg');
  const kop = el('header', 'rm-paneel__kop', null, kopAv, el('div', 'rm-paneel__titel', null, kopNaam, kopFunctie));
  if (!bewerk && t.alleenLezen) kop.append(el('span', 'rm-badge', null, icoon('slot'), t.alleenLezen));
  if (bewerk && t.bewerkbaar) kop.append(el('span', 'rm-badge rm-badge--bewerk', null, icoon('pen'), t.bewerkbaar));
  const samTekst = el('p', 'rm-sam__tekst');
  const bar = el('div', 'rm-bar', { 'aria-hidden': 'true' }, ...standen.map((s, i) => el('span', 'rm-bar__deel', { 'data-i': String(i) })));
  const sam = el('div', 'rm-sam', null, t.samenvattingTitel ? el('p', 'rm-sam__kop', null, t.samenvattingTitel) : null, samTekst, bar);

  const cats = el('div', 'rm-cats');
  const groepen = []; // { h, groep, opts }
  const catSam = [];  // { c, el }
  categorieen.forEach((c, ci) => {
    const lijstId = `${uid}-cat${ci}`;
    const open = !c.dicht;
    const cs = el('span', 'rm-cat__sam', { 'aria-hidden': 'true' });
    catSam.push({ c, el: cs });
    const knop = el('button', 'rm-cat__knop', { type: 'button', 'aria-expanded': String(open), 'aria-controls': lijstId },
      icoon('pijl'), el('span', 'rm-cat__naam', null, c.naam),
      el('span', 'rm-count', t.categorieAantal ? { 'aria-label': vul(t.categorieAantal, { n: c.handelingen.length }) } : null, String(c.handelingen.length)), cs);
    const rijen = el('div', 'rm-cat__lijst', { id: lijstId });
    if (!open) rijen.hidden = true;
    c.handelingen.forEach((h) => {
      const naamId = `${uid}-h-${ci}-${h.id}`;
      const groep = el('div', 'rm-keuze', { role: 'radiogroup', 'aria-readonly': bewerk ? null : 'true' });
      const thumb = el('span', 'rm-thumb', { 'aria-hidden': 'true' });
      const opts = standen.map((s) => el('button', 'rm-opt', { type: 'button', role: 'radio', 'aria-checked': 'false', tabindex: '-1', 'data-stand': s.id, title: s.label },
        icoon(s.icoon), el('span', 'rm-opt__tekst', null, s.label)));
      groep.append(thumb, ...opts);
      rijen.append(el('div', 'rm-rij', null,
        el('div', 'rm-rij__tekst', null, el('span', 'rm-rij__naam', { id: naamId }, h.naam), h.uitleg ? el('span', 'rm-rij__uitleg', null, h.uitleg) : null),
        groep));
      groepen.push({ h, groep, opts });
    });
    cats.append(el('section', 'rm-cat', null, el('h4', 'rm-cat__kop', null, knop), rijen));
  });

  paneel.append(kop, kopUitleg, sam, cats);
  const status = el('p', 'rm-sr', { role: 'status', 'aria-live': 'polite' });
  app.append(lijst, paneel, status);

  // ---- verborgen veld (alleen bewerkmodus) ---------------------------------
  let veld = null;
  let veldIsOnze = false;
  if (bewerk) {
    veld = root.querySelector('input[data-rm-veld]');
    if (!veld) {
      veld = el('input', null, { type: 'hidden', name: cfg.veldnaam, 'data-rm-veld': '' });
      veldIsOnze = true;
      app.append(veld);
    }
  }
  const json = () => JSON.stringify(waarden);
  const schrijfVeld = () => { if (veld) veld.value = json(); };

  // ---- renderen -----------------------------------------------------------
  let actief = 0;
  const rol = () => rollen[actief];

  function renderGroep(g) {
    const r = rol();
    const i = standen.findIndex((s) => s.id === waarden[r.id][g.h.id]);
    g.groep.style.setProperty('--rm-i', String(i));
    g.groep.dataset.i = String(i);
    g.groep.setAttribute('aria-label', vul(t.groepNaam || '{rol}: {handeling}', { rol: r.naam, handeling: g.h.naam }));
    g.opts.forEach((o, k) => { o.setAttribute('aria-checked', String(k === i)); o.tabIndex = k === i ? 0 : -1; });
  }

  function renderSamenvatting() {
    const r = rol();
    const c = tel(r.id, alleHandelingen);
    samTekst.replaceChildren();
    standen.forEach((s, i) => {
      if (i) samTekst.append(el('span', 'rm-sam__punt', { 'aria-hidden': 'true' }, ' · '));
      samTekst.append(el('span', 'rm-chip', { 'data-i': String(i) }, icoon(s.icoon), `${c[i]} ${s.kort}`));
    });
    bar.childNodes.forEach((d, i) => { d.style.flexGrow = String(c[i]); });
    for (const cs of catSam) {
      const cc = tel(r.id, cs.c.handelingen);
      cs.el.textContent = standen.map((s, i) => (cc[i] ? `${cc[i]} ${s.kort}` : '')).filter(Boolean).join(' · ');
    }
  }

  function kiesRol(i, { focus = false } = {}) {
    actief = i;
    const r = rol();
    app.classList.add('rm-zonder-overgang'); // thumbs springen bij rolwissel, ze glijden alleen bij een klik
    tabs.forEach((tb, k) => { tb.setAttribute('aria-selected', String(k === i)); tb.tabIndex = k === i ? 0 : -1; });
    paneel.setAttribute('aria-labelledby', tabs[i].id);
    kopAv.replaceChildren(avatar(r));
    kopNaam.textContent = r.naam;
    kopFunctie.textContent = r.functie || '';
    kopUitleg.textContent = r.uitleg || '';
    kopUitleg.hidden = !r.uitleg;
    groepen.forEach(renderGroep);
    renderSamenvatting();
    void app.offsetWidth;
    app.classList.remove('rm-zonder-overgang');
    if (focus) tabs[i].focus();
  }

  function kiesStand(g, k) {
    const r = rol();
    const stand = standen[k];
    if (waarden[r.id][g.h.id] === stand.id) return;
    waarden[r.id][g.h.id] = stand.id;
    renderGroep(g);
    renderSamenvatting();
    schrijfVeld();
    if (t.melding) status.textContent = vul(t.melding, { rol: r.naam, handeling: g.h.naam, stand: stand.label });
    root.dispatchEvent(new CustomEvent('rechtenmatrix:wijziging', {
      bubbles: true,
      detail: { rol: r.id, handeling: g.h.id, stand: stand.id, waarden: JSON.parse(json()), json: json() },
    }));
  }

  // ---- gedrag ---------------------------------------------------------------
  const PIJL = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  const naarIndex = (e, len, huidig) => {
    if (e.key in PIJL) return (huidig + PIJL[e.key] + len) % len;
    if (e.key === 'Home') return 0;
    if (e.key === 'End') return len - 1;
    return -1;
  };

  on(app, 'click', (e) => {
    const tb = e.target.closest('.rm-tab');
    if (tb && app.contains(tb)) return kiesRol(tabs.indexOf(tb));
    const kn = e.target.closest('.rm-cat__knop');
    if (kn && app.contains(kn)) {
      const open = kn.getAttribute('aria-expanded') !== 'true';
      kn.setAttribute('aria-expanded', String(open));
      doc.getElementById(kn.getAttribute('aria-controls')).hidden = !open;
      return;
    }
    const o = e.target.closest('.rm-opt');
    if (o && bewerk) {
      const g = groepen.find((x) => x.opts.includes(o));
      if (g) kiesStand(g, g.opts.indexOf(o));
    }
  });

  // Alleen lezen: een muisklik mag de focus niet naar een niet-gekozen radio verplaatsen.
  on(app, 'mousedown', (e) => { if (!bewerk && e.target.closest('.rm-opt')) e.preventDefault(); });

  on(app, 'keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tb = e.target.closest('.rm-tab');
    if (tb) {
      const k = naarIndex(e, tabs.length, tabs.indexOf(tb));
      if (k >= 0) { e.preventDefault(); kiesRol(k, { focus: true }); }
      return;
    }
    const o = e.target.closest('.rm-opt');
    if (!o || !bewerk) return; // alleen lezen: de pijltjes doen niets, Tab werkt gewoon
    const g = groepen.find((x) => x.opts.includes(o));
    if (!g) return;
    const nu = g.opts.indexOf(o);
    const k = naarIndex(e, n, nu);
    if (k >= 0) { e.preventDefault(); kiesStand(g, k); g.opts[k].focus(); return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); kiesStand(g, nu); }
  });

  // ---- aankoppelen -----------------------------------------------------------
  root.setAttribute('data-rm-actief', '');
  root.append(app);
  kiesRol(0);
  schrijfVeld();

  return function destroy() {
    if (klaar) return;
    klaar = true;
    opruim.forEach((f) => f());
    opruim.length = 0;
    if (veld && veldIsOnze) veld.remove();
    app.remove();
    root.removeAttribute('data-rm-actief');
  };
}
