/**
 * marquee
 * ------------------------------------------------------------------------
 * Eén marquee-motor met vier varianten (`giant`, `tilted`, `ticker`,
 * `logos`) — een oneindig doorlopende band tekst/iconen/logo's, met de
 * snelheid in px/s constant ongeacht de breedte van de inhoud. Vanilla
 * ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document` pas aan
 * binnen `init()`.
 *
 * Progressive enhancement (zelfde tweefasen-idee als reveal-on-scroll,
 * hier via één attribuut): zónder JS (of vóórdat `init()` heeft gedraaid)
 * toont de CSS de inhoud gewoon als een wrappende rij — alles leesbaar,
 * niets afgesneden. Pas zodra `init()` de kopieën heeft opgebouwd, zet de
 * module `data-marquee-ready` op de root; alleen dán schakelt de CSS naar
 * `overflow:hidden` + de lopende animatie (zie marquee.css). Bij "minder
 * beweging" haalt de module dat attribuut weer weg (en bouwt geen kopieën)
 * — dezelfde statische, wrappende weergave als zonder JS.
 *
 * Herkomst: eigen implementatie; het gedrag (reuzeletters, gekantelde band,
 * smalle topticker met fade-randen, logo-balk) is gezien bij meerdere
 * bureausites.
 *
 * @typedef {Object} MarqueeOptions
 * @property {'giant'|'tilted'|'ticker'|'logos'} [variant] Visuele variant. Standaard: attribuut `data-marquee-variant` op root, anders "ticker".
 * @property {number} [speed=80] Snelheid in pixels per seconde — blijft gelijk ongeacht de breedte van de inhoud.
 * @property {'left'|'right'} [direction='left']
 *
 * @param {Element} root Het `[data-marquee]`-element; moet een `[data-marquee-track]`-kind bevatten met de items als directe kinderen.
 * @param {MarqueeOptions} [options]
 * @returns {() => void} destroy — haalt kopieën, attributen, CSS-variabelen en listeners weg. Idempotent.
 */
import { minderBeweging, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'marquee')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const track = root.querySelector('[data-marquee-track]');
  if (!track) {
    if (typeof console !== 'undefined') {
      console.warn('marquee: init(root) kreeg geen [data-marquee-track] — overgeslagen');
    }
    return () => {};
  }

  const variant = options.variant || root.getAttribute('data-marquee-variant') || 'ticker';
  const direction = options.direction || root.getAttribute('data-marquee-direction') || 'left';
  const speed = Number(options.speed ?? root.getAttribute('data-marquee-speed') ?? 80) || 80;

  root.setAttribute('data-marquee-variant', variant);
  root.setAttribute('data-marquee-direction', direction);

  const originalChildren = Array.from(track.children);
  if (originalChildren.length === 0) return () => {};

  // Alle oorspronkelijke items in één "groep"-wrapper zodat we die als geheel
  // kunnen klonen — de lus schuift exact één groepbreedte op (zie CSS).
  const group = doc.createElement('div');
  group.setAttribute('data-marquee-group', '');
  for (const child of originalChildren) group.appendChild(child);
  track.appendChild(group);

  /** @type {Element[]} */
  const clones = [];
  let destroyed = false;
  let hovered = false;
  let focused = false;
  let intersecting = true;

  function clearClones() {
    for (const clone of clones) clone.remove();
    clones.length = 0;
  }

  // Bouwt genoeg gekloonde kopieën (aria-hidden) zodat de rij nooit een gat
  // toont — ook niet op het randmoment vlak vóór de lus opnieuw begint.
  function buildClones() {
    clearClones();
    const containerWidth = root.getBoundingClientRect().width || win.innerWidth;
    const groupWidth = group.getBoundingClientRect().width || 1;
    const needed = Math.max(2, Math.ceil((containerWidth + groupWidth) / groupWidth) + 1);
    for (let i = 1; i < needed; i += 1) {
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      clones.push(clone);
    }
    root.style.setProperty('--marquee-distance', `${groupWidth}px`);
    root.style.setProperty('--marquee-duration', `${speed > 0 ? groupWidth / speed : 0}s`);
  }

  function updatePauseState() {
    if (reduced) return;
    const paused = hovered || focused || !intersecting;
    track.style.animationPlayState = paused ? 'paused' : 'running';
  }

  function applyMode(isReduced) {
    reduced = isReduced;
    if (reduced) {
      clearClones();
      root.removeAttribute('data-marquee-ready');
      root.style.removeProperty('--marquee-distance');
      root.style.removeProperty('--marquee-duration');
      track.style.animationPlayState = '';
    } else {
      // Ready-attribuut eerst: buildClones() meet group.getBoundingClientRect(),
      // en de groep is alleen een echte (niet-wrappende) flex-eenheid zodra
      // [data-marquee-ready] staat (zie marquee.css) — zonder deze volgorde
      // meet je een display:contents-element (breedte 0).
      root.setAttribute('data-marquee-ready', '');
      buildClones();
      updatePauseState();
    }
  }

  const reduceHandle = minderBeweging(applyMode, doc);
  let reduced = reduceHandle.reduced;

  const onResize = perFrame(() => {
    if (!reduced) buildClones();
  }, doc);
  win.addEventListener('resize', onResize);

  function onEnter() { hovered = true; updatePauseState(); }
  function onLeave() { hovered = false; updatePauseState(); }
  function onFocusIn() { focused = true; updatePauseState(); }
  function onFocusOut() { focused = false; updatePauseState(); }
  root.addEventListener('mouseenter', onEnter);
  root.addEventListener('mouseleave', onLeave);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);

  const io = 'IntersectionObserver' in win
    ? new win.IntersectionObserver((entries) => {
        intersecting = entries[0]?.isIntersecting ?? true;
        updatePauseState();
      }, { threshold: 0 })
    : null;
  if (io) io.observe(root);

  applyMode(reduced);

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    reduceHandle.stop();
    if (io) io.disconnect();
    win.removeEventListener('resize', onResize);
    if (onResize.cancel) onResize.cancel();
    root.removeEventListener('mouseenter', onEnter);
    root.removeEventListener('mouseleave', onLeave);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    clearClones();
    for (const child of Array.from(group.children)) track.appendChild(child);
    group.remove();
    root.removeAttribute('data-marquee-ready');
    root.removeAttribute('data-marquee-variant');
    root.removeAttribute('data-marquee-direction');
    root.style.removeProperty('--marquee-distance');
    root.style.removeProperty('--marquee-duration');
    track.style.animationPlayState = '';
  };
}
