/**
 * flip-side-menu
 * ------------------------------------------------------------------------
 * Knop "MENU" klapt met een 3D-rotatie (rotateX) om naar "SLUIT"; het paneel
 * groeit vanuit de knop (transform: scale, transform-origin op de
 * knop-positie) en de menu-items klappen gestaffeld omhoog. Volledig
 * toetsenbord- en schermlezer-toegankelijk: focus-trap, Escape sluit, klik
 * buiten sluit, focus terug naar de knop, scroll-lock hersteld. Vanilla
 * ES-module, 0 dependencies, SSR-veilig: raakt window/document pas aan bij
 * `init()`.
 *
 * Herkomst: patroon gezien bij bureausites; eigen implementatie: het paneel groeit hier via
 * `transform: scale()` in plaats van via een herberekend `width`/`height`
 * op een `:before`-pseudo-element, zodat alleen `transform`/`opacity`
 * animeren (R18) en de focus-trap/`inert`-afhandeling is volledig nieuw
 * (de MDW-snippet regelt geen focus-trap of Escape).
 *
 * @typedef {Object} FlipSideMenuOptions
 * (geen opties nodig — gedrag volgt uit de markup, zie README)
 *
 * @param {Element} root Element met daarin `[data-fsm-button]` en `[data-fsm-panel]`.
 * @returns {() => void} destroy — sluit het menu, herstelt scroll/aria/inert en haalt listeners weg. Idempotent.
 */
export function init(root) {
  if (!root || typeof root.querySelector !== 'function') {
    if (typeof console !== 'undefined') console.warn('flip-side-menu: init(root) kreeg geen element — overgeslagen');
    return () => {};
  }

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const button = root.querySelector('[data-fsm-button]');
  const panel = root.querySelector('[data-fsm-panel]');
  if (!button || !panel) {
    console.warn('flip-side-menu: [data-fsm-button] of [data-fsm-panel] ontbreekt — overgeslagen');
    return () => {};
  }

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const items = Array.from(panel.querySelectorAll('[data-fsm-item]'));
  items.forEach((el, i) => el.style.setProperty('--fsm-index', String(i)));

  // Scrim (achtergrond-verduistering) achter het paneel: het paneel is een
  // zijpaneel, geen volledig-scherm-overlay — de scrim is wat een klik
  // "buiten het paneel" betekenisvol maakt (en sluit zelf ook bij klik).
  const scrim = doc.createElement('div');
  scrim.className = 'fsm__scrim';
  scrim.setAttribute('aria-hidden', 'true');
  root.insertBefore(scrim, panel);

  let open = false;
  let lastFocused = null;
  let prevOverflow = '';

  button.setAttribute('aria-expanded', 'false');
  panel.setAttribute('aria-hidden', 'true');
  panel.inert = true;

  function computeOrigin() {
    const r = button.getBoundingClientRect();
    const ox = ((r.left + r.width / 2) / win.innerWidth) * 100;
    const oy = ((r.top + r.height / 2) / win.innerHeight) * 100;
    panel.style.setProperty('--fsm-ox', `${ox}%`);
    panel.style.setProperty('--fsm-oy', `${oy}%`);
  }

  let openFocusTimer = 0;

  function openMenu() {
    if (open) return;
    open = true;
    lastFocused = doc.activeElement;
    computeOrigin();
    root.setAttribute('data-fsm-open', '');
    button.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('aria-hidden');
    panel.inert = false;
    prevOverflow = doc.documentElement.style.overflow;
    doc.documentElement.style.overflow = 'hidden';
    doc.addEventListener('keydown', onKeydown, true);
    doc.addEventListener('pointerdown', onPointerDown, true);
    openFocusTimer = win.setTimeout(() => {
      openFocusTimer = 0;
      const first = panel.querySelector(FOCUSABLE);
      if (first) first.focus();
    }, 260);
  }

  function closeMenu(opts) {
    const restoreFocus = !opts || opts.restoreFocus !== false;
    if (!open) return;
    open = false;
    if (openFocusTimer) { win.clearTimeout(openFocusTimer); openFocusTimer = 0; }
    root.removeAttribute('data-fsm-open');
    button.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    doc.documentElement.style.overflow = prevOverflow;
    doc.removeEventListener('keydown', onKeydown, true);
    doc.removeEventListener('pointerdown', onPointerDown, true);
    if (restoreFocus) {
      const target = lastFocused && doc.contains(lastFocused) ? lastFocused : button;
      target.focus();
    }
  }

  function onToggleClick() {
    if (open) closeMenu();
    else openMenu();
  }
  button.addEventListener('click', onToggleClick);

  function onKeydown(e) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    // G10: de SLUIT-knop (`button`) zit buiten `panel` in de DOM, dus
    // hoorde niet bij `panel.querySelectorAll(FOCUSABLE)` — de focusval
    // rondde daardoor alleen over de links en sloot de knop zelf uit. De
    // knop hoort er wél bij (hij is het enige zichtbare sluit-element naast
    // Escape/klik-buiten), dus hij staat vooraan in de vallijst: zo wrapt
    // Shift+Tab vanaf de eerste link terug naar de knop, en Tab vanaf de
    // laatste link weer naar de knop.
    const focusables = [button, ...panel.querySelectorAll(FOCUSABLE)];
    if (focusables.length === 0) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && doc.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && doc.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onPointerDown(e) {
    if (!open) return;
    if (panel.contains(e.target) || button.contains(e.target)) return;
    closeMenu();
  }

  function onPanelClick(e) {
    const a = e.target.closest ? e.target.closest('a[href]') : null;
    if (a) closeMenu({ restoreFocus: false });
  }
  panel.addEventListener('click', onPanelClick);

  const onResize = () => { if (open) computeOrigin(); };
  win.addEventListener('resize', onResize, { passive: true });

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (open) closeMenu({ restoreFocus: false });
    button.removeEventListener('click', onToggleClick);
    panel.removeEventListener('click', onPanelClick);
    win.removeEventListener('resize', onResize);
    doc.removeEventListener('keydown', onKeydown, true);
    doc.removeEventListener('pointerdown', onPointerDown, true);
    doc.documentElement.style.overflow = prevOverflow;
    // Bewust géén aria-hidden/inert weghalen: closeMenu() zette het paneel
    // al terug naar de gesloten staat (hidden + inert) — dat blijft ook na
    // destroy() de juiste eindstand, anders staat er een onzichtbaar maar
    // wél focusbaar/aan-schermlezers-getoond paneel in de DOM.
    panel.style.removeProperty('--fsm-ox');
    panel.style.removeProperty('--fsm-oy');
    for (const el of items) el.style.removeProperty('--fsm-index');
    scrim.remove();
    root.removeAttribute('data-fsm-open');
    button.removeAttribute('aria-expanded');
  };
}
