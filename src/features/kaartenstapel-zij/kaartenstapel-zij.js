/**
 * kaartenstapel-zij
 * ------------------------------------------------------------------------
 * Een rij kaarten (processtappen of teamleden) die vastpint terwijl je
 * scrolt. Kaart 2, 3, 4 … schuiven één voor één zijwaarts over kaart 1
 * heen; de kaart eronder wordt 25 % donkerder, en zodra een kaart op de
 * stapel ligt veert zijn knop uit (`clip-path: inset()` met een overshoot).
 * Variant `team` heeft geen knoppen.
 *
 * Techniek: sticky + één getal τ (tijdlijn-positie) uit de scrollpositie.
 * Kaart k (k ≥ 1) beweegt tijdens [start + (k-1)·interval, … + duur].
 * Kaart j staat op translateX = -Σ_{k=1..j} ease(p_k) · (x_k − x_{k-1}),
 * dus de hele rij rechts van de bewegende kaart schuift mee en een kaart
 * die geland is ligt precies op x_0. Een korte naloop (exponentieel, geen
 * GSAP-scrub) maakt het zacht zonder achter te lopen.
 *
 * Modi (data-kz-modus op root, gezet door de JS):
 *  - `pin`  desktop: vastgepind, kaarten schuiven over elkaar.
 *  - `snap` mobiel, minder beweging of geen werkende sticky: een gewone
 *           zijwaartse rij met native scroll-snap. Zonder JS is het ook dit.
 *
 * Valkuil (zo ging het bij bureautandem.nl mis): `position: sticky` werkt
 * niet als een voorouder `overflow: hidden|auto|scroll` heeft — die wordt
 * dan de scrollcontainer, en het blok schuift gewoon mee. init() zoekt die
 * voorouders op. Standaard (`overflowFix: 'clip'`) zet hij daar inline
 * `overflow: clip` (snijdt even hard af, maar is geen scrollcontainer) en
 * meldt welk element hij aanpaste; destroy() zet het terug. Met
 * `overflowFix: 'melden'` raakt hij niets aan, waarschuwt en valt terug op
 * `snap`. Een voorouder die écht zelf scrolt (app-shell) → altijd `snap`.
 *
 * Herkomst: gedrag gezien op bureautandem.nl (GSAP ScrollTrigger pin+scrub,
 * `initCardSliderDesktop`); eigen implementatie zonder GSAP en zonder hun code.
 *
 * @typedef {Object} KaartenstapelZijOpties
 * @property {'proces'|'team'} [variant] Overschrijft `data-kz-variant`. `team` = geen knoppen.
 * @property {number} [breakpoint=768] Vanaf deze breedte (px) pinnen; daaronder scroll-snap.
 * @property {number} [minHoogte=480] Onder deze vensterhoogte (px) niet pinnen.
 * @property {number} [vhPerStap=0.8] Scrollafstand per tijdlijn-eenheid, als deel van de vensterhoogte.
 * @property {number} [start=0.4] Tijdlijn-moment waarop kaart 2 begint te schuiven.
 * @property {number} [interval=1.15] Tijd tussen het vertrek van twee kaarten.
 * @property {number} [duur=1] Hoe lang één kaart schuift.
 * @property {number} [donker=0.25] Opacity van de schaduw op een bedekte kaart.
 * @property {number} [naloop=0.12] Tijdconstante (s) van de naloop; 0 = direct.
 * @property {string} [label='Kaarten, scroll zijwaarts'] Naam van de zijwaarts scrollende rij in `snap`-modus (die rij krijgt `tabindex="0"` zodat het toetsenbord erbij kan).
 * @property {'clip'|'melden'} [overflowFix='clip'] Wat te doen met een voorouder die sticky breekt.
 *
 * @param {Element} root `[data-kz]` met daarin [data-kz-pin] > [data-kz-stage] > … [data-kz-rij] > [data-kz-kaart]*
 * @param {KaartenstapelZijOpties} [opties]
 * @returns {() => void} destroy — ruimt listeners, observers, attributen, stijlen,
 *   schaduwlagen en een eventuele overflow-reparatie op. Idempotent.
 */
import { minderBeweging, perFrame, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const STANDAARD = {
  breakpoint: 768, minHoogte: 480, vhPerStap: 0.8,
  start: 0.4, interval: 1.15, duur: 1, donker: 0.25, naloop: 0.12, overflowFix: 'clip', label: 'Kaarten, scroll zijwaarts',
};

const klem = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const inUit = (p) => (1 - Math.cos(Math.PI * p)) / 2; // schuiven: zacht vertrek, zachte landing
const power1Uit = (p) => 1 - (1 - p) * (1 - p); // schaduw: GSAP power1.out

/**
 * De tijdlijn voor n kaarten: wanneer elke kaart vertrekt en landt.
 * Kaart 0 vertrekt niet; zijn knop gaat open op `start / 2`.
 * @param {number} n @param {{start:number, interval:number, duur:number}} o
 */
export function tijdlijn(n, o = STANDAARD) {
  const vertrek = [0];
  const land = [o.start / 2];
  for (let k = 1; k < n; k++) {
    vertrek.push(o.start + (k - 1) * o.interval);
    land.push(vertrek[k] + o.duur);
  }
  // Na de laatste landing nog een korte rust, zodat zijn knop uitveert vóór de pin loslaat.
  const totaal = (n > 1 ? land[n - 1] : o.start) + 0.15;
  return { vertrek, land, totaal };
}

/**
 * Voortgang p_k (0..1) van elke kaart op tijdlijn-moment τ. p[0] = 1.
 * @param {number} tau @param {number} n @param {object} o
 */
export function voortgang(tau, n, o = STANDAARD) {
  const { vertrek } = tijdlijn(n, o);
  return vertrek.map((v, k) => (k === 0 ? 1 : klem((tau - v) / o.duur)));
}

/** Nearest voorouder(s) die sticky breken. @returns {{el: Element, scrolt: boolean}[]} */
function stickyBrekers(el, win) {
  const doc = el.ownerDocument;
  const html = doc.documentElement;
  const htmlCs = win.getComputedStyle(html);
  const htmlZichtbaar = ['visible', 'clip'].includes(htmlCs.overflowX) && ['visible', 'clip'].includes(htmlCs.overflowY);
  const uit = [];
  for (let a = el.parentElement; a && a !== html; a = a.parentElement) {
    const cs = win.getComputedStyle(a);
    const breekt = [cs.overflowX, cs.overflowY].some((v) => v === 'hidden' || v === 'auto' || v === 'scroll');
    if (!breekt) continue;
    // overflow op <body> gaat naar de viewport als <html> zelf niets zet: dan geen probleem.
    if (a === doc.body && htmlZichtbaar) continue;
    const scrolt = ['auto', 'scroll'].includes(cs.overflowY) && a.scrollHeight > a.clientHeight + 1;
    uit.push({ el: a, scrolt });
  }
  return uit;
}

const beschrijf = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.classList.length ? `.${[...el.classList].join('.')}` : '');

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'kaartenstapel-zij')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const o = { ...STANDAARD, ...zonderUndefined(opties) };

  const pin = root.querySelector('[data-kz-pin]');
  const stage = root.querySelector('[data-kz-stage]');
  const rij = root.querySelector('[data-kz-rij]');
  const kaarten = rij ? [...rij.querySelectorAll('[data-kz-kaart]')] : [];
  if (!pin || !stage || !rij || kaarten.length < 2) {
    console.warn('kaartenstapel-zij: [data-kz-pin] > [data-kz-stage] > [data-kz-rij] met minstens 2 [data-kz-kaart] nodig — overgeslagen');
    return () => {};
  }

  const n = kaarten.length;
  const team = (o.variant || root.getAttribute('data-kz-variant')) === 'team';
  const lijn = tijdlijn(n, o);
  const breedQ = win.matchMedia(`(min-width: ${o.breakpoint}px)`);

  // Schaduwlaag per kaart (decoratie).
  const schaduwen = kaarten.map((k, i) => {
    k.style.setProperty('--kz-i', String(i));
    const s = doc.createElement('span');
    s.setAttribute('data-kz-schaduw', '');
    s.setAttribute('aria-hidden', 'true');
    k.appendChild(s);
    return s;
  });
  root.style.setProperty('--kz-donker', String(o.donker));
  const zetteVariant = team && !root.hasAttribute('data-kz-variant');
  if (zetteVariant) root.setAttribute('data-kz-variant', 'team');

  let modus = '';
  let afstanden = []; // d_k = x_k − x_{k-1}
  let doelTau = 0;
  let tau = 0;
  let raf = 0;
  let vorige = 0;
  let destroyed = false;
  const reparaties = []; // { el, x, y } oorspronkelijke inline waarden

  let gemeld = false;
  const meld = (t) => { if (!gemeld) console.warn(t); gemeld = true; };
  function repareer() {
    const brekers = stickyBrekers(stage, win);
    if (!brekers.length) return true;
    if (brekers.some((b) => b.scrolt)) {
      meld(`kaartenstapel-zij: ${brekers.filter((b) => b.scrolt).map((b) => beschrijf(b.el)).join(', ')} scrolt zelf; sticky pint dan niet aan het venster — terugval op scroll-snap.`);
      return false;
    }
    if (o.overflowFix === 'melden') {
      meld(`kaartenstapel-zij: overflow op ${brekers.map((b) => beschrijf(b.el)).join(', ')} breekt position: sticky — terugval op scroll-snap. Zet daar overflow: clip, of gebruik overflowFix: 'clip'.`);
      return false;
    }
    for (const { el } of brekers) {
      const cs = win.getComputedStyle(el);
      reparaties.push({ el, x: el.style.getPropertyValue('overflow-x'), y: el.style.getPropertyValue('overflow-y') });
      const naar = (v) => (v === 'hidden' ? 'clip' : v === 'auto' || v === 'scroll' ? 'visible' : v);
      const nx = naar(cs.overflowX); const ny = naar(cs.overflowY);
      el.style.setProperty('overflow-x', nx, 'important');
      el.style.setProperty('overflow-y', ny, 'important');
    }
    console.warn(`kaartenstapel-zij: overflow op ${brekers.map((b) => beschrijf(b.el)).join(', ')} brak position: sticky — inline vervangen door clip (destroy() zet het terug).`);
    return true;
  }

  function herstelReparaties() {
    for (const r of reparaties.splice(0)) {
      r.x ? r.el.style.setProperty('overflow-x', r.x) : r.el.style.removeProperty('overflow-x');
      r.y ? r.el.style.setProperty('overflow-y', r.y) : r.el.style.removeProperty('overflow-y');
    }
  }

  function meet() {
    const x = kaarten.map((k) => k.offsetLeft);
    afstanden = x.map((v, k) => (k === 0 ? 0 : v - x[k - 1]));
    root.style.setProperty('--kz-lengte', `${Math.round(lijn.totaal * o.vhPerStap * win.innerHeight)}px`);
  }

  function scrollbaar() { return Math.max(1, pin.offsetHeight - stage.offsetHeight); }

  function leesDoel() {
    const t = klem(-pin.getBoundingClientRect().top / scrollbaar());
    doelTau = t * lijn.totaal;
  }

  function teken(waarde) {
    const p = voortgang(waarde, n, o);
    let som = 0;
    for (let j = 0; j < n; j++) {
      if (j > 0) som += inUit(p[j]) * afstanden[j];
      kaarten[j].style.transform = som ? `translate3d(${(-som).toFixed(2)}px,0,0)` : '';
      const boven = j + 1 < n ? p[j + 1] : 0;
      schaduwen[j].style.opacity = boven > 0 ? (o.donker * power1Uit(boven)).toFixed(4) : '';
      const open = !team && waarde >= lijn.land[j] - 0.1;
      kaarten[j].toggleAttribute('data-kz-open', open);
    }
  }

  function lus(nu) {
    raf = 0;
    const dt = vorige ? Math.min(0.1, (nu - vorige) / 1000) : 1 / 60;
    vorige = nu;
    const k = o.naloop > 0 ? 1 - Math.exp(-dt / o.naloop) : 1;
    tau += (doelTau - tau) * k;
    if (Math.abs(doelTau - tau) < 0.0005) tau = doelTau;
    teken(tau);
    if (tau !== doelTau) raf = win.requestAnimationFrame(lus);
    else vorige = 0;
  }

  const opScroll = perFrame(() => {
    if (modus !== 'pin') return;
    leesDoel();
    if (!raf) raf = win.requestAnimationFrame(lus);
  }, doc);

  function wisTekening() {
    for (let j = 0; j < n; j++) {
      kaarten[j].style.transform = '';
      kaarten[j].removeAttribute('data-kz-open');
      schaduwen[j].style.opacity = '';
    }
  }

  // Snap-modus: de rij scrolt zelf zijwaarts. Zonder focusbare inhoud kan het toetsenbord er niet bij
  // (axe: scrollable-region-focusable), dus de rij wordt focusbaar en krijgt een naam. In pin-modus niet.
  const eigen = { tabindex: false, label: false };
  function zetToegang() {
    const nodig = modus === 'snap' && rij.scrollWidth > rij.clientWidth + 1;
    if (nodig) {
      if (!rij.hasAttribute('tabindex')) { rij.setAttribute('tabindex', '0'); eigen.tabindex = true; }
      if (!rij.hasAttribute('aria-label') && !rij.hasAttribute('aria-labelledby')) { rij.setAttribute('aria-label', o.label); eigen.label = true; }
    } else wisToegang();
  }
  function wisToegang() {
    if (eigen.tabindex) rij.removeAttribute('tabindex');
    if (eigen.label) rij.removeAttribute('aria-label');
    eigen.tabindex = false; eigen.label = false;
  }

  let breedte = win.innerWidth;
  function kies() {
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let wil = !reduced && breedQ.matches && win.innerHeight >= o.minHoogte ? 'pin' : 'snap';
    if (wil === 'pin' && !reparaties.length && !repareer()) wil = 'snap';
    if (wil !== 'pin') herstelReparaties();
    if (wil === modus) { if (modus === 'pin') { meet(); leesDoel(); tau = doelTau; teken(tau); } zetToegang(); return; }
    modus = wil;
    root.setAttribute('data-kz-modus', modus);
    if (modus === 'pin') {
      meet(); leesDoel(); tau = doelTau; teken(tau);
    } else {
      if (raf) win.cancelAnimationFrame(raf); raf = 0;
      root.style.removeProperty('--kz-lengte');
      wisTekening();
    }
    zetToegang();
  }

  const opResize = perFrame(() => {
    if (Math.abs(win.innerWidth - breedte) < 5 && modus === 'pin') return; // alleen hoogte (adresbalk): niet verspringen
    breedte = win.innerWidth;
    kies();
  }, doc);

  // Toetsenbord: focus in een kaart die bedekt of buiten beeld ligt → scroll naar het moment waarop hij bovenop ligt.
  function opFocus(e) {
    if (modus !== 'pin') return;
    const kaart = e.target.closest && e.target.closest('[data-kz-kaart]');
    const j = kaarten.indexOf(kaart);
    if (j < 0) return;
    const tot = j + 1 < n ? lijn.vertrek[j + 1] : lijn.totaal;
    if (tau >= lijn.land[j] && tau <= tot) return;
    const doel = Math.min(lijn.totaal, lijn.land[j] + 0.05);
    const pinTop = pin.getBoundingClientRect().top + win.scrollY;
    win.scrollTo({ top: pinTop + (doel / lijn.totaal) * scrollbaar(), behavior: 'instant' });
    doelTau = doel; tau = doel; teken(tau);
  }

  const mb = minderBeweging(() => kies(), doc);
  const opBreed = () => kies();
  breedQ.addEventListener('change', opBreed);
  win.addEventListener('scroll', opScroll, { passive: true });
  win.addEventListener('resize', opResize, { passive: true });
  root.addEventListener('focusin', opFocus);
  kies();

  // Voor tests en debuggen.
  root.__kaartenstapel = { get modus() { return modus; }, get tau() { return tau; }, lijn, reparaties };

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    mb.stop();
    breedQ.removeEventListener('change', opBreed);
    win.removeEventListener('scroll', opScroll);
    win.removeEventListener('resize', opResize);
    root.removeEventListener('focusin', opFocus);
    opScroll.cancel(); opResize.cancel();
    if (raf) win.cancelAnimationFrame(raf);
    wisTekening();
    wisToegang();
    for (const k of kaarten) k.style.removeProperty('--kz-i');
    for (const s of schaduwen) s.remove();
    herstelReparaties();
    root.removeAttribute('data-kz-modus');
    if (zetteVariant) root.removeAttribute('data-kz-variant');
    root.style.removeProperty('--kz-lengte');
    root.style.removeProperty('--kz-donker');
    delete root.__kaartenstapel;
  };
}
