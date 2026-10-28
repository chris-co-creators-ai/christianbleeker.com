/**
 * kaartenrij-lottie
 * ------------------------------------------------------------------------
 * Een rij kaarten die op het midden van het scherm vastpint. Al tijdens het
 * naderen tekent een groot hoofdicoon zich met de scroll. Bij het pinnen
 * komt de rij van onder het scherm omhoog terwijl het hoofdicoon krimpt tot
 * precies de plek en maat van het icoon van kaart 1; op dat ene frame wisselen
 * ze (overdracht). Daarna schuift de rij zijwaarts mee met de scroll, met
 * dezelfde snelheid als de scroll (1 px scroll = 1 px schuiven), en speelt
 * alleen de kaart die het dichtst bij het midden staat zijn Lottie af.
 *
 * Geen GSAP: de pin is `position: sticky` en alle voortgang komt uit één
 * `getBoundingClientRect()` per frame. Op telefoons (≤ 767 px) kun je tijdens
 * de pin horizontaal vegen; dat verplaatst de verticale scroll (× 2, begrensd
 * op begin en eind van de pin). Ankerlinks naar iets ná de sectie worden na
 * het opmeten opnieuw uitgerekend, ook bij binnenkomst met een #hash.
 *
 * Zonder JS en bij "minder beweging" blijft het een gewone `<ol>` met
 * statische SVG-iconen in een raster; de Lottie-speler wordt dan niet eens
 * geladen. Zet de bezoeker "minder beweging" halverwege om, dan schakelt de
 * sectie live om (R1).
 *
 * Lottie-speler: de eigen kopie van lottie-web light in `vendor/`
 * (MIT), lui geladen met `import()` zodra de sectie binnen 600 px komt (R17).
 *
 * Gedrag en getallen als vertrekpunt genomen van een bureausite; de code is eigen werk.
 *
 * @typedef {Object} KaartenrijOpties
 * @property {number} [introFactor=0.35] Lengte van de intro (hoofdicoon klaar + kaarten omhoog) als deel van de schermhoogte.
 * @property {number} [voorStart=0.95] Het hoofdicoon begint te tekenen als het midden van het blok op deze hoogte (deel van het scherm) staat.
 * @property {number} [voorVoortgang=0.35] Deel van de hoofd-Lottie dat getekend is op het moment dat het blok pint.
 * @property {number} [startSchaal=2.4] Hoeveel keer groter het hoofdicoon is dan een kaarticoon, vóór de intro.
 * @property {string} [veegQuery='(max-width: 767px)'] Waaronder horizontaal vegen tijdens de pin aan staat.
 * @property {number} [veegDrempel=8] Pixels voordat de veegrichting vastligt.
 * @property {number} [veegFactor=2] Verticale scroll per pixel horizontaal vegen.
 * @property {number} [uitloopSnelheid=2.5] Snelheid waarmee een kaart die niet meer in het midden staat zijn lus afmaakt (eindigt in rust, geen sprong).
 * @property {number} [voorOmhoog=0] Deel (0 tot 1) van de opkomst van de kaarten dat al tijdens het naderen gebeurt, in plaats van pas bij het pinnen. 0 = de kaarten komen pas in de intro.
 * @property {{introFactor?: number, voorOmhoog?: number}} [mobiel] Overschrijft die twee opties onder `veegQuery` (telefoon). Standaard `{ introFactor: 0.2, voorOmhoog: 0.8 }`: op een telefoon is het scherm hoog en smal, en met de desktopwaarden staat de rij ±750 px lang bijna leeg terwijl alleen het icoon tekent.
 * @property {boolean} [ankerFix=true] Ankerlinks naar doelen ná de sectie zelf uitrekenen.
 *
 * @param {HTMLElement} root `[data-kaartenrij]`
 * @param {KaartenrijOpties} [opties]
 * @returns {() => void} destroy — idempotent.
 */
import { minderBeweging, vereisRoot, inBeeld, perFrame, zonderUndefined } from '../../_kwaliteit/basis.js';

const STANDAARD = {
  introFactor: 0.35,
  voorStart: 0.95,
  voorVoortgang: 0.35,
  startSchaal: 2.4,
  veegQuery: '(max-width: 767px)',
  veegDrempel: 8,
  veegFactor: 2,
  uitloopSnelheid: 2.5,
  voorOmhoog: 0,
  mobiel: { introFactor: 0.2, voorOmhoog: 0.8 },
  ankerFix: true,
};

// Letterlijk pad: een bundler (Next/webpack/Vite) moet `import()` kunnen volgen. De speler staat bij het onderdeel zelf, zodat het pad ook in een platte kopie klopt.
const klem = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const zacht = (t) => 0.5 - Math.cos(Math.PI * t) / 2; // ease-in-out (sinus)

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'kaartenrij-lottie')) return () => {};
  if (typeof root.__kaartenrijDestroy === 'function') root.__kaartenrijDestroy();

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  o.mobiel = { ...STANDAARD.mobiel, ...(opties && opties.mobiel) };

  const pin = root.querySelector('[data-kaartenrij-pin]');
  const stage = root.querySelector('[data-kaartenrij-stage]');
  const track = root.querySelector('[data-kaartenrij-track]');
  const hoofd = root.querySelector('[data-kaartenrij-hoofd]');
  const kaarten = track ? Array.from(track.querySelectorAll(':scope > [data-kaartenrij-kaart]')) : [];
  if (!pin || !stage || !track || !hoofd || kaarten.length < 2) {
    console.warn('kaartenrij-lottie: pin, stage, track, hoofd of ≥ 2 kaarten ontbreken — overgeslagen');
    return () => {};
  }
  const iconen = kaarten.map((k) => k.querySelector('[data-kaartenrij-icoon]'));

  let aan = false;
  let vernietigd = false;
  let zichtbaar = false;
  let m = null; // maten
  let actief = -1;
  let laatsteFase = '';
  let laatsteHoofdFrame = -1;
  let lib = null;
  let laden = null;
  let hoofdAnim = null;
  const kaartAnims = kaarten.map(() => null);
  const stoppers = [];

  const veegMq = win.matchMedia(o.veegQuery);

  // ---------- opmeten ----------
  function meten() {
    track.style.transform = '';
    hoofd.style.cssText = '';
    const vh = win.innerHeight;
    const stageH = stage.offsetHeight;
    const top = Math.max(0, Math.round((vh - stageH) / 2));
    root.style.setProperty('--kr-top', `${top}px`);
    const vw = stage.clientWidth;
    const kaartB = kaarten[0].offsetWidth;
    const links = kaarten.map((k) => k.offsetLeft);
    const x0 = vw / 2 - (links[0] + kaartB / 2);
    const H = links[links.length - 1] - links[0];
    // Telefoon (veegQuery): kortere intro en kaarten die al tijdens het naderen omhoog komen.
    const mob = veegMq.matches ? o.mobiel : {};
    const I = Math.round((mob.introFactor ?? o.introFactor) * vh);
    pin.style.height = `${stageH + I + H}px`;

    // Plek van het icoon van kaart 1 zodra de rij op zijn startplek staat.
    track.style.transform = `translate3d(${x0}px,0,0)`;
    const s = stage.getBoundingClientRect();
    const r = iconen[0].getBoundingClientRect();
    Object.assign(hoofd.style, {
      left: `${r.left - s.left}px`,
      top: `${r.top - s.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
    });
    m = {
      vh, vw, stageH, top, I, H, x0, kaartB, links,
      voorOmhoog: mob.voorOmhoog ?? o.voorOmhoog,
      trackTop: track.offsetTop,
      breedte: win.innerWidth,
    };
    m.rise0 = vh - top - m.trackTop + 10;
  }

  // ---------- per frame ----------
  function update() {
    if (!aan || !m) return;
    const { vh, top, I, H, x0, rise0, kaartB, links, vw } = m;
    const r = pin.getBoundingClientRect();
    const s = top - r.top; // gescrolde pixels sinds het pinnen
    let hoofdP; let e; let omhoog; // omhoog: deel van de opkomst van de kaarten
    if (s < 0) {
      const midden = r.top + m.stageH / 2;
      const voor = klem((o.voorStart * vh - midden) / ((o.voorStart - 0.5) * vh));
      hoofdP = voor * o.voorVoortgang;
      e = 0;
      // naderen: de kaarten zijn op 60 % van de weg van de onderrand naar de pinplek al op hun plek
      omhoog = m.voorOmhoog * zacht(klem((vh - r.top) / ((vh - top) * 0.6)));
    } else if (s < I) {
      const t = s / I;
      hoofdP = o.voorVoortgang + (1 - o.voorVoortgang) * t;
      e = zacht(t);
      omhoog = m.voorOmhoog + (1 - m.voorOmhoog) * e;
    } else {
      hoofdP = 1;
      e = 1;
      omhoog = 1;
    }
    const h = klem(s - I, 0, H);
    const x = x0 - h;
    track.style.transform = `translate3d(${x.toFixed(2)}px,${(rise0 * (1 - omhoog)).toFixed(2)}px,0)`;
    hoofd.style.transform = `scale(${(o.startSchaal + (1 - o.startSchaal) * e).toFixed(4)})`;

    // Overdracht: één attribuut, dus hoofdicoon uit en icoon 1 aan op hetzelfde frame.
    const fase = s < I ? 'intro' : 'rij';
    if (fase !== laatsteFase) {
      root.setAttribute('data-kaartenrij-fase', fase);
      laatsteFase = fase;
    }

    if (hoofdAnim && fase === 'intro') {
      const f = hoofdP * (hoofdAnim.totalFrames - 1);
      if (Math.abs(f - laatsteHoofdFrame) > 0.01) {
        hoofdAnim.goToAndStop(f, true);
        laatsteHoofdFrame = f;
      }
    }

    let nieuw = -1;
    if (fase === 'rij') {
      let best = Infinity;
      for (let i = 0; i < links.length; i++) {
        const afstand = Math.abs(links[i] + kaartB / 2 + x - vw / 2);
        if (afstand < best) { best = afstand; nieuw = i; }
      }
    }
    if (nieuw !== actief) zetActief(nieuw);
  }

  // ---------- Lottie per kaart ----------
  function speel(i) {
    const a = kaartAnims[i];
    if (!a || !zichtbaar) return;
    a.setSpeed(1);
    a.setLoop(true);
    if (a.isPaused) a.play();
  }
  function laatUitlopen(i) {
    const a = kaartAnims[i];
    if (!a) return;
    // Maak de lus af en stop in rust (laatste frame = rustbeeld), in plaats van
    // te bevriezen halverwege een beweging.
    a.setLoop(false);
    a.setSpeed(o.uitloopSnelheid);
  }
  function zetActief(i) {
    if (actief >= 0) {
      kaarten[actief].removeAttribute('data-kaartenrij-speelt');
      laatUitlopen(actief);
    }
    actief = i;
    if (i >= 0) {
      kaarten[i].setAttribute('data-kaartenrij-speelt', '');
      speel(i);
    }
  }

  function maakAnim(slot, loop) {
    const src = slot.getAttribute('data-kaartenrij-lottie');
    if (!src) return null;
    const houder = doc.createElement('div');
    houder.className = 'kr-lottie';
    houder.setAttribute('aria-hidden', 'true');
    slot.appendChild(houder);
    const a = lib.loadAnimation({
      container: houder, renderer: 'svg', loop, autoplay: false, path: src,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    a.addEventListener('DOMLoaded', () => {
      if (vernietigd) return;
      a.goToAndStop(0, true);
      slot.setAttribute('data-kaartenrij-klaar', '');
      laatsteHoofdFrame = -1;
      update();
      if (a !== hoofdAnim && kaartAnims[actief] === a) speel(actief);
    });
    return a;
  }

  function laadSpeler() {
    if (laden) return laden;
    laden = import('./vendor/lottie_light.min.js').then(({ default: lottie }) => {
      if (vernietigd) return;
      lib = lottie;
      hoofdAnim = maakAnim(hoofd, false);
      iconen.forEach((slot, i) => { if (slot) kaartAnims[i] = maakAnim(slot, true); });
    }).catch((err) => {
      console.warn('kaartenrij-lottie: speler kon niet laden — statische iconen blijven staan', err);
    });
    return laden;
  }

  // ---------- vegen op telefoon ----------
  let veeg = null;
  function pinBereik() {
    const pinTop = pin.getBoundingClientRect().top + win.scrollY;
    const begin = pinTop - m.top;
    return [begin, begin + m.I + m.H];
  }
  function opTouchStart(ev) {
    veeg = null;
    if (!aan || !m || !veegMq.matches || ev.touches.length !== 1) return;
    const [begin, eind] = pinBereik();
    if (win.scrollY < begin - 1 || win.scrollY > eind + 1) return; // alleen tijdens de pin
    const t = ev.touches[0];
    veeg = { x: t.clientX, y: t.clientY, scrollY: win.scrollY, richting: null, begin, eind };
  }
  function opTouchMove(ev) {
    if (!veeg) return;
    const t = ev.touches[0];
    const dx = t.clientX - veeg.x;
    const dy = t.clientY - veeg.y;
    if (!veeg.richting) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < o.veegDrempel) return;
      veeg.richting = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
    if (veeg.richting !== 'h') return; // verticaal: de browser scrolt gewoon
    if (ev.cancelable) ev.preventDefault();
    // 'instant': met html { scroll-behavior: smooth } start elke touchmove anders een nieuwe zachte scroll
    // en loopt de rij achter de vinger aan (gemeten 26-10: +13 i.p.v. +300 px na de veeg).
    win.scrollTo({ top: klem(veeg.scrollY - dx * o.veegFactor, veeg.begin, veeg.eind), behavior: 'instant' });
  }
  function opTouchEind() { veeg = null; }

  // ---------- ankerlinks ná de sectie ----------
  function doelNa(id) {
    if (!id) return null;
    let doel = null;
    try { doel = doc.getElementById(decodeURIComponent(id)); } catch { doel = null; }
    if (!doel || root.contains(doel)) return null;
    // eslint-disable-next-line no-bitwise
    return root.compareDocumentPosition(doel) & win.Node.DOCUMENT_POSITION_FOLLOWING ? doel : null;
  }
  function naarDoel(doel) {
    win.requestAnimationFrame(() => win.requestAnimationFrame(() => {
      if (vernietigd) return;
      const html = doc.documentElement;
      const oud = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      const marge = parseFloat(win.getComputedStyle(doel).scrollMarginTop) || 0;
      win.scrollTo(0, doel.getBoundingClientRect().top + win.scrollY - marge);
      html.style.scrollBehavior = oud;
      update();
      if (typeof doel.focus === 'function') doel.focus({ preventScroll: true });
    }));
  }
  function opKlik(ev) {
    if (!aan || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const doel = doelNa(id);
    if (!doel) return;
    ev.preventDefault();
    if (win.location.hash !== `#${id}`) win.history.pushState(null, '', `#${id}`);
    naarDoel(doel);
  }

  // ---------- aan / uit ----------
  const opScroll = perFrame(update, doc);
  const opResize = perFrame(() => {
    if (!aan) return;
    // Alleen opnieuw opmeten als de breedte echt verandert: het toetsenbord en
    // de adresbalk op telefoons veranderen alleen de hoogte.
    if (!m || Math.abs(win.innerWidth - m.breedte) >= 5) meten();
    update();
  }, doc);

  function aanzetten() {
    if (aan || vernietigd) return;
    aan = true;
    root.setAttribute('data-kaartenrij-aan', '');
    meten();
    laatsteFase = '';
    update();
    win.addEventListener('scroll', opScroll, { passive: true });
    win.addEventListener('resize', opResize, { passive: true });
    stage.addEventListener('touchstart', opTouchStart, { passive: true });
    stage.addEventListener('touchmove', opTouchMove, { passive: false });
    stage.addEventListener('touchend', opTouchEind, { passive: true });
    stage.addEventListener('touchcancel', opTouchEind, { passive: true });
    if (o.ankerFix) doc.addEventListener('click', opKlik);
    stoppers.push(inBeeld(root, laadSpeler, { rootMargin: '600px' }));
    stoppers.push(inBeeld(root, () => {
      zichtbaar = true;
      if (actief >= 0) speel(actief);
    }, {
      once: false,
      bijUit: () => {
        zichtbaar = false;
        kaartAnims.forEach((a) => a && a.pause());
      },
    }));
    if (o.ankerFix) {
      const doel = doelNa(win.location.hash.slice(1));
      if (doel) naarDoel(doel);
    }
  }

  function uitzetten() {
    if (!aan) return;
    aan = false;
    opScroll.cancel();
    opResize.cancel();
    win.removeEventListener('scroll', opScroll);
    win.removeEventListener('resize', opResize);
    stage.removeEventListener('touchstart', opTouchStart);
    stage.removeEventListener('touchmove', opTouchMove);
    stage.removeEventListener('touchend', opTouchEind);
    stage.removeEventListener('touchcancel', opTouchEind);
    doc.removeEventListener('click', opKlik);
    stoppers.splice(0).forEach((stop) => stop());
    zichtbaar = false;
    if (actief >= 0) kaarten[actief].removeAttribute('data-kaartenrij-speelt');
    actief = -1;
    kaartAnims.forEach((a) => { if (a) { a.setLoop(true); a.setSpeed(1); a.goToAndStop(0, true); } });
    root.removeAttribute('data-kaartenrij-aan');
    root.removeAttribute('data-kaartenrij-fase');
    root.style.removeProperty('--kr-top');
    pin.style.height = '';
    track.style.transform = '';
    hoofd.style.cssText = '';
    laatsteFase = '';
    m = null;
  }

  const beweging = minderBeweging((reduced) => (reduced ? uitzetten() : aanzetten()), doc);
  if (!beweging.reduced) aanzetten();

  function destroy() {
    if (vernietigd) return;
    uitzetten();
    vernietigd = true;
    beweging.stop();
    if (hoofdAnim) hoofdAnim.destroy();
    kaartAnims.forEach((a) => a && a.destroy());
    hoofdAnim = null;
    kaartAnims.fill(null);
    root.querySelectorAll('.kr-lottie').forEach((el) => el.remove());
    root.querySelectorAll('[data-kaartenrij-klaar]').forEach((el) => el.removeAttribute('data-kaartenrij-klaar'));
    delete root.__kaartenrijDestroy;
    delete root.__kaartenrij;
  }

  // Introspectie voor het meetscript (geen publiek contract).
  root.__kaartenrij = {
    get maten() { return m; },
    get actief() { return actief; },
    get hoofd() { return hoofdAnim; },
    get kaarten() { return kaartAnims.slice(); },
  };
  root.__kaartenrijDestroy = destroy;
  return destroy;
}
