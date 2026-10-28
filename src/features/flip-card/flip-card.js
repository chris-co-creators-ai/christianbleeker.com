/**
 * flip-card
 * ------------------------------------------------------------------------
 * Een kaart die omdraait tussen een voor- en achterkant. Op desktop draait
 * hij bij hover; overal (ook desktop) is hij te bedienen met een echte
 * `<button>` (Tik/Enter/Spatie), met `aria-pressed` als waarheid. De
 * verborgen kant krijgt `inert` zodat hij niet focusbaar/leesbaar is zolang
 * hij niet zichtbaar is. Bij `prefers-reduced-motion: reduce` faded de kaart
 * i.p.v. te draaien.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan bij `init()`.
 *
 * @param {Element} root Container waarbinnen naar `.flip-card` wordt gezocht.
 * @returns {() => void} destroy — verwijdert listeners, klassen en `inert`. Idempotent.
 */
import { vereisRoot, isTouch } from '../../_kwaliteit/basis.js';

const FLIPPED_CLASS = 'is-flipped';

export function init(root) {
  if (!vereisRoot(root, 'flip-card')) return () => {};

  const doc = root.ownerDocument || document;
  const touch = isTouch(doc);
  const cards = Array.from(root.querySelectorAll('.flip-card'));
  const cleanups = [];

  for (const card of cards) {
    const toggle = card.querySelector('.flip-card__toggle');
    const back = card.querySelector('.flip-card__face--back');
    const front = card.querySelector('.flip-card__face--front');
    if (!toggle) continue;

    // `pressed` (klik-vastgezet, de waarheid achter aria-pressed) en
    // `hovering` (tijdelijke hover-preview) zijn bewust twee losse vlaggen —
    // niet uit elkaar afgeleid via het DOM (bv. aria-pressed uitlezen), want
    // dan raken een klik tijdens hover elkaar in de war: het weergegeven
    // "geflipt" is altijd pressed OR hovering, maar de knop-status volgt
    // uitsluitend klikken.
    let pressed = false;
    let hovering = false;

    function render() {
      const flipped = pressed || hovering;
      card.classList.toggle(FLIPPED_CLASS, flipped);
      if (front) front.inert = flipped;
      if (back) back.inert = !flipped;
    }

    function setPressed(value) {
      pressed = value;
      toggle.setAttribute('aria-pressed', String(pressed));
      render();
    }

    const onClick = () => setPressed(!pressed);
    toggle.addEventListener('click', onClick);
    cleanups.push(() => toggle.removeEventListener('click', onClick));

    // Hover op desktop toont de achterkant als preview, los van de
    // klik-vastgezette staat. Niet op touch: daar genereert een tik ook
    // pointerenter, wat een verwarrende tweede toggle-bron naast de klik
    // zou zijn.
    if (!touch) {
      const onEnter = () => { hovering = true; render(); };
      const onLeave = () => { hovering = false; render(); };
      card.addEventListener('pointerenter', onEnter);
      card.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('pointerenter', onEnter);
        card.removeEventListener('pointerleave', onLeave);
      });
    }

    setPressed(false);
    cleanups.push(() => {
      card.classList.remove(FLIPPED_CLASS);
      toggle.removeAttribute('aria-pressed');
      if (front) front.inert = false;
      if (back) back.inert = false;
    });
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const fn of cleanups.splice(0)) fn();
  };
}
