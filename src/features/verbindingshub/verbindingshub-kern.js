/**
 * verbindingshub
 * ------------------------------------------------------------------------
 * Een centrale tegel (logo-plek) met SVG-lijnen naar drie knopen links en
 * drie rechts (bijv. AI-assistenten ↔ apps). Een stip reist van een bron
 * naar de hub en door naar een doel; de knopen lichten om de beurt op.
 * Op smalle containers (< 560 px) staan de groepen boven en onder de hub en
 * lopen de lijnen verticaal. Lijnen worden herberekend bij elke maatwissel.
 *
 * De relatie staat als echte tekst in de markup (twee lijsten en de hub
 * ertussen); de lijnen en stippen zijn decor (`aria-hidden`).
 *
 * Beweging stopt buiten beeld, bij `prefers-reduced-motion`, bij een
 * verborgen tabblad en bij `html[data-motion="paused"]` / het event
 * `beweging:pauze` (contract van effects/beweging-pauze). Pauze bevriest
 * het beeld waar het is; minder beweging toont een stil diagram.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig. Animatie: requestAnimationFrame
 * + SVGPathElement.getPointAtLength, alleen `transform` en `opacity`.
 * Herkomst: eu-hosted.com (sectie "AI en MCP"). Eigen implementatie.
 *
 * @typedef {Object} VerbindingshubOpties
 * @property {number} [reisduur=950] ms voor één lijn (bron → hub of hub → doel).
 * @property {number} [rust=650] ms pauze tussen twee verbindingen.
 *
 * @param {Element} root `.vh` met daarin `.vh__vlak` > `.vh__groep[data-vh-kant="bron"]`, `.vh__hub`, `.vh__groep[data-vh-kant="doel"]`.
 * @param {VerbindingshubOpties} [opties]
 * @returns {() => void} destroy
 */
import { vereisRoot, minderBeweging, inBeeld, perFrame, zonderUndefined } from '../../_kwaliteit/basis.js';

const NS = 'http://www.w3.org/2000/svg';
const STANDAARD = { reisduur: 950, rust: 650 };
const HUB_WACHT = 260; // ms dat de stip "in" de hub is
const SPOOR = [0.035, 0.07, 0.105]; // achterstand van de drie spookstippen (fractie van de lijn)

let volgnummer = 0;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'verbindingshub')) return () => {};
  const o = { ...STANDAARD, ...zonderUndefined(opties) };
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const vlak = root.querySelector('.vh__vlak');
  const hub = root.querySelector('.vh__hub');
  const bronnen = Array.from(root.querySelectorAll('[data-vh-kant="bron"] .vh__knoop'));
  const doelen = Array.from(root.querySelectorAll('[data-vh-kant="doel"] .vh__knoop'));
  if (!vlak || !hub || !bronnen.length || !doelen.length) {
    console.warn('verbindingshub: .vh__vlak, .vh__hub of knopen ontbreken — overgeslagen');
    return () => {};
  }
  const tegelVan = (el) => el.querySelector('.vh__tegel') || el;
  const hubTegel = tegelVan(hub);

  // ── SVG opbouwen ──────────────────────────────────────────────────────────────────────
  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'vh__lijnen');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const defs = doc.createElementNS(NS, 'defs');
  const gradId = `vh-verloop-${++volgnummer}`;
  defs.innerHTML = `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color: var(--vh-licht-1)"/><stop offset="1" style="stop-color: var(--vh-licht-2)"/></linearGradient>`;
  svg.append(defs);
  const verloop = defs.firstChild;

  const maakLijn = (knoop, kant, i) => {
    const basis = doc.createElementNS(NS, 'path');
    basis.setAttribute('class', 'vh__lijn');
    const licht = doc.createElementNS(NS, 'path');
    licht.setAttribute('class', 'vh__lijn-licht');
    licht.setAttribute('stroke', `url(#${gradId})`);
    svg.append(basis, licht);
    return { knoop, kant, i, basis, licht, lengte: 0 };
  };
  const lijnen = [
    ...bronnen.map((k, i) => maakLijn(k, 'bron', i)),
    ...doelen.map((k, i) => maakLijn(k, 'doel', i)),
  ];
  const stip = doc.createElementNS(NS, 'g');
  stip.setAttribute('class', 'vh__stip');
  const spoken = SPOOR.map((_, n) => {
    const c = doc.createElementNS(NS, 'circle');
    c.setAttribute('r', String(3 - n * 0.6));
    c.setAttribute('class', 'vh__spook');
    c.style.opacity = String(0.5 - n * 0.14);
    stip.append(c);
    return c;
  });
  const kern = doc.createElementNS(NS, 'circle');
  kern.setAttribute('r', '3.5');
  kern.setAttribute('class', 'vh__kern');
  stip.append(kern);
  svg.append(stip);
  vlak.prepend(svg);
  root.classList.add('vh--actief');

  // ── geometrie ─────────────────────────────────────────────────────────────────────────
  function tekenLijnen() {
    const v = vlak.getBoundingClientRect();
    if (!v.width || !v.height) return;
    svg.setAttribute('viewBox', `0 0 ${v.width} ${v.height}`);
    svg.setAttribute('width', String(v.width));
    svg.setAttribute('height', String(v.height));
    const h = hubTegel.getBoundingClientRect();
    const hc = { x: h.left + h.width / 2 - v.left, y: h.top + h.height / 2 - v.top };
    // onderkant van de hub inclusief naam: lijnen naar beneden lopen niet door het label
    const hubOnder = hub.getBoundingClientRect().bottom - v.top + 4;
    for (const l of lijnen) {
      const r = tegelVan(l.knoop).getBoundingClientRect();
      const k = { x: r.left + r.width / 2 - v.left, y: r.top + r.height / 2 - v.top };
      const spreiding = (l.i - 1) * Math.min(10, h.height / 8);
      let a; let b; let d;
      if (Math.abs(hc.x - k.x) >= Math.abs(hc.y - k.y)) {
        const rechts = hc.x > k.x; // knoop links van de hub
        a = { x: k.x + (rechts ? r.width / 2 : -r.width / 2), y: k.y };
        b = { x: hc.x + (rechts ? -h.width / 2 : h.width / 2), y: hc.y + spreiding };
        const m = (a.x + b.x) / 2;
        d = [a, { x: m, y: a.y }, { x: m, y: b.y }, b];
      } else {
        const onder = hc.y > k.y; // knoop boven de hub
        a = { x: k.x, y: k.y + (onder ? r.height / 2 : -r.height / 2) };
        b = { x: hc.x + spreiding, y: onder ? hc.y - h.height / 2 : hubOnder };
        const m = (a.y + b.y) / 2;
        d = [a, { x: a.x, y: m }, { x: b.x, y: m }, b];
      }
      if (l.kant === 'doel') d.reverse(); // doel-lijnen lopen van de hub naar de knoop
      const f = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const pad = `M${f(d[0])}C${f(d[1])} ${f(d[2])} ${f(d[3])}`;
      l.basis.setAttribute('d', pad);
      l.licht.setAttribute('d', pad);
      l.lengte = l.basis.getTotalLength();
    }
    verloop.setAttribute('x1', '0');
    verloop.setAttribute('x2', String(v.width));
    tekenStip();
  }

  // ── tijdlijn ──────────────────────────────────────────────────────────────────────────
  const R = o.reisduur;
  const cyclus = R + HUB_WACHT + R + o.rust;
  let tijd = 0; // ms binnen de hele reeks (stijgt alleen als het loopt)
  let vorigeTs = 0;
  let raf = 0;
  let laatsteActief = '';
  let hubGepulst = -1;

  function stand(t) {
    const nr = Math.floor(t / cyclus);
    const bi = nr % bronnen.length;
    const di = (nr * 2 + 1) % doelen.length;
    const c = t - nr * cyclus;
    const bron = lijnen[bi];
    const doel = lijnen[bronnen.length + di];
    if (c < R) return { nr, lijn: bron, f: easeInOut(c / R), actief: [bron], zichtbaar: true };
    if (c < R + HUB_WACHT) return { nr, lijn: doel, f: 0, actief: [], zichtbaar: false, hub: true };
    if (c < 2 * R + HUB_WACHT) return { nr, lijn: doel, f: easeInOut((c - R - HUB_WACHT) / R), actief: [doel], zichtbaar: true };
    return { nr, lijn: doel, f: 1, actief: [doel], zichtbaar: false, klaar: true };
  }

  function punt(l, f) {
    const p = l.basis.getPointAtLength(Math.max(0, Math.min(1, f)) * l.lengte);
    return `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`;
  }

  function tekenStip() {
    const s = stand(tijd);
    if (!s.lijn.lengte) return;
    kern.setAttribute('transform', punt(s.lijn, s.f));
    SPOOR.forEach((achter, n) => spoken[n].setAttribute('transform', punt(s.lijn, s.f - achter)));
    stip.style.opacity = s.zichtbaar ? '1' : '0';
    if (voorwaarden.minder) return; // stil diagram: niets licht op
    // knopen en lichtlijnen: alleen bij wissel de klassen zetten
    const sleutel = `${s.actief.map((l) => `${l.kant}${l.i}`).join()}|${s.klaar ? 'k' : ''}`;
    if (sleutel !== laatsteActief) {
      laatsteActief = sleutel;
      for (const l of lijnen) {
        const aan = s.actief.includes(l);
        l.licht.classList.toggle('is-actief', aan);
        l.knoop.classList.toggle('is-actief', aan && (l.kant === 'bron' || !!s.klaar));
      }
    }
    if (s.hub && hubGepulst !== s.nr) {
      hubGepulst = s.nr;
      hub.classList.remove('is-ontvangt');
      void hub.offsetWidth; // klasse opnieuw laten starten
      hub.classList.add('is-ontvangt');
    }
  }

  function frame(ts) {
    raf = 0;
    if (!magLopen()) return;
    if (vorigeTs) tijd += Math.min(64, ts - vorigeTs); // na een hapering niet vooruit springen
    vorigeTs = ts;
    tekenStip();
    raf = win.requestAnimationFrame(frame);
  }

  // ── wanneer mag het lopen ─────────────────────────────────────────────────────────────
  const voorwaarden = {
    minder: false,
    buiten: true,
    verborgen: !!doc.hidden,
    gepauzeerd: doc.documentElement.getAttribute('data-motion') === 'paused',
  };
  const magLopen = () => !voorwaarden.minder && !voorwaarden.buiten && !voorwaarden.verborgen && !voorwaarden.gepauzeerd;

  function bijwerken() {
    const stil = voorwaarden.minder;
    root.setAttribute('data-vh', stil ? 'stil' : magLopen() ? 'loopt' : 'gepauzeerd');
    if (magLopen()) {
      if (!raf) { vorigeTs = 0; raf = win.requestAnimationFrame(frame); }
    } else if (raf) {
      win.cancelAnimationFrame(raf);
      raf = 0;
    }
    if (stil) {
      for (const l of lijnen) { l.licht.classList.remove('is-actief'); l.knoop.classList.remove('is-actief'); }
      hub.classList.remove('is-ontvangt');
      laatsteActief = '';
    }
  }

  const mb = minderBeweging((r) => { voorwaarden.minder = r; bijwerken(); }, doc);
  voorwaarden.minder = mb.reduced;
  const stopBeeld = inBeeld(vlak, () => { voorwaarden.buiten = false; bijwerken(); }, {
    once: false, rootMargin: '80px 0px', bijUit: () => { voorwaarden.buiten = true; bijwerken(); },
  });
  const opZicht = () => { voorwaarden.verborgen = !!doc.hidden; bijwerken(); };
  const opPauze = (e) => { voorwaarden.gepauzeerd = !!(e.detail && e.detail.gepauzeerd); bijwerken(); };
  doc.addEventListener('visibilitychange', opZicht);
  doc.addEventListener('beweging:pauze', opPauze);

  const herteken = perFrame(tekenLijnen, doc);
  const ro = win.ResizeObserver ? new win.ResizeObserver(() => herteken()) : null;
  if (ro) { ro.observe(vlak); ro.observe(hubTegel); for (const l of lijnen) ro.observe(l.knoop); }
  else win.addEventListener('resize', herteken);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (!weg) herteken(); });

  tekenLijnen();
  bijwerken();

  let weg = false;
  return function destroy() {
    if (weg) return;
    weg = true;
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
    herteken.cancel();
    mb.stop();
    stopBeeld();
    if (ro) ro.disconnect(); else win.removeEventListener('resize', herteken);
    doc.removeEventListener('visibilitychange', opZicht);
    doc.removeEventListener('beweging:pauze', opPauze);
    svg.remove();
    root.classList.remove('vh--actief');
    root.removeAttribute('data-vh');
    hub.classList.remove('is-ontvangt');
    for (const l of lijnen) l.knoop.classList.remove('is-actief');
  };
}
