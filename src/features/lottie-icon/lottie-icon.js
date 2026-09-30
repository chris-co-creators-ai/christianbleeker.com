/**
 * lottie-icon
 * ------------------------------------------------------------------------
 * Een lijn-icoon dat zichzelf tekent (Lottie-animatie), maar de player pas
 * laadt zodra het bijna in beeld komt. Tot dat moment (en zonder JS) staat
 * er een statische SVG-fallback — die IS het eindbeeld van de tekening, dus
 * dient meteen ook als het "stilstaand eindframe" bij "minder beweging"
 * (zie hieronder: bij reduced motion laadt de player helemaal niet).
 *
 * Vanilla ES-module, SSR-veilig: raakt window/document pas aan bij
 * `init()`. Enige afhankelijkheid: een lokaal gevendorde Lottie-player
 * (`vendor/lottie_light.min.js`, lottie-web 5.13.0, MIT — zie README
 * "Herkomst van de vendor"), geladen via een dynamic `import()` die pas
 * wordt aangeroepen zodra de IntersectionObserver vuurt. Vóór dat moment
 * staat er 0 bytes Lottie-code in de pagina.
 *
 * Waarom geen player laden bij "minder beweging": de fallback-SVG in de
 * markup toont al exact de volledig getekende vorm (dezelfde coördinaten
 * als het laatste frame van de Lottie-JSON, zie assets/*.svg) — die laden
 * kost niets extra, in tegenstelling tot de ~365KB player + JSON. Dat is
 * dus zowel de zuinigste als de eenvoudigste manier om aan R1 te voldoen.
 *
 * R1 geldt ook halverwege: `minderBeweging(onChange)` luistert live, dus
 * zet je "minder beweging" aan terwijl een icoon al speelt, dan pauzeert
 * het en springt naar zijn laatste frame (vast eindbeeld) i.p.v. door te
 * blijven lopen (een losse, eenmalige matchMedia-check zag de wissel niet).
 *
 * @typedef {Object} LottieIconOptions
 * @property {string} [src] Pad naar de Lottie-JSON. Overschrijft `data-lottie-src` op root.
 * @property {boolean} [loop] Bij true (standaard) loopt de animatie door; bij false speelt hij één keer en blijft het laatste frame staan. Overschrijft `data-lottie-loop`.
 * @property {string} [rootMargin="200px"] IntersectionObserver-rootMargin — hoe ver vóór het echte in-beeld-komen de player al laadt. Kleiner dan de 600px-richtlijn voor video/3D (R17): een los icoon is klein en goedkoop te renderen, dus hoeft niet zo vroeg te starten.
 * @property {string} [label] Betekenisvolle omschrijving. Gezet: root krijgt `role="img"` + `aria-label`. Niet gezet (standaard, of `data-lottie-label` ontbreekt): root krijgt `aria-hidden="true"` (decoratief).
 *
 * @param {Element} root `[data-lottie-icon]`-element; bevat een `[data-lottie-fallback]`-afbeelding als no-JS-fallback.
 * @param {LottieIconOptions} [options]
 * @returns {() => void} destroy — pauzeert/vernietigt de player, ruimt observers/listeners/toegevoegde elementen op. Idempotent.
 */
import { minderBeweging, vereisRoot, inBeeld } from '../../_kwaliteit/basis.js';

const ACTIVE_ATTR = 'data-lottie-active';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'lottie-icon')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const src = options.src || root.getAttribute('data-lottie-src');
  if (!src) {
    if (typeof console !== 'undefined') {
      console.warn('lottie-icon: geen src (optie of data-lottie-src) — overgeslagen');
    }
    return () => {};
  }

  const loopAttr = root.getAttribute('data-lottie-loop');
  const opts = {
    loop: options.loop ?? (loopAttr !== 'false'),
    rootMargin: options.rootMargin || '200px',
    label: options.label ?? root.getAttribute('data-lottie-label') ?? null,
  };

  if (opts.label) {
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', opts.label);
  } else {
    root.setAttribute('aria-hidden', 'true');
  }

  let destroyed = false;
  let anim = null;
  let mountEl = null;
  let visible = false;
  let reduced = false;
  let stopObserving = defaultStop;

  function onVisibilityChange() {
    if (!anim || reduced) return;
    if (doc.hidden) anim.pause();
    else if (visible) anim.play();
  }

  function startObserving() {
    if (stopObserving !== defaultStop) return; // al actief
    stopObserving = inBeeld(root, onEnter, { once: false, rootMargin: opts.rootMargin, bijUit: onExit });
  }

  function defaultStop() {}

  async function mount() {
    if (destroyed || anim || reduced) return;
    mountEl = doc.createElement('div');
    mountEl.className = 'li-stage';
    root.appendChild(mountEl);

    let lottie;
    try {
      ({ default: lottie } = await import('./vendor/lottie_light.min.js'));
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('lottie-icon: player kon niet laden —', err);
      mountEl.remove();
      mountEl = null;
      return;
    }
    if (destroyed || reduced) {
      // destroy() liep, of de bezoeker zette "minder beweging" aan terwijl
      // de import onderweg was — dan geen player meer mounten.
      mountEl.remove();
      mountEl = null;
      return;
    }

    anim = lottie.loadAnimation({
      container: mountEl,
      renderer: 'svg',
      loop: opts.loop,
      autoplay: visible,
      path: src,
    });
    root.setAttribute(ACTIVE_ATTR, '');
    doc.addEventListener('visibilitychange', onVisibilityChange);
    // Introspectie voor het meetscript (frame-teller, speelstatus) — geen
    // onderdeel van het publieke contract, maar handiger dan een tweede,
    // parallelle boekhouding van dezelfde staat.
    root.__lottieAnim = anim;
  }

  function onEnter() {
    visible = true;
    if (reduced) return;
    if (!anim && !mountEl) mount();
    else if (anim && !doc.hidden) anim.play();
  }

  function onExit() {
    visible = false;
    if (anim) anim.pause();
  }

  // R1: reageert live op een halverwege omgezette voorkeur, niet alleen op
  // de stand bij het laden (`minderBeweging(onChange)` i.p.v. een losse
  // eenmalige matchMedia-check — anders liep de
  // animatie gewoon door nadat de bezoeker "minder beweging" aanzette).
  function onReduceChange(nowReduced) {
    reduced = nowReduced;
    if (reduced) {
      stopObserving();
      stopObserving = defaultStop;
      if (anim) {
        // Pauzeert én zet het eindbeeld vast (R1: "het eindbeeld is gewoon
        // zichtbaar"), i.p.v. alleen pauzeren op een willekeurig tussenframe.
        anim.goToAndStop(Math.max(0, anim.totalFrames - 1), true);
      }
    } else if (!destroyed) {
      if (anim) {
        if (visible && !doc.hidden) anim.play();
      } else {
        startObserving();
      }
    }
  }

  const { reduced: initialReduced, stop: stopReduceWatch } = minderBeweging(onReduceChange, doc);
  reduced = initialReduced;

  if (!reduced) {
    startObserving();
  }
  // Bij minder beweging: geen observer, geen mount — de statische fallback-
  // SVG in de markup blijft zichtbaar (zie module-uitleg hierboven).

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopReduceWatch();
    stopObserving();
    doc.removeEventListener('visibilitychange', onVisibilityChange);
    if (anim) {
      anim.destroy();
      anim = null;
    }
    delete root.__lottieAnim;
    if (mountEl) {
      mountEl.remove();
      mountEl = null;
    }
    root.removeAttribute(ACTIVE_ATTR);
    root.removeAttribute('role');
    root.removeAttribute('aria-label');
    root.removeAttribute('aria-hidden');
  };
}
