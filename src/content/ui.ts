/**
 * Generieke UI-tekst die niet bij één sectie hoort en dus niet in `site.ts` past: de skip-link,
 * de "terug naar de site"-link in de kop, de cookiemelding, het sluitlabel van het privacy-
 * dialoogje, de taalwisselaar en de 404-pagina.
 *
 * Zelfde patroon als `content/site.ts`: dit bestand is de NL-referentie, `ui.en.ts`/`ui.de.ts`
 * zijn de vertalingen (zelfde `UiInhoud`-type, gevalideerd door `src/lib/vertaal.ts`).
 */
export type UiInhoud = {
  skipLink: string
  taalWisselaarLabel: string
  cookie: {
    ariaLabel: string
    tekst: string
    privacyLinkLabel: string
    weigeren: string
    akkoord: string
  }
  privacySluiten: string
  notFound: {
    titelTag: string
    kicker: string
    titel: string
    tekst: string
    homepage: string
  }
  faq: { kop: string; alleVragen: string }
  /** `{naam}` wordt vervangen door `site.naam` — zie `vulSjabloonIn` in `src/lib/i18n.ts`. */
  veelgesteldeVragenPagina: { titel: string; beschrijvingTemplate: string }
  breadcrumb: { veelgesteldeVragen: string }
}

export const ui: UiInhoud = {
  skipLink: 'Direct naar de inhoud',
  taalWisselaarLabel: 'Taal',
  cookie: {
    ariaLabel: 'Cookiemelding',
    tekst: 'Deze site meet bezoek pas als je akkoord gaat — zie de',
    privacyLinkLabel: 'privacyverklaring',
    weigeren: 'Liever niet',
    akkoord: 'Akkoord',
  },
  privacySluiten: 'Sluiten',
  notFound: {
    titelTag: 'Pagina niet gevonden',
    kicker: '404',
    titel: 'Deze pagina bestaat niet.',
    tekst: 'Het adres klopt niet (meer), of de pagina is verplaatst.',
    homepage: 'Naar de homepage',
  },
  faq: { kop: 'Veelgestelde vragen', alleVragen: 'Alle vragen' },
  veelgesteldeVragenPagina: {
    titel: 'Veelgestelde vragen',
    beschrijvingTemplate: 'Antwoord op vragen die het vaakst gesteld worden bij {naam}.',
  },
  breadcrumb: {
    veelgesteldeVragen: 'Veelgestelde vragen',
  },
}
