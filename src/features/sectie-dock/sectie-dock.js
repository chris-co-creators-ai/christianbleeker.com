/**
 * sectie-dock
 * ------------------------------------------------------------------------
 * Eén vaste CTA rechtsonder waarvan tekst ÉN actie per sectie wisselen.
 * Mobiel: een ronde schijf met een pijl en tekst eromheen die langzaam
 * draait. Desktop (optie `pil`): een compacte pil "● Websitescan · 2 min".
 * De dock verschijnt na de hero en verdwijnt in secties met
 * `data-dock-verberg` (die hebben zelf al een CTA). Optioneel trekt de
 * schijf met een fijne muis naar de cursor (`magneet`).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt window/document pas
 * in `init()`).
 *
 * Herkomst: eigen implementatie; "sectie-dock" + "magnetische schijven"
 * gezien bij meerdere bureausites: config per sectie, fade bij tekstwissel,
 * draai gepauzeerd buiten beeld, magneet 140 px / max. 22 px / pijl 6 px
 * verder. De getallen zijn als vertrekpunt genomen.
 *
 * Markup: `<a class="sd" href="#contact" data-sectie-dock>Neem contact op</a>`.
 * De inhoud en href zijn de zonder-JS-fallback (een vaste link naar het
 * contact) én de standaardactie; JS vervangt de kinderen door schijf + pil
 * en zet ze bij `destroy()` terug.
 *
 * @typedef {Object} DockActie
 * @property {string} tekst   Tekst (ring en pil). Wordt in hoofdletters om de schijf gezet.
 * @property {string} [label] Toegankelijke naam (aria-label). Standaard `tekst`. Noem hier de actie.
 * @property {string} [pil]   Afwijkende tekst voor de desktop-pil, bv. "Websitescan · 2 min".
 * @property {string} [href]  Link. Ook fallback als `event`/`actie` is gezet.
 * @property {string} [event] Naam van een CustomEvent dat op `document` wordt verstuurd (detail: {sectie}); de link volgt dan niet.
 * @property {(info: {sectie: string, cfg: DockActie, event: Event}) => void} [actie] Callback bij klik; de link volgt dan niet.
 *
 * @typedef {Object} SectieDockOptions
 * @property {Record<string, DockActie>} [secties] Sectie-id → actie. Volgorde = paginavolgorde.
 * @property {Partial<DockActie>} [standaard] Actie buiten alle secties. Standaard: inhoud + href van de dock zelf.
 * @property {string|number} [toonNa] Selector van het element dat voorbij moet zijn (bottom boven 50% van het scherm), of een scroll-Y in px. Standaard: de eerste sectie uit `secties`.
 * @property {string} [verberg='[data-dock-verberg]'] Selector van elementen waarin de dock verdwijnt.
 * @property {number} [drempel=0.4] Sectie is actief zodra haar top boven dit deel van de schermhoogte komt.
 * @property {boolean} [pil=false] Op desktop (>= 900 px, met muis) een pil in plaats van een schijf.
 * @property {boolean} [magneet=false] Schijf trekt naar de cursor (alleen muis, nooit touch of bij minder beweging).
 * @property {boolean} [reserveer=false] Zet padding-bottom op `root` zodat de dock de laatste regel nooit bedekt. Niet nodig als de laatste sectie `data-dock-verberg` heeft.
 * @property {number} [wisselMs=220] Duur van de fade bij tekstwissel.
 * @property {string|Element} [dock] De dock zelf. Standaard `root.querySelector('[data-sectie-dock]')`.
 *
 * @param {Element} root Container met de secties (mag `document.body` zijn) en de dock.
 * @param {SectieDockOptions} [opties]
 * @returns {() => void} destroy — ruimt alles op, idempotent.
 */
import { minderBeweging, isTouch, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const PAD = 'M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0'; // cirkel r=38 in viewBox 100
const STRAAL = 140; // px: binnen deze afstand trekt de schijf
const MAX = 22;     // px: maximale verplaatsing van de schijf
const PIJL = 6;     // px: de pijl beweegt zoveel verder
const FONT = 9.4;   // viewBox-eenheden
const PIL_MQ = '(min-width: 900px) and (hover: hover)';
let teller = 0;

function svg(doc, naam, attrs = {}) {
  const n = doc.createElementNS(SVGNS, naam);
  for (const k of Object.keys(attrs)) n.setAttribute(k, attrs[k]);
  return n;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'sectie-dock')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const {
    secties = {}, standaard = {}, toonNa, verberg = '[data-dock-verberg]',
    drempel = 0.4, pil = false, magneet = false, reserveer = false,
    wisselMs = 220,
  } = opties;

  const el = typeof opties.dock === 'string'
    ? root.querySelector(opties.dock)
    : (opties.dock || root.querySelector('[data-sectie-dock]'));
  if (!el) {
    console.warn('sectie-dock: geen [data-sectie-dock] gevonden — overgeslagen');
    return () => {};
  }
  if (el.hasAttribute('data-sd-klaar')) return () => {}; // al geïnitialiseerd

  const isLink = el.tagName === 'A';
  const orig = {
    nodes: Array.from(el.childNodes),
    href: el.getAttribute('href'),
    label: el.getAttribute('aria-label'),
    tekst: (el.textContent || '').trim(),
  };
  const basis = {
    tekst: orig.tekst, href: orig.href || undefined, ...standaard,
  };

  // --- DOM bouwen -----------------------------------------------------
  const id = `sd-pad-${++teller}`;
  const schijf = doc.createElement('span');
  schijf.className = 'sd__schijf';
  schijf.setAttribute('aria-hidden', 'true');
  const ring = svg(doc, 'svg', { class: 'sd__ring', viewBox: '0 0 100 100', focusable: 'false' });
  const defs = svg(doc, 'defs');
  const pad = svg(doc, 'path', { id, d: PAD });
  defs.appendChild(pad);
  const tekstEl = svg(doc, 'text');
  const tp = svg(doc, 'textPath');
  tp.setAttribute('href', `#${id}`);
  tekstEl.appendChild(tp);
  ring.append(defs, tekstEl);
  const pijl = doc.createElement('span');
  pijl.className = 'sd__pijl';
  const bol = doc.createElement('span');
  bol.className = 'sd__bol';
  const pijlSvg = svg(doc, 'svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', focusable: 'false' });
  pijlSvg.appendChild(svg(doc, 'path', { d: 'M7 17 17 7M8 7h9v9' }));
  bol.appendChild(pijlSvg);
  pijl.appendChild(bol);
  schijf.append(ring, pijl);

  const pilEl = doc.createElement('span');
  pilEl.className = 'sd__pil';
  pilEl.setAttribute('aria-hidden', 'true');
  const punt = doc.createElement('i');
  punt.className = 'sd__punt';
  const pilTekst = doc.createElement('span');
  pilTekst.className = 'sd__pil-tekst';
  pilEl.append(punt, pilTekst);

  el.replaceChildren(schijf, pilEl);
  el.setAttribute('data-sd-klaar', '');
  if (pil) el.setAttribute('data-sd-pil', '');

  // --- toestand -------------------------------------------------------
  const ids = Object.keys(secties);
  let reduced = minderBeweging().reduced;
  let huidig = null; let huidigId = '';
  let timer = 0; let gestopt = false;
  const mb = minderBeweging((r) => {
    reduced = r;
    if (r) { los(); zetTekst(huidig); }
  }, doc);
  reduced = mb.reduced;

  const cfgVan = (sid) => ({ ...basis, ...(sid && secties[sid] ? secties[sid] : {}) });

  function pasRing(tekst) {
    // Tekst herhalen tot de omtrek vol is en met textLength exact laten sluiten
    // (zelfde idee als typography/circle-text, maar hier opnieuw bij elke wissel).
    const eenheid = `${tekst.toLocaleUpperCase('nl')} • `;
    tekstEl.removeAttribute('textLength');
    tekstEl.style.fontSize = `${FONT}px`;
    tp.textContent = eenheid;
    const omtrek = typeof pad.getTotalLength === 'function' ? pad.getTotalLength() : 0;
    const len = typeof tp.getComputedTextLength === 'function' ? tp.getComputedTextLength() : 0;
    if (!omtrek || !len) return; // niet meetbaar (nog niet gerenderd): één eenheid, volgende resize past opnieuw
    if (len > omtrek) tekstEl.style.fontSize = `${(FONT * omtrek / len * 0.98).toFixed(2)}px`; // te lange tekst: lettertje kleiner
    const n = Math.max(1, Math.round(omtrek / Math.min(len, omtrek)));
    tp.textContent = eenheid.repeat(n);
    tekstEl.setAttribute('textLength', String(omtrek));
    tekstEl.setAttribute('lengthAdjust', 'spacing');
  }

  function zetTekst(cfg) {
    if (!cfg) return;
    pasRing(cfg.tekst || '');
    pilTekst.textContent = cfg.pil || cfg.tekst || '';
  }

  const gewaarschuwd = new Set();
  function zetToegankelijk(cfg, sid) {
    // WCAG 2.5.3 (label in naam): de zichtbare pil-tekst moet in de aria-label staan
    const zichtbaar = (cfg.pil || cfg.tekst || '').trim();
    const naam = (cfg.label || cfg.tekst || '');
    if (zichtbaar && !naam.toLocaleLowerCase('nl').includes(zichtbaar.toLocaleLowerCase('nl')) && !gewaarschuwd.has(zichtbaar)) {
      gewaarschuwd.add(zichtbaar);
      console.warn(`sectie-dock: zichtbare tekst "${zichtbaar}" staat niet in de aria-label "${naam}" (WCAG 2.5.3) — pas label of pil aan`);
    }
    el.setAttribute('aria-label', cfg.label || cfg.tekst || '');
    if (isLink && cfg.href) el.setAttribute('href', cfg.href);
    el.setAttribute('data-sd-sectie', sid || '');
  }

  function kies(sid, zichtbaar) {
    const cfg = cfgVan(sid);
    if (huidig && huidigId === (sid || '')) return;
    const eerste = !huidig;
    huidig = cfg; huidigId = sid || '';
    zetToegankelijk(cfg, sid); // naam en bestemming wisselen meteen, ook voor wie niets ziet
    win.clearTimeout(timer);
    if (eerste || reduced || !zichtbaar) {
      el.removeAttribute('data-sd-wissel');
      zetTekst(cfg);
      return;
    }
    el.setAttribute('data-sd-wissel', '');
    timer = win.setTimeout(() => { zetTekst(cfg); el.removeAttribute('data-sd-wissel'); }, wisselMs);
  }

  // --- wanneer zichtbaar ----------------------------------------------
  const vh = () => win.innerHeight || doc.documentElement.clientHeight;
  function voorbijHero() {
    if (typeof toonNa === 'number') return win.scrollY > toonNa;
    const t = typeof toonNa === 'string'
      ? (root.querySelector(toonNa) || doc.querySelector(toonNa))
      : (ids[0] ? doc.getElementById(ids[0]) : null);
    if (!t) return win.scrollY > vh() * 0.85;
    return t.getBoundingClientRect().bottom <= vh() * 0.5;
  }
  function inVerbergZone() {
    const h = vh();
    const zone = el.offsetHeight + 60;
    return Array.from(root.querySelectorAll(verberg)).some((n) => {
      const r = n.getBoundingClientRect();
      return r.top < h - 40 && r.bottom > h - zone;
    });
  }
  function actieveSectie() {
    const grens = vh() * drempel;
    let a = '';
    ids.forEach((sid) => {
      const s = doc.getElementById(sid);
      if (s && s.getBoundingClientRect().top <= grens) a = sid;
    });
    return a;
  }

  let aan = null;
  function update() {
    if (gestopt) return;
    const wil = voorbijHero() && !inVerbergZone();
    kies(actieveSectie(), aan === true || wil);
    if (wil !== aan) {
      aan = wil;
      el.toggleAttribute('data-sd-aan', wil);
      if (!wil) los();
    }
  }

  // --- magneet ----------------------------------------------------------
  const pilMq = win.matchMedia ? win.matchMedia(PIL_MQ) : { matches: false };
  const magneetMogelijk = magneet && !isTouch(doc);
  let trekt = false;
  function zetOffset(mx, my, ax, ay) {
    el.style.setProperty('--sd-mx', `${mx}px`);
    el.style.setProperty('--sd-my', `${my}px`);
    el.style.setProperty('--sd-ax', `${ax}px`);
    el.style.setProperty('--sd-ay', `${ay}px`);
  }
  function los() {
    volg.cancel();
    if (!trekt) return;
    trekt = false;
    el.removeAttribute('data-sd-trek'); // terug met de verende overgang
    zetOffset(0, 0, 0, 0);
  }
  const volg = perFrame((x, y) => {
    if (gestopt) return;
    if (reduced || !el.hasAttribute('data-sd-aan') || (pil && pilMq.matches)) return los();
    const r = schijf.getBoundingClientRect();
    const cs = win.getComputedStyle(el);
    const huidigX = parseFloat(cs.getPropertyValue('--sd-mx')) || 0;
    const huidigY = parseFloat(cs.getPropertyValue('--sd-my')) || 0;
    const cx = r.left + r.width / 2 - huidigX;
    const cy = r.top + r.height / 2 - huidigY;
    const dx = x - cx; const dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d > STRAAL || d < 0.5) return d < 0.5 ? undefined : los();
    const sterkte = Math.min(1, (1 - d / STRAAL) * 3);
    const mag = Math.min(MAX, d * 0.5) * sterkte;
    const ux = dx / d; const uy = dy / d;
    trekt = true;
    el.setAttribute('data-sd-trek', '');
    zetOffset(+(ux * mag).toFixed(1), +(uy * mag).toFixed(1), +(ux * PIJL * sterkte).toFixed(1), +(uy * PIJL * sterkte).toFixed(1));
  }, doc);
  const opPointer = (e) => { if (!e.pointerType || e.pointerType === 'mouse') volg(e.clientX, e.clientY); };
  const opWeg = () => los();

  // --- klik -------------------------------------------------------------
  const opKlik = (e) => {
    const cfg = huidig;
    if (!cfg || (!cfg.event && !cfg.actie)) return; // gewone link: browser doet zijn werk
    e.preventDefault();
    if (typeof cfg.actie === 'function') cfg.actie({ sectie: huidigId, cfg, event: e });
    if (cfg.event) doc.dispatchEvent(new win.CustomEvent(cfg.event, { bubbles: true, detail: { sectie: huidigId } }));
  };
  el.addEventListener('click', opKlik);

  // --- luisteraars ------------------------------------------------------
  const opScroll = perFrame(update, doc);
  const opResize = perFrame(() => { zetTekst(huidig); update(); }, doc);
  win.addEventListener('scroll', opScroll, { passive: true });
  win.addEventListener('resize', opResize, { passive: true });
  win.addEventListener('load', opScroll);
  if (magneetMogelijk) {
    el.setAttribute('data-sd-magneet', '');
    win.addEventListener('pointermove', opPointer, { passive: true });
    doc.documentElement.addEventListener('mouseleave', opWeg);
    win.addEventListener('blur', opWeg);
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (!gestopt) { zetTekst(huidig); update(); } });

  let origPad = null;
  if (reserveer) {
    origPad = root.style.paddingBottom;
    const nu = parseFloat(win.getComputedStyle(root).paddingBottom) || 0;
    root.style.paddingBottom = `calc(${nu}px + var(--sd-maat, 96px) + 2rem + env(safe-area-inset-bottom, 0px))`;
  }

  update();

  // --- opruimen ---------------------------------------------------------
  return function destroy() {
    if (gestopt) return;
    gestopt = true;
    win.clearTimeout(timer);
    opScroll.cancel(); opResize.cancel(); volg.cancel();
    win.removeEventListener('scroll', opScroll);
    win.removeEventListener('resize', opResize);
    win.removeEventListener('load', opScroll);
    win.removeEventListener('pointermove', opPointer);
    doc.documentElement.removeEventListener('mouseleave', opWeg);
    win.removeEventListener('blur', opWeg);
    el.removeEventListener('click', opKlik);
    mb.stop();
    el.replaceChildren(...orig.nodes);
    for (const a of ['data-sd-klaar', 'data-sd-pil', 'data-sd-aan', 'data-sd-wissel', 'data-sd-trek', 'data-sd-magneet', 'data-sd-sectie']) el.removeAttribute(a);
    for (const v of ['--sd-mx', '--sd-my', '--sd-ax', '--sd-ay']) el.style.removeProperty(v);
    if (!el.getAttribute('style')) el.removeAttribute('style');
    if (orig.href === null) el.removeAttribute('href'); else el.setAttribute('href', orig.href);
    if (orig.label === null) el.removeAttribute('aria-label'); else el.setAttribute('aria-label', orig.label);
    if (reserveer) {
      root.style.paddingBottom = origPad || '';
      if (!root.getAttribute('style')) root.removeAttribute('style');
    }
  };
}
