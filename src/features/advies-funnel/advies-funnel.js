/**
 * advies-funnel
 * ------------------------------------------------------------------------
 * Motor achter elke vragenlijst-met-advies: configurator, prijscalculator,
 * ja/nee-check. Vragen (enkel/meerkeuze, overslaanbaar, voorwaardelijk),
 * advies (regels in JSON) en de afsluitende call-to-action komen allemaal
 * uit één JSON-config — zie `configs/*.json` voor drie werkende voorbeelden
 * (websitepakket, prijscalculator, ja/nee-check).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @typedef {Object} AdviesFunnelOptie
 * @property {string} waarde
 * @property {string} label
 *
 * @typedef {Object} AdviesFunnelVoorwaarde
 * @property {string} vraag Id van een eerdere vraag.
 * @property {string|string[]} waarde Verwachte waarde(n).
 *
 * @typedef {Object} AdviesFunnelVraag
 * @property {string} id
 * @property {string} vraag Vraagtekst.
 * @property {'enkel'|'meer'} type
 * @property {AdviesFunnelOptie[]} opties
 * @property {boolean} [optioneel] Toont een "Overslaan"-knop, geen verplichte keuze.
 * @property {AdviesFunnelVoorwaarde} [voorwaarde] Alleen tonen als dit klopt.
 *
 * @typedef {Object} AdviesFunnelRegel
 * @property {Object<string, string|string[]>} [als] Alle sleutels moeten kloppen.
 * @property {boolean} [default] Terugvaloptie als niets anders matcht.
 * @property {string} pakket
 * @property {string} prijsIndicatie
 * @property {string} uitleg
 *
 * @typedef {Object} AdviesFunnelConfig
 * @property {string} id Unieke sleutel, gebruikt voor het opslaan van de voortgang.
 * @property {string} titel
 * @property {AdviesFunnelVraag[]} vragen
 * @property {AdviesFunnelRegel[]} advies
 * @property {Object} cta {type:'link'|'datumtijd'|'formulier', ...}
 *
 * @module advies-funnel
 */
import { minderBeweging, veiligeOpslag, vereisRoot } from '../../_kwaliteit/basis.js';

const LAAD_MS = 800; // ruim onder de eis van max 1,2s

/**
 * @param {Element} root
 * @param {AdviesFunnelConfig} config
 * @param {object} [options]
 * @param {(data: Record<string, unknown>) => void} [options.onSubmit] Voor cta.type "formulier".
 * @param {(iso: string, data: Record<string, unknown>) => void} [options.onBooking] Voor cta.type "datumtijd".
 * @returns {() => void} destroy
 */
export function init(root, config, options = {}) {
  if (!vereisRoot(root, 'advies-funnel')) return () => {};
  if (!config || !Array.isArray(config.vragen) || !Array.isArray(config.advies) || !config.id) {
    console.warn('advies-funnel: init(root, config) mist vragen/advies/id — overgeslagen');
    return () => {};
  }

  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!doc || !win) return () => {};

  const storage = veiligeOpslag('session', doc);
  const storageKey = `af:${config.id}`;

  let state = restoreState() || freshState();
  let destroyed = false;
  let laadTimerId = 0;
  let headingFocusTarget = null;
  let eersteRenderGedaan = false; // H5: niet focussen/scrollen bij het allereerste render

  function freshState() {
    return { fase: 'vraag', stapIndex: 0, antwoorden: {}, ctaStatus: 'idle' };
  }

  function persist() {
    storage.set(storageKey, JSON.stringify(state));
  }

  function restoreState() {
    const raw = storage.get(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.antwoorden) return parsed;
    } catch { /* corrupte staat: gewoon opnieuw beginnen */ }
    return null;
  }

  // ---------------------------------------------------------------------
  // Regels: voorwaarden + advies delen dezelfde matcher.
  // ---------------------------------------------------------------------
  function matchWaarde(gegeven, verwacht) {
    if (gegeven === undefined || gegeven === null) return false;
    const gegevenIsLijst = Array.isArray(gegeven);
    const verwachtIsLijst = Array.isArray(verwacht);
    if (verwachtIsLijst) {
      return gegevenIsLijst ? verwacht.some((v) => gegeven.includes(v)) : verwacht.includes(gegeven);
    }
    return gegevenIsLijst ? gegeven.includes(verwacht) : gegeven === verwacht;
  }

  function vraagIsActief(vraag) {
    if (!vraag.voorwaarde) return true;
    return matchWaarde(state.antwoorden[vraag.voorwaarde.vraag], vraag.voorwaarde.waarde);
  }

  function actieveVragen() {
    return config.vragen.filter(vraagIsActief);
  }

  function bepaalAdvies() {
    const regel = config.advies.find(
      (r) => !r.default && r.als && Object.entries(r.als).every(([k, v]) => matchWaarde(state.antwoorden[k], v))
    );
    return regel || config.advies.find((r) => r.default) || config.advies[config.advies.length - 1];
  }

  // ---------------------------------------------------------------------
  // DOM-skelet (één keer)
  // ---------------------------------------------------------------------
  const widget = doc.createElement('div');
  widget.className = 'af-widget';
  const progressWrap = doc.createElement('div');
  progressWrap.className = 'af-progress';
  progressWrap.hidden = true;
  const progressBar = doc.createElement('div');
  progressBar.className = 'af-progress-bar';
  progressWrap.appendChild(progressBar);
  const stapTekst = doc.createElement('p');
  stapTekst.className = 'af-stap-tekst';
  const stage = doc.createElement('div');
  stage.className = 'af-stage';
  widget.append(progressWrap, stapTekst, stage);
  root.appendChild(widget);

  // G6: een voorwaardelijke vraag kan pas ná een gegeven antwoord actief
  // worden, waardoor het totaal kan groeien ("Stap 1 van 2" → "Stap 2 van
  // 3" — oneerlijk, want het cijfer dat al getoond was bleek niet te
  // kloppen). Toon het totaal daarom pas zodra elke voorwaarde in de
  // config is beslist door een al gegeven antwoord; daarna staat het vast.
  function vraagIsBeslist(vraag) {
    if (!vraag.voorwaarde) return true;
    return Object.prototype.hasOwnProperty.call(state.antwoorden, vraag.voorwaarde.vraag);
  }

  function bekendTotaal() {
    if (!config.vragen.every(vraagIsBeslist)) return null;
    return actieveVragen().length;
  }

  function setProgress(huidig, totaal) {
    if (totaal === null) {
      progressWrap.hidden = true;
      stapTekst.hidden = false;
      stapTekst.textContent = `Stap ${huidig}`;
      return;
    }
    if (totaal <= 1) {
      progressWrap.hidden = true;
      stapTekst.hidden = true;
      return;
    }
    progressWrap.hidden = false;
    stapTekst.hidden = false;
    progressBar.style.width = `${Math.round((huidig / totaal) * 100)}%`;
    stapTekst.textContent = `Stap ${huidig} van ${totaal}`;
  }

  function focusHeading() {
    if (headingFocusTarget) headingFocusTarget.focus();
  }

  // ---------------------------------------------------------------------
  // Renderen
  // ---------------------------------------------------------------------
  function render() {
    stage.innerHTML = '';
    if (state.fase === 'vraag') renderVraag();
    else if (state.fase === 'laden') renderLaden();
    else renderSamenvatting();
    persist();
    // H5: bij de eerste render (init, of een pagina-herlaad met bewaarde
    // voortgang) mag de pagina niet naar de funnel springen — alleen een
    // stapwissel die de bezoeker zelf veroorzaakt (Volgende/Terug) verplaatst
    // de focus.
    if (eersteRenderGedaan) {
      win.requestAnimationFrame ? win.requestAnimationFrame(focusHeading) : focusHeading();
    } else {
      eersteRenderGedaan = true;
    }
  }

  function renderVraag() {
    const vragen = actieveVragen();
    if (state.stapIndex >= vragen.length) {
      state.stapIndex = Math.max(0, vragen.length - 1);
    }
    const vraag = vragen[state.stapIndex];
    if (!vraag) {
      goNaarLaden();
      return;
    }
    setProgress(state.stapIndex + 1, bekendTotaal());

    const fieldset = doc.createElement('fieldset');
    fieldset.className = 'af-vraag';
    const legend = doc.createElement('legend');
    legend.className = 'af-legend';
    legend.id = 'af-vraag-heading';
    // De focus gaat naar een span ín de legend: Firefox kan een <legend> niet focussen, ook niet
    // met tabindex -1 (gemeten 26-09: focus viel na "Volgende" terug op <body>).
    const legendTekst = doc.createElement('span');
    legendTekst.className = 'af-legend-tekst';
    legendTekst.tabIndex = -1;
    legendTekst.textContent = vraag.vraag;
    legend.appendChild(legendTekst);
    headingFocusTarget = legendTekst;
    fieldset.appendChild(legend);

    const groep = doc.createElement('div');
    groep.className = 'af-opties';
    const huidigeWaarde = state.antwoorden[vraag.id];
    vraag.opties.forEach((optie) => {
      const label = doc.createElement('label');
      label.className = 'af-keuze';
      const input = doc.createElement('input');
      input.type = vraag.type === 'meer' ? 'checkbox' : 'radio';
      input.name = `af-${vraag.id}`;
      input.value = optie.waarde;
      if (vraag.type === 'meer') {
        input.checked = Array.isArray(huidigeWaarde) && huidigeWaarde.includes(optie.waarde);
      } else {
        input.checked = huidigeWaarde === optie.waarde;
      }
      input.addEventListener('change', () => onAntwoordWijzigt(vraag, optie, input));
      const tekst = doc.createElement('span');
      tekst.textContent = optie.label;
      label.append(input, tekst);
      groep.appendChild(label);
    });
    fieldset.appendChild(groep);
    stage.appendChild(fieldset);

    const actions = doc.createElement('div');
    actions.className = 'af-actions';
    if (state.stapIndex > 0) {
      const backBtn = doc.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'af-back';
      backBtn.textContent = 'Terug';
      backBtn.addEventListener('click', goBack);
      actions.appendChild(backBtn);
    }
    if (vraag.optioneel) {
      const skipBtn = doc.createElement('button');
      skipBtn.type = 'button';
      skipBtn.className = 'af-skip';
      skipBtn.textContent = 'Overslaan';
      skipBtn.addEventListener('click', () => goNext(vraag, true));
      actions.appendChild(skipBtn);
    }
    const nextBtn = doc.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'af-next';
    nextBtn.textContent = state.stapIndex === vragen.length - 1 ? 'Bekijk advies' : 'Volgende';
    nextBtn.addEventListener('click', () => goNext(vraag, false));
    actions.appendChild(nextBtn);

    const errorEl = doc.createElement('p');
    errorEl.className = 'af-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.id = 'af-vraag-fout';

    stage.appendChild(actions);
    stage.appendChild(errorEl);
  }

  function onAntwoordWijzigt(vraag, optie, input) {
    if (vraag.type === 'meer') {
      const huidig = Array.isArray(state.antwoorden[vraag.id]) ? state.antwoorden[vraag.id].slice() : [];
      const idx = huidig.indexOf(optie.waarde);
      if (input.checked && idx === -1) huidig.push(optie.waarde);
      if (!input.checked && idx !== -1) huidig.splice(idx, 1);
      state.antwoorden[vraag.id] = huidig;
    } else {
      state.antwoorden[vraag.id] = optie.waarde;
    }
    persist();
  }

  function renderLaden() {
    const el = doc.createElement('div');
    el.className = 'af-laden';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.id = 'af-vraag-heading';
    el.tabIndex = -1;
    el.innerHTML = '<span class="af-spinner" aria-hidden="true"></span> Advies wordt berekend…';
    headingFocusTarget = el;
    stage.appendChild(el);
    progressWrap.hidden = true;
    stapTekst.hidden = true;

    const reduced = minderBeweging(null, doc).reduced;
    const wachttijd = reduced ? 0 : LAAD_MS;
    laadTimerId = win.setTimeout(() => {
      laadTimerId = 0;
      state.fase = 'klaar';
      state.stapIndex = 0;
      render();
    }, wachttijd);
  }

  function renderSamenvatting() {
    const advies = bepaalAdvies();
    const wrap = doc.createElement('div');
    wrap.className = 'af-samenvatting';

    const heading = doc.createElement('h2');
    heading.className = 'af-advies-heading';
    heading.id = 'af-vraag-heading';
    heading.tabIndex = -1;
    heading.textContent = advies.pakket;
    headingFocusTarget = heading;

    const prijs = doc.createElement('p');
    prijs.className = 'af-advies-prijs';
    prijs.textContent = advies.prijsIndicatie;

    const uitleg = doc.createElement('p');
    uitleg.className = 'af-advies-uitleg';
    uitleg.textContent = advies.uitleg;

    const lijst = doc.createElement('dl');
    lijst.className = 'af-antwoorden-lijst';
    actieveVragen().forEach((vraag) => {
      const waarde = state.antwoorden[vraag.id];
      if (waarde === undefined) return;
      const dt = doc.createElement('dt');
      dt.textContent = vraag.vraag;
      const dd = doc.createElement('dd');
      dd.textContent = labelVoor(vraag, waarde);
      lijst.append(dt, dd);
    });

    const backBtn = doc.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'af-back';
    backBtn.textContent = 'Terug naar de vragen';
    backBtn.addEventListener('click', () => {
      state.fase = 'vraag';
      state.stapIndex = Math.max(0, actieveVragen().length - 1);
      render();
    });

    wrap.append(heading, prijs, uitleg, lijst, backBtn, renderCta(advies));
    stage.appendChild(wrap);
    progressWrap.hidden = true;
    stapTekst.hidden = true;
  }

  function labelVoor(vraag, waarde) {
    const waarden = Array.isArray(waarde) ? waarde : [waarde];
    return waarden
      .map((w) => (vraag.opties.find((o) => o.waarde === w) || {}).label || w)
      .join(', ');
  }

  function renderCta(advies) {
    const cta = config.cta || {};
    const wrap = doc.createElement('div');
    wrap.className = 'af-cta';
    if (cta.heading) {
      const h3 = doc.createElement('h3');
      h3.textContent = cta.heading;
      wrap.appendChild(h3);
    }

    if (cta.type === 'link') {
      const a = doc.createElement('a');
      a.className = 'af-cta-link';
      a.href = cta.href || '#';
      a.textContent = cta.label || 'Meer weten';
      wrap.appendChild(a);
      return wrap;
    }

    if (cta.type === 'datumtijd') {
      const form = doc.createElement('form');
      form.className = 'af-cta-form';
      form.noValidate = true;
      const dateInput = doc.createElement('input');
      dateInput.type = 'date';
      dateInput.required = true;
      dateInput.className = 'af-cta-date';
      dateInput.setAttribute('aria-label', 'Datum');
      const timeInput = doc.createElement('input');
      timeInput.type = 'time';
      timeInput.required = true;
      timeInput.className = 'af-cta-time';
      timeInput.setAttribute('aria-label', 'Tijd');
      const submitBtn = doc.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.textContent = cta.label || 'Bevestig afspraak';
      const feedback = doc.createElement('p');
      feedback.className = 'af-cta-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      form.append(dateInput, timeInput, submitBtn, feedback);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!dateInput.value || !timeInput.value) return;
        const iso = `${dateInput.value}T${timeInput.value}`;
        if (typeof options.onBooking === 'function') options.onBooking(iso, { ...state.antwoorden, advies });
        feedback.textContent = cta.bevestiging || 'Afspraak bevestigd.';
        form.querySelectorAll('input,button').forEach((el) => { el.disabled = true; });
      });
      wrap.appendChild(form);
      return wrap;
    }

    if (cta.type === 'formulier') {
      const form = doc.createElement('form');
      form.className = 'af-cta-form';
      form.noValidate = true;
      (cta.velden || []).forEach((veld) => {
        const label = doc.createElement('label');
        label.textContent = veld.label;
        const input = doc.createElement('input');
        input.type = veld.type || 'text';
        input.name = veld.name;
        input.required = !!veld.required;
        label.appendChild(input);
        form.appendChild(label);
      });
      const submitBtn = doc.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.textContent = cta.verstuur || 'Versturen';
      const feedback = doc.createElement('p');
      feedback.className = 'af-cta-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      form.append(submitBtn, feedback);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = { advies, antwoorden: { ...state.antwoorden } };
        let valide = true;
        Array.from(form.elements).forEach((el) => {
          if (el.name) {
            data[el.name] = el.value;
            if (el.required && !el.value.trim()) valide = false;
          }
        });
        if (!valide) {
          feedback.textContent = 'Vul alle verplichte velden in.';
          return;
        }
        if (typeof options.onSubmit === 'function') options.onSubmit(data);
        feedback.textContent = cta.bevestiging || 'Verzonden.';
        Array.from(form.elements).forEach((el) => { el.disabled = true; });
      });
      wrap.appendChild(form);
      return wrap;
    }

    return wrap;
  }

  // ---------------------------------------------------------------------
  // Navigatie
  // ---------------------------------------------------------------------
  function goNext(vraag, viaSkip) {
    if (!viaSkip && !vraag.optioneel) {
      const waarde = state.antwoorden[vraag.id];
      const leeg = vraag.type === 'meer' ? !Array.isArray(waarde) || waarde.length === 0 : !waarde;
      if (leeg) {
        const errEl = stage.querySelector('.af-error');
        // L14: dit pad geldt alleen voor verplichte vragen (!vraag.optioneel), dus de
        // "Overslaan"-knop bestaat hier per definitie niet — de tekst mag er niet naar verwijzen.
        if (errEl) errEl.textContent = 'Kies een antwoord om verder te gaan.';
        return;
      }
    }
    const vragen = actieveVragen();
    if (state.stapIndex < vragen.length - 1) {
      state.stapIndex += 1;
      render();
    } else {
      goNaarLaden();
    }
  }

  function goBack() {
    if (state.stapIndex > 0) {
      state.stapIndex -= 1;
      render();
    }
  }

  function goNaarLaden() {
    state.fase = 'laden';
    render();
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  render();

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (laadTimerId) win.clearTimeout(laadTimerId);
    widget.remove();
  }

  return destroy;
}

/** Wist de opgeslagen voortgang van een funnel (handig voor "opnieuw beginnen"). */
export function wisVoortgang(configId, doc) {
  veiligeOpslag('session', doc).del(`af:${configId}`);
}
