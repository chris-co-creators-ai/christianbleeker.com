/**
 * film-grain
 * ------------------------------------------------------------------------
 * Bewegende filmkorrel over de hele pagina. De ruis wordt zelf gegenereerd
 * (canvas → data-URL, willekeurige grijswaarden + alpha per pixel) — geen
 * png nodig. De laag is groter dan de viewport (130%) en beweegt met een lage framerate via `transform: translate()`
 * binnen die overhang, zodat er nooit een rand zichtbaar wordt en er
 * alleen met transform/opacity geanimeerd wordt (R18).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan zodra `init()` draait.
 *
 * @typedef {Object} FilmGrainOptions
 * @property {number} [sterkte=0.05] Zichtbaarheid van de korrel (0..1, wordt de CSS-opacity van de laag).
 * @property {number} [fps=12] Aantal wisselingen per seconde — laag houden voor een filmisch, geen glad, effect.
 * @property {number} [tegelGrootte=200] Breedte/hoogte van de gegenereerde ruistegel in pixels.
 *
 * @param {Element} root Mount-point waarin de laag wordt toegevoegd (bv. `document.body`). De module raakt geen andere inhoud van `root` aan.
 * @param {FilmGrainOptions} [opties]
 * @returns {() => void} destroy — idempotent, verwijdert de toegevoegde laag en alle listeners.
 */
import { minderBeweging, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const NAAM = 'film-grain';

function maakRuisDataUrl(doc, grootte) {
  const canvas = doc.createElement('canvas');
  canvas.width = grootte;
  canvas.height = grootte;
  const ctx = canvas.getContext('2d');
  const beeld = ctx.createImageData(grootte, grootte);
  const data = beeld.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 256) | 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = (Math.random() * 256) | 0;
  }
  ctx.putImageData(beeld, 0, 0);
  return canvas.toDataURL('image/png');
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, NAAM)) return () => {};

  const opts = { sterkte: 0.05, fps: 12, tegelGrootte: 200, ...zonderUndefined(opties) };

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const laag = doc.createElement('div');
  laag.className = 'fg-laag';
  laag.setAttribute('aria-hidden', 'true');
  laag.style.setProperty('--fg-sterkte', String(opts.sterkte));
  laag.style.setProperty('--fg-tegel', `${opts.tegelGrootte}px`);
  laag.style.backgroundImage = `url("${maakRuisDataUrl(doc, opts.tegelGrootte)}")`;
  root.appendChild(laag);

  let destroyed = false;
  let actief = false;
  let raf = 0;
  let laatst = 0;

  function stap(now) {
    if (!actief) return;
    if (now - laatst >= 1000 / opts.fps) {
      laatst = now;
      // Percentages zijn relatief aan de eigen (130%) grootte van de laag,
      // dus dit blijft altijd ruim binnen de 15%-overhang — geen rand
      // zichtbaar, ongeacht viewportgrootte.
      const x = (Math.random() * 2 - 1) * 10;
      const y = (Math.random() * 2 - 1) * 10;
      laag.style.transform = `translate(${x.toFixed(2)}%, ${y.toFixed(2)}%)`;
    }
    raf = win.requestAnimationFrame(stap);
  }

  function start() {
    if (actief || destroyed) return;
    actief = true;
    laatst = 0;
    raf = win.requestAnimationFrame(stap);
  }

  function stop() {
    actief = false;
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
  }

  const beweging = minderBeweging((isReduced) => {
    if (isReduced) stop(); else if (!doc.hidden) start();
  }, doc);

  function onZichtbaarheid() {
    if (doc.hidden) stop();
    else if (!beweging.reduced) start();
  }
  doc.addEventListener('visibilitychange', onZichtbaarheid);

  if (!beweging.reduced && !doc.hidden) start();

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    beweging.stop();
    doc.removeEventListener('visibilitychange', onZichtbaarheid);
    if (laag.parentNode) laag.remove();
  };
}
