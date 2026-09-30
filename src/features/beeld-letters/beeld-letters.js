/**
 * beeld-letters
 * ------------------------------------------------------------------------
 * Een grote kop waarvan de letters gevuld zijn met een foto of video, met
 * optioneel een typemachine ("Creatie" -> "Ontwerp" -> "Beeld"), een eigen
 * knipperend cursorteken ("/") en een beeld dat langzaam meedrijft of met
 * de muis meebeweegt. Vanilla ES-module, 0 dependencies, SSR-veilig: raakt
 * window/document pas aan binnen `init()`.
 *
 * Techniek
 *  - Foto: `background-clip: text` op het woord. De tekst blijft echte,
 *    selecteerbare tekst; de terugvalkleur ligt als `background-color` onder
 *    de foto, dus faalt het beeld dan blijft de letter gekleurd (en dus leesbaar).
 *  - Video: `background-clip` kan geen video vullen. Daarom een blend-lus:
 *    de video ligt onder de kop, de kop is wit met zwarte tekst en
 *    `mix-blend-mode: screen` (zwart laat de video door, wit dekt af), en
 *    het hele blok wordt daarna met `multiply` op de pagina gelegd zodat
 *    het wit weer de paginakleur wordt. Gemeten gekozen boven een SVG-mask:
 *    een mask uit een SVG-afbeelding kan het webfont van de pagina niet
 *    gebruiken, dus de vorm zou niet met de echte tekst overeenkomen.
 *  - Typen: elk woord staat als onzichtbare "maat" in dezelfde gridcel, dus
 *    de breedte en hoogte van de kop zijn vast (geen layoutsprong).
 *  - Schermlezer: de volledige kop staat één keer in `.bl__sr`; alles wat
 *    visueel is (getypte laag, cursor, maten) zit in een `aria-hidden` laag.
 *
 * Herkomst: eigen implementatie van een getypte kop met beeld in de letters
 * (`background-clip: text`, cursor "/"), zonder typed.js.
 *
 * @typedef {Object} BeeldLettersOptions
 * @property {string[]} [woorden] Woorden om te typen (overschrijft `data-bl-woorden`, gescheiden door `|`). Het eerste woord is de tekst in de markup.
 * @property {string} [cursor="/"] Cursorteken; "" = geen cursor (overschrijft `data-bl-cursor`).
 * @property {number} [typSnelheid=95] ms per getypte letter.
 * @property {number} [wisSnelheid=55] ms per gewiste letter.
 * @property {number} [wachtNa=1800] ms stilstand als een woord af is.
 * @property {number} [wachtVoor=380] ms stilstand tussen wissen en typen.
 * @property {boolean} [lus=true] Na het laatste woord weer bij het eerste beginnen.
 * @property {number} [minContrast=3] Minimaal contrast (WCAG-verhouding) dat de vulling met de paginakleur moet halen voor >= 98% van de beeldpixels; 0 = uit. De module leest het beeld (en bij video af en toe een beeldje) en verhoogt zo nodig `--bl-donker`, de tint over het beeld. Grote kop = 3.
 * @property {'drijf'|'muis'|'uit'} [beweging] Beweging van het beeld in de letters (overschrijft `data-bl-beweging`; standaard 'uit').
 *
 * @param {Element} root Wrapper met `data-beeld-letters`, bevat de kop `[data-bl-kop]` (en bij video een `<video data-bl-video-bron>`).
 * @param {BeeldLettersOptions} [opties]
 * @returns {() => void} destroy — herstelt de oorspronkelijke markup. Idempotent.
 */
import { minderBeweging, isTouch, inBeeld, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

// --- contrast (WCAG 2.x) ---------------------------------------------------
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lumen = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const verhouding = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const getallen = (str, n) => (String(str).match(/[\d.]+/g) || []).slice(0, n).map(Number);

/** Kleinste tint-sterkte (>= basis, in stappen van 0,025) waarbij >= 98% van de pixels `min` haalt tegen `bg`. */
function nodigeTint(data, bg, tint, kleurMultiply, min, basis) {
  const doel = min * 1.05; // 5% marge (antialiasing, subpixel): antialiasing en subpixel-verschuivingen
  const lb = lumen(bg[0], bg[1], bg[2]);
  for (let a = basis; a <= 0.9001; a += 0.025) {
    let ok = 0; let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      let c = [0, 1, 2].map((k) => data[i + k] * (1 - a) + tint[k] * a);
      if (kleurMultiply) c = c.map((v, k) => (v * bg[k]) / 255);
      n++;
      if (verhouding(lb, lumen(c[0], c[1], c[2])) >= doel) ok++;
    }
    if (ok / n >= 0.98) return a;
  }
  return 0.9;
}


export function init(root, opties = {}) {
  if (!vereisRoot(root, 'beeld-letters')) return () => {};
  const kop = root.querySelector('[data-bl-kop]');
  if (!kop) {
    if (typeof console !== 'undefined') console.warn('beeld-letters: geen [data-bl-kop] gevonden — overgeslagen');
    return () => {};
  }
  if (kop.hasAttribute('data-bl-ready')) return () => {}; // al geïnitialiseerd

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const volleTekst = kop.textContent.replace(/\s+/g, ' ').trim();
  const woordEl = kop.querySelector('[data-bl-woord]');
  const eersteWoord = (woordEl || kop).textContent.replace(/\s+/g, ' ').trim();

  const attrWoorden = (root.getAttribute('data-bl-woorden') || '').split('|').map((s) => s.trim()).filter(Boolean);
  let woorden = opties.woorden || attrWoorden;
  if (woorden[0] !== eersteWoord) woorden = [eersteWoord, ...woorden.filter((w) => w !== eersteWoord)];
  const typen = woorden.length > 1;

  const cursor = opties.cursor ?? root.getAttribute('data-bl-cursor') ?? '/';
  const typSnelheid = opties.typSnelheid ?? 95;
  const wisSnelheid = opties.wisSnelheid ?? 55;
  const wachtNa = opties.wachtNa ?? 1800;
  const wachtVoor = opties.wachtVoor ?? 380;
  const lus = opties.lus ?? true;
  const beweging = opties.beweging ?? root.getAttribute('data-bl-beweging') ?? 'uit';
  const video = root.querySelector('video[data-bl-video-bron]');
  const minContrast = opties.minContrast ?? Number(root.getAttribute('data-bl-min-contrast') ?? 3);

  // --- DOM: [sr-tekst][aria-hidden laag met het echte, zichtbare woord] ---
  const oorspronkelijk = Array.from(kop.childNodes);
  const oudeWoordInhoud = woordEl ? Array.from(woordEl.childNodes) : null;

  const sr = doc.createElement('span');
  sr.className = 'bl__sr';
  sr.textContent = volleTekst;

  const zicht = doc.createElement('span');
  zicht.className = 'bl__zicht';
  zicht.setAttribute('aria-hidden', 'true');
  for (const n of oorspronkelijk) zicht.appendChild(n);

  const doel = woordEl || zicht; // dit element krijgt de beeldvulling (foto)
  const teVerwijderen = [];
  let typEl = null;
  let volgCursor = null;
  let zetX = () => {};
  if (typen) {
    // De echte woordtekst wordt vervangen door: onzichtbare maten + de getypte lijn.
    while (doel.firstChild) doel.removeChild(doel.firstChild);
    const grid = doc.createElement('span');
    grid.className = 'bl__grid';
    for (const w of woorden) {
      const m = doc.createElement('span');
      m.className = 'bl__maat';
      m.textContent = w;
      grid.appendChild(m);
    }
    const lijn = doc.createElement('span');
    lijn.className = 'bl__lijn';
    typEl = doc.createElement('span');
    typEl.className = 'bl__typ';
    typEl.textContent = woorden[0];
    lijn.appendChild(typEl);
    if (cursor) {
      const c = doc.createElement('span');
      c.className = 'bl__cursor';
      lijn.appendChild(c);
      // De cursor staat absoluut op de lijn en schuift met een transform mee met de
      // tekstbreedte: een cursor die gewoon achter de tekst in de flow staat verspringt
      // bij elke letter en telt dan als layout-shift (gemeten: CLS 0,3 in 5 s).
      if (win.ResizeObserver) {
        zetX = () => lijn.style.setProperty('--bl-x', `${typEl.getBoundingClientRect().width}px`);
        volgCursor = new win.ResizeObserver(zetX);
        volgCursor.observe(typEl);
      }
    }
    grid.appendChild(lijn);
    doel.appendChild(grid);
    teVerwijderen.push(grid);
  }
  if (cursor) kop.style.setProperty('--bl-cursor', JSON.stringify(cursor));
  doel.classList.add('bl__vul');

  kop.appendChild(sr);
  kop.appendChild(zicht);
  kop.setAttribute('data-bl-ready', '');
  root.setAttribute('data-bl-actief', '');
  if (beweging !== 'uit') doel.setAttribute('data-bl-beweging', beweging);

  // --- typemachine ---------------------------------------------------------
  let destroyed = false;
  let timer = 0;
  let i = 0;
  let fase = 'wacht'; // wacht | wis | typ
  let tekst = woorden[0];
  let inZicht = true;
  let tabZichtbaar = doc.visibilityState !== 'hidden';
  const mb = minderBeweging((r) => { stil = r; if (r) naEerste(); sync(); }, doc);
  let stil = mb.reduced; // basis.js geeft `reduced` als momentopname; live volgen we zelf

  const teken = () => { if (typEl) { typEl.textContent = tekst; zetX(); } };
  const staat = (s) => root.setAttribute('data-bl-staat', s);
  const plan = (ms) => { timer = win.setTimeout(tik, ms); };

  function tik() {
    timer = 0;
    if (destroyed) return;
    if (fase === 'wacht') {
      if (!lus && i === woorden.length - 1) { staat('klaar'); return; }
      fase = 'wis';
    }
    const letters = Array.from(tekst);
    if (fase === 'wis') {
      staat('wissen');
      if (letters.length > 0) { tekst = letters.slice(0, -1).join(''); teken(); return plan(wisSnelheid); }
      i = (i + 1) % woorden.length;
      fase = 'typ';
      return plan(wachtVoor);
    }
    const eind = Array.from(woorden[i]);
    staat('typen');
    if (letters.length < eind.length) { tekst = eind.slice(0, letters.length + 1).join(''); teken(); return plan(typSnelheid); }
    fase = 'wacht';
    staat('wacht');
    plan(wachtNa);
  }

  // Bij minder beweging staat het eerste woord er volledig (en blijft).
  function naEerste() {
    if (timer) { win.clearTimeout(timer); timer = 0; }
    i = 0; fase = 'wacht'; tekst = woorden[0]; teken();
  }

  function sync() {
    const mag = typen && inZicht && tabZichtbaar && !stil;
    if (mag && !timer) { staat(fase === 'wacht' ? 'wacht' : fase === 'wis' ? 'wissen' : 'typen'); plan(fase === 'wacht' ? wachtNa : 150); }
    else if (!mag) {
      if (timer) { win.clearTimeout(timer); timer = 0; }
      staat(stil ? 'stil' : 'pauze');
    }
    doel.toggleAttribute('data-bl-pauze', !(inZicht && tabZichtbaar));
    doel.toggleAttribute('data-bl-stil', stil);
    speelVideo();
  }

  // --- video: lui laden (R17), spelen alleen in beeld en zonder reduced ----
  let videoGeladen = false;
  let videoStop = () => {};
  function speelVideo() {
    if (!video) return;
    const mag = inZicht && tabZichtbaar && !stil;
    if (mag && videoGeladen) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
    else if (!mag) video.pause();
  }
  const bijFout = () => root.setAttribute('data-bl-video-fout', '');
  if (video) {
    video.addEventListener('error', bijFout);
    videoStop = inBeeld(root, () => {
      if (!videoGeladen) {
        const klein = win.matchMedia && win.matchMedia('(max-width: 640px)').matches;
        const src = (klein && video.getAttribute('data-bl-src-mobiel')) || video.getAttribute('data-bl-src');
        if (src) { video.src = src; videoGeladen = true; }
      }
      speelVideo();
    }, { once: false, rootMargin: '600px 0px' });
  }

  // --- pauzeren buiten beeld / verborgen tabblad ---------------------------
  const stopIo = inBeeld(kop, (e) => { inZicht = e.isIntersecting; sync(); }, {
    once: false,
    threshold: 0.05,
    bijUit: () => { inZicht = false; sync(); },
  });
  const opZichtbaar = () => { tabZichtbaar = doc.visibilityState !== 'hidden'; sync(); };
  doc.addEventListener('visibilitychange', opZichtbaar);

  // --- muis: beeld beweegt mee (alleen met muis, R3) -------------------------
  let stopMuis = () => {};
  if (beweging === 'muis' && !isTouch(doc)) {
    const zet = perFrame((x, y) => {
      const r = kop.getBoundingClientRect();
      const px = Math.max(0, Math.min(1, (x - r.left) / (r.width || 1)));
      const py = Math.max(0, Math.min(1, (y - r.top) / (r.height || 1)));
      doel.style.setProperty('--bl-px', String(px));
      doel.style.setProperty('--bl-py', String(py));
    }, doc);
    const bijMuis = (e) => zet(e.clientX, e.clientY);
    doc.addEventListener('pointermove', bijMuis, { passive: true });
    stopMuis = () => { doc.removeEventListener('pointermove', bijMuis); zet.cancel(); };
  }

  // --- contrast bewaken (R16): de vulling zelf, niet alleen de terugvalkleur ------
  // Over het beeld ligt een tint (`--bl-donker`, kleur `--bl-tint`). De CSS heeft een
  // veilige standaard; hier meten we het echte beeld (en bij video af en toe een
  // beeldje) en verhogen de tint zo nodig. Alleen omhoog, nooit weer omlaag: geen geflikker.
  let tintNu = -1;
  let stopContrast = () => {};
  if (minContrast > 0) {
    const tintEl = video ? root : doel;
    const cs = win.getComputedStyle(tintEl);
    const tint = getallen(cs.getPropertyValue('--bl-tint') || '24 12 6', 3);
        let bg = [255, 255, 255];
    for (let el = root.parentElement; el; el = el.parentElement) {
      const c = win.getComputedStyle(el).backgroundColor;
      const v = getallen(c, 4);
      if (v.length >= 3 && (v[3] === undefined || v[3] > 0.99)) { bg = v.slice(0, 3); break; }
    }
    const lees = (bron) => {
      try {
        const cv = doc.createElement('canvas'); cv.width = 96; cv.height = 54;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        cx.drawImage(bron, 0, 0, 96, 54);
        return cx.getImageData(0, 0, 96, 54).data;
      } catch { return null; } // beeld van een ander domein zonder CORS: de CSS-standaard blijft gelden
    };
    const pas = (data) => {
      if (!data || destroyed) return;
      const a = nodigeTint(data, bg, tint, !!video, minContrast, Math.max(0, tintNu));
      if (a > tintNu) { tintNu = a; tintEl.style.setProperty('--bl-donker', a.toFixed(2)); }
    };
    const laadBeeld = (url) => {
      if (!url) return;
      const img = new win.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => pas(lees(img));
      img.src = url;
    };
    const opDoek = [];
    if (video) {
      laadBeeld(video.getAttribute('poster'));
      let laatst = 0;
      const frame = () => {
        const nu = win.performance.now();
        if (video.readyState < 2 || nu - laatst < 700) return;
        laatst = nu; pas(lees(video));
      };
      for (const ev of ['loadeddata', 'timeupdate']) { video.addEventListener(ev, frame); opDoek.push([ev, frame]); }
    } else {
      const m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(cs.getPropertyValue('--bl-beeld') || '');
      if (m) laadBeeld(new URL(m[1], doc.baseURI).href);
    }
    stopContrast = () => { for (const [ev, f] of opDoek) video.removeEventListener(ev, f); tintEl.style.removeProperty('--bl-donker'); };
  }

  sync();

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (timer) win.clearTimeout(timer);
    stopIo(); videoStop(); stopMuis();
    if (volgCursor) volgCursor.disconnect();
    stopContrast();
    doc.removeEventListener('visibilitychange', opZichtbaar);
    mb.stop();
    if (video) { video.removeEventListener('error', bijFout); video.pause(); }
    for (const n of teVerwijderen) n.remove();
    if (oudeWoordInhoud) for (const n of oudeWoordInhoud) woordEl.appendChild(n);
    for (const n of oorspronkelijk) kop.appendChild(n);
    sr.remove(); zicht.remove();
    doel.classList.remove('bl__vul');
    if (!doel.getAttribute('class')) doel.removeAttribute('class');
    for (const a of ['data-bl-beweging', 'data-bl-pauze', 'data-bl-stil']) doel.removeAttribute(a);
    doel.style.removeProperty('--bl-px'); doel.style.removeProperty('--bl-py');
    kop.style.removeProperty('--bl-cursor');
    if (!kop.getAttribute('style')) kop.removeAttribute('style');
    if (doel.getAttribute('style') === '') doel.removeAttribute('style');
    kop.removeAttribute('data-bl-ready');
    for (const a of ['data-bl-actief', 'data-bl-staat', 'data-bl-video-fout']) root.removeAttribute(a);
  };
}
