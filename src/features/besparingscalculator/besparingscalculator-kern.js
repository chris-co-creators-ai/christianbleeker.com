/**
 * besparingscalculator
 * ------------------------------------------------------------------------
 * Rekenhulp "Wat bespaar jij?": schuif voor teamgrootte, vinkkaarten voor de
 * tools die je nu gebruikt, en een donkere uitkomstkaart (sticky op brede
 * schermen) met de besparing per jaar, de opbouw per maand, de
 * pakketkorting en een CTA naar contact met de keuze in de URL
 * (`?team=8&apps=docs,projecten`). Daaronder een vergelijkbalk, een
 * blokgrafiek en de tabel "Alle pakketten op een rij" met een gemarkeerde rij.
 *
 * Eén bron (R8/R9): alle prijzen en rekenregels komen uit een JSON-
 * configuratie (zie wolkhaven.json en README). Toolprijzen staan in centen;
 * per tool wordt het maandbedrag één keer naar hele euro's afgerond, en alle
 * getoonde bedragen zijn sommen van getoonde bedragen. Zo klopt wat de
 * bezoeker narekent: nu − nieuw = verschil, verschil × 12 = per jaar.
 *
 * Toestand staat in de URL (history.replaceState) en wordt bij het laden
 * teruggelezen. Onbekende of ongeldige waarden in de URL worden genegeerd en
 * nooit als HTML ingevoegd.
 *
 * vergelijkbalk-kopie.js/.css en blokgrafiek-kopie.js/.css zijn byte-gelijke kopieën van
 * stats/vergelijkbalk en stats/blokgrafiek, zodat de map ook als platte kopie werkt
 * (nieuwe-site zet elk onderdeel los in src/features/<naam>/). test/meet.mjs bewaakt de gelijkheid.
 *
 * Vanilla ES-module, 0 dependencies buiten de bibliotheek, SSR-veilig. De
 * rekenfuncties (`bereken`, `pakketten`, `leesKeuze`, `naarQuery`) zijn puur en
 * draaien ook in Node (zie test/meet.mjs, rekentoets).
 *
 * Taal: alle zinnen staan in `TEKST` en zijn per sleutel te overschrijven met `config.teksten`
 * ({product}, {max} en per zin de genoemde plekhouders worden ingevuld; **…** wordt vet).
 * Bedragen en het rangtelwoord ("4e" / "4th") volgen `config.locale` (standaard `nl-NL`) via
 * Intl.NumberFormat en Intl.PluralRules.
 *
 * @typedef {Object} BesparingscalculatorOpties
 * @property {object} [config] De configuratie. Anders: <script type="application/json"> in root.
 * @property {boolean} [urlStaat=true] Keuze bijhouden in de adresbalk.
 *
 * @param {Element} root Container; kinderen met `data-bc-terugval` worden verborgen zolang de calculator draait.
 * @param {BesparingscalculatorOpties} [opties]
 * @returns {() => void} destroy. Idempotent.
 */
import { minderBeweging, vereisRoot, zonderUndefined } from '../../_kwaliteit/basis.js';
import { init as initBalk, euro } from './vergelijkbalk-kopie.js';
import { init as initGrafiek } from './blokgrafiek-kopie.js';

export { euro };

const ID = /^[a-z0-9-]{1,32}$/;

/**
 * Vaste teksten op één plek; overschrijfbaar met `config.teksten`. {product} en {max} worden overal
 * ingevuld, de andere plekhouders per zin. `rang` is een object per Intl.PluralRules-categorie
 * (type ordinal): nl `{ other: '{n}e' }`, en `{ one: '{n}st', two: '{n}nd', few: '{n}rd', other: '{n}th' }`.
 */
export const TEKST = {
  teamVraag: 'Hoeveel mensen werken er bij jullie?',
  teamHulp: 'Dit bepaalt wat je nu aan losse tools betaalt. Bij {product} blijft de prijs gelijk, tot {max} personen.',
  toolsVraag: 'Welke tools gebruik je nu?',
  inPlaatsVan: 'In plaats van',
  nuLabel: 'Nu aan losse tools',
  onsLabel: 'Bij {product}',
  verschilLabel: 'Verschil per maand',
  aantalLabel: 'Aantal apps',
  perAppLabel: 'Prijs per app',
  cta: 'Plan een gesprek',
  vergelijkKop: 'Wat je nu betaalt, en wat het bij {product} kost',
  huidigeTools: 'Huidige tools',
  vastePrijs: 'vaste prijs',
  kortingKop: 'Zo werkt de pakketkorting',
  kortingSub: 'Elk blok is één app. Hoe meer apps, hoe kleiner elk blok. Boven de staaf de prijs per maand, eronder de prijs per app.',
  tabelKop: 'Alle pakketten op een rij',
  legendaGekozen: 'Jouw pakket',
  legendaOverig: 'Andere pakketten',
  legendaSpook: 'Prijs zonder korting',
  legendaSpookPrijs: '{tekst} ({prijs} per app)',
  perMaandKort: '/mnd',
  persoon: '{n} persoon',
  personen: '{n} personen',
  mensen: '{n} mensen',
  app: '{n} app',
  apps: '{n} apps',
  gebruiker: '{n} gebruiker',
  gebruikers: '{n} gebruikers',
  labelLeeg: 'Kies je huidige tools',
  labelBesparing: 'Je bespaart per jaar',
  labelDuurder: 'Je betaalt per jaar meer',
  labelGelijk: 'Je betaalt per jaar hetzelfde',
  eerlijk: 'Voor een team van {team} zijn losse tools goedkoper. Je kiest {product} dan voor je eigen domein en een server in Europa, niet om de prijs.',
  badge: '{pct}% pakketkorting',
  badgeEen: 'Voeg een app toe voor pakketkorting',
  volgendeLeeg: 'Vink aan welke tools je nu gebruikt. Eén app kost bij {product} {prijs} per maand.',
  volgendeAlles: 'Je hebt alle {aantal} apps: de hoogste pakketkorting.',
  volgende: 'Met een {rang} app betaal je **{perMaand} per maand**, {perApp} per app. Dat is **{extra}** extra.',
  rang: { other: '{n}e' },
  vergelijkSub: 'Per maand, voor {apps} en een team van {mensen}.',
  vergelijkSubLeeg: 'Kies hierboven je huidige tools om te vergelijken.',
  voetBesparing: 'Je betaalt {pct}% minder: {perMaand} per maand, {perJaar} per jaar. Tot {max} personen kost een nieuwe collega bij {product} niets extra.',
  voetDuurder: 'Voor een team van {team} zijn losse tools {verschil} per maand goedkoper.',
  voetGelijk: 'Je betaalt hetzelfde als nu.',
  liveBesparing: 'Met {apps} en een team van {team} bespaar je {perJaar} per jaar.',
  liveDuurder: 'Bij deze keuze betaal je {perJaar} per jaar meer dan met losse tools.',
  liveGelijk: 'Bij deze keuze betaal je hetzelfde als nu.',
  liveLeeg: 'Geen tools gekozen.',
  kolomApps: 'Apps',
  kolomPerApp: 'Per app',
  kolomPerMaand: 'Per maand',
  kolomZonder: 'Zonder korting',
  kolomKorting: 'Korting',
  tabelBijschrift: '{kop}: prijs per app, per maand, zonder korting en pakketkorting',
  grafiekBeschrijving: '{naam}. Staafgrafiek met {n} staven; pijltjes lopen langs de staven.',
};

// ---- rekenkern (puur) ------------------------------------------------------

/** Centen → hele euro's, halve euro naar boven (alleen niet-negatieve centen). */
const euroRond = (cent) => Math.floor((Math.max(0, Math.round(cent)) + 50) / 100);

/** Prijs per app bij `n` apps volgens de staffel. 0 apps → 0. */
export function prijsPerApp(config, n) {
  const s = config.staffel;
  if (!(n > 0)) return 0;
  return Math.max(s.minimumPerApp || 0, s.perApp - (n - 1) * s.kortingPerExtraApp);
}

/** Maandbedrag van één tool bij teamgrootte `team`, in hele euro's. */
export function toolPrijs(app, team) {
  if (Number.isInteger(app.vastCent)) return euroRond(app.vastCent);
  const plekken = Number.isInteger(app.maxGebruikers) ? Math.min(team, app.maxGebruikers) : team;
  return euroRond(app.perGebruikerCent * plekken);
}

/** Alle pakketten 1…aantal apps: { aantal, perApp, perMaand, zonderKorting, kortingPct }. */
export function pakketten(config) {
  return config.apps.map((_, i) => {
    const aantal = i + 1;
    const perApp = prijsPerApp(config, aantal);
    const perMaand = aantal * perApp;
    const zonderKorting = aantal * config.staffel.perApp;
    return { aantal, perApp, perMaand, zonderKorting, kortingPct: Math.round(((zonderKorting - perMaand) * 100) / zonderKorting) };
  });
}

/**
 * De hele uitkomst voor één keuze.
 * @param {object} config
 * @param {{ team: number, apps: string[] }} keuze
 */
export function bereken(config, keuze) {
  const team = keuze.team;
  const ids = new Set(keuze.apps);
  const gekozen = config.apps.filter((a) => ids.has(a.id));
  const tools = Object.fromEntries(config.apps.map((a) => [a.id, toolPrijs(a, team)]));
  const aantal = gekozen.length;
  const perApp = prijsPerApp(config, aantal);
  const onsPerMaand = aantal * perApp;
  const zonderKorting = aantal * config.staffel.perApp;
  const nuPerMaand = gekozen.reduce((som, a) => som + tools[a.id], 0);
  const verschilPerMaand = nuPerMaand - onsPerMaand;
  const n2 = aantal + 1;
  const volgende = n2 <= config.apps.length
    ? { aantal: n2, perApp: prijsPerApp(config, n2), perMaand: n2 * prijsPerApp(config, n2), extra: n2 * prijsPerApp(config, n2) - onsPerMaand }
    : null;
  return {
    team,
    apps: gekozen.map((a) => a.id),
    aantal,
    tools,
    nuPerMaand,
    perApp,
    onsPerMaand,
    zonderKorting,
    kortingPct: zonderKorting ? Math.round(((zonderKorting - onsPerMaand) * 100) / zonderKorting) : 0,
    verschilPerMaand,
    perJaar: verschilPerMaand * 12,
    minderPct: nuPerMaand > 0 && verschilPerMaand > 0 ? Math.round((verschilPerMaand * 100) / nuPerMaand) : 0,
    volgende,
  };
}

/**
 * Keuze uit een querystring. Ongeldige teamgrootte → standaard; onbekende
 * app-id's vallen weg; `apps=` (leeg) = bewust 0 tools; alleen onzin → standaard.
 */
export function leesKeuze(config, zoek) {
  const p = new URLSearchParams(zoek || '');
  const { min, max, standaard } = config.team;
  const ruwTeam = p.get('team');
  const team = ruwTeam !== null && /^\d{1,2}$/.test(ruwTeam) && +ruwTeam >= min && +ruwTeam <= max ? +ruwTeam : standaard;
  const bekend = config.apps.map((a) => a.id);
  let apps = config.standaardApps.filter((id) => bekend.includes(id));
  const ruwApps = p.get('apps');
  if (ruwApps !== null) {
    const geldig = ruwApps.split(',').map((s) => s.trim().toLowerCase()).filter((id) => bekend.includes(id));
    if (geldig.length > 0 || ruwApps.trim() === '') apps = geldig;
  }
  const set = new Set(apps);
  return { team, apps: bekend.filter((id) => set.has(id)) };
}

/** `team=8&apps=docs,projecten` (komma's leesbaar; id's zijn al gecontroleerd op [a-z0-9-]). */
export function naarQuery(keuze) {
  return `team=${keuze.team}&apps=${keuze.apps.join(',')}`;
}

/** Controleert en kopieert de configuratie; ongeldige apps vallen weg met een waarschuwing. */
export function controleerConfig(ruw) {
  if (!ruw || typeof ruw !== 'object' || !Array.isArray(ruw.apps) || !ruw.staffel || !ruw.team) return null;
  const s = ruw.staffel;
  const t = ruw.team;
  const getallen = [s.perApp, s.kortingPerExtraApp, t.min, t.max, t.standaard];
  if (!getallen.every((n) => Number.isInteger(n) && n >= 0) || t.min < 1 || t.max < t.min || t.standaard < t.min || t.standaard > t.max) return null;
  const apps = ruw.apps.filter((a) => {
    const ok = a && ID.test(a.id) && typeof a.naam === 'string'
      && ((Number.isInteger(a.perGebruikerCent) && a.perGebruikerCent >= 0) || (Number.isInteger(a.vastCent) && a.vastCent >= 0))
      && (a.maxGebruikers === undefined || (Number.isInteger(a.maxGebruikers) && a.maxGebruikers > 0));
    if (!ok && typeof console !== 'undefined') console.warn('besparingscalculator: app overgeslagen (ongeldig):', a && a.id);
    return ok;
  });
  if (apps.length === 0) return null;
  const ids = new Set(apps.map((a) => a.id));
  return {
    ...ruw,
    apps,
    standaardApps: (Array.isArray(ruw.standaardApps) ? ruw.standaardApps : []).filter((id) => ids.has(id)),
    staffel: { perApp: s.perApp, kortingPerExtraApp: s.kortingPerExtraApp, minimumPerApp: Number.isInteger(s.minimumPerApp) ? s.minimumPerApp : 0 },
  };
}

// ---- weergave --------------------------------------------------------------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PIJL = '<svg class="bc__pijl" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const VINK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.4l2.9 2.9 6-6.6" pathLength="1"/></svg>';

let teller = 0;

export function init(root, opties = {}) {
  if (!vereisRoot(root, 'besparingscalculator')) return () => {};
  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;
  const o = { urlStaat: true, ...zonderUndefined(opties) };

  let ruw = o.config;
  if (!ruw) {
    const s = root.querySelector('script[type="application/json"]');
    if (s) { try { ruw = JSON.parse(s.textContent); } catch { ruw = null; } }
  }
  const config = controleerConfig(ruw);
  if (!config) {
    console.warn('besparingscalculator: geen geldige configuratie — overgeslagen');
    return () => {};
  }
  const T = { ...TEKST, ...(config.teksten || {}) };
  const locale = typeof config.locale === 'string' && config.locale ? config.locale : 'nl-NL';
  const fmt = (n) => euro(n, locale);
  /** Zin `k` met plekhouders ingevuld; onbekende plekhouders blijven staan. */
  const t = (k, w = {}) => String(T[k] ?? '').replace(/\{(\w+)\}/g, (m, naam) => {
    const v = { product: config.product || '', max: config.team.max, ...w }[naam];
    return v === undefined ? m : String(v);
  });
  /** Enkelvoud bij 1, anders meervoud: tel(n, 'app', 'apps') → "1 app" / "3 apps". */
  const tel = (n, een, meer) => t(n === 1 ? een : meer, { n });
  const regels = new Intl.PluralRules(locale, { type: 'ordinal' });
  const rang = (n) => {
    const r = T.rang && typeof T.rang === 'object' ? T.rang : TEKST.rang;
    return String(r[regels.select(n)] ?? r.other ?? '{n}').replace(/\{n\}/g, String(n));
  };
  /** "a **b** c" → ['a ', { sterk: 'b' }, ' c'] voor zetTekst (nooit HTML). */
  const vet = (zin) => zin.split('**').map((d, i) => (i % 2 ? { sterk: d } : d)).filter((d) => d !== '');
  const uid = `bc${(teller += 1)}`;
  const { min, max } = config.team;
  const rijen = pakketten(config);

  let keuze = leesKeuze(config, o.urlStaat ? win.location.search : '');

  // ---- opbouw van de DOM ----------------------------------------------------
  const ticks = [];
  for (let v = min; v <= max; v += 1) ticks.push(`<span data-v="${v}" style="--i:${max > min ? (v - min) / (max - min) : 0}">${v}</span>`);

  const keuzes = config.apps.map((a) => `
      <label class="bc__keuze">
        <input type="checkbox" name="apps" value="${esc(a.id)}">
        <span class="bc__vink" aria-hidden="true">${VINK}</span>
        <span class="bc__keuzetekst">
          <strong>${esc(a.naam)}</strong>
          <small>${esc(t('inPlaatsVan'))} ${esc(a.inPlaatsVan || '')}</small>
          <em class="bc__toolprijs"><span data-bc-tool="${esc(a.id)}"></span> ${esc(t('perMaandKort'))}</em>
        </span>
      </label>`).join('');

  const tabelRijen = rijen.map((r) => `<tr><th scope="row">${esc(tel(r.aantal, 'app', 'apps'))}</th><td>${fmt(r.perApp)}</td><td>${fmt(r.perMaand)}</td><td>${fmt(r.zonderKorting)}</td><td>${r.kortingPct}%</td></tr>`).join('');

  const ui = doc.createElement('div');
  ui.className = 'bc__ui';
  ui.innerHTML = `
  <div class="bc__bank">
    <div class="bc__invoer">
      <div class="bc__kaart bc__team">
        <div class="bc__teamrij">
          <label for="${uid}-team">${esc(t('teamVraag'))}</label>
          <output class="bc__teamwaarde" for="${uid}-team" aria-hidden="true"></output>
        </div>
        <input class="bc__schuif" type="range" id="${uid}-team" min="${min}" max="${max}" step="1" aria-describedby="${uid}-hulp">
        <div class="bc__ticks" aria-hidden="true">${ticks.join('')}</div>
        <p class="bc__hulp" id="${uid}-hulp">${esc(t('teamHulp'))}</p>
      </div>
      <fieldset class="bc__tools">
        <legend>${esc(t('toolsVraag'))}</legend>
        <div class="bc__keuzes">${keuzes}</div>
      </fieldset>
    </div>
    <aside class="bc__uitkomst" aria-labelledby="${uid}-label">
      <p class="bc__label" id="${uid}-label"></p>
      <p class="bc__groot"><span class="bc__groot-tal" aria-hidden="true"></span><span class="bc__sr" data-bc="groot"></span></p>
      <p class="bc__eerlijk" hidden></p>
      <dl class="bc__feiten">
        <div><dt>${esc(t('nuLabel'))}</dt><dd><span data-bc="nu"></span> <span class="bc__per">${esc(t('perMaandKort'))}</span></dd></div>
        <div><dt>${esc(t('onsLabel'))}</dt><dd><span data-bc="ons"></span> <span class="bc__per">${esc(t('perMaandKort'))}</span></dd></div>
        <div><dt>${esc(t('verschilLabel'))}</dt><dd data-bc="verschil"></dd></div>
        <div class="bc__scheiding"><dt>${esc(t('aantalLabel'))}</dt><dd data-bc="aantal"></dd></div>
        <div><dt>${esc(t('perAppLabel'))}</dt><dd data-bc="perapp"></dd></div>
      </dl>
      <p class="bc__badge" data-bc="badge"></p>
      <p class="bc__volgende" data-bc="volgende"></p>
      <a class="bc__cta" data-bc="cta" href="#">${esc(t('cta'))}${PIJL}</a>
    </aside>
  </div>
  <p class="bc__sr" aria-live="polite" data-bc="live"></p>
  <section class="bc__kaart bc__vergelijk" aria-labelledby="${uid}-vergelijk">
    <div>
      <h2 class="bc__kop" id="${uid}-vergelijk">${esc(t('vergelijkKop'))}</h2>
      <p class="bc__sub" data-bc="vergelijksub"></p>
    </div>
    <div class="vgb">
      <dl class="vgb__lijst">
        <div class="vgb__rij"><dt class="vgb__naam">${esc(t('huidigeTools'))}<small data-bc="gebruikers"></small></dt><dd class="vgb__bedrag"><data value="0">${fmt(0)}</data><span class="vgb__eenheid">${esc(t('perMaandKort'))}</span></dd><dd class="vgb__spoor" aria-hidden="true"><span class="vgb__balk"></span></dd></div>
        <div class="vgb__rij" data-toon="accent"><dt class="vgb__naam">${esc(config.product || '')}<small>${esc(t('vastePrijs'))}</small></dt><dd class="vgb__bedrag"><data value="0">${fmt(0)}</data><span class="vgb__eenheid">${esc(t('perMaandKort'))}</span></dd><dd class="vgb__spoor" aria-hidden="true"><span class="vgb__balk"></span></dd></div>
      </dl>
    </div>
    <p class="bc__voet" data-bc="voet"></p>
  </section>
  <section class="bc__kaart bc__korting" aria-labelledby="${uid}-korting">
    <div>
      <h2 class="bc__kop" id="${uid}-korting">${esc(t('kortingKop'))}</h2>
      <p class="bc__sub">${esc(t('kortingSub'))}</p>
    </div>
    <div class="bgf"></div>
  </section>
  <section class="bc__kaart bc__pakketten" aria-labelledby="${uid}-tabel">
    <h2 class="bc__kop" id="${uid}-tabel">${esc(t('tabelKop'))}</h2>
    <div class="bc__tabelhuls">
      <table class="bc__tabel">
        <caption class="bc__sr">${esc(t('tabelBijschrift', { kop: t('tabelKop') }))}</caption>
        <thead><tr><th scope="col">${esc(t('kolomApps'))}</th><th scope="col" data-grafiek="sub">${esc(t('kolomPerApp'))}</th><th scope="col" data-grafiek="waarde">${esc(t('kolomPerMaand'))}</th><th scope="col" data-grafiek="spook">${esc(t('kolomZonder'))}</th><th scope="col">${esc(t('kolomKorting'))}</th></tr></thead>
        <tbody>${tabelRijen}</tbody>
      </table>
    </div>
  </section>
  ${config.btwRegel ? `<p class="bc__kleine-letters">${esc(config.btwRegel)}</p>` : ''}`;

  const terugval = Array.from(root.querySelectorAll('[data-bc-terugval]')).filter((el) => !el.hidden);
  for (const el of terugval) el.hidden = true;
  root.appendChild(ui);
  root.setAttribute('data-bc-actief', '');

  const $ = (sel) => ui.querySelector(sel);
  const el = {
    schuif: $('.bc__schuif'),
    teamWaarde: $('.bc__teamwaarde'),
    ticks: Array.from(ui.querySelectorAll('.bc__ticks span')),
    vinkjes: Array.from(ui.querySelectorAll('.bc__keuze input')),
    toolPrijs: Array.from(ui.querySelectorAll('[data-bc-tool]')),
    uitkomst: $('.bc__uitkomst'),
    label: $('.bc__label'),
    grootTal: $('.bc__groot-tal'),
    eerlijk: $('.bc__eerlijk'),
    gebruikers: $('[data-bc="gebruikers"]'),
  };
  for (const k of ['groot', 'nu', 'ons', 'verschil', 'aantal', 'perapp', 'badge', 'volgende', 'cta', 'live', 'vergelijksub', 'voet']) el[k] = $(`[data-bc="${k}"]`);

  const balk = initBalk($('.vgb'), { locale });
  const grafiek = initGrafiek($('.bgf'), {
    bron: $('.bc__tabel'),
    label: t('tabelKop'),
    locale,
    legenda: { gekozen: t('legendaGekozen'), overig: t('legendaOverig'), spook: t('legendaSpookPrijs', { tekst: t('legendaSpook'), prijs: fmt(config.staffel.perApp) }) },
    teksten: { beschrijving: t('grafiekBeschrijving') },
  });

  // ---- beweging: het grote getal telt mee ------------------------------------
  let getoond = null;
  let raf = 0;
  let pauze = doc.documentElement.getAttribute('data-motion') === 'paused';
  const mb = minderBeweging(() => {}, doc);
  const stil = () => pauze || doc.documentElement.getAttribute('data-motion') === 'paused' || (win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function telNaar(doel) {
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
    if (getoond === null || stil() || getoond === doel) {
      getoond = doel;
      el.grootTal.textContent = fmt(doel);
      return;
    }
    const van = getoond;
    const t0 = win.performance.now();
    const duur = 520;
    const stap = (nu) => {
      const p = Math.min(1, (nu - t0) / duur);
      const e = 1 - (1 - p) ** 3;
      getoond = Math.round(van + (doel - van) * e);
      el.grootTal.textContent = fmt(getoond);
      raf = p < 1 ? win.requestAnimationFrame(stap) : 0;
    };
    raf = win.requestAnimationFrame(stap);
  }
  function opPauze(e) {
    pauze = !!(e && e.detail && e.detail.gepauzeerd);
    root.toggleAttribute('data-bc-pauze', pauze);
    if (pauze && raf) { win.cancelAnimationFrame(raf); raf = 0; telNaar(laatsteDoel); }
  }
  doc.addEventListener('beweging:pauze', opPauze);

  // ---- tonen -----------------------------------------------------------------
  let laatsteDoel = 0;
  let liveTimer = 0;
  let vorigeQuery = null;
  function zetTekst(node, delen) {
    // delen: array van string | { sterk: string } — nooit HTML
    node.replaceChildren(...delen.map((d) => {
      if (typeof d === 'string') return doc.createTextNode(d);
      const s = doc.createElement('strong');
      s.textContent = d.sterk;
      return s;
    }));
  }

  function toon(eerste) {
    const r = bereken(config, keuze);
    const p = max > min ? (r.team - min) / (max - min) : 0;
    el.schuif.value = String(r.team);
    el.schuif.style.setProperty('--p', String(p));
    el.schuif.setAttribute('aria-valuetext', tel(r.team, 'persoon', 'personen'));
    el.teamWaarde.textContent = String(r.team);
    for (const s of el.ticks) s.toggleAttribute('data-aan', Number(s.dataset.v) === r.team);
    for (const s of el.toolPrijs) s.textContent = fmt(r.tools[s.dataset.bcTool]);
    if (eerste) for (const v of el.vinkjes) v.checked = r.apps.includes(v.value);

    const staat = r.aantal === 0 ? 'leeg' : r.verschilPerMaand > 0 ? 'besparing' : r.verschilPerMaand < 0 ? 'duurder' : 'gelijk';
    el.uitkomst.setAttribute('data-staat', staat);
    el.label.textContent = t({ leeg: 'labelLeeg', besparing: 'labelBesparing', duurder: 'labelDuurder', gelijk: 'labelGelijk' }[staat]);
    laatsteDoel = Math.abs(r.perJaar);
    telNaar(laatsteDoel);
    el.groot.textContent = fmt(laatsteDoel);
    el.eerlijk.hidden = staat !== 'duurder';
    if (staat === 'duurder') el.eerlijk.textContent = t('eerlijk', { team: r.team });

    el.nu.textContent = fmt(r.nuPerMaand);
    el.ons.textContent = fmt(r.onsPerMaand);
    el.verschil.textContent = r.verschilPerMaand > 0 ? fmt(-r.verschilPerMaand) : r.verschilPerMaand < 0 ? `+${fmt(-r.verschilPerMaand)}` : fmt(0);
    el.aantal.textContent = String(r.aantal);
    el.perapp.textContent = r.aantal ? fmt(r.perApp) : '–';
    el.badge.hidden = r.aantal === 0;
    el.badge.textContent = r.aantal === 1 ? t('badgeEen') : t('badge', { pct: r.kortingPct });
    if (r.aantal === 0) zetTekst(el.volgende, vet(t('volgendeLeeg', { prijs: fmt(prijsPerApp(config, 1)) })));
    else if (!r.volgende) zetTekst(el.volgende, vet(t('volgendeAlles', { aantal: r.aantal })));
    else zetTekst(el.volgende, vet(t('volgende', { rang: rang(r.volgende.aantal), perMaand: fmt(r.volgende.perMaand), perApp: fmt(r.volgende.perApp), extra: fmt(r.volgende.extra) })));

    const query = naarQuery(r);
    const contact = config.contactUrl || '#';
    const ctaQuery = r.aantal ? query : `team=${r.team}`;
    el.cta.setAttribute('href', `${contact}${contact.includes('?') ? '&' : '?'}${ctaQuery}`);

    // vergelijking
    el.vergelijksub.textContent = r.aantal ? t('vergelijkSub', { apps: tel(r.aantal, 'app', 'apps'), mensen: tel(r.team, 'persoon', 'mensen') }) : t('vergelijkSubLeeg');
    el.gebruikers.textContent = tel(r.team, 'gebruiker', 'gebruikers');
    balk.zet([r.nuPerMaand, r.onsPerMaand]);
    el.voet.textContent = staat === 'besparing'
      ? t('voetBesparing', { pct: r.minderPct, perMaand: fmt(r.verschilPerMaand), perJaar: fmt(r.perJaar) })
      : staat === 'duurder' ? t('voetDuurder', { team: r.team, verschil: fmt(-r.verschilPerMaand) })
        : staat === 'gelijk' ? t('voetGelijk') : '';
    grafiek.kies(r.aantal ? r.aantal - 1 : null);

    // URL
    if (o.urlStaat && !eerste && query !== vorigeQuery) {
      try {
        const u = new win.URL(win.location.href);
        u.searchParams.delete('team');
        u.searchParams.delete('apps');
        const rest = u.searchParams.toString();
        u.search = rest ? `${rest}&${query}` : query;
        win.history.replaceState(win.history.state, '', u.href);
      } catch { /* sandbox-iframe of file:// — dan alleen de pagina zelf */ }
    }
    vorigeQuery = query;

    // schermlezer: één zin, pas als de bezoeker even stilstaat
    if (!eerste) {
      win.clearTimeout(liveTimer);
      liveTimer = win.setTimeout(() => {
        el.live.textContent = staat === 'besparing' ? t('liveBesparing', { apps: tel(r.aantal, 'app', 'apps'), team: r.team, perJaar: fmt(r.perJaar) })
          : staat === 'duurder' ? t('liveDuurder', { perJaar: fmt(-r.perJaar) })
            : staat === 'gelijk' ? t('liveGelijk') : t('liveLeeg');
      }, 700);
    }
  }

  const opSchuif = () => {
    const v = Number(el.schuif.value);
    if (!Number.isInteger(v) || v === keuze.team) return;
    keuze = { ...keuze, team: v };
    toon(false);
  };
  const opVink = () => {
    keuze = { ...keuze, apps: el.vinkjes.filter((v) => v.checked).map((v) => v.value) };
    toon(false);
  };
  el.schuif.addEventListener('input', opSchuif);
  for (const v of el.vinkjes) v.addEventListener('change', opVink);

  toon(true);

  let dood = false;
  return function destroy() {
    if (dood) return;
    dood = true;
    if (raf) win.cancelAnimationFrame(raf);
    win.clearTimeout(liveTimer);
    mb.stop();
    doc.removeEventListener('beweging:pauze', opPauze);
    el.schuif.removeEventListener('input', opSchuif);
    for (const v of el.vinkjes) v.removeEventListener('change', opVink);
    balk();
    grafiek();
    ui.remove();
    for (const t2 of terugval) t2.hidden = false;
    root.removeAttribute('data-bc-actief');
    root.removeAttribute('data-bc-pauze');
  };
}
