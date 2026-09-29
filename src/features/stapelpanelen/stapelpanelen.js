/**
 * stapelpanelen
 * ------------------------------------------------------------------------
 * 2-5 panelen (diensten, stappen) onder een kop. Tijdens het scrollen blijft
 * het blok staan (sticky): het open paneel schuift dicht terwijl het volgende
 * opengaat, gekoppeld aan de scrollpositie. De koppen blijven als tabs
 * zichtbaar. Na het laatste paneel scrolt de pagina gewoon door.
 *
 * Techniek: één getal, de voortgang p (0 = paneel 1 open, N-1 = laatste open).
 * Elk item staat op translateY = i*kop + H*clamp(i - p, 0, 1): de open
 * panelen stapelen zich boven, de wachtende onder, en een later item schuift
 * over het vorige heen (gordijn, geen herlayout van de tekst).
 *  - Route CSS: `animation-timeline: view()` op de wrapper animeert --sp-t
 *    (zie stapelpanelen.css). JS doet dan alleen de toegankelijkheid.
 *  - Route JS (terugval): dezelfde formule, --sp-t gezet vanuit één rAF per
 *    scrollframe, alleen zolang de wrapper in beeld is (IntersectionObserver).
 * Modi (data-sp-modus op root): `pin` (desktop), `uitklap` (mobiel: gewone
 * uitklapper), `open` (minder beweging, of mobiel met optie mobiel:'onder':
 * alles open onder elkaar). Zonder JS staat alles open (zelfde als `open`).
 *
 * Geen scroll-hijacking: de gebruiker scrolt zelf; de scrollhoogte is
 * gereserveerd (wrapper van N x svh). Herkomst: gedrag gezien bij
 * merkmotief.nl (GSAP ScrollTrigger pin+scrub); eigen implementatie zonder
 * GSAP en zonder hun code.
 *
 * @typedef {Object} StapelpanelenOpties
 * @property {number} [breakpoint=768] Onder deze breedte (px) geen pin.
 * @property {'uitklap'|'onder'} [mobiel='uitklap'] Gedrag onder het breakpoint.
 * @property {'auto'|'css'|'js'} [motor='auto'] 'auto' = CSS-scrolltimeline als de browser die kent, anders JS.
 * @property {number} [rust=0.2] Deel van elk scrollstuk (0-0.4) waarop een paneel blijft staan voordat het volgende beweegt.
 * @property {number} [minHoogte=520] Onder deze vensterhoogte (px) geen pin: de panelen passen dan niet.
 *
 * @param {Element} root Element met [data-sp-track] > [data-sp-stage] > [data-sp-item]*
 * @param {StapelpanelenOpties} [opties]
 * @returns {() => void} destroy - ruimt listeners, observers, attributen, stijlen en het live-element op. Idempotent.
 */
import { minderBeweging, perFrame, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';

const STANDAARD = { breakpoint: 768, mobiel: 'uitklap', motor: 'auto', rust: 0.2, minHoogte: 520 };
let teller = 0;

const klem = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/**
 * Voortgang p (0..n-1) bij scrollvoortgang t (0..1): per stuk een zachte
 * overgang met `rust` stilstand aan beide kanten.
 * @param {number} t @param {number} n @param {number} rust
 */
export function voortgang(t, n, rust = 0.2) {
  const u = klem(t) * (n - 1);
  const k = Math.min(Math.floor(u), n - 2);
  const f = klem((u - k - rust) / (1 - 2 * rust));
  return k + f * f * (3 - 2 * f);
}

/** Dezelfde curve als CSS `linear()`-easing, zodat de CSS-route exact meeloopt. */
function easingCss(n, rust) {
  const punten = [];
  for (let k = 0; k < n - 1; k++) {
    const fs = k === 0 ? [0] : [];
    fs.push(rust);
    for (let j = 1; j < 10; j++) fs.push(rust + ((1 - 2 * rust) * j) / 10);
    fs.push(1 - rust);
    if (k === n - 2) fs.push(1);
    for (const f of fs) {
      const t = (k + f) / (n - 1);
      punten.push(`${(voortgang(t, n, rust) / (n - 1)).toFixed(4)} ${(t * 100).toFixed(3)}%`);
    }
  }
  return `linear(${punten.join(', ')})`;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'stapelpanelen')) return () => {};
  const o = { ...STANDAARD, ...opties };
  o.rust = klem(Number(o.rust), 0, 0.4);
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const track = root.querySelector('[data-sp-track]');
  const stage = root.querySelector('[data-sp-stage]');
  const items = Array.from(root.querySelectorAll('[data-sp-item]')).filter(
    (el) => el.querySelector('[data-sp-knop]') && el.querySelector('[data-sp-paneel]'),
  );
  if (!track || !stage || items.length < 2) {
    console.warn('stapelpanelen: verwacht [data-sp-track] > [data-sp-stage] met minstens 2 [data-sp-item] (knop + paneel) - overgeslagen');
    return () => {};
  }
  const n = items.length;
  const knoppen = items.map((el) => el.querySelector('[data-sp-knop]'));
  const panelen = items.map((el) => el.querySelector('[data-sp-paneel]'));
  const titel = (i) => (knoppen[i].querySelector('[data-sp-titel]') || knoppen[i]).textContent.trim();

  // Alles wat we zetten, met zijn ongedaan-maker: destroy() hoeft niets te onthouden.
  const maakUndo = () => {
    const l = [];
    const gezien = new Map(); // per element+naam alleen de oorspronkelijke waarde onthouden
    const eerste = (el, naam) => {
      const set = gezien.get(el) || gezien.set(el, new Set()).get(el);
      if (set.has(naam)) return false;
      set.add(naam);
      return true;
    };
    return {
      attr(el, naam, waarde) {
        if (eerste(el, `a:${naam}`)) {
          const oud = el.getAttribute(naam);
          l.push(() => (oud === null ? el.removeAttribute(naam) : el.setAttribute(naam, oud)));
        }
        if (waarde === null) el.removeAttribute(naam); else el.setAttribute(naam, waarde);
      },
      stijl(el, naam, waarde) {
        if (eerste(el, `s:${naam}`)) {
          const oud = el.style.getPropertyValue(naam);
          l.push(() => { if (oud) el.style.setProperty(naam, oud); else el.style.removeProperty(naam); if (!el.getAttribute('style')) el.removeAttribute('style'); });
        }
        el.style.setProperty(naam, waarde);
      },
      doe(fn) { l.push(fn); },
      klaar() { while (l.length) l.pop()(); gezien.clear(); },
    };
  };
  const vast = maakUndo();
  let modusUndo = maakUndo();
  let klaar = false;
  let modus = '';
  let laatst = 0; // laatst actieve paneel: overleeft een wissel van modus

  const uid = ++teller;
  panelen.forEach((p, i) => { if (!p.id) vast.attr(p, 'id', `sp${uid}-p${i}`); });
  knoppen.forEach((k, i) => { if (!k.getAttribute('aria-controls')) vast.attr(k, 'aria-controls', panelen[i].id); });

  const live = doc.createElement('div');
  live.setAttribute('data-sp-live', '');
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  root.appendChild(live);
  vast.doe(() => live.remove());

  // --- modus kiezen ---------------------------------------------------------
  const mqKlein = win.matchMedia(`(max-width: ${o.breakpoint - 0.02}px), (max-height: ${o.minHoogte - 0.02}px)`);
  const cssKan = !!(win.CSS && win.CSS.supports && win.CSS.supports('animation-timeline: view()') && win.CSS.supports('animation-timing-function: linear(0, 1)'));
  let reduced = false;
  const kies = () => zet(reduced ? 'open' : mqKlein.matches ? (o.mobiel === 'onder' ? 'open' : 'uitklap') : 'pin');

  function zet(nieuw) {
    if (klaar || nieuw === modus) return;
    const vorige = modus;
    if (vorige === 'open') laatst = zichtbaarItem();
    modusUndo.klaar();
    modusUndo = maakUndo();
    modus = nieuw;
    vast.attr(root, 'data-sp-modus', nieuw);
    ({ pin: zetPin, uitklap: zetUitklap, open: zetOpen })[nieuw](modusUndo, vorige);
  }

  const luister = (u, el, type, fn, opt) => { el.addEventListener(type, fn, opt); u.doe(() => el.removeEventListener(type, fn, opt)); };

  // Welk item staat er bovenin beeld (voor als we uit 'open' komen)?
  const zichtbaarItem = () => {
    let k = 0;
    items.forEach((el, i) => { if (el.getBoundingClientRect().top <= win.innerHeight * 0.4) k = i; });
    return k;
  };
  // Bij een wissel de layout niet laten animeren, anders scrollen we naar een bewegend doel.
  const zonderAnimatie = (u) => {
    root.setAttribute('data-sp-wissel', '');
    const id = win.requestAnimationFrame(() => root.removeAttribute('data-sp-wissel'));
    u.doe(() => { win.cancelAnimationFrame(id); root.removeAttribute('data-sp-wissel'); });
  };

  // --- open: alles onder elkaar; een klik op de kop scrolt naar het paneel ---
  function zetOpen(u, vorige) {
    if (vorige) { zonderAnimatie(u); items[laatst].scrollIntoView({ block: 'start', behavior: 'instant' }); }
    knoppen.forEach((k, i) => luister(u, k, 'click', () => items[i].scrollIntoView({ block: 'start' })));
  }

  // --- uitklap: gewone uitklapper, één open -------------------------------
  function zetUitklap(u, vorige) {
    let open = vorige ? laatst : Math.max(0, items.findIndex((el) => el.hasAttribute('data-sp-open')));
    const toon = () => { if (open >= 0) laatst = open; items.forEach((el, i) => {
      const aan = i === open;
      u.attr(knoppen[i], 'aria-expanded', String(aan));
      u.attr(el, 'data-sp-open', aan ? '' : null);
      u.attr(panelen[i], 'inert', aan ? null : '');
    }); };
    if (vorige) zonderAnimatie(u);
    toon();
    if (vorige) items[open].scrollIntoView({ block: 'start', behavior: 'instant' });
    knoppen.forEach((k, i) => luister(u, k, 'click', () => { open = open === i ? -1 : i; toon(); }));
  }

  // --- pin: sticky blok, voortgang aan de scrollpositie ---------------------
  function zetPin(u, vorige) {
    const motor = o.motor === 'js' || !cssKan ? 'js' : 'css';
    u.attr(root, 'data-sp-motor', motor);
    u.stijl(root, '--sp-n', String(n));
    u.stijl(root, '--sp-ease', easingCss(n, o.rust));
    items.forEach((el, i) => u.stijl(el, '--sp-i', String(i)));
    if (motor === 'js') u.doe(() => stage.style.removeProperty('--sp-t'));

    const meet = () => {
      const r = track.getBoundingClientRect();
      const bereik = r.height - stage.offsetHeight;
      return { r, bereik, t: bereik > 0 ? klem(-r.top / bereik) : 0 };
    };
    let actief = -1;
    let ruwT = 0;
    let laatsteT = 0;
    const zetActief = (i, meld) => {
      if (i === actief) return;
      actief = i;
      laatst = i;
      knoppen.forEach((k, j) => {
        u.attr(k, 'aria-current', j === i ? 'true' : null);
        u.attr(k, 'aria-expanded', String(j === i));
        u.attr(items[j], 'data-sp-actief', j === i ? '' : null);
      });
      if (meld) live.textContent = `Paneel ${i + 1} van ${n}: ${titel(i)}`;
    };
    let eerste = true;
    const update = () => {
      const { r, bereik, t } = meet();
      ruwT = bereik > 0 ? -r.top / bereik : 0;
      laatsteT = t;
      const p = voortgang(t, n, o.rust);
      if (motor === 'js') stage.style.setProperty('--sp-t', String(p / (n - 1)));
      zetActief(Math.round(p), !eerste);
      eerste = false;
    };
    const opFrame = perFrame(update, doc);
    u.doe(() => opFrame.cancel());

    // Alleen luisteren zolang de wrapper (bijna) in beeld is.
    let luistert = false;
    const aan = () => { if (!luistert) { win.addEventListener('scroll', opFrame, { passive: true }); luistert = true; } };
    const uit = () => { if (luistert) { win.removeEventListener('scroll', opFrame); luistert = false; } };
    const stopIO = inBeeld(track, () => { aan(); update(); }, { once: false, rootMargin: '50% 0px', bijUit: () => { uit(); update(); } });
    u.doe(() => { stopIO(); uit(); });
    // Venster verandert (rotatie, verkleinen): de gereserveerde hoogte verandert mee, dus zet
    // de scrollpositie terug op dezelfde voortgang. Direct, vóór de scrollevents van die wissel.
    luister(u, win, 'resize', () => {
      if (ruwT >= 0 && ruwT <= 1) {
        const { r, bereik } = meet();
        win.scrollTo({ top: win.scrollY + r.top + bereik * laatsteT, behavior: 'instant' });
      }
      opFrame();
    }, { passive: true });

    const scrollNaar = (i, gedrag) => {
      const { r, bereik } = meet();
      win.scrollTo({ top: win.scrollY + r.top + bereik * (i / (n - 1)), behavior: gedrag });
    };
    knoppen.forEach((k, i) => luister(u, k, 'click', () => scrollNaar(i, 'smooth')));
    // Focus in een dicht paneel (Tab): pagina scrollt ernaartoe, dan is het open.
    luister(u, root, 'focusin', (e) => {
      const i = panelen.findIndex((p) => p.contains(e.target));
      if (i >= 0 && i !== actief) {
        scrollNaar(i, 'instant');
        // WebKit scrolt het gefocuste element ná dit event nog zelf in beeld en schiet dan een
        // paneel te ver door (gemeten 30-09: paneel 3 open bij focus in paneel 2). Eén frame
        // later nog eens op de juiste plek zetten.
        win.requestAnimationFrame(() => { if (panelen[i].contains(doc.activeElement)) scrollNaar(i, 'instant'); });
      }
    });
    if (vorige) scrollNaar(laatst, 'instant');
    update();
  }

  const rm = minderBeweging((r) => { reduced = r; kies(); }, doc);
  reduced = rm.reduced;
  const mqLuister = () => kies();
  mqKlein.addEventListener('change', mqLuister);
  kies();

  return function destroy() {
    if (klaar) return;
    klaar = true;
    rm.stop();
    mqKlein.removeEventListener('change', mqLuister);
    modusUndo.klaar();
    vast.klaar();
  };
}
