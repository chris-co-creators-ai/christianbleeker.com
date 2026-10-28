/**
 * parallax
 * ------------------------------------------------------------------------
 * Geeft elementen met `data-parallax-y`/`-x`/`-rotate`/`-scale` een lichte
 * verschuiving terwijl de bezoeker scrolt, en (optioneel, met
 * `data-parallax-mouse`) een muis-volg-effect. Vanilla ES-module,
 * 0 dependencies, SSR-veilig: raakt `window`/`document` pas aan binnen
 * `init()`.
 *
 * Alleen `transform` wordt geanimeerd (R18). Per element loopt de
 * scroll-berekening alleen zolang het (bijna) in beeld is
 * (IntersectionObserver, rootMargin 25%) — daarbuiten kost een element
 * niets. Muis-volgen staat helemaal uit op touch (R3): er is geen
 * aanhoudende muispositie op een telefoon.
 *
 *
 * @typedef {Object} ParallaxOptions
 * @property {string} [selector] CSS-selector voor de te bewegen elementen. Standaard: alle vier data-parallax-attributen samen.
 * @property {string} [rootMargin='25% 0px 25% 0px'] IntersectionObserver-marge: hoe ver vóór het in beeld komen de berekening al start.
 *
 * @param {Element} root Container waarbinnen naar parallax-elementen wordt gezocht.
 * @param {ParallaxOptions} [options]
 * @returns {() => void} destroy — ruimt observer, listeners en toegepaste transforms op. Idempotent.
 */
import { minderBeweging, isTouch, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

const DEFAULT_SELECTOR =
  '[data-parallax-y], [data-parallax-x], [data-parallax-rotate], [data-parallax-scale], [data-parallax-mouse]';

function num(value, fallback = 0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function init(root, options = {}) {
  if (!vereisRoot(root, 'parallax')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const selector = options.selector || DEFAULT_SELECTOR;
  const rootMargin = options.rootMargin || '25% 0px 25% 0px';

  const elements = Array.from(root.querySelectorAll(selector)).map((el) => ({
    el,
    y: num(el.getAttribute('data-parallax-y'), 0),
    x: num(el.getAttribute('data-parallax-x'), 0),
    rotate: num(el.getAttribute('data-parallax-rotate'), 0),
    scale: num(el.getAttribute('data-parallax-scale'), 0),
    mouse: el.hasAttribute('data-parallax-mouse') ? num(el.getAttribute('data-parallax-mouse'), 20) : 0,
    active: false,
  }));

  if (elements.length === 0) return () => {};

  const touch = isTouch(doc);
  let destroyed = false;
  let mouseX = 0.5;
  let mouseY = 0.5; // genormaliseerd 0..1 t.o.v. de viewport

  function clearTransform(item) {
    item.el.style.transform = '';
  }

  function applyItem(item) {
    if (!item.active) return;
    const rect = item.el.getBoundingClientRect();
    const vh = win.innerHeight || 1;
    // progress: -0.5 (net onderaan binnengekomen) .. +0.5 (net bovenaan uitgaand)
    const centerY = rect.top + rect.height / 2;
    const progress = (centerY / vh) - 0.5;

    let tx = -progress * item.x;
    let ty = -progress * item.y;
    const rot = -progress * item.rotate;
    const scale = 1 + -progress * item.scale;

    if (item.mouse && !touch) {
      tx += (mouseX - 0.5) * 2 * item.mouse;
      ty += (mouseY - 0.5) * 2 * item.mouse;
    }

    const parts = [];
    if (tx || ty) parts.push(`translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`);
    if (rot) parts.push(`rotate(${rot.toFixed(2)}deg)`);
    if (scale !== 1) parts.push(`scale(${scale.toFixed(4)})`);
    item.el.style.transform = parts.join(' ');
  }

  function applyAll() {
    for (const item of elements) applyItem(item);
  }

  const onScroll = perFrame(applyAll, doc);
  const onMouseMove = perFrame((event) => {
    mouseX = event.clientX / (win.innerWidth || 1);
    mouseY = event.clientY / (win.innerHeight || 1);
    applyAll();
  }, doc);

  let scrollBound = false;
  let mouseBound = false;

  function bindLive() {
    if (!scrollBound) {
      win.addEventListener('scroll', onScroll, { passive: true });
      win.addEventListener('resize', onScroll, { passive: true });
      scrollBound = true;
    }
    if (!touch && !mouseBound && elements.some((item) => item.mouse)) {
      win.addEventListener('mousemove', onMouseMove, { passive: true });
      mouseBound = true;
    }
  }

  function unbindLive() {
    if (scrollBound) {
      win.removeEventListener('scroll', onScroll);
      win.removeEventListener('resize', onScroll);
      onScroll.cancel();
      scrollBound = false;
    }
    if (mouseBound) {
      win.removeEventListener('mousemove', onMouseMove);
      onMouseMove.cancel();
      mouseBound = false;
    }
  }

  function applyMode(isReduced) {
    reduced = isReduced;
    if (reduced) {
      unbindLive();
      for (const item of elements) clearTransform(item);
    } else {
      bindLive();
      applyAll();
    }
  }

  const reduceHandle = minderBeweging(applyMode, doc);
  let reduced = reduceHandle.reduced;

  const io = 'IntersectionObserver' in win
    ? new win.IntersectionObserver((entries) => {
        for (const entry of entries) {
          const item = elements.find((it) => it.el === entry.target);
          if (!item) continue;
          item.active = entry.isIntersecting;
          if (!item.active) clearTransform(item);
          else if (!reduced) applyItem(item);
        }
      }, { rootMargin, threshold: 0 })
    : null;

  if (io) {
    for (const item of elements) io.observe(item.el);
  } else {
    // Geen IO-support: alles als altijd-actief behandelen.
    for (const item of elements) item.active = true;
  }

  applyMode(reduced);

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    reduceHandle.stop();
    unbindLive();
    if (io) io.disconnect();
    for (const item of elements) clearTransform(item);
  };
}
