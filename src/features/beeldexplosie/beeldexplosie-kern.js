/**
 * beeldexplosie
 * ------------------------------------------------------------------------
 * Hero met losse foto's rond een grote kop. Bij het laden springen de foto's
 * in vier golven vanuit het midden naar hun plek en komt de kop regel voor
 * regel uit een masker. Bij scrollen (sticky podium in een hoog spoor)
 * vliegen de foto's naar buiten en worden groter, zakt de kop weg en groeit
 * in het midden een videokaart tot ±80vw (staand op mobiel).
 *
 * Techniek: één rAF-scrolllezer zet `--p` (0..1) op de root; álle
 * scrollbeweging is CSS (`transform` uit `calc(var(--p) * …)`). De intro is
 * WAAPI op een binnenlaag, zodat hij nooit botst met de scroll-transform.
 * Geen scrollslot. Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @typedef {Object} BeeldexplosieOpties
 * @property {boolean} [intro=true]          Laadanimatie aan/uit.
 * @property {boolean} [introPerSessie=false] Intro maar 1× per tabblad-sessie (R12).
 * @property {number[]} [golven]             Starttijden (s) van de vier golven. Standaard [.04, .14, .24, .39].
 * @property {number} [kopStart=0.35]         Start (s) van de eerste kopregel.
 * @property {number} [kopStagger=0.12]       Tijd (s) tussen de kopregels.
 * @property {number} [kaartStart=0.46]       Voortgang waarop de kaart begint te groeien.
 * @property {number} [kaartEind=0.87]        Voortgang waarop de kaart vol is.
 *
 * @param {Element} root `.bx` met `[data-bx-spoor]`, `[data-bx-podium]`, `[data-bx-beeld]`, `[data-bx-regel]`, `[data-bx-kaart]`.
 * @param {BeeldexplosieOpties} [opties]
 * @returns {() => void} destroy (idempotent)
 */
import { minderBeweging, perFrame, vereisRoot, frequentie, inBeeld, zonderUndefined } from '../../_kwaliteit/basis.js';

const EASE_UIT = 'cubic-bezier(.215,.61,.355,1)'; // ≈ power3.out
const EASE_KOP = 'cubic-bezier(.16,1,.3,1)';       // expo.out: snel uit het masker, zacht neerzetten
const klem = (x) => Math.min(1, Math.max(0, x));
const getal = (v, terug) => (v != null && v !== '' && Number.isFinite(+v) ? +v : terug);

const ICOON_PAUZE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const ICOON_SPEEL = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'beeldexplosie')) return () => {};
  const spoor = root.querySelector('[data-bx-spoor]');
  const podium = root.querySelector('[data-bx-podium]');
  if (!spoor || !podium) {
    console.warn('beeldexplosie: [data-bx-spoor] of [data-bx-podium] ontbreekt — overgeslagen');
    return () => {};
  }
  const o = {
    intro: true, introPerSessie: false, golven: [0.04, 0.14, 0.24, 0.39],
    kopStart: 0.35, kopStagger: 0.12, kaartStart: 0.46, kaartEind: 0.87, ...zonderUndefined(opties),
  };

  const beelden = [...root.querySelectorAll('[data-bx-beeld]')];
  const regels = [...root.querySelectorAll('[data-bx-regel]')];
  const kaart = root.querySelector('[data-bx-kaart]');
  const video = kaart ? kaart.querySelector('video') : null;
  const st = { p: -1, stil: false, zichtbaar: true, kaartAan: false, geladen: false, gebruikerPauze: false };
  const anims = [];
  const gezet = []; // [element, property] om bij destroy op te ruimen
  let dood = false;
  let vangnet = 0;

  const zet = (el, prop, waarde) => { el.style.setProperty(prop, waarde); gezet.push([el, prop]); };

  // --- per beeld: timing als CSS-variabelen; de uitvliegvector volgt in richtUit() -----
  beelden.forEach((b, i) => {
    const d = b.dataset;
    zet(b, '--us', String(getal(d.uitSchaal, 1.6)));
    zet(b, '--s', String(getal(d.start, 0.01 + (i % 4) * 0.05)));
    zet(b, '--d', String(Math.max(0.05, getal(d.duur, 0.62 + (i % 3) * 0.06))));
  });

  // Richting uit data-uit-x/-y (in % van het eigen beeld) of weg van het midden. De lengte wordt zo
  // nodig opgerekt zodat elk beeld aan het eind van zijn baan écht buiten het podium staat — ook als
  // de opstelling op een andere schermmaat anders uitvalt. Leest alleen layout zonder transform (offset*).
  function richtUit() {
    if (dood) return;
    const W = podium.clientWidth; const H = podium.clientHeight;
    for (const b of beelden) {
      const w = b.offsetWidth; const h = b.offsetHeight;
      if (!w || !h || !W || !H) continue;
      const cx = b.offsetLeft + w / 2; const cy = b.offsetTop + h / 2;
      let ux = getal(b.dataset.uitX, NaN); let uy = getal(b.dataset.uitY, NaN);
      if (!Number.isFinite(ux)) ux = ((cx / W) - 0.5) * 400;
      if (!Number.isFinite(uy)) uy = ((cy / H) - 0.5) * 400;
      const s = getal(b.dataset.uitSchaal, 1.6);
      const vx = (ux / 100) * w; const vy = (uy / 100) * h;
      const nodig = (v, c, half, maat) => (v < -0.5 ? (c + half) / -v : v > 0.5 ? (maat - c + half) / v : Infinity);
      const k = Math.min(nodig(vx, cx, (s * w) / 2, W), nodig(vy, cy, (s * h) / 2, H)) * 1.06;
      const f = Number.isFinite(k) ? Math.max(1, k) : 1;
      b.style.setProperty('--ux', `${(ux * f).toFixed(1)}%`);
      b.style.setProperty('--uy', `${(uy * f).toFixed(1)}%`);
    }
  }
  for (const b of beelden) gezet.push([b, '--ux'], [b, '--uy']);
  regels.forEach((r, i) => zet(r, '--i', String(i)));
  zet(root, '--bx-kaart-start', String(o.kaartStart));
  zet(root, '--bx-kaart-eind', String(o.kaartEind));

  // --- videokaart: eigen pauzeknop, laden pas als de kaart eraan komt -----
  let knop = null;
  const hadControls = video ? video.hasAttribute('controls') : false;
  const zetKnop = () => {
    if (!knop || !video) return;
    const speelt = !video.paused;
    knop.setAttribute('aria-label', speelt ? 'Pauzeer video' : 'Speel video af');
    knop.innerHTML = speelt ? ICOON_PAUZE : ICOON_SPEEL;
  };
  const speel = () => {
    if (!video || st.gebruikerPauze || st.stil) return;
    if (!st.geladen) { st.geladen = true; video.preload = 'auto'; }
    const b = video.play();
    if (b && b.catch) b.catch(() => { /* autoplay geweigerd: knop blijft "Speel af" */ zetKnop(); });
  };
  const stop = () => { if (video && !video.paused) video.pause(); };
  if (video) {
    video.removeAttribute('controls');
    video.muted = true; video.loop = true; video.playsInline = true;
    knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'bx__pauze';
    knop.setAttribute('data-bx-pauze', '');
    kaart.append(knop);
    zetKnop();
  }
  const bijKnop = () => {
    if (!video) return;
    if (video.paused) {
      st.gebruikerPauze = false;
      if (!st.geladen) { st.geladen = true; video.preload = 'auto'; }
      const b = video.play(); if (b && b.catch) b.catch(() => zetKnop());
    } else { st.gebruikerPauze = true; video.pause(); }
  };
  const bijVideo = () => zetKnop();
  // Tab naar de knop terwijl de kaart nog klein is: zet de pagina (instant) op het punt waar de kaart vol is.
  const bijFocus = () => {
    if (st.stil || dood || st.p >= o.kaartEind) return;
    const s = spoor.getBoundingClientRect();
    const totaal = s.height - podium.offsetHeight;
    window.scrollTo({ top: window.scrollY + s.top + totaal * Math.min(1, o.kaartEind + 0.04), behavior: 'instant' });
  };
  if (knop) { knop.addEventListener('click', bijKnop); knop.addEventListener('focus', bijFocus); }
  if (video) { video.addEventListener('play', bijVideo); video.addEventListener('pause', bijVideo); }

  function kaartStaat(p) {
    const aan = st.stil || p > o.kaartStart + 0.005;
    if (aan !== st.kaartAan) { st.kaartAan = aan; root.toggleAttribute('data-bx-kaart-aan', aan); }
    if (!video || st.stil) return;
    if (st.zichtbaar && p > o.kaartStart) speel();
    else stop();
  }

  // --- één scrolllezer --------------------------------------------------
  function lees() {
    if (dood || st.stil) return;
    const r = spoor.getBoundingClientRect();
    const totaal = r.height - podium.offsetHeight;
    const p = totaal > 0 ? klem(-r.top / totaal) : 0;
    if (p === st.p) return;
    st.p = p;
    root.style.setProperty('--p', p.toFixed(4));
    kaartStaat(p);
  }
  const bijScroll = perFrame(lees);
  const bijMaat = perFrame(() => { richtUit(); st.p = -1; lees(); });
  window.addEventListener('scroll', bijScroll, { passive: true });
  window.addEventListener('resize', bijMaat, { passive: true });
  const stopBeeld = inBeeld(spoor, () => { st.zichtbaar = true; st.p = -1; lees(); }, {
    once: false, bijUit: () => { st.zichtbaar = false; stop(); },
  });

  // --- intro (WAAPI op de binnenlaag) -----------------------------------
  const rondIntroAf = () => { for (const a of anims) { try { a.finish(); } catch { /* al klaar */ } } };
  const stopIntro = () => { for (const a of anims) a.cancel(); anims.length = 0; clearTimeout(vangnet); };
  const bijOnderbreking = () => rondIntroAf();
  const onderbrekers = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

  function speelIntro() {
    const pr = podium.getBoundingClientRect();
    const cx = pr.left + pr.width / 2; const cy = pr.top + pr.height / 2;
    beelden.forEach((b, i) => {
      const binnen = b.querySelector('[data-bx-binnen]') || b.firstElementChild;
      if (!binnen || typeof binnen.animate !== 'function') return;
      const r = b.getBoundingClientRect();
      if (!r.width) return; // verborgen op deze schermmaat
      const dx = cx - (r.left + r.width / 2); const dy = cy - (r.top + r.height / 2);
      const golf = Math.min(o.golven.length - 1, getal(b.dataset.golf, i % o.golven.length));
      anims.push(binnen.animate([
        { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(0.12)`, opacity: 0 },
        { opacity: 1, offset: 0.22 },
        { transform: 'none', opacity: 1 },
      ], { duration: 1000 + (i % 3) * 100, delay: o.golven[golf] * 1000, easing: EASE_UIT, fill: 'backwards' }));
    });
    regels.forEach((r, i) => {
      const binnen = r.firstElementChild;
      if (!binnen || typeof binnen.animate !== 'function') return;
      anims.push(binnen.animate(
        [{ transform: 'translateY(108%)' }, { transform: 'none' }],
        { duration: 900, delay: (o.kopStart + i * o.kopStagger) * 1000, easing: EASE_KOP, fill: 'backwards' },
      ));
    });
    if (!anims.length) return;
    for (const t of onderbrekers) window.addEventListener(t, bijOnderbreking, { passive: true, once: true });
    vangnet = setTimeout(rondIntroAf, 4000); // R2: nooit iets half laten hangen
  }

  // --- minder beweging, live ---------------------------------------------
  function zetStil(r) {
    st.stil = r;
    root.toggleAttribute('data-bx-stil', r);
    if (r) {
      stopIntro();
      stop();
      root.style.removeProperty('--p');
      st.p = -1;
      kaartStaat(1);
    } else {
      richtUit(); st.p = -1; lees();
    }
    zetKnop();
  }
  const mb = minderBeweging((r) => zetStil(r));
  root.setAttribute('data-bx-actief', '');
  richtUit();
  zetStil(mb.reduced);

  let mag = o.intro && !st.stil;
  if (mag && o.introPerSessie) { const f = frequentie('beeldexplosie-intro'); mag = f.mag; f.markeer(); }
  if (mag) speelIntro();

  function destroy() {
    if (dood) return;
    dood = true;
    stopIntro();
    for (const t of onderbrekers) window.removeEventListener(t, bijOnderbreking);
    bijScroll.cancel(); bijMaat.cancel();
    window.removeEventListener('scroll', bijScroll);
    window.removeEventListener('resize', bijMaat);
    stopBeeld(); mb.stop();
    if (video) {
      video.removeEventListener('play', bijVideo); video.removeEventListener('pause', bijVideo);
      if (hadControls) video.setAttribute('controls', '');
    }
    stop();
    if (knop) { knop.removeEventListener('click', bijKnop); knop.removeEventListener('focus', bijFocus); knop.remove(); }
    for (const [el, prop] of gezet) el.style.removeProperty(prop);
    root.style.removeProperty('--p');
    root.removeAttribute('data-bx-actief'); root.removeAttribute('data-bx-stil'); root.removeAttribute('data-bx-kaart-aan');
  }
  return destroy;
}
