/**
 * app-tour-venster
 * ------------------------------------------------------------------------
 * Een browservenster dat je product laat zien in plaats van beschrijft:
 * drie lichtjes, een adresbalk waarin alleen het subdomein wisselt
 * (`typography/domein-wissel`), een rail met app-tabs (echte tablist) met een
 * glijdende markering, en per tab een nep-app met een klein verhaal
 * (een kaart verhuist, een wachtwoord gaat open, iemand typt en een bericht
 * komt binnen). Schuift vanzelf door; pauzeert bij hover, focus, verborgen
 * tabblad, buiten beeld, minder beweging en bewegingspauze, en heeft een
 * zichtbare pauzeknop (WCAG 2.2.2).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt `window`/`document`
 * pas aan in `init`). De nep-apps zijn gewone markup in je pagina (zie
 * README, markup-contract); deze module geeft ze gedrag.
 *
 * Herkomst: productvenster op eu-hosted.com (28-10-2026). Eigen code; getallen
 * nagemeten: ±5,6 s per tab, typpuntjes .35 → 1 opacity en −2 px in 1,2 s.
 *
 * @typedef {Object} AppTourOpties
 * @property {number} [interval=5] Seconden per tab bij automatisch doorschuiven; 0 = niet automatisch.
 * @property {string} [slug] Standaardnaam in de domeinen (`{slug}` in `data-atv-domein`); anders `data-atv-slug` op de root.
 * @property {Partial<typeof TEKSTEN>} [teksten] Tekst en aria-label van de pauzeknop.
 *
 * @param {Element} root `.atv`-element met een `[role=tablist]` en `[role=tabpanel]`'s.
 * @param {AppTourOpties} [opties]
 * @returns {(() => void) & { kies: (i: number) => void, actief: () => number }} destroy, met `kies(i)` en `actief()`.
 */
import { inBeeld, minderBeweging, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';
// domein-wissel-kopie.js = byte-gelijke kopie van typography/domein-wissel/domein-wissel.js, zodat deze map
// ook als platte kopie werkt (Next: src/features/<naam>/). test/meet.mjs faalt als hij afwijkt.
import { init as domeinWissel, volgBewegingPauze } from './domein-wissel-kopie.js';

/** Teksten die de JS schrijft (Nederlandse standaard). */
export const TEKSTEN = {
  pauzeer: 'Pauzeren',
  speel: 'Afspelen',
  pauzeerLabel: 'Rondleiding pauzeren',
  speelLabel: 'Rondleiding afspelen',
};

let teller = 0;
const leeg = () => {};
leeg.kies = leeg;
leeg.actief = () => -1;

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'app-tour-venster')) return leeg;
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const rail = root.querySelector('[role="tablist"]');
  const tabs = rail ? Array.from(rail.querySelectorAll('[role="tab"]')) : [];
  const panelen = Array.from(root.querySelectorAll('[role="tabpanel"]'));
  if (!rail || tabs.length === 0 || panelen.length < tabs.length) {
    console.warn('app-tour-venster: geen tablist met tabs en evenveel tabpanels — overgeslagen');
    return leeg;
  }
  const o = { interval: 5, slug: root.getAttribute('data-atv-slug') || 'bedrijf', ...zonderUndefined(opties) };
  const T = { ...TEKSTEN, ...zonderUndefined(o.teksten || {}) };
  const standaardSlug = o.slug;
  let slug = standaardSlug;
  const n = ++teller;
  let dood = false;

  // ── Uitgangstoestand bewaren voor destroy() ──────────────────────────
  const bewaard = tabs.map((t) => ({
    id: t.getAttribute('id'), tabindex: t.getAttribute('tabindex'), selected: t.getAttribute('aria-selected'), controls: t.getAttribute('aria-controls'),
  }));
  const bewaardPanelen = panelen.map((p) => ({ id: p.getAttribute('id'), labelledby: p.getAttribute('aria-labelledby') }));

  tabs.forEach((t, i) => {
    const p = panelen[i];
    if (!t.id) t.id = `atv-${n}-tab-${i}`;
    if (!p.id) p.id = `atv-${n}-paneel-${i}`;
    t.setAttribute('aria-controls', p.id);
    p.setAttribute('aria-labelledby', t.id);
  });

  // Markering (glijdt achter de actieve tab) en voortgangslijn (timer van het doorschuiven).
  const markering = doc.createElement('span');
  markering.className = 'atv__markering';
  markering.setAttribute('aria-hidden', 'true');
  rail.prepend(markering);
  const chrome = root.querySelector('.atv__chrome') || root;
  const voortgang = doc.createElement('span');
  voortgang.className = 'atv__voortgang';
  voortgang.setAttribute('aria-hidden', 'true');
  chrome.append(voortgang);
  const railnaam = root.querySelector('[data-atv-railnaam]');
  const knop = root.querySelector('[data-atv-pauze-knop]');
  const knopTekst = knop && knop.querySelector('[data-atv-knoptekst]');
  const appVlak = root.querySelector('.atv__app') || root;

  // Adresbalk: domein-wissel.
  const adresEl = root.querySelector('[data-atv-adres]');
  const adres = adresEl ? domeinWissel(adresEl) : null;
  const domeinVan = (i) => (tabs[i].getAttribute('data-atv-domein') || '').replace(/\{slug\}/g, slug);

  root.setAttribute('data-atv-actief', '');

  // ── Pauzeredenen ─────────────────────────────────────────────────────
  const redenen = new Set(['buiten-beeld']);
  let rustig = false;
  let gestopt = false; // door de bezoeker (pauzeknop of zelf een tab gekozen)

  const mb = minderBeweging((r) => { rustig = r; zetReden('minder-beweging', r); stilteVeranderd(); }, doc);
  rustig = mb.reduced;
  const pauze = volgBewegingPauze(doc, (g) => { zetReden('beweging-pauze', g); stilteVeranderd(); });
  if (rustig) redenen.add('minder-beweging');
  if (pauze.gepauzeerd) redenen.add('beweging-pauze');
  if (doc.hidden) redenen.add('verborgen');
  if (!(o.interval > 0)) redenen.add('geen-interval');

  const stil = () => rustig || pauze.gepauzeerd;

  // ── Tab kiezen ───────────────────────────────────────────────────────
  let actief = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
  let eersteKeer = true;

  function plaatsMarkering() {
    const t = tabs[actief];
    markering.style.transform = `translate(${t.offsetLeft}px, ${t.offsetTop}px)`;
    markering.style.width = `${t.offsetWidth}px`;
    markering.style.height = `${t.offsetHeight}px`;
  }

  function kies(i, { focus = false, door = 'auto' } = {}) {
    if (dood) return;
    const nieuw = ((i % tabs.length) + tabs.length) % tabs.length;
    const zelfde = nieuw === actief && !eersteKeer;
    actief = nieuw;
    tabs.forEach((t, k) => {
      const aan = k === actief;
      t.setAttribute('aria-selected', String(aan));
      t.setAttribute('tabindex', aan ? '0' : '-1');
      panelen[k].toggleAttribute('data-atv-aan', aan);
    });
    if (focus) tabs[actief].focus();
    plaatsMarkering();
    if (railnaam) railnaam.textContent = tabs[actief].getAttribute('data-atv-label') || tabs[actief].textContent.trim();
    if (adres) adres.wissel(domeinVan(actief), { direct: eersteKeer });
    if (!zelfde) speelScene(panelen[actief]);
    eersteKeer = false;
    if (door === 'bezoeker') { gestopt = true; zetReden('gestopt', true); }
    herstartTimer();
  }

  // ── Timer = voortgangslijn (WAAPI) ───────────────────────────────────
  let timer = null;
  function herstartTimer() {
    if (timer) { timer.cancel(); timer = null; }
    if (gestopt || redenen.has('geen-interval') || redenen.has('minder-beweging') || typeof voortgang.animate !== 'function') {
      werkPauzeBij();
      return;
    }
    timer = voortgang.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: o.interval * 1000, easing: 'linear', fill: 'forwards' });
    timer.onfinish = () => kies(actief + 1); // herstartTimer() ruimt de afgelopen animatie op
    werkPauzeBij();
  }

  function zetReden(r, aan) { if (aan) redenen.add(r); else redenen.delete(r); werkPauzeBij(); }

  function werkPauzeBij() {
    if (dood) return;
    const lijst = Array.from(redenen);
    if (lijst.length) root.setAttribute('data-atv-pauze', lijst.join(' '));
    else root.removeAttribute('data-atv-pauze');
    if (timer) {
      if (lijst.length && timer.playState === 'running') timer.pause();
      else if (!lijst.length && timer.playState === 'paused') timer.play();
    }
    if (knop) {
      const verberg = rustig || pauze.gepauzeerd || redenen.has('geen-interval');
      knop.hidden = verberg;
      const speelt = !gestopt;
      knop.setAttribute('data-atv-staat', speelt ? 'speelt' : 'gepauzeerd');
      knop.setAttribute('aria-label', speelt ? T.pauzeerLabel : T.speelLabel);
      if (knopTekst) knopTekst.textContent = speelt ? T.pauzeer : T.speel;
    }
  }

  // Minder beweging of bewegingspauze aan/uit: lopende scène naar eindstand, timer opnieuw.
  function stilteVeranderd() {
    if (stil()) eindScene(panelen[actief]);
    herstartTimer();
  }

  // ── Scènes: kleine verhalen per nep-app ──────────────────────────────
  let sceneTimers = [];
  const geschiedenis = new Map(); // kaart → { ouder, volgende }
  function wis() { sceneTimers.forEach((t) => win.clearTimeout(t)); sceneTimers = []; }
  function na(ms, fn) { sceneTimers.push(win.setTimeout(fn, ms)); }

  function tel(paneel) {
    for (const kolom of paneel.querySelectorAll('[data-atv-kolom]')) {
      const aantal = kolom.querySelector('[data-atv-aantal]');
      const lijf = kolom.querySelector('[data-atv-lijf]') || kolom;
      if (aantal) aantal.textContent = String(lijf.querySelectorAll('[data-atv-kaart]').length);
    }
  }

  function beginScene(paneel) {
    for (const el of paneel.querySelectorAll('[data-atv-onthul]')) el.removeAttribute('data-atv-open');
    for (const el of paneel.querySelectorAll('[data-atv-typt]')) el.removeAttribute('data-atv-zichtbaar');
    for (const el of paneel.querySelectorAll('[data-atv-nieuw]')) el.hidden = true;
    for (const kaart of paneel.querySelectorAll('[data-atv-verhuis]')) {
      const g = geschiedenis.get(kaart);
      if (g && kaart.parentElement !== g.ouder) g.ouder.insertBefore(kaart, g.volgende);
      kaart.removeAttribute('data-atv-verhuisd');
    }
    tel(paneel);
  }

  function verhuis(kaart, paneel, animeer) {
    const doel = paneel.querySelector(`[data-atv-kolom="${kaart.getAttribute('data-atv-verhuis')}"]`);
    if (!doel) return;
    const lijf = doel.querySelector('[data-atv-lijf]') || doel;
    if (!geschiedenis.has(kaart)) geschiedenis.set(kaart, { ouder: kaart.parentElement, volgende: kaart.nextElementSibling });
    const ouder = kaart.parentElement;
    const buren = [...Array.from(ouder.querySelectorAll('[data-atv-kaart]')), ...Array.from(lijf.querySelectorAll('[data-atv-kaart]'))].filter((k) => k !== kaart);
    const eerst = new Map([[kaart, kaart.getBoundingClientRect()], ...buren.map((b) => [b, b.getBoundingClientRect()])]);
    lijf.prepend(kaart);
    kaart.setAttribute('data-atv-verhuisd', '');
    tel(paneel);
    if (!animeer || typeof kaart.animate !== 'function') return;
    for (const [el, r] of eerst) {
      const nu = el.getBoundingClientRect();
      const dx = r.left - nu.left;
      const dy = r.top - nu.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      const hoofd = el === kaart;
      const a = el.animate(
        hoofd
          ? [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 10}px) rotate(-1.5deg) scale(1.035)`, offset: 0.45 },
            { transform: 'none' },
          ]
          : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: hoofd ? 760 : 540, easing: 'cubic-bezier(.16, 1, .3, 1)' },
      );
      // De opgetilde kaart krijgt een diepere schaduw via een ::after-laag (alleen opacity).
      if (hoofd) {
        kaart.setAttribute('data-atv-zweeft', '');
        a.finished.catch(() => {}).then(() => kaart.removeAttribute('data-atv-zweeft'));
      }
    }
  }

  function toonNieuw(bericht, animeer) {
    const lijst = bericht.parentElement;
    const anderen = Array.from(lijst.children).filter((c) => c !== bericht && !c.hidden);
    const eerst = anderen.map((c) => c.getBoundingClientRect().top);
    bericht.hidden = false;
    if (!animeer || typeof bericht.animate !== 'function') return;
    anderen.forEach((c, i) => {
      const dy = eerst[i] - c.getBoundingClientRect().top;
      if (Math.abs(dy) > 0.5) c.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    });
    bericht.animate(
      [{ opacity: 0, transform: 'translateY(10px) scale(.98)' }, { opacity: 1, transform: 'none' }],
      { duration: 520, delay: 60, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' },
    );
  }

  function eindScene(paneel) {
    wis();
    for (const el of paneel.querySelectorAll('[data-atv-onthul]')) el.setAttribute('data-atv-open', '');
    for (const el of paneel.querySelectorAll('[data-atv-typt]')) el.removeAttribute('data-atv-zichtbaar');
    for (const el of paneel.querySelectorAll('[data-atv-nieuw]')) el.hidden = false;
    for (const kaart of paneel.querySelectorAll('[data-atv-verhuis]')) if (!kaart.hasAttribute('data-atv-verhuisd')) verhuis(kaart, paneel, false);
  }

  function speelScene(paneel) {
    wis();
    // Alleen het binnenkomende paneel terug naar het begin: het uitgaande fadet uit zoals het staat.
    beginScene(paneel);
    if (stil()) { eindScene(paneel); return; }
    for (const el of paneel.querySelectorAll('[data-atv-onthul]')) na(Number(el.getAttribute('data-atv-na')) || 1100, () => el.setAttribute('data-atv-open', ''));
    for (const kaart of paneel.querySelectorAll('[data-atv-verhuis]')) na(Number(kaart.getAttribute('data-atv-na')) || 1200, () => verhuis(kaart, paneel, true));
    const typt = paneel.querySelector('[data-atv-typt]');
    const nieuw = paneel.querySelector('[data-atv-nieuw]');
    if (typt) na(450, () => typt.setAttribute('data-atv-zichtbaar', ''));
    if (nieuw) {
      na(Number(nieuw.getAttribute('data-atv-na')) || 2100, () => {
        if (typt) typt.removeAttribute('data-atv-zichtbaar');
        toonNieuw(nieuw, true);
      });
    }
  }

  // ── Listeners ────────────────────────────────────────────────────────
  const opKlik = (e) => {
    const t = e.target.closest && e.target.closest('[role="tab"]');
    if (!t || !rail.contains(t)) return;
    kies(tabs.indexOf(t), { door: 'bezoeker' });
  };
  const opToets = (e) => {
    const i = tabs.indexOf(doc.activeElement);
    if (i < 0) return;
    const naar = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (naar === undefined) return;
    e.preventDefault();
    kies(naar, { focus: true, door: 'bezoeker' });
  };
  rail.addEventListener('click', opKlik);
  rail.addEventListener('keydown', opToets);

  const opKnop = () => {
    gestopt = !gestopt;
    zetReden('gestopt', gestopt);
    herstartTimer();
  };
  if (knop) knop.addEventListener('click', opKnop);

  const opBinnen = (e) => { if (e.pointerType === 'mouse') zetReden('hover', true); };
  const opBuiten = (e) => { if (e.pointerType === 'mouse') zetReden('hover', false); };
  appVlak.addEventListener('pointerenter', opBinnen);
  appVlak.addEventListener('pointerleave', opBuiten);
  const opFocusIn = () => zetReden('focus', true);
  const opFocusUit = (e) => { if (!appVlak.contains(e.relatedTarget)) zetReden('focus', false); };
  appVlak.addEventListener('focusin', opFocusIn);
  appVlak.addEventListener('focusout', opFocusUit);

  const opZicht = () => zetReden('verborgen', doc.hidden);
  doc.addEventListener('visibilitychange', opZicht);
  const stopBeeld = inBeeld(root, () => zetReden('buiten-beeld', false), { once: false, bijUit: () => zetReden('buiten-beeld', true) });

  const ro = win.ResizeObserver ? new win.ResizeObserver(() => plaatsMarkering()) : null;
  if (ro) ro.observe(rail);

  // Eigen naam (forms/eigen-naam-preview): de tour beheert zijn adresbalk zelf.
  const opEigenNaam = (e) => {
    e.preventDefault();
    const d = e.detail || {};
    slug = d.leeg || !d.slug ? standaardSlug : d.slug;
    if (adres) adres.wissel(domeinVan(actief), { index: d.index, direct: d.direct });
  };
  if (adresEl) adresEl.addEventListener('eigennaam', opEigenNaam);

  // Start: markering zonder glijden op zijn plek, daarna pas transities aan.
  root.setAttribute('data-atv-start', '');
  kies(actief);
  const raf = win.requestAnimationFrame(() => root.removeAttribute('data-atv-start'));

  function destroy() {
    if (dood) return;
    wis();
    if (timer) timer.cancel();
    timer = null;
    dood = true;
    win.cancelAnimationFrame(raf);
    for (const p of panelen) beginScene(p);
    mb.stop();
    pauze.stop();
    stopBeeld();
    if (ro) ro.disconnect();
    rail.removeEventListener('click', opKlik);
    rail.removeEventListener('keydown', opToets);
    if (knop) { knop.removeEventListener('click', opKnop); knop.hidden = true; knop.removeAttribute('data-atv-staat'); knop.removeAttribute('aria-label'); }
    appVlak.removeEventListener('pointerenter', opBinnen);
    appVlak.removeEventListener('pointerleave', opBuiten);
    appVlak.removeEventListener('focusin', opFocusIn);
    appVlak.removeEventListener('focusout', opFocusUit);
    doc.removeEventListener('visibilitychange', opZicht);
    if (adresEl) adresEl.removeEventListener('eigennaam', opEigenNaam);
    if (adres) adres();
    markering.remove();
    voortgang.remove();
    tabs.forEach((t, i) => {
      const b = bewaard[i];
      for (const [attr, v] of [['id', b.id], ['tabindex', b.tabindex], ['aria-selected', b.selected], ['aria-controls', b.controls]]) {
        if (v === null) t.removeAttribute(attr); else t.setAttribute(attr, v);
      }
    });
    panelen.forEach((p, i) => {
      const b = bewaardPanelen[i];
      p.removeAttribute('data-atv-aan');
      if (b.id === null) p.removeAttribute('id'); else p.setAttribute('id', b.id);
      if (b.labelledby === null) p.removeAttribute('aria-labelledby'); else p.setAttribute('aria-labelledby', b.labelledby);
    });
    for (const a of ['data-atv-actief', 'data-atv-pauze', 'data-atv-start']) root.removeAttribute(a);
  }
  destroy.kies = (i) => kies(i, { door: 'bezoeker' });
  destroy.actief = () => actief;
  return destroy;
}
