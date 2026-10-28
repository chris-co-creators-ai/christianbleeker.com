/**
 * vel-menu
 * ------------------------------------------------------------------------
 * Menu in een `<dialog>` dat opent als een vel: eerst rekt een smalle lijn
 * uit vanuit de hoek van de hamburgerknop, daarna vouwt die lijn open tot
 * een heel vel. Daarna komen paneel, links en adres één voor één binnen.
 * Sluiten speelt dezelfde reeks korter terug.
 *
 * Reeks (WAAPI, getallen uit bureautandem.nl, DOSSIER-SITE.md rij 44):
 *  - vel `scale(.36, .075) → scale(1, .075)` in 250 ms (outCirc),
 *    100 ms rust, dan `→ scale(1, 1)` in 350 ms (outCirc); origin rechtsboven
 *  - inhoud per `[data-vel-stap]`: opacity 150 ms + translateY(-25%) → 0 350 ms
 *  - het logo in het menu verschijnt zodra het vel de kopregel bedekt, in de
 *    menukleur: leesbaar op het vel (bij Tandem bleef het wit op beige).
 *
 * Wat de browser zelf doet (geen eigen code): de rest van de pagina inert
 * maken, Esc (via `cancel`). Eigen code: Tab rond laten lopen binnen het menu
 * (anders gaat de focus na het laatste element naar de adresbalk). Scrollslot zit in
 * de CSS: `html:has(dialog[data-vel][open]) { overflow: hidden }`.
 * Zonder JS opent de knop het menu toch, via `commandfor`/`command`
 * (invoker-commando's); init() haalt die weg zodat hij zelf kan animeren.
 *
 * Herkomst: gedrag gezien op bureautandem.nl (Webflow IX2 "Menu Mobiel XXL");
 * eigen implementatie met `<dialog>` en WAAPI, zonder hun code.
 *
 * @typedef {Object} VelMenuOpties
 * @property {Element|string} [knop] De openknop. Standaard `[aria-controls="<id van de dialog>"]`.
 * @property {Element|string} [merk] Het logo in de paginakop; het menulogo komt op exact die plek. Standaard `[data-vel-merk]`.
 * @property {number} [lijnDuur=250] ms: lijn rekt uit (scaleX .36 → 1).
 * @property {number} [rust=100] ms: pauze tussen lijn en vel.
 * @property {number} [velDuur=350] ms: vel vouwt open (scaleY .075 → 1).
 * @property {[number, number]} [startSchaal=[0.36, 0.075]] Beginschaal van het vel (x, y).
 * @property {number} [inhoudStart=600] ms: eerste stap van de inhoud begint.
 * @property {number} [stagger=70] ms tussen twee inhoudstappen.
 * @property {number} [sluitDuur=380] ms: hele sluitreeks.
 * @property {string} [focusDoel='main h1, main, h1'] (voorkeursvolgorde, kommagescheiden) Waar de focus heen gaat na een klik op een link naar een andere pagina (client-side routering: zodra het pad wisselt, max. 3 s). Voor een anker op dezelfde pagina gaat de focus naar het anker zelf.
 * @property {(open: boolean) => void} [onChange]
 *
 * @param {HTMLDialogElement} root `<dialog data-vel>` met [data-vel-vel], [data-vel-kop] (logo + sluitknop), [data-vel-inhoud] met [data-vel-stap]*
 * @param {VelMenuOpties} [opties]
 * @returns {() => void} destroy — sluit het menu als het open is, ruimt listeners, animaties en attributen op. Idempotent.
 */
import { vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const UIT_CIRC = 'cubic-bezier(0.075, 0.82, 0.165, 1)';
const IN_CIRC = 'cubic-bezier(0.6, 0.04, 0.98, 0.335)';
const STANDAARD = { lijnDuur: 250, rust: 100, velDuur: 350, startSchaal: [0.36, 0.075], inhoudStart: 600, stagger: 70, sluitDuur: 380, focusDoel: 'main h1, main, h1' };

/** De keyframes van het vel, los zodat de meting ze kan naleggen. */
export function velKeyframes(o = STANDAARD) {
  const [sx, sy] = o.startSchaal;
  const totaal = o.lijnDuur + o.rust + o.velDuur;
  return {
    totaal,
    frames: [
      { transform: `scale(${sx}, ${sy})`, offset: 0, easing: UIT_CIRC },
      { transform: `scale(1, ${sy})`, offset: o.lijnDuur / totaal },
      { transform: `scale(1, ${sy})`, offset: (o.lijnDuur + o.rust) / totaal, easing: UIT_CIRC },
      { transform: 'scale(1, 1)', offset: 1 },
    ],
  };
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'vel-menu')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (typeof root.showModal !== 'function') {
    console.warn('vel-menu: root moet een <dialog> zijn — overgeslagen');
    return () => {};
  }
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  const vind = (x, standaard) => (typeof x === 'string' ? doc.querySelector(x) : x) || (standaard ? doc.querySelector(standaard) : null);
  const knop = vind(o.knop, root.id ? `[aria-controls="${root.id}"], [commandfor="${root.id}"]` : null);
  const merk = vind(o.merk, '[data-vel-merk]');
  const vel = root.querySelector('[data-vel-vel]');
  const logo = root.querySelector('[data-vel-logo]');
  const sluitKnop = root.querySelector('[data-vel-sluit]');
  const inhoud = root.querySelector('[data-vel-inhoud]');
  if (!knop || !vel || !inhoud) {
    console.warn('vel-menu: openknop, [data-vel-vel] of [data-vel-inhoud] ontbreekt — overgeslagen');
    return () => {};
  }

  // Invoker-commando's (werkt zonder JS) uitzetten; destroy() zet ze terug.
  const bewaard = [];
  for (const el of [knop, sluitKnop]) {
    if (!el) continue;
    for (const a of ['commandfor', 'command']) {
      if (el.hasAttribute(a)) { bewaard.push([el, a, el.getAttribute(a)]); el.removeAttribute(a); }
    }
  }
  const zetteHaspopup = !knop.hasAttribute('aria-haspopup');
  const zetteControls = !knop.hasAttribute('aria-controls') && root.id;
  if (zetteHaspopup) knop.setAttribute('aria-haspopup', 'dialog');
  if (zetteControls) knop.setAttribute('aria-controls', root.id);
  knop.setAttribute('aria-expanded', 'false');

  let animaties = [];
  let sluitend = false;
  let focusTerug = true;
  let destroyed = false;
  const reduced = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stopAnimaties() {
    for (const a of animaties) a.cancel();
    animaties = [];
  }

  function meet() {
    const r = knop.getBoundingClientRect();
    root.style.setProperty('--vel-knop-top', `${r.top}px`);
    root.style.setProperty('--vel-knop-left', `${r.left}px`);
    root.style.setProperty('--vel-knop-w', `${r.width}px`);
    root.style.setProperty('--vel-knop-h', `${r.height}px`);
    if (merk) {
      const m = merk.getBoundingClientRect();
      root.style.setProperty('--vel-merk-top', `${m.top}px`);
      root.style.setProperty('--vel-merk-left', `${m.left}px`);
      // Breed scherm: valt het paginalogo naast het vel, dan geen menulogo (het paginalogo blijft zichtbaar).
      root.toggleAttribute('data-vel-logo-naast', root.open && m.left < vel.offsetLeft);
    }
  }

  const stappen = () => [...inhoud.querySelectorAll('[data-vel-stap]')];

  function open() {
    if (root.open || destroyed) return;
    focusTerug = true;
    root.showModal();
    meet();
    knop.setAttribute('aria-expanded', 'true');
    const eerste = inhoud.querySelector('a[href], button:not([disabled])');
    if (eerste) eerste.focus({ preventScroll: true });
    if (o.onChange) o.onChange(true);

    if (reduced()) { if (sluitKnop) sluitKnop.setAttribute('data-mh-open', ''); return; }

    const { frames, totaal } = velKeyframes(o);
    animaties.push(vel.animate(frames, { duration: totaal, fill: 'backwards' }));
    animaties.push(root.animate({ opacity: [0, 1] }, { duration: 300, easing: 'ease-out', pseudoElement: '::backdrop' }));
    // Het menulogo komt op zodra het vel de kopregel bedekt (lijn bijna uitgerekt).
    if (logo) animaties.push(logo.animate({ opacity: [0, 1] }, { duration: 150, delay: o.lijnDuur * 0.7, fill: 'backwards', easing: 'ease-out' }));
    stappen().forEach((el, i) => {
      const delay = o.inhoudStart + i * o.stagger;
      animaties.push(el.animate({ opacity: [0, 1] }, { duration: 150, delay, fill: 'backwards', easing: 'linear' }));
      animaties.push(el.animate({ transform: ['translateY(-25%)', 'none'] }, { duration: 350, delay, fill: 'backwards', easing: UIT_CIRC }));
    });
    // Het kruis morft één frame later, zodat de CSS-overgang van morph-hamburger speelt.
    if (sluitKnop) win.requestAnimationFrame(() => root.open && !sluitend && sluitKnop.setAttribute('data-mh-open', ''));
  }

  function sluit() {
    if (!root.open || sluitend) return;
    if (reduced()) { root.close(); return; }
    sluitend = true;
    stopAnimaties();
    if (sluitKnop) sluitKnop.removeAttribute('data-mh-open');
    const [sx, sy] = o.startSchaal;
    const d = o.sluitDuur;
    for (const el of stappen()) animaties.push(el.animate({ opacity: [1, 0] }, { duration: d * 0.3, fill: 'forwards' }));
    if (logo) animaties.push(logo.animate({ opacity: [1, 0] }, { duration: 120, delay: d * 0.6, fill: 'forwards' }));
    animaties.push(root.animate({ opacity: [1, 0] }, { duration: d, fill: 'forwards', pseudoElement: '::backdrop' }));
    const a = vel.animate([
      { transform: 'scale(1, 1)', easing: IN_CIRC },
      { transform: `scale(1, ${sy})`, offset: 0.6, easing: IN_CIRC },
      { transform: `scale(${sx}, ${sy})`, opacity: 1, offset: 0.9 },
      { transform: `scale(${sx}, ${sy})`, opacity: 0 },
    ], { duration: d, delay: d * 0.15, fill: 'forwards' });
    animaties.push(a);
    a.finished.then(() => { if (root.open) root.close(); }, () => {});
  }

  function opGesloten() {
    stopAnimaties();
    sluitend = false;
    knop.setAttribute('aria-expanded', 'false');
    if (sluitKnop) sluitKnop.removeAttribute('data-mh-open');
    if (focusTerug && knop.isConnected) knop.focus({ preventScroll: true });
    if (o.onChange) o.onChange(false);
  }

  function opCancel(e) { e.preventDefault(); sluit(); }
  function opKnop() { open(); }
  function opSluit(e) { e.preventDefault(); sluit(); }
  // Focus op een element dat zelf niet focusbaar is (kop, main, sectie): tijdelijk tabindex -1.
  function focusOp(el) {
    if (!el) return false;
    if (!el.hasAttribute('tabindex') && !el.matches('a[href], button, input, select, textarea, summary')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    return doc.activeElement === el;
  }
  let wacht = 0;
  // De lijst is een voorkeursvolgorde (querySelector zelf geeft het eerste in documentvolgorde).
  const eerstGevonden = (lijst) => { for (const sel of lijst.split(',')) { const el = doc.querySelector(sel.trim()); if (el) return el; } return null; };
  // Na een klik op een menulink: de browser zet de focus bij close() terug op de menuknop; wij zetten
  // hem op het doel. Anker op dezelfde pagina: dat anker. Andere pagina: het nieuwe main/h1 zodra het pad wisselt.
  function focusNaLink(a) {
    let url;
    try { url = new URL(a.href, win.location.href); } catch { return; }
    if (url.origin !== win.location.origin) return;
    const zelfde = url.pathname === win.location.pathname && url.search === win.location.search;
    if (zelfde) {
      const id = decodeURIComponent(url.hash.slice(1));
      const doel = id ? doc.getElementById(id) : null;
      if (!focusOp(doel || eerstGevonden(o.focusDoel))) knop.blur();
      return;
    }
    const van = win.location.pathname + win.location.search;
    const t0 = Date.now();
    win.clearTimeout(wacht);
    const kijk = () => {
      if (destroyed || root.open) return;
      if (win.location.pathname + win.location.search !== van) {
        // één tel laten staan: de nieuwe pagina is dan gerenderd
        wacht = win.setTimeout(() => { if (!destroyed && !root.open) focusOp(eerstGevonden(o.focusDoel)); }, 60);
      } else if (Date.now() - t0 < 3000) wacht = win.setTimeout(kijk, 40);
    };
    knop.blur();
    wacht = win.setTimeout(kijk, 40);
  }
  function opKlik(e) {
    if (e.target === root) { sluit(); return; } // klik naast het vel
    const a = e.target.closest && e.target.closest('a[href]');
    if (a && root.contains(a)) {
      // Navigeren: meteen dicht (scrollslot eraf), focus gaat mee naar het doel, niet terug naar de knop.
      focusTerug = false;
      root.close();
      // (geen defaultPrevented-check: client-side routers doen zelf preventDefault)
      const gewoon = !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0 && (!a.target || a.target === '_self') && !a.hasAttribute('download');
      if (gewoon) focusNaLink(a);
    }
  }
  function opResize() { if (root.open) meet(); }
  // De browser laat Tab na het laatste element naar de adresbalk lopen (body krijgt focus); R14 wil een rondje.
  function opToets(e) {
    if (e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    if (!f.length) return;
    const eerste = f[0]; const laatste = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === eerste) { e.preventDefault(); laatste.focus(); }
    else if (!e.shiftKey && doc.activeElement === laatste) { e.preventDefault(); eerste.focus(); }
  }

  knop.addEventListener('click', opKnop);
  if (sluitKnop) sluitKnop.addEventListener('click', opSluit);
  root.addEventListener('cancel', opCancel);
  root.addEventListener('close', opGesloten);
  root.addEventListener('click', opKlik);
  root.addEventListener('keydown', opToets);
  win.addEventListener('resize', opResize, { passive: true });

  root.__velMenu = { open, sluit, get animaties() { return animaties; } };

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    knop.removeEventListener('click', opKnop);
    if (sluitKnop) sluitKnop.removeEventListener('click', opSluit);
    root.removeEventListener('cancel', opCancel);
    root.removeEventListener('close', opGesloten);
    root.removeEventListener('click', opKlik);
    root.removeEventListener('keydown', opToets);
    win.removeEventListener('resize', opResize);
    stopAnimaties();
    win.clearTimeout(wacht);
    if (root.open) root.close();
    if (sluitKnop) sluitKnop.removeAttribute('data-mh-open');
    knop.removeAttribute('aria-expanded');
    if (zetteHaspopup) knop.removeAttribute('aria-haspopup');
    if (zetteControls) knop.removeAttribute('aria-controls');
    for (const [el, a, v] of bewaard) el.setAttribute(a, v);
    root.removeAttribute('data-vel-logo-naast');
    for (const p of ['--vel-knop-top', '--vel-knop-left', '--vel-knop-w', '--vel-knop-h', '--vel-merk-top', '--vel-merk-left']) root.style.removeProperty(p);
    delete root.__velMenu;
  };
}
