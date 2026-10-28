/**
 * hotspots
 * ------------------------------------------------------------------------
 * Klikbare punten op een afbeelding, elk met een tooltip. Posities in
 * procenten (`--hx`/`--hy` op elk `.hotspots__point`), zodat ze meeschalen
 * met de afbeelding. Een tooltip opent bij hover, focus of klik (klikken is
 * altijd "open", geen toggle — dat voorkomt dat een tik op touch, die zelf
 * ook als "enter" telt, het net geopende paneel meteen weer dichtklikt) en
 * sluit met Escape (focus gaat terug naar het punt), bij een klik ernaast,
 * of doordat de muis weggaat/de focus verdwijnt. Er staat maximaal één
 * tegelijk open. De module herpositioneert een tooltip die anders buiten de
 * afbeelding zou uitsteken (flip naar de andere kant).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan bij `init()`.
 *
 * @param {Element} root Container waarbinnen naar `.hotspots` wordt gezocht.
 * @returns {() => void} destroy — sluit open tooltips, verwijdert listeners/inline stijl. Idempotent.
 */
import { vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root) {
  if (!vereisRoot(root, 'hotspots')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  // De React-wrapper geeft de .hotspots-groep zelf als root mee; querySelectorAll vindt die niet.
  const groups = root.matches && root.matches('.hotspots') ? [root] : Array.from(root.querySelectorAll('.hotspots'));
  const cleanups = [];

  for (const group of groups) {
    const media = group.querySelector('.hotspots__media');
    if (!media) continue;
    const points = Array.from(group.querySelectorAll('.hotspots__point'));
    let openPoint = null;
    // Tik-fix (27-10): een klik/tik zet het paneel vast. Op touch (en in WebKit) volgt na de klik meteen een
    // pointerleave die het net geopende paneel weer sloot. Vast paneel sluit via klik ernaast, Escape of een ander punt.
    let vast = null;
    // Terugzetten van de focus na Escape mag het paneel niet meteen weer openen (in Safari had
    // het punt na een klik nog geen focus, dus focus() vuurt dan wél een focus-event).
    let focusTerugNaEscape = false;

    function panelFor(point) {
      const id = point.getAttribute('aria-controls');
      return id ? doc.getElementById(id) : null;
    }

    const GAP = 10;

    function place(point, panel) {
      panel.classList.remove('is-flip-x', 'is-flip-y');

      const mediaRect = media.getBoundingClientRect();
      const pointRect = point.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      const cx = pointRect.left + pointRect.width / 2 - mediaRect.left;
      const topEdge = pointRect.top - mediaRect.top - GAP;
      const bottomEdge = pointRect.bottom - mediaRect.top + GAP;

      const overflowsAbove = topEdge - panelRect.height < 0;

      // Horizontaal: gecentreerd op het punt, maar altijd binnen het beeld geklemd. De oude flip
      // (-100% of 0%) controleerde niet of het paneel aan die kant wél paste: bij een punt op
      // 55–72 % van een smal beeld (390) viel het links buiten beeld (demo-18/19, 28-10).
      const w = panelRect.width;
      const left = Math.max(0, Math.min(cx - w / 2, mediaRect.width - w));
      if (left < cx - w / 2) panel.classList.add('is-flip-x');

      let ty;
      let anchorY;
      if (overflowsAbove) {
        anchorY = bottomEdge;
        ty = '0%';
        panel.classList.add('is-flip-y');
      } else {
        anchorY = topEdge;
        ty = '-100%';
      }

      panel.style.left = `${left}px`;
      panel.style.top = `${anchorY}px`;
      panel.style.transform = `translateY(${ty})`;
    }

    function close(point) {
      if (!point) return;
      const panel = panelFor(point);
      point.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
      if (openPoint === point) openPoint = null;
      if (vast === point) vast = null;
    }

    function open(point) {
      const panel = panelFor(point);
      if (!panel) return;
      if (openPoint && openPoint !== point) close(openPoint);
      point.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      place(point, panel);
      openPoint = point;
    }

    for (const point of points) {
      const panel = panelFor(point);
      if (!panel) continue;
      point.setAttribute('aria-expanded', 'false');
      panel.hidden = true;

      const onEnter = () => open(point);
      // Niet sluiten als de muis het punt verlaat richting zijn eigen paneel.
      const onLeave = (event) => {
        if (event.relatedTarget && panel.contains(event.relatedTarget)) return;
        if (openPoint === point && vast !== point) close(point);
      };
      // Een druk zet het paneel al vast, niet pas de klik: in Firefox kwam soms een pointerleave
      // tússen pointerdown en click, sloot het net geopende paneel en kwam de klik nooit aan
      // (4 van 10 op demo-21, gemeten 28-10).
      const onDown = () => { open(point); vast = point; };
      const onFocus = () => { if (!focusTerugNaEscape) open(point); };
      const onBlur = (event) => {
        // Niet sluiten als de focus binnen dezelfde groep blijft (bv. naar
        // een link in de tooltip zelf) — alleen als hij echt weg is.
        const next = event.relatedTarget;
        if (next && (point.contains(next) || panel.contains(next))) return;
        if (openPoint === point && vast !== point) close(point);
      };
      // Klik opent (idempotent) — geen toggle-op-klik: een klik die vlak na
      // een hover/focus op hetzelfde punt binnenkomt (heel normaal op
      // touch, waar een tik ook als "enter" telt) mag het net geopende
      // paneel niet meteen weer dichtklikken. Sluiten op een device zonder
      // hover gaat via een klik ernaast (zie onOutsideClick) of Escape.
      const onClick = () => { open(point); vast = point; };
      const onKeydown = (event) => {
        if (event.key !== 'Escape') return;
        if (openPoint !== point) return;
        event.stopPropagation();
        close(point);
        point.focus();
      };

      point.addEventListener('pointerenter', onEnter);
      point.addEventListener('pointerleave', onLeave);
      point.addEventListener('pointerdown', onDown);
      point.addEventListener('focus', onFocus);
      point.addEventListener('blur', onBlur);
      point.addEventListener('click', onClick);
      point.addEventListener('keydown', onKeydown);

      cleanups.push(() => {
        point.removeEventListener('pointerenter', onEnter);
        point.removeEventListener('pointerleave', onLeave);
        point.removeEventListener('pointerdown', onDown);
        point.removeEventListener('focus', onFocus);
        point.removeEventListener('blur', onBlur);
        point.removeEventListener('click', onClick);
        point.removeEventListener('keydown', onKeydown);
        point.removeAttribute('aria-expanded');
        panel.hidden = true;
        panel.style.left = '';
        panel.style.right = '';
        panel.style.top = '';
        panel.style.bottom = '';
        panel.style.transform = '';
        panel.classList.remove('is-flip-x', 'is-flip-y');
      });
    }

    // Escape sluit ook als de focus niet op het punt staat: op het document,
    // niet op de groep. Safari geeft een knop bij een klik geen focus, dus na
    // een klik op een punt komt Escape op <body> binnen (gemeten 26-09 in WebKit).
    const onDocKeydown = (event) => {
      if (event.key === 'Escape' && openPoint) {
        const point = openPoint;
        close(point);
        focusTerugNaEscape = true;
        point.focus();
        focusTerugNaEscape = false;
      }
    };
    doc.addEventListener('keydown', onDocKeydown);
    cleanups.push(() => doc.removeEventListener('keydown', onDocKeydown));

    // Klik ernaast (op de afbeelding zelf, of buiten de groep) sluit het
    // open paneel — de enige manier om op touch (geen hover) weer dicht te
    // klikken zonder Escape.
    const onOutsideClick = (event) => {
      if (!openPoint) return;
      if (event.target.closest && event.target.closest('.hotspots__point, .hotspots__panel')) return;
      close(openPoint);
    };
    doc.addEventListener('pointerdown', onOutsideClick);
    cleanups.push(() => doc.removeEventListener('pointerdown', onOutsideClick));

    const onResize = () => { if (openPoint) place(openPoint, panelFor(openPoint)); };
    win.addEventListener('resize', onResize, { passive: true });
    cleanups.push(() => win.removeEventListener('resize', onResize));
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const fn of cleanups.splice(0)) fn();
  };
}
