/**
 * drag-carousel
 * ------------------------------------------------------------------------
 * Twee varianten in één module:
 *
 *  - `.carousel` (standaard, interactief): een scroll-snap-basis — native
 *    swipe werkt al zonder JS. Deze module voegt slepen-met-de-muis toe
 *    (grab-cursor), pijlen, stippen, een uitgelichte actieve dia,
 *    pijltjestoetsen, en een `aria-live`-statusregel ("Dia x van y").
 *  - `.carousel-strip` (`continuous`-modus): een doorlopende, niet-
 *    interactieve strip (bv. een logo- of quote-band) die vanzelf schuift
 *    en pauzeert bij hover, buiten beeld, of `prefers-reduced-motion`.
 *
 * Twee opt-in uitbreidingen voor de interactieve variant (zonder opties
 * verandert er niets):
 *
 *  - `voortgang`: een voortgangsduim onder de viewport. Breedte =
 *    max(zichtbaar / totaal x 100, 10) %, positie volgt de scroll.
 *  - `gridlijn`: een spacer vooraan zodat dia 1 op de gridlijn van de pagina
 *    begint (ook al is de strip schermbreed), en pijlen/stippen/toetsen die
 *    naar de gridlijn springen i.p.v. naar het midden. De pijlen krijgen
 *    `aria-disabled` aan de randen.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan bij `init()`.
 *
 * Herkomst van de duim en de spacer: bureautandem.nl (cases-rij, 2026-10-26),
 * eigen implementatie.
 *
 * @typedef {Object} DragCarouselOptions
 * @property {boolean} [voortgang] Voortgangsduim tonen. Standaard: attribuut `data-carousel-voortgang` op `.carousel`. Een eigen `.carousel__progress` met `.carousel__thumb` erin wordt hergebruikt.
 * @property {boolean|string|Element|number} [gridlijn] Gridlijn-modus. `true` = de linkerkant van de inhoud van het bovenliggende element; een selector of Element = de linkerkant van de inhoud van dat element; een getal = px vanaf de linkerkant van de viewport. Standaard: attribuut `data-carousel-grid` op `.carousel` (leeg = `true`, anders een selector).
 *
 * @param {Element} root Container waarbinnen naar `.carousel`/`.carousel-strip` wordt gezocht.
 * @param {DragCarouselOptions} [options]
 * @returns {() => void} destroy — verwijdert listeners/observers/klassen van alle gevonden carousels. Idempotent.
 */
import { minderBeweging, inBeeld, vereisRoot, perFrame } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'drag-carousel')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const cleanups = [];
  // De root zelf telt mee: de React-wrappers zetten hun ref óp `.carousel`/`.carousel-strip`.
  const vind = (sel) => [...(root.matches?.(sel) ? [root] : []), ...root.querySelectorAll(sel)];

  for (const el of vind('.carousel')) {
    cleanups.push(initInteractive(el, doc, win, options));
  }
  for (const el of vind('.carousel-strip')) {
    cleanups.push(initContinuous(el, doc, win));
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const fn of cleanups.splice(0)) fn();
  };
}

function initInteractive(el, doc, win, options = {}) {
  const viewport = el.querySelector('.carousel__viewport');
  const track = el.querySelector('.carousel__track');
  if (!viewport || !track) return () => {};

  const slides = Array.from(track.children);
  const prevBtn = el.querySelector('.carousel__arrow--prev');
  const nextBtn = el.querySelector('.carousel__arrow--next');
  const dots = Array.from(el.querySelectorAll('.carousel__dot'));
  const status = el.querySelector('[data-carousel-status]');
  const cleanups = [];

  // --- opt-in: voortgangsduim en gridlijn -----------------------------------
  const wilDuim = options.voortgang ?? el.hasAttribute('data-carousel-voortgang');
  let gridOpt = options.gridlijn;
  if (gridOpt === undefined && el.hasAttribute('data-carousel-grid')) gridOpt = el.getAttribute('data-carousel-grid') || true;
  const gridModus = gridOpt !== undefined && gridOpt !== null && gridOpt !== false;
  const gridRef = typeof gridOpt === 'string' ? doc.querySelector(gridOpt)
    : gridOpt === true ? el.parentElement
    : gridOpt && typeof gridOpt === 'object' ? gridOpt : null;
  let gridOffset = typeof gridOpt === 'number' ? gridOpt : 0; // px vanaf de linkerkant van de viewport
  let spacer = null;

  let activeIndex = 0;

  function setActive(index) {
    activeIndex = index;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
    if (status) status.textContent = `Dia ${index + 1} van ${slides.length}`;
  }

  // gridlijn-modus: scrol zodat de dia met zijn linkerkant op de gridlijn staat
  function gridScrollNaar(slide) {
    const vp = viewport.getBoundingClientRect();
    const delta = slide.getBoundingClientRect().left - (vp.left + gridOffset);
    viewport.scrollTo({ left: Math.max(0, viewport.scrollLeft + delta), behavior: minderBeweging(undefined, doc).reduced ? 'auto' : 'smooth' });
  }
  // eerste dia voorbij de gridlijn (+10 px marge) of laatste ervoor (-10 px)
  function gridDoel(richting) {
    const x = viewport.getBoundingClientRect().left + gridOffset;
    if (richting > 0) return slides.find((s) => s.getBoundingClientRect().left > x + 10) || null;
    return [...slides].reverse().find((s) => s.getBoundingClientRect().left < x - 10) || null;
  }
  const opEinde = () => viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
  function updatePijlen() {
    if (!gridModus) return;
    const vol = !gridDoel(1) || opEinde();
    const terug = !gridDoel(-1);
    nextBtn?.setAttribute('aria-disabled', vol ? 'true' : 'false');
    prevBtn?.setAttribute('aria-disabled', terug ? 'true' : 'false');
  }

  function goTo(index) {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    if (gridModus) { gridScrollNaar(slides[clamped]); return; }
    slides[clamped].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // Welke dia is "actief": de dia waarvan het midden het dichtst bij het
  // midden van de viewport ligt — dat is precies wat `scroll-snap-align:
  // center` als rustpunt aanhoudt, dus na elke scroll (sleep, swipe, pijl,
  // stip, toetsenbord) is er altijd een eenduidige "dichtstbijzijnde" dia,
  // zonder de meerduidigheid van een oppervlakte-ratio (bij een brede
  // viewport kunnen twee dia's tegelijk 100% zichtbaar zijn).
  function computeActive() {
    const vpRect = viewport.getBoundingClientRect();
    // gridlijn-modus: de dia die het dichtst bij de gridlijn staat
    const center = gridModus ? vpRect.left + gridOffset : vpRect.left + vpRect.width / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const dist = gridModus ? Math.abs(r.left - center) : Math.abs(r.left + r.width / 2 - center);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    if (bestIdx !== activeIndex) setActive(bestIdx);
  }

  const onScroll = perFrame(() => { computeActive(); updateDuim(); updatePijlen(); }, doc);
  viewport.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => { viewport.removeEventListener('scroll', onScroll); onScroll.cancel(); });

  setActive(0);

  // --- voortgangsduim (opt-in) ---------------------------------------------------
  let progress = null;
  let thumb = null;
  let duimGemaakt = false;
  if (wilDuim) {
    progress = el.querySelector('.carousel__progress');
    if (!progress) {
      progress = doc.createElement('div');
      progress.className = 'carousel__progress';
      progress.setAttribute('aria-hidden', 'true'); // de statusregel meldt de voortgang al aan schermlezers
      viewport.insertAdjacentElement('afterend', progress);
      duimGemaakt = true;
    }
    thumb = progress.querySelector('.carousel__thumb');
    if (!thumb) {
      thumb = doc.createElement('div');
      thumb.className = 'carousel__thumb';
      progress.appendChild(thumb);
    }
  }
  // breedte = zichtbaar / totaal, minimaal 10 %; positie volgt de scroll
  function updateDuim() {
    if (!thumb) return;
    const totaal = viewport.scrollWidth;
    const zichtbaar = viewport.clientWidth;
    const pct = totaal > 0 ? Math.min(100, Math.max(10, (zichtbaar / totaal) * 100)) : 100;
    const max = totaal - zichtbaar;
    const frac = max > 0 ? Math.min(1, viewport.scrollLeft / max) : 0;
    thumb.style.width = `${pct.toFixed(3)}%`;
    // % van translateX telt t.o.v. de duim zelf: de baan is 100/pct duimbreedtes lang
    thumb.style.transform = `translateX(${(frac * (100 / pct - 1) * 100).toFixed(3)}%)`;
  }

  // --- gridlijn (opt-in): spacer vooraan, zodat dia 1 op de gridlijn begint -----
  function updateGrid() {
    if (!gridModus) return;
    if (typeof gridOpt !== 'number') {
      if (gridRef) {
        const cs = win.getComputedStyle(gridRef);
        const links = gridRef.getBoundingClientRect().left + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0);
        gridOffset = Math.max(0, links - viewport.getBoundingClientRect().left);
      } else gridOffset = 0;
    }
    const gap = parseFloat(win.getComputedStyle(viewport).columnGap) || 0;
    spacer.style.width = `${Math.max(0, gridOffset - gap)}px`;
    el.style.setProperty('--car-grid-offset', `${gridOffset}px`);
  }
  function updateAlles() {
    updateGrid();
    updateDuim();
    updatePijlen();
    if (gridModus) computeActive();
  }
  if (gridModus) {
    spacer = doc.createElement('div');
    spacer.className = 'carousel__spacer';
    spacer.setAttribute('aria-hidden', 'true');
    // eerst maat en variabele, dan pas invoegen en snappen aanzetten: anders snapt de
    // browser eerst naar een dia op de verkeerde plek en scrolt daarna zichtbaar terug
    updateGrid();
    viewport.insertBefore(spacer, track);
    el.setAttribute('data-carousel-gridlijn', '');
  }
  if (gridModus || wilDuim) {
    updateAlles();
    let ro = null;
    if ('ResizeObserver' in win) {
      ro = new win.ResizeObserver(() => updateAlles());
      ro.observe(viewport);
      if (gridRef) ro.observe(gridRef);
    }
    const onResizeVenster = perFrame(updateAlles, doc);
    win.addEventListener('resize', onResizeVenster);
    let weg = false;
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (!weg) updateAlles(); });
    cleanups.push(() => {
      weg = true;
      if (ro) ro.disconnect();
      win.removeEventListener('resize', onResizeVenster);
      onResizeVenster.cancel();
      if (spacer) spacer.remove();
      el.removeAttribute('data-carousel-gridlijn');
      el.style.removeProperty('--car-grid-offset');
      prevBtn?.removeAttribute('aria-disabled');
      nextBtn?.removeAttribute('aria-disabled');
      if (duimGemaakt) progress.remove();
      else if (thumb) { thumb.style.removeProperty('width'); thumb.style.removeProperty('transform'); }
    });
  }

  // --- slepen met de muis (touch heeft native swipe al via scroll-snap) --
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;
  let pointerId = null;

  // Capture pas bij echte beweging (> 4 px): een capture bij pointerdown stuurt de
  // klik naar de viewport en slikt de klik op een link in de dia in.
  // Capture en scroll gaan meteen in de pointermove (browsers bundelen pointermoves al per frame). Via een
  // extra requestAnimationFrame kwam in WebKit bij een snelle sleep de capture te laat (muis al buiten
  // de viewport) en bleef de strip staan (gemeten 26-10).
  const onPointerDown = (event) => {
    if (event.pointerType === 'touch') return;
    // Firefox kan na een sleep vanaf een link de pointerup missen: dan hangt de capture nog en zou de
    // klik van nu naar de viewport gaan in plaats van de link (gemeten 26-10). Eerst loslaten.
    try { if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId); } catch { /* niets */ }
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
    pointerId = event.pointerId;
  };
  const onPointerMove = (event) => {
    if (!dragging) return;
    if (event.buttons === 0) { endDrag(event); return; } // pointerup gemist: niet zonder knop doorslepen
    if (!moved && Math.abs(event.clientX - startX) > 4) {
      moved = true;
      viewport.classList.add('is-dragging');
      try { viewport.setPointerCapture(pointerId); } catch { /* niets */ }
    }
    if (moved) viewport.scrollLeft = startScroll - (event.clientX - startX);
  };
  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    try { viewport.releasePointerCapture(event.pointerId); } catch { /* niets */ }
  };
  // Een sleep mag niet ook als klik op een link/knop in de dia tellen.
  const onClickCapture = (event) => {
    if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; }
  };

  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove, { passive: true });
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('click', onClickCapture, true);
  // een beeld of link in een dia start anders de native sleep van de browser en breekt het slepen af
  const onDragStart = (event) => event.preventDefault();
  viewport.addEventListener('dragstart', onDragStart);
  cleanups.push(() => {
    viewport.removeEventListener('dragstart', onDragStart);
    viewport.removeEventListener('pointerdown', onPointerDown);
    viewport.removeEventListener('pointermove', onPointerMove);
    viewport.removeEventListener('pointerup', endDrag);
    viewport.removeEventListener('pointercancel', endDrag);
    viewport.removeEventListener('click', onClickCapture, true);
    viewport.classList.remove('is-dragging');
  });

  // --- pijlen + stippen ----------------------------------------------------
  const stap = (richting) => {
    if (!gridModus) { goTo(activeIndex + richting); return; }
    const doel = gridDoel(richting);
    if (doel && !(richting > 0 && opEinde())) gridScrollNaar(doel);
  };
  const onPrev = () => stap(-1);
  const onNext = () => stap(1);
  prevBtn?.addEventListener('click', onPrev);
  nextBtn?.addEventListener('click', onNext);
  cleanups.push(() => {
    prevBtn?.removeEventListener('click', onPrev);
    nextBtn?.removeEventListener('click', onNext);
  });

  const dotHandlers = dots.map((dot, i) => {
    const fn = () => goTo(i);
    dot.addEventListener('click', fn);
    return fn;
  });
  cleanups.push(() => dots.forEach((dot, i) => dot.removeEventListener('click', dotHandlers[i])));

  // --- focus: een kaart die focus krijgt scrolt helemaal in beeld ------------
  // (de browser scrolt alleen het gefocuste element, niet de hele dia)
  const onFocusIn = (event) => {
    const dia = slides.find((s) => s.contains(event.target));
    if (!dia) return;
    // Zelf de kleinste verschuiving uitrekenen: Safari deed met scrollIntoView({ inline: 'nearest' }) in
    // een strip met snap niets (dia 2 bleef half buiten beeld, gemeten 26-10). De snap kiest daarna het
    // dichtstbijzijnde snappunt, en daar staat de dia heel in beeld.
    // Een frame later: focusin komt vóór de eigen focus-scroll van de browser, en die breekt in WebKit
    // een net gestarte zachte scroll weer af.
    win.requestAnimationFrame(() => {
      const d = dia.getBoundingClientRect(); const v = viewport.getBoundingClientRect();
      const delta = d.left < v.left ? d.left - v.left : d.right > v.right ? Math.min(d.right - v.right, d.left - v.left) : 0;
      if (delta) viewport.scrollTo({ left: viewport.scrollLeft + delta, behavior: minderBeweging(undefined, doc).reduced ? 'auto' : 'smooth' });
    });
  };
  viewport.addEventListener('focusin', onFocusIn);
  cleanups.push(() => viewport.removeEventListener('focusin', onFocusIn));

  // --- toetsenbord -----------------------------------------------------------
  const onKeydown = (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); stap(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); stap(-1); }
  };
  viewport.addEventListener('keydown', onKeydown);
  cleanups.push(() => viewport.removeEventListener('keydown', onKeydown));

  cleanups.push(() => {
    slides.forEach((s) => s.classList.remove('is-active'));
    dots.forEach((d) => d.removeAttribute('aria-current'));
    if (status) status.textContent = '';
  });

  return function destroyInteractive() {
    for (const fn of cleanups.splice(0)) fn();
  };
}

function initContinuous(el, doc, win) {
  const track = el.querySelector('.carousel-strip__track');
  if (!track) return () => {};

  let hovering = false;
  let visible = true;
  let reduced = minderBeweging().reduced;

  function sync() {
    el.classList.toggle('is-paused', reduced || hovering || !visible);
  }
  sync();

  const onEnter = () => { hovering = true; sync(); };
  const onLeave = () => { hovering = false; sync(); };
  el.addEventListener('pointerenter', onEnter);
  el.addEventListener('pointerleave', onLeave);

  const io = new win.IntersectionObserver(
    (entries) => { for (const entry of entries) { visible = entry.isIntersecting; sync(); } },
    { threshold: 0.1 }
  );
  io.observe(el);

  const mm = minderBeweging((value) => { reduced = value; sync(); }, doc);

  return function destroyContinuous() {
    el.removeEventListener('pointerenter', onEnter);
    el.removeEventListener('pointerleave', onLeave);
    io.disconnect();
    mm.stop();
    el.classList.remove('is-paused');
  };
}
