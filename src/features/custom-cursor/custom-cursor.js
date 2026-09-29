/**
 * custom-cursor
 * ------------------------------------------------------------------------
 * Een eigen cursor (stip + ring) die de systeemcursor vervangt: de ring volgt
 * de muis met een lichte vertraging (lerp), vergroot boven links/knoppen, en
 * kan een label tonen via `data-cursor-label` op het gehoverde element.
 * Optioneel magnetiseert de ring naar knoppen met `data-cursor-magnetic`.
 *
 * Staat standaard UIT op touch en bij `prefers-reduced-motion: reduce`
 * (R3/R1) — dan raakt deze module niets aan en blijft de systeemcursor
 * gewoon zichtbaar. Verdwijnt ook zodra de muis het venster verlaat, boven
 * een tekstveld (`input`/`textarea`/`[contenteditable]` — daar hoort de
 * systeem-tekstcursor thuis), of boven een `<dialog open>`/`<iframe>`
 * (nooit erboven blijven "zweven").
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt `window`/`document`
 * pas aan bij `init()`.
 *
 * @typedef {Object} CustomCursorOptions
 * @property {'dot'|'crosshair'|'groot'|'bal'} [variant='dot'] Visuele variant.
 * @property {number} [lerp=0.18] Smoothing-factor per animatieframe (0..1, hoger = sneller volgen).
 * @property {string} [interactiveSelector] Selector voor elementen die de cursor laten vergroten. Standaard `a, button, [role="button"], [data-cursor-hover]`.
 * @property {string} [textFieldSelector] Selector voor tekstvelden die de systeemcursor terugkrijgen.
 * @property {boolean} [magnetic=true] Zet `data-cursor-magnetic`-elementen aan.
 * @property {number} [magneticStrength=0.35] Hoe ver de knop meebeweegt (0..1).
 *
 * @param {Element} root Container waarbinnen interactieve elementen gezocht worden (meestal `document.body`).
 * @param {CustomCursorOptions} [options]
 * @returns {() => void} destroy — verwijdert de cursor-elementen en alle listeners. Idempotent.
 */
import { minderBeweging, isTouch, vereisRoot } from '../../_kwaliteit/basis.js';

const DEFAULT_INTERACTIVE = 'a, button, [role="button"], [data-cursor-hover]';
const DEFAULT_TEXT_FIELD = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'custom-cursor')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  // R3 + R1: op touch doet deze module helemaal niets — de systeemcursor
  // blijft gewoon staan (touch heeft toch geen zwevende cursor).
  if (isTouch(doc)) return () => {};

  const {
    variant = 'dot',
    lerp = 0.18,
    interactiveSelector = DEFAULT_INTERACTIVE,
    textFieldSelector = DEFAULT_TEXT_FIELD,
    magnetic = true,
    magneticStrength = 0.35,
  } = options;

  const dot = doc.createElement('div');
  dot.className = 'vf-cursor vf-cursor--dot';
  dot.setAttribute('aria-hidden', 'true');
  const ring = doc.createElement('div');
  // "dot" is de standaard ringstijl (dunne cirkel) en heeft geen eigen
  // modifier-klasse nodig — dat voorkomt botsing met `.vf-cursor--dot`,
  // de klasse van de losse volg-stip.
  ring.className = `vf-cursor vf-cursor--ring${variant === 'dot' ? '' : ` vf-cursor--ring-${variant}`}`;
  ring.setAttribute('aria-hidden', 'true');
  const visual = doc.createElement('span');
  visual.className = 'vf-cursor__visual';
  const label = doc.createElement('span');
  label.className = 'vf-cursor__label';
  ring.appendChild(visual);
  ring.appendChild(label);

  let reduced = minderBeweging().reduced;

  function mount() {
    if (dot.isConnected) return;
    doc.body.appendChild(dot);
    doc.body.appendChild(ring);
  }
  function unmount() {
    dot.remove();
    ring.remove();
    doc.documentElement.classList.remove('vf-cursor-active');
  }

  let targetX = win.innerWidth / 2;
  let targetY = win.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let visible = false;
  // `hoveredMagnet`: het magnetische element waar de cursor op dit moment
  // boven hangt (of null). `animMagnet`: het element waarvan de transform op
  // dit moment nog geanimeerd wordt — blijft gezet zolang de terugveer-lerp
  // naar 0,0 nog niet is afgerond, ook al is `hoveredMagnet` intussen alweer
  // null (muis is al weg). Zonder dat onderscheid blijft het element op zijn
  // laatste offset "plakken" zodra de muis vertrekt, want er is dan niemand
  // meer die zijn style.transform nog bijwerkt.
  let hoveredMagnet = null;
  let animMagnet = null;
  let magnetOffsetX = 0;
  let magnetOffsetY = 0;
  let rafId = 0;

  function show() {
    if (visible || reduced) return;
    visible = true;
    doc.documentElement.classList.add('vf-cursor-active');
  }
  function hide() {
    if (!visible) return;
    visible = false;
    doc.documentElement.classList.remove('vf-cursor-active');
    ring.classList.remove('is-hover', 'has-label');
    label.textContent = '';
  }

  function systemCursorWanted(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(`dialog[open], iframe, ${textFieldSelector}`);
  }

  const onMove = (event) => {
    if (reduced) return;
    targetX = event.clientX;
    targetY = event.clientY;

    if (systemCursorWanted(event.target)) {
      hide();
      hoveredMagnet = null;
      return;
    }
    show();
    dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

    const interactive = event.target.closest ? event.target.closest(interactiveSelector) : null;
    ring.classList.toggle('is-hover', !!interactive);
    const labelText = interactive ? interactive.getAttribute('data-cursor-label') || '' : '';
    label.textContent = labelText;
    ring.classList.toggle('has-label', !!labelText);

    const nextMagnet = magnetic && interactive && interactive.hasAttribute('data-cursor-magnetic') ? interactive : null;
    hoveredMagnet = nextMagnet;
    if (nextMagnet) animMagnet = nextMagnet;
  };

  function tick() {
    ringX += (targetX - ringX) * lerp;
    ringY += (targetY - ringY) * lerp;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

    if (animMagnet) {
      let dx = 0;
      let dy = 0;
      if (hoveredMagnet === animMagnet) {
        const rect = animMagnet.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        dx = (targetX - cx) * magneticStrength;
        dy = (targetY - cy) * magneticStrength;
      }
      magnetOffsetX += (dx - magnetOffsetX) * lerp;
      magnetOffsetY += (dy - magnetOffsetY) * lerp;

      const settled = hoveredMagnet !== animMagnet && Math.abs(magnetOffsetX) < 0.05 && Math.abs(magnetOffsetY) < 0.05;
      if (settled) {
        animMagnet.style.removeProperty('transform');
        animMagnet = null;
        magnetOffsetX = 0;
        magnetOffsetY = 0;
      } else {
        animMagnet.style.transform = `translate3d(${magnetOffsetX}px, ${magnetOffsetY}px, 0)`;
      }
    }
    rafId = win.requestAnimationFrame(tick);
  }

  const onLeaveWindow = () => hide();

  doc.addEventListener('pointermove', onMove, { passive: true });
  doc.addEventListener('pointerleave', onLeaveWindow);
  win.addEventListener('blur', onLeaveWindow);

  function startLoop() {
    if (!rafId) rafId = win.requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (rafId) win.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function applyReduced(value) {
    reduced = value;
    if (reduced) {
      stopLoop();
      hide();
      unmount();
    } else {
      mount();
      startLoop();
    }
  }
  applyReduced(reduced);

  const mm = minderBeweging(applyReduced, doc);

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopLoop();
    mm.stop();
    doc.removeEventListener('pointermove', onMove);
    doc.removeEventListener('pointerleave', onLeaveWindow);
    win.removeEventListener('blur', onLeaveWindow);
    if (animMagnet) animMagnet.style.removeProperty('transform');
    unmount();
  };
}
