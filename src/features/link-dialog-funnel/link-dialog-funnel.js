/**
 * Link Dialog Funnel
 * ===================
 * Onderschept links naar een aanvraagpagina ("...aanvraag..." of "?interesse=...") en
 * opent in plaats daarvan een native <dialog> met een korte, stapsgewijze aanvraag-funnel
 * waarin de interesse al is voorgeselecteerd. Zonder JavaScript doet de link gewoon wat een
 * link doet: navigeren naar de echte aanvraagpagina (progressive enhancement — er draait hier
 * geen enkele regel code totdat init() wordt aangeroepen).
 *
 * Eigen implementatie.
 *
 * Gebruik:
 *   import { init } from './link-dialog-funnel.js';
 *   const destroy = init(document.body, { interests: [...], onSubmit: async (data) => {...} });
 *   // later, bv. bij het verlaten van de pagina in een SPA:
 *   destroy();
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt `window`/`document` pas aan in init()).
 *
 * @module link-dialog-funnel
 */

import { zonderUndefined } from '../../_kwaliteit/basis.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Eén instance per root-element, zodat init() idempotent herroepbaar is. */
const instances = new WeakMap();

/** Standaardteksten (Nederlands). Overschrijf via options.texts. */
const DEFAULT_TEXTS = {
  heading: 'Aanvraag',
  interestLegend: 'Waar ben je benieuwd naar?',
  progress: 'Stap {current} van {total}',
  next: 'Volgende',
  back: 'Terug',
  submit: 'Versturen',
  submitting: 'Bezig met versturen…',
  close: 'Sluiten',
  successTitle: 'Bedankt, je aanvraag is binnen.',
  successBody: 'We nemen zo snel mogelijk contact met je op.',
  errorTitle: 'Versturen lukte niet.',
  errorBody: 'Probeer het opnieuw of mail ons rechtstreeks op',
  privacyText: 'We gebruiken je gegevens alleen om te reageren op je aanvraag, zie het',
  privacyLinkLabel: 'privacybeleid',
  requiredError: 'Dit veld is verplicht.',
  emailError: 'Vul een geldig e-mailadres in.',
  chooseInterestError: 'Kies waar je benieuwd naar bent.',
};

/** Standaardconfiguratie. Alles hieronder is te overschrijven via options. */
const DEFAULT_OPTIONS = {
  // Welke links de dialoog openen. Standaard: href bevat "aanvraag" of "interesse=".
  linkMatch(href) {
    return href.includes('aanvraag') || href.includes('interesse=');
  },
  // Naam van de querystring-parameter waaruit de voorgeselecteerde interesse komt.
  interestParam: 'interesse',
  // Hash die bij laden/hashchange de dialoog ook opent (zoals #aanvraag).
  hashTrigger: '#aanvraag',
  // Naam van het honeypot-veld. Gevuld => stille weigering, geen onSubmit.
  honeypotName: '_gotcha',
  // class op het <dialog>-element, handig om te stylen of te selecteren in tests.
  dialogClass: 'ldf-dialog',
  // De interesses waartussen gekozen kan worden op stap 1.
  interests: [
    { id: 'demo', label: 'Een demo' },
    { id: 'prijzen', label: 'Prijzen' },
    { id: 'anders', label: 'Iets anders' },
  ],
  // Extra, interesse-specifieke stap vóór het contactblok. Key = interest-id.
  // { heading, fields: [ fieldDef, ... ] }
  extraSteps: {},
  // Velden van de (altijd aanwezige, altijd laatste) contactstap.
  // Een veld met `onlyFor: [ids]` wordt alleen getoond/verplicht voor die interesses.
  contactFields: [
    { name: 'naam', type: 'text', label: 'Naam', required: true, autoComplete: 'name' },
    { name: 'email', type: 'email', label: 'E-mail', required: true, autoComplete: 'email' },
    { name: 'toelichting', type: 'textarea', label: 'Korte toelichting', required: true },
  ],
  // Alle teksten, zie DEFAULT_TEXTS hierboven voor de sleutels.
  texts: DEFAULT_TEXTS,
  // Actie-URL voor de progressive-enhancement-fallback van het <form>-element
  // (wordt ook gebruikt als eindpunt wanneer er geen onSubmit is opgegeven).
  action: null,
  // async (data) => void | Promise. Krijgt een plat object { veldnaam: waarde, interesse }.
  // Als niet opgegeven en er is een `action`, doet de funnel zelf een fetch() ernaartoe.
  onSubmit: null,
  // href voor de privacyverklaring-link onder het formulier.
  privacyHref: '/privacy',
  // Mailadres dat getoond wordt als het versturen mislukt (leeg = geen mailto-uitweg).
  supportEmail: '',
  // Toon "Stap X van Y" boven het formulier zodra er meer dan 1 stap is. Standaard aan (bestaand
  // gedrag); zet op `false` om de stapteller te verbergen.
  showStepCount: true,
  // Toon de privacyregel op élke stap, niet alleen de laatste. Standaard uit (bestaand gedrag:
  // alleen op de laatste/contact-stap).
  privacyOnEveryStep: false,
};

/**
 * Initialiseert de link-dialog-funnel op `root`.
 *
 * @param {Element|Document} root - Element (of document) waarbinnen op links wordt geluisterd.
 *   De dialoog zelf wordt toegevoegd aan root.ownerDocument.body (of root.body als root de
 *   document zelf is).
 * @param {object} [options] - zie DEFAULT_OPTIONS hierboven.
 * @returns {() => void} destroy - ruimt listeners en DOM op. Idempotent: een tweede init()
 *   op dezelfde root roept eerst automatisch de vorige destroy() aan.
 */
export function init(root, options = {}) {
  if (!root || typeof root.addEventListener !== 'function') {
    throw new TypeError(
      'link-dialog-funnel: init(root, options) heeft een Element of Document nodig als eerste argument.'
    );
  }

  // Idempotent: bestaande instance op dezelfde root eerst netjes afbreken.
  if (instances.has(root)) {
    instances.get(root)();
  }

  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const win = doc.defaultView;
  if (!doc || !win) {
    throw new TypeError('link-dialog-funnel: root heeft geen ownerDocument/defaultView (geen browseromgeving?).');
  }

  const config = mergeConfig(DEFAULT_OPTIONS, options);
  const docBody = doc.body || (root.nodeType === 9 ? null : root);

  // ---- gebouwde DOM (lazy: pas bij de eerste keer openen) ----
  let dialogEl = null;
  let formEl = null;
  let headingEl = null;
  let progressEl = null;
  let interestFieldset = null;
  let extraFieldset = null;
  let contactContainer = null;
  let actionsEl = null;
  let backBtn = null;
  let submitBtn = null;
  let privacyEl = null;
  let errorEl = null;
  let successEl = null;
  let closeBtn = null;
  let honeypotInput = null;

  // ---- funnel-state ----
  let state = null;
  let openerEl = null;

  function freshState(interestId) {
    return {
      interestId: interestId || '',
      stepIndex: isValidInterest(interestId) ? 1 : 0,
      errors: {},
      status: 'idle', // idle | submitting | success | error
    };
  }

  function isValidInterest(id) {
    return !!id && config.interests.some((i) => i.id === id);
  }

  function activeSteps() {
    const steps = [{ kind: 'interest' }];
    const extra = config.extraSteps[state.interestId];
    if (extra) steps.push({ kind: 'extra', def: extra });
    steps.push({ kind: 'contact' });
    return steps;
  }

  function extractInterest(href) {
    try {
      const url = new win.URL(href, win.location.origin);
      return url.searchParams.get(config.interestParam) || '';
    } catch {
      return '';
    }
  }

  // ---------------------------------------------------------------------
  // DOM opbouw (één keer)
  // ---------------------------------------------------------------------

  function ensureDialog() {
    if (dialogEl) return;

    dialogEl = doc.createElement('dialog');
    dialogEl.className = config.dialogClass;
    dialogEl.setAttribute('aria-labelledby', 'ldf-heading');

    const panel = doc.createElement('div');
    panel.className = 'ldf-panel';

    closeBtn = doc.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ldf-close';
    closeBtn.setAttribute('aria-label', config.texts.close);
    closeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    closeBtn.addEventListener('click', () => dialogEl.close());

    formEl = doc.createElement('form');
    formEl.className = 'ldf-form';
    formEl.noValidate = true;
    if (config.action) formEl.action = config.action;
    formEl.method = 'post';

    // Honeypot: onzichtbaar voor mensen, wel bereikbaar voor formulier-bots.
    const hpWrap = doc.createElement('div');
    hpWrap.className = 'ldf-hp';
    hpWrap.setAttribute('aria-hidden', 'true');
    const hpLabel = doc.createElement('label');
    hpLabel.setAttribute('for', 'ldf-hp-field');
    hpLabel.textContent = 'Laat dit veld leeg';
    honeypotInput = doc.createElement('input');
    honeypotInput.type = 'text';
    honeypotInput.id = 'ldf-hp-field';
    honeypotInput.name = config.honeypotName;
    honeypotInput.tabIndex = -1;
    honeypotInput.autocomplete = 'off';
    hpWrap.append(hpLabel, honeypotInput);

    const head = doc.createElement('div');
    head.className = 'ldf-head';
    headingEl = doc.createElement('h2');
    headingEl.id = 'ldf-heading';
    headingEl.className = 'ldf-heading';
    progressEl = doc.createElement('p');
    progressEl.className = 'ldf-progress';
    head.append(headingEl, progressEl);

    interestFieldset = doc.createElement('fieldset');
    interestFieldset.className = 'ldf-step ldf-step-interest';
    const legend = doc.createElement('legend');
    legend.className = 'ldf-sr-only';
    legend.textContent = config.texts.interestLegend;
    interestFieldset.append(legend);

    extraFieldset = doc.createElement('fieldset');
    extraFieldset.className = 'ldf-step ldf-step-extra';

    contactContainer = doc.createElement('div');
    contactContainer.className = 'ldf-step ldf-step-contact';

    actionsEl = doc.createElement('div');
    actionsEl.className = 'ldf-actions';
    backBtn = doc.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'ldf-back';
    backBtn.textContent = config.texts.back;
    backBtn.addEventListener('click', goBack);
    submitBtn = doc.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'ldf-submit';
    actionsEl.append(backBtn, submitBtn);

    privacyEl = doc.createElement('p');
    privacyEl.className = 'ldf-privacy';
    privacyEl.id = 'ldf-privacy';
    privacyEl.innerHTML = `${escapeHtml(config.texts.privacyText)} <a href="${escapeAttr(
      config.privacyHref || '/privacy'
    )}" class="ldf-privacy-link">${escapeHtml(config.texts.privacyLinkLabel)}</a>.`;

    errorEl = doc.createElement('p');
    errorEl.className = 'ldf-form-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'assertive');
    errorEl.hidden = true;

    successEl = doc.createElement('div');
    successEl.className = 'ldf-success';
    successEl.setAttribute('role', 'status');
    successEl.setAttribute('aria-live', 'polite');
    successEl.hidden = true;
    successEl.innerHTML = `
      <span class="ldf-success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
      </span>
      <h2 class="ldf-heading">${escapeHtml(config.texts.successTitle)}</h2>
      <p class="ldf-success-body">${escapeHtml(config.texts.successBody)}</p>
    `;

    formEl.setAttribute('aria-describedby', 'ldf-privacy');
    formEl.append(hpWrap, head, interestFieldset, extraFieldset, contactContainer, actionsEl, privacyEl, errorEl);
    panel.append(closeBtn, formEl, successEl);
    dialogEl.append(panel);

    // Interest-radio's en contactvelden bouwen we één keer op. Ze worden nooit vervangen,
    // alleen getoond/verborgen — zo blijft alles wat de bezoeker al typte staan als hij
    // heen en weer stapt tussen stappen (zie render()/goBack()).
    buildInterestOptions();
    buildContactStep();

    dialogEl.addEventListener('close', handleDialogClosed);
    dialogEl.addEventListener('click', (event) => {
      // Klik op de ::backdrop levert het <dialog>-element zelf als event.target op
      // (er is geen aparte overlay-div, dus dit breekt nooit klikken elders in de dialoog).
      if (event.target === dialogEl) dialogEl.close();
    });
    formEl.addEventListener('submit', handleFormSubmit);

    (docBody || doc.documentElement).appendChild(dialogEl);
  }

  function buildInterestOptions() {
    // Vaste radio's opnieuw opbouwen (interests wijzigt niet tijdens een sessie).
    Array.from(interestFieldset.querySelectorAll('.ldf-choice')).forEach((n) => n.remove());
    const errP = doc.createElement('p');
    errP.className = 'ldf-error-text';
    errP.id = 'ldf-error-interesse';
    interestFieldset.appendChild(errP);

    const grid = doc.createElement('div');
    grid.className = 'ldf-choice-grid';
    interestFieldset.insertBefore(grid, errP);

    config.interests.forEach((interest) => {
      const label = doc.createElement('label');
      label.className = 'ldf-choice';
      const input = doc.createElement('input');
      input.type = 'radio';
      input.name = 'ldf-interesse-radio';
      input.value = interest.id;
      input.className = 'ldf-sr-only';
      input.addEventListener('change', () => {
        state.interestId = interest.id;
        state.errors.interesse = undefined;
        render();
      });
      const dot = doc.createElement('span');
      dot.className = 'ldf-choice-dot';
      dot.setAttribute('aria-hidden', 'true');
      const text = doc.createElement('span');
      text.className = 'ldf-choice-label';
      text.textContent = interest.label;
      label.append(input, dot, text);
      grid.appendChild(label);
    });
  }

  // ---------------------------------------------------------------------
  // Veld-helpers (generiek voor extra-stap-velden én contactvelden)
  // ---------------------------------------------------------------------

  function fieldId(name) {
    return `ldf-field-${name}`;
  }
  function fieldErrorId(name) {
    return `${fieldId(name)}-fout`;
  }

  function buildFieldRow(def) {
    const row = doc.createElement('div');
    row.className = 'ldf-row';
    row.dataset.fieldName = def.name;
    if (def.onlyFor) row.dataset.onlyFor = def.onlyFor.join(',');

    if (def.type === 'choice') {
      const p = doc.createElement('p');
      p.className = 'ldf-label';
      p.textContent = def.label;
      row.appendChild(p);
      const grid = doc.createElement('div');
      grid.className = 'ldf-choice-grid';
      (def.options || []).forEach((opt) => {
        const label = doc.createElement('label');
        label.className = 'ldf-choice';
        const input = doc.createElement('input');
        input.type = 'radio';
        input.name = `ldf-choice-${def.name}`;
        input.value = opt.id;
        input.className = 'ldf-sr-only';
        input.addEventListener('change', () => {
          row.dataset.value = opt.id;
          row.dataset.valueLabel = opt.label;
          state.errors[def.name] = undefined;
          renderErrors();
        });
        const dot = doc.createElement('span');
        dot.className = 'ldf-choice-dot';
        dot.setAttribute('aria-hidden', 'true');
        const text = doc.createElement('span');
        text.className = 'ldf-choice-label';
        text.textContent = opt.label;
        label.append(input, dot, text);
        grid.appendChild(label);
      });
      row.appendChild(grid);
    } else {
      const label = doc.createElement('label');
      label.className = 'ldf-label';
      label.htmlFor = fieldId(def.name);
      label.textContent = def.label;
      row.appendChild(label);

      const field =
        def.type === 'textarea' ? doc.createElement('textarea') : doc.createElement('input');
      field.id = fieldId(def.name);
      field.name = def.name;
      if (def.type !== 'textarea') field.type = def.type || 'text';
      if (def.placeholder) field.placeholder = def.placeholder;
      if (def.autoComplete) field.autocomplete = def.autoComplete;
      if (def.type === 'textarea') field.rows = 2;
      row.appendChild(field);
    }

    const err = doc.createElement('p');
    err.className = 'ldf-error-text';
    err.id = fieldErrorId(def.name);
    row.appendChild(err);

    return row;
  }

  function buildExtraStepIfNeeded() {
    // Rebuild alleen wanneer de interesse écht wisselt, nooit bij een gewone render() —
    // anders verdwijnt wat de bezoeker al invulde zodra hij een stap terug/vooruit gaat.
    if (extraFieldset.dataset.builtFor === state.interestId) return;
    Array.from(extraFieldset.children).forEach((n) => n.remove());
    extraFieldset.dataset.builtFor = state.interestId;
    const extra = config.extraSteps[state.interestId];
    if (!extra) return;
    const heading = doc.createElement('legend');
    heading.className = 'ldf-sr-only';
    heading.textContent = extra.heading || '';
    extraFieldset.appendChild(heading);
    extra.fields.forEach((def) => extraFieldset.appendChild(buildFieldRow(def)));
  }

  function buildContactStep() {
    Array.from(contactContainer.children).forEach((n) => n.remove());
    config.contactFields.forEach((def) => contactContainer.appendChild(buildFieldRow(def)));
  }

  function contactFieldApplies(def) {
    return !def.onlyFor || def.onlyFor.includes(state.interestId);
  }

  // ---------------------------------------------------------------------
  // Renderen (stap tonen/verbergen, foutmeldingen, knoppen, voortgang)
  // ---------------------------------------------------------------------

  function render() {
    if (!dialogEl) return;
    successEl.hidden = state.status !== 'success';
    formEl.hidden = state.status === 'success';
    if (state.status === 'success') return;

    buildExtraStepIfNeeded();

    const steps = activeSteps();
    const step = steps[state.stepIndex] || steps[steps.length - 1];
    const isLast = state.stepIndex === steps.length - 1;

    interestFieldset.hidden = step.kind !== 'interest';
    extraFieldset.hidden = step.kind !== 'extra';
    contactContainer.hidden = step.kind !== 'contact';

    if (step.kind === 'interest') {
      headingEl.textContent = config.texts.interestLegend;
    } else if (step.kind === 'extra') {
      headingEl.textContent = step.def.heading || config.texts.heading;
    } else {
      headingEl.textContent = config.texts.heading;
      // onlyFor-velden per interesse tonen/verbergen en verplichtstellen.
      Array.from(contactContainer.children).forEach((row) => {
        const def = config.contactFields.find((f) => f.name === row.dataset.fieldName);
        const applies = contactFieldApplies(def);
        row.hidden = !applies;
        const input = row.querySelector('input,textarea');
        if (input) input.required = !!def.required && applies;
      });
    }

    // Vooraf gekozen radio's visueel/functioneel markeren.
    Array.from(interestFieldset.querySelectorAll('input[type=radio]')).forEach((r) => {
      r.checked = r.value === state.interestId;
      r.closest('.ldf-choice').classList.toggle('is-checked', r.checked);
    });
    Array.from(extraFieldset.querySelectorAll('.ldf-choice input')).forEach((r) => {
      r.closest('.ldf-choice').classList.toggle('is-checked', r.checked);
    });

    if (config.showStepCount && steps.length > 1) {
      progressEl.hidden = false;
      progressEl.textContent = config.texts.progress
        .replace('{current}', String(state.stepIndex + 1))
        .replace('{total}', String(steps.length));
    } else {
      progressEl.hidden = true;
    }

    backBtn.hidden = state.stepIndex === 0;
    submitBtn.disabled = state.status === 'submitting';
    submitBtn.setAttribute('aria-busy', state.status === 'submitting' ? 'true' : 'false');
    submitBtn.textContent =
      state.status === 'submitting'
        ? config.texts.submitting
        : isLast
          ? config.texts.submit
          : config.texts.next;

    privacyEl.hidden = config.privacyOnEveryStep ? false : !isLast;

    errorEl.hidden = state.status !== 'error';
    if (state.status === 'error') {
      errorEl.innerHTML = `<strong>${escapeHtml(config.texts.errorTitle)}</strong> ${escapeHtml(
        config.texts.errorBody
      )} ${config.supportEmail ? `<a href="mailto:${escapeAttr(config.supportEmail)}">${escapeHtml(config.supportEmail)}</a>.` : ''}`;
    }

    renderErrors();
  }

  function renderErrors() {
    // interesse
    const interestErr = interestFieldset.querySelector('#ldf-error-interesse');
    if (interestErr) interestErr.textContent = state.errors.interesse || '';
    Array.from(interestFieldset.querySelectorAll('input[type=radio]')).forEach((r) => {
      if (state.errors.interesse) r.setAttribute('aria-describedby', 'ldf-error-interesse');
      else r.removeAttribute('aria-describedby');
    });

    [extraFieldset, contactContainer].forEach((container) => {
      Array.from(container.querySelectorAll('.ldf-row')).forEach((row) => {
        const name = row.dataset.fieldName;
        const errText = row.querySelector('.ldf-error-text');
        const input = row.querySelector('input:not([type=radio]),textarea');
        const message = state.errors[name];
        if (errText) errText.textContent = message || '';
        if (input) {
          if (message) {
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', fieldErrorId(name));
          } else {
            input.removeAttribute('aria-invalid');
            input.removeAttribute('aria-describedby');
          }
        }
        // choice-groepen: markeer alle radio's van de groep als invalid voor screenreaders.
        Array.from(row.querySelectorAll('input[type=radio]')).forEach((r) => {
          if (message) r.setAttribute('aria-describedby', fieldErrorId(name));
          else r.removeAttribute('aria-describedby');
        });
      });
    });
  }

  // ---------------------------------------------------------------------
  // Validatie
  // ---------------------------------------------------------------------

  function validateInterestStep() {
    const errors = {};
    if (!state.interestId) errors.interesse = config.texts.chooseInterestError;
    return errors;
  }

  function validateFieldRow(row, def) {
    if (def.type === 'choice') {
      if (def.required && !row.dataset.value) return def.requiredError || config.texts.requiredError;
      return undefined;
    }
    const input = row.querySelector('input,textarea');
    const value = (input && input.value || '').trim();
    if (def.required && !value) return def.requiredError || config.texts.requiredError;
    if (def.type === 'email' && value && !EMAIL_RE.test(value)) return config.texts.emailError;
    return undefined;
  }

  function validateExtraStep() {
    const extra = config.extraSteps[state.interestId];
    if (!extra) return {};
    const errors = {};
    extra.fields.forEach((def) => {
      const row = extraFieldset.querySelector(`.ldf-row[data-field-name="${cssEscape(def.name)}"]`);
      const message = row && validateFieldRow(row, def);
      if (message) errors[def.name] = message;
    });
    return errors;
  }

  function validateContactStep() {
    const errors = {};
    config.contactFields.forEach((def) => {
      if (!contactFieldApplies(def)) return;
      const row = contactContainer.querySelector(`.ldf-row[data-field-name="${cssEscape(def.name)}"]`);
      const message = row && validateFieldRow(row, def);
      if (message) errors[def.name] = message;
    });
    return errors;
  }

  function collectData() {
    const data = {};
    const interest = config.interests.find((i) => i.id === state.interestId);
    data.interesse = interest ? interest.label : state.interestId;
    config.contactFields.forEach((def) => {
      if (!contactFieldApplies(def)) return;
      const row = contactContainer.querySelector(`.ldf-row[data-field-name="${cssEscape(def.name)}"]`);
      if (!row) return;
      const input = row.querySelector('input,textarea');
      if (input) data[def.name] = input.value;
    });
    const extra = config.extraSteps[state.interestId];
    if (extra) {
      extra.fields.forEach((def) => {
        const row = extraFieldset.querySelector(`.ldf-row[data-field-name="${cssEscape(def.name)}"]`);
        if (!row) return;
        if (def.type === 'choice') {
          data[def.name] = row.dataset.valueLabel || row.dataset.value || '';
        } else {
          const input = row.querySelector('input,textarea');
          if (input) data[def.name] = input.value;
        }
      });
    }
    return data;
  }

  // ---------------------------------------------------------------------
  // Navigatie & submit
  // ---------------------------------------------------------------------

  function goBack() {
    if (state.stepIndex > 0) {
      state.stepIndex -= 1;
      render();
      focusFirstField();
    }
  }

  function goNext() {
    const steps = activeSteps();
    const step = steps[state.stepIndex];
    let errors = {};
    if (step.kind === 'interest') errors = validateInterestStep();
    else if (step.kind === 'extra') errors = validateExtraStep();
    state.errors = errors;
    if (Object.keys(errors).length > 0) {
      render();
      focusFirstError();
      return;
    }
    state.stepIndex += 1;
    render();
    focusFirstField();
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const steps = activeSteps();
    const isLast = state.stepIndex === steps.length - 1;
    if (!isLast) {
      goNext();
      return;
    }

    const errors = validateContactStep();
    state.errors = errors;
    if (Object.keys(errors).length > 0) {
      render();
      focusFirstError();
      return;
    }

    // Honeypot: stil weigeren, geen onSubmit, geen netwerkverkeer — maar wel een
    // ogenschijnlijk succesvolle afronding, zodat het geautomatiseerde formulier niets leert.
    if (honeypotInput.value !== '') {
      state.status = 'success';
      render();
      return;
    }

    const data = collectData();
    state.status = 'submitting';
    render();

    try {
      if (typeof config.onSubmit === 'function') {
        await config.onSubmit(data);
      } else if (config.action) {
        const body = new win.FormData(formEl);
        const response = await win.fetch(config.action, {
          method: 'POST',
          body,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`verzenden mislukt (${response.status})`);
      }
      state.status = 'success';
    } catch {
      state.status = 'error';
    }
    render();
  }

  // ---------------------------------------------------------------------
  // Openen / sluiten
  // ---------------------------------------------------------------------

  function focusFirstField() {
    const steps = activeSteps();
    const step = steps[state.stepIndex];
    let container = interestFieldset;
    if (step.kind === 'extra') container = extraFieldset;
    else if (step.kind === 'contact') container = contactContainer;
    const target = container.querySelector('input:not([type=hidden]),textarea,select');
    if (target) target.focus();
  }

  function focusFirstError() {
    const names = Object.keys(state.errors).filter((k) => state.errors[k]);
    if (names.length === 0) return focusFirstField();
    const first = names[0];
    const el =
      first === 'interesse'
        ? interestFieldset.querySelector('input[type=radio]')
        : formEl.querySelector(`[name="${cssEscape(first)}"], .ldf-row[data-field-name="${cssEscape(first)}"] input,.ldf-row[data-field-name="${cssEscape(first)}"] textarea`);
    if (el) el.focus();
  }

  function openDialog(interestId, opener) {
    openerEl = opener || null;
    ensureDialog();
    state = freshState(interestId);
    formEl.reset();
    // Forceer een verse extra-stap-opbouw voor deze open-actie (een vorige sessie kan
    // dezelfde interesse-id hebben ingevuld staan; die waarden horen niet mee te lekken).
    delete extraFieldset.dataset.builtFor;
    render();
    if (!dialogEl.open) dialogEl.showModal();
    focusFirstField();
  }

  function handleDialogClosed() {
    if (win.location.hash === config.hashTrigger) {
      win.history.replaceState(null, '', win.location.pathname + win.location.search);
    }
    if (openerEl && typeof openerEl.focus === 'function') {
      openerEl.focus();
    }
    openerEl = null;
  }

  // ---------------------------------------------------------------------
  // Klik-onderschepping, laden-met-hash en hashchange
  // ---------------------------------------------------------------------

  function onRootClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (!config.linkMatch(href)) return;
    event.preventDefault();
    event.stopPropagation();
    openDialog(extractInterest(href), anchor);
  }

  function onHashChange() {
    if (win.location.hash === config.hashTrigger && (!dialogEl || !dialogEl.open)) {
      openDialog('', null);
    }
  }

  function checkInitialUrl() {
    const params = new win.URLSearchParams(win.location.search);
    const interest = params.get(config.interestParam) || '';
    if (win.location.hash === config.hashTrigger || interest) {
      openDialog(interest, null);
    }
  }

  root.addEventListener('click', onRootClick, true);
  win.addEventListener('hashchange', onHashChange);
  checkInitialUrl();

  function destroy() {
    root.removeEventListener('click', onRootClick, true);
    win.removeEventListener('hashchange', onHashChange);
    if (dialogEl) {
      if (dialogEl.open) dialogEl.close();
      dialogEl.remove();
    }
    dialogEl = null;
    instances.delete(root);
  }

  instances.set(root, destroy);
  return destroy;
}

// ---------------------------------------------------------------------
// Kleine, dependency-vrije hulpfuncties
// ---------------------------------------------------------------------

function mergeConfig(defaults, options) {
  return {
    ...defaults,
    ...zonderUndefined(options),
    texts: { ...defaults.texts, ...zonderUndefined(options.texts) },
    extraSteps: { ...defaults.extraSteps, ...zonderUndefined(options.extraSteps) },
  };
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function cssEscape(str) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(str);
  return String(str).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
