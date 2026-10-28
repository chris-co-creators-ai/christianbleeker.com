/**
 * werkgebied-kaart
 * ------------------------------------------------------------------------
 * Een getekende kaart (inline SVG, 0 externe verzoeken) van het werkgebied
 * van de klant. De kaart blijft staan (sticky) terwijl je scrolt; per
 * projectkaartje dat je passeert vliegt de kaart rustig naar het bijbehorende
 * punt (CSS-transform op de kaartgroep), het punt wordt actief en het kaartje
 * krijgt de nadruk. De punten zijn ook links/knoppen: klik, Enter of Spatie
 * springt naar dat project. Omdat de kaart bij het inzoomen andere punten uit
 * beeld schuift, komt er onderin de kaart een rij knoppen met de plaatsnamen
 * (door init toegevoegd, door destroy weggehaald).
 *
 * Zonder JavaScript: de kaart met alle punten (elk punt is een gewone link
 * naar zijn projectkaartje) plus de lijst met projecten. Met "minder
 * beweging": geen vlucht en geen vloeiende scroll, de kaart wisselt direct.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt window/document pas
 * aan binnen `init()`). De SVG maak je met `maak-kaart.mjs`.
 *
 * Eigen implementatie.
 *
 * @typedef {Object} WerkgebiedKaartOptions
 * @property {number} [zoom=1.9]        Vergroting van de kaart op het actieve punt (1 = de hele kaart).
 * @property {number} [duur=1400]       Duur van de vlucht in ms (zet de CSS-variabele --wk-duur).
 * @property {number} [drempel=0.15]    Fractie van een kaartjeshoogte waarbinnen het eerste kaartje nog "voor de start" telt (overzicht).
 * @property {(id: string|null, index: number) => void} [bijWissel] Callback bij een nieuw actief project (id null = overzicht).
 */
import { minderBeweging, perFrame, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';

/**
 * @param {Element} root  Element met daarin `svg[data-wk-kaart]` (met `g[data-wk-wereld]` en `a[data-wk-punt]`) en `[data-wk-project]`-kaartjes.
 * @param {WerkgebiedKaartOptions} [opties]
 * @returns {() => void} destroy (idempotent)
 */
export function init(root, opties = {}) {
  if (!vereisRoot(root, 'werkgebied-kaart')) return () => {};
  const { zoom = 1.9, duur = 1400, drempel = 0.15, bijWissel } = opties;
  const doc = root.ownerDocument;
  const win = doc.defaultView;

  const svg = root.querySelector('svg[data-wk-kaart]');
  const wereld = svg && svg.querySelector('[data-wk-wereld]');
  const punten = [...root.querySelectorAll('a[data-wk-punt]')];
  const kaartjes = [...root.querySelectorAll('[data-wk-project]')];
  const podium = root.querySelector('[data-wk-podium]') || (svg && svg.parentElement);
  if (!svg || !wereld || !kaartjes.length || !svg.viewBox || !svg.viewBox.baseVal || !svg.viewBox.baseVal.width) {
    console.warn('werkgebied-kaart: kaart (svg[data-wk-kaart] met [data-wk-wereld] en viewBox) of projecten ([data-wk-project]) ontbreken — overgeslagen');
    return () => {};
  }
  if (root.hasAttribute('data-wk-init')) return () => {}; // al geïnitialiseerd
  root.setAttribute('data-wk-init', '');

  const { width: W, height: H } = svg.viewBox.baseVal;
  const id = (k) => k.getAttribute('data-wk-project');
  const puntVan = (naam) => punten.find((p) => p.getAttribute('data-wk-punt') === naam) || null;
  const rolVoor = new Map();

  let actief = -2; // -2 = nog niets gezet, -1 = overzicht
  let zichtbaar = true;
  let slot = false; // na een klik: scrollen telt niet meer als wissel tot de pagina stilstaat
  let slotTimer = 0;
  let weg = false;
  let stil = minderBeweging().reduced;

  const naamVan = (k) => { const p = puntVan(id(k)); return (p && p.getAttribute('aria-label')) || (k.querySelector('.wk-plaats') || {}).textContent || id(k); };
  const nav = doc.createElement('div');
  nav.className = 'wk-nav';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Projecten op de kaart');
  for (const k of kaartjes) {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'wk-nav-knop'; b.setAttribute('data-wk-nav', id(k)); b.textContent = String(naamVan(k)).trim();
    nav.appendChild(b);
  }
  svg.parentElement.appendChild(nav);
  const navKnoppen = [...nav.children];

  root.classList.add('wk-js');
  root.style.setProperty('--wk-duur', '0ms'); // eerste stand zonder vlucht; hieronder weer aan
  root.setAttribute('data-wk-beweging', stil ? 'uit' : 'aan');
  for (const p of punten) { rolVoor.set(p, p.getAttribute('role')); p.setAttribute('role', 'button'); }

  /** Punten en namen blijven even groot op het scherm: de kaart schaalt (viewBox → scherm × zoom), zij schalen terug. */
  function tegenschaal() {
    const r = svg.getBoundingClientRect();
    const k = Math.min(r.width / W, r.height / H) || 1;
    root.style.setProperty('--wk-inv', String(1 / (k * (actief >= 0 ? zoom : 1))));
  }

  /**
   * Na de landing: namen die door de rand worden afgeknipt of die elkaar of een punt raken, gaan weg. Volgorde:
   * projectnamen eerst (die kiezen zo nodig een andere kant van hun punt en blijven altijd zichtbaar), daarna
   * contextplaatsen en waternamen (die verdwijnen bij een botsing).
   */
  function opruim() {
    const f = svg.getBoundingClientRect();
    // Vorm zonder rand: Firefox telt de letterrand (paint-order: stroke) mee in getBoundingClientRect, Chrome en WebKit niet.
    const rect = (el, m = 2) => {
      let r;
      if (el.getBBox && el.getScreenCTM && el.getScreenCTM()) {
        const b = el.getBBox(); const k = el.getScreenCTM(); const xs = []; const ys = [];
        for (const [x, y] of [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]) { xs.push(k.a * x + k.c * y + k.e); ys.push(k.b * x + k.d * y + k.f); }
        r = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
      } else r = el.getBoundingClientRect();
      return { left: r.left - m, right: r.right + m, top: r.top - m, bottom: r.bottom + m };
    };
    const raak = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const binnen = (r) => r.left >= f.left + 2 && r.right <= f.right - 2 && r.top >= f.top + 2 && r.bottom <= f.bottom - 2;
    const zichtbaar = (r) => r.right > f.left && r.left < f.right && r.bottom > f.top && r.top < f.bottom;
    const projectStippen = [...svg.querySelectorAll('.wk-stip')].map((el) => ({ el, r: rect(el, 1) }));
    const kernen = [...svg.querySelectorAll('.wk-kern')].map((el) => ({ el, r: rect(el, 1) }));
    const geplaatst = [];
    let stippen = projectStippen; // eerst alleen projectpunten als obstakel: contextpunten wijken voor projectnamen
    const vrij = (r, eigen) => !geplaatst.some((g) => raak(g, r)) && !stippen.some((s) => s.el !== eigen && raak(s.r, r));
    function plaatsNamen(lijst, nogEens) {
    for (const t of lijst) {
      const eigen = t.parentNode.querySelector('.wk-stip');
      if (!t.hasAttribute('data-x0')) { t.setAttribute('data-x0', t.getAttribute('x')); t.setAttribute('data-a0', t.getAttribute('text-anchor') || 'start'); }
      const x0 = Math.abs(+t.getAttribute('data-x0'));
      const start = t.getAttribute('data-a0') === 'start';
      // varianten: boven, onder, naast het punt, verder boven en onder; steeds voorkeurskant eerst, daarna gecentreerd
      const zet = (v) => {
        t.setAttribute('x', String(v[0])); t.setAttribute('y', String(v[1]));
        if (v[2] === 'start') t.removeAttribute('text-anchor'); else t.setAttribute('text-anchor', v[2]);
      };
      const zijde = (rechts, y) => [rechts ? x0 : -x0, y, rechts ? 'start' : 'end'];
      const varianten = [-11, 22, 5, -28, 40].flatMap((y) => [zijde(start, y), zijde(!start, y)]).concat([[0, -18, 'middle'], [0, 34, 'middle']]);
      let gekozen = null; let terugval = null;
      for (const v of varianten) {
        zet(v);
        const r = rect(t);
        if (!zichtbaar(r) || !binnen(r)) continue;
        terugval = terugval || v;
        if (vrij(r, eigen)) { gekozen = v; break; }
      }
      const kies = gekozen || terugval;
      if (kies) {
        zet(kies); t.classList.remove('wk-af'); geplaatst.push(rect(t));
        if (!gekozen) nogEens.add(t);
      } else {
        zet(zijde(start, -11));
        const r = rect(t);
        t.classList.toggle('wk-af', zichtbaar(r) && !binnen(r));
        if (!t.classList.contains('wk-af')) geplaatst.push(r);
      }
    }
    }
    const alleNamen = [...svg.querySelectorAll('.wk-naam')];
    const voorrang = new Set(); // namen die zonder botsing nergens paste: die mogen de volgende ronde als eerste kiezen
    let namen;
    for (let ronde = 0; ronde < 4; ronde++) {
      geplaatst.length = 0;
      const nogEens = new Set();
      namen = [...alleNamen].sort((x, y) => (voorrang.has(y) ? 2 : y.closest('.wk-punt.is-actief') ? 1 : 0) - (voorrang.has(x) ? 2 : x.closest('.wk-punt.is-actief') ? 1 : 0));
      plaatsNamen(namen, nogEens);
      if (!nogEens.size || [...nogEens].every((n) => voorrang.has(n))) break;
      nogEens.forEach((n) => voorrang.add(n));
    }
    // contextpunten onder een projectnaam verdwijnen samen met hun naam
    for (const k of kernen) k.el.classList.toggle('wk-af', geplaatst.some((g) => raak(g, k.r)));
    stippen = [...projectStippen, ...kernen.filter((k) => !k.el.classList.contains('wk-af'))];
    for (const t of svg.querySelectorAll('.wk-context, .wk-water-naam')) {
      const r = rect(t);
      const eigen = t.parentNode.querySelector('.wk-kern');
      const weg = (eigen && eigen.classList.contains('wk-af')) || (zichtbaar(r) && (!binnen(r) || !vrij(r, eigen)));
      t.classList.toggle('wk-af', weg);
      if (!weg && zichtbaar(r)) geplaatst.push(r);
    }
  }
  let landT = 0;
  const landen = () => { win.clearTimeout(landT); landT = win.setTimeout(opruim, stil ? 0 : duur + 80); };

  function zet(i) {
    if (i === actief) return;
    actief = i;
    const k = kaartjes[i];
    const p = k ? puntVan(id(k)) : null;
    kaartjes.forEach((el, j) => {
      el.classList.toggle('is-actief', j === i);
      if (j === i) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
    });
    punten.forEach((el) => {
      const aan = el === p;
      el.classList.toggle('is-actief', aan);
      if (aan) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
    });
    root.setAttribute('data-wk-actief', k ? id(k) : '');
    if (p) {
      const x = +p.getAttribute('data-x'); const y = +p.getAttribute('data-y');
      root.style.setProperty('--wk-s', String(zoom));
      root.style.setProperty('--wk-x', `${(W / 2 - zoom * x).toFixed(1)}px`);
      root.style.setProperty('--wk-y', `${(H / 2 - zoom * y).toFixed(1)}px`);
    } else {
      for (const v of ['--wk-s', '--wk-x', '--wk-y']) root.style.removeProperty(v);
    }
    tegenschaal();
    landen();
    navKnoppen.forEach((b, j) => { if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    const ak = navKnoppen[i];
    if (ak) { // de rij scrolt mee naar de actieve knop (alleen horizontaal, niet de pagina)
      const links = ak.offsetLeft - nav.offsetLeft - (nav.clientWidth - ak.offsetWidth) / 2;
      try { nav.scrollTo({ left: links, behavior: stil ? 'auto' : 'smooth' }); } catch { nav.scrollLeft = links; }
    }
    if (bijWissel) bijWissel(k ? id(k) : null, i);
  }

  /** y (in de viewport) waar een kaartje "aan de beurt" is: het midden van de ruimte naast of onder de kaart. */
  function lijn() {
    const vh = win.innerHeight;
    if (!podium) return vh / 2;
    const pr = podium.getBoundingClientRect();
    const gestapeld = pr.width > root.getBoundingClientRect().width * 0.8; // kaart boven, kaartjes eronder
    return gestapeld ? pr.height + (vh - pr.height) / 2 : vh / 2;
  }

  function bepaal() {
    if (weg || slot || !zichtbaar) return;
    const y = lijn();
    let beste = 0; let afstand = Infinity;
    kaartjes.forEach((k, i) => {
      const r = k.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - y);
      if (d < afstand) { afstand = d; beste = i; }
    });
    const eerste = kaartjes[0].getBoundingClientRect();
    const voorStart = eerste.top + eerste.height / 2 - y > eerste.height * drempel;
    zet(voorStart ? -1 : beste);
  }
  const bijScroll = perFrame(bepaal, doc);

  function vrijgeven() {
    win.clearTimeout(slotTimer);
    slotTimer = win.setTimeout(() => {
      slot = false;
      // Staat de focus via het toetsenbord op een punt, dan wint dat punt van de scrollpositie: bij snel
      // Tabben liep in WebKit een tweede gladde scroll niet door en koos bepaal() het vorige project (29-09).
      const f = doc.activeElement;
      const i = viaToets && f && f.closest && root.contains(f) && f.closest('a[data-wk-punt]')
        ? kaartjes.findIndex((k) => id(k) === f.closest('a[data-wk-punt]').getAttribute('data-wk-punt')) : -1;
      if (i >= 0) zet(i); else bepaal();
    }, 220);
  }
  const bijScrollSlot = () => { if (slot) vrijgeven(); };

  function naar(i) {
    const r = kaartjes[i].getBoundingClientRect();
    const dy = r.top + r.height / 2 - lijn();
    slot = true;
    zet(i);
    vrijgeven();
    win.scrollBy({ top: dy, behavior: stil ? 'auto' : 'smooth' });
  }

  const kiesBij = (e) => (e.target.closest && e.target.closest('a[data-wk-punt], button[data-wk-nav]')) || null;
  const bijKlik = (e) => {
    const p = kiesBij(e);
    if (!p || !root.contains(p)) return;
    const i = kaartjes.findIndex((k) => id(k) === (p.getAttribute('data-wk-punt') || p.getAttribute('data-wk-nav')));
    if (i < 0) return;
    e.preventDefault();
    naar(i);
  };
  const bijToets = (e) => {
    const p = kiesBij(e);
    if (e.key !== ' ' || !p || p.tagName.toLowerCase() !== 'a') return; // een echte knop doet Spatie zelf
    e.preventDefault(); // Spatie bij een punt: kiezen, niet de pagina laten scrollen
    p.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true })); // SVG-elementen hebben geen .click()
  };

  // Toetsenbord: Tab naar een punt dat buiten het ingezoomde stuk ligt laat de kaart naar dat punt gaan,
  // zodat de focus nooit op iets onzichtbaars staat (WCAG 2.4.11).
  // Geen :focus-visible: WebKit matcht dat niet na Option+Tab. Eigen vlag: laatste invoer was een toets (geen aanwijzer).
  let viaToets = false;
  const bijToetsInvoer = (e) => { if (e.key !== 'Shift' && e.key !== 'Alt') viaToets = true; };
  const bijAanwijzer = () => { viaToets = false; };
  doc.addEventListener('keydown', bijToetsInvoer, true);
  doc.addEventListener('pointerdown', bijAanwijzer, true);
  const bijFocus = (e) => {
    const p = e.target.closest && e.target.closest('a[data-wk-punt]');
    if (!p || !root.contains(p)) return;
    if (!viaToets) return; // muisklik: bijKlik regelt het
    const i = kaartjes.findIndex((k) => id(k) === p.getAttribute('data-wk-punt'));
    if (i >= 0 && i !== actief) naar(i);
  };
  root.addEventListener('focusin', bijFocus);
  root.addEventListener('click', bijKlik);
  root.addEventListener('keydown', bijToets);
  win.addEventListener('scroll', bijScroll, { passive: true });
  win.addEventListener('scroll', bijScrollSlot, { passive: true });
  // Resize of draaien: de kaartjes verschuiven, dus de scrollpositie hoort bij een ander project. Breedtewijziging
  // (draaien, venster) zet de pagina terug op het project dat de bezoeker had; alleen de hoogte (adresbalk) niet.
  let laatsteBreedte = win.innerWidth; let bewaar = null; let resizeT = 0;
  const bijResize = () => {
    if (win.innerWidth !== laatsteBreedte) {
      if (bewaar === null && actief >= 0) bewaar = actief;
      if (bewaar !== null) slot = true;
      laatsteBreedte = win.innerWidth;
    }
    win.clearTimeout(resizeT);
    resizeT = win.setTimeout(() => {
      root.style.setProperty('--wk-duur', '0ms'); // maatwissel is geen vlucht: punten en namen direct op de nieuwe grootte
      tegenschaal();
      void root.offsetWidth;
      root.style.setProperty('--wk-duur', `${duur}ms`);
      if (bewaar !== null && !weg) {
        const r = kaartjes[bewaar].getBoundingClientRect();
        const dy = r.top + r.height / 2 - lijn();
        try { win.scrollBy({ top: dy, behavior: 'instant' }); } catch { win.scrollBy(0, dy); }
        bewaar = null; slot = false;
      }
      bepaal(); opruim();
    }, 150);
  };
  win.addEventListener('resize', bijResize, { passive: true });
  const stopBeeld = inBeeld(root, () => { zichtbaar = true; bepaal(); }, { once: false, rootMargin: '200px', bijUit: () => { zichtbaar = false; } });
  const beweging = minderBeweging((r) => { stil = r; root.setAttribute('data-wk-beweging', r ? 'uit' : 'aan'); }, doc);

  bepaal();
  void root.offsetWidth; // stijl doorrekenen zónder transitie
  root.style.setProperty('--wk-duur', `${duur}ms`);
  opruim();
  // Letters en afmetingen veranderen na het laden (lettertype, resize): namen opnieuw plaatsen.
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (!weg) opruim(); });
  const ro = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(() => { if (!weg) landen(); }) : null;
  if (ro) ro.observe(svg);

  return function destroy() {
    if (weg) return;
    weg = true;
    if (ro) ro.disconnect();
    win.clearTimeout(slotTimer);
    bijScroll.cancel();
    root.removeEventListener('click', bijKlik);
    root.removeEventListener('focusin', bijFocus);
    doc.removeEventListener('keydown', bijToetsInvoer, true);
    doc.removeEventListener('pointerdown', bijAanwijzer, true);
    root.removeEventListener('keydown', bijToets);
    win.removeEventListener('scroll', bijScroll);
    win.removeEventListener('scroll', bijScrollSlot);
    win.removeEventListener('resize', bijResize);
    win.clearTimeout(resizeT); win.clearTimeout(landT);
    stopBeeld();
    beweging.stop();
    root.classList.remove('wk-js');
    nav.remove();
    svg.querySelectorAll('.wk-naam').forEach((t) => { if (t.hasAttribute('data-x0')) { t.setAttribute('x', t.getAttribute('data-x0')); t.setAttribute('y', '-11'); if (t.getAttribute('data-a0') === 'start') t.removeAttribute('text-anchor'); else t.setAttribute('text-anchor', 'end'); t.removeAttribute('data-x0'); t.removeAttribute('data-a0'); } });
    svg.querySelectorAll('.wk-af').forEach((t) => { t.classList.remove('wk-af'); if (!t.getAttribute('class')) t.removeAttribute('class'); });
    for (const a of ['data-wk-beweging', 'data-wk-actief', 'data-wk-init']) root.removeAttribute(a);
    for (const v of ['--wk-duur', '--wk-s', '--wk-x', '--wk-y', '--wk-inv']) root.style.removeProperty(v);
    if (!root.getAttribute('style')) root.removeAttribute('style');
    for (const el of [...kaartjes, ...punten]) {
      el.classList.remove('is-actief'); el.removeAttribute('aria-current');
      if (!el.getAttribute('class')) el.removeAttribute('class');
    }
    for (const p of punten) { const r = rolVoor.get(p); if (r === null) p.removeAttribute('role'); else p.setAttribute('role', r); }
  };
}
