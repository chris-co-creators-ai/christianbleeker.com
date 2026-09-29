/**
 * Kern van de optionele meertaligheid (toegevoegd 27-09-2026, eerste klant: Bistro Wadloper wil
 * NL/EN/DE — zie `docs/SEO.md` § 2 voor de volledige uitleg). Puur data/functies, geen React, geen
 * JSX — mag zowel vanuit componenten (`@/lib/i18n`) als vanuit een los Node-script
 * (`scripts/keuring.mjs`, dat TypeScript-bestanden rechtstreeks importeert, zie het commentaar
 * daar) geïmporteerd worden.
 *
 * ── Het ontwerp in het kort ──────────────────────────────────────────────────────────────────
 * NL blijft onvertaald ONgeprefixt op `/` (route-group `app/(nl)/…`, ongewijzigd t.o.v. vóór deze
 * ronde). Andere talen krijgen een prefix (`/en/…`, `/de/…`) via de dynamische segment-map
 * `app/[locale]/…`, met `generateStaticParams` gevoed door `site.talen` (`content/site.ts`) — staat
 * daar alleen `['nl']` (de standaard), dan genereert die map GEEN pagina's: `/en` en `/de` bestaan
 * dan net zo min als vóór deze ronde. `dynamicParams = false` op die map zorgt ervoor dat een
 * niet-geconfigureerde taal ook geen off-de-plank 404-via-SSR wordt, maar een gewone build-time
 * 404 — precies wat "alles statisch voorgerenderd" vraagt.
 *
 * Waarom geen aparte i18n-library (next-intl e.d.): deze template heeft geen dynamische data, geen
 * pluralisatie-engine en geen ICU-berichten nodig — drie content-bestanden per taal (`site.ts`,
 * `artikelen.ts`, `aanvraag.ts`, `ui.ts`) en een dun laagje hier eromheen doen precies hetzelfde
 * werk met nul extra dependencies. Zie ook `AGENTS.md` § "Meertaligheid".
 */

export type Taal = 'nl' | 'en' | 'de'

/** NL is en blijft de taal zonder prefix — dat is een architectuurkeuze (route-group `(nl)`), geen
 *  configuratie-optie: verwissel deze waarde niet zonder ook de route-groepen te verplaatsen. */
export const STANDAARD_TAAL: Taal = 'nl'

/** Alle talen die dit template ooit kan tonen — de daadwerkelijke aan/uit-schakelaar per klant is
 *  `site.talen` in `content/site.ts`. Nieuwe taal toevoegen: hier + de vier `*_TAAL`-tabellen
 *  hieronder + een nieuw `content/*.xx.ts`-bestand per contentbron + registreren in
 *  `src/lib/i18n-content.ts`. */
export const ALLE_TALEN: Taal[] = ['nl', 'en', 'de']

export const TAAL_NAAM: Record<Taal, string> = {
  nl: 'Nederlands',
  en: 'English',
  de: 'Deutsch',
}

/** `openGraph.locale`-formaat (onderstreepte landcode). */
export const TAAL_OG_LOCALE: Record<Taal, string> = {
  nl: 'nl_NL',
  en: 'en_US',
  de: 'de_DE',
}

/** `<html lang>` (BCP 47, kort — de gangbare vorm voor dat attribuut). */
export const TAAL_HTML_LANG: Record<Taal, string> = {
  nl: 'nl',
  en: 'en',
  de: 'de',
}

/** JSON-LD `inLanguage` (BCP 47 met land, bv. `Article`/`WebSite`-schema) — vóór deze ronde stond
 *  hier altijd de letterlijke waarde `'nl-NL'`; deze tabel behoudt die waarde voor NL zodat het
 *  bouwresultaat met `talen: ['nl']` niet verandert. */
export const TAAL_BCP47: Record<Taal, string> = {
  nl: 'nl-NL',
  en: 'en-US',
  de: 'de-DE',
}

/** De talen naast NL uit een geconfigureerde lijst (volgorde behouden, NL zelf eruit gefilterd —
 *  ongeacht of iemand 'm er per ongeluk twee keer of helemaal niet in zet). */
export function overigeTalen(talen: Taal[]): Taal[] {
  return talen.filter((t) => t !== STANDAARD_TAAL)
}

/** Pad met taalprefix. NL krijgt nooit een prefix (`/artikelen` blijft `/artikelen`); een andere
 *  taal krijgt 'm ervoor (`/artikelen` → `/en/artikelen`, `/` → `/en`). `pad` begint met `/`. */
export function padVoorTaal(taal: Taal, pad: string): string {
  if (taal === STANDAARD_TAAL) return pad
  return pad === '/' ? `/${taal}` : `/${taal}${pad}`
}

/** Vult `{sleutel}`-plekhouders in een vertaalde sjabloonstring (bv.
 *  `ui.veelgesteldeVragenPagina.beschrijvingTemplate`, dat `{naam}` bevat). */
export function vulSjabloonIn(sjabloon: string, waarden: Record<string, string>): string {
  return sjabloon.replace(/\{(\w+)\}/g, (_, sleutel) => waarden[sleutel] ?? '')
}

/**
 * `alternates` voor de Next.js Metadata-API: canonical altijd, `languages` (+ `x-default`) ALLEEN
 * als er meer dan één taal geconfigureerd is — met precies één taal (de standaardstand van elke
 * nieuwe site) genereert dit dus bewust geen enkele hreflang-tag, zie de acceptatie-eis "0
 * hreflang" in de opdracht.
 *
 * Alle paden hier zijn relatief (`/`, `/artikelen`, …) — zelfde conventie als elke andere
 * `alternates.canonical` in deze template (zie bv. `app/(nl)/aanvraag/page.tsx`). Next.js lost een
 * relatief pad zelf op tegen `metadataBase` (`site.domein`), dus het gerenderde
 * `<link rel="canonical">` is byte-voor-byte gelijk aan vóór deze functie bestond.
 */
export function alternatesVoor(
  talen: Taal[],
  taal: Taal,
  pad: string,
): { canonical: string; languages?: Record<string, string> } {
  const canonical = padVoorTaal(taal, pad)
  if (talen.length <= 1) return { canonical }
  const languages: Record<string, string> = {}
  for (const t of talen) languages[TAAL_HTML_LANG[t]] = padVoorTaal(t, pad)
  languages['x-default'] = padVoorTaal(STANDAARD_TAAL, pad)
  return { canonical, languages }
}
