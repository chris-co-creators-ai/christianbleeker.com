/**
 * blur-woorden
 * ------------------------------------------------------------------------
 * Sectiekop die bij in beeld per woord van wazig naar scherp gaat, licht
 * gestaggerd, met een eyebrow die 8 px en een beschrijving die 10 px omhoog
 * komt. Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window` en
 * `document` pas aan in `init()`.
 *
 * Schermlezers horen de hele zin in één keer: de kop krijgt een `aria-label`
 * met de volledige tekst en de losse woord-spans zijn `aria-hidden`.
 *
 * Herkomst: techniek gezien op eu-hosted.com/nl (28-10-2026), sectie "Hoe het
 * werkt". Daar met GSAP + SplitText. Eigen implementatie zonder library;
 * getallen als vertrekpunt: blur 10 px, rise 24 %, opacity .7 s, blur en rise
 * .9 s, stap .06 s per woord (max .6 s spreiding), eyebrow .45 s / 8 px,
 * beschrijving .5 s / 10 px, ease-out (.16, 1, .3, 1).
 *
 * @typedef {Object} BlurWoordenOpties
 * @property {number} [stap=0.06] Seconden tussen twee woorden.
 * @property {number} [maxSpreiding=0.6] Seconden tussen eerste en laatste woord, hoe lang de kop ook is.
 * @property {number} [blur=10] Startblur per woord, in px.
 * @property {number} [drempel=0.4] Deel van de kop dat in beeld moet zijn voordat hij start (0–1).
 * @property {number} [tekstVertraging=0.3] Seconden voordat de beschrijving start.
 *
 * @param {Element} root Element met `[data-blur-woorden]` (of een eigen wrapper) waarin de kop `[data-bw-kop]` staat.
 * @param {BlurWoordenOpties} [opties]
 * @returns {() => void} destroy: zet de originele tekstknopen terug en haalt alles weg. Idempotent.
 */
import { vereisRoot, minderBeweging, zonderUndefined } from '../../_kwaliteit/basis.js';

const STANDAARD = { stap: 0.06, maxSpreiding: 0.6, blur: 10, drempel: 0.4, tekstVertraging: 0.3 };
const WOORD_DUUR = 0.9; // blur + rise; opacity .7 s, zie CSS
const ATTR = ['data-bw-verborgen', 'data-bw-actief', 'data-bw-in', 'data-bw-af'];

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

/** Splitst alle tekstknopen in `kop` in woord-spans; `herstel()` zet de originele knopen terug (veilig onder React). */
function splitsWoorden(kop, doc) {
  const walker = doc.createTreeWalker(kop, 4 /* SHOW_TEXT */);
  const teksten = [];
  while (walker.nextNode()) teksten.push(walker.currentNode);
  const vervangen = [];
  const woorden = [];
  for (const tn of teksten) {
    if (!tn.data.trim()) continue;
    const frag = doc.createDocumentFragment();
    const nieuw = [];
    for (const deel of tn.data.split(/(\s+)/)) {
      if (!deel) continue;
      let n;
      if (/^\s+$/.test(deel)) n = doc.createTextNode(deel);
      else {
        n = doc.createElement('span');
        n.className = 'bw-woord';
        n.setAttribute('aria-hidden', 'true');
        n.textContent = deel;
        woorden.push(n);
      }
      frag.appendChild(n);
      nieuw.push(n);
    }
    tn.parentNode.replaceChild(frag, tn);
    vervangen.push({ tn, nieuw });
  }
  return {
    woorden,
    herstel() {
      for (const { tn, nieuw } of vervangen) {
        nieuw[0].parentNode.insertBefore(tn, nieuw[0]);
        for (const n of nieuw) n.remove();
      }
    },
  };
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'blur-woorden')) return () => {};
  const kop = root.querySelector('[data-bw-kop]') || root.querySelector('h1, h2, h3');
  if (!kop) {
    console.warn('blur-woorden: geen [data-bw-kop] of h1–h3 gevonden — overgeslagen');
    return () => {};
  }
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  const doc = root.ownerDocument;
  const win = doc.defaultView;

  // Schermlezer: de hele zin in één keer, ook als de woorden los staan.
  const eigenLabel = !kop.hasAttribute('aria-label') && !kop.hasAttribute('aria-labelledby');
  // Regels apart lezen: React zet geen spatie tussen twee <span>'s, textContent plakt ze dan aan elkaar.
  const regels = kop.querySelectorAll('[data-bw-regel]');
  const zin = (regels.length ? Array.from(regels, (r) => r.textContent).join(' ') : kop.textContent).replace(/\s+/g, ' ').trim();
  if (eigenLabel) kop.setAttribute('aria-label', zin);

  const split = splitsWoorden(kop, doc);
  const n = split.woorden.length;
  const stap = n > 1 ? Math.min(o.stap, o.maxSpreiding / (n - 1)) : 0;
  split.woorden.forEach((w, i) => w.style.setProperty('--bw-d', `${(0.05 + i * stap).toFixed(3)}s`));
  root.style.setProperty('--bw-blur', `${o.blur}px`);
  root.style.setProperty('--bw-tekst-d', `${o.tekstVertraging}s`);
  const totaal = (0.05 + (n - 1) * stap + WOORD_DUUR) * 1000;

  let vernietigd = false;
  let raf = 0;
  let klaarTimer = 0;
  let io = null;

  /** Toon de eindtoestand; `direct` = zonder overgang (minder beweging, pauze). */
  function toon(direct) {
    if (vernietigd) return;
    if (io) { io.disconnect(); io = null; }
    if (direct) {
      root.setAttribute('data-bw-af', '');
      root.setAttribute('data-bw-in', '');
      return;
    }
    root.setAttribute('data-bw-in', '');
    klaarTimer = win.setTimeout(() => root.setAttribute('data-bw-af', ''), Math.max(totaal, (o.tekstVertraging + 0.5) * 1000) + 80);
  }

  const mb = minderBeweging((reduced) => { if (reduced) toon(true); }, doc);
  const pauze = luisterPauze(doc, (gepauzeerd) => { if (gepauzeerd) toon(true); });

  if (mb.reduced || pauze.gepauzeerd || !('IntersectionObserver' in win)) {
    // Direct scherp: de verborgen staat wordt nooit gezet.
  } else {
    // Twee fasen (zie reveal-on-scroll): verbergen zonder overgang, één frame later pas de overgang aan.
    root.setAttribute('data-bw-verborgen', '');
    void root.getBoundingClientRect();
    raf = win.requestAnimationFrame(() => { raf = 0; root.setAttribute('data-bw-actief', ''); });
    io = new win.IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) toon(pauze.gepauzeerd);
    }, { threshold: o.drempel });
    io.observe(kop);
  }

  return function destroy() {
    if (vernietigd) return;
    vernietigd = true;
    if (io) io.disconnect();
    if (raf) win.cancelAnimationFrame(raf);
    win.clearTimeout(klaarTimer);
    mb.stop();
    pauze.stop();
    split.herstel();
    for (const a of ATTR) root.removeAttribute(a);
    root.style.removeProperty('--bw-blur');
    root.style.removeProperty('--bw-tekst-d');
    if (eigenLabel) kop.removeAttribute('aria-label');
  };
}
