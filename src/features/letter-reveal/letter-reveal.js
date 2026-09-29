/**
 * letter-reveal
 * ------------------------------------------------------------------------
 * Een kop komt letter voor letter omhoog en in beeld: opacity 0 -> 1,
 * translateY(18px) -> 0, 0,8s ease-out per letter, met instelbare stagger.
 * Een tweede regel (`data-lr-line="secondary"`) krijgt via CSS een eigen
 * kleur en via een optie/attribuut een eigen startvertraging boven op de
 * doorlopende stagger.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan binnen `init()`. De animatie zelf is pure CSS (`@keyframes`) — die
 * speelt vanzelf zodra de losse letter-spans bestaan. JS doet alleen het
 * splitsen (woorden blijven heel, geen afbreking midden in een woord) en
 * zet de `--d`-vertraging per letter.
 *
 * Verschil met `scroll/hero-motion`: hero-motion is zwaarder — de regels
 * zitten in een `overflow:hidden`-masker (letters schuiven van 105% naar 0%
 * ONDER de regel vandaan) én de hele hero trekt zich bovendien terug bij
 * wegscrollen (JS-gekoppelde "recede", met scroll-listener). letter-reveal
 * doet alléén de opkomst: geen masker, geen scroll-koppeling, geen
 * scroll/resize-listeners — puur een CSS-animatie die start zodra de letters
 * bestaan. Gebruik hero-motion voor een volledige hero-sectie die ook bij
 * het wegscrollen moet reageren; letter-reveal voor een losse kop die
 * ergens op de pagina (niet per se de hero) moet "aankomen".
 *
 * Herkomst: techniek gezien op christianbleeker.com (24-09-2026) — daar
 * heet de keyframe `hero-reveal` (`@keyframes hero-reveal{0%{opacity:0;
 * transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`,
 * gemeten in `../research/christianbleeker/bundles/0vbyedifgybiy.css`):
 * elke letter 0,5s, de tweede regel als één blok van 0,8s op 1,05s
 * vertraging. Eigen implementatie, geen code overgenomen: wij gebruiken
 * 0,8s voor élke letter (niet alleen de tweede regel), splitsen zelf per
 * letter met een doorlopende stagger, en maken zowel de stagger als de
 * regelvertraging instelbaar via opties/attributen.
 *
 * @typedef {Object} LetterRevealOptions
 * @property {string} [lineSelector="[data-lr-line]"] Selector voor regel-containers binnen de kop.
 * @property {number} [duration=0.8] Seconden animatieduur per letter (zet `--lr-duration`).
 * @property {number} [stagger=0.035] Seconden vertraging per volgende (niet-spatie-)letter, doorlopend over alle regels heen.
 * @property {number} [lineGap=0.15] Extra vertraging (seconden) per regel-index bovenop de doorlopende stagger — regel 2 krijgt dus stagger-vertraging + 1×lineGap, tenzij `data-lr-line-delay` op die regel dat overschrijft.
 *
 * @param {Element} root De kop zelf (bv. een `<h1>`) met daarin `[data-lr-line]`-regels.
 * @param {LetterRevealOptions} [options]
 * @returns {() => void} destroy — herstelt de oorspronkelijke tekst-inhoud (geen losse letter-spans, geen toegevoegde attributen). Idempotent aan te roepen.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

const CH_ATTR = 'data-lr-ch';

function isSpace(ch) {
  return /^\s$/.test(ch);
}

export function init(root, options = {}) {
  if (!vereisRoot(root, 'letter-reveal')) return () => {};

  const opts = {
    lineSelector: '[data-lr-line]',
    duration: 0.8,
    stagger: 0.035,
    lineGap: 0.15,
    ...options,
  };

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const lines = Array.from(root.querySelectorAll(opts.lineSelector));
  if (lines.length === 0) {
    if (typeof console !== 'undefined') {
      console.warn('letter-reveal: geen [data-lr-line]-elementen gevonden — overgeslagen');
    }
    return () => {};
  }

  const originalHTML = root.innerHTML;
  const hadAriaLabel = root.hasAttribute('aria-label');
  const originalAriaLabel = root.getAttribute('aria-label');

  const fullText = lines.map((l) => (l.textContent || '').trim()).join(' ');
  root.setAttribute('aria-label', fullText);
  root.style.setProperty('--lr-duration', `${opts.duration}s`);

  const { reduced: reduceMotion } = minderBeweging(undefined, doc);

  let n = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    line.classList.add('lr-line');
    line.setAttribute('aria-hidden', 'true');

    // Reduced motion: platte, leesbare tekst laten staan — geen split, geen
    // vertragingen. De schermlezer krijgt de tekst via aria-label op root.
    if (reduceMotion) continue;

    const explicitDelay = line.getAttribute('data-lr-line-delay');
    const lineDelay =
      explicitDelay !== null && explicitDelay !== '' ? Number(explicitDelay) : opts.lineGap * lineIndex;

    const text = (line.textContent || '').trim();
    const frag = doc.createDocumentFragment();
    let currentWord = null;

    const flushWord = () => {
      if (currentWord) {
        frag.appendChild(currentWord);
        currentWord = null;
      }
    };

    for (const part of text.split(/(\s+)/).filter((p) => p.length > 0)) {
      if (isSpace(part)) {
        flushWord();
        const span = doc.createElement('span');
        span.className = 'lr-ch lr-ch--space';
        span.setAttribute(CH_ATTR, '');
        span.style.setProperty('--d', `${(lineDelay + n * opts.stagger).toFixed(3)}s`);
        span.textContent = ' ';
        frag.appendChild(span);
      } else {
        if (!currentWord) {
          currentWord = doc.createElement('span');
          currentWord.className = 'lr-word';
        }
        for (const ch of Array.from(part)) {
          n += 1;
          const span = doc.createElement('span');
          span.className = 'lr-ch';
          span.setAttribute(CH_ATTR, '');
          span.style.setProperty('--d', `${(lineDelay + n * opts.stagger).toFixed(3)}s`);
          span.textContent = ch;
          currentWord.appendChild(span);
        }
      }
    }
    flushWord();
    line.replaceChildren(frag);
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    root.innerHTML = originalHTML;
    if (hadAriaLabel) root.setAttribute('aria-label', originalAriaLabel);
    else root.removeAttribute('aria-label');
    root.style.removeProperty('--lr-duration');
  };
}
