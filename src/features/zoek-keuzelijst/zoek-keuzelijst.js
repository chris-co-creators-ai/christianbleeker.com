/**
 * zoek-keuzelijst
 * ------------------------------------------------------------------------
 * Een doorzoekbare keuzelijst (combobox, WAI-ARIA-patroon "editable combobox
 * with list autocomplete") bovenop een gewone <select>. Zonder JavaScript
 * blijft het die select; met JavaScript komt er een invoerveld met een lijst
 * voor in de plaats. De waarde gaat gewoon mee met het formulier via de
 * oorspronkelijke select (die blijft in de DOM, alleen visueel weg).
 *
 * - zoekt zonder accenten en hoofdletters, ook op synoniemen
 *   (`data-synoniemen="kapper, kapster"` op de <option>)
 * - <optgroup> wordt een groep met kopje
 * - een optie met `data-anders` ("Staat er niet tussen") toont een vrij
 *   invulveld, dat als `<selectnaam>_anders` meegaat
 * - <select multiple> geeft chips
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt window/document pas
 * aan binnen init/vulSelect).
 *
 * Eigen implementatie.
 *
 * @typedef {Object} ZoekKeuzelijstOpties
 * @property {string} [placeholder] Tekst in het lege veld. Standaard: tekst van de lege <option value="">, anders "Typ om te zoeken".
 * @property {string} [andersNaam] Veldnaam van het vrije invulveld. Standaard `<selectnaam>_anders`.
 * @property {string} [andersLabel="Vul zelf in"] Label boven het vrije invulveld.
 * @property {Object} [teksten] Alle vaste teksten, overschrijfbaar (bv. voor Engels).
 *
 * @param {Element} root Container met daarin de <select> (en het label).
 * @param {ZoekKeuzelijstOpties} [opties]
 * @returns {() => void} destroy — zet de originele select terug. Idempotent.
 */
import { vereisRoot, isTouch, zonderUndefined } from '../../_kwaliteit/basis.js';

const TEKSTEN = {
  placeholder: 'Typ om te zoeken',
  resultaten: (n) => (n === 1 ? '1 resultaat' : `${n} resultaten`),
  geen: 'Geen resultaten. Kies "Staat er niet tussen" om zelf iets in te vullen.',
  geenLijst: 'Geen resultaten',
  verwijder: (l) => `Verwijder ${l}`,
  verplicht: 'Kies een optie uit de lijst.',
  via: (s) => `via ${s}`,
  toggle: 'Toon alle opties',
  kiesUitLijst: 'Kies een optie uit de lijst om je keuze vast te leggen.',
};

let teller = 0;

/** Zonder accenten en hoofdletters, spaties opgeschoond. */
export function normaliseer(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Vul een <select> met de meegeleverde lijst (`beroepen.json`) als groepen.
 * @param {HTMLSelectElement} select
 * @param {{groepen: {naam: string, beroepen: {naam: string, synoniemen?: string[]}[]}[]}} data
 * @param {{ placeholder?: string, anders?: string }} [opt]
 */
export function vulSelect(select, data, opt = {}) {
  const doc = select.ownerDocument;
  const win = doc.defaultView;
  const maak = (naam, syn) => {
    const o = doc.createElement('option');
    o.value = normaliseer(naam).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    o.textContent = naam;
    if (syn && syn.length) o.setAttribute('data-synoniemen', syn.join(', '));
    return o;
  };
  select.textContent = '';
  if (opt.placeholder !== undefined) {
    const p = doc.createElement('option');
    p.value = ''; p.textContent = opt.placeholder; select.appendChild(p);
  }
  for (const g of data.groepen) {
    const og = doc.createElement('optgroup');
    og.label = g.naam;
    for (const b of g.beroepen) og.appendChild(maak(b.naam, b.synoniemen));
    select.appendChild(og);
  }
  if (opt.anders) {
    const a = doc.createElement('option');
    a.value = 'anders'; a.textContent = opt.anders; a.setAttribute('data-anders', '');
    select.appendChild(a);
  }
  return select;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'zoek-keuzelijst')) return () => {};
  const select = root.matches && root.matches('select') ? root : root.querySelector('select');
  if (!select) {
    console.warn('zoek-keuzelijst: geen <select> in root — overgeslagen');
    return () => {};
  }
  if (select.hasAttribute('data-zk-select')) return () => {}; // al geïnitialiseerd
  const host = select === root ? select.parentNode : root;
  const doc = select.ownerDocument;
  const win = doc.defaultView;
  const T = { ...TEKSTEN, ...zonderUndefined(opties.teksten) };
  const meer = select.multiple;
  const nr = ++teller;
  const id = (s) => `zk${nr}-${s}`;
  const ac = new AbortController();
  const opts = { signal: ac.signal };
  const el = (tag, klasse, attrs = {}) => {
    const e = doc.createElement(tag);
    if (klasse) e.className = klasse;
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };

  // ---- 1. opties uit de select lezen ---------------------------------
  const items = [];
  let placeholderOptie = null;
  const leesOptie = (o, groepEl) => {
    if (o.value === '' && !o.hasAttribute('data-anders')) { placeholderOptie = o; return; }
    const syn = (o.getAttribute('data-synoniemen') || '').split(',').map((s) => s.trim()).filter(Boolean);
    items.push({
      opt: o, label: o.textContent.trim(), zoek: normaliseer(o.textContent),
      syn: syn.map((s) => ({ tekst: s, n: normaliseer(s) })),
      anders: o.hasAttribute('data-anders'), groep: groepEl, score: 0, via: '', zichtbaar: true, el: null,
    });
  };
  const groepen = [];
  for (const kind of select.children) {
    if (kind.tagName === 'OPTGROUP') {
      const g = { label: kind.label, el: null, kop: null };
      groepen.push(g);
      for (const o of kind.children) if (o.tagName === 'OPTION') leesOptie(o, g);
    } else if (kind.tagName === 'OPTION') leesOptie(kind, null);
  }
  const andersItem = items.find((i) => i.anders) || null;

  // ---- 2. DOM opbouwen -------------------------------------------------
  const origineel = {
    klasse: select.className, tabindex: select.getAttribute('tabindex'),
    ariaHidden: select.getAttribute('aria-hidden'),
  };
  select.setAttribute('data-zk-select', '');
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');
  root.setAttribute('data-zk-actief', '');

  const label = (select.id && doc.querySelector(`label[for="${CSS.escape(select.id)}"]`)) || select.closest('label');
  const origineleFor = label ? label.getAttribute('for') : null;

  const wrap = el('div', 'zk');
  const veld = el('div', 'zk__veld');
  const chipsEl = el('span', 'zk__chips');
  const input = el('input', 'zk__input', {
    type: 'text', role: 'combobox', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    'aria-expanded': 'false', 'aria-controls': id('lijst'), 'aria-autocomplete': 'list', 'aria-haspopup': 'listbox',
    id: id('input'), enterkeyhint: 'done',
  });
  input.placeholder = opties.placeholder ?? (placeholderOptie && placeholderOptie.textContent.trim()) ?? T.placeholder;
  if (!input.placeholder) input.placeholder = T.placeholder;
  const knop = el('button', 'zk__toggle', { type: 'button', tabindex: '-1', 'aria-hidden': 'true' });
  knop.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const lijst = el('div', 'zk__lijst', { role: 'listbox', id: id('lijst'), tabindex: '-1' });
  if (meer) lijst.setAttribute('aria-multiselectable', 'true');
  if (label) {
    if (!label.id) { label.id = id('label'); label.setAttribute('data-zk-id', ''); }
    lijst.setAttribute('aria-labelledby', label.id);
    label.setAttribute('for', input.id);
  } else if (select.getAttribute('aria-label')) {
    input.setAttribute('aria-label', select.getAttribute('aria-label'));
    lijst.setAttribute('aria-label', select.getAttribute('aria-label'));
  }
  const live = el('div', 'zk__live', { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const fout = el('p', 'zk__fout', { id: id('fout') });
  fout.hidden = true;

  for (const g of groepen) {
    g.kop = el('div', 'zk__kop', { id: id(`g${groepen.indexOf(g)}`), role: 'presentation' });
    g.kop.textContent = g.label;
    g.el = el('div', 'zk__groep', { role: 'group', 'aria-labelledby': g.kop.id });
    g.el.appendChild(g.kop);
    lijst.appendChild(g.el);
  }
  items.forEach((it, i) => {
    const o = el('div', 'zk__optie', { role: 'option', id: id(`o${i}`), 'aria-selected': 'false' });
    const t = el('span', 'zk__tekst'); t.textContent = it.label;
    const via = el('span', 'zk__via'); via.hidden = true;
    o.append(t, via, el('span', 'zk__vink', { 'aria-hidden': 'true' }));
    if (it.anders) o.classList.add('zk__optie--anders');
    it.el = o; it.viaEl = via;
    (it.groep ? it.groep.el : lijst).appendChild(o);
  });
  // "Staat er niet tussen" staat altijd onderaan, ook als hij in de select in het midden staat.
  if (andersItem) lijst.appendChild(andersItem.el);
  const geenEl = el('div', 'zk__geen', { 'aria-hidden': 'true' }); geenEl.textContent = T.geenLijst; geenEl.hidden = true;
  lijst.insertBefore(geenEl, andersItem ? andersItem.el : null);

  veld.append(chipsEl, input, knop);
  wrap.append(veld, lijst, live, fout);
  select.insertAdjacentElement('afterend', wrap);
  input.setAttribute('aria-describedby', fout.id);

  // vrij invulveld
  let andersWrap = null; let andersInput = null;
  if (andersItem) {
    andersWrap = el('div', 'zk__anders'); andersWrap.hidden = true;
    const l = el('label', 'zk__anders-label', { for: id('anders') });
    l.textContent = opties.andersLabel || 'Vul zelf in';
    andersInput = el('input', 'zk__anders-input', {
      type: 'text', id: id('anders'), name: opties.andersNaam || `${select.name || 'keuze'}_anders`,
      autocomplete: 'off', maxlength: '120',
    });
    andersInput.disabled = true;
    andersWrap.append(l, andersInput);
    wrap.insertAdjacentElement('afterend', andersWrap);
  }
  if (select.disabled) input.disabled = true;

  // ---- 3. toestand -------------------------------------------------------
  let open = false; let actief = -1; let getypt = false; let zichtbaar = [];

  const meld = (tekst) => { live.textContent = tekst; };
  const tel = () => zichtbaar.filter((i) => !i.anders).length;

  function filter() {
    const tokens = getypt ? normaliseer(input.value).split(' ').filter(Boolean) : [];
    let besteScore = Infinity; let beste = -1;
    zichtbaar = [];
    for (const it of items) {
      let score = 0; let via = ''; let ok = true;
      if (it.anders) { it.score = 99; it.via = ''; }
      else {
        for (const tok of tokens) {
          if (it.zoek.startsWith(tok)) score += 0;
          else if (` ${it.zoek}`.includes(` ${tok}`)) score += 1;
          else if (it.zoek.includes(tok)) score += 2;
          else {
            const s = it.syn.find((x) => x.n.includes(tok));
            if (s) { score += 3; via = via || s.tekst; } else { ok = false; break; }
          }
        }
        it.score = ok ? score : Infinity; it.via = ok ? via : '';
      }
      it.zichtbaar = it.anders || ok;
      it.el.hidden = !it.zichtbaar;
      it.viaEl.hidden = !it.via; it.viaEl.textContent = it.via ? T.via(it.via) : '';
      if (it.zichtbaar) {
        zichtbaar.push(it);
        if (!it.anders && it.score < besteScore) { besteScore = it.score; beste = zichtbaar.length - 1; }
      }
    }
    for (const g of groepen) g.el.hidden = !items.some((i) => i.groep === g && i.zichtbaar);
    const n = tel();
    geenEl.hidden = n !== 0;
    return { n, beste };
  }

  function zetActief(i, scroll = true) {
    if (actief >= 0 && zichtbaar[actief]) zichtbaar[actief].el.classList.remove('is-actief');
    const it = zichtbaar[i];
    actief = it ? i : -1; // geldt voor elke toets: buiten de lijst is er niets actief
    if (it) {
      it.el.classList.add('is-actief');
      input.setAttribute('aria-activedescendant', it.el.id);
      if (scroll) {
        const t = it.el.offsetTop; const b = t + it.el.offsetHeight;
        if (t < lijst.scrollTop + 4) lijst.scrollTop = Math.max(0, t - 4);
        else if (b > lijst.scrollTop + lijst.clientHeight) lijst.scrollTop = b - lijst.clientHeight + 4;
      }
    } else input.removeAttribute('aria-activedescendant');
  }

  // Touch met schermtoetsenbord: de lijst past zich aan de ruimte boven het toetsenbord aan (visualViewport).
  function pasLijstAan() {
    const vv = win.visualViewport;
    if (!open || !vv || !isTouch(doc)) { lijst.style.maxHeight = ''; return; }
    const ruimte = () => vv.height - (veld.getBoundingClientRect().bottom - vv.offsetTop) - 24;
    if (ruimte() < 240) {
      veld.scrollIntoView({ block: 'start' });
    }
    lijst.style.maxHeight = `${Math.max(120, Math.min(320, ruimte()))}px`;
  }

  function toon(kiesEerste) {
    // Heropenen met een bestaande, niet-gekozen tekst (bv. na de hint): meteen daarop filteren.
    if (!open && input.value && (meer || !gekozen().length || normaliseer(input.value) !== normaliseer(gekozen()[0].label))) getypt = true;
    const { n, beste } = filter();
    if (!open) {
      open = true;
      lijst.setAttribute('data-open', ''); input.setAttribute('aria-expanded', 'true'); wrap.setAttribute('data-open', '');
    }
    lijst.scrollTop = 0;
    let i = kiesEerste ? (getypt && beste >= 0 ? beste : 0) : (getypt && beste >= 0 ? beste : -1);
    if (i >= zichtbaar.length) i = -1; // geen zichtbare opties: niets actief, Enter doet dan niets
    zetActief(i);
    pasLijstAan();
    meld(n === 0 ? (andersItem ? T.geen : T.geenLijst) : T.resultaten(n));
  }

  function sluit(herstel = true) {
    if (open) {
      open = false;
      lijst.removeAttribute('data-open'); wrap.removeAttribute('data-open');
      input.setAttribute('aria-expanded', 'false');
    }
    zetActief(-1);
    getypt = false;
    if (herstel) schrijfTekst();
  }

  const gekozen = () => items.filter((i) => i.opt.selected && !(i.opt.value === '' && !i.anders));

  function schrijfTekst() {
    if (meer) { input.value = ''; return; }
    const g = gekozen()[0];
    input.value = g ? g.label : '';
  }

  function sync() {
    const sel = gekozen();
    for (const it of items) {
      const aan = sel.includes(it);
      it.el.setAttribute('aria-selected', aan ? 'true' : 'false');
    }
    if (meer) {
      chipsEl.textContent = '';
      for (const it of sel) {
        const c = el('span', 'zk__chip');
        const t = el('span', 'zk__chip-tekst'); t.textContent = it.label;
        const x = el('button', 'zk__chip-x', { type: 'button', 'aria-label': T.verwijder(it.label) });
        x.innerHTML = '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 2.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
        x.addEventListener('click', () => { it.opt.selected = false; melding(); sync(); input.focus(); });
        c.append(t, x); chipsEl.appendChild(c);
      }
      input.placeholder = sel.length ? '' : (opties.placeholder ?? T.placeholder);
    } else if (!getypt) schrijfTekst();
    if (andersItem) {
      const aan = sel.includes(andersItem);
      andersWrap.hidden = !aan; andersInput.disabled = !aan;
      andersInput.required = aan && select.required;
      if (!aan) andersInput.value = '';
    }
    if (sel.length) { fout.hidden = true; input.removeAttribute('aria-invalid'); }
  }

  function melding() {
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function kies(it) {
    const getypteTekst = getypt ? input.value.trim() : '';
    if (meer) {
      it.opt.selected = !it.opt.selected;
      input.value = ''; getypt = false;
      sync(); melding(); toon(false);
      zetActief(zichtbaar.indexOf(it));
    } else {
      it.opt.selected = true;
      getypt = false; sync(); melding(); sluit(false);
    }
    if (it.anders && it.opt.selected) {
      if (getypteTekst && !andersInput.value) andersInput.value = getypteTekst.slice(0, 120);
      andersInput.focus();
    }
  }

  function wis() {
    if (placeholderOptie) placeholderOptie.selected = true; else select.selectedIndex = -1;
    sync(); melding();
  }

  // ---- 4. events --------------------------------------------------------
  input.addEventListener('input', () => {
    getypt = true;
    if (fout.hidden === false && !input.hasAttribute('aria-invalid')) fout.hidden = true;
    if (!meer && input.value === '' && gekozen().length) wis();
    toon(true);
  }, opts);

  input.addEventListener('click', () => { if (!open) toon(false); }, opts);
  knop.addEventListener('mousedown', (e) => e.preventDefault(), opts);
  knop.addEventListener('click', () => { if (open) sluit(); else { input.focus(); toon(false); } }, opts);

  input.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowDown') {
      e.preventDefault();
      if (!open) toon(true); else zetActief(Math.min(actief + 1, zichtbaar.length - 1));
    } else if (k === 'ArrowUp') {
      e.preventDefault();
      if (!open) { toon(false); zetActief(zichtbaar.length - 1); } else zetActief(Math.max(actief - 1, 0));
    } else if ((k === 'PageDown' || k === 'PageUp') && open) {
      e.preventDefault(); zetActief(Math.max(0, Math.min(zichtbaar.length - 1, (actief < 0 ? 0 : actief) + (k === 'PageDown' ? 10 : -10))));
    } else if (k === 'Home' && open) {
      e.preventDefault(); zetActief(0);
    } else if (k === 'End' && open) {
      e.preventDefault(); zetActief(zichtbaar.length - 1);
    } else if (k === 'Enter') {
      // Zolang de lijst open is verstuurt Enter nooit het formulier (ook niet zonder treffers: dan ging het getypte woord verloren).
      if (open) { e.preventDefault(); if (zichtbaar[actief]) kies(zichtbaar[actief]); }
    } else if (k === 'Escape') {
      if (open) { e.preventDefault(); e.stopPropagation(); sluit(); }
    } else if (k === 'Backspace' && meer && input.value === '') {
      const g = gekozen();
      if (g.length) { g[g.length - 1].opt.selected = false; sync(); melding(); }
    }
  }, opts);

  // muis/touch op de lijst: focus blijft in het invoerveld
  lijst.addEventListener('mousedown', (e) => e.preventDefault(), opts);
  lijst.addEventListener('click', (e) => {
    const o = e.target.closest('.zk__optie');
    const it = o && items.find((i) => i.el === o);
    if (it) kies(it);
  }, opts);
  lijst.addEventListener('pointermove', (e) => {
    const o = e.target.closest && e.target.closest('.zk__optie');
    const i = o ? zichtbaar.findIndex((z) => z.el === o) : -1;
    if (i >= 0 && i !== actief && e.pointerType === 'mouse') zetActief(i, false);
  }, opts);

  if (win.visualViewport) win.visualViewport.addEventListener('resize', pasLijstAan, opts);

  // Weggaan met een getypte tekst: een exacte naam wordt gekozen; anders blijft wat je typte staan, met een hint.
  function bijBlur() {
    const tekst = normaliseer(input.value);
    if (getypt && tekst) {
      const exact = items.filter((i) => !i.anders && i.zoek === tekst);
      if (exact.length === 1) {
        exact[0].opt.selected = true;
        input.value = ''; getypt = false; sync(); melding(); sluit(false);
        if (!meer) schrijfTekst();
        return;
      }
      if (meer || !gekozen().length) {
        sluit(false);
        fout.textContent = T.kiesUitLijst; fout.hidden = false;
        return;
      }
    }
    sluit();
  }
  wrap.addEventListener('focusout', (e) => {
    if (!wrap.contains(e.relatedTarget)) bijBlur();
  }, opts);

  select.addEventListener('invalid', (e) => {
    e.preventDefault();
    fout.textContent = T.verplicht; fout.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }, opts);

  const form = select.form;
  if (form) form.addEventListener('reset', () => setTimeout(() => { getypt = false; sync(); schrijfTekst(); }, 0), opts);

  sync();

  // ---- 5. opruimen ------------------------------------------------------
  let weg = false;
  return function destroy() {
    if (weg) return; weg = true;
    ac.abort();
    wrap.remove();
    if (andersWrap) andersWrap.remove();
    select.removeAttribute('data-zk-select');
    root.removeAttribute('data-zk-actief');
    origineel.tabindex === null ? select.removeAttribute('tabindex') : select.setAttribute('tabindex', origineel.tabindex);
    origineel.ariaHidden === null ? select.removeAttribute('aria-hidden') : select.setAttribute('aria-hidden', origineel.ariaHidden);
    if (label) {
      origineleFor === null ? label.removeAttribute('for') : label.setAttribute('for', origineleFor);
      if (label.hasAttribute('data-zk-id')) { label.removeAttribute('id'); label.removeAttribute('data-zk-id'); }
    }
  };
}
