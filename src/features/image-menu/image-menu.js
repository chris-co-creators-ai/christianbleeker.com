/**
 * image-menu
 * ------------------------------------------------------------------------
 * Fullscreen beeldmenu: links de menu-items, rechts een beeld. Hoveren
 * (muis) én focussen (toetsenbord) van een item wisselt zowel het beeld als
 * de achtergrondkleur van het hele paneel — beide via data-attributen op de
 * link, geen hardcoded lijst. Beelden worden vooraf geladen zodra het menu
 * voor het eerst opent, zodat de eerste wissel niet op een netwerkverzoek
 * hoeft te wachten. Ankerlinks sluiten het menu. Vanilla ES-module,
 * 0 dependencies, SSR-veilig: raakt window/document pas aan bij `init()`.
 *
 * Herkomst: eigen implementatie; patroon gezien bij meerdere bureausites
 * (een fullscreen beeldmenu dat bij hover met jQuery de kleur van een
 * spacer-widget op het menu zet). Hier staat de kleur/afbeelding
 * gewoon als `data-im-image`/`data-im-color` op de link zelf (geen
 * index-matching tussen twee aparte widget-bomen nodig), de achtergrond-
 * wissel gebeurt via opacity-crossfade tussen vooraf aangemaakte
 * kleurlagen (R18: alleen transform/opacity animeren — geen
 * `background-color`-transitie) en er is een volledige focus-trap +
 * Escape + backdrop-klik toegevoegd.
 *
 * @param {Element} root Element met daarin `[data-im-button]` en `[data-im-panel]`.
 * @returns {() => void} destroy — sluit het menu, ruimt kleurlagen/listeners op, herstelt aria/inert/scroll. Idempotent.
 */
export function init(root) {
  if (!root || typeof root.querySelector !== 'function') {
    if (typeof console !== 'undefined') console.warn('image-menu: init(root) kreeg geen element — overgeslagen');
    return () => {};
  }

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const button = root.querySelector('[data-im-button]');
  const panel = root.querySelector('[data-im-panel]');
  const list = root.querySelector('[data-im-list]');
  const visual = root.querySelector('[data-im-visual]');
  const img = visual ? visual.querySelector('img') : null;
  if (!button || !panel || !list || !visual || !img) {
    console.warn('image-menu: [data-im-button], [data-im-panel], [data-im-list], [data-im-visual] of de <img> erin ontbreekt — overgeslagen');
    return () => {};
  }

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const links = Array.from(list.querySelectorAll('a[data-im-image]'));

  // Eén kleurlaag per link, achter de content, gecrossfade via opacity
  // (R18: geen background-color-transitie). Ingevoegd in dezelfde volgorde
  // als `links` (elke laag ná de vorige, de eerste vooraan in het paneel).
  let lastLayer = null;
  const layers = links.map((link) => {
    const layer = doc.createElement('div');
    layer.className = 'im__bg-layer';
    layer.style.backgroundColor = link.getAttribute('data-im-color') || '';
    if (lastLayer) lastLayer.after(layer);
    else panel.prepend(layer);
    lastLayer = layer;
    return layer;
  });

  let activeIndex = links.findIndex((l) => l.getAttribute('aria-current') === 'page');
  if (activeIndex < 0) activeIndex = 0;

  let imagesPreloaded = false;
  function preloadImages() {
    if (imagesPreloaded) return;
    imagesPreloaded = true;
    for (const link of links) {
      const src = link.getAttribute('data-im-image');
      if (!src) continue;
      const pre = new win.Image();
      pre.src = src;
    }
  }

  function setActive(index) {
    if (index < 0 || index >= links.length) return;
    activeIndex = index;
    const link = links[index];
    const src = link.getAttribute('data-im-image');
    if (src && img.src !== new win.URL(src, doc.baseURI).href) img.src = src;
    img.alt = link.getAttribute('data-im-alt') || '';
    layers.forEach((layer, i) => layer.classList.toggle('is-active', i === index));
  }
  setActive(activeIndex);

  function onLinkFocusOrHover(e) {
    const a = e.target.closest ? e.target.closest('a[data-im-image]') : null;
    if (!a) return;
    setActive(links.indexOf(a));
  }
  list.addEventListener('pointerover', onLinkFocusOrHover);
  list.addEventListener('focusin', onLinkFocusOrHover);

  function onListLeave() {
    const current = links.findIndex((l) => l.getAttribute('aria-current') === 'page');
    setActive(current >= 0 ? current : 0);
  }
  list.addEventListener('mouseleave', onListLeave);
  function onListFocusOut(e) {
    if (list.contains(e.relatedTarget)) return;
    onListLeave();
  }
  list.addEventListener('focusout', onListFocusOut);

  function onListClick(e) {
    const a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    for (const l of links) l.removeAttribute('aria-current');
    a.setAttribute('aria-current', 'page');
    closeMenu({ restoreFocus: false });
  }
  list.addEventListener('click', onListClick);

  let open = false;
  let lastFocused = null;
  let prevOverflow = '';
  let openFocusTimer = 0;

  button.setAttribute('aria-expanded', 'false');
  panel.setAttribute('aria-hidden', 'true');
  panel.inert = true;

  function openMenu() {
    if (open) return;
    open = true;
    lastFocused = doc.activeElement;
    preloadImages();
    root.setAttribute('data-im-open', '');
    button.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('aria-hidden');
    panel.inert = false;
    prevOverflow = doc.documentElement.style.overflow;
    doc.documentElement.style.overflow = 'hidden';
    doc.addEventListener('keydown', onKeydown, true);
    openFocusTimer = win.setTimeout(() => {
      openFocusTimer = 0;
      const first = list.querySelector(FOCUSABLE);
      if (first) first.focus();
    }, 260);
  }

  function closeMenu(opts) {
    const restoreFocus = !opts || opts.restoreFocus !== false;
    if (!open) return;
    open = false;
    if (openFocusTimer) { win.clearTimeout(openFocusTimer); openFocusTimer = 0; }
    root.removeAttribute('data-im-open');
    button.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    doc.documentElement.style.overflow = prevOverflow;
    doc.removeEventListener('keydown', onKeydown, true);
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
    // De sluitknop (`button`) zit buiten `panel` in de DOM, dus hoorde
    // niet bij `panel.querySelectorAll(FOCUSABLE)` — de focusval rondde
    // daardoor alleen over de menu-links en sloot de knop zelf uit. Hij
    // staat daarom vooraan in de vallijst: Shift+Tab vanaf de eerste link
    // wrapt terug naar de knop, en Tab vanaf de laatste link weer naar de
    // knop.
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

  // Klik op de padding/backdrop van het paneel zelf (niet op de content)
  // sluit het menu — dat is hier "klik buiten", ook al is het paneel
  // fullscreen.
  function onPanelClick(e) {
    if (e.target === panel) closeMenu();
  }
  panel.addEventListener('click', onPanelClick);

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (open) closeMenu({ restoreFocus: false });
    button.removeEventListener('click', onToggleClick);
    panel.removeEventListener('click', onPanelClick);
    list.removeEventListener('pointerover', onLinkFocusOrHover);
    list.removeEventListener('focusin', onLinkFocusOrHover);
    list.removeEventListener('mouseleave', onListLeave);
    list.removeEventListener('focusout', onListFocusOut);
    list.removeEventListener('click', onListClick);
    doc.removeEventListener('keydown', onKeydown, true);
    doc.documentElement.style.overflow = prevOverflow;
    for (const layer of layers) layer.remove();
    root.removeAttribute('data-im-open');
    button.removeAttribute('aria-expanded');
  };
}
