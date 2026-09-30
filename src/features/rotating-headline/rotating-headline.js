/**
 * rotating-headline
 * ------------------------------------------------------------------------
 * Eén woord in een kop wisselt om de zoveel tijd ("Wij zijn [Studio Wester /
 * Creëren / Bouwen]"), in vier varianten: `blinds`, `clip`, `slide`,
 * `typing`. De stage-breedte animeert mee naar de breedte van het nieuwe
 * woord (geen layout-sprong), pauzeert buiten beeld en op een verborgen
 * tabblad, en staat helemaal stil bij `prefers-reduced-motion: reduce` (dan
 * blijft het eerste woord gewoon staan). Vanilla ES-module, 0 dependencies,
 * SSR-veilig.
 *
 * Herkomst: eigen implementatie; "Wisselende kop" gezien bij meerdere
 * bureausites (Elementor Animated Headline, varianten blinds/clip) — met een
 * expliciete schermlezer-zin (Elementor's variant laat dat aan het thema
 * over) en een `typing`-variant met een per-woord `steps()`-reveal.
 *
 * @typedef {Object} RotatingHeadlineOptions
 * @property {'blinds'|'clip'|'slide'|'typing'} [variant] Overschrijft `data-rh-variant`.
 * @property {number} [interval] Tijd per woord in ms. Overschrijft `data-rh-interval`.
 * @property {number} [duration=420] Duur van de wissel-animatie in ms.
 *
 * @param {Element} root Het element met `data-rotating-headline`, bevat tekst + `.rh__stage` met `[data-rh-word]`-kinderen.
 * @param {RotatingHeadlineOptions} [options]
 * @returns {() => void} destroy — idempotent, herstelt de oorspronkelijke DOM.
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'rotating-headline')) return () => {};

  const stage = root.querySelector('.rh__stage');
  if (!stage) {
    if (typeof console !== 'undefined') console.warn('rotating-headline: geen .rh__stage gevonden — overgeslagen');
    return () => {};
  }

  const words = Array.from(stage.querySelectorAll('[data-rh-word]'));
  if (words.length === 0) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  // offsetWidth is een geheel getal (afgerond, soms naar beneden) — bij
  // overflow:hidden op de stage sneed dat de laatste letter van het woord
  // half weg ("bloemen" las als "bloemer"). getBoundingClientRect().width
  // is subpixel-precies; Math.ceil + 1px marge voorkomt dat afronding of
  // een cursieve/vette letter opnieuw tegen de rand aan schuurt.
  function wordWidth(word) {
    // +2 i.p.v. +1: gemeten (beta-herstel) dat een subpixel-afgeronde
    // layoutbreedte van de stage soms 0,1–0,2px onder de opgegeven
    // integer-pixelwaarde uitkomt (browser-rendering, niet deze berekening)
    // — iets meer marge voorkomt dat dat weer als clipping meet.
    return Math.ceil(word.getBoundingClientRect().width) + 2;
  }

  const variant = options.variant || root.getAttribute('data-rh-variant') || 'clip';
  const interval = Number(options.interval ?? root.getAttribute('data-rh-interval') ?? 2600);
  const duration = options.duration ?? 420;
  root.setAttribute('data-rh-variant', variant);
  // De wissel-opmaak (position:absolute + opacity:0 op elk woord) hoort
  // pas te gelden ná init — data-rh-variant staat vaak al in de HTML als
  // auteurshint, dus die kon niet als "is JS actief"-signaal dienen. Dit
  // attribuut bestaat uitsluitend hier (mirror van data-marquee-ready).
  root.setAttribute('data-rh-ready', '');

  // --- schermlezer: de hele zin één keer, met alle alternatieven ----------
  // Bouw de zin vóór we de DOM herstructureren (clone, niet de live root).
  const sentenceClone = root.cloneNode(true);
  const cloneStage = sentenceClone.querySelector('.rh__stage');
  if (cloneStage) cloneStage.textContent = words.map((w) => w.textContent.trim()).join(', ');
  const sentence = sentenceClone.textContent.replace(/\s+/g, ' ').trim();

  const visibleWrap = doc.createElement('span');
  visibleWrap.className = 'rh__visible';
  visibleWrap.setAttribute('aria-hidden', 'true');
  while (root.firstChild) visibleWrap.appendChild(root.firstChild);
  root.appendChild(visibleWrap);

  const srEl = doc.createElement('span');
  srEl.className = 'rh__sr-only';
  srEl.textContent = sentence;
  root.appendChild(srEl);

  // stage zat in visibleWrap na de verplaatsing hierboven.
  const stageEl = visibleWrap.querySelector('.rh__stage');

  for (const w of words) w.removeAttribute('hidden');
  let activeIndex = 0;
  words[0].setAttribute('data-rh-state', 'active');
  stageEl.style.width = `${wordWidth(words[0])}px`;

  // Echte oorzaak van de afgekapte laatste letter: op het eerste
  // meetmoment is het eigen webfont (bv. Bricolage Grotesque) vaak nog niet
  // geladen, dus meet wordWidth() de breedte in het fallback-lettertype. Zodra
  // het echte font arriveert, wordt de tekst breder — maar de vaste
  // stage-breedte stond al vast, dus schoof de laatste letter buiten het
  // (overflow:hidden) vak. Zodra fonts klaar zijn, opnieuw meten voor het
  // op dat moment actieve woord (niet als er intussen destroy() gebeurde).
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(() => {
      if (destroyed) return;
      // Direct, zonder de width-transitie: anders knipt het vak 0,35 s lang de
      // laatste letter af terwijl het naar de nieuwe breedte groeit (volle
      // meetreeks 25-09: 244 px vak om een woord van 248 px).
      const oudeTransitie = stageEl.style.transition;
      stageEl.style.transition = 'none';
      stageEl.style.width = `${wordWidth(words[activeIndex])}px`;
      void stageEl.offsetWidth;
      stageEl.style.transition = oudeTransitie;
    });
  }

  const reduced = minderBeweging((isReduced) => {
    if (isReduced) snapToFirst();
  }, doc);

  let timer = null;
  let inView = true;
  let tabVisible = doc.visibilityState !== 'hidden';
  let destroyed = false;

  function snapToFirst() {
    stopTimer();
    for (const w of words) {
      w.style.removeProperty('--rh-steps');
      w.removeAttribute('data-rh-state');
    }
    words[0].setAttribute('data-rh-state', 'active');
    activeIndex = 0;
    stageEl.style.transition = 'none';
    stageEl.style.width = `${wordWidth(words[0])}px`;
    // Volgende frame de transition weer aanzetten (niet de reset zelf animeren).
    win.requestAnimationFrame(() => { stageEl.style.transition = ''; });
  }

  function rotate() {
    if (destroyed || reduced.reduced) return;
    const nextIndex = (activeIndex + 1) % words.length;
    const current = words[activeIndex];
    const next = words[nextIndex];

    if (variant === 'typing') {
      // Bij typing zweeft de punt los: de "." ná de stage volgt de
      // stage-breedte. Bij de andere varianten mag die breedte meteen naar
      // de eindmaat van het nieuwe woord springen/animeren (het woord zelf
      // is al meteen volledig zichtbaar). Bij typing NIET: de tekst
      // verschijnt zelf pas geleidelijk (steps()), dus als de stage al op
      // zijn eindbreedte staat terwijl er nog maar twee letters "getypt"
      // zijn, zweeft de punt ver rechts van de zichtbare tekst. Daarom
      // laten we hier de stage-breedte zelf, met dezelfde steps()-curve als
      // de tekstopbouw, meegroeien van de oude naar de nieuwe breedte — de
      // "." schuift dan in exact hetzelfde tempo mee als de laatste
      // zichtbare letter (zie de bijbehorende @keyframes in de CSS).
      const steps = next.textContent.trim().length || 1;
      next.style.setProperty('--rh-steps', String(steps));
      stageEl.style.setProperty('--rh-from-width', `${stageEl.getBoundingClientRect().width}px`);
      stageEl.style.setProperty('--rh-to-width', `${wordWidth(next)}px`);
      stageEl.style.setProperty('--rh-steps', String(steps));
    } else {
      next.style.setProperty('--rh-steps', String(next.textContent.trim().length || 1));
      stageEl.style.width = `${wordWidth(next)}px`;
    }

    current.setAttribute('data-rh-state', 'leaving');
    next.setAttribute('data-rh-state', 'entering');

    const onCurrentEnd = () => {
      current.removeEventListener('animationend', onCurrentEnd);
      current.removeAttribute('data-rh-state');
    };
    const onNextEnd = () => {
      next.removeEventListener('animationend', onNextEnd);
      next.setAttribute('data-rh-state', 'active');
    };
    current.addEventListener('animationend', onCurrentEnd);
    next.addEventListener('animationend', onNextEnd);

    activeIndex = nextIndex;
  }

  function startTimer() {
    if (timer || reduced.reduced || words.length < 2) return;
    timer = win.setInterval(rotate, interval);
  }
  function stopTimer() {
    if (timer) { win.clearInterval(timer); timer = null; }
  }
  function syncTimer() {
    if (inView && tabVisible && !reduced.reduced) startTimer();
    else stopTimer();
  }

  // Let op: bewust géén basis.js `inBeeld()` hier — die roept de callback
  // uitsluitend aan bij het ín beeld komen (voor reveal-achtige features),
  // nooit bij het uit beeld gaan. Voor pauzeren/hervatten is precies dat
  // tweede geval nodig, dus een eigen IntersectionObserver.
  let observer = null;
  if ('IntersectionObserver' in win) {
    observer = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) inView = entry.isIntersecting;
        syncTimer();
      },
      { threshold: 0.2 }
    );
    observer.observe(root);
  }
  const stopObserve = () => { if (observer) observer.disconnect(); };

  const onVisibility = () => { tabVisible = doc.visibilityState !== 'hidden'; syncTimer(); };
  doc.addEventListener('visibilitychange', onVisibility);

  // Geen synchrone syncTimer() hier: de IntersectionObserver hierboven
  // levert zijn eerste (echte) staat vanzelf async, kort na observe(). Zo
  // start de timer nooit even ten onrechte vóórdat de echte in-beeld-staat
  // bekend is. Zonder IntersectionObserver-support (zeer oude browser)
  // blijft `inView` op zijn standaard `true` staan — dan draait de timer
  // gewoon door, geen observer om op te pauzeren.
  if (!observer && !reduced.reduced) syncTimer();

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopTimer();
    stopObserve();
    doc.removeEventListener('visibilitychange', onVisibility);
    reduced.stop();

    // DOM herstellen: woorden terug in root, wrapper/sr-tekst weg.
    for (const w of words) {
      w.style.removeProperty('--rh-steps');
      w.removeAttribute('data-rh-state');
    }
    while (visibleWrap.firstChild) root.appendChild(visibleWrap.firstChild);
    visibleWrap.remove();
    srEl.remove();
    root.removeAttribute('data-rh-variant');
    root.removeAttribute('data-rh-ready');
    stageEl.style.removeProperty('width');
    stageEl.style.removeProperty('transition');
    stageEl.style.removeProperty('--rh-from-width');
    stageEl.style.removeProperty('--rh-to-width');
  };
}
