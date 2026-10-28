/**
 * justify-fill
 * ------------------------------------------------------------------------
 * Een kop die precies de volle breedte vult, per regel — zonder de bekende
 * `::after`-truc (een onzichtbaar, oneindig breed pseudo-element om
 * `text-align-last: justify` te forceren; die breekt bij meerdere regels en
 * bij een laatste regel die toevallig bijna vol is). In plaats daarvan:
 * woorden per regel in een eigen flex-rij (`justify-content: space-between`)
 * — de browser verdeelt de resterende ruimte zelf, geen handmatige
 * letter-spacing-berekening nodig. Robuust bij resize (regels worden
 * herberekend) en bij fontload (`document.fonts.ready` vóór de eerste
 * layout-afhankelijke meting, zodat er niet op verkeerde lettermaten
 * gemeten wordt). Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * Herkomst: "Uitgevulde reuzetekst" gezien op een bureausite, met de
 * klassieke `::after`-truc. Eigen implementatie: geen code overgenomen, en
 * met een andere techniek (per-regel flex i.p.v. pseudo-element).
 *
 * @typedef {Object} JustifyFillOptions
 * @property {boolean} [lastLine=true] Ook de laatste regel volledig uitvullen (anders van nature links uitgelijnd).
 *
 * @param {Element} root Het element met `data-justify-fill` — de platte tekst wordt bij `init()` gelezen en herschreven tot regels/woorden.
 * @param {JustifyFillOptions} [options]
 * @returns {() => void} destroy — herstelt de oorspronkelijke platte tekst, idempotent.
 */
import { perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

// Eén layout-lees-pas: woorden als losse spans in normale flow renderen en
// via offsetTop groeperen in regels — dat IS hoe de browser zelf zou
// woordafbreken, dus dit volgt precies de echte terugval zonder JS.
function measureLines(root, words) {
  const doc = root.ownerDocument;
  root.textContent = '';
  const probe = doc.createElement('span');
  probe.style.display = 'block';
  const spans = words.map((w) => {
    const span = doc.createElement('span');
    span.style.display = 'inline-block';
    span.textContent = w;
    probe.appendChild(span);
    probe.appendChild(doc.createTextNode(' '));
    return span;
  });
  root.appendChild(probe);

  const lines = [];
  let currentTop = null;
  let currentLine = [];
  spans.forEach((span, i) => {
    const top = span.offsetTop;
    if (currentTop !== null && Math.abs(top - currentTop) > 1) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentTop = top;
    currentLine.push(words[i]);
  });
  if (currentLine.length) lines.push(currentLine);
  return lines;
}

function render(root, lines, lastLine) {
  const doc = root.ownerDocument;
  root.textContent = '';
  lines.forEach((lineWords, i) => {
    const lineEl = doc.createElement('span');
    lineEl.className = 'jf__line';
    const isLast = i === lines.length - 1;
    if (isLast && !lastLine) lineEl.classList.add('jf__line--loose');
    lineWords.forEach((w, wi) => {
      const wordEl = doc.createElement('span');
      wordEl.className = 'jf__word';
      wordEl.textContent = w;
      lineEl.appendChild(wordEl);
      // Spatie als losse tekstnode: telt niet mee als flex-item (dus geen
      // effect op de space-between-verdeling), maar houdt .textContent
      // (kopiëren, sommige schermlezer-doorlopen) correct gespatieerd i.p.v.
      // aaneengeplakte woorden.
      if (wi < lineWords.length - 1) lineEl.appendChild(doc.createTextNode(' '));
    });
    root.appendChild(lineEl);
  });
}

export function init(root, options = {}) {
  if (!vereisRoot(root, 'justify-fill')) return () => {};

  const { lastLine = true } = options;
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const originalText = root.textContent;
  const words = splitWords(originalText);
  if (words.length === 0) return () => {};

  function run() {
    const lines = measureLines(root, words);
    render(root, lines, lastLine);
  }

  run();
  root.setAttribute('data-jf-ready', '');

  const onResize = perFrame(run, doc);
  win.addEventListener('resize', onResize);

  let fontsCancelled = false;
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(() => { if (!fontsCancelled) run(); });
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    fontsCancelled = true;
    win.removeEventListener('resize', onResize);
    onResize.cancel();
    root.removeAttribute('data-jf-ready');
    root.textContent = originalText;
  };
}
