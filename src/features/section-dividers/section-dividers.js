/**
 * shapes/section-dividers
 * ------------------------------------------------------------------------
 * Sectieranden als inline SVG: 8 vormen (schuin, golf, dubbele-golf,
 * driehoek, curve, verfstreep, papier, borstel-golf). Werkt zonder JS —
 * een losse `<svg>`-snippet (zie README "Zonder JS") is op zichzelf al een
 * complete, werkende sectierand. Deze module is uitsluitend een
 * injectie-helper voor wie de 8 vormen op meerdere plekken via één
 * data-attribuut wil plaatsen zonder de SVG-markup zelf te kopiëren.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt `document` pas aan
 * binnen `init()`, niet bij import).
 *
 * @typedef {'schuin'|'golf'|'dubbele-golf'|'driehoek'|'curve'|'verfstreep'|'papier'|'borstel-golf'} DividerVorm
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

/** viewBox altijd "0 0 1200 120", getekend als bodemrand (positie="onder"); CSS spiegelt verticaal voor positie="boven". */
export const VORMEN = {
  schuin: 'M0,120 L1200,10 L1200,120 Z',
  golf: 'M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z',
  'dubbele-golf':
    'M0,90 C200,20 400,20 600,70 C800,120 1000,20 1200,60 L1200,120 L0,120 Z',
  driehoek: 'M0,120 L600,10 L1200,120 Z',
  curve: 'M0,120 Q600,0 1200,120 Z',
  verfstreep:
    'M0,80 C40,60 80,100 130,75 C200,40 260,95 320,70 C400,35 460,100 540,65 C620,30 700,95 780,60 C860,25 940,90 1020,55 C1090,25 1150,70 1200,50 L1200,120 L0,120 Z',
  papier:
    'M0,100 L60,70 L120,95 L180,60 L240,90 L300,55 L360,85 L420,50 L480,80 L540,45 L600,75 L660,40 L720,70 L780,50 L840,80 L900,45 L960,75 L1020,55 L1080,85 L1140,60 L1200,90 L1200,120 L0,120 Z',
  'borstel-golf':
    'M0,50 C100,90 200,10 320,55 C420,90 500,20 620,60 C720,95 820,15 940,55 C1040,90 1120,25 1200,55 L1200,120 L0,120 Z',
};

const INJECTED_ATTR = 'data-sd-injected';

function svgFor(doc, vorm) {
  const d = VORMEN[vorm];
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1200 120');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute(INJECTED_ATTR, '');
  const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

/**
 * Vult elk `[data-divider]`-element (root zelf meegerekend als het matcht)
 * dat nog geen `<svg>`-kind heeft met de bijbehorende vorm.
 * @param {Element} root
 * @param {{ selector?: string }} [opties]
 * @returns {() => void} destroy — verwijdert alléén de door deze aanroep ingevoegde svg's. Idempotent.
 */
export function init(root, opties = {}) {
  if (!vereisRoot(root, 'section-dividers')) return () => {};
  const { selector = '[data-divider]' } = opties;
  const doc = root.ownerDocument || document;

  const hosts = [];
  if (typeof root.matches === 'function' && root.matches(selector)) hosts.push(root);
  hosts.push(...root.querySelectorAll(selector));

  const injected = [];
  for (const host of hosts) {
    if (host.querySelector(':scope > svg')) continue; // al gevuld (zonder-JS-snippet of eerdere init)
    const vorm = host.getAttribute('data-divider');
    if (!vorm || !VORMEN[vorm]) {
      console.warn(`section-dividers: onbekende vorm "${vorm}" — overgeslagen`);
      continue;
    }
    const hoogte = host.getAttribute('data-hoogte');
    if (hoogte) host.style.setProperty('--sd-hoogte', `${hoogte}px`);
    const svg = svgFor(doc, vorm);
    host.appendChild(svg);
    injected.push(svg);
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const svg of injected) svg.remove();
  };
}
