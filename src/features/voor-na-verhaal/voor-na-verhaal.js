/**
 * voor-na-verhaal
 * ------------------------------------------------------------------------
 * Het werk van de klant in 2-6 stappen (voor, tussenstappen, na). Het blok
 * blijft staan (sticky) terwijl de bezoeker scrolt; de foto gaat rustig van
 * stap naar stap met een crossfade of een zachte wisveeg, met per stap één
 * korte zin. Op elk moment kan de bezoeker ook zelf slepen of toetsen
 * tussen voor en na (schuif met role="slider") of een stap aanklikken.
 *
 * Techniek: één getal, de voortgang p (0 = eerste foto, N-1 = laatste).
 *  - De scrollpositie in een gereserveerd "spoor" (hoogte in svh per stap)
 *    bepaalt p. Het spoor is gewoon paginahoogte: geen scroll-kaping, de
 *    bezoeker scrolt zelf en kan altijd door.
 *  - De schuif, de pijltjestoetsen en de stapknoppen zetten de pagina op de
 *    scrollpositie die bij hun p hoort. Zo is er één bron van waarheid en
 *    lopen schuif en scroll nooit uiteen.
 *  - Elke foto krijgt --vnv-q (0..1); de CSS maakt daar opacity (fade) of
 *    een transform (veeg) van. Alleen transform en opacity bewegen (R18).
 *  - p loopt met een zachte inhaalbeweging naar de scrollstand (alleen zolang
 *    er iets te doen is), niets beweegt vanzelf zonder dat de bezoeker iets doet.
 * Zonder JS staan alle stappen als gewone figuren onder elkaar. Bij minder
 * beweging wisselen de stappen direct; de schuif blijft werken.
 *
 * Herkomst: idee van de oude vergelijk-slider (images/image-comparison-slider)
 * en van voor-na-verhalen op bouw- en tuinsites; eigen code.
 *
 * @typedef {Object} VoorNaOpties
 * @property {'fade'|'veeg'} [overgang='fade'] Crossfade of zachte wisveeg (links naar rechts).
 * @property {boolean} [schuif=true] Toon de schuif (role="slider") onder de foto.
 * @property {number} [scrollLengte=70] Scrollruimte per stap, in svh (1 = 1% van de schermhoogte). Per figuur te overschrijven met data-vnv-scroll-lengte.
 * @property {number} [overgangsdeel=0.55] Deel (0,15-1) van die scrollruimte waarin de overgang loopt; de rest staat de stap stil.
 * @property {string} [titel] Kleine regel boven de foto (bijv. "Tuin Zuiderpark, Deventer"). Ook via data-vnv-titel.
 * @property {(index: number, figuur: Element) => void} [opStap] Wordt aangeroepen als de getoonde stap wisselt.
 * @property {string} [stapSelector='[data-vnv-stap]'] Selector voor de stap-figuren binnen de root.
 */
import { minderBeweging, perFrame, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';

const DEFAULTS = {
  overgang: 'fade',
  schuif: true,
  scrollLengte: 70,
  overgangsdeel: 0.55,
  stapSelector: '[data-vnv-stap]',
};

const noop = () => {};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function leesData(root) {
  const d = root.dataset;
  const r = {};
  if (d.vnvOvergang) r.overgang = d.vnvOvergang;
  if (d.vnvSchuif) r.schuif = d.vnvSchuif !== 'false';
  if (d.vnvScrollLengte && Number(d.vnvScrollLengte) > 0) r.scrollLengte = Number(d.vnvScrollLengte);
  if (d.vnvOvergangsdeel && Number(d.vnvOvergangsdeel) > 0) r.overgangsdeel = Number(d.vnvOvergangsdeel);
  if (d.vnvTitel) r.titel = d.vnvTitel;
  return r;
}

function schoon(o) {
  const r = {};
  for (const k of Object.keys(o || {})) if (o[k] !== undefined && o[k] !== null) r[k] = o[k];
  return r;
}

/**
 * @param {Element} root Sectie met de stap-figuren erin.
 * @param {VoorNaOpties} [opties]
 * @returns {() => void} destroy
 */
export function init(root, opties = {}) {
  if (!vereisRoot(root, 'voor-na-verhaal')) return noop;
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (root.hasAttribute('data-vnv-klaar')) {
    console.warn('voor-na-verhaal: root is al geïnitialiseerd — overgeslagen');
    return noop;
  }
  const opt = { ...DEFAULTS, ...leesData(root), ...schoon(opties) };
  if (opt.overgang !== 'veeg') opt.overgang = 'fade';
  const figs = Array.from(root.querySelectorAll(opt.stapSelector));
  if (figs.length < 2) {
    console.warn('voor-na-verhaal: minstens 2 stap-figuren nodig — overgeslagen');
    return noop;
  }
  const N = figs.length;
  const ramp = clamp(Number(opt.overgangsdeel) || 0.55, 0.15, 1);

  // --- scrollruimte per stap (svh) en cumulatieve start ---------------------
  const L = figs.map((f) => {
    const v = Number(f.dataset.vnvScrollLengte);
    return v > 0 ? v : Number(opt.scrollLengte) > 0 ? Number(opt.scrollLengte) : 70;
  });
  const A = [];
  let som = 0;
  for (let i = 0; i < N; i++) { A.push(som); som += L[i]; }

  // --- teksten -------------------------------------------------------------
  const stappen = figs.map((f, i) => {
    const cap = f.querySelector('figcaption');
    const img = f.querySelector('img');
    const tekst = ((cap && cap.textContent) || (img && img.getAttribute('alt')) || '').replace(/\s+/g, ' ').trim();
    const m = tekst.match(/^(.{1,28}?)\s[—–-]\s(.+)$/);
    const eigen = (f.dataset.vnvLabel || '').trim();
    const label = eigen || (m ? m[1] : `Stap ${i + 1}`);
    const zin = m ? m[2] : tekst;
    return { label, zin, volledig: tekst || label };
  });

  // --- DOM bouwen (alleen als JS draait; destroy zet alles terug) ---------
  const el = (tag, cls, attrs) => {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (const k of Object.keys(attrs)) e.setAttribute(k, attrs[k]);
    return e;
  };
  const spoor = el('div', 'vnv-spoor');
  spoor.style.setProperty('--vnv-som', String(som));
  const pin = el('div', 'vnv-pin');
  spoor.appendChild(pin);
  if (opt.titel) {
    const t = el('p', 'vnv-titel', { 'aria-hidden': 'true' });
    t.textContent = opt.titel;
    pin.appendChild(t);
  }
  const podium = el('div', 'vnv-podium');
  pin.appendChild(podium);
  const lijn = el('span', 'vnv-lijn', { 'aria-hidden': 'true' });
  const greep = el('span', 'vnv-greep');
  lijn.appendChild(greep);
  podium.appendChild(lijn);
  const kaart = el('div', 'vnv-kaart', { 'aria-hidden': 'true' });
  const kaartStappen = stappen.map((s, i) => {
    const d = el('p', 'vnv-kaart__stap');
    const k = el('span', 'vnv-kaart__kop');
    k.textContent = s.label;
    const z = el('span', 'vnv-kaart__zin');
    z.textContent = s.zin;
    d.append(k, z);
    kaart.appendChild(d);
    return d;
  });
  podium.appendChild(kaart);

  const bediening = el('div', 'vnv-bediening');
  pin.appendChild(bediening);
  let schuifEl = null;
  let baan = null;
  const tikken = [];
  if (opt.schuif !== false) {
    schuifEl = el('div', 'vnv-schuif', {
      role: 'slider',
      tabindex: '0',
      'aria-orientation': 'horizontal',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '0',
      'aria-label': 'Van voor naar na: sleep, of gebruik de pijltjestoetsen',
    });
    baan = el('span', 'vnv-baan', { 'aria-hidden': 'true' });
    baan.appendChild(el('span', 'vnv-rail'));
    baan.appendChild(el('span', 'vnv-vulling'));
    for (let i = 0; i < N; i++) {
      const t = el('span', 'vnv-tik');
      t.style.left = `${(i / (N - 1)) * 100}%`;
      baan.appendChild(t);
      tikken.push(t);
    }
    baan.appendChild(el('span', 'vnv-duim'));
    schuifEl.appendChild(baan);
    bediening.appendChild(schuifEl);
  }
  const nav = el('nav', 'vnv-punten', { 'aria-label': 'Stappen' });
  const knoppen = stappen.map((s, i) => {
    const b = el('button', 'vnv-punt', { type: 'button', 'data-vnv-punt': String(i), title: s.volledig });
    b.textContent = s.label;
    b.style.left = `${(i / (N - 1)) * 100}%`;
    if (i === 0) b.setAttribute('data-vnv-rand', 'begin');
    else if (i === N - 1) b.setAttribute('data-vnv-rand', 'eind');
    nav.appendChild(b);
    return b;
  });
  bediening.appendChild(nav);

  // Figuren verhuizen naar het podium; een commentaar-markering onthoudt de plek.
  const markers = figs.map((f) => {
    const m = doc.createComment('vnv');
    f.parentNode.insertBefore(m, f);
    return m;
  });
  markers[0].parentNode.insertBefore(spoor, markers[0]);
  figs.forEach((f, i) => {
    f.style.setProperty('--vnv-i', String(i + 1));
    podium.insertBefore(f, lijn);
  });
  const oudeOvergang = root.getAttribute('data-vnv-overgang');
  // Geen spookbeeld: de browser mag de foto's niet als losse afbeelding meesleuren.
  const oudDrag = figs.map((f) => { const i = f.querySelector('img'); const v = i ? i.getAttribute('draggable') : null; if (i) i.setAttribute('draggable', 'false'); return v; });
  root.setAttribute('data-vnv-klaar', '');
  root.setAttribute('data-vnv-overgang', opt.overgang);

  // --- toestand ---------------------------------------------------------------
  let alive = true;
  let reduced = false;
  let zichtbaar = false;
  let target = 0; // p volgens scroll/schuif
  let vis = 0; // p zoals getoond (loopt zacht achter target aan)
  let actief = -1;
  let raf = 0;
  let lastT = 0;
  let sleep = false;
  const qs = new Array(N).fill(-1);

  const pVanScroll = (s) => {
    let p = 0;
    for (let k = 1; k < N; k++) p += clamp((s - A[k]) / (L[k] * ramp), 0, 1);
    // binnen een halve pixel van een hele stap telt als die stap (scroll rondt af op pixels)
    return Math.abs(p - Math.round(p)) < 0.012 ? Math.round(p) : p;
  };
  const scrollVanP = (p) => {
    p = clamp(p, 0, N - 1);
    if (p <= 0) return 0;
    const k = clamp(Math.ceil(p), 1, N - 1);
    return A[k] + (p - (k - 1)) * L[k] * ramp;
  };

  const maat = () => {
    const r = spoor.getBoundingClientRect();
    const top = parseFloat(win.getComputedStyle(pin).top) || 0;
    const svhPx = (pin.offsetHeight + top) / 100;
    return { r, top, svhPx };
  };

  const zetActief = (a) => {
    if (a === actief) return;
    actief = a;
    root.setAttribute('data-vnv-actief', String(a));
    kaartStappen.forEach((d, i) => d.toggleAttribute('data-actief', i === a));
    knoppen.forEach((b, i) => {
      if (i === a) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    root.dispatchEvent(new win.CustomEvent('vnv:stap', { bubbles: true, detail: { index: a, figuur: figs[a] } }));
    if (typeof opt.opStap === 'function') {
      try { opt.opStap(a, figs[a]); } catch (e) { console.warn('voor-na-verhaal: opStap gooide', e); }
    }
  };

  const toon = (pv) => {
    let bezig = 0;
    for (let i = 1; i < N; i++) {
      let q = reduced ? (pv >= i - 0.5 ? 1 : 0) : clamp(pv - (i - 1), 0, 1);
      q = Math.round(q * 1000) / 1000;
      if (q !== qs[i]) { qs[i] = q; figs[i].style.setProperty('--vnv-q', String(q)); }
      if (q > 0 && q < 1) bezig = q;
    }
    podium.style.setProperty('--vnv-lq', String(bezig));
    podium.toggleAttribute('data-vnv-bezig', bezig > 0);
    root.setAttribute('data-vnv-p', String(Math.round(pv * 100) / 100));
    zetActief(clamp(Math.round(pv), 0, N - 1));
  };

  const zetWaarde = (p) => {
    const v = p / (N - 1);
    bediening.style.setProperty('--vnv-v', String(Math.round(v * 1000) / 1000));
    tikken.forEach((t, i) => t.toggleAttribute('data-gepasseerd', i <= p + 1e-6));
    if (schuifEl) {
      const a = clamp(Math.round(p), 0, N - 1);
      schuifEl.setAttribute('aria-valuenow', String(Math.round(v * 100)));
      schuifEl.setAttribute('aria-valuetext', `${stappen[a].volledig} (stap ${a + 1} van ${N})`);
    }
  };

  const tick = (t) => {
    raf = 0;
    if (!alive) return;
    const dt = lastT ? Math.min(64, t - lastT) : 16;
    lastT = t;
    if (reduced) vis = target;
    else {
      vis += (target - vis) * (1 - Math.exp(-dt / 120));
      if (Math.abs(target - vis) < 0.002) vis = target;
    }
    toon(vis);
    if (vis !== target) raf = win.requestAnimationFrame(tick);
    else lastT = 0;
  };
  const kick = () => { if (!raf && alive) raf = win.requestAnimationFrame(tick); };

  // Na een schuifactie is de scrollpositie in sommige engines (WebKit) nog niet bijgewerkt of loopt
  // ze een stap achter; zolang houdt de schuifwaarde de leiding en lezen we de scroll niet terug.
  let houdTot = 0;
  let houdTimer = 0;
  const meet = () => {
    if (!alive) return;
    const rest = houdTot - Date.now();
    if (sleep || rest > 0) {
      win.clearTimeout(houdTimer);
      houdTimer = win.setTimeout(meet, sleep ? 120 : rest + 10);
      return;
    }
    const { r, top, svhPx } = maat();
    if (!svhPx) return;
    target = pVanScroll((top - r.top) / svhPx);
    zetWaarde(target);
    kick();
  };
  const opScroll = perFrame(() => { if (zichtbaar) meet(); }, doc);

  const gaNaar = (p, glad) => {
    p = clamp(p, 0, N - 1);
    const { r, top, svhPx } = maat();
    if (!svhPx) return;
    const y = win.scrollY + r.top - top + scrollVanP(p) * svhPx;
    try {
      win.scrollTo({ top: y, behavior: glad && !reduced ? 'smooth' : 'instant' });
    } catch { win.scrollTo(0, y); }
  };

  // --- schuif, toetsen, knoppen -------------------------------------------------
  const cleanups = [];
  const on = (node, type, fn, o) => {
    node.addEventListener(type, fn, o);
    cleanups.push(() => node.removeEventListener(type, fn, o));
  };

  const vanX = (x) => {
    const r = baan.getBoundingClientRect();
    return clamp((x - r.left) / (r.width || 1), 0, 1) * (N - 1);
  };
  const stuur = (p) => {
    houdTot = Date.now() + 250;
    target = clamp(p, 0, N - 1);
    zetWaarde(target);
    kick();
    gaNaar(target, false);
  };

  if (schuifEl) {
    on(schuifEl, 'pointerdown', (e) => {
      if (e.button > 0) return;
      // WebKit ziet een tweede druk vlak na een klik als dubbelklik en start dan zijn eigen sleep:
      // daarna komen er geen pointermove/pointerup meer binnen (gemeten 29-09). Standaardgedrag tegenhouden.
      e.preventDefault();
      sleep = true;
      try { schuifEl.setPointerCapture(e.pointerId); } catch { /* niets */ }
      schuifEl.focus({ preventScroll: true });
      schuifEl.setAttribute('data-sleept', '');
      stuur(vanX(e.clientX));
    });
    on(schuifEl, 'pointermove', (e) => { if (sleep) stuur(vanX(e.clientX)); });
    const los = (e) => {
      if (!sleep) return;
      sleep = false;
      schuifEl.removeAttribute('data-sleept');
      stuur(target); // laatste stand nog eens vastzetten
      try { schuifEl.releasePointerCapture(e.pointerId); } catch { /* niets */ }
    };
    on(schuifEl, 'pointerup', los);
    on(schuifEl, 'pointercancel', los);
    on(schuifEl, 'keydown', (e) => {
      const pct = Math.round((target / (N - 1)) * 100);
      let p = null;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowUp': p = ((pct + 5) / 100) * (N - 1); break;
        case 'ArrowLeft': case 'ArrowDown': p = ((pct - 5) / 100) * (N - 1); break;
        case 'PageUp': p = Math.floor(target + 1e-6) + 1; break;
        case 'PageDown': p = Math.ceil(target - 1e-6) - 1; break;
        case 'Home': p = 0; break;
        case 'End': p = N - 1; break;
        default: return;
      }
      e.preventDefault();
      stuur(p);
    });
  }
  // De greep op de foto (alleen bij 'veeg') sleept dezelfde overgang als de schuif, via dezelfde stuur().
  {
    let stap = 1;
    const vanFoto = (x) => {
      const r = podium.getBoundingClientRect();
      return stap - 1 + clamp((x - r.left) / (r.width || 1), 0, 1);
    };
    on(greep, 'pointerdown', (e) => {
      if (e.button > 0) return;
      e.preventDefault();
      sleep = true;
      stap = clamp(Math.ceil(target - 1e-6), 1, N - 1);
      try { greep.setPointerCapture(e.pointerId); } catch { /* niets */ }
      stuur(vanFoto(e.clientX));
    });
    on(greep, 'pointermove', (e) => { if (sleep && greep.hasPointerCapture && greep.hasPointerCapture(e.pointerId)) stuur(vanFoto(e.clientX)); });
    const los2 = (e) => {
      if (!sleep) return;
      sleep = false;
      stuur(target);
      try { greep.releasePointerCapture(e.pointerId); } catch { /* niets */ }
    };
    on(greep, 'pointerup', los2);
    on(greep, 'pointercancel', los2);
  }
  knoppen.forEach((b, i) => on(b, 'click', () => gaNaar(i, true)));

  // --- meten, luisteren ---------------------------------------------------------
  const meetBaan = () => { if (baan) bediening.style.setProperty('--vnv-w', `${baan.clientWidth}px`); };
  meetBaan();
  const onResize = perFrame(() => { meetBaan(); meet(); }, doc);
  on(win, 'resize', onResize, { passive: true });
  on(win, 'scroll', opScroll, { passive: true });
  let ro = null;
  if (baan && 'ResizeObserver' in win) { ro = new win.ResizeObserver(() => meetBaan()); ro.observe(baan); }

  const stopBeeld = inBeeld(spoor, () => { zichtbaar = true; meet(); }, {
    once: false, rootMargin: '200px 0px', bijUit: () => { zichtbaar = false; meet(); },
  });

  const mb = minderBeweging((r) => {
    reduced = r;
    root.toggleAttribute('data-vnv-minder', r);
    meet();
    toon(vis);
  }, doc);
  reduced = mb.reduced;
  root.toggleAttribute('data-vnv-minder', reduced);

  // Startstand direct, zonder inhaalbeweging.
  {
    const { r, top, svhPx } = maat();
    target = svhPx ? pVanScroll((top - r.top) / svhPx) : 0;
    vis = target;
    zetWaarde(target);
    toon(vis);
  }

  // --- opruimen ---------------------------------------------------------------------
  return function destroy() {
    if (!alive) return;
    alive = false;
    if (raf) win.cancelAnimationFrame(raf);
    win.clearTimeout(houdTimer);
    opScroll.cancel();
    onResize.cancel();
    stopBeeld();
    mb.stop();
    if (ro) ro.disconnect();
    cleanups.forEach((f) => f());
    figs.forEach((f, i) => {
      f.style.removeProperty('--vnv-q');
      f.style.removeProperty('--vnv-i');
      markers[i].parentNode.insertBefore(f, markers[i]);
      markers[i].remove();
    });
    spoor.remove();
    ['data-vnv-klaar', 'data-vnv-actief', 'data-vnv-p', 'data-vnv-minder']
      .forEach((a) => root.removeAttribute(a));
    figs.forEach((f, i) => {
      const im = f.querySelector('img');
      if (!im) return;
      if (oudDrag[i] === null) im.removeAttribute('draggable'); else im.setAttribute('draggable', oudDrag[i]);
    });
    if (oudeOvergang === null) root.removeAttribute('data-vnv-overgang');
    else root.setAttribute('data-vnv-overgang', oudeOvergang);
  };
}
