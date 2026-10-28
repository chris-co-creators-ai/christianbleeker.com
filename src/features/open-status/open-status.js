/**
 * open-status
 * ------------------------------------------------------------------------
 * Live "Nu open · sluit om 17:00" / "Gesloten · morgen open om 9:00".
 * Rekent altijd in Nederlandse tijd (`nlTijd()`, R10) — ook als de bezoeker
 * in een andere tijdzone zit. Ververst elke minuut (uitgelijnd op de
 * minuutgrens), en schrijft alleen naar de DOM als de tekst echt verandert
 * (geen aria-live-spam elke minuut).
 *
 * Vanilla ES-module, 0 dependencies, SSR-veilig: raakt window/document pas
 * aan in `init()`.
 *
 * @typedef {[string, string]} Tijdvak Paar "HH:MM" start/eind, eind exclusief.
 * @typedef {Object} Schema
 * @property {Record<string, Tijdvak[]>} weekschema Sleutel = weekdag 0(zo)-6(za), zoals `nlTijd().weekdag`.
 * @property {Record<string, {open:false,label?:string}|Tijdvak[]>} [uitzonderingen] Sleutel = ISO-datum (JJJJ-MM-DD).
 * @property {{van:string, tot:string, weekschema: Record<string, Tijdvak[]>}[]} [seizoenen] ISO-datumreeksen (inclusief), overschrijft het weekschema in die periode.
 *
 * @param {Element} root Bevat een `<script type="application/json" data-os-schema>` met het Schema, en een `[data-os-tekst]`-element.
 * @param {{ schema?: Schema, verversMs?: number, schemaOrg?: boolean }} [opties]
 * @returns {() => void} destroy — stopt de ververs-timer en zet de root terug naar de oorspronkelijke HTML. Idempotent.
 */
import { nlTijd, vereisRoot } from '../../_kwaliteit/basis.js';

export const NL_WEEKDAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

function naarMinuten(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function isoPlusDagen(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekdagVanIso(iso) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/** Welke tijdvakken gelden er op `iso` (weekdag `weekdag`)? Uitzondering > seizoen > basisschema. */
function vensterVoorDag(schema, iso, weekdag) {
  const uitz = schema.uitzonderingen && schema.uitzonderingen[iso];
  if (uitz) {
    if (uitz.open === false) return { vensters: [], label: uitz.label || null };
    if (Array.isArray(uitz)) return { vensters: uitz, label: null };
  }
  let week = schema.weekschema;
  if (Array.isArray(schema.seizoenen)) {
    for (const s of schema.seizoenen) {
      if (iso >= s.van && iso <= s.tot) { week = s.weekschema; break; }
    }
  }
  return { vensters: (week && week[String(weekdag)]) || [], label: null };
}

/**
 * Zuivere rekenfunctie: status op moment `nu`. Los te testen zonder browser.
 * @param {Schema} schema
 * @param {Date} [nu]
 */
export function berekenStatus(schema, nu = new Date()) {
  const t = nlTijd(nu);
  const nuMin = t.uur * 60 + t.minuut;
  const { vensters, label } = vensterVoorDag(schema, t.iso, t.weekdag);

  for (const [start, eind] of vensters) {
    const s = naarMinuten(start);
    const e = naarMinuten(eind);
    if (nuMin >= s && nuMin < e) {
      return { open: true, vandaagIso: t.iso, sluitOm: eind, resterendMin: e - nuMin };
    }
  }

  // Later vandaag nog een tijdvak (bv. na de lunchpauze)?
  for (const [start] of vensters) {
    if (naarMinuten(start) > nuMin) {
      return { open: false, vandaagIso: t.iso, volgendeIso: t.iso, volgendeOm: start, weekdagIdx: t.weekdag, labelVandaag: label };
    }
  }

  // Doorzoeken naar de eerstvolgende dag met een tijdvak (max 14 dagen vooruit).
  for (let n = 1; n <= 14; n += 1) {
    const iso = isoPlusDagen(t.iso, n);
    const wd = weekdagVanIso(iso);
    const gevonden = vensterVoorDag(schema, iso, wd);
    if (gevonden.vensters.length > 0) {
      return { open: false, vandaagIso: t.iso, volgendeIso: iso, volgendeOm: gevonden.vensters[0][0], weekdagIdx: wd, labelVandaag: label };
    }
  }

  return { open: false, vandaagIso: t.iso, volgendeIso: null, volgendeOm: null, labelVandaag: label };
}

/** Tekst + het HH:MM dat in een `<time>` moet, voor `berekenStatus()`-resultaat. */
export function tekstVoorStatus(status) {
  if (status.open) {
    const suffix = status.resterendMin <= 15
      ? `sluit over ${status.resterendMin} min`
      : `sluit om ${status.sluitOm}`;
    return { open: true, label: 'Nu open', suffix, tijd: status.sluitOm };
  }

  const voorvoegsel = status.labelVandaag ? `Gesloten (${status.labelVandaag})` : 'Gesloten';
  if (!status.volgendeIso) return { open: false, label: voorvoegsel, suffix: '', tijd: null };

  if (status.volgendeIso === status.vandaagIso) {
    return { open: false, label: voorvoegsel, suffix: `open om ${status.volgendeOm}`, tijd: status.volgendeOm };
  }
  const morgen = isoPlusDagen(status.vandaagIso, 1);
  if (status.volgendeIso === morgen) {
    return { open: false, label: voorvoegsel, suffix: `morgen open om ${status.volgendeOm}`, tijd: status.volgendeOm };
  }
  return { open: false, label: voorvoegsel, suffix: `open op ${NL_WEEKDAGEN[status.weekdagIdx]} om ${status.volgendeOm}`, tijd: status.volgendeOm };
}

function bouwSchemaOrg(schema) {
  const specs = [];
  for (const [dag, vensters] of Object.entries(schema.weekschema || {})) {
    for (const [start, eind] of vensters) {
      specs.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(dag)],
        ],
        opens: start,
        closes: eind,
      });
    }
  }
  return specs;
}

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'open-status')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const schemaEl = root.querySelector('[data-os-schema]');
  let schema = opties.schema || null;
  if (!schema && schemaEl) {
    try {
      schema = JSON.parse(schemaEl.textContent);
    } catch (err) {
      console.warn('open-status: kon [data-os-schema] niet parsen als JSON — overgeslagen', err);
      return () => {};
    }
  }
  if (!schema) {
    console.warn('open-status: geen schema gevonden (opties.schema of [data-os-schema]) — overgeslagen');
    return () => {};
  }

  const tekstEl = root.querySelector('[data-os-tekst]');
  if (!tekstEl) {
    console.warn('open-status: geen [data-os-tekst] gevonden in root — overgeslagen');
    return () => {};
  }

  const origineleTekstHTML = tekstEl.innerHTML;
  let vorigeSignature = null;

  function render() {
    const status = berekenStatus(schema);
    const t = tekstVoorStatus(status);
    const signature = JSON.stringify(t);
    root.setAttribute('data-os-status', t.open ? 'open' : 'dicht');
    if (signature === vorigeSignature) return; // geen wijziging -> geen DOM-schrijf, geen aria-live-spam
    vorigeSignature = signature;

    tekstEl.textContent = '';
    tekstEl.append(`${t.label}`);
    if (t.suffix) {
      tekstEl.append(' · ');
      // suffix bevat soms het klokmoment als leesbare tekst (bv. "sluit om
      // HH:MM" / "morgen open om HH:MM") en soms een relatieve duur ("sluit
      // over 10 min", geen HH:MM-tekst om uit te lichten). Alleen in het
      // eerste geval wikkelen we het HH:MM-stuk in een <time>.
      const idx = t.tijd ? t.suffix.lastIndexOf(t.tijd) : -1;
      if (idx >= 0) {
        const tijdEl = doc.createElement('time');
        tijdEl.setAttribute('datetime', t.tijd);
        tekstEl.append(t.suffix.slice(0, idx));
        tijdEl.textContent = t.tijd;
        tekstEl.append(tijdEl);
        tekstEl.append(t.suffix.slice(idx + t.tijd.length));
      } else {
        tekstEl.append(t.suffix);
      }
    }
  }

  // schema.org (optioneel)
  let ldjsonEl = null;
  const wantSchemaOrg = opties.schemaOrg ?? root.hasAttribute('data-schema-org');
  if (wantSchemaOrg) {
    ldjsonEl = doc.createElement('script');
    ldjsonEl.type = 'application/ld+json';
    ldjsonEl.setAttribute('data-os-ldjson', '');
    ldjsonEl.textContent = JSON.stringify(bouwSchemaOrg(schema));
    root.appendChild(ldjsonEl);
  }

  render();

  // Ververs elke minuut, uitgelijnd op de minuutgrens.
  const refreshAttr = Number(root.getAttribute('data-refresh-ms'));
  const verversMs = opties.verversMs ?? (refreshAttr || 60000);
  let intervalId = 0;
  let alignTimeoutId = 0;
  const restMs = verversMs - (win.Date.now() % verversMs);
  alignTimeoutId = win.setTimeout(() => {
    alignTimeoutId = 0;
    render();
    intervalId = win.setInterval(render, verversMs);
  }, restMs);

  let destroyed = false;
  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (alignTimeoutId) win.clearTimeout(alignTimeoutId);
    if (intervalId) win.clearInterval(intervalId);
    if (ldjsonEl && ldjsonEl.parentNode) ldjsonEl.remove();
    root.removeAttribute('data-os-status');
    tekstEl.innerHTML = origineleTekstHTML;
  };
}
