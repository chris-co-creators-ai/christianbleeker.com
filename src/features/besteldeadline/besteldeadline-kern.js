/**
 * besteldeadline
 * ------------------------------------------------------------------------
 * Een native `<input type="date">` met een afsluittijd: vóór `data-deadline`
 * (bv. "10:00", in Nederlandse tijd — ook als de bezoeker in een andere
 * tijdzone zit, zie `nlTijd()`) is vandaag nog kiesbaar, erna pas morgen.
 * Gesloten weekdagen (`data-gesloten-weekdagen`, 0=zondag…6=zaterdag) en
 * losse gesloten datums (`data-gesloten-datums`) worden geweigerd met een
 * melding en de kiezer springt naar de eerstvolgende open datum. De waarde
 * van een `<input type="date">` is al ISO (`JJJJ-MM-DD`) — die gaat zo het
 * formulier in, geen extra omzetting nodig.
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig.
 *
 * @module besteldeadline
 */
import { nlTijd, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';

function pad2(n) {
  return String(n).padStart(2, '0');
}
function isoOfUtcDate(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
function utcDateFromIso(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

/**
 * G14: een bezoeker leest geen ISO-datum ("2026-09-29") — NL-notatie
 * ("dinsdag 29 september"). `timeZone: 'UTC'` want `utcDateFromIso` legt
 * de kalenderdatum al vast op UTC-middernacht; anders kan de lokale
 * tijdzone van de bezoeker (of de testrunner) een dag laten verschuiven.
 * @param {string} iso "JJJJ-MM-DD"
 * @returns {string}
 */
export function formatteerDatumNL(iso) {
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(utcDateFromIso(iso));
}

const DEFAULT_TEXTS = {
  teVroeg: (iso) => `Die datum is niet meer te kiezen. Eerstvolgende mogelijke datum: ${formatteerDatumNL(iso)}.`,
  gesloten: (iso) => `We zijn gesloten op de gekozen dag. Eerstvolgende beschikbare datum: ${formatteerDatumNL(iso)}.`,
};

/**
 * @param {string} deadline "UU:MM"
 * @param {Date} [nu]
 * @returns {string} ISO-datum: vandaag als de deadline nog niet gepasseerd is (NL-tijd), anders morgen.
 */
export function berekenMinDatum(deadline, nu) {
  const [uur, minuut] = String(deadline || '00:00').split(':').map((n) => Number(n) || 0);
  const t = nlTijd(nu);
  const nuMinuten = t.uur * 60 + t.minuut;
  const deadlineMinuten = uur * 60 + minuut;
  const basis = new Date(Date.UTC(t.jaar, t.maand - 1, t.dag));
  if (nuMinuten >= deadlineMinuten) basis.setUTCDate(basis.getUTCDate() + 1);
  return isoOfUtcDate(basis);
}

/**
 * Eerstvolgende datum vanaf (incl.) `vanafIso` die geen gesloten weekdag en geen gesloten datum is.
 * @param {string} vanafIso
 * @param {Set<number>} geslotenWeekdagen
 * @param {Set<string>} geslotenDatums
 * @returns {string}
 */
export function eerstvolgendeOpenDatum(vanafIso, geslotenWeekdagen, geslotenDatums) {
  const d = utcDateFromIso(vanafIso);
  for (let i = 0; i < 120; i += 1) {
    const iso = isoOfUtcDate(d);
    if (!geslotenWeekdagen.has(d.getUTCDay()) && !geslotenDatums.has(iso)) return iso;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return vanafIso;
}

function parseSet(raw, mapper = (x) => x) {
  return new Set(
    String(raw || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(mapper)
  );
}

/**
 * @param {Element} root Container met `[data-besteldeadline-input]` (type="date") en attributen
 *   `data-deadline`, `data-gesloten-weekdagen`, `data-gesloten-datums` (op `root` zelf).
 * @param {object} [options]
 * @param {object} [options.texts]
 * @returns {() => void} destroy
 */
export function init(root, options = {}) {
  if (!vereisRoot(root, 'besteldeadline')) return () => {};
  const doc = root.ownerDocument;
  if (!doc) return () => {};

  const texts = { ...DEFAULT_TEXTS, ...zonderUndefined(options.texts) };
  const input = root.querySelector('[data-besteldeadline-input]');
  if (!input) {
    console.warn('besteldeadline: init(root) vond geen [data-besteldeadline-input] — overgeslagen');
    return () => {};
  }
  let meldingEl = root.querySelector('[data-besteldeadline-melding]');
  const eigenMelding = !meldingEl;
  if (!meldingEl) {
    meldingEl = doc.createElement('p');
    meldingEl.setAttribute('data-besteldeadline-melding', '');
    input.insertAdjacentElement('afterend', meldingEl);
  }
  meldingEl.setAttribute('role', 'status');
  meldingEl.setAttribute('aria-live', 'polite');

  const deadline = root.getAttribute('data-deadline') || '00:00';
  const geslotenWeekdagen = parseSet(root.getAttribute('data-gesloten-weekdagen'), Number);
  const geslotenDatums = parseSet(root.getAttribute('data-gesloten-datums'));

  let minIso = berekenMinDatum(deadline);
  input.min = minIso;
  if (!input.value) {
    input.value = eerstvolgendeOpenDatum(minIso, geslotenWeekdagen, geslotenDatums);
  }

  function setMelding(msg) {
    meldingEl.textContent = msg || '';
  }

  function onChange() {
    const val = input.value;
    if (!val) return;
    if (val < minIso) {
      const vervanging = eerstvolgendeOpenDatum(minIso, geslotenWeekdagen, geslotenDatums);
      input.value = vervanging;
      setMelding(texts.teVroeg(vervanging));
      return;
    }
    const wd = utcDateFromIso(val).getUTCDay();
    if (geslotenWeekdagen.has(wd) || geslotenDatums.has(val)) {
      const vervanging = eerstvolgendeOpenDatum(val, geslotenWeekdagen, geslotenDatums);
      input.value = vervanging;
      setMelding(texts.gesloten(vervanging));
      return;
    }
    setMelding('');
  }

  input.addEventListener('change', onChange);

  function destroy() {
    input.removeEventListener('change', onChange);
    setMelding('');
    if (eigenMelding) meldingEl.remove();
  }

  return destroy;
}
