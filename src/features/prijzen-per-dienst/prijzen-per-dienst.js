/**
 * prijzen-per-dienst
 * ------------------------------------------------------------------------
 * Open prijzen per dienst (They Ask, You Answer): tabs per dienst, per tab
 * 1-4 pakketten als kaarten met "vanaf"-prijs, doorlooptijd, wat het
 * oplevert, wat erin zit en een CTA; eronder een eigen FAQ en een regel
 * "Liever iets op maat?". Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * Herkomst: patroon gezien op Brandfabric (/tarieven, 24-09-2026): tabs per
 * dienst, kaarten die licht kantelen. Eigen implementatie.
 *
 * Zonder JS staan alle diensten onder elkaar, elk met een kop. JS bouwt de
 * tablist (WAI-ARIA tabs), verbergt de andere panelen, zet de actieve tab in
 * de URL-hash, formatteert prijzen in NL-notatie en vult de CTA-links met
 * `?dienst=…&pakket=…`.
 *
 * @typedef {Object} PrijzenPerDienstOptions
 * @property {'auto'|'handmatig'} [activatie='auto'] auto: pijltjes activeren meteen; handmatig: pijltjes verplaatsen alleen de focus, Enter/Spatie activeert.
 * @property {boolean} [hash=true] Actieve tab in de URL-hash (`#dienst-<id>`) en openen vanuit de hash.
 * @property {string} [hashVoorvoegsel='dienst-'] Voorvoegsel van de hash.
 * @property {number} [kanteling=3] Maximale kanteling van een kaart in graden onder een fijne muis (0 = uit; begrensd op 3).
 * @property {string} [paramDienst='dienst'] Naam van de URL-parameter voor de dienst in CTA-links.
 * @property {string} [paramPakket='pakket'] Naam van de URL-parameter voor het pakket.
 * @property {string} [tablijstLabel='Kies een dienst'] aria-label van de tablist.
 *
 * @param {Element} root Container met `[data-ppd-paneel]`-elementen (data-dienst, data-titel).
 * @param {PrijzenPerDienstOptions} [options]
 * @returns {() => void} destroy — idempotent.
 */
import { vereisRoot, minderBeweging, isTouch, perFrame } from '../../_kwaliteit/basis.js';

/** 2400 -> "€ 2.400" (NL-notatie, vaste spatie). */
export function formatEuro(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '';
  return `€ ${new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(x)}`;
}

let teller = 0;

export function init(root, options = {}) {
  if (!vereisRoot(root, 'prijzen-per-dienst')) return () => {};
  const {
    activatie = 'auto', hash = true, hashVoorvoegsel = 'dienst-', kanteling = 3,
    paramDienst = 'dienst', paramPakket = 'pakket', tablijstLabel = 'Kies een dienst',
  } = options;
  const panelen = [...root.querySelectorAll('[data-ppd-paneel]')];
  if (!panelen.length) { console.warn('prijzen-per-dienst: geen [data-ppd-paneel] gevonden — overgeslagen'); return () => {}; }

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const uid = `ppd${++teller}`;
  const maxGraden = Math.min(Math.max(Number(kanteling) || 0, 0), 3);
  const opruim = [];
  let klaar = false;

  // --- prijzen (één bron: data-prijs) en CTA-links (één bron: data-dienst/-pakket)
  for (const el of root.querySelectorAll('[data-prijs]')) {
    const oud = el.textContent; const f = formatEuro(el.getAttribute('data-prijs'));
    if (f) { el.textContent = f; opruim.push(() => { el.textContent = oud; }); }
  }
  for (const a of root.querySelectorAll('[data-ppd-cta]')) {
    const oud = a.getAttribute('href');
    const paneel = a.closest('[data-ppd-paneel]');
    const pakket = (a.closest('[data-ppd-pakket]') || a).getAttribute(a.closest('[data-ppd-pakket]') ? 'data-ppd-pakket' : 'data-pakket');
    if (oud == null || !paneel) continue;
    const [zonderHash, ...h] = oud.split('#');
    const [basis, q = ''] = zonderHash.split('?');
    const sp = new URLSearchParams(q);
    sp.set(paramDienst, paneel.getAttribute('data-dienst') || '');
    if (pakket) sp.set(paramPakket, pakket);
    a.setAttribute('href', `${basis}?${sp}${h.length ? `#${h.join('#')}` : ''}`);
    opruim.push(() => a.setAttribute('href', oud));
  }

  // --- tablist
  root.setAttribute('data-ppd-actief', '');
  const lijst = doc.createElement('div');
  lijst.className = 'ppd__tabs';
  lijst.setAttribute('role', 'tablist');
  lijst.setAttribute('aria-label', tablijstLabel);
  lijst.setAttribute('data-ppd-tablijst', '');
  panelen[0].parentNode.insertBefore(lijst, panelen[0]);

  const oudIds = new Map();
  const tabs = panelen.map((p, i) => {
    const id = p.getAttribute('data-dienst') || String(i);
    const kop = p.querySelector('[data-ppd-paneelkop]');
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'ppd__tab';
    b.id = `${uid}-tab-${id}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', `${uid}-paneel-${id}`);
    b.textContent = p.getAttribute('data-titel') || (kop && kop.textContent.trim()) || id;
    lijst.appendChild(b);
    oudIds.set(p, p.getAttribute('id'));
    p.id = `${uid}-paneel-${id}`;
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', b.id);
    b._id = id;
    return b;
  });

  function kies(i, { focus = false, schrijfHash = true } = {}) {
    tabs.forEach((t, k) => {
      const aan = k === i;
      t.setAttribute('aria-selected', aan ? 'true' : 'false');
      t.tabIndex = aan ? 0 : -1;
      panelen[k].hidden = !aan;
    });
    const t = tabs[i];
    if (lijst.scrollWidth > lijst.clientWidth) {
      lijst.scrollLeft = t.offsetLeft - (lijst.clientWidth - t.offsetWidth) / 2;
    }
    if (focus) t.focus();
    if (hash && schrijfHash) {
      try { win.history.replaceState(null, '', `#${hashVoorvoegsel}${t._id}`); } catch { /* ponytail: sandbox-iframe zonder history */ }
    }
  }
  const uitHash = () => {
    if (!hash) return -1;
    const h = decodeURIComponent(win.location.hash.replace(/^#/, ''));
    return h.startsWith(hashVoorvoegsel) ? tabs.findIndex((t) => t._id === h.slice(hashVoorvoegsel.length)) : -1;
  };
  const huidig = () => tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');

  const bijKlik = (e) => { const i = tabs.indexOf(e.target.closest('[role=tab]')); if (i >= 0) kies(i); };
  const bijToets = (e) => {
    const n = tabs.length; const f = tabs.indexOf(doc.activeElement);
    if (f < 0) return;
    const doel = { ArrowRight: (f + 1) % n, ArrowLeft: (f - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (doel !== undefined) {
      e.preventDefault();
      if (activatie === 'auto') kies(doel, { focus: true });
      else { tabs.forEach((t, k) => { t.tabIndex = k === doel ? 0 : -1; }); tabs[doel].focus(); }
    } else if (activatie === 'handmatig' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); kies(f);
    }
  };
  const bijHash = () => { const i = uitHash(); if (i >= 0 && i !== huidig()) kies(i, { schrijfHash: false }); };
  lijst.addEventListener('click', bijKlik);
  lijst.addEventListener('keydown', bijToets);
  if (hash) win.addEventListener('hashchange', bijHash);
  kies(Math.max(uitHash(), 0), { schrijfHash: false });

  // --- kanteling: alleen fijne muis en niet bij minder beweging (R1, R3, R18)
  let stil = false;
  const mb = minderBeweging((r) => { stil = r; if (r) reset(); }, doc);
  stil = mb.reduced;
  const raakt = maxGraden > 0 && !isTouch(doc);
  const kaarten = [...root.querySelectorAll('[data-ppd-pakket]')];
  function reset() { for (const k of kaarten) { k.style.transform = ''; k.removeAttribute('data-ppd-kantel'); } }
  const zet = perFrame((k, e) => {
    if (stil) return;
    const r = k.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    k.setAttribute('data-ppd-kantel', '');
    k.style.transform = `perspective(900px) rotateX(${(-y * 2 * maxGraden).toFixed(2)}deg) rotateY(${(x * 2 * maxGraden).toFixed(2)}deg)`;
  }, doc);
  const bijBeweeg = (e) => { if (e.pointerType === 'mouse' && !stil) { const k = e.currentTarget; zet(k, e); } };
  const bijWeg = (e) => { zet.cancel(); e.currentTarget.style.transform = ''; e.currentTarget.removeAttribute('data-ppd-kantel'); };
  if (raakt) {
    for (const k of kaarten) { k.addEventListener('pointermove', bijBeweeg, { passive: true }); k.addEventListener('pointerleave', bijWeg); }
  }

  klaar = true;
  return function destroy() {
    if (!klaar) return;
    klaar = false;
    lijst.removeEventListener('click', bijKlik);
    lijst.removeEventListener('keydown', bijToets);
    win.removeEventListener('hashchange', bijHash);
    mb.stop(); zet.cancel();
    for (const k of kaarten) { k.removeEventListener('pointermove', bijBeweeg); k.removeEventListener('pointerleave', bijWeg); }
    reset();
    lijst.remove();
    for (const p of panelen) { p.hidden = false; p.removeAttribute('role'); p.removeAttribute('aria-labelledby'); oudIds.get(p) == null ? p.removeAttribute('id') : p.setAttribute('id', oudIds.get(p)); }
    root.removeAttribute('data-ppd-actief');
    opruim.forEach((f) => f());
  };
}
