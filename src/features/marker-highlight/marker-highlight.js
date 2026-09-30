/**
 * marker-highlight
 * ------------------------------------------------------------------------
 * Een woord of woordgroep (`<mark data-marker>` / `<strong data-marker>`)
 * krijgt een markeerstreep die van links naar rechts inloopt zodra hij in
 * beeld komt. De streep is een achtergrond met `background-size` van 0 naar
 * 100%; over een regelafbreking loopt hij mee (`box-decoration-break: clone`).
 * Optioneel een ruwe, licht schuine stiftrand (SVG als achtergrond).
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * bij `init()`.
 *
 * Contrast: `init` meet tekstkleur op markeerkleur (WCAG) en waarschuwt met
 * console.warn onder 4,5:1 (gewone tekst) of 3:1 (grote kop, >= 24px of
 * >= 18,66px vet).
 *
 * Herkomst: eigen implementatie; patroon gezien bij meerdere bureausites
 * (teal vlak, background-size 0 -> 100% in 0,8 s, IntersectionObserver
 * threshold 0.2). Wij voegen contrastmeting, ruwe rand en live
 * "minder beweging" toe.
 *
 * @typedef {Object} MarkerHighlightOptions
 * @property {string} [selector="[data-marker]"] Te markeren elementen binnen root.
 * @property {string} [kleur] Markeerkleur (CSS-kleur). Standaard de CSS-variabele --mh-kleur. Per element te overschrijven met `data-marker-kleur`.
 * @property {"regel"|"half"} [hoogte] Hele regel of onderste helft. Per element: `data-marker="half"`.
 * @property {number} [vertraging=0] Seconden vertraging. Per element: `data-marker-vertraging`.
 * @property {number} [duur=0.8] Seconden looptijd.
 * @property {boolean} [ruw=false] Ruwe stiftrand via SVG. Per element: `data-marker-ruw`.
 * @property {number} [schuin=0] Schuinte van de ruwe rand (0-8, in % van de breedte). Alleen met `ruw`.
 * @property {boolean} [once=true] Niet opnieuw laten lopen bij terug-scrollen.
 * @property {number} [threshold=0.6] IntersectionObserver-threshold.
 *
 * @param {Element} root
 * @param {MarkerHighlightOptions} [options]
 * @returns {() => void} destroy - idempotent.
 */
import { minderBeweging, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';

const HIDDEN = 'data-mh-hidden';
const ACTIVE = 'data-mh-active';
const IN = 'is-in';

/** Relatieve luminantie (WCAG) van [r,g,b] 0-255. */
function luminantie([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Contrastratio tussen twee [r,g,b]-kleuren (1-21). */
export function contrastRatio(a, b) {
  const [l1, l2] = [luminantie(a), luminantie(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Laat de browser een CSS-kleur naar [r,g,b,a] omrekenen; null als het niet lukt. */
function naarRgba(doc, kleur) {
  const probe = doc.createElement('span');
  probe.style.color = kleur;
  if (!probe.style.color) return null;
  doc.body.appendChild(probe);
  const c = doc.defaultView.getComputedStyle(probe).color;
  probe.remove();
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null; // ponytail: alleen sRGB-uitkomsten; oklch/color() geeft geen meting (geen waarschuwing)
  const d = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return [d[0], d[1], d[2], d[3] ?? 1];
}

/** Achtergrond achter het element: eerste dekkende voorouder, anders wit. */
function achtergrondVan(el) {
  const win = el.ownerDocument.defaultView;
  for (let n = el.parentElement; n; n = n.parentElement) {
    const m = win.getComputedStyle(n).backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (m) { const d = m[1].split(/[ ,/]+/).map(Number); if ((d[3] ?? 1) === 1) return d.slice(0, 3); }
  }
  return [255, 255, 255];
}

/**
 * Meet het contrast van tekst op markeerkleur voor één element.
 * @returns {{ ratio: number, norm: number, groot: boolean, ok: boolean } | null}
 */
export function meetContrast(el) {
  const doc = el.ownerDocument; const win = doc.defaultView;
  const cs = win.getComputedStyle(el);
  const tekst = naarRgba(doc, cs.color);
  const vlak = naarRgba(doc, cs.getPropertyValue('--mh-kleur').trim());
  if (!tekst || !vlak) return null;
  const onder = achtergrondVan(el);
  const mix = (i) => vlak[3] * vlak[i] + (1 - vlak[3]) * onder[i];
  const vlakRgb = [mix(0), mix(1), mix(2)];
  const ratio = contrastRatio(tekst.slice(0, 3), vlakRgb);
  const px = parseFloat(cs.fontSize);
  const groot = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
  const norm = groot ? 3 : 4.5;
  return { ratio, norm, groot, ok: ratio >= norm };
}

/** Deterministische ruwe stiftvorm als SVG-achtergrond (geen Math.random). */
function ruweVlak(kleur, schuin) {
  const s = Math.max(0, Math.min(8, schuin));
  const top = [4, 1, 5, 0, 3, 1, 4, 0, 2]; const bodem = [96, 100, 95, 99, 97, 100, 94, 99, 97];
  const n = top.length; const pts = [];
  for (let i = 0; i < n; i++) pts.push(`${(s + (100 - s) * i / (n - 1)).toFixed(1)},${top[i]}`);
  for (let i = n - 1; i >= 0; i--) pts.push(`${((100 - s) * i / (n - 1)).toFixed(1)},${bodem[i]}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon fill="${kleur}" points="${pts.join(' ')}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function init(root, options = {}) {
  if (!vereisRoot(root, 'marker-highlight')) return () => {};
  const {
    selector = '[data-marker]', kleur, hoogte, vertraging = 0, duur = 0.8,
    ruw = false, schuin = 0, once = true, threshold = 0.6,
  } = options;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const els = Array.from(root.querySelectorAll(selector));
  const gezet = []; // [el, [props]] om bij destroy op te ruimen
  const zet = (el, prop, val) => { el.style.setProperty(prop, val); gezet.push([el, prop]); };

  for (const el of els) {
    const k = el.getAttribute('data-marker-kleur') || kleur;
    if (k) zet(el, '--mh-kleur', k);
    const h = el.getAttribute('data-marker') || hoogte;
    if (h === 'half') zet(el, '--mh-hoogte', '45%'); else if (h === 'regel') zet(el, '--mh-hoogte', '100%');
    const v = el.getAttribute('data-marker-vertraging') ?? vertraging;
    if (Number(v)) zet(el, '--mh-vertraging', `${Number(v)}s`);
    if (duur !== 0.8) zet(el, '--mh-duur', `${duur}s`);
    if (ruw || el.hasAttribute('data-marker-ruw')) {
      const c = win.getComputedStyle(el).getPropertyValue('--mh-kleur').trim() || '#f4d35e';
      zet(el, '--mh-vlak', ruweVlak(c, Number(el.getAttribute('data-marker-schuin') ?? schuin)));
    }
    const m = meetContrast(el);
    if (m && !m.ok) {
      console.warn(`marker-highlight: contrast ${m.ratio.toFixed(2)}:1 is lager dan ${m.norm}:1 (${m.groot ? 'grote kop' : 'gewone tekst'}) voor "${(el.textContent || '').trim().slice(0, 40)}"`);
    }
  }

  let destroyed = false; let raf = 0; const stops = [];
  root.setAttribute(HIDDEN, '');
  const toonAlles = () => els.forEach((el) => el.classList.add(IN));
  const stopMB = minderBeweging((reduced) => { if (reduced) toonAlles(); }, doc);

  if (stopMB.reduced || !('IntersectionObserver' in win)) {
    toonAlles();
  } else {
    raf = win.requestAnimationFrame(() => { raf = 0; root.setAttribute(ACTIVE, ''); });
    for (const el of els) {
      stops.push(inBeeld(el, () => el.classList.add(IN), {
        once, threshold, rootMargin: '0px 0px -8% 0px',
        bijUit: () => el.classList.remove(IN),
      }));
    }
  }

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (raf) win.cancelAnimationFrame(raf);
    stops.forEach((s) => s()); stopMB.stop();
    root.removeAttribute(HIDDEN); root.removeAttribute(ACTIVE);
    for (const el of els) el.classList.remove(IN);
    for (const [el, p] of gezet) el.style.removeProperty(p);
    for (const el of els) if (!el.getAttribute('style')) el.removeAttribute('style');
  };
}
