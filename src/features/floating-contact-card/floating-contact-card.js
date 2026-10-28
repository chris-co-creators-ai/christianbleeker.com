/**
 * floating-contact-card
 * ------------------------------------------------------------------------
 * "Snel contact"-kaartje dat met een negatieve bovenmarge over de rand van
 * een hero zweeft (telefoon + openingsregel + CTA). De CSS-variabele
 * `--fcc-overlap` heeft in floating-contact-card.css al een kleine, veilige
 * standaardwaarde — dat is de zonder-JS-fallback (R4). Met JS leest deze
 * module `data-overlap` om die waarde per instantie te verruimen, en meet
 * daarna of de kaart ondanks dat écht een aangewezen tekstelement
 * (`data-vermijd`) overlapt (bv. omdat de hero-kop door een langere
 * vertaling meer regels beslaat) — zo ja, dan verkleint hij de overlap net
 * zo lang tot dat niet meer zo is.
 *
 * Op mobiel (≤ `data-breakpoint`) vervalt de overlap altijd: de kaart staat
 * daar gewoon in de flow (puur CSS, geen JS nodig).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan in `init()`. Kan optioneel een genest `open-status`-component
 * bevatten voor de openingsregel — deze module bemoeit zich daar niet mee,
 * initialiseer dat gewoon apart (zie README/demo).
 *
 * @typedef {Object} FloatingContactCardOptions
 * @property {string} [overlap] Standaard-overlap als CSS-lengte, bv. "4rem". Standaard uit `data-overlap` of "4rem".
 * @property {string} [vermijd] CSS-selector van het tekstelement dat nooit bedekt mag raken (meestal de hero-kop).
 * @property {number} [breakpoint] Boven welke viewportbreedte (px) de overlap actief is. Standaard 768 (ook in CSS).
 *
 * @param {Element} root Het kaartje zelf, met `data-floating-contact-card`.
 * @param {FloatingContactCardOptions} [opties]
 * @returns {() => void} destroy — verwijdert de resize-listener en zet de overlap-variabele terug. Idempotent.
 */
import { perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

function naarPx(win, waarde) {
  // Zet een CSS-lengte ("4rem", "64px") om naar een pixelgetal via een meet-element.
  const doc = win.document;
  const meet = doc.createElement('div');
  meet.style.cssText = `position:absolute;visibility:hidden;height:${waarde};`;
  doc.body.appendChild(meet);
  const px = meet.getBoundingClientRect().height;
  meet.remove();
  return px;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'floating-contact-card')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const overlapStandaard = opties.overlap ?? root.getAttribute('data-overlap') ?? '4rem';
  const vermijdSelector = opties.vermijd ?? root.getAttribute('data-vermijd');
  const breakpoint = opties.breakpoint ?? (Number(root.getAttribute('data-breakpoint')) || 768);

  const origineleVar = root.style.getPropertyValue('--fcc-overlap');
  root.style.setProperty('--fcc-overlap', overlapStandaard);

  const vermijdEl = vermijdSelector ? doc.querySelector(vermijdSelector) : null;
  const mq = win.matchMedia(`(min-width: ${breakpoint}px)`);

  function pasAan() {
    if (!vermijdEl || !mq.matches) {
      root.style.setProperty('--fcc-overlap', mq.matches ? overlapStandaard : '0px');
      return;
    }
    let huidigePx = naarPx(win, overlapStandaard);
    for (let i = 0; i < 20 && huidigePx > 0; i += 1) {
      root.style.setProperty('--fcc-overlap', `${huidigePx}px`);
      const kaartRect = root.getBoundingClientRect();
      const tekstRect = vermijdEl.getBoundingClientRect();
      const overlapt = kaartRect.left < tekstRect.right && kaartRect.right > tekstRect.left
        && kaartRect.top < tekstRect.bottom && kaartRect.bottom > tekstRect.top;
      if (!overlapt) break;
      huidigePx = Math.max(0, huidigePx - 8);
    }
  }

  const resizeHandler = perFrame(pasAan, doc);
  win.addEventListener('resize', resizeHandler, { passive: true });
  mq.addEventListener ? mq.addEventListener('change', pasAan) : mq.addListener(pasAan);
  pasAan();

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    win.removeEventListener('resize', resizeHandler);
    resizeHandler.cancel();
    mq.removeEventListener ? mq.removeEventListener('change', pasAan) : mq.removeListener(pasAan);
    if (origineleVar) root.style.setProperty('--fcc-overlap', origineleVar);
    else root.style.removeProperty('--fcc-overlap');
  };
}
