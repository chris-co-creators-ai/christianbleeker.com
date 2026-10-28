/**
 * ghost-text
 * ------------------------------------------------------------------------
 * Reusachtig doorzichtig/outline woord achter een sectie ("UITGELICHT",
 * "R"), decoratief (`aria-hidden`), schaalt met de container via CSS
 * `clamp()` — geen JS nodig voor het lettertype zelf. Dit bestand doet twee
 * dingen: (1) altijd, ongeacht opties, ná het laden meten of het woord in
 * zijn host past en zo niet terugschalen via `--ghost-fit` (L11: één
 * viewport-brede `clamp()` kent de woordlengte niet — "UITGELICHT" viel af
 * op containers waar "R" prima paste); (2) optioneel een lichte parallax
 * (het woord schuift trager mee dan de scroll), via een
 * IntersectionObserver + scroll-listener op `requestAnimationFrame`.
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 *
 * @typedef {Object} GhostTextOptions
 * @property {boolean} [parallax=false] Lichte verschuiving bij scrollen.
 * @property {number} [speed=0.12] Parallax-sterkte (fractie van de scrollafstand).
 *
 * @param {Element} root Het `[data-ghost-text]`-element zelf (decoratief, `aria-hidden="true"`).
 * @param {GhostTextOptions} [options]
 * @returns {() => void} destroy — idempotent.
 */
import { minderBeweging, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'ghost-text')) return () => {};

  const { parallax = false, speed = 0.12 } = options;

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  // L11 ("UITGELICHT" viel af): --ghost-size is één viewport-brede clamp()
  // voor élk woord, ongeacht lengte — een lang woord kan breder worden dan
  // zijn host, die zelf overflow:hidden heeft (dus de laatste letter(s)
  // klippen af, geen paginabrede overflow, wel afgekapte tekst). Terugschalen
  // ná het meten van de werkelijke breedte lost dat op, onafhankelijk van
  // welk woord de auteur invult. Altijd actief, ook zonder `parallax`.
  function fitToContainer() {
    const host = root.closest('[data-ghost-text-host]') || root.parentElement;
    if (!host) return;
    root.style.setProperty('--ghost-fit', '1');
    const beschikbaar = host.clientWidth;
    const nodig = root.scrollWidth;
    if (beschikbaar > 0 && nodig > beschikbaar) {
      // Kleine marge (0.98) zodat afrondingsverschillen niet weer net over de rand gaan.
      root.style.setProperty('--ghost-fit', String((beschikbaar / nodig) * 0.98));
    }
  }
  fitToContainer();
  let resizeCleanup = () => {};
  if (win.ResizeObserver) {
    const ro = new win.ResizeObserver(() => fitToContainer());
    const host = root.closest('[data-ghost-text-host]') || root.parentElement;
    if (host) ro.observe(host);
    resizeCleanup = () => ro.disconnect();
  } else {
    const onResize = () => fitToContainer();
    win.addEventListener('resize', onResize, { passive: true });
    resizeCleanup = () => win.removeEventListener('resize', onResize);
  }

  const reduced = minderBeweging(undefined, doc);

  if (!parallax || reduced.reduced) {
    return function destroy() {
      resizeCleanup();
      root.style.removeProperty('--ghost-fit');
    };
  }

  const update = perFrame(() => {
    const rect = root.getBoundingClientRect();
    const viewportCenter = win.innerHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const delta = (elementCenter - viewportCenter) * speed;
    root.style.setProperty('--ghost-shift', `${delta.toFixed(1)}px`);
  }, doc);

  let listening = false;
  function startListening() {
    if (listening) return;
    listening = true;
    win.addEventListener('scroll', update, { passive: true });
    win.addEventListener('resize', update, { passive: true });
    update();
  }
  function stopListening() {
    if (!listening) return;
    listening = false;
    win.removeEventListener('scroll', update, { passive: true });
    win.removeEventListener('resize', update, { passive: true });
    update.cancel();
  }

  // Eigen IntersectionObserver i.p.v. basis.js `inBeeld()`: die roept de
  // callback alleen aan bij het ín beeld komen, nooit bij het uit beeld
  // gaan — hier is precies dat tweede geval nodig om de scroll-listener
  // ook weer echt te ontkoppelen (R18: "wat onzichtbaar is, stopt").
  let observer = null;
  if ('IntersectionObserver' in win) {
    observer = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) startListening();
          else stopListening();
        }
      },
      { rootMargin: '20% 0px 20% 0px' }
    );
    observer.observe(root);
  } else {
    startListening(); // geen IO-support: gewoon altijd actief, geen crash
  }

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (observer) observer.disconnect();
    stopListening();
    root.style.removeProperty('--ghost-shift');
    reduced.stop();
    resizeCleanup();
    root.style.removeProperty('--ghost-fit');
  };
}
