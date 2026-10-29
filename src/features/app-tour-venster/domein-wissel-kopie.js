/**
 * domein-wissel
 * ------------------------------------------------------------------------
 * Tekst die alleen het deel wisselt dat echt verschilt. Van `wiki.wester.nl`
 * naar `projecten.wester.nl` blijft `.wester.nl` staan en schuift mee naar
 * zijn nieuwe plek; `wiki` valt letter voor letter weg en `projecten` komt
 * letter voor letter binnen. Gemaakt voor adresbalken en domeinen, werkt op
 * elke korte regel tekst.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt `window`/`document`
 * pas aan in `init`). Beweging via WAAPI: `transform`, `opacity` en een
 * korte `filter: blur()` op de binnenkomende letters (zie README, R18).
 *
 * Herkomst: gedrag gezien op eu-hosted.com (adresbalk van het productvenster,
 * daar met GSAP + SplitText). Eigen implementatie; de getallen (achtervoegsel
 * .45 s in-out, letters ±0,4 em verschuiving, blur 4 px, .05 s per instantie,
 * crossfade .15 s bij minder beweging) zijn nagemeten op 28-10-2026.
 *
 * @typedef {Object} DomeinWisselOpties
 * @property {number} [index=0] Volgnummer van deze instantie; vertraging = index × `stap`.
 * @property {number} [stap=0.05] Seconden vertraging per index (meerdere instanties wisselen als een golf).
 * @property {number} [duur=0.45] Seconden voor het meeschuiven van voor- en achtervoegsel.
 *
 * @param {Element} root Element met de tekst (bv. `<code>wiki.wester.nl</code>`).
 * @param {DomeinWisselOpties} [opties]
 * @returns {(() => void) & { wissel: (tekst: string, o?: { index?: number, direct?: boolean }) => Promise<void>, tekst: () => string }}
 *   destroy, met `destroy.wissel(tekst)` om te wisselen en `destroy.tekst()` voor de huidige eindtekst.
 */
import { minderBeweging, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const STANDAARD = { index: 0, stap: 0.05, duur: 0.45 };
const EASE_SCHUIF = 'cubic-bezier(.77, 0, .175, 1)';
const EASE_IN = 'cubic-bezier(.16, 1, .3, 1)';
const EASE_UIT = 'cubic-bezier(.33, 1, .68, 1)'; // snel weg: het spook maakt plaats
const MAX_INDEX = 12;

/**
 * Staat de beweging op de pagina op pauze? Leest `html[data-motion="paused"]`
 * en het event `beweging:pauze` (detail `{ gepauzeerd }`) op `document`.
 * Gedeeld met `portfolio/app-tour-venster`.
 * @param {Document} doc
 * @param {(gepauzeerd: boolean) => void} [onChange]
 * @returns {{ readonly gepauzeerd: boolean, stop: () => void }}
 */
export function volgBewegingPauze(doc, onChange) {
  const html = doc.documentElement;
  const win = doc.defaultView;
  let viaEvent = false;
  const nu = () => html.getAttribute('data-motion') === 'paused' || viaEvent;
  let laatst = nu();
  const check = () => {
    const v = nu();
    if (v === laatst) return;
    laatst = v;
    if (onChange) onChange(v);
  };
  const mo = win && win.MutationObserver ? new win.MutationObserver(check) : null;
  if (mo) mo.observe(html, { attributes: true, attributeFilter: ['data-motion'] });
  const opEvent = (e) => { viaEvent = !!(e && e.detail && e.detail.gepauzeerd); check(); };
  doc.addEventListener('beweging:pauze', opEvent);
  return {
    get gepauzeerd() { return laatst; },
    stop() { if (mo) mo.disconnect(); doc.removeEventListener('beweging:pauze', opEvent); },
  };
}

/** Lengte van het gedeelde begin en eind van twee teksten (overlappen nooit). */
function gedeeld(a, b) {
  const max = Math.min(a.length, b.length);
  let p = 0;
  while (p < max && a[p] === b[p]) p += 1;
  let s = 0;
  while (s < max - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s += 1;
  return { p, s };
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'domein-wissel')) {
    const leeg = () => {};
    leeg.wissel = () => Promise.resolve();
    leeg.tekst = () => '';
    return leeg;
  }
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  const doc = root.ownerDocument;
  const win = doc.defaultView;

  const origineel = root.textContent;
  let doel = origineel.replace(/\s+/g, ' ').trim();

  // Schermlezers krijgen één tekst (de eindtekst); het beeld met losse letters is aria-hidden.
  const sr = doc.createElement('span');
  sr.className = 'dw__sr';
  sr.textContent = doel;
  const beeld = doc.createElement('span');
  beeld.className = 'dw__beeld';
  beeld.setAttribute('aria-hidden', 'true');
  beeld.textContent = doel;
  root.textContent = '';
  root.append(sr, beeld);
  root.setAttribute('data-dw', '');

  let rustig = false;
  const mb = minderBeweging((r) => { rustig = r; }, doc);
  rustig = mb.reduced;
  const pauze = volgBewegingPauze(doc);

  /** @type {Animation[]} */
  let lopend = [];
  let spook = null;
  let klaarTimer = 0;
  let afronden = null; // resolve van de lopende wissel
  let dood = false;

  function span(klasse, tekst) {
    const s = doc.createElement('span');
    s.className = klasse;
    if (tekst !== undefined) s.textContent = tekst;
    return s;
  }
  function letters(tekst) {
    const f = doc.createDocumentFragment();
    for (const t of tekst) f.append(span('dw__teken', t));
    return f;
  }

  /** Lopende wissel meteen naar de eindstand brengen. */
  function rond() {
    for (const a of lopend) a.cancel();
    lopend = [];
    if (klaarTimer) win.clearTimeout(klaarTimer);
    klaarTimer = 0;
    if (spook) spook.remove();
    spook = null;
    beeld.textContent = doel;
    root.removeAttribute('data-dw-bezig');
    if (afronden) { const r = afronden; afronden = null; r(); }
  }

  function wacht(animaties) {
    lopend = animaties;
    root.setAttribute('data-dw-bezig', '');
    return new Promise((resolve) => {
      afronden = resolve;
      const eind = Math.max(0, ...animaties.map((a) => {
        const t = a.effect.getComputedTiming();
        return (t.endTime || 0);
      }));
      // Timer als vangnet: in een verborgen tabblad lopen animaties niet af (R2).
      klaarTimer = win.setTimeout(rond, eind + 80);
      Promise.all(animaties.map((a) => a.finished.catch(() => {}))).then(() => {
        if (lopend === animaties) rond();
      });
    });
  }

  function wissel(nieuw, w = {}) {
    if (dood) return Promise.resolve();
    const tekst = String(nieuw ?? '').replace(/\s+/g, ' ').trim();
    if (lopend.length || spook) rond();
    const oud = doel;
    if (tekst === oud) return Promise.resolve();
    doel = tekst;
    sr.textContent = tekst;

    const animeer = typeof beeld.animate === 'function' && !w.direct && !(doc.hidden);
    if (!animeer) { beeld.textContent = tekst; return Promise.resolve(); }

    const index = Math.min(MAX_INDEX, Math.max(0, w.index ?? o.index));
    const start = index * o.stap * 1000;

    // Minder beweging of bewegingspauze: alleen een crossfade van .15 s.
    if (rustig || pauze.gepauzeerd) {
      const oudLinks = beeld.getBoundingClientRect().left;
      beeld.textContent = tekst;
      spook = span('dw__spook', oud);
      spook.setAttribute('aria-hidden', 'true');
      root.append(spook);
      spook.style.left = `${oudLinks - root.getBoundingClientRect().left}px`;
      const opts = { duration: 150, delay: start, easing: 'linear', fill: 'backwards' };
      return wacht([
        spook.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, fill: 'both' }),
        beeld.animate([{ opacity: 0 }, { opacity: 1 }], opts),
      ]);
    }

    const { p, s } = gedeeld(oud, tekst);
    const midOud = oud.slice(p, oud.length - s);
    const midNieuw = tekst.slice(p, tekst.length - s);

    // FIRST: oude tekst in drie delen (zelfde letters, dus geen zichtbare verandering) en meten.
    const voor = span('dw__deel', oud.slice(0, p));
    const midden = span('dw__deel', midOud);
    const achter = span('dw__deel', oud.slice(oud.length - s));
    beeld.textContent = '';
    beeld.append(voor, midden, achter);
    const eerstVoor = voor.getBoundingClientRect().left;
    const eerstAchter = achter.getBoundingClientRect().left;
    const eerstMidden = midden.getBoundingClientRect().left;

    // LAST: het nieuwe middendeel als losse letters, opnieuw meten.
    midden.textContent = '';
    midden.append(letters(midNieuw));
    const rootLinks = root.getBoundingClientRect().left;
    const dxVoor = eerstVoor - voor.getBoundingClientRect().left;
    const dxAchter = eerstAchter - achter.getBoundingClientRect().left;

    const anims = [];
    const schuif = { duration: o.duur * 1000, delay: start, easing: EASE_SCHUIF, fill: 'backwards' };
    // Schuift het voorvoegsel (gecentreerde of rechts uitgelijnde tekst), dan gaan het nieuwe
    // middendeel en het spook mee: alles hangt aan het voorvoegsel, niets overlapt het.
    const voorSchuift = Math.abs(dxVoor) > 0.5;
    if (voorSchuift) {
      const van = [{ transform: `translateX(${dxVoor}px)` }, { transform: 'none' }];
      if (p > 0) anims.push(voor.animate(van, schuif));
      if (midNieuw) anims.push(midden.animate(van, schuif));
    }
    if (Math.abs(dxAchter) > 0.5 && s > 0) {
      anims.push(achter.animate([{ transform: `translateX(${dxAchter}px)` }, { transform: 'none' }], schuif));
    }

    // Het oude middendeel als spook op zijn oude plek: letter voor letter omhoog en weg.
    if (midOud) {
      spook = span('dw__spook');
      spook.setAttribute('aria-hidden', 'true');
      spook.append(letters(midOud));
      root.append(spook);
      spook.style.left = `${eerstMidden - rootLinks}px`;
      if (voorSchuift) {
        anims.push(spook.animate([{ transform: 'none' }, { transform: `translateX(${-dxVoor}px)` }], { ...schuif, fill: 'both' }));
      }
      const tekens = Array.from(spook.children);
      const st = Math.min(14, 100 / tekens.length);
      tekens.forEach((t, i) => {
        anims.push(t.animate(
          [
            { opacity: 1, transform: 'none', filter: 'blur(0px)' },
            { opacity: 0, transform: 'translateY(-0.42em)', filter: 'blur(2px)' },
          ],
          { duration: 200, delay: start + i * st, easing: EASE_UIT, fill: 'both' },
        ));
      });
    }
    // Het nieuwe middendeel komt letter voor letter binnen: van onder, vaag en doorzichtig.
    const nieuwe = Array.from(midden.children);
    // Elke nieuwe letter start pas als het spook op die plek grotendeels weg is (stap ≥ spookstap).
    const st = Math.min(24, 200 / Math.max(1, nieuwe.length));
    nieuwe.forEach((t, i) => {
      anims.push(t.animate(
        [
          { opacity: 0, transform: 'translateY(0.42em)', filter: 'blur(4px)' },
          { opacity: 1, transform: 'none', filter: 'blur(0px)' },
        ],
        { duration: 420, delay: start + (midOud ? 80 : 0) + i * st, easing: EASE_IN, fill: 'backwards' },
      ));
    });
    if (!anims.length) { rond(); return Promise.resolve(); }
    return wacht(anims);
  }

  const opEvent = (e) => {
    const d = (e && e.detail) || {};
    if (typeof d.tekst === 'string') wissel(d.tekst, d);
  };
  root.addEventListener('domeinwissel', opEvent);

  function destroy() {
    if (dood) return;
    rond();
    dood = true;
    mb.stop();
    pauze.stop();
    root.removeEventListener('domeinwissel', opEvent);
    root.removeAttribute('data-dw');
    root.removeAttribute('data-dw-bezig');
    root.textContent = doel;
  }
  destroy.wissel = wissel;
  destroy.tekst = () => doel;
  return destroy;
}
