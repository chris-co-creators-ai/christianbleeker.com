/**
 * pill-nav
 * ------------------------------------------------------------------------
 * Zwevende, volledig afgeronde navigatiebalk met glaseffect (backdrop-filter
 * + solide fallback-achtergrond voor browsers zonder support). Een pilvormige
 * indicator schuift onder het actieve item; optioneel verbergt de balk bij
 * omlaag scrollen en verschijnt hij weer bij omhoog scrollen. Vanilla
 * ES-module, 0 dependencies, SSR-veilig: raakt window/document pas aan bij
 * `init()`.
 *
 * Herkomst: positie + glasvorm gezien bij Dave Herder (webstijn.nl-klant,
 * pil-navigatie met blur, border-radius 1000px) en de cyaan actief-indicator
 * bij Stomerij Barneveld (`.elementor-item-active:after` met dezelfde
 * pil-vorm). Eigen implementatie, geen code overgenomen.
 *
 * @typedef {Object} PillNavOptions
 * @property {'top'|'bottom'} [position="bottom"] Waar de balk zweeft.
 * @property {boolean} [hideOnScroll=false] Verberg bij omlaag scrollen, toon bij omhoog scrollen.
 * @property {number} [hideThreshold=24] Vanaf hoeveel px scroll-vanaf-top het verbergen mag beginnen.
 *
 * @param {Element} root Element met daarin `[data-pn-list]` (de link-lijst).
 * @param {PillNavOptions} [options]
 * @returns {() => void} destroy — ruimt indicator, listeners en attributen op. Idempotent.
 */
import { perFrame } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!root || typeof root.querySelector !== 'function') {
    if (typeof console !== 'undefined') console.warn('pill-nav: init(root) kreeg geen element — overgeslagen');
    return () => {};
  }

  const { position = 'bottom', hideOnScroll = false, hideThreshold = 24 } = options;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const list = root.querySelector('[data-pn-list]');
  if (!list) {
    console.warn('pill-nav: geen [data-pn-list] gevonden — overgeslagen');
    return () => {};
  }
  const links = Array.from(list.querySelectorAll('a'));
  if (links.length === 0) return () => {};

  root.setAttribute('data-pn-position', position);

  if (!links.some((a) => a.getAttribute('aria-current') === 'page')) {
    links[0].setAttribute('aria-current', 'page');
  }

  // Indicator zit in een eigen <li aria-hidden> (display:contents, dus geen
  // eigen layout-box) zodat [data-pn-list] een echte <ul><li><a> mag zijn
  // zonder ongeldige HTML (H6: role="listitem" op de <a> zelf overschreef
  // eerder de link-rol voor schermlezers — dat is nu een echt lijst-item).
  const indicatorItem = doc.createElement('li');
  indicatorItem.className = 'pn__indicator-item';
  indicatorItem.setAttribute('aria-hidden', 'true');
  const indicator = doc.createElement('span');
  indicator.className = 'pn__indicator';
  indicatorItem.appendChild(indicator);
  list.appendChild(indicatorItem);

  function positionIndicator() {
    const active = list.querySelector('a[aria-current="page"]') || links[0];
    const listRect = list.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    indicator.style.width = `${rect.width}px`;
    indicator.style.transform = `translateX(${rect.left - listRect.left}px)`;
  }

  // Eerste positionering zonder transition (anders schuift de indicator
  // zichtbaar vanaf 0 naar zijn plek bij het laden).
  indicator.style.transition = 'none';
  positionIndicator();
  let raf1 = win.requestAnimationFrame
    ? win.requestAnimationFrame(() => { raf1 = 0; indicator.style.transition = ''; })
    : (indicator.style.transition = '', 0);

  function onClick(e) {
    const a = e.target.closest ? e.target.closest('a') : null;
    if (!a || !list.contains(a)) return;
    for (const l of links) l.removeAttribute('aria-current');
    a.setAttribute('aria-current', 'page');
    positionIndicator();
  }
  list.addEventListener('click', onClick);

  const onResizeThrottled = perFrame(() => { positionIndicator(); updateScrollFade(); }, doc);
  win.addEventListener('resize', onResizeThrottled, { passive: true });

  // G16: op mobiel is [data-pn-list] intern horizontaal scrollbaar
  // (overflow-x:auto), maar zonder signaal oogde een halverwege afgekapte
  // link ("Projec…") alsof hij onder de CTA verdween. Een randfade toont nu
  // dat er meer te scrollen valt — alleen aan de kant waar dat ook zo is.
  function updateScrollFade() {
    const max = list.scrollWidth - list.clientWidth;
    const kanNaarEind = max > 1 && list.scrollLeft < max - 1;
    const kanNaarBegin = list.scrollLeft > 1;
    list.classList.toggle('pn__list--fade-end', kanNaarEind);
    list.classList.toggle('pn__list--fade-start', kanNaarBegin);
  }
  updateScrollFade();
  const onListScrollThrottled = perFrame(() => updateScrollFade(), doc);
  list.addEventListener('scroll', onListScrollThrottled, { passive: true });

  let onScrollThrottled = null;
  if (hideOnScroll) {
    let lastY = win.scrollY || 0;
    let hidden = false;
    onScrollThrottled = perFrame(() => {
      const y = win.scrollY || 0;
      const diff = y - lastY;
      if (Math.abs(diff) < 4) return;
      if (diff > 0 && y > hideThreshold) {
        if (!hidden) { hidden = true; root.setAttribute('data-pn-hidden', ''); }
      } else if (hidden) {
        hidden = false; root.removeAttribute('data-pn-hidden');
      }
      lastY = y;
    }, doc);
    win.addEventListener('scroll', onScrollThrottled, { passive: true });
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (raf1 && win.cancelAnimationFrame) win.cancelAnimationFrame(raf1);
    onResizeThrottled.cancel();
    list.removeEventListener('click', onClick);
    win.removeEventListener('resize', onResizeThrottled);
    if (onScrollThrottled) {
      onScrollThrottled.cancel();
      win.removeEventListener('scroll', onScrollThrottled);
    }
    onListScrollThrottled.cancel();
    list.removeEventListener('scroll', onListScrollThrottled);
    list.classList.remove('pn__list--fade-end', 'pn__list--fade-start');
    indicatorItem.remove();
    root.removeAttribute('data-pn-position');
    root.removeAttribute('data-pn-hidden');
  };
}
