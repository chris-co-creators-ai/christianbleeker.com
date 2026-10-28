/**
 * punt-zoom-intro
 * ------------------------------------------------------------------------
 * Fullscreen intro in merkkleur met een inline SVG-logo. Na een korte pauze
 * zoomt de camera in op één gemarkeerd deel van het logo (`[data-zoom-target]`,
 * bijvoorbeeld een punt of een letter) terwijl dat deel tegelijk een rond
 * gat in de overlay wordt (SVG-mask) — de cirkel groeit tot de hele
 * viewport bedekt is en de site zichtbaar wordt. Eén matrix-transform op
 * het logo en één cirkelradius, in dezelfde animatieframe-lus, met
 * easeInOutCubic.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan zodra `init()` draait.
 *
 * Herkomst: gedrag en getallen (500ms pauze, 1200ms zoom, +200px extra
 * radius) gezien bij een referentiesite (24-09-2026) — eigen implementatie, geen
 * code overgenomen. Zie README "Herkomst".
 *
 * @typedef {Object} PuntZoomIntroOptions
 * @property {number} [startVertraging=500] Pauze in ms vóór de zoom start, logo staat eerst stil in beeld.
 * @property {number} [duur=1200] Duur van de zoom-animatie in ms.
 * @property {number} [extraRadius=200] Extra pixels bovenop de minimale radius die de hele viewport dekt (voorkomt een randje).
 * @property {string} [sleutel="punt-zoom-intro"] Sleutel voor de frequentiegrens (`frequentie()` uit basis.js) — 1x per sessie.
 * @property {number} [faalveiligMs=2500] Absolute grens: hierna is de overlay hoe dan ook weg, ongeacht wat er misging (R2/R12).
 *
 * @param {Element} root Container met `data-punt-zoom-intro` en daarbinnen
 *   verplicht `.pzi-logo-wrap > svg [data-zoom-target]`. Ontbreekt dat
 *   contract, dan verdwijnt de overlay meteen (geen crash, wel een warning).
 * @param {PuntZoomIntroOptions} [opties]
 * @returns {() => void} destroy — idempotent, herstelt scroll en verbergt de overlay (verwijdert `root` nooit uit de DOM — veilig voor React-children).
 */
import { minderBeweging, frequentie, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const NAAM = 'punt-zoom-intro';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, NAAM)) return () => {};

  const opts = {
    startVertraging: 500,
    duur: 1200,
    extraRadius: 200,
    sleutel: 'punt-zoom-intro',
    faalveiligMs: 2500,
    ...zonderUndefined(opties),
  };

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const html = doc.documentElement;
  const body = doc.body;

  const freq = frequentie(opts.sleutel, { perSessie: true }, doc);
  const reduced = minderBeweging(undefined, doc).reduced;

  const wrap = root.querySelector('.pzi-logo-wrap');
  const svg = wrap ? wrap.querySelector('svg') : null;
  const target = svg ? svg.querySelector('[data-zoom-target]') : null;

  // root wordt nooit uit de DOM gehaald (React beheert `children` mogelijk
  // zelf) — verbergen via [hidden] is voor elk gebruik veilig.
  function verbergDirect() {
    root.hidden = true;
    return () => { root.hidden = true; };
  }

  if (!freq.mag) return verbergDirect();

  if (!wrap || !svg || !target) {
    if (typeof console !== 'undefined') {
      console.warn(`${NAAM}: verwacht ".pzi-logo-wrap > svg [data-zoom-target]" in root — intro overgeslagen`);
    }
    freq.markeer();
    return verbergDirect();
  }

  if (reduced) {
    freq.markeer();
    return verbergDirect();
  }

  freq.markeer();

  const prevHtmlOverflow = html.style.overflow;
  const prevBodyOverflow = body.style.overflow;
  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';

  let destroyed = false;
  let geometry = null;
  let raf1 = 0;
  let raf2 = 0;
  let animFrame = 0;
  let startTimer = 0;
  const failTimer = win.setTimeout(destroy, opts.faalveiligMs);

  // --- SVG-masker: eigen element, WIJ maken en ruimen het op (nooit de
  // door de gebruiker aangeleverde svg/wrap aanraken qua verwijderen). ----
  const ns = 'http://www.w3.org/2000/svg';
  const uid = `pzi-${Math.random().toString(36).slice(2, 9)}`;
  const maskSvg = doc.createElementNS(ns, 'svg');
  maskSvg.setAttribute('class', 'pzi-mask-svg');
  maskSvg.setAttribute('aria-hidden', 'true');
  maskSvg.setAttribute('focusable', 'false');
  maskSvg.setAttribute('preserveAspectRatio', 'none');
  maskSvg.innerHTML =
    `<defs><mask id="${uid}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">` +
    `<rect class="pzi-mask-basis" fill="#fff"/><circle class="pzi-gat" r="0" fill="#000"/>` +
    `</mask></defs><rect class="pzi-vlak" mask="url(#${uid})"/>`;
  root.insertBefore(maskSvg, root.firstChild);

  const maskBasis = maskSvg.querySelector('.pzi-mask-basis');
  const gat = maskSvg.querySelector('.pzi-gat');
  const vlak = maskSvg.querySelector('.pzi-vlak');

  function configureerViewport() {
    const vw = win.innerWidth;
    const vh = win.innerHeight;
    maskSvg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    maskSvg.setAttribute('width', String(vw));
    maskSvg.setAttribute('height', String(vh));
    for (const el of [maskBasis, vlak]) {
      el.setAttribute('x', '0');
      el.setAttribute('y', '0');
      el.setAttribute('width', String(vw));
      el.setAttribute('height', String(vh));
    }
  }

  function meten() {
    if (destroyed) return false;

    wrap.classList.remove('pzi-is-klaar');
    wrap.style.left = '50%';
    wrap.style.top = '50%';
    wrap.style.width = '';
    wrap.style.height = 'auto';
    wrap.style.transform = 'translate(-50%, -50%)';
    wrap.style.transformOrigin = '0 0';

    configureerViewport();

    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox && svg.viewBox.baseVal;
    let doelBox = null;
    try { doelBox = target.getBBox(); } catch { doelBox = null; }

    if (!rect.width || !rect.height || !vb || !vb.width || !vb.height || !doelBox || !doelBox.width || !doelBox.height) {
      return false;
    }

    // Schaal tussen SVG-viewBox-eenheden en CSS-pixels (preserveAspectRatio
    // van het originele logo blijft intact — dit is één uniforme schaal).
    const svgSchaal = Math.min(rect.width / vb.width, rect.height / vb.height);
    const renderBreedte = vb.width * svgSchaal;
    const renderHoogte = vb.height * svgSchaal;
    const offsetX = (rect.width - renderBreedte) / 2;
    const offsetY = (rect.height - renderHoogte) / 2;

    const doelSvgX = doelBox.x + doelBox.width / 2;
    const doelSvgY = doelBox.y + doelBox.height / 2;
    const lokaalX = offsetX + (doelSvgX - vb.x) * svgSchaal;
    const lokaalY = offsetY + (doelSvgY - vb.y) * svgSchaal;

    const doelRadius = Math.min(doelBox.width * svgSchaal, doelBox.height * svgSchaal) / 2;

    const vw = win.innerWidth;
    const vh = win.innerHeight;
    const midX = vw / 2;
    const midY = vh / 2;
    const eindRadius = Math.sqrt(vw * vw + vh * vh) / 2 + opts.extraRadius;
    const eindSchaal = eindRadius / doelRadius;

    const startLeft = rect.left;
    const startTop = rect.top;
    const eindTx = midX - startLeft - lokaalX * eindSchaal;
    const eindTy = midY - startTop - lokaalY * eindSchaal;

    geometry = { startLeft, startTop, lokaalX, lokaalY, doelRadius, eindSchaal, eindTx, eindTy };

    wrap.style.left = `${startLeft}px`;
    wrap.style.top = `${startTop}px`;
    wrap.style.width = `${rect.width}px`;
    wrap.style.height = `${rect.height}px`;
    wrap.style.transformOrigin = '0 0';
    wrap.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';

    gat.setAttribute('cx', String(startLeft + lokaalX));
    gat.setAttribute('cy', String(startTop + lokaalY));
    gat.setAttribute('r', '0');

    root.classList.add('pzi-is-masker-klaar');
    wrap.classList.add('pzi-is-klaar');
    return true;
  }

  function teken(voortgang) {
    const p = easeInOutCubic(Math.max(0, Math.min(1, voortgang)));
    const schaal = 1 + (geometry.eindSchaal - 1) * p;
    const tx = geometry.eindTx * p;
    const ty = geometry.eindTy * p;

    wrap.style.transform = `matrix(${schaal}, 0, 0, ${schaal}, ${tx}, ${ty})`;

    const gatX = geometry.startLeft + tx + geometry.lokaalX * schaal;
    const gatY = geometry.startTop + ty + geometry.lokaalY * schaal;
    gat.setAttribute('cx', String(gatX));
    gat.setAttribute('cy', String(gatY));
    gat.setAttribute('r', String(geometry.doelRadius * schaal));
  }

  function zoomStart() {
    if (destroyed || !geometry) return;
    target.style.opacity = '0';
    gat.setAttribute('r', String(geometry.doelRadius));
    const gestart = win.performance.now();

    function tick(now) {
      if (destroyed) return;
      const t = Math.min(1, (now - gestart) / opts.duur);
      teken(t);
      if (t < 1) {
        animFrame = win.requestAnimationFrame(tick);
      } else {
        animFrame = win.requestAnimationFrame(destroy);
      }
    }
    animFrame = win.requestAnimationFrame(tick);
  }

  function overslaan() {
    if (destroyed) return;
    destroy();
  }
  function onKey() { overslaan(); }
  function onClick() { overslaan(); }
  doc.addEventListener('keydown', onKey);
  root.addEventListener('click', onClick);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (animFrame) win.cancelAnimationFrame(animFrame);
    if (raf1) win.cancelAnimationFrame(raf1);
    if (raf2) win.cancelAnimationFrame(raf2);
    win.clearTimeout(startTimer);
    win.clearTimeout(failTimer);
    doc.removeEventListener('keydown', onKey);
    root.removeEventListener('click', onClick);

    html.style.overflow = prevHtmlOverflow;
    body.style.overflow = prevBodyOverflow;

    if (maskSvg.parentNode) maskSvg.remove();
    wrap.classList.remove('pzi-is-klaar');
    wrap.style.cssText = '';
    target.style.opacity = '';
    root.classList.remove('pzi-is-masker-klaar');
    root.hidden = true;
  }

  // Inline SVG is al beschikbaar; twee frames geven de browser de tijd om
  // CSS/viewBox/getBBox te stabiliseren vóór het meten.
  raf1 = win.requestAnimationFrame(() => {
    raf2 = win.requestAnimationFrame(() => {
      if (meten()) {
        startTimer = win.setTimeout(zoomStart, opts.startVertraging);
      } else {
        destroy();
      }
    });
  });

  return destroy;
}
