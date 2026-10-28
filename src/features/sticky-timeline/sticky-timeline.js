/**
 * sticky-timeline
 * ------------------------------------------------------------------------
 * Een genummerde werkwijze-tijdlijn (01–0N): een verticale lijn die zich
 * vult terwijl de bezoeker scrolt, met een stip per stap die "aan" gaat
 * zodra die stap de activatielijn passeert, plus een gestickte "Stap X van
 * N"-indicator. Vanilla ES-module, 0 dependencies, SSR-veilig: raakt
 * `window`/`document` pas aan binnen `init()`.
 *
 * De lijst zelf is een echte `<ol>` — screenreaders krijgen daarmee gratis
 * "lijst, N items" / "item 1 van N" zonder extra `aria`. Alleen `transform`
 * wordt geanimeerd (R18): de vulling schaalt via `scaleY`/`scaleX`
 * (afhankelijk van de layout — zie sticky-timeline.css), niet via
 * `height`/`width`.
 *
 * Herkomst: het patroon (genummerde stappen, vullende lijn, stip per stap)
 * is gezien bij meerdere bureausites — eigen
 * implementatie, geen code overgenomen.
 *
 * @typedef {Object} StickyTimelineOptions
 * @property {number} [activationRatio=0.5] Fractie van window.innerHeight waarop de "activatielijn" ligt (0 = boven, 1 = onder).
 *
 * @param {Element} root Container met `[data-sticky-timeline]` (de `<ol>`), `[data-sticky-timeline-line-fill]` en optioneel `[data-stl-status-num]`/`[data-stl-status-total]`.
 * @param {StickyTimelineOptions} [options]
 * @returns {() => void} destroy — ruimt listeners en toegepaste klassen/stijlen op. Idempotent.
 */
import { minderBeweging, perFrame, vereisRoot } from '../../_kwaliteit/basis.js';

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

export function init(root, options = {}) {
  if (!vereisRoot(root, 'sticky-timeline')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const list = root.querySelector('[data-sticky-timeline]');
  if (!list) {
    if (typeof console !== 'undefined') {
      console.warn('sticky-timeline: init(root) kreeg geen [data-sticky-timeline] (<ol>) — overgeslagen');
    }
    return () => {};
  }

  const steps = Array.from(list.querySelectorAll('[data-sticky-timeline-step]'));
  const fill = root.querySelector('[data-sticky-timeline-line-fill]');
  const statusNum = root.querySelector('[data-stl-status-num]');
  const statusTotal = root.querySelector('[data-stl-status-total]');
  const activationRatio = clamp01(Number(options.activationRatio ?? 0.5));

  if (steps.length === 0) return () => {};

  if (statusTotal) statusTotal.textContent = String(steps.length);

  root.setAttribute('data-sticky-timeline-ready', '');

  function update() {
    const activationY = win.innerHeight * activationRatio;
    let activeCount = 0;
    for (const step of steps) {
      const isActive = step.getBoundingClientRect().top <= activationY;
      step.classList.toggle('is-active', isActive);
      if (isActive) activeCount += 1;
    }

    const listRect = list.getBoundingClientRect();
    const traveled = activationY - listRect.top;
    const progress = listRect.height > 0 ? clamp01(traveled / listRect.height) : 0;
    root.style.setProperty('--stl-progress', progress.toFixed(4));

    if (statusNum) statusNum.textContent = String(Math.min(steps.length, Math.max(1, activeCount)));
  }

  const onScroll = perFrame(update, doc);

  function applyMode(isReduced) {
    reduced = isReduced;
    update();
  }
  const reduceHandle = minderBeweging(applyMode, doc);
  let reduced = reduceHandle.reduced;

  win.addEventListener('scroll', onScroll, { passive: true });
  win.addEventListener('resize', onScroll, { passive: true });
  update();

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    reduceHandle.stop();
    win.removeEventListener('scroll', onScroll);
    win.removeEventListener('resize', onScroll);
    onScroll.cancel();
    root.removeAttribute('data-sticky-timeline-ready');
    root.style.removeProperty('--stl-progress');
    for (const step of steps) step.classList.remove('is-active');
    if (fill) fill.style.transform = '';
  };
}
