/**
 * stappen-persoonlijk
 * ------------------------------------------------------------------------
 * Een aanvraag in 3 stappen waarin de eerdere antwoorden terugkomen in de
 * vragen: "Waar wil {bedrijf} naartoe?" en "{voornaam}, wanneer ...".
 * Elke stap is een <fieldset>, gevalideerd met native checkValidity /
 * reportValidity, met Nederlandse meldingen via setCustomValidity.
 * Vanilla ES-module, 0 dependencies, SSR-veilig (raakt document pas in init).
 *
 * Zonder JS staan alle velden onder elkaar en verstuurt het formulier
 * gewoon naar `action`. De Vorige/Volgende-knoppen, de stapteller en de
 * live-regio bestaan pas als JS draait.
 *
 * Herkomst: gedrag van het aanvraagformulier op bureautandem.nl (26-10-2026,
 * DOSSIER tabel d rij 14); eigen implementatie, geen code overgenomen.
 *
 * @typedef {Object} StappenPersoonlijkOptions
 * @property {string} [actie]  URL waar naartoe wordt gepost (standaard `form.action`).
 * @property {number} [duur=300] ms voor het binnenkomen van een stap (schuif + fade, circ.out).
 * @property {number} [minimaleTijd=1500] ms dat een mens minstens over het formulier doet; sneller = bot.
 * @property {{bedrijf?: string, voornaam?: string}} [terugval] Tekst als het veld leeg is.
 * @property {(res: Response) => void} [onVerzonden] Callback na een geslaagde POST.
 *
 * @param {HTMLFormElement} root Het <form data-sp>.
 * @param {StappenPersoonlijkOptions} [opties]
 * @returns {() => void} destroy (idempotent)
 */
import { minderBeweging, vereisRoot } from '../../_kwaliteit/basis.js';

const EASE = 'cubic-bezier(0, 0.55, 0.45, 1)'; // circ.out
const TEL_RE = /^(\+|00)?[0-9]{8,15}$/;

/** Nederlandse melding voor één veld, of '' als het klopt. Verwacht een veld zónder customError. */
function melding(el) {
  const v = el.validity;
  if (el.type === 'radio') return v.valueMissing ? 'Kies één van de opties om verder te gaan.' : '';
  if (v.valueMissing) {
    if (el.type === 'email') return 'Vul je e-mailadres in.';
    if (el.type === 'tel') return 'Vul je telefoonnummer in.';
    return `Vul ${el.dataset.spLabel || 'dit veld'} in.`;
  }
  if (el.type === 'email' && (v.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value))) {
    return 'Dit e-mailadres lijkt niet te kloppen, bijvoorbeeld naam@bedrijf.nl.';
  }
  if (el.type === 'tel') {
    const kaal = el.value.replace(/[\s\-().]/g, '');
    const ok = TEL_RE.test(kaal) && (kaal.startsWith('+') || kaal.startsWith('00') || kaal.startsWith('0'));
    if (!ok) return 'Vul een telefoonnummer in, bijvoorbeeld 06 12345678 of +31 6 12345678.';
  }
  if (v.tooShort) return `Gebruik minstens ${el.minLength} tekens.`;
  if (v.tooLong) return `Gebruik hooguit ${el.maxLength} tekens.`;
  return '';
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'stappen-persoonlijk')) return () => {};
  const doc = root.ownerDocument;
  const {
    duur = 300,
    minimaleTijd = 1500,
    terugval = {},
    onVerzonden,
  } = opties;
  const val = { bedrijf: 'je bedrijf', voornaam: 'Hoi', ...terugval };
  const actie = opties.actie || root.getAttribute('action') || '';

  const stappen = [...root.querySelectorAll('fieldset[data-sp-stap]')];
  if (!stappen.length) return () => {};
  const totaal = stappen.length;
  const bedankt = doc.querySelector(root.getAttribute('data-sp-bedankt') || '[data-sp-bedankt]');
  const honeypot = root.querySelector('[data-sp-val]');
  const velden = [...root.querySelectorAll('input, textarea, select')].filter((e) => e !== honeypot && e.type !== 'hidden');
  const hadNoValidate = root.noValidate;
  root.noValidate = true; // submit-event altijd laten afgaan; wij valideren per stap met reportValidity
  const opruim = [];
  const luister = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); opruim.push(() => el.removeEventListener(ev, fn, o)); };

  let huidig = 0;
  let bezig = false;
  let klaar = false;
  let weg = false;
  const geopend = Date.now();

  // --- aangemaakte elementen -------------------------------------------
  const live = doc.createElement('p');
  live.className = 'sp-live';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  root.prepend(live);

  const nav = doc.createElement('div');
  nav.className = 'sp-nav';
  const terug = knop('Vorige', 'sp-knop sp-knop--terug', 'data-sp-terug');
  const volgende = knop('Volgende', 'sp-knop sp-knop--volgende', 'data-sp-volgende');
  nav.append(terug, volgende);
  const verstuur = root.querySelector('[type="submit"]');
  if (verstuur) { verstuur.classList.add('sp-knop', 'sp-knop--volgende'); nav.append(verstuur); }
  root.append(nav);

  const fout = doc.createElement('p');
  fout.className = 'sp-fout';
  fout.setAttribute('role', 'alert');
  fout.hidden = true;
  nav.before(fout);

  const tellers = stappen.map((st, i) => {
    const kop = st.querySelector('[data-sp-kop]');
    if (kop) kop.setAttribute('tabindex', '-1');
    const t = doc.createElement('span');
    t.className = 'sp-teller';
    t.textContent = `Stap ${i + 1} van ${totaal}`;
    (kop && kop.parentNode ? kop.parentNode : st).insertBefore(t, kop || st.firstChild);
    return t;
  });

  function knop(tekst, klasse, attr) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = klasse;
    b.setAttribute(attr, '');
    const s = doc.createElement('span');
    s.textContent = tekst;
    b.append(s);
    return b;
  }

  root.setAttribute('data-sp-actief', '1');
  root.setAttribute('data-sp-js', '');
  const eerste = doc.createElement('input');
  eerste.type = 'hidden'; eerste.name = 'geopend'; eerste.value = String(geopend);
  root.append(eerste);

  // --- persoonlijke kop ------------------------------------------------
  const waarde = (naam) => {
    const el = root.querySelector(`[name="${naam}"]`);
    return el ? el.value.trim() : '';
  };
  const gegevens = () => ({
    bedrijf: waarde('bedrijf') || val.bedrijf,
    voornaam: (waarde('naam').split(/\s+/)[0]) || val.voornaam,
  });
  function vul(el) {
    const sjabloon = el.getAttribute('data-sp-sjabloon');
    const g = gegevens();
    el.textContent = '';
    sjabloon.split(/(\{bedrijf\}|\{voornaam\})/).forEach((deel) => {
      if (deel === '{bedrijf}' || deel === '{voornaam}') {
        const em = doc.createElement('em');
        em.className = 'sp-naam';
        em.textContent = g[deel.slice(1, -1)];
        el.append(em);
      } else if (deel) el.append(doc.createTextNode(deel));
    });
  }
  const sjablonen = [...doc.querySelectorAll('[data-sp-sjabloon]')].filter((e) => root.contains(e) || (bedankt && bedankt.contains(e)));
  const origineel = sjablonen.map((el) => el.textContent);
  const vulAlles = () => sjablonen.forEach(vul);
  vulAlles();

  // --- validatie -------------------------------------------------------
  function sync(el) {
    el.setCustomValidity('');
    el.setCustomValidity(melding(el));
    el.setAttribute('aria-invalid', el.validity.valid ? 'false' : 'true');
  }
  const syncGroep = (el) => (el.type === 'radio' && el.name
    ? velden.filter((f) => f.type === 'radio' && f.name === el.name).forEach(sync)
    : sync(el));
  velden.forEach((el) => { el.setCustomValidity(''); sync(el); el.setAttribute('aria-invalid', 'false'); });
  const onInput = (e) => {
    if (!velden.includes(e.target)) return;
    syncGroep(e.target);
    if (e.target.name === 'bedrijf' || e.target.name === 'naam') vulAlles();
  };
  luister(root, 'input', onInput);
  luister(root, 'change', onInput);
  // aria-invalid alleen tonen nadat er een poging was
  const onInvalid = (e) => { e.target.setAttribute('aria-invalid', 'true'); };
  luister(root, 'invalid', onInvalid, true);

  function stapGeldig(i) {
    const st = stappen[i];
    const lijst = velden.filter((f) => st.contains(f));
    lijst.forEach(sync);
    const eersteFout = lijst.find((f) => !f.checkValidity());
    if (eersteFout) { eersteFout.reportValidity(); return false; }
    return true;
  }

  // --- stapwissel ------------------------------------------------------
  function toon(i) {
    stappen.forEach((st, n) => { st.hidden = n !== i; });
    terug.hidden = i === 0;
    volgende.hidden = i === totaal - 1;
    if (verstuur) verstuur.hidden = i !== totaal - 1;
    root.setAttribute('data-sp-actief', String(i + 1));
  }

  async function ga(naar, richting) {
    if (bezig || klaar || naar < 0 || naar >= totaal || naar === huidig) return;
    bezig = true;
    const oud = stappen[huidig];
    const reduce = minderBeweging().reduced;
    vulAlles();
    if (!reduce && oud.animate) {
      try { await oud.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-24 * richting}px)` }], { duration: Math.round(duur * 0.4), easing: 'ease-in', fill: 'forwards' }).finished; } catch { /* geannuleerd */ }
    }
    if (weg) return;
    oud.getAnimations?.().forEach((a) => a.cancel());
    huidig = naar;
    toon(naar);
    const nieuw = stappen[naar];
    if (!reduce && nieuw.animate) {
      nieuw.animate([{ opacity: 0, transform: `translateX(${32 * richting}px)` }, { opacity: 1, transform: 'none' }], { duration: duur, easing: EASE });
    }
    live.textContent = '';
    live.textContent = `Stap ${naar + 1} van ${totaal}`;
    const kop = nieuw.querySelector('[data-sp-kop]');
    (kop || nieuw).focus({ preventScroll: false });
    bezig = false;
  }

  luister(volgende, 'click', () => { if (stapGeldig(huidig)) ga(huidig + 1, 1); });
  luister(terug, 'click', () => ga(huidig - 1, -1));

  // --- versturen -------------------------------------------------------
  async function verstuurNu() {
    const spam = (honeypot && honeypot.value.trim() !== '') || Date.now() - geopend < minimaleTijd;
    if (spam) { rondAf(); return; } // bot krijgt een bedankscherm, geen POST
    const kn = verstuur;
    if (kn) kn.disabled = true;
    fout.hidden = true;
    try {
      const res = await fetch(actie, { method: 'POST', body: new FormData(root) });
      if (!res.ok) throw new Error(String(res.status));
      if (onVerzonden) onVerzonden(res);
      rondAf();
    } catch {
      // christianbleeker v2: eigen fouttekst + uitweg-link (opties.foutTekst, opties.foutLink)
      fout.textContent = opties.foutTekst || 'Versturen is niet gelukt. Controleer je verbinding en probeer het nog eens.';
      if (opties.foutLink) {
        const a = doc.createElement('a');
        a.href = opties.foutLink.href; a.textContent = opties.foutLink.tekst;
        a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'sp-fout__link';
        fout.append(' ', a);
      }
      fout.hidden = false;
      if (kn) kn.disabled = false;
    }
  }

  function rondAf() {
    if (weg) return;
    klaar = true;
    vulAlles();
    root.hidden = true;
    if (bedankt) {
      bedankt.hidden = false;
      live.textContent = '';
      const kop = bedankt.querySelector('[data-sp-kop]') || bedankt;
      kop.setAttribute('tabindex', '-1');
      if (!minderBeweging().reduced && bedankt.animate) {
        bedankt.animate([{ opacity: 0, transform: 'translateX(32px)' }, { opacity: 1, transform: 'none' }], { duration: duur, easing: EASE });
      }
      kop.focus();
    }
  }

  luister(root, 'submit', (e) => {
    e.preventDefault();
    if (klaar || bezig) return;
    if (!stapGeldig(huidig)) return;
    if (huidig < totaal - 1) { ga(huidig + 1, 1); return; } // Enter in een tekstveld = Volgende
    verstuurNu();
  });

  toon(0);

  return function destroy() {
    if (weg) return;
    weg = true;
    opruim.forEach((f) => f());
    stappen.forEach((st) => { st.hidden = false; st.getAnimations?.().forEach((a) => a.cancel()); });
    tellers.forEach((t) => t.remove());
    stappen.forEach((st) => st.querySelector('[data-sp-kop]')?.removeAttribute('tabindex'));
    sjablonen.forEach((el, n) => { el.textContent = origineel[n]; });
    velden.forEach((el) => { el.setCustomValidity(''); el.removeAttribute('aria-invalid'); });
    if (verstuur) { verstuur.hidden = false; verstuur.disabled = false; verstuur.classList.remove('sp-knop', 'sp-knop--volgende'); root.append(verstuur); }
    live.remove(); nav.remove(); fout.remove(); eerste.remove();
    root.removeAttribute('data-sp-actief');
    root.removeAttribute('data-sp-js');
    root.hidden = false;
    root.noValidate = hadNoValidate;
    if (bedankt) bedankt.hidden = true;
  };
}
