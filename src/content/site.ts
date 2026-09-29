/**
 * ALLE bedrijfsgegevens en infrastructuur-tekst van de site — het enige bestand dat de
 * `nieuwe-site`-generator vult. Dit is de KALE basis (zie `LEESMIJ.md`): geen hero/aanbod/over-
 * velden meer, want die zijn ontwerp en horen per klant in de PRD-gebouwde pagina's, niet hier.
 *
 * Wat hier WEL staat is wat de infrastructuur nodig heeft, ongeacht hoe de pagina's er per klant
 * uitzien: naam/domein/beschrijving (SEO/meta), NAP-bedrijfsgegevens (schema.org), FAQ, privacy,
 * meting-schakelaars, mailadressen en de navigatie/gegevens in kop en voet.
 *
 * ── Waarom een expliciet type en geen `as const` ────────────────────────────
 * Met `as const` wordt `voet.links.length` het getal 2 in plaats van `number`, en dan meldt
 * TypeScript een lengte-check op dat array als zinloos. Een basis hoort leeg te kunnen.
 */

import type { Taal } from '@/lib/i18n'

/**
 * DE config-schakelaar voor meertaligheid. Standaard `['nl']` — één taal, geen prefix, geen
 * hreflang. Zet 'm per klant op bv. `['nl', 'en', 'de']` zodra die talen nodig zijn. NL hoort
 * altijd in de lijst — dat is de taal zonder prefix (`src/lib/i18n.ts`s `STANDAARD_TAAL`). Voor
 * elke extra taal moet er een `content/*.xx.ts` bestaan naast elk NL-bestand (`site.xx.ts`,
 * `ui.xx.ts`) — ontbreekt die vertaling, dan faalt de build met het veldpad + de taal in de
 * melding (`src/lib/vertaal.ts`).
 */
export const talen: Taal[] = ['nl']

type Knop = { tekst: string; href: string }

export type SiteInhoud = {
  naam: string
  domein: string
  /* Alleen gebruikt als meta description + og:description + LocalBusiness-schema (`layout.tsx`).
     `scripts/keuring.mjs` faalt onder 50 of boven 160 tekens. */
  beschrijving: string
  /** Optioneel — alleen voor de `LocalBusiness`-schema.org-markup. Leeg weglaten: het veld
   *  verschijnt dan simpelweg niet in de JSON-LD. */
  adres?: string
  /** Optioneel, zelfde reden als `adres`. */
  telefoon?: string
  /** Optioneel: preciezer schema.org-subtype dan het generieke `LocalBusiness`, bv.
   *  `'ProfessionalService'`, `'Dentist'`, `'Restaurant'` (volledige lijst: schema.org/LocalBusiness
   *  § "More specific Types"). Leeg = `LocalBusiness`. Zie `docs/SEO.md` § "Keuzes voor Lars". */
  schemaType?: string
  /** Optioneel: coördinaten voor `GeoCoordinates` in de LocalBusiness-schema. Leeg = geen
   *  `geo`-veld in de JSON-LD. */
  geo?: { lat: number; lng: number }
  /** Optioneel: werkgebied (plaatsnamen/regio's), bv. `['Zwolle', 'Kampen']`. Leeg = geen
   *  `areaServed` in de JSON-LD. */
  areaServed?: string[]
  /** Optioneel: openingstijden voor `OpeningHoursSpecification`. `dagen` gebruikt de
   *  schema.org-daglijst (`'Monday'`…`'Sunday'`, Engels — dat is het vocabulaire, geen
   *  vertaalfout). Leeg = geen openingstijden in de JSON-LD. */
  openingstijden?: { dagen: string[]; open: string; dicht: string }[]
  /** Optioneel: ALLEEN invullen met echte cijfers van een klant (bv. van Google Bedrijfsprofiel).
   *  Nooit fabriceren. Leeg = geen `aggregateRating` in de JSON-LD. */
  reviews?: { waardering: number; aantal: number }
  /** Vragen en antwoorden. FAQ is STANDAARD een sectie op de homepage (toegankelijk accordeon,
   *  werkt zonder JS) — pas als er meer dan `eigenPaginaVanaf` vragen zijn krijgt de site ook een
   *  eigen `/veelgestelde-vragen`-route met de volledige lijst. `items` leeg = geen sectie, geen
   *  route, geen schema. Zie `docs/SEO.md` § 9/§ 10. */
  faq: {
    items: { vraag: string; antwoord: string }[]
    /** T/m dit aantal vragen: alleen een sectie op de homepage, geen eigen route. */
    eigenPaginaVanaf: number
    /** Boven de drempel: aantal vragen dat de homepage-sectie toont vóór de "Alle vragen"-link. */
    toonAantal: number
  }
  /** Privacyblokje (dialoog, geen aparte route — zie `PrivacyDialog.tsx`). */
  privacy: { kop: string; ondertitel: string; alinea: string[] }
  /** AAN/UIT-schakelaar voor AI-TRAININGScrawlers (GPTBot, ClaudeBot, Google-Extended,
   *  Applebot-Extended, CCBot) in `robots.txt/route.ts`. Standaard `false`: content blijft dan buiten
   *  trainingsdatasets, maar zoek-/citeer-crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
   *  Claude-User, PerplexityBot) blijven ALTIJD toegestaan. Zie `docs/SEO.md` § 10. */
  aiTraining: boolean
  /** Optioneel: ISO-datum ("2026-09-24") van de laatste inhoudelijke review — voedt `lastmod` in
   *  `sitemap.ts`. Leeg = `sitemap.ts` gebruikt de builddatum. */
  bijgewerkt?: string
  /** Meet-ID's — STANDAARD ALLEMAAL LEEG. Pas als hier een echt ID staat rendert
   *  `src/features/toestemming/Toestemming.tsx` de cookiemelding en laadt (ná "Akkoord") GA4/GTM
   *  via `@next/third-parties/google` resp. Clarity. */
  meting: { ga4?: string; gtm?: string; clarity?: string }
  /** Verzendadressen voor formulieren die een klant later toevoegt (PRD-afhankelijk), zie
   *  `src/lib/mail.ts`. `naar` ontvangt de klant-mail. `van` is het afzenderadres bij Resend —
   *  standaard het gedeelde, bij Resend geverifieerde Seveke-domein. Zonder `RESEND_API_KEY` in
   *  de omgeving wordt er sowieso niets verzonden, dus deze velden mogen placeholders blijven tot
   *  een klant daadwerkelijk een formulier krijgt. */
  mail: { naar: string; van: string }
  voet: {
    email: string
    bedrijf: string
    kvk: string
    /** BTW-identificatienummer (NL-formaat bv. `NL123456789B01`) — optioneel, alleen tonen/
     *  gebruiken als een klant 'm heeft (niet elke eenmanszaak heeft een apart btw-nummer). */
    btw?: string
    links: Knop[]
    sociaal: { naam: string; href: string }[]
    naarBoven: string
  }
}

export const site: SiteInhoud = {
  naam: 'Chris Bleeker',
  domein: 'https://www.christianbleeker.com',
  beschrijving: 'Websites voor MKB-bedrijven, zelfstandig ondernemers en makers, met 15 jaar marketingervaring en een slimme blik op AI.',

  /* Geen FAQ (besluit Lars 29-09). */
  faq: { items: [], eigenPaginaVanaf: 8, toonAantal: 5 },

  /* Niet gebruikt: /privacy is een eigen pagina (tekst in content/teksten.ts). */
  privacy: { kop: '', ondertitel: '', alinea: [] },

  aiTraining: false,
  /* Datum van de laatste inhoudelijke wijziging: voedt lastmod in de sitemap. */
  bijgewerkt: '2026-09-30',
  meting: { ga4: '', gtm: '', clarity: '' },
  /* `naar` blijft LEEG tot Chris een adres levert: dan meldt het formulier dat verzenden niet
     lukte (met LinkedIn als uitweg) en is `npm run keuring` rood (regel "formulier-ontvanger"). */
  mail: { naar: '', van: 'Chris Bleeker via Seveke Creative <formulier@seveke.nl>' },

  voet: {
    /* Onbekend tot Chris ze levert — leeg = niet tonen. */
    email: '',
    bedrijf: 'Chris Bleeker',
    kvk: '',
    links: [{ tekst: 'Privacyverklaring', href: '/privacy' }],
    sociaal: [
      { naam: 'LinkedIn', href: 'https://www.linkedin.com/in/christianbleeker/' },
      { naam: 'DenkProducties', href: 'https://www.denkproducties.nl/experts/chris-bleeker' },
      { naam: 'YouTube', href: 'https://www.youtube.com/watch?v=eOZOeLhRdcs' },
    ],
    naarBoven: 'Naar boven ↑',
  },
}
