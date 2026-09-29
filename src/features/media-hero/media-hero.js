/**
 * heroes/media-hero
 * ------------------------------------------------------------------------
 * Hero met bewegend achtergrondbeeld, in twee varianten (`data-modus`):
 *  - "video": achtergrondvideo met mobiele bron, poster, muted/playsinline
 *    en een zichtbare pauzeknop (WCAG 2.2.2 Pause, Stop, Hide).
 *  - "diashow": Ken Burns-diashow (fade + langzame zoom).
 *
 * Beide varianten pauzeren zodra de hero buiten beeld scrolt of het
 * browsertabblad verborgen is, en spelen nooit af bij
 * `prefers-reduced-motion: reduce` (dan blijft het eerste beeld/de poster
 * gewoon stilstaan). Een handmatige pauze via de knop weegt zwaarder dan
 * "weer in beeld" — de bezoeker houdt de regie.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt `window`/`document`
 * pas aan binnen `init()`).
 *
 * @param {Element} root Element met `data-media-hero` en `data-modus="video"|"diashow"`.
 * @param {{ modus?: 'video'|'diashow', diaInterval?: number }} [opties] `diaInterval` in ms, standaard 6000.
 * @returns {() => void} destroy — stopt observers/timers/listeners, zet status terug. Idempotent.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

const STATUS_ATTR = 'data-mh-status';
const ACTIEF_CLASS = 'is-actief';

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'media-hero')) return () => {};
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const modus = opties.modus || root.getAttribute('data-modus') || 'video';
  const pauzeKnop = root.querySelector('[data-mh-pauze]');

  const cleanups = [];
  let destroyed = false;
  let gebruikerWilPauze = false;
  let buitenBeeld = false;
  let reduced = false;

  const engine =
    modus === 'diashow'
      ? maakDiashowEngine(root, doc, win, opties.diaInterval)
      : maakVideoEngine(root, doc, win);

  function updateStatus() {
    if (destroyed) return;
    const moetSpelen = !gebruikerWilPauze && !buitenBeeld && !reduced;
    root.setAttribute(STATUS_ATTR, moetSpelen ? 'speelt' : 'gepauzeerd');
    if (pauzeKnop) {
      pauzeKnop.setAttribute('aria-pressed', String(gebruikerWilPauze));
      pauzeKnop.textContent = gebruikerWilPauze ? 'Hervat achtergrond' : 'Pauzeer achtergrond';
    }
    engine.stel(moetSpelen);
  }

  if (pauzeKnop) {
    const onClick = () => {
      gebruikerWilPauze = !gebruikerWilPauze;
      updateStatus();
    };
    pauzeKnop.addEventListener('click', onClick);
    cleanups.push(() => pauzeKnop.removeEventListener('click', onClick));
  }

  // Eigen IntersectionObserver (niet basis.js `inBeeld`): die helper vuurt
  // alleen op "in beeld" (voor reveal-patronen) en ontkoppelt na de eerste
  // keer — hier is juist de "uit beeld"-kant net zo belangrijk (R18).
  if ('IntersectionObserver' in win) {
    const io = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) buitenBeeld = !entry.isIntersecting;
        updateStatus();
      },
      { threshold: 0.15 },
    );
    io.observe(root);
    cleanups.push(() => io.disconnect());
  }

  const onVisibility = () => {
    buitenBeeld = doc.visibilityState === 'hidden' ? true : buitenBeeld;
    updateStatus();
  };
  doc.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => doc.removeEventListener('visibilitychange', onVisibility));

  const motion = minderBeweging((isReduced) => {
    reduced = isReduced;
    updateStatus();
  }, doc);
  reduced = motion.reduced;
  cleanups.push(motion.stop);

  updateStatus();

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const fn of cleanups) fn();
    engine.destroy();
    root.removeAttribute(STATUS_ATTR);
  };
}

/** Video-engine: play()/pause() op de <video>, met nette omgang met een afgewezen play()-Promise (autoplaybeleid). */
function maakVideoEngine(root, doc) {
  const video = root.querySelector('.mh__video');
  return {
    stel(afspelen) {
      if (!video) return;
      if (afspelen) {
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {}); // autoplay geblokkeerd — poster/laatste frame blijft gewoon staan
      } else {
        video.pause();
      }
    },
    destroy() {
      if (video) video.pause();
    },
  };
}

/** Diashow-engine (Ken Burns): wisselt om beurten `.is-actief` op de `.mh__dia`-elementen. CSS doet de fade+zoom. */
function maakDiashowEngine(root, doc, win, interval = 6000) {
  const dias = Array.from(root.querySelectorAll('.mh__dia'));
  let index = dias.findIndex((d) => d.classList.contains(ACTIEF_CLASS));
  if (index === -1 && dias.length) {
    index = 0;
    dias[0].classList.add(ACTIEF_CLASS);
  }
  let timer = 0;

  function volgende() {
    if (dias.length < 2) return;
    dias[index].classList.remove(ACTIEF_CLASS);
    index = (index + 1) % dias.length;
    dias[index].classList.add(ACTIEF_CLASS);
  }

  return {
    stel(afspelen) {
      if (afspelen && !timer && dias.length > 1) {
        timer = win.setInterval(volgende, interval);
      } else if (!afspelen && timer) {
        win.clearInterval(timer);
        timer = 0;
      }
    },
    destroy() {
      if (timer) win.clearInterval(timer);
      timer = 0;
    },
  };
}
