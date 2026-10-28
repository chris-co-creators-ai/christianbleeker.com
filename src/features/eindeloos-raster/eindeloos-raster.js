/**
 * eindeloos-raster
 * ------------------------------------------------------------------------
 * Portfoliomozaïek (grote staande casekaarten en kleine vierkante tegels) dat
 * bij scrollen steeds terugkomt, zonder sprong. Na een vast aantal cycli
 * (standaard 20) stopt het en komen de lijst met alle cases en de footer.
 *
 * Techniek: een paar fysieke kopieën van hetzelfde raster liggen absoluut in
 * een lus met hoogte `cycli × rasterhoogte`. Bij elke scrollstap (rAF) krijgt
 * de cyclus waar je bent en de cycli eronder elk een raster via
 * `translate3d(0, cyclus × hoogte, 0)` — stateless, dus ook een sprong (Home,
 * End, scrollbalk) klopt meteen. Het origineel blijft in de DOM; kopieën zijn
 * `inert` + `aria-hidden`. Video's in tegels spelen alleen in beeld.
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @typedef {Object} EindeloosOpties
 * @property {number} [cycli=20]        Aantal keer dat het raster terugkomt voordat de lijst en footer komen.
 * @property {boolean} [inkomen=true]   Tegels in het eerste scherm komen bij het laden rustig omhoog.
 * @property {string} [videoMarge='0px'] rootMargin voor het aan/uit zetten van tegelvideo's.
 *
 * @param {Element} root `.er` met `[data-er-loop]` > `[data-er-raster]`.
 * @param {EindeloosOpties} [opties]
 * @returns {() => void} destroy (idempotent)
 */
import { minderBeweging, perFrame, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

const EASE_IN = 'cubic-bezier(.22,1,.36,1)';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'eindeloos-raster')) return () => {};
  const loop = root.querySelector('[data-er-loop]');
  const raster = loop ? loop.querySelector('[data-er-raster]') : null;
  if (!loop || !raster) {
    console.warn('eindeloos-raster: [data-er-loop] of [data-er-raster] ontbreekt — overgeslagen');
    return () => {};
  }
  const o = { cycli: 20, inkomen: true, videoMarge: '0px', ...zonderUndefined(opties) };
  o.cycli = Math.max(1, Math.round(o.cycli));

  const st = { stil: false, actief: false, H: 0, rasters: [raster], plek: [], videoPauze: false };
  let io = null; let ro = null; let dood = false; const anims = [];

  // --- video's: alleen spelen in beeld (R18), nooit bij minder beweging ---
  const speelOfNiet = (v, inBeeld) => {
    if (inBeeld && !st.stil && !st.videoPauze) { const b = v.play(); if (b && b.catch) b.catch(() => {}); }
    else if (!v.paused) v.pause();
  };
  function kijkVideos() {
    if (io) io.disconnect();
    io = null;
    const videos = st.rasters.flatMap((r) => [...r.querySelectorAll('video')]);
    if (!videos.length || typeof IntersectionObserver === 'undefined') return;
    io = new IntersectionObserver((entries) => {
      for (const e of entries) { e.target.__erInBeeld = e.isIntersecting; speelOfNiet(e.target, e.isIntersecting); }
    }, { rootMargin: o.videoMarge });
    for (const v of videos) { v.muted = true; v.loop = true; v.playsInline = true; io.observe(v); }
  }
  const alleVideos = () => st.rasters.flatMap((r) => [...r.querySelectorAll('video')]);

  // Pauzeknop voor alle tegelvideo's (WCAG 2.2.2), in de balk naast de uitweg.
  const balk = root.querySelector('[data-er-balk]');
  let knop = null;
  if (balk && raster.querySelector('video')) {
    knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'er__knop';
    knop.setAttribute('data-er-pauze', '');
    balk.append(knop);
  }
  // Alleen een icoon: de balk blijft klein en dekt weinig af. De naam zit in aria-label.
  const ICOON_PAUZE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const ICOON_SPEEL = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>';
  const zetKnop = () => {
    if (!knop) return;
    const naam = st.videoPauze ? "Speel video's af" : "Pauzeer video's";
    knop.innerHTML = st.videoPauze ? ICOON_SPEEL : ICOON_PAUZE;
    knop.setAttribute('aria-label', naam);
    knop.title = naam;
    knop.setAttribute('aria-pressed', String(st.videoPauze));
    knop.hidden = st.stil;
  };

  // --- de balk wijkt voor kaarttekst --------------------------------------
  // De kaarten schuiven onder de plakkende balk door. Staat er tekst (label, titel, link)
  // onder, dan zoekt de balk de dichtstbijzijnde vrije plek erboven (max. 80 % van het scherm);
  // is de oorspronkelijke plek weer vrij, dan gaat hij terug. Gemeten: overlap < 5 % van de scrollposities.
  let dy = 0;
  const wijk = balk ? perFrame(() => {
    if (dood) return;
    const knoppen = [...balk.children].filter((e) => !e.hidden);
    if (!knoppen.length) return;
    const rs = knoppen.map((e) => e.getBoundingClientRect());
    const links = Math.min(...rs.map((r) => r.left)); const rechts = Math.max(...rs.map((r) => r.right));
    const top0 = Math.min(...rs.map((r) => r.top)) - dy;
    const hoog = Math.max(...rs.map((r) => r.bottom)) - dy - top0;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const MARGE = 4;
    const hindernis = [...root.querySelectorAll('.er__label, .er__titel, .er__meer')].map((e) => {
      const r = e.getBoundingClientRect();
      const ras = e.closest('[data-er-raster]');
      return ras && ras.style.visibility === 'hidden' ? null : r;
    }).filter((r) => r && r.bottom > 0 && r.top < vh && r.right > links && r.left < rechts);
    const vrij = (d) => !hindernis.some((r) => r.top < top0 + d + hoog + MARGE && r.bottom > top0 + d - MARGE);
    let nieuw = 0;
    if (!vrij(0)) {
      if (vrij(dy)) nieuw = dy;
      else {
        nieuw = 0;
        for (let d = -4; d >= -vh * 0.8; d -= 4) if (vrij(d)) { nieuw = d; break; }
      }
    }
    if (nieuw !== dy) { dy = nieuw; balk.style.transform = dy ? `translateY(${dy}px)` : ''; }
  }) : null;
  if (wijk) {
    window.addEventListener('scroll', wijk, { passive: true });
    window.addEventListener('resize', wijk, { passive: true });
    wijk();
  }
  const bijKnop = () => {
    st.videoPauze = !st.videoPauze; zetKnop();
    for (const v of alleVideos()) speelOfNiet(v, !!v.__erInBeeld);
  };
  if (knop) knop.addEventListener('click', bijKnop);

  // --- de lus ------------------------------------------------------------
  function maakKloon() {
    const k = raster.cloneNode(true);
    k.setAttribute('data-er-kloon', '');
    k.setAttribute('aria-hidden', 'true');
    k.inert = true; k.setAttribute('inert', '');
    for (const el of k.querySelectorAll('[id]')) el.removeAttribute('id');
    for (const v of k.querySelectorAll('video')) { v.pause(); v.removeAttribute('autoplay'); }
    loop.append(k);
    return k;
  }

  function meet() {
    if (!st.actief || dood) return;
    const H = raster.offsetHeight;
    if (!H) return;
    st.H = H;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const n = Math.max(2, Math.ceil(vh / H) + 1);
    let veranderd = false;
    while (st.rasters.length < n) { st.rasters.push(maakKloon()); veranderd = true; }
    while (st.rasters.length > n) { st.rasters.pop().remove(); veranderd = true; }
    if (veranderd) kijkVideos();
    loop.style.height = `${o.cycli * H}px`;
    st.plek = st.rasters.map(() => NaN);
    plaats();
  }

  // Stateless: cyclus c (waar de bovenkant van het scherm in de lus valt) en de n−1 cycli eronder.
  function plaats() {
    if (!st.actief || dood || !st.H) return;
    const n = st.rasters.length;
    const y = -loop.getBoundingClientRect().top;
    const c = Math.min(Math.max(0, Math.floor(y / st.H)), o.cycli - 1);
    for (let k = c; k < c + n; k++) {
      const i = k % n;
      const cyclus = k < o.cycli ? k : -1; // voorbij de laatste cyclus: verbergen
      if (st.plek[i] === cyclus) continue;
      st.plek[i] = cyclus;
      const r = st.rasters[i];
      r.style.transform = cyclus < 0 ? '' : `translate3d(0, ${cyclus * st.H}px, 0)`;
      r.style.visibility = cyclus < 0 ? 'hidden' : '';
    }
  }

  const bijScroll = perFrame(plaats);
  const bijMaat = perFrame(meet);

  function bouw() {
    if (st.actief) return;
    st.actief = true;
    root.setAttribute('data-er-actief', '');
    meet();
    window.addEventListener('scroll', bijScroll, { passive: true });
    window.addEventListener('resize', bijMaat, { passive: true });
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(bijMaat); ro.observe(raster); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => bijMaat());
  }

  function breekAf() {
    if (!st.actief) return;
    st.actief = false;
    bijScroll.cancel(); bijMaat.cancel();
    window.removeEventListener('scroll', bijScroll);
    window.removeEventListener('resize', bijMaat);
    if (ro) { ro.disconnect(); ro = null; }
    while (st.rasters.length > 1) st.rasters.pop().remove();
    raster.style.transform = ''; raster.style.visibility = '';
    loop.style.height = '';
    st.H = 0; st.plek = [];
    root.removeAttribute('data-er-actief');
  }

  function inkomen() {
    if (!o.inkomen || typeof raster.animate !== 'function') return;
    const vh = window.innerHeight;
    const items = [...raster.children].filter((li) => li.getBoundingClientRect().top < vh);
    items.forEach((li, i) => anims.push(li.animate(
      [{ transform: 'translate3d(0, 64px, 0)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 900, delay: 80 + i * 60, easing: EASE_IN, fill: 'backwards' },
    )));
    // de tegels schuiven nog even: de balk kijkt opnieuw als ze op hun plek staan
    const laatste = anims[anims.length - 1];
    if (laatste && wijk) laatste.finished.then(() => wijk(), () => {});
  }
  const stopInkomen = () => { for (const a of anims) a.cancel(); anims.length = 0; };

  function zetStil(r) {
    st.stil = r;
    root.toggleAttribute('data-er-stil', r);
    if (r) { stopInkomen(); breekAf(); } else bouw();
    kijkVideos();
    for (const v of alleVideos()) if (r && !v.paused) v.pause();
    zetKnop();
  }
  const mb = minderBeweging((r) => zetStil(r));
  zetStil(mb.reduced);
  if (!st.stil) inkomen();

  function destroy() {
    if (dood) return;
    stopInkomen();
    breekAf();
    dood = true;
    if (io) { io.disconnect(); io = null; }
    for (const v of raster.querySelectorAll('video')) { v.pause(); delete v.__erInBeeld; }
    mb.stop();
    if (wijk) {
      wijk.cancel();
      window.removeEventListener('scroll', wijk);
      window.removeEventListener('resize', wijk);
      balk.style.transform = '';
    }
    if (knop) { knop.removeEventListener('click', bijKnop); knop.remove(); }
    root.removeAttribute('data-er-stil');
  }
  return destroy;
}
