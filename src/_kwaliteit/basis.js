/**
 * _kwaliteit/basis.js
 * ------------------------------------------------------------------------
 * Gedeelde bouwstenen voor alle vette features. Hier zitten de lessen uit
 * het Webstijn-onderzoek (research/webstijn/OVERZICHT.md § "Waar het
 * rammelt") als code, zodat een onderdeel ze niet per ongeluk vergeet:
 *
 *  - beweging stopt bij "minder beweging" en reageert live op een wissel
 *  - opslag gooit nooit (privévenster, geblokkeerde cookies)
 *  - scripts crashen niet als hun element ontbreekt
 *  - tijd = Nederlandse tijd, ook als de bezoeker in een andere zone zit
 *  - frequentiegrens voor alles wat zich opdringt (pop-ups, intro's)
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt window pas aan bij
 * aanroep).
 */

/** @param {Document} [doc] */
function winOf(doc) {
  return (doc && doc.defaultView) || (typeof window !== 'undefined' ? window : null);
}

/**
 * Staat "minder beweging" aan? Met `onChange` krijg je een callback als de
 * bezoeker het halverwege omzet; de teruggegeven functie ruimt op.
 * @param {(reduced: boolean) => void} [onChange]
 * @returns {{ reduced: boolean, stop: () => void }}
 */
export function minderBeweging(onChange, doc) {
  const win = winOf(doc);
  if (!win || !win.matchMedia) return { reduced: false, stop() {} };
  const mq = win.matchMedia('(prefers-reduced-motion: reduce)');
  if (!onChange) return { reduced: mq.matches, stop() {} };
  const h = (e) => onChange(e.matches);
  mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
  return {
    reduced: mq.matches,
    stop() { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); },
  };
}

/** Grove aanwijzer (touch)? Voor effecten die alleen met een muis zin hebben. */
export function isTouch(doc) {
  const win = winOf(doc);
  return !!(win && win.matchMedia && win.matchMedia('(hover: none), (pointer: coarse)').matches);
}

/**
 * Opslag die nooit gooit. `soort` = 'session' | 'local'.
 * @returns {{ get(k: string): string|null, set(k: string, v: string): boolean, del(k: string): void }}
 */
export function veiligeOpslag(soort = 'local', doc) {
  const win = winOf(doc);
  let store = null;
  try { store = win && (soort === 'session' ? win.sessionStorage : win.localStorage); } catch { store = null; }
  return {
    get(k) { try { return store ? store.getItem(k) : null; } catch { return null; } },
    set(k, v) { try { if (!store) return false; store.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { store && store.removeItem(k); } catch { /* niets */ } },
  };
}

/**
 * Frequentiegrens: mag iets dat zich opdringt (pop-up, intro, tooltip) nu
 * getoond worden? Houdt per sleutel bij wanneer het laatst getoond is.
 * @param {string} sleutel
 * @param {{ perSessie?: boolean, dagen?: number }} [regel] perSessie = 1× per tabblad-sessie; dagen = minimaal zoveel dagen ertussen.
 * @returns {{ mag: boolean, markeer: () => void }}
 */
export function frequentie(sleutel, regel = { perSessie: true }, doc) {
  const key = `vf:${sleutel}`;
  if (regel.perSessie) {
    const s = veiligeOpslag('session', doc);
    return { mag: s.get(key) !== '1', markeer: () => s.set(key, '1') };
  }
  const l = veiligeOpslag('local', doc);
  const laatst = Number(l.get(key) || 0);
  const ms = (regel.dagen ?? 7) * 864e5;
  return { mag: !laatst || Date.now() - laatst >= ms, markeer: () => l.set(key, String(Date.now())) };
}

/**
 * Eén keer (of steeds) iets doen zodra een element in beeld komt.
 * @param {Element} el
 * @param {(entry: IntersectionObserverEntry) => void} cb
 * @param {{ once?: boolean, rootMargin?: string, threshold?: number, bijUit?: (entry: IntersectionObserverEntry) => void }} [opt]
 *   bijUit: wordt aangeroepen als het element weer uit beeld gaat (alleen met once: false) — om te pauzeren (R18).
 * @returns {() => void} stop
 */
export function inBeeld(el, cb, opt = {}) {
  const { once = true, rootMargin = '0px', threshold = 0, bijUit } = opt;
  const win = winOf(el && el.ownerDocument);
  if (!el || !win) return () => {};
  if (!('IntersectionObserver' in win)) { cb({ isIntersecting: true, target: el }); return () => {}; }
  const io = new win.IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { cb(e); if (once) io.unobserve(e.target); }
      else if (!once && bijUit) bijUit(e);
    }
  }, { rootMargin, threshold });
  io.observe(el);
  return () => io.disconnect();
}

/** Throttle naar één keer per animatieframe (voor scroll/resize/pointermove). */
export function perFrame(fn, doc) {
  const win = winOf(doc);
  let raf = 0; let lastArgs;
  const wrapped = (...args) => {
    lastArgs = args;
    if (raf) return;
    raf = win.requestAnimationFrame(() => { raf = 0; fn(...lastArgs); });
  };
  wrapped.cancel = () => { if (raf) win.cancelAnimationFrame(raf); raf = 0; };
  return wrapped;
}

/**
 * Nederlandse tijd, onafhankelijk van de tijdzone van de bezoeker.
 * @param {Date} [nu]
 * @returns {{ jaar: number, maand: number, dag: number, weekdag: number, uur: number, minuut: number, iso: string }}
 *   maand 1-12, weekdag 0=zondag … 6=zaterdag, iso = JJJJ-MM-DD
 */
export function nlTijd(nu = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
    }).formatToParts(nu).map((x) => [x.type, x.value]),
  );
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  return {
    jaar: +p.year, maand: +p.month, dag: +p.day, weekdag: wd,
    uur: +p.hour, minuut: +p.minute, iso: `${p.year}-${p.month}-${p.day}`,
  };
}

/** Veilige init: geeft een lege destroy terug in plaats van te crashen als root ontbreekt. */
export function vereisRoot(root, naam) {
  if (!root || typeof root.querySelector !== 'function') {
    if (typeof console !== 'undefined') console.warn(`${naam}: init(root) kreeg geen element — overgeslagen`);
    return false;
  }
  return true;
}
