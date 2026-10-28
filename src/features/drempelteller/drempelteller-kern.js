/**
 * drempelteller
 * ------------------------------------------------------------------------
 * "Nog 312 aanmeldingen tot we live gaan" of "68 van 100 plekken bezet", met
 * een voortgangsbalk. Alleen met echte data (KWALITEITSREGELS R8/R9):
 *
 * - het getal komt uit `data-waarde` (server-gerenderd) of uit een JSON-
 *   endpoint (`data-bron`), nooit uit een schatting of Math.random
 * - zonder geldige waarde verbergt de teller zich (`hidden`), hij toont nooit
 *   een verzonnen getal
 * - het endpoint wordt pas opgehaald als de teller (bijna) in beeld komt, met
 *   een time-out; een fout of time-out geeft een verborgen teller, geen
 *   foutmelding
 * - optioneel telt het getal op (bij "minder beweging" direct)
 * - eigen tekst en status zodra het doel bereikt is
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * Eigen implementatie.
 *
 * @typedef {Object} DrempeltellerOpties
 * @property {number|string} [waarde] Huidige stand (anders `data-waarde`).
 * @property {number|string} [doel] Drempel (anders `data-doel`, anders het veld `doel` uit het endpoint).
 * @property {string} [bron] URL van een JSON-endpoint (anders `data-bron`). Verwacht `{ "waarde": 688, "doel": 1000 }`.
 * @property {string} [veldWaarde="waarde"] Sleutel van de stand in het JSON-antwoord.
 * @property {string} [veldDoel="doel"] Sleutel van de drempel in het JSON-antwoord.
 * @property {number} [timeout=4000] Milliseconden voordat het ophalen wordt opgegeven.
 * @property {string} [eenheid=""] Bijvoorbeeld "aanmeldingen" (anders `data-eenheid`).
 * @property {string} [eenheidEen=""] Enkelvoud, bv. "aanmelding" (anders `data-eenheid-een`): gebruikt als het getal vóór `{eenheid}` precies 1 is.
 * @property {string} [tekst="Nog {resterend} {eenheid} te gaan"] Tekst tot het doel, met {waarde} {doel} {resterend} {procent} {eenheid} (anders `data-tekst`). Enkelvoud/meervoud: `{resterend|aanmelding|aanmeldingen}`.
 * @property {string} [tekstBereikt="Doel bereikt: {waarde} {eenheid}"] Tekst als waarde >= doel (anders `data-tekst-bereikt`).
 * @property {boolean} [optellen=false] Getal en balk tellen op als de teller in beeld komt (anders `data-optellen`).
 * @property {number} [duur=1200] Duur van het optellen in ms.
 * @property {string} [label="Voortgang"] Toegankelijke naam van de balk (anders `data-label`).
 * @property {'progressbar'|'meter'} [rol="progressbar"] ARIA-rol van de balk.
 * @property {(staat: {waarde: number, doel: number, bereikt: boolean}) => void} [bijGetoond] Callback zodra de teller getoond wordt.
 *
 * @param {Element} root Element met de (eventuele) server-gerenderde tekst.
 * @param {DrempeltellerOpties} [opties]
 * @returns {() => void} destroy — zet de originele markup terug. Idempotent.
 */
import { vereisRoot, minderBeweging, inBeeld } from '../../_kwaliteit/basis.js';

// {waarde} of {waarde|enkelvoud|meervoud}: bij twee woorden volgt het passende woord op het getal (1 aanmelding, 2 aanmeldingen).
const TOKEN = /\{(waarde|doel|resterend|procent|eenheid)(?:\|([^|}]*)\|([^|}]*))?\}/g;

/** Strikt getal: alleen cijfers met optionele decimale punt. Alles anders is ongeldig (geen 0, geen gok). */
export function geldigGetal(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : NaN;
  if (typeof v !== 'string') return NaN;
  const s = v.trim();
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

const nl = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'drempelteller')) return () => {};
  if (root.hasAttribute('data-dt-actief')) return () => {};

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const ds = root.dataset;
  const cfg = {
    waarde: opties.waarde ?? ds.waarde,
    doel: opties.doel ?? ds.doel,
    bron: opties.bron ?? ds.bron,
    veldWaarde: opties.veldWaarde ?? 'waarde',
    veldDoel: opties.veldDoel ?? 'doel',
    timeout: geldigGetal(opties.timeout ?? ds.timeout ?? 4000) || 4000,
    eenheid: opties.eenheid ?? ds.eenheid ?? '',
    eenheidEen: opties.eenheidEen ?? ds.eenheidEen ?? '',
    tekst: opties.tekst ?? ds.tekst ?? 'Nog {resterend} {eenheid} te gaan',
    tekstBereikt: opties.tekstBereikt ?? ds.tekstBereikt ?? 'Doel bereikt: {waarde} {eenheid}',
    optellen: opties.optellen ?? (ds.optellen !== undefined && ds.optellen !== 'false'),
    duur: opties.duur ?? 1200,
    label: opties.label ?? ds.label ?? 'Voortgang',
    rol: opties.rol === 'meter' ? 'meter' : 'progressbar',
  };

  const orig = { html: root.innerHTML, hidden: root.hidden };
  root.setAttribute('data-dt-actief', '');
  let weg = false; let raf = 0; let timer = 0; let ctrl = null; let stopInBeeld = () => {};
  let staat = null; // { waarde, doel, bereikt }
  let els = null;
  const beweging = minderBeweging((reduced) => { if (reduced && raf) klaar(); });

  const zetStatus = (s) => root.setAttribute('data-dt-status', s);
  const verberg = (reden) => { root.hidden = true; zetStatus(reden); };

  // ---- tekst en balk ---------------------------------------------------
  const waardenBij = (v, s) => {
    // Nooit "Nog 0" of "1.000 van 1.000" terwijl het doel niet gehaald is: resterend naar boven, stand en procent naar beneden.
    const raw = {
      resterend: Math.max(0, Math.ceil(s.doel - v - 1e-9)),
      waarde: v >= s.doel ? v : Math.floor(v), doel: s.doel,
      procent: v >= s.doel ? 100 : Math.floor((v / s.doel) * 100),
    };
    return { raw, tekst: { waarde: nl.format(raw.waarde), doel: nl.format(raw.doel), resterend: nl.format(raw.resterend), procent: nl.format(raw.procent), eenheid: cfg.eenheid } };
  };
  const sjabloon = (s) => (s.bereikt ? cfg.tekstBereikt : cfg.tekst);
  /** Sjabloon in stukken: { t: tekst } of { getal: '312' } (het getal), met het meervoudswoord als tekst erachter. */
  function stukken(s, v) {
    const w = waardenBij(v, s); const sj = sjabloon(s); const uit = []; let last = 0;
    let vorige = null; // ruwe waarde van het laatste getal: bepaalt enkelvoud voor {eenheid}
    for (const m of sj.matchAll(TOKEN)) {
      if (m.index > last) uit.push({ t: sj.slice(last, m.index) });
      last = m.index + m[0].length;
      if (m[1] === 'eenheid') { uit.push({ t: vorige === 1 && cfg.eenheidEen ? cfg.eenheidEen : w.tekst.eenheid }); continue; }
      vorige = w.raw[m[1]];
      uit.push({ getal: w.tekst[m[1]] });
      if (m[2] !== undefined) uit.push({ t: ` ${w.raw[m[1]] === 1 ? m[2] : m[3]}` });
    }
    if (last < sj.length) uit.push({ t: sj.slice(last) });
    return uit;
  }
  const platteTekst = (s, v) => stukken(s, v).map((x) => x.t ?? x.getal).join('').replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
  function schrijfTekst(v) {
    els.tekst.textContent = '';
    for (const x of stukken(staat, v)) {
      if (x.t !== undefined) { if (x.t) els.tekst.appendChild(doc.createTextNode(x.t)); continue; }
      const b = doc.createElement('strong'); b.className = 'dt__getal'; b.textContent = x.getal;
      els.tekst.appendChild(b);
    }
  }
  const zetBalk = (v) => { els.vul.style.transform = `scaleX(${Math.min(1, v / staat.doel)})`; };

  function bouw() {
    root.textContent = '';
    const tekst = doc.createElement('p'); tekst.className = 'dt__tekst'; tekst.setAttribute('aria-hidden', 'true');
    const balk = doc.createElement('div'); balk.className = 'dt__balk';
    balk.setAttribute('role', cfg.rol);
    balk.setAttribute('aria-label', cfg.label);
    balk.setAttribute('aria-valuemin', '0');
    const vul = doc.createElement('div'); vul.className = 'dt__vul';
    balk.appendChild(vul);
    root.append(tekst, balk);
    els = { tekst, balk, vul };
  }

  function toon(waarde, doel, animeer, stil = false) {
    if (weg) return;
    staat = { waarde, doel, bereikt: waarde >= doel };
    bouw();
    els.balk.setAttribute('aria-valuemax', String(doel));
    els.balk.setAttribute('aria-valuenow', String(Math.min(waarde, doel)));
    els.balk.setAttribute('aria-valuetext', platteTekst(staat, waarde));
    root.hidden = false;
    zetStatus(staat.bereikt ? 'bereikt' : 'bezig');
    root.toggleAttribute('data-dt-bereikt', staat.bereikt);
    if (animeer && !beweging.reduced && waarde > 0) {
      schrijfTekst(0); zetBalk(0);
      root.setAttribute('data-dt-telt', '');
      const t0 = win.performance.now();
      const stap = (nu) => {
        const t = Math.min(1, (nu - t0) / cfg.duur);
        const e = 1 - (1 - t) ** 3; // ease-out
        const v = waarde * e;
        schrijfTekst(staat.bereikt && t < 1 ? Math.min(v, doel - 1e-9) : v); zetBalk(v);
        if (t < 1) raf = win.requestAnimationFrame(stap); else { raf = 0; klaar(); }
      };
      raf = win.requestAnimationFrame(stap);
    } else { schrijfTekst(waarde); zetBalk(waarde); }
    if (opties.bijGetoond && !stil) opties.bijGetoond({ ...staat });
  }

  function klaar() {
    if (raf) { win.cancelAnimationFrame(raf); raf = 0; }
    if (!els) return;
    schrijfTekst(staat.waarde); zetBalk(staat.waarde);
    root.removeAttribute('data-dt-telt');
  }

  // ---- data --------------------------------------------------------------
  const wilOptellen = () => !!cfg.optellen;

  function metWaarde(w, d, animeer) {
    const waarde = geldigGetal(w); const doel = geldigGetal(d);
    if (Number.isNaN(waarde) || Number.isNaN(doel) || doel <= 0) { verberg('leeg'); return; }
    toon(waarde, doel, animeer);
  }

  async function haalOp() {
    if (weg) return;
    zetStatus('laden');
    ctrl = new win.AbortController();
    timer = win.setTimeout(() => ctrl && ctrl.abort(), cfg.timeout);
    try {
      const res = await win.fetch(cfg.bron, { signal: ctrl.signal, headers: { Accept: 'application/json' }, credentials: 'omit' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (weg) return;
      if (!data || typeof data !== 'object') throw new Error('geen object');
      metWaarde(data[cfg.veldWaarde], data[cfg.veldDoel] ?? cfg.doel, wilOptellen());
    } catch {
      if (!weg) verberg('geen-data'); // time-out, netwerkfout of ongeldig antwoord: niets tonen, geen fout gooien
    } finally {
      win.clearTimeout(timer); timer = 0; ctrl = null;
    }
  }

  // ---- start -------------------------------------------------------------
  if (cfg.bron) {
    // Niet `hidden`: een element met display:none komt nooit "in beeld" voor de IntersectionObserver.
    // De css houdt hem in de wachtstand leeg en zonder hoogte.
    root.hidden = false; root.textContent = ''; zetStatus('wacht');
    stopInBeeld = inBeeld(root, () => { haalOp(); }, { rootMargin: '200px' });
  } else if (wilOptellen()) {
    const w = geldigGetal(cfg.waarde); const d = geldigGetal(cfg.doel);
    if (Number.isNaN(w) || Number.isNaN(d) || d <= 0) verberg('leeg');
    else {
      toon(w, d, false, true); // eindstand meteen aanwezig; het optellen start pas in beeld
      stopInBeeld = inBeeld(root, () => { if (!weg) toon(w, d, true); }, { rootMargin: '0px', threshold: 0.4 });
    }
  } else metWaarde(cfg.waarde, cfg.doel, false);

  // ---- opruimen ------------------------------------------------------------
  return function destroy() {
    if (weg) return; weg = true;
    stopInBeeld();
    beweging.stop();
    if (raf) win.cancelAnimationFrame(raf);
    if (timer) win.clearTimeout(timer);
    if (ctrl) ctrl.abort();
    root.innerHTML = orig.html;
    root.hidden = orig.hidden;
    for (const a of ['data-dt-actief', 'data-dt-status', 'data-dt-bereikt', 'data-dt-telt']) root.removeAttribute(a);
  };
}
