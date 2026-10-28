/**
 * impact-scan
 * ------------------------------------------------------------------------
 * Een korte scan (maximaal 12 vragen) in een dialoog, optioneel in een telefoonframe.
 * Per stap: voortgang in tijd ("Nog 3 vragen · ongeveer 60 seconden"),
 * enkele of meervoudige keuze (met maximum), een getal-keuze met rekenregel
 * en een vrij invulveld bij "Anders, namelijk…". Na de laatste vraag een kort
 * laadmoment en een persoonlijke uitslag: kop, intro, mogelijke richting,
 * ideeën als chips en een passende case. Daarna een knop naar het
 * aanvraagformulier, vooringevuld met een samenvatting van de antwoorden.
 *
 * Alle teksten, vragen, cases en rekenzinnen komen uit één config-object
 * (zie `configs/tuinscan.json` en de README). In de code staat geen enkele
 * zichtbare tekst.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan binnen `init()`.
 *
 * Herkomst: idee en getallen (vijf vragen, "nog N vragen · ongeveer X
 * seconden", drie laadregels, uitslag met case bij het eerste gekozen doel,
 * maximum van twee doelen) gezien bij een bureausite.
 * Eigen implementatie, geen code
 * overgenomen. Nieuw t.o.v. het origineel: een eerlijke optie onder het
 * minimumbudget met een eigen uitslagregel, `impact-scan:klaar`-event,
 * terug-knop met behoud van antwoorden, focus-trap en een tekstloze motor.
 *
 * @typedef {Object} ScanOptie
 * @property {string} id
 * @property {string} label
 * @property {string} [richting]     Regel in "mogelijke richting" als dit gekozen is.
 * @property {string[]} [ideeen]     Chips voor de uitslag.
 * @property {string} [kop]          Woord voor {doelen}/{doel} in kop en intro (alleen op de bronvraag).
 * @property {string} [kort]         Woord voor {focus} (alleen op de bronvraag).
 * @property {string} [vrij]         Placeholder van het invulveld; maakt dit een "Anders, namelijk…"-optie.
 * @property {string} [uitslagRegel] Extra notitie in de uitslag (bv. eerlijke doorverwijzing onder het minimumbudget).
 * @property {number} [waarde]       Bij type "getal": het getal waarmee de rekenregel rekent (0 = onbekend, geen rekenregel).
 * @property {{merk:string,bewijs?:string,regel?:string,poster?:string,kleur?:string}} [case]
 *
 * @typedef {Object} ScanVraag
 * @property {string} id
 * @property {'enkel'|'meer'|'getal'} type
 * @property {string} vraag
 * @property {string} [hint]
 * @property {string} [samenvattingLabel]
 * @property {number} [max]          Bij "meer": maximum aantal keuzes.
 * @property {number} [min]          Bij "meer": minimum (standaard 1).
 * @property {string} [rekenregel]   Bij "getal": sjabloon met {waarde} en {totaal}.
 * @property {number} [factor]       Bij "getal": totaal = waarde × factor.
 * @property {string} [richting]     Bij "getal": sjabloon voor de richtingregel ({waarde}, {totaal}).
 * @property {string} [richtingOnbekend] Bij "getal": regel als waarde 0 is.
 * @property {ScanOptie[]} opties
 *
 * @typedef {Object} ScanConfig
 * @property {string} id
 * @property {string} titel                Toegankelijke naam van de dialoog.
 * @property {number} [secPerVraag=20]     Voor "ongeveer X seconden".
 * @property {Object<string, string|string[]>} teksten
 * @property {ScanVraag[]} vragen
 * @property {Object} uitslag              {bronVraag, eyebrow, kop, intro, richtingFocus, verbinder, maxIdeeen, extra[]}
 * @property {{href?: string}} [cta]
 *
 * @typedef {Object} ImpactScanOptions
 * @property {boolean} [telefoon=false]    Dialoog in een telefoonframe (valt weg op smalle schermen).
 * @property {Element|string} [formulier]  Formulier dat bij "Vraag aan" wordt ingevuld: veld [data-impact-scan-samenvatting] (tekst) en [data-impact-scan-antwoorden] (JSON).
 * @property {string} [opener='[data-impact-scan-open]'] Selector voor de openers binnen root.
 * @property {number} [laadMs=600]         Duur per laadregel.
 * @property {(detail: any) => void} [onKlaar] Aangeroepen bij "Vraag aan", naast het event `impact-scan:klaar`.
 *
 * @module impact-scan
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

const FOCUSBAAR = 'a[href],button:not([disabled]),input:not([disabled]):not([hidden]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
let teller = 0;

/** {sleutel} in een sjabloon vervangen; onbekende sleutels worden leeg. */
function vul(sjabloon, waarden) {
  return String(sjabloon == null ? '' : sjabloon).replace(/\{(\w+)\}/g, (_, k) => (waarden[k] == null ? '' : String(waarden[k])));
}

function valideer(c) {
  if (!c || typeof c !== 'object') return 'config ontbreekt';
  if (!c.id || !c.titel) return 'config mist id/titel';
  if (!c.teksten || typeof c.teksten !== 'object') return 'config mist teksten';
  if (!Array.isArray(c.vragen) || c.vragen.length < 1 || c.vragen.length > 12) return 'config.vragen moet 1-12 vragen bevatten';
  for (const v of c.vragen) {
    if (!v || !v.id || !v.vraag || !Array.isArray(v.opties) || !v.opties.length) return `vraag ${v && v.id} is onvolledig`;
  }
  if (c.score) {
    if (!Array.isArray(c.score.banden) || !c.score.banden.length || c.score.banden.some((b) => typeof b.van !== 'number' || !b.kop)) return 'config.score.banden moet banden met van en kop bevatten';
  } else if (!c.uitslag || !c.vragen.some((v) => v.id === c.uitslag.bronVraag)) return 'config.uitslag.bronVraag wijst naar geen vraag';
  if (c.uitslag && c.uitslag.bronVraag && !c.vragen.some((v) => v.id === c.uitslag.bronVraag)) return 'config.uitslag.bronVraag wijst naar geen vraag';
  return '';
}

/**
 * @param {Element} root  Element met daarin de opener(s); de dialoog komt er als laatste kind in.
 * @param {ScanConfig} config
 * @param {ImpactScanOptions} [options]
 * @returns {() => void} destroy (idempotent)
 */
export function init(root, config, options = {}) {
  if (!vereisRoot(root, 'impact-scan')) return () => {};
  const fout = valideer(config);
  if (fout) { console.warn(`impact-scan: ${fout} — overgeslagen`); return () => {}; }
  if (root.hasAttribute('data-isc-init')) { console.warn('impact-scan: root is al geïnitialiseerd — overgeslagen'); return () => {}; }

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!win) return () => {};
  const html = doc.documentElement;
  const uid = `isc${++teller}`;
  const T = config.teksten;
  const vragen = config.vragen;
  const N = vragen.length;
  const U = config.uitslag || {};
  const SC = config.score || null;
  const bronId = U.bronVraag;
  const openerSel = options.opener || '[data-impact-scan-open]';
  const laadMs = options.laadMs ?? 600;
  const secPer = config.secPerVraag ?? 20;

  const t = (k) => {
    if (T[k] == null) { console.warn(`impact-scan: tekst "${k}" ontbreekt in config.teksten`); return ''; }
    return T[k];
  };
  const el = (tag, klasse, tekst, attrs) => {
    const e = doc.createElement(tag);
    if (klasse) e.className = klasse;
    if (tekst != null) e.textContent = tekst;
    if (attrs) for (const k of Object.keys(attrs)) e.setAttribute(k, attrs[k]);
    return e;
  };

  // ---- staat -------------------------------------------------------------
  let destroyed = false;
  let fase = 'vraag'; // 'vraag' | 'laden' | 'uitslag'
  let stap = 0;
  let uitslag = null;
  let klaarGedaan = false; // korte vergrendeling tijdens het afhandelen van "Vraag aan" (tot de dialoog sluit)
  let laatsteSamenvatting = '';
  let opener = null;
  let isOpen = false;
  const gekozen = {}; // vraagId -> [optieId] in aanklikvolgorde
  const vrij = {};    // vraagId -> tekst bij een "Anders"-optie
  const timers = new Set();
  let rafId = 0;
  const later = (fn, ms) => { const id = win.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

  let reduced = false;
  const mb = minderBeweging((r) => { reduced = r; if (r && fase === 'laden') naarUitslag(); }, doc);
  reduced = mb.reduced;

  const vraagVan = (id) => vragen.find((v) => v.id === id);
  const optieVan = (v, id) => v.opties.find((o) => o.id === id);
  const gekozenOpties = (v) => (gekozen[v.id] || []).map((id) => optieVan(v, id)).filter(Boolean);

  // ---- skelet ------------------------------------------------------------
  const dialog = el('dialog', `isc${options.telefoon ? ' isc--telefoon' : ''}`, null, { 'aria-labelledby': `${uid}-titel` });
  const frame = el('div', 'isc__frame');
  frame.appendChild(el('div', 'isc__notch', null, { 'aria-hidden': 'true' }));
  const scherm = el('div', 'isc__scherm');
  const kop = el('div', 'isc__kop');
  const segs = el('div', 'isc__segs', null, { 'aria-hidden': 'true' });
  for (let i = 0; i < N; i += 1) segs.appendChild(el('i', 'isc__seg'));
  const metaRij = el('div', 'isc__metarij');
  const meta = el('p', 'isc__meta');
  const sluitKnop = el('button', 'isc__sluit', null, { type: 'button', 'aria-label': t('sluiten') });
  sluitKnop.appendChild(el('span', 'isc__kruis', null, { 'aria-hidden': 'true' }));
  metaRij.append(meta, sluitKnop);
  kop.append(segs, metaRij);
  const titel = el('h2', 'isc__sr', config.titel, { id: `${uid}-titel` });
  const body = el('div', 'isc__body');
  const nav = el('div', 'isc__nav');
  const terugKnop = el('button', 'isc__knop isc__knop--terug', t('terug'), { type: 'button' });
  const volgendeKnop = el('button', 'isc__knop isc__knop--hoofd', t('volgende'), { type: 'button' });
  nav.append(terugKnop, volgendeKnop);
  const live = el('p', 'isc__sr isc__live', null, { 'aria-live': 'polite', 'aria-atomic': 'true' });
  scherm.append(kop, titel, body, nav, live);
  frame.appendChild(scherm);
  dialog.appendChild(frame);
  root.appendChild(dialog);
  root.setAttribute('data-isc-init', '');

  const openers = Array.from(root.querySelectorAll(openerSel));
  openers.forEach((o) => o.setAttribute('aria-haspopup', 'dialog'));

  // ---- logica ------------------------------------------------------------
  function geldig(v) {
    const g = gekozen[v.id] || [];
    if (!g.length) return false;
    if (v.type === 'meer') {
      if (g.length < (v.min || 1)) return false;
      if (v.max && g.length > v.max) return false;
    }
    if (gekozenOpties(v).some((o) => o.vrij) && !(vrij[v.id] || '').trim()) return false;
    return true;
  }

  /** Wat de bezoeker bij "Anders, namelijk…" typte; een hoofdletter vooraan gaat eraf (behalve bij een afkorting). */
  function vrijWaarde(v) {
    let s = String(vrij[v.id] || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (/^[A-Z][a-z]/.test(s)) s = s.charAt(0).toLowerCase() + s.slice(1);
    return s;
  }
  function antwoordLabel(v, o) {
    return o.vrij ? `${String(o.label).split(/[,:…]/)[0].trim()}: ${vrijWaarde(v)}` : o.label;
  }

  const getal = (x) => String(Math.round(x * 100) / 100).replace('.', ',');

  /** Scoremodus: som van punten × gewicht, de band waar de score in valt en de zwaarste adviezen. */
  function berekenScore() {
    let score = 0;
    let max = 0;
    const adviezen = [];
    vragen.forEach((v, idx) => {
      if (!v.opties.some((o) => typeof o.punten === 'number')) return;
      const w = v.gewicht ?? 1;
      const p = (o) => o.punten || 0;
      const maxQ = v.type === 'meer' ? v.opties.reduce((a, o) => a + Math.max(p(o), 0), 0) : Math.max(...v.opties.map(p));
      const kreeg = gekozenOpties(v).reduce((a, o) => a + p(o), 0);
      score += kreeg * w;
      max += maxQ * w;
      if (v.advies && kreeg < maxQ) adviezen.push({ vraagId: v.id, tekst: v.advies, verlies: (maxQ - kreeg) * w, idx });
    });
    score = Math.round(score * 100) / 100;
    adviezen.sort((a, b) => b.verlies - a.verlies || a.idx - b.idx);
    const banden = [...SC.banden].sort((a, b) => a.van - b.van);
    let band = banden[0];
    banden.forEach((b) => { if (score >= b.van) band = b; });
    const percentage = max ? Math.round((score / max) * 100) : 0;
    const w = { score: getal(score), max: getal(max), percentage };
    const totaalTekst = SC.weergave === 'percentage' ? vul(SC.percentage, w) : vul(SC.totaal, w);
    return {
      score, max, percentage, totaalTekst, band,
      metUitslag: !!SC.metUitslag,
      adviezen: adviezen.slice(0, SC.maxAdviezen ?? 3).map((a) => ({ vraagId: a.vraagId, tekst: a.tekst })),
    };
  }

  function bouwUitslag() {
    const bron = vraagVan(bronId);
    const gekOpties = bron ? gekozenOpties(bron) : [];
    // Een optie zonder kop/kort valt niet terug op haar label ("Iets anders" midden in een zin): dan blijft het woord leeg,
    // vervalt de zin (zie kopZonder/introZonder) en waarschuwt de console.
    const gebruikt = (re) => [U.kop, U.intro, U.richtingFocus].some((x) => re.test(x || ''));
    const woord = (o, veld) => {
      const typed = o.vrij && bron ? vrijWaarde(bron) : '';
      if (typed || o[veld]) return typed || o[veld];
      if (gebruikt(veld === 'kop' ? /\{doelen?\}/ : /\{focus\}/)) console.warn(`impact-scan: optie "${o.id}" heeft geen "${veld}" en komt in een sjabloon terecht — zin weggelaten`);
      return '';
    };
    const koppen = gekOpties.map((o) => woord(o, 'kop')).filter(Boolean);
    const korts = gekOpties.map((o) => woord(o, 'kort')).filter(Boolean);
    const waarden = {};
    for (const v of vragen) waarden[v.id] = gekozenOpties(v).map((o) => antwoordLabel(v, o)).join(', ');
    Object.assign(waarden, {
      doel: koppen[0] || '',
      doelen: koppen.join(U.verbinder || ', '),
      focus: korts.join(' + '),
      n: N,
    });

    const richting = [];
    const noten = [];
    const ideeen = [];
    const voegToe = (lijst, x) => { if (x && !lijst.includes(x)) lijst.push(x); };
    for (const v of vragen) {
      const opties = gekozenOpties(v);
      if (v.id === bronId) {
        if (korts.length && U.richtingFocus) voegToe(richting, vul(U.richtingFocus, waarden));
      } else if (v.type === 'getal') {
        const o = opties[0];
        if (o && o.waarde > 0 && v.richting) voegToe(richting, vul(v.richting, { waarde: o.waarde, totaal: o.waarde * (v.factor || 1) }));
        else if (o && v.richtingOnbekend) voegToe(richting, v.richtingOnbekend);
      } else {
        opties.forEach((o) => voegToe(richting, o.richting));
      }
      opties.forEach((o) => {
        (o.ideeen || []).forEach((i) => voegToe(ideeen, i));
        voegToe(noten, o.uitslagRegel);
      });
    }
    for (const x of U.extra || []) {
      const klopt = Object.keys(x.als || {}).every((vid) => {
        const wil = [].concat(x.als[vid]);
        return (gekozen[vid] || []).some((id) => wil.includes(id));
      });
      if (klopt) voegToe(noten, x.tekst);
    }
    const metCase = gekOpties.find((o) => o.case && o.case.merk);
    const sc = SC ? berekenScore() : null;
    const alleen = !!sc && !sc.metUitslag; // scoremodus zonder case, ideeën en richting
    return {
      kop: alleen || !U.kop ? (sc ? sc.band.kop : '') : (koppen.length || !/\{doelen?\}/.test(U.kop) ? vul(U.kop, waarden) : (U.kopZonder || (sc ? sc.band.kop : U.eyebrow) || '')),
      intro: alleen ? sc.band.tekst || '' : (koppen.length || !/\{doelen?\}/.test(U.intro || '') ? vul(U.intro, waarden) : (U.introZonder || '')),
      richting: alleen ? [] : richting,
      ideeen: alleen ? [] : ideeen.slice(0, U.maxIdeeen ?? 4),
      noten: alleen ? [] : noten,
      case: !alleen && metCase ? metCase.case : null,
      score: sc,
      waarden,
    };
  }

  function antwoordenLijst() {
    return vragen.map((v) => ({
      vraagId: v.id,
      vraag: v.vraag,
      antwoorden: gekozenOpties(v).map((o) => ({ id: o.id, label: antwoordLabel(v, o) })),
    }));
  }
  function samenvatting() {
    const regels = vragen.map((v) => `${v.samenvattingLabel || v.vraag}: ${gekozenOpties(v).map((o) => antwoordLabel(v, o)).join(', ')}`);
    if (uitslag && uitslag.case && T.samenvattingCase) regels.push(vul(T.samenvattingCase, { merk: uitslag.case.merk }));
    const sc = uitslag && uitslag.score;
    if (sc) {
      regels.push(vul(t('samenvattingScore'), { totaal: sc.totaalTekst }), vul(t('samenvattingBand'), { kop: sc.band.kop }));
      if (sc.adviezen.length) regels.push(t('samenvattingAdvies'), ...sc.adviezen.map((a) => `- ${a.tekst}`));
    }
    return regels.join('\n');
  }

  // ---- weergave ----------------------------------------------------------
  function zetMeta() {
    let tekst = '';
    let filled = N;
    if (fase === 'vraag') {
      const rest = N - stap;
      tekst = vul(rest === 1 ? t('voortgangEen') : t('voortgang'), { n: rest, seconden: rest * secPer });
      filled = stap + 1;
    } else if (fase === 'laden') tekst = t('metaLaden');
    else tekst = vul(t('metaUitslag'), { n: N });
    meta.textContent = tekst;
    Array.from(segs.children).forEach((s, i) => s.classList.toggle('is-vol', i < filled));
    return tekst;
  }

  function toon(focusDoel = true) {
    const metaTekst = zetMeta();
    body.scrollTop = 0;
    let kopEl;
    if (fase === 'vraag') kopEl = renderVraag(vragen[stap]);
    else if (fase === 'laden') kopEl = renderLaden();
    else kopEl = renderUitslag();
    nav.hidden = fase === 'laden';
    live.textContent = fase === 'vraag' ? `${vul(t('stapLive'), { nu: stap + 1, totaal: N })} ${metaTekst}` : (fase === 'uitslag' ? t('uitslagLive') : '');
    if (focusDoel && isOpen && kopEl) kopEl.focus({ preventScroll: true });
    bijwerken();
  }

  function renderVraag(v) {
    const stapEl = el('div', 'isc__stap');
    const h = el('h2', 'isc__vraag', v.vraag, { id: `${uid}-q`, tabindex: '-1' });
    stapEl.appendChild(h);
    if (v.hint) stapEl.appendChild(el('p', 'isc__hint', v.hint, { id: `${uid}-hint` }));
    const fs = el('fieldset', `isc__opties isc__opties--${v.type}`, null, { 'aria-labelledby': `${uid}-q` });
    if (v.hint) fs.setAttribute('aria-describedby', `${uid}-hint`);
    v.opties.forEach((o, n) => {
      const lab = el('label', 'isc__optie');
      lab.style.setProperty('--i', String(Math.min(n, 8)));
      const inp = el('input', 'isc__input', null, { type: v.type === 'meer' ? 'checkbox' : 'radio', name: `${uid}-${v.id}`, value: o.id });
      inp.checked = (gekozen[v.id] || []).includes(o.id);
      const kaart = el('span', 'isc__kaart');
      kaart.append(el('span', 'isc__tekst', o.label), el('span', 'isc__vink', null, { 'aria-hidden': 'true' }));
      lab.append(inp, kaart);
      fs.appendChild(lab);
    });
    stapEl.appendChild(fs);
    if (v.opties.some((o) => o.vrij)) {
      const vo = v.opties.find((o) => o.vrij);
      const inp = el('input', 'isc__vrij', null, { type: 'text', maxlength: '80', 'aria-label': vo.vrij, placeholder: vo.vrij, autocomplete: 'off' });
      inp.value = vrij[v.id] || '';
      inp.hidden = true;
      stapEl.appendChild(inp);
    }
    if (v.type === 'meer' && v.max) stapEl.appendChild(el('p', 'isc__teller', null, { 'aria-live': 'polite' }));
    if (v.type === 'getal' && v.rekenregel) stapEl.appendChild(el('p', 'isc__reken', null, { 'aria-live': 'polite' }));
    body.replaceChildren(stapEl);
    return h;
  }

  /** Alles wat van de keuzes afhangt: uitgeschakelde opties, invulveld, tellers, rekenregel en de Volgende-knop. */
  function bijwerken() {
    if (fase === 'vraag') {
      const v = vragen[stap];
      const g = gekozen[v.id] || [];
      const opties = gekozenOpties(v);
      body.querySelectorAll('.isc__input').forEach((i) => {
        i.disabled = v.type === 'meer' && !!v.max && g.length >= v.max && !i.checked;
        i.closest('.isc__optie').classList.toggle('is-uit', i.disabled);
      });
      const vr = body.querySelector('.isc__vrij');
      if (vr) vr.hidden = !opties.some((o) => o.vrij);
      const tel = body.querySelector('.isc__teller');
      if (tel) tel.textContent = g.length ? vul(g.length >= v.max ? t('maxBereikt') : t('gekozen'), { n: g.length, max: v.max }) : '';
      const rek = body.querySelector('.isc__reken');
      if (rek) {
        const o = opties[0];
        rek.textContent = o && o.waarde > 0 ? vul(v.rekenregel, { waarde: o.waarde, totaal: o.waarde * (v.factor || 1) }) : '';
      }
      volgendeKnop.textContent = stap === N - 1 ? t('laatste') : t('volgende');
      volgendeKnop.disabled = !geldig(v);
      terugKnop.hidden = stap === 0;
    } else if (fase === 'uitslag') {
      volgendeKnop.textContent = t('cta');
      volgendeKnop.disabled = false;
      terugKnop.hidden = false;
    }
  }

  function renderLaden() {
    const regels = [].concat(T.laden || []);
    const wrap = el('div', 'isc__laden', null, { 'data-isc-laden': '' });
    const status = el('p', 'isc__status', regels[0] || '', { role: 'status', tabindex: '-1' });
    const balk = el('div', 'isc__balk', null, { 'aria-hidden': 'true' });
    const vulling = el('i', 'isc__balkvul');
    vulling.style.transitionDuration = `${laadMs * Math.max(regels.length, 1)}ms`;
    balk.appendChild(vulling);
    wrap.append(status, balk);
    body.replaceChildren(wrap);
    rafId = win.requestAnimationFrame(() => { rafId = 0; vulling.classList.add('is-vol'); });
    regels.forEach((r, i) => {
      if (i === 0) return;
      later(() => { status.textContent = r; }, laadMs * i);
    });
    later(naarUitslag, laadMs * Math.max(regels.length, 1));
    return status;
  }

  function scoreBlokken(wrap, sc, hoofdKop) {
    const blok = el('section', 'isc__blok isc__score', null, { 'data-isc-score': '' });
    blok.appendChild(el('h3', 'isc__blokkop', t('scoreKop')));
    blok.appendChild(el('p', 'isc__scoretal', sc.totaalTekst, { 'data-isc-scoretal': '' }));
    if (SC.meter !== false) {
      const meter = el('div', 'isc__meter', null, {
        role: 'meter', 'aria-label': t('meterLabel'), 'aria-valuemin': '0', 'aria-valuemax': String(sc.max), 'aria-valuenow': String(sc.score),
        'aria-valuetext': `${sc.totaalTekst}: ${sc.band.kop}`, 'data-isc-meter': '',
      });
      const vul_ = el('i', 'isc__metervul');
      vul_.style.setProperty('--isc-pct', String(sc.max ? sc.score / sc.max : 0));
      meter.appendChild(vul_);
      SC.banden.forEach((b) => { if (b.van > 0 && sc.max) { const tik = el('i', 'isc__tik', null, { 'aria-hidden': 'true' }); tik.style.left = `${(b.van / sc.max) * 100}%`; meter.appendChild(tik); } });
      blok.appendChild(meter);
    }
    if (sc.band.kop !== hoofdKop) blok.appendChild(el('p', 'isc__bandkop', sc.band.kop, { 'data-isc-band': '' }));
    if (sc.band.kop !== hoofdKop && sc.band.tekst) blok.appendChild(el('p', 'isc__casetekst', sc.band.tekst));
    wrap.appendChild(blok);
    if (sc.adviezen.length) {
      const adv = el('section', 'isc__blok', null, { 'data-isc-blok': 'advies' });
      adv.appendChild(el('h3', 'isc__blokkop', t('adviesKop')));
      const ol = el('ol', 'isc__advies');
      sc.adviezen.forEach((a) => ol.appendChild(el('li', 'isc__adviesregel', a.tekst)));
      adv.appendChild(ol);
      wrap.appendChild(adv);
    }
  }

  function renderUitslag() {
    const u = uitslag;
    const wrap = el('div', 'isc__stap isc__uitslag');
    if (U.eyebrow) wrap.appendChild(el('p', 'isc__eyebrow', U.eyebrow));
    const h = el('h2', 'isc__vraag isc__vraag--groot', u.kop, { tabindex: '-1', 'data-isc-uitslag-kop': '' });
    wrap.appendChild(h);
    if (u.intro) wrap.appendChild(el('p', 'isc__intro', u.intro));
    if (u.score) scoreBlokken(wrap, u.score, u.kop);

    if (u.richting.length) {
      const blok = el('section', 'isc__blok', null, { 'data-isc-blok': 'richting' });
      blok.appendChild(el('h3', 'isc__blokkop', t('richtingKop')));
      const ul = el('ul', 'isc__lijst');
      u.richting.forEach((r) => ul.appendChild(el('li', 'isc__regel', r)));
      blok.appendChild(ul);
      wrap.appendChild(blok);
    }
    if (u.ideeen.length) {
      const blok = el('section', 'isc__blok', null, { 'data-isc-blok': 'ideeen' });
      blok.appendChild(el('h3', 'isc__blokkop', t('ideeenKop')));
      const ul = el('ul', 'isc__chips');
      u.ideeen.forEach((i) => ul.appendChild(el('li', 'isc__chip', i)));
      blok.appendChild(ul);
      wrap.appendChild(blok);
    }
    u.noten.forEach((n) => {
      const p = el('p', 'isc__noot', null, { 'data-isc-noot': '' });
      const i = n.indexOf(':');
      if (i > 0 && i < 40) { p.append(el('strong', null, n.slice(0, i + 1)), doc.createTextNode(n.slice(i + 1))); } else p.textContent = n;
      wrap.appendChild(p);
    });
    if (u.case) {
      const c = u.case;
      const blok = el('section', 'isc__blok', null, { 'data-isc-blok': 'case' });
      blok.appendChild(el('h3', 'isc__blokkop', t('caseKop')));
      const fig = el('figure', 'isc__case');
      if (c.poster) {
        fig.appendChild(el('img', 'isc__poster', null, { src: c.poster, alt: vul(T.posterAlt, { merk: c.merk }), loading: 'lazy', width: '800', height: '500' }));
      } else {
        const ph = el('div', 'isc__poster isc__poster--leeg', c.merk, { 'aria-hidden': 'true' });
        if (c.kleur) ph.style.background = c.kleur;
        fig.appendChild(ph);
      }
      const cap = el('figcaption', 'isc__caption');
      cap.appendChild(el('span', 'isc__merk', c.merk));
      if (c.bewijs) cap.appendChild(el('strong', 'isc__bewijs', c.bewijs));
      if (c.regel) cap.appendChild(el('span', 'isc__casetekst', c.regel));
      fig.appendChild(cap);
      blok.appendChild(fig);
      wrap.appendChild(blok);
    }
    wrap.appendChild(el('button', 'isc__opnieuw', t('opnieuw'), { type: 'button', 'data-isc-opnieuw': '' }));
    body.replaceChildren(wrap);
    return h;
  }

  function naarUitslag() {
    timers.forEach((id) => win.clearTimeout(id));
    timers.clear();
    fase = 'uitslag';
    uitslag = bouwUitslag();
    if (isOpen) toon();
  }

  function laden() {
    fase = 'laden';
    if (reduced || ![].concat(T.laden || []).length) { naarUitslag(); return; }
    toon();
  }

  function reset() {
    Object.keys(gekozen).forEach((k) => delete gekozen[k]);
    Object.keys(vrij).forEach((k) => delete vrij[k]);
    fase = 'vraag'; stap = 0; uitslag = null; klaarGedaan = false;
    toon();
  }

  // ---- open / sluit ------------------------------------------------------
  function open(van) {
    if (destroyed || isOpen) return;
    opener = van || doc.activeElement;
    isOpen = true;
    klaarGedaan = false;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    html.classList.add('isc-lock');
    toon();
    if (reduced) dialog.setAttribute('data-isc-open', '');
    else rafId = win.requestAnimationFrame(() => { rafId = 0; dialog.setAttribute('data-isc-open', ''); });
  }

  function afronden(daarna) {
    if (!isOpen) return;
    isOpen = false;
    klaarGedaan = false;
    timers.forEach((id) => win.clearTimeout(id));
    timers.clear();
    if (rafId) { win.cancelAnimationFrame(rafId); rafId = 0; }
    if (fase === 'laden') { fase = 'vraag'; stap = N - 1; }
    dialog.removeAttribute('data-isc-open');
    if (dialog.open) dialog.close();
    html.classList.remove('isc-lock');
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
    if (daarna) daarna();
  }

  function sluit(daarna) {
    if (!isOpen) return;
    if (reduced) { afronden(daarna); return; }
    dialog.removeAttribute('data-isc-open');
    later(() => afronden(daarna), 170);
  }

  // ---- afronden richting het formulier ------------------------------------
  function klaar() {
    if (klaarGedaan) return;
    klaarGedaan = true;
    const formEl = typeof options.formulier === 'string' ? doc.querySelector(options.formulier) : options.formulier;
    const detail = { configId: config.id, antwoorden: antwoordenLijst(), samenvatting: samenvatting(), uitslag: { kop: uitslag.kop, intro: uitslag.intro, richting: uitslag.richting, ideeen: uitslag.ideeen, noten: uitslag.noten, case: uitslag.case } };
    if (uitslag.score) {
      const sc = uitslag.score;
      detail.score = { score: sc.score, max: sc.max, percentage: sc.percentage, totaal: sc.totaalTekst, band: { kop: sc.band.kop, tekst: sc.band.tekst || '', van: sc.band.van }, adviezen: sc.adviezen };
    }
    if (formEl) {
      const s = formEl.querySelector('[data-impact-scan-samenvatting]');
      const a = formEl.querySelector('[data-impact-scan-antwoorden]');
      // Eigen tekst van de bezoeker blijft staan: alleen aanvullen, of onze eerdere invulling vervangen.
      if (s) {
        const nu = s.value.trim();
        s.value = !nu || nu === laatsteSamenvatting ? detail.samenvatting : (laatsteSamenvatting && s.value.includes(laatsteSamenvatting)) ? s.value.replace(laatsteSamenvatting, detail.samenvatting) : `${s.value.replace(/\s+$/, '')}\n\n${detail.samenvatting}`;
        laatsteSamenvatting = detail.samenvatting;
      }
      if (a) a.value = JSON.stringify(detail.antwoorden);
    }
    const ev = new win.CustomEvent('impact-scan:klaar', { bubbles: true, cancelable: true, detail });
    const doorgaan = root.dispatchEvent(ev);
    if (typeof options.onKlaar === 'function') options.onKlaar(detail);
    const href = (config.cta && config.cta.href) || (opener && opener.getAttribute && opener.getAttribute('href'));
    sluit(() => {
      if (formEl) {
        formEl.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
        const eerste = formEl.querySelector('input:not([type=hidden]),textarea,select');
        if (eerste) eerste.focus({ preventScroll: true });
      } else if (doorgaan && href) {
        win.location.assign(`${href}${href.includes('?') ? '&' : '?'}scan=${encodeURIComponent(detail.samenvatting).slice(0, 900)}`);
      }
    });
  }

  // ---- events ------------------------------------------------------------
  const onRootKlik = (e) => {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest(openerSel);
    if (!a || !root.contains(a) || dialog.contains(a)) return;
    e.preventDefault();
    open(a);
  };
  root.addEventListener('click', onRootKlik);

  const onChange = (e) => {
    const inp = e.target;
    if (fase !== 'vraag' || !inp.classList.contains('isc__input')) return;
    const v = vragen[stap];
    if (v.type === 'meer') {
      const g = (gekozen[v.id] || []).filter((id) => id !== inp.value);
      if (inp.checked) g.push(inp.value);
      gekozen[v.id] = g;
    } else gekozen[v.id] = [inp.value];
    bijwerken();
  };
  const onInput = (e) => {
    if (fase !== 'vraag' || !e.target.classList.contains('isc__vrij')) return;
    vrij[vragen[stap].id] = e.target.value;
    bijwerken();
  };
  const onKeyBody = (e) => {
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('isc__vrij')) {
      e.preventDefault();
      if (!volgendeKnop.disabled) volgendeKnop.click();
    }
  };
  body.addEventListener('change', onChange);
  body.addEventListener('input', onInput);
  body.addEventListener('keydown', onKeyBody);

  const onBodyKlik = (e) => {
    if (e.target.closest && e.target.closest('[data-isc-opnieuw]')) reset();
  };
  body.addEventListener('click', onBodyKlik);

  terugKnop.addEventListener('click', () => {
    if (fase === 'uitslag') { fase = 'vraag'; stap = N - 1; klaarGedaan = false; toon(); } else if (stap > 0) { stap -= 1; toon(); }
  });
  volgendeKnop.addEventListener('click', () => {
    if (fase === 'uitslag') { klaar(); return; }
    if (fase !== 'vraag' || !geldig(vragen[stap])) return;
    if (stap < N - 1) { stap += 1; toon(); } else laden();
  });
  sluitKnop.addEventListener('click', () => sluit());

  const onToets = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); sluit(); return; }
    if (e.key !== 'Tab') return;
    // Een radiogroep is één tabstop (het aangevinkte, anders het eerste/laatste radio): meet de echte tabvolgorde.
    const alle = Array.from(dialog.querySelectorAll(FOCUSBAAR)).filter((x) => x.offsetParent !== null);
    const groepKey = (x) => (x.type === 'radio' && x.name ? `r:${x.name}` : null);
    const stops = alle.filter((x) => {
      const k = groepKey(x);
      if (!k) return true;
      const groep = alle.filter((y) => groepKey(y) === k);
      const aangevinkt = groep.find((y) => y.checked);
      return aangevinkt ? x === aangevinkt : x === groep[0];
    });
    if (!stops.length) { e.preventDefault(); return; }
    const eerste = stops[0];
    const laatste = stops[stops.length - 1];
    const actief = doc.activeElement;
    const isStop = (stop) => actief === stop || (groepKey(stop) && groepKey(actief) === groepKey(stop));
    if (e.shiftKey && (isStop(eerste) || !dialog.contains(actief))) { e.preventDefault(); laatste.focus(); }
    else if (!e.shiftKey && (isStop(laatste) || !dialog.contains(actief))) { e.preventDefault(); eerste.focus(); }
  };
  dialog.addEventListener('keydown', onToets);
  // Safari zet :focus-visible niet aan als een pijltoets de focus binnen een radiogroep verplaatst
  // (gemeten 29-09 in WebKit); daarom onthoudt de dialoog zelf dat het toetsenbord het laatst gebruikt is.
  dialog.addEventListener('keydown', () => dialog.setAttribute('data-isc-toets', ''), true);
  dialog.addEventListener('pointerdown', () => dialog.removeAttribute('data-isc-toets'), true);
  // De browser sluit een dialoog zelf bij een tweede Escape zonder tussenkomst van keydown: ook dan opruimen.
  const onCancel = (e) => { e.preventDefault(); sluit(); };
  const onClose = () => { if (isOpen) afronden(); };
  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('close', onClose);

  // ---- opruimen ----------------------------------------------------------
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    isOpen = false;
    timers.forEach((id) => win.clearTimeout(id));
    timers.clear();
    if (rafId) win.cancelAnimationFrame(rafId);
    mb.stop();
    root.removeEventListener('click', onRootKlik);
    dialog.removeEventListener('close', onClose);
    if (dialog.open) dialog.close();
    dialog.remove();
    html.classList.remove('isc-lock');
    root.removeAttribute('data-isc-init');
    openers.forEach((o) => o.removeAttribute('aria-haspopup'));
  }
  return destroy;
}
