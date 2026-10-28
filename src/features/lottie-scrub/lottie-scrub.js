/**
 * lottie-scrub
 * ------------------------------------------------------------------------
 * Hangt het frame van een Lottie aan de scrollpositie van een element: scroll
 * je omlaag, dan tekent hij verder; scroll je terug, dan tekent hij terug.
 * Bijvoorbeeld een footer-logo dat zich tekent terwijl de footer in beeld komt.
 * Een korte naloop (standaard 0,8 s) maakt het zacht, zonder dat hij achter
 * blijft hangen.
 *
 * - Lui: de speler (lottie-web light, gevendord in `vendor/`, een kopie van die van lottie-icon)
 *   laadt pas als het element binnen 600 px komt (R17).
 * - Buiten beeld rendert hij niet: geen scrollwerk, geen animatieframes, geen
 *   `goToAndStop` (R18).
 * - Minder beweging: de speler laadt niet; de statische SVG in de markup is het
 *   laatste frame en blijft staan. Halverwege omzetten werkt live (R1).
 * - Zonder JS: dezelfde statische SVG.
 *
 * Voortgang: 0 als de bovenkant van het element op `start` × schermhoogte staat
 * (standaard 1 = onderkant scherm), 1 als de onderkant van het element op
 * `eind` × schermhoogte staat (standaard 0 = bovenkant scherm). Dat is
 * "top bottom → bottom top" in ScrollTrigger-taal.
 *
 * Herkomst: footer-logo van bureautandem.nl (26-10-2026, DOSSIER tabel d rij 23:
 * start "top bottom", eind "bottom top", scrub .8). Eigen code, geen GSAP.
 *
 * @typedef {Object} LottieScrubOpties
 * @property {string} [src] Pad naar de Lottie-JSON. Anders `data-lottie-src`.
 * @property {number} [start=1] Hoogte (deel van het scherm) waar de bovenkant van het element staat bij frame 0. Anders `data-lottie-scrub-start`.
 * @property {number} [eind=0] Hoogte (deel van het scherm) waar de onderkant van het element staat bij het laatste frame. Anders `data-lottie-scrub-eind`.
 * @property {number} [naloop=0.8] Seconden die de animatie nodig heeft om de scroll in te halen. 0 = direct.
 *
 * @param {HTMLElement} root `[data-lottie-scrub]`
 * @param {LottieScrubOpties} [opties]
 * @returns {() => void} destroy — idempotent.
 */
import { minderBeweging, vereisRoot, inBeeld, perFrame } from '../../_kwaliteit/basis.js';

// Letterlijk pad: een bundler (Next/webpack/Vite) moet `import()` kunnen volgen. De speler staat bij het onderdeel zelf, zodat het pad ook in een platte kopie klopt.
const klem = (v) => Math.min(1, Math.max(0, v));

function getal(v, terugval) {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : terugval;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'lottie-scrub')) return () => {};
  if (typeof root.__lottieScrubDestroy === 'function') root.__lottieScrubDestroy();

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const src = opties.src || root.getAttribute('data-lottie-src');
  if (!src) {
    console.warn('lottie-scrub: geen src (optie of data-lottie-src) — overgeslagen');
    return () => {};
  }
  const o = {
    start: opties.start ?? getal(root.getAttribute('data-lottie-scrub-start'), 1),
    eind: opties.eind ?? getal(root.getAttribute('data-lottie-scrub-eind'), 0),
    naloop: opties.naloop ?? getal(root.getAttribute('data-lottie-scrub-naloop'), 0.8),
  };

  let vernietigd = false;
  let reduced = false;
  let zichtbaar = false;
  let anim = null;
  let houder = null;
  let laden = null;
  let doel = 0;
  let nu = 0;
  let raf = 0;
  let vorigeTijd = 0;
  let renders = 0;
  let stopLaden = () => {};
  let stopZicht = () => {};

  function voortgang() {
    const r = root.getBoundingClientRect();
    const vh = win.innerHeight;
    const a = o.start * vh; // bovenkant op a → 0
    // Bovenkant op b (onderkant op eind) → 1. Kan de pagina niet zo ver
    // scrollen (footer-logo onderaan), dan is de onderkant van de pagina het
    // eind: anders blijft het logo altijd net onaf.
    const max = doc.documentElement.scrollHeight - vh;
    const topBijMax = r.top - (max - win.scrollY);
    const b = Math.max(o.eind * vh - r.height, topBijMax);
    return a <= b ? 1 : klem((a - r.top) / (a - b));
  }

  function teken(p) {
    if (!anim) return;
    anim.goToAndStop(p * (anim.totalFrames - 1), true);
    renders += 1;
  }

  function stap(tijd) {
    raf = 0;
    if (!anim || !zichtbaar || reduced) return;
    const dt = vorigeTijd ? Math.min(0.1, (tijd - vorigeTijd) / 1000) : 1 / 60;
    vorigeTijd = tijd;
    const factor = o.naloop > 0 ? 1 - Math.exp((-4 * dt) / o.naloop) : 1;
    nu += (doel - nu) * factor;
    if (Math.abs(doel - nu) < 0.0005) nu = doel;
    teken(nu);
    if (nu !== doel) raf = win.requestAnimationFrame(stap);
    else vorigeTijd = 0;
  }

  function start() {
    if (!raf && anim && zichtbaar && !reduced) raf = win.requestAnimationFrame(stap);
  }

  const opScroll = perFrame(() => {
    if (!zichtbaar || reduced) return;
    doel = voortgang();
    start();
  }, doc);

  function laad() {
    if (laden) return laden;
    houder = doc.createElement('div');
    houder.className = 'ls-stage';
    houder.setAttribute('aria-hidden', 'true');
    root.appendChild(houder);
    laden = import('./vendor/lottie_light.min.js').then(({ default: lottie }) => {
      if (vernietigd) return;
      const a = lottie.loadAnimation({
        container: houder, renderer: 'svg', loop: false, autoplay: false, path: src,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
      a.addEventListener('DOMLoaded', () => {
        if (vernietigd) return;
        anim = a;
        if (reduced) {
          a.goToAndStop(a.totalFrames - 1, true);
        } else {
          // Eerste frame direct op de juiste stand: geen inhaalslag vanaf 0.
          doel = voortgang();
          nu = doel;
          teken(nu);
        }
        root.setAttribute('data-lottie-scrub-klaar', '');
      });
      root.__lottieScrubAnim = a;
    }).catch((err) => {
      console.warn('lottie-scrub: speler kon niet laden — statisch beeld blijft staan', err);
    });
    return laden;
  }

  function aanzetten() {
    stopLaden = inBeeld(root, laad, { rootMargin: '600px' });
    stopZicht = inBeeld(root, () => {
      zichtbaar = true;
      doel = voortgang();
      start();
    }, {
      once: false,
      bijUit: () => {
        zichtbaar = false;
        if (raf) win.cancelAnimationFrame(raf);
        raf = 0;
        vorigeTijd = 0;
      },
    });
    win.addEventListener('scroll', opScroll, { passive: true });
    win.addEventListener('resize', opScroll, { passive: true });
  }

  function uitzetten() {
    stopLaden(); stopZicht();
    stopLaden = () => {}; stopZicht = () => {};
    win.removeEventListener('scroll', opScroll);
    win.removeEventListener('resize', opScroll);
    opScroll.cancel();
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
    zichtbaar = false;
  }

  const beweging = minderBeweging((r) => {
    reduced = r;
    if (r) {
      uitzetten();
      root.setAttribute('data-lottie-scrub-stil', '');
      if (anim) anim.goToAndStop(anim.totalFrames - 1, true);
    } else {
      root.removeAttribute('data-lottie-scrub-stil');
      aanzetten();
    }
  }, doc);
  reduced = beweging.reduced;
  if (reduced) root.setAttribute('data-lottie-scrub-stil', '');
  else aanzetten();

  function destroy() {
    if (vernietigd) return;
    vernietigd = true;
    uitzetten();
    beweging.stop();
    if (anim) anim.destroy();
    else if (root.__lottieScrubAnim) root.__lottieScrubAnim.destroy();
    anim = null;
    if (houder) houder.remove();
    houder = null;
    root.removeAttribute('data-lottie-scrub-klaar');
    root.removeAttribute('data-lottie-scrub-stil');
    delete root.__lottieScrubAnim;
    delete root.__lottieScrub;
    delete root.__lottieScrubDestroy;
  }

  // Introspectie voor het meetscript (geen publiek contract).
  root.__lottieScrub = {
    get anim() { return anim; },
    get renders() { return renders; },
    get doel() { return doel; },
    get zichtbaar() { return zichtbaar; },
  };
  root.__lottieScrubDestroy = destroy;
  return destroy;
}
