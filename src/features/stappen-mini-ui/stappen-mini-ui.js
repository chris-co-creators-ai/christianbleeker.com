/**
 * stappen-mini-ui
 * ------------------------------------------------------------------------
 * Drie stapkaarten, elk met een levende mini-interface die start zodra de kaart
 * in beeld komt:
 *  1. kiezen     vinkjes gaan één voor één aan, de prijs loopt mee, een regel
 *                met pakketkorting schuift in;
 *  2. opzetten   logregels komen binnen, een installatiebalk vult, de status gaat
 *                van "Wordt opgezet" naar "Actief" met een ping en een succesring;
 *  3. koppelen   een échte DNS-tabel; de SSL-kolom springt per regel op "Actief"
 *                en de kopieerknop zet de records op het klembord.
 *
 * Vanilla ES-module, SSR-veilig. `mesh-wolk-kopie.js/.css` zijn byte-gelijke kopieën van
 * backgrounds/mesh-wolk; de map importeert niets van buiten zichzelf (behalve _kwaliteit/basis.js). De markup is de eindtoestand: zonder JS, bij
 * minder beweging en bij een gepauzeerde site zie je die direct. De JS zet bij
 * init de beginstand en speelt de stappen af; `destroy()` zet alle teksten en
 * attributen terug zoals ze in de markup stonden.
 *
 * Herkomst: eu-hosted.com/nl (28-10-2026), sectie "Hoe het werkt". Getallen als
 * vertrekpunt: kaart van blur 8 px + 18 px omlaag in .62 s (stap .08 s),
 * ping 75 % → scale 2 / opacity 0 in 1 s, succesring 1 → 1,5 en .65 → 0 in 3,2 s.
 *
 * @typedef {Object} StappenMiniUiOpties
 * @property {boolean} [wolk=true] Start `backgrounds/mesh-wolk` op elk `[data-mesh-wolk]` in de root.
 * @property {string} [meldingGekopieerd] Tekst voor schermlezers na kopiëren.
 * @property {string} [meldingMislukt] Tekst als kopiëren niet lukt.
 * @property {Partial<typeof TEKSTEN>} [teksten] Zinnen die de JS zelf schrijft; `{n}`, `{pct}`, `{namen}`, `{bedrag}` worden ingevuld.
 *
 * @param {HTMLElement} root Element met `[data-stappen-mini-ui]`.
 * @param {StappenMiniUiOpties} [opties]
 * @returns {() => void} destroy — idempotent.
 */
import { vereisRoot, minderBeweging, zonderUndefined } from '../../_kwaliteit/basis.js';
// Byte-gelijke kopie van backgrounds/mesh-wolk, zodat deze map ook als platte kopie werkt (test/meet.mjs bewaakt dat).
import { init as wolkInit } from './mesh-wolk-kopie.js';

const STANDAARD = {
  wolk: true,
  meldingGekopieerd: 'DNS-records gekopieerd naar het klembord.',
  meldingMislukt: 'Kopiëren lukte niet. Selecteer de records en kopieer ze zelf.',
};
/** Zinnen die de JS zelf schrijft (Nederlandse standaard). `leeg` geldt alleen zonder `data-smu-leeg`. */
export const TEKSTEN = {
  leeg: 'Nog niets gekozen',
  gekozen: '{n} gekozen',
  korting: '{pct} % pakketkorting',
  voorbeeld: 'Voorbeeld: {n} apps gekozen ({namen}), samen {bedrag} per maand met {pct} % pakketkorting.',
};
const vul = (zin, w) => String(zin).replace(/\{(\w+)\}/g, (m, k) => (k in w ? String(w[k]) : m));
const KAART_STAP = 80; // ms tussen de kaarten bij binnenkomst
const START_NA = 420; // ms na het begin van de binnenkomst start de mini-interface

/** Pauzeknop van de site: `html[data-motion=paused]` of het event `beweging:pauze`. */
function luisterPauze(doc, onChange) {
  const html = doc.documentElement;
  let staat = html.getAttribute('data-motion') === 'paused';
  const zet = (v) => { if (v !== staat) { staat = v; onChange(v); } };
  const mo = new doc.defaultView.MutationObserver(() => zet(html.getAttribute('data-motion') === 'paused'));
  mo.observe(html, { attributes: true, attributeFilter: ['data-motion'] });
  const ev = (e) => zet(!!(e.detail && e.detail.gepauzeerd));
  doc.addEventListener('beweging:pauze', ev);
  return { get gepauzeerd() { return staat; }, stop() { mo.disconnect(); doc.removeEventListener('beweging:pauze', ev); } };
}

/** Houdt de originele tekst en attributen bij van alles wat de module aanraakt, voor destroy(). */
function maakGeheugen() {
  const teksten = new Map();
  const attrs = new Map();
  const leesTekst = (el) => (el.childNodes.length === 1 && el.firstChild.nodeType === 3 ? el.firstChild.data : el.textContent);
  // Bestaande tekstknoop aanpassen in plaats van vervangen: React houdt dan zijn eigen knoop.
  const schrijf = (el, t) => { if (el.childNodes.length === 1 && el.firstChild.nodeType === 3) el.firstChild.data = t; else el.textContent = t; };
  return {
    tekst(el, t) { if (!el) return; if (!teksten.has(el)) teksten.set(el, leesTekst(el)); schrijf(el, t); },
    attr(el, naam, waarde) {
      if (!el) return;
      let m = attrs.get(el); if (!m) { m = new Map(); attrs.set(el, m); }
      if (!m.has(naam)) m.set(naam, el.getAttribute(naam));
      if (waarde === false || waarde === null) el.removeAttribute(naam); else el.setAttribute(naam, waarde === true ? '' : waarde);
    },
    herstel() {
      for (const [el, t] of teksten) schrijf(el, t);
      for (const [el, m] of attrs) for (const [naam, w] of m) { if (w === null) el.removeAttribute(naam); else el.setAttribute(naam, w); }
      teksten.clear(); attrs.clear();
    },
  };
}

/**
 * Zet `data-staat` en laat de breedte meeglijden: de labels in een `.smu-wissel`
 * verschillen in lengte ("Wordt opgezet" → "Actief"), de pil volgt in 320 ms.
 */
function wisselStaat(el, staat, g, animeer, zet = (e, w) => g.attr(e, 'data-staat', w)) {
  if (!el) return;
  const van = el.getBoundingClientRect().width;
  zet(el, staat);
  // Schermlezers: alleen het actieve label telt, meteen, los van de fade (240 ms) van het oude label.
  for (const lbl of el.querySelectorAll(':scope > .smu-wissel > [data-smu-als]')) {
    g.attr(lbl, 'aria-hidden', lbl.getAttribute('data-smu-als') === staat ? false : 'true');
  }
  if (!animeer || !el.animate) return;
  const naar = el.getBoundingClientRect().width;
  if (Math.abs(van - naar) > 0.5) {
    el.animate([{ width: `${van}px` }, { width: `${naar}px` }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
}

// ---- de drie mini-interfaces -------------------------------------------
// Elke fabriek geeft { begin(), stappen: [{ na, doe }], eind(), stop() }.

function kiezen(mini, g, win, stap, T) {
  const keuzes = [...mini.querySelectorAll('[data-smu-kies]')];
  const teller = mini.querySelector('[data-smu-teller]');
  const bedrag = mini.querySelector('[data-smu-bedrag]');
  const regel = mini.querySelector('[data-smu-korting-regel]');
  const kortingTekst = mini.querySelector('[data-smu-korting-tekst]');
  const ring = mini.querySelector('[data-smu-korting-regel] .smu-ring');
  const basis = Number(mini.getAttribute('data-smu-basisprijs')) || 0;
  const korting = Number(mini.getAttribute('data-smu-korting')) || 0;
  const leeg = mini.getAttribute('data-smu-leeg') || T.leeg;
  // Eén bron (R9): de prijs en het kortingspercentage komen uit de data-attributen.
  const prijs = (n) => n * (basis - korting * (n - 1));
  const pct = (n) => (n > 1 && basis ? Math.round((1 - prijs(n) / (n * basis)) * 100) : 0);
  const euro = (v) => `€${Math.round(v)}`;
  let raf = 0; let getoond = 0; let ringAnim = null;

  function telOp(naar) {
    if (raf) win.cancelAnimationFrame(raf);
    const van = getoond; const t0 = win.performance.now(); const duur = 520;
    const tik = (nu) => {
      const x = Math.min(1, (nu - t0) / duur);
      getoond = van + (naar - van) * (1 - (1 - x) ** 3);
      g.tekst(bedrag, euro(getoond));
      raf = x < 1 ? win.requestAnimationFrame(tik) : 0;
    };
    raf = win.requestAnimationFrame(tik);
  }
  function zet(n, animeer) {
    keuzes.forEach((k, i) => g.attr(k, 'data-aan', i < n));
    g.tekst(teller, n ? vul(T.gekozen, { n }) : leeg);
    g.attr(regel, 'data-smu-uit', n < 2);
    if (n >= 2) g.tekst(kortingTekst, vul(T.korting, { pct: pct(n) }));
    if (animeer) {
      telOp(prijs(n));
      if (n >= 2 && ring && ring.animate) {
        ringAnim = ring.animate(
          [{ opacity: 0.65, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.5)' }],
          { duration: 1400, easing: 'cubic-bezier(.16,1,.3,1)' },
        );
      }
    } else {
      if (raf) { win.cancelAnimationFrame(raf); raf = 0; }
      getoond = prijs(n);
      g.tekst(bedrag, euro(getoond));
    }
  }
  // Schermlezertekst uit dezelfde bron als het beeld.
  const sr = stap.querySelector('[data-smu-sr]');
  if (sr && keuzes.length) {
    const n = keuzes.length;
    const namen = keuzes.map((k) => (k.querySelector('strong') || k).textContent.trim()).join(', ');
    g.tekst(sr, vul(T.voorbeeld, { n, namen, bedrag: euro(prijs(n)), pct: pct(n) }));
  }
  return {
    begin() { zet(0, false); },
    stappen: keuzes.map((_, i) => ({ na: 350 + i * 700, doe: () => zet(i + 1, true) })),
    eind() { if (ringAnim) ringAnim.cancel(); zet(keuzes.length, false); },
    stop() { if (raf) win.cancelAnimationFrame(raf); raf = 0; if (ringAnim) ringAnim.cancel(); },
  };
}

function opzetten(mini, g) {
  const status = mini.querySelector('[data-smu-server]');
  const regels = [...mini.querySelectorAll('[data-smu-regel]')];
  const laden = mini.querySelector('[data-smu-installeer]');
  const voet = mini.querySelector('[data-smu-voet]');
  const stappen = [];
  regels.forEach((r, i) => {
    const na = 250 + i * 650 + (laden && regels.indexOf(laden) < i ? 900 : 0);
    // De balk staat sinds begin() op scaleX(0); data-smu-vul zet de overgang naar 1 in gang.
    stappen.push({ na, doe: () => { g.attr(r, 'data-smu-uit', false); if (r === laden) g.attr(r, 'data-smu-vul', true); } });
    if (r === laden) stappen.push({ na: na + 1550, doe: () => g.attr(r, 'data-smu-laden', false) });
  });
  const laatste = Math.max(0, ...stappen.map((s) => s.na));
  stappen.push({ na: laatste + 450, doe: () => { wisselStaat(status, 'klaar', g, true); g.attr(voet, 'data-smu-uit', false); } });
  return {
    begin() {
      wisselStaat(status, 'bezig', g, false);
      regels.forEach((r) => g.attr(r, 'data-smu-uit', true));
      if (laden) { g.attr(laden, 'data-smu-laden', true); g.attr(laden, 'data-smu-vul', false); }
      g.attr(voet, 'data-smu-uit', true);
    },
    stappen,
    eind() {
      regels.forEach((r) => g.attr(r, 'data-smu-uit', false));
      if (laden) { g.attr(laden, 'data-smu-laden', false); g.attr(laden, 'data-smu-vul', true); }
      wisselStaat(status, 'klaar', g, false);
      g.attr(voet, 'data-smu-uit', false);
    },
    stop() {},
  };
}

function koppelen(mini, g) {
  const ssl = [...mini.querySelectorAll('[data-smu-ssl]')];
  return {
    begin() { ssl.forEach((s) => wisselStaat(s, 'bezig', g, false)); },
    stappen: ssl.map((s, i) => ({ na: 450 + i * 550, doe: () => wisselStaat(s, 'actief', g, true) })),
    eind() { ssl.forEach((s) => wisselStaat(s, 'actief', g, false)); },
    stop() {},
  };
}

const FABRIEK = { kiezen, opzetten, koppelen };

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'stappen-mini-ui')) return () => {};
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  const T = { ...TEKSTEN, ...zonderUndefined(o.teksten || {}) };
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const g = maakGeheugen();
  const stoppers = [];
  let vernietigd = false;

  // Wolken achter de kaarten (optioneel).
  if (o.wolk) for (const el of root.querySelectorAll('[data-mesh-wolk]')) stoppers.push(wolkInit(el));

  const kaarten = [...root.querySelectorAll('[data-smu-stap]')].map((stap, i) => {
    const mini = stap.querySelector('[data-smu-mini]');
    const soort = mini && mini.getAttribute('data-smu-mini');
    const m = FABRIEK[soort] ? FABRIEK[soort](mini, g, win, stap, T) : null;
    stap.style.setProperty('--smu-d', `${(i * KAART_STAP) / 1000}s`);
    stoppers.push(() => stap.style.removeProperty('--smu-d'));
    return { stap, m, i, timers: [], gestart: false, klaar: false };
  });

  function rondAf(k) {
    for (const t of k.timers) win.clearTimeout(t);
    k.timers = [];
    if (k.m && !k.klaar) k.m.eind();
    k.klaar = true;
    k.gestart = true;
  }
  function speel(k) {
    if (k.gestart) return;
    k.gestart = true;
    g.attr(k.stap, 'data-smu-in', true);
    if (!k.m) { k.klaar = true; return; }
    const basis = k.i * KAART_STAP + START_NA;
    const n = k.m.stappen.length;
    k.m.stappen.forEach((s, j) => {
      k.timers.push(win.setTimeout(() => { s.doe(); if (j === n - 1) k.klaar = true; }, basis + s.na));
    });
  }
  function allesDirect() {
    g.attr(root, 'data-smu-direct', true);
    for (const k of kaarten) { g.attr(k.stap, 'data-smu-in', true); rondAf(k); }
  }

  // ---- kopieerknop: werkt altijd, ook bij minder beweging -----------------
  const live = doc.createElement('p');
  live.className = 'smu-sr';
  live.setAttribute('role', 'status');
  root.appendChild(live);
  stoppers.push(() => live.remove());
  for (const knop of root.querySelectorAll('[data-smu-kopieer]')) {
    const mini = knop.closest('[data-smu-mini]') || root;
    g.attr(knop, 'hidden', false);
    wisselStaat(knop, 'klaar', g, false);
    let terugTimer = 0;
    const tekst = () => {
      const doel = mini.querySelector('[data-smu-doel]');
      const naar = doel ? doel.textContent.trim() : '';
      return [...mini.querySelectorAll('[data-smu-record]')].map((tr) => {
        const cellen = tr.querySelectorAll('td');
        return [cellen[0], cellen[1]].map((c) => (c ? c.textContent.trim() : '')).concat(naar).filter(Boolean).join('\t');
      }).join('\n');
    };
    const terugval = (t) => {
      const ta = doc.createElement('textarea');
      ta.value = t;
      ta.setAttribute('readonly', '');
      ta.setAttribute('aria-hidden', 'true');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
      doc.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = doc.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      knop.focus({ preventScroll: true });
      return ok;
    };
    const klik = async () => {
      const t = tekst();
      let ok = false;
      try {
        if (win.navigator.clipboard && win.navigator.clipboard.writeText) { await win.navigator.clipboard.writeText(t); ok = true; }
      } catch { ok = false; }
      if (!ok) ok = terugval(t);
      if (vernietigd) return;
      const animeer = !win.matchMedia('(prefers-reduced-motion: reduce)').matches;
      wisselStaat(knop, ok ? 'gekopieerd' : 'mislukt', g, animeer);
      live.textContent = ok ? o.meldingGekopieerd : o.meldingMislukt;
      win.clearTimeout(terugTimer);
      terugTimer = win.setTimeout(() => { wisselStaat(knop, 'klaar', g, animeer); live.textContent = ''; }, ok ? 2000 : 4000);
    };
    knop.addEventListener('click', klik);
    stoppers.push(() => { knop.removeEventListener('click', klik); win.clearTimeout(terugTimer); });
  }

  // ---- beweging ---------------------------------------------------------
  const mb = minderBeweging((r) => { if (r) allesDirect(); }, doc);
  stoppers.push(() => mb.stop());
  const pauze = luisterPauze(doc, (p) => {
    g.attr(root, 'data-smu-pauze', p);
    if (p) allesDirect();
  });
  stoppers.push(() => pauze.stop());
  if (pauze.gepauzeerd) g.attr(root, 'data-smu-pauze', true);

  if (mb.reduced || pauze.gepauzeerd || !('IntersectionObserver' in win)) {
    allesDirect();
  } else {
    for (const k of kaarten) if (k.m) k.m.begin();
    // Twee fasen (zie reveal-on-scroll): verbergen zonder overgang, één frame later de overgang aan.
    g.attr(root, 'data-smu-verborgen', true);
    void root.getBoundingClientRect();
    const raf = win.requestAnimationFrame(() => g.attr(root, 'data-smu-actief', true));
    stoppers.push(() => win.cancelAnimationFrame(raf));
  }

  // In beeld: binnenkomst + mini-interface starten; uit beeld: lussen (ping, ring) pauzeren.
  if ('IntersectionObserver' in win) {
    const io = new win.IntersectionObserver((entries) => {
      for (const e of entries) {
        const k = kaarten.find((x) => x.stap === e.target);
        if (!k) continue;
        if (e.isIntersecting) speel(k);
        g.attr(k.stap, 'data-smu-uitbeeld', !e.isIntersecting);
      }
    }, { rootMargin: '0px 0px -70px 0px' });
    for (const k of kaarten) io.observe(k.stap);
    stoppers.push(() => io.disconnect());
  }
  const opZicht = () => g.attr(root, 'data-smu-verstopt', doc.hidden);
  doc.addEventListener('visibilitychange', opZicht);
  stoppers.push(() => doc.removeEventListener('visibilitychange', opZicht));

  return function destroy() {
    if (vernietigd) return;
    vernietigd = true;
    for (const k of kaarten) { for (const t of k.timers) win.clearTimeout(t); if (k.m) k.m.stop(); }
    for (const s of stoppers) s();
    g.herstel();
  };
}
