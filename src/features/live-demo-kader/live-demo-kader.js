/**
 * live-demo-kader
 * ------------------------------------------------------------------------
 * Een kader (browservenster met adresbalk, of app-venster) waarin een
 * klikbare demo draait met voorbeelddata. Het onderdeel levert het kader en
 * de spelregels, niet de app zelf:
 *
 *  - links met `data-demo-naar="<scherm>"` wisselen tussen `[data-demo-scherm]`
 *    zonder de pagina te verlaten; eigen terug/vooruit-geschiedenis (de
 *    browsergeschiedenis blijft onaangeroerd: geen pushState, geen hash)
 *  - adresbalk toont het "pad", de actieve zijbalklink krijgt aria-current
 *  - een markering "Voorbeeld met verzonnen gegevens" is altijd zichtbaar
 *  - echte externe links verlaten het kader; alle andere acties (formulieren,
 *    knoppen, interne links) doen niets echts en geven een zachte melding
 *  - breed genoeg: het kader schaalt als geheel (transform, gereserveerde
 *    hoogte). Te smal: schermafbeelding + knop "Open de demo" (fullscreen-dialoog
 *    waarin de echte demo op volle breedte draait)
 *
 * Inspiratie: Co-Creators.ai draait de echte app met voorbeelddata in de
 * marketingpagina (gedrag gezien, code is van ons).
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt window pas in init).
 *
 * @typedef {Object} LiveDemoKaderOptions
 * @property {'browser'|'app'} [type='browser'] Vensterstijl (of `data-demo-type`).
 * @property {string} [start] Scherm waarmee de demo begint (of `data-demo-start`). Standaard het eerste.
 * @property {string} [adresBasis] Host vóór het pad in de adresbalk (of `data-demo-adres-basis`).
 * @property {string} [poster] Schermafbeelding voor de smalle terugval (of `data-demo-poster`).
 * @property {number} [minBreedte=720] Onder deze breedte (px) de terugval i.p.v. schalen.
 * @property {number} [minSchaalTouch=0.85] Op touch schaalt het kader alleen als de schaal hierboven blijft (tekst en tikdoelen blijven bruikbaar); anders de terugval.
 * @property {number} [ontwerpBreedte=1120] Breedte (px) waarop de demo is ontworpen.
 * @property {number} [ontwerpHoogte=680] Hoogte (px) waarop de demo is ontworpen.
 * @property {string} [meldingTekst='In de demo wordt niets opgeslagen']
 * @property {number} [meldingDuur=3500] Milliseconden zichtbaar.
 * @property {(scherm: string, pad: string) => void} [onWissel] Callback bij elke schermwissel (ook als DOM-event `demo:wissel` op root).
 *
 * @param {Element} root Het element met `[data-demo-kader]` (zie README voor het markup-contract).
 * @param {LiveDemoKaderOptions} [opties]
 * @returns {() => void} destroy: ruimt alles op, idempotent.
 */
import { vereisRoot, perFrame, isTouch } from '../../_kwaliteit/basis.js';

const MARKERING = 'Voorbeeld met verzonnen gegevens';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'live-demo-kader')) return () => {};
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const venster = root.querySelector('[data-demo-venster]');
  const vak = root.querySelector('[data-demo-vak]');
  const schermen = [...root.querySelectorAll('[data-demo-scherm]')];
  if (!venster || !vak || !schermen.length) {
    console.warn('live-demo-kader: [data-demo-venster], [data-demo-vak] of [data-demo-scherm] ontbreekt — overgeslagen');
    return () => {};
  }
  if (root.hasAttribute('data-ldk-actief')) {
    console.warn('live-demo-kader: root is al geïnitialiseerd — overgeslagen');
    return () => {};
  }

  const d = root.dataset;
  const num = (v, standaard) => (Number.isFinite(+v) && +v > 0 ? +v : standaard);
  const o = {
    type: opties.type ?? d.demoType ?? 'browser',
    start: opties.start ?? d.demoStart,
    adresBasis: opties.adresBasis ?? d.demoAdresBasis ?? '',
    poster: opties.poster ?? d.demoPoster ?? '',
    minBreedte: num(opties.minBreedte ?? d.demoMinBreedte, 720),
    minSchaalTouch: num(opties.minSchaalTouch, 0.85),
    bw: num(opties.ontwerpBreedte, 1120),
    bh: num(opties.ontwerpHoogte, 680),
    tekst: opties.meldingTekst ?? 'In de demo wordt niets opgeslagen',
    duur: num(opties.meldingDuur, 3500),
    onWissel: opties.onWissel,
    // christianbleeker v2: teksten als optie (een echte klantsite is geen demo)
    openTekst: opties.openTekst ?? 'Open de demo',
    sluitTekst: opties.sluitTekst ?? 'Sluit de demo',
    posterAlt: opties.posterAlt ?? 'Schermafbeelding van de demo',
  };

  // --- onthoud beginstaat voor destroy --------------------------------
  const oorspronkelijkType = root.getAttribute('data-demo-type');
  const adresEl = root.querySelector('[data-demo-adres]');
  const adresOrigineel = adresEl ? adresEl.textContent : '';
  const terugEl = root.querySelector('[data-demo-terug]');
  const vooruitEl = root.querySelector('[data-demo-vooruit]');
  const pijlOrigineel = [terugEl, vooruitEl].map((b) => b && b.getAttribute('aria-disabled'));
  const nav = root.querySelector('[data-demo-nav]');
  const toegevoegd = []; // elementen die wij maakten
  const eigenTabindex = []; // elementen waar wij tabindex=-1 zetten
  let klaar = false;

  root.setAttribute('data-demo-type', o.type);
  root.style.setProperty('--ldk-bw', `${o.bw}px`);
  root.style.setProperty('--ldk-bh', `${o.bh}px`);
  root.style.setProperty('--ldk-ratio', `${o.bw} / ${o.bh}`);

  // --- markering (R8: altijd zichtbaar; ontbreekt hij, dan zetten wij hem) --
  if (!root.querySelector('[data-demo-markering]')) {
    const kop = doc.createElement('div');
    kop.className = 'ldk-kop';
    kop.innerHTML = `<p class="ldk-markering" data-demo-markering></p>`;
    kop.firstChild.textContent = MARKERING;
    vak.before(kop);
    toegevoegd.push(kop);
  }
  const markering = root.querySelector('[data-demo-markering]');

  // --- overslaanlink (R21) ------------------------------------------------
  let skip = root.querySelector('.ldk-skip');
  if (!skip) {
    skip = doc.createElement('a');
    skip.className = 'ldk-skip';
    skip.textContent = 'Sla de demo over';
    const doel = doc.createElement('span');
    doel.id = `ldk-na-${Math.random().toString(36).slice(2, 8)}`; // alleen een id, geen getal in de UI
    skip.href = `#${doel.id}`;
    root.prepend(skip);
    root.after(doel);
    toegevoegd.push(skip, doel);
  }
  const onSkip = (e) => {
    const id = (skip.getAttribute('href') || '').slice(1);
    const doel = id && doc.getElementById(id);
    if (!doel) return;
    e.preventDefault(); // geen hash-wijziging: browsergeschiedenis blijft schoon
    if (!doel.hasAttribute('tabindex')) { doel.setAttribute('tabindex', '-1'); eigenTabindex.push(doel); }
    doel.focus();
  };
  skip.addEventListener('click', onSkip);

  // --- melding (aria-live) ------------------------------------------------
  let meld = root.querySelector('[data-demo-melding]');
  if (!meld) {
    meld = doc.createElement('div');
    meld.className = 'ldk-melding';
    meld.setAttribute('data-demo-melding', '');
    vak.append(meld);
    toegevoegd.push(meld);
  }
  meld.setAttribute('role', 'status');
  meld.setAttribute('aria-live', 'polite');
  meld.setAttribute('aria-atomic', 'true');
  let t1 = 0; let t2 = 0; let t3 = 0;
  // Klem de melding op het zichtbare deel van het vak, zodat hij altijd in beeld is (ook als het kader half buiten het scherm staat).
  function plaatsMelding() {
    const r = vak.getBoundingClientRect();
    const zichtBoven = Math.max(r.top, 0);
    const zichtOnder = Math.min(r.bottom, win.innerHeight);
    const h = meld.offsetHeight;
    const top = Math.max(zichtBoven - r.top + 8, zichtOnder - r.top - h - 16);
    meld.style.top = `${Math.round(top)}px`;
    meld.style.bottom = 'auto';
  }
  function melding() {
    win.clearTimeout(t1); win.clearTimeout(t2); win.clearTimeout(t3);
    const toon = () => {
      meld.textContent = o.tekst;
      plaatsMelding();
      meld.setAttribute('data-open', '');
      t2 = win.setTimeout(() => {
        meld.removeAttribute('data-open');
        t3 = win.setTimeout(() => { meld.textContent = ''; }, 260);
      }, o.duur);
    };
    if (meld.textContent) { meld.textContent = ''; t1 = win.setTimeout(toon, 60); } // opnieuw voorlezen
    else toon();
  }

  // --- schermen + eigen geschiedenis --------------------------------------
  const perNaam = new Map(schermen.map((s) => [s.dataset.demoScherm, s]));
  const heading = (s) => (s.dataset.demoTitel || (s.querySelector('h1,h2,h3')?.textContent ?? s.dataset.demoScherm)).trim();
  const padVan = (s) => s.dataset.demoPad || `/${s.dataset.demoScherm}`;
  const startNaam = perNaam.has(o.start) ? o.start : schermen[0].dataset.demoScherm;
  let stack = [startNaam];
  let i = 0;
  const navLinks = nav ? [...nav.querySelectorAll('[data-demo-naar]')] : [];

  function toon(vanLink) {
    const naam = stack[i];
    const actief = perNaam.get(naam);
    for (const s of schermen) s.hidden = s !== actief;
    for (const a of navLinks) {
      if (a.dataset.demoNaar === naam) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    if (adresEl) {
      if (o.type === 'app') adresEl.textContent = heading(actief);
      else { // host en pad los: op smal blijft alleen het pad staan (CSS), zodat de wissel zichtbaar blijft
        const host = doc.createElement('span'); host.className = 'ldk-host'; host.textContent = o.adresBasis;
        const pad = doc.createElement('span'); pad.className = 'ldk-pad'; pad.textContent = padVan(actief);
        adresEl.replaceChildren(host, pad);
      }
    }
    if (terugEl) terugEl.setAttribute('aria-disabled', String(i === 0));
    if (vooruitEl) vooruitEl.setAttribute('aria-disabled', String(i === stack.length - 1));
    root.setAttribute('data-ldk-scherm', naam);
    const bak = actief.closest('.ldk-schermen');
    if (bak) bak.scrollTop = 0;
    if (vanLink) {
      if (!actief.hasAttribute('tabindex')) { actief.setAttribute('tabindex', '-1'); eigenTabindex.push(actief); }
      actief.focus({ preventScroll: true });
    }
  }
  function ga(naam, vanLink) {
    if (!perNaam.has(naam)) { console.warn(`live-demo-kader: onbekend scherm "${naam}"`); return; }
    if (naam === stack[i]) return;
    stack = stack.slice(0, i + 1);
    stack.push(naam);
    i += 1;
    root.setAttribute('data-ldk-beweegt', '');
    toon(vanLink);
    wissel(naam);
  }
  function stap(n) {
    const j = i + n;
    if (j < 0 || j >= stack.length) return;
    i = j;
    root.setAttribute('data-ldk-beweegt', '');
    toon(false);
    wissel(stack[i]);
  }
  function wissel(naam) {
    const pad = padVan(perNaam.get(naam));
    root.dispatchEvent(new win.CustomEvent('demo:wissel', { detail: { scherm: naam, pad } }));
    if (o.onWissel) o.onWissel(naam, pad);
  }

  // --- klikken en versturen ----------------------------------------------
  const isExtern = (a) => {
    if (a.hasAttribute('data-demo-extern')) return true;
    try {
      const u = new URL(a.href, doc.baseURI);
      if (u.protocol === 'mailto:' || u.protocol === 'tel:') return true;
      return /^https?:$/.test(u.protocol) && u.origin !== win.location.origin;
    } catch { return false; }
  };
  const onClick = (e) => {
    const t = e.target && e.target.closest ? e.target : null;
    if (!t || !venster.contains(t)) return;
    const pijl = t.closest('[data-demo-terug],[data-demo-vooruit]');
    if (pijl) {
      e.preventDefault();
      if (pijl.getAttribute('aria-disabled') !== 'true') stap(pijl.hasAttribute('data-demo-terug') ? -1 : 1);
      return;
    }
    const naar = t.closest('[data-demo-naar]');
    if (naar) { e.preventDefault(); ga(naar.dataset.demoNaar, true); return; }
    const a = t.closest('a[href]');
    if (a) { if (!isExtern(a)) { e.preventDefault(); melding(); } return; }
    if (t.closest('button, input[type=submit], input[type=button], input[type=reset], input[type=image], [role=button]')) {
      e.preventDefault(); melding();
    }
  };
  const onSubmit = (e) => {
    if (e.target && venster.contains(e.target)) { e.preventDefault(); melding(); }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);

  // --- terugval: teaser + dialoog voor smalle schermen --------------------
  const teaser = doc.createElement('div');
  teaser.className = 'ldk-teaser';
  teaser.hidden = true;
  if (o.poster) {
    const img = doc.createElement('img');
    img.className = 'ldk-teaser__beeld';
    img.src = o.poster;
    img.alt = o.posterAlt;
    img.width = o.bw; img.height = o.bh;
    img.loading = 'lazy'; img.decoding = 'async';
    teaser.append(img);
  }
  const openKnop = doc.createElement('button');
  openKnop.type = 'button';
  openKnop.className = 'ldk-knop';
  openKnop.textContent = o.openTekst;
  teaser.append(openKnop);
  vak.after(teaser);

  const dialoog = doc.createElement('dialog');
  dialoog.className = 'ldk-dialoog';
  dialoog.setAttribute('aria-label', venster.getAttribute('aria-label') || 'Demo');
  const dKop = doc.createElement('div');
  dKop.className = 'ldk-dialoog__kop';
  const kopie = markering.cloneNode(true);
  kopie.removeAttribute('data-demo-markering');
  kopie.setAttribute('data-ldk-markering-kopie', '');
  const sluit = doc.createElement('button');
  sluit.type = 'button';
  sluit.className = 'ldk-knop ldk-knop--stil';
  sluit.textContent = o.sluitTekst;
  dKop.append(kopie, sluit);
  const plek = doc.createElement('div');
  plek.className = 'ldk-dialoog__inhoud';
  dialoog.append(dKop, plek);
  root.append(dialoog);

  let placeholder = null; let opener = null; let kaderModus = null;
  const inDialoog = () => !!placeholder;
  function herstel() {
    if (!placeholder) return;
    placeholder.replaceWith(vak);
    placeholder = null;
    vak.removeAttribute('data-ldk-dialoog');
    vak.hidden = kaderModus !== true;
  }
  function openDialoog() {
    if (inDialoog()) return;
    opener = doc.activeElement;
    placeholder = doc.createComment('ldk-vak');
    vak.replaceWith(placeholder);
    vak.hidden = false;
    vak.setAttribute('data-ldk-dialoog', '');
    plek.append(vak);
    if (dialoog.showModal) dialoog.showModal(); else dialoog.setAttribute('open', '');
  }
  const onDialoogDicht = () => {
    herstel();
    kaderModus = null;
    pas(); // de vensterbreedte kan intussen veranderd zijn (draaien)
    const knopZichtbaar = opener && opener.isConnected && opener.getClientRects().length > 0;
    if (knopZichtbaar) opener.focus();
    else { // knop is verdwenen (nu geschaald kader): focus naar het huidige scherm, nooit naar BODY
      const scherm = perNaam.get(stack[i]);
      if (!scherm.hasAttribute('tabindex')) { scherm.setAttribute('tabindex', '-1'); eigenTabindex.push(scherm); }
      scherm.focus({ preventScroll: true });
    }
    opener = null;
  };
  const onOpenKlik = () => openDialoog();
  const onSluitKlik = () => { if (dialoog.close) dialoog.close(); else { dialoog.removeAttribute('open'); onDialoogDicht(); } };
  openKnop.addEventListener('click', onOpenKlik);
  sluit.addEventListener('click', onSluitKlik);
  dialoog.addEventListener('close', onDialoogDicht);

  // --- schalen of terugval -------------------------------------------------
  function pas() {
    const w = root.clientWidth;
    if (!w || dialoog.open) return; // een open dialoog blijft open, ook bij draaien of resizen
    const drempel = isTouch(doc) ? Math.max(o.minBreedte, o.bw * o.minSchaalTouch) : o.minBreedte;
    const kader = w >= drempel;
    root.style.setProperty('--ldk-s', String(kader ? Math.min(1, w / o.bw) : 1));
    if (kader === kaderModus) return;
    kaderModus = kader;
    root.setAttribute('data-ldk-modus', kader ? 'kader' : 'teaser');
    teaser.hidden = kader;
    if (!inDialoog()) vak.hidden = !kader;
  }
  const opNieuwPassen = perFrame(pas, doc);
  const ro = win.ResizeObserver ? new win.ResizeObserver(opNieuwPassen) : null;
  if (ro) ro.observe(root); else win.addEventListener('resize', opNieuwPassen, { passive: true });

  root.setAttribute('data-ldk-actief', '');
  toon(false);
  pas();

  // --- destroy --------------------------------------------------------------
  return function destroy() {
    if (klaar) return;
    klaar = true;
    win.clearTimeout(t1); win.clearTimeout(t2); win.clearTimeout(t3);
    opNieuwPassen.cancel();
    if (ro) ro.disconnect(); else win.removeEventListener('resize', opNieuwPassen);
    root.removeEventListener('click', onClick);
    root.removeEventListener('submit', onSubmit);
    skip.removeEventListener('click', onSkip);
    openKnop.removeEventListener('click', onOpenKlik);
    sluit.removeEventListener('click', onSluitKlik);
    dialoog.removeEventListener('close', onDialoogDicht);
    if (dialoog.open && dialoog.close) dialoog.close();
    herstel();
    vak.hidden = false;
    vak.removeAttribute('hidden');
    teaser.remove();
    dialoog.remove();
    for (const el of toegevoegd) el.remove();
    for (const s of schermen) { s.removeAttribute('hidden'); }
    for (const el of eigenTabindex) el.removeAttribute('tabindex');
    for (const a of navLinks) a.removeAttribute('aria-current');
    if (adresEl) adresEl.textContent = adresOrigineel;
    [terugEl, vooruitEl].forEach((b, n) => {
      if (!b) return;
      if (pijlOrigineel[n] == null) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', pijlOrigineel[n]);
    });
    if (meld.isConnected) { meld.textContent = ''; meld.removeAttribute('data-open'); meld.style.removeProperty('top'); meld.style.removeProperty('bottom'); if (!meld.getAttribute('style')) meld.removeAttribute('style'); }
    if (oorspronkelijkType == null) root.removeAttribute('data-demo-type'); else root.setAttribute('data-demo-type', oorspronkelijkType);
    for (const a of ['data-ldk-actief', 'data-ldk-modus', 'data-ldk-scherm', 'data-ldk-beweegt']) root.removeAttribute(a);
    for (const p of ['--ldk-bw', '--ldk-bh', '--ldk-ratio', '--ldk-s']) root.style.removeProperty(p);
    if (!root.getAttribute('style')) root.removeAttribute('style');
  };
}
