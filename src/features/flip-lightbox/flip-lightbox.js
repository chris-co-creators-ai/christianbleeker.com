/**
 * media/flip-lightbox
 * ------------------------------------------------------------------------
 * Galerij van foto-/video-tegels die bij klikken met een FLIP-animatie
 * (First → Last → Invert → Play, via getBoundingClientRect()) vloeiend
 * opengaan naar een <dialog> op volledig scherm, en op dezelfde manier weer
 * terugvliegen naar de tegel bij het sluiten. Werkt ook als galerij: pijltjes
 * / swipe / vorige-volgende-knoppen, teller "3 / 12". Vanilla ES-module,
 * 0 dependencies, SSR-veilig: raakt window/document pas aan binnen init().
 *
 * Herkomst: eigen implementatie; patroon gezien bij meerdere bureausites.
 * getBoundingClientRect() voor de start-transform en cubic-bezier(.22,1,.36,1)
 * als easing zijn als vertrekpunt genomen. Uitgebreid met een echte galerij
 * (vorige/volgende, swipe, teller), toetsenbord-focus-trap en lazy-loading
 * van het volledige beeld.
 *
 * @typedef {Object} FlipLightboxOptions
 * @property {string} [selector="[data-lightbox]"] CSS-selector voor de tegels binnen `root`.
 *
 * @param {Element} root Container met de tegels (elk een `<a data-lightbox href="…">`).
 * @param {FlipLightboxOptions} [options]
 * @returns {() => void} destroy — ruimt dialog, listeners en scroll-lock op. Idempotent.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'flip-lightbox')) return () => {};

  const { selector = '[data-lightbox]' } = options;
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const items = Array.from(root.querySelectorAll(selector));
  if (items.length === 0) {
    if (typeof console !== 'undefined') console.warn('flip-lightbox: geen elementen gevonden voor ' + selector);
    return () => {};
  }

  const motion = minderBeweging((v) => { reduced = v; });
  let reduced = motion.reduced;

  let destroyed = false;
  let currentIndex = -1;
  let lastFocused = null;
  let prevBodyOverflow = '';
  let touchStartX = 0;
  let touchStartY = 0;

  // --- dialog opbouwen (één keer, hergebruikt voor elke tegel) -----------
  // Een <dialog> zonder aria-label/aria-labelledby heeft geen
  // toegankelijke naam (schermlezers kondigen hem aan als kale "dialog").
  // `aria-labelledby` naar de caption geeft per geopende tegel een eigen
  // naam; `aria-label` is de vaste terugval als een tegel geen caption heeft.
  const captionId = `flb-caption-${Math.random().toString(36).slice(2, 9)}`;
  const dialog = doc.createElement('dialog');
  dialog.className = 'flb-dialog';
  dialog.setAttribute('aria-label', 'Mediagalerij');
  dialog.setAttribute('aria-labelledby', captionId);
  dialog.innerHTML =
    '<div class="flb-stage">' +
    '<button type="button" class="flb-btn flb-btn--close" data-flb-close aria-label="Sluiten">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>' +
    '</button>' +
    '<button type="button" class="flb-btn flb-btn--prev" data-flb-prev aria-label="Vorige">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' +
    '</button>' +
    '<button type="button" class="flb-btn flb-btn--next" data-flb-next aria-label="Volgende">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' +
    '</button>' +
    '<div class="flb-media-wrap" data-flb-wrap></div>' +
    `<p class="flb-meta"><span class="flb-counter" data-flb-counter></span><span class="flb-caption" data-flb-caption id="${captionId}"></span></p>` +
    '</div>';
  root.insertAdjacentElement('afterend', dialog);

  const wrap = dialog.querySelector('[data-flb-wrap]');
  const counterEl = dialog.querySelector('[data-flb-counter]');
  const captionEl = dialog.querySelector('[data-flb-caption]');
  const closeBtn = dialog.querySelector('[data-flb-close]');
  const prevBtn = dialog.querySelector('[data-flb-prev]');
  const nextBtn = dialog.querySelector('[data-flb-next]');

  if (items.length < 2) {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
  }

  function lockScroll() {
    prevBodyOverflow = doc.body.style.overflow;
    doc.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    doc.body.style.overflow = prevBodyOverflow;
  }

  function pauseMedia() {
    const v = wrap.querySelector('video');
    if (v) v.pause();
  }

  function renderMedia(item, { animateSwap = false } = {}) {
    const type = item.getAttribute('data-type') || 'image';
    const src = item.getAttribute('href') || item.getAttribute('data-full-src') || '';
    const srcset = item.getAttribute('data-full-srcset') || '';
    const caption = item.getAttribute('data-caption') || '';

    pauseMedia();

    let el;
    if (type === 'video') {
      el = doc.createElement('video');
      el.className = 'flb-media';
      el.src = src;
      el.controls = true;
      el.autoplay = true;
      // Gedempt van start — autoplay met geluid wordt door de browser sowieso
      // geblokkeerd zonder garantie op een user-gesture-venster; de bezoeker
      // zet zelf geluid aan via de eigen controls van <video>.
      el.muted = true;
      el.playsInline = true;
      const poster = item.getAttribute('data-poster');
      if (poster) el.poster = poster;
    } else {
      el = doc.createElement('img');
      el.className = 'flb-media';
      el.src = src;
      if (srcset) el.srcset = srcset;
      el.alt = item.getAttribute('data-alt') || caption || '';
    }

    if (animateSwap && !reduced) {
      el.style.opacity = '0';
      wrap.appendChild(el);
      // volgende animatieframe: fade in (alleen opacity/transform, R18)
      win.requestAnimationFrame(() => { el.style.opacity = ''; });
    } else {
      wrap.appendChild(el);
    }
    wrap.querySelectorAll('.flb-media').forEach((node) => { if (node !== el) node.remove(); });

    if (type === 'video' && typeof el.play === 'function') {
      // .play() expliciet aanroepen i.p.v. alleen op het autoplay-attribuut
      // vertrouwen — de belofte kan worden geweigerd (autoplay-beleid), en
      // dat mag nooit een onverwerkte rejection worden.
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }

    counterEl.textContent = `${currentIndex + 1} / ${items.length}`;
    captionEl.textContent = caption;
    return el;
  }

  function flipFrom(startRect, mediaEl) {
    if (!mediaEl || reduced) return;
    const endRect = mediaEl.getBoundingClientRect();
    if (endRect.width === 0 || endRect.height === 0) return;
    const dx = startRect.left + startRect.width / 2 - (endRect.left + endRect.width / 2);
    const dy = startRect.top + startRect.height / 2 - (endRect.top + endRect.height / 2);
    const sx = startRect.width / endRect.width;
    const sy = startRect.height / endRect.height;
    mediaEl.style.transition = 'none';
    mediaEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    // forceer reflow zodat de browser de start-transform ook echt schildert
    // vóór we hem terugzetten — anders wordt de eerste stap overgeslagen.
    // eslint-disable-next-line no-unused-expressions
    mediaEl.getBoundingClientRect();
    mediaEl.style.transition = '';
    win.requestAnimationFrame(() => {
      mediaEl.style.transform = '';
    });
  }

  function flipTo(endRect, mediaEl, onDone) {
    if (!mediaEl || reduced) { onDone(); return; }
    const startRect = mediaEl.getBoundingClientRect();
    if (startRect.width === 0 || startRect.height === 0) { onDone(); return; }
    const dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
    const dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
    const sx = endRect.width / startRect.width;
    const sy = endRect.height / startRect.height;
    let done = false;
    const finish = () => { if (done) return; done = true; mediaEl.removeEventListener('transitionend', finish); onDone(); };
    mediaEl.addEventListener('transitionend', finish);
    setTimeout(finish, 450); // vangnet: geen hangende sluiting als transitionend uitblijft
    mediaEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    mediaEl.style.opacity = '0.4';
  }

  function updateNav() {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  function focusableIn(el) {
    return Array.from(el.querySelectorAll('button, [href], video, [tabindex]:not([tabindex="-1"])'))
      .filter((n) => !n.hidden && n.tabIndex !== -1);
  }

  function onKeydown(e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex - 1); return; }
    if (e.key !== 'Tab') return;
    const focusables = focusableIn(dialog);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onTouchStart(e) {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }
  function onTouchEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goTo(currentIndex + 1); else goTo(currentIndex - 1);
    }
  }

  function goTo(index) {
    const clamped = (index + items.length) % items.length;
    if (clamped === currentIndex) return;
    currentIndex = clamped;
    renderMedia(items[currentIndex], { animateSwap: true });
    updateNav();
  }

  function openAt(index, triggerEl) {
    if (destroyed) return;
    currentIndex = index;
    lastFocused = triggerEl || doc.activeElement;
    const startRect = triggerEl ? triggerEl.getBoundingClientRect() : null;

    const wasOpen = dialog.open;
    if (!wasOpen) {
      lockScroll();
      dialog.showModal();
    }
    const mediaEl = renderMedia(items[currentIndex]);
    updateNav();

    if (!wasOpen && startRect) {
      runFlipWhenReady(mediaEl, startRect);
    }
    closeBtn.focus();
  }

  /**
   * Wacht tot het net aangemaakte media-element zijn echte afmeting heeft
   * (een vers <img>/<video> is vlak na het aanmaken nog 0×0 — de intrinsieke
   * grootte is pas bekend ná 'load'/'loadedmetadata') vóór de FLIP-animatie
   * start. Zonder deze wachtstap meet `flipFrom` een 0×0-eindrect, wijkt hij
   * stil af (de guard in `flipFrom`) en verschijnt het beeld zonder animatie.
   */
  function runFlipWhenReady(mediaEl, startRect) {
    if (reduced) return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      win.requestAnimationFrame(() => flipFrom(startRect, mediaEl));
    };
    if (mediaEl.tagName === 'VIDEO') {
      if (mediaEl.readyState >= 1) start();
      else mediaEl.addEventListener('loadedmetadata', start, { once: true });
    } else if (mediaEl.tagName === 'IMG') {
      if (mediaEl.complete && mediaEl.naturalWidth > 0) start();
      else mediaEl.addEventListener('load', start, { once: true });
    } else {
      start();
    }
    // Vangnet: een kapotte/trage bron mag de FLIP niet voor altijd blokkeren.
    setTimeout(start, 400);
  }

  function requestClose() {
    if (!dialog.open || destroyed) return;
    const item = items[currentIndex];
    const mediaEl = wrap.querySelector('.flb-media');
    const endRect = item ? item.getBoundingClientRect() : null;
    if (endRect && mediaEl) {
      flipTo(endRect, mediaEl, () => dialog.close());
    } else {
      dialog.close();
    }
  }

  function onDialogClose() {
    pauseMedia();
    unlockScroll();
    const returnTo = (items[currentIndex] && root.contains(items[currentIndex])) ? items[currentIndex] : lastFocused;
    if (returnTo && typeof returnTo.focus === 'function') returnTo.focus();
  }

  function onDialogCancel(e) {
    // native Escape-gedrag: laat de FLIP-terugvlucht ook hier lopen i.p.v.
    // direct dicht te klappen zonder animatie.
    e.preventDefault();
    requestClose();
  }

  function onItemClick(e, item, index) {
    e.preventDefault();
    openAt(index, item);
  }

  const itemHandlers = items.map((item, index) => {
    const handler = (e) => onItemClick(e, item, index);
    item.addEventListener('click', handler);
    return handler;
  });

  closeBtn.addEventListener('click', requestClose);
  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) requestClose(); });
  dialog.addEventListener('keydown', onKeydown);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('cancel', onDialogCancel);
  dialog.addEventListener('touchstart', onTouchStart, { passive: true });
  dialog.addEventListener('touchend', onTouchEnd, { passive: true });

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    motion.stop();
    items.forEach((item, i) => item.removeEventListener('click', itemHandlers[i]));
    closeBtn.removeEventListener('click', requestClose);
    dialog.removeEventListener('keydown', onKeydown);
    dialog.removeEventListener('close', onDialogClose);
    dialog.removeEventListener('cancel', onDialogCancel);
    dialog.removeEventListener('touchstart', onTouchStart);
    dialog.removeEventListener('touchend', onTouchEnd);
    if (dialog.open) {
      pauseMedia();
      dialog.close();
    }
    unlockScroll();
    dialog.remove();
  };
}
