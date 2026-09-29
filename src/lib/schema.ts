import type { SiteInhoud } from '@/content/site'
import { TAAL_BCP47, type Taal } from '@/lib/i18n'

/**
 * Alle schema.org/JSON-LD-bouwstenen van de site, op één plek — elke pagina die structured data
 * uitstuurt importeert hiervandaan in plaats van zelf een object te bouwen, zodat alle JSON-LD uit
 * `content/site.ts` gevoed wordt ("NAP één keer invullen"). Puur data-in/data-uit, geen React, geen
 * server/client-onderscheid — mag overal geïmporteerd worden.
 *
 * `Service`/`Article` zijn hier bewust weg (aanbod/artikelen zijn ontwerp, geen infrastructuur —
 * zie `LEESMIJ.md`); een klantsite die diensten of artikelen krijgt, voegt die schema's zelf toe
 * op basis van zijn eigen contentmodel, met dit bestand als voorbeeld.
 */

type JsonLd = Record<string, unknown>

/** `Person`-schema voor de eigenaar — gebruikt als `founder` van de organisatie. */
export function personSchema(site: SiteInhoud): JsonLd {
  return {
    '@type': 'Person',
    name: site.naam,
    url: site.domein,
    image: `${site.domein}/beeld/team-chris.webp`,
    ...(site.voet.sociaal.length ? { sameAs: site.voet.sociaal.map((s) => s.href) } : {}),
  }
}

/** `CreativeWork` voor een casepagina. `url` van de echte site alleen als die bevestigd is. */
export function caseSchema(site: SiteInhoud, c: { slug: string; naam: string; kort: string; url: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: `Website ${c.naam}`,
    description: c.kort,
    inLanguage: 'nl-NL',
    image: `${site.domein}/beeld/${c.slug}-omslag-960.webp`,
    creator: personSchema(site),
    mainEntityOfPage: `${site.domein}/work/${c.slug}`,
    ...(c.url ? { url: c.url } : {}),
  }
}

/** `VideoObject` voor een YouTube-video (TEDx-talk). */
export function videoSchema(v: { naam: string; beschrijving: string; youtube: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.naam,
    description: v.beschrijving,
    thumbnailUrl: `https://i.ytimg.com/vi/${v.youtube}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtube}`,
    contentUrl: `https://www.youtube.com/watch?v=${v.youtube}`,
  }
}

/**
 * Organization/LocalBusiness (of een preciezer subtype via `site.schemaType`) — de NAP-bron
 * (naam/adres/telefoon/btw) voor de hele site. `adres`/`telefoon`/`geo`/`areaServed`/
 * `openingstijden`/`sameAs`/`reviews`/`btw` zijn stuk voor stuk optioneel in `content/site.ts` en
 * verschijnen hier alleen als ze zijn ingevuld — nooit een leeg of verzonnen veld.
 */
export function organizationSchema(site: SiteInhoud): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': site.schemaType || 'LocalBusiness',
    name: site.voet.bedrijf,
    url: site.domein,
    description: site.beschrijving,
    email: site.voet.email,
    ...(site.telefoon ? { telephone: site.telefoon } : {}),
    ...(site.adres ? { address: { '@type': 'PostalAddress', streetAddress: site.adres } } : {}),
    ...(site.voet.btw ? { vatID: site.voet.btw } : {}),
    ...(site.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng } }
      : {}),
    ...(site.areaServed?.length ? { areaServed: site.areaServed } : {}),
    ...(site.openingstijden?.length
      ? {
          openingHoursSpecification: site.openingstijden.map((o) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: o.dagen,
            opens: o.open,
            closes: o.dicht,
          })),
        }
      : {}),
    ...(site.voet.sociaal.length ? { sameAs: site.voet.sociaal.map((s) => s.href) } : {}),
    founder: personSchema(site),
    // Alleen echte cijfers (`site.reviews`, standaard leeg) — nooit fabriceren, zie het
    // veldcommentaar in `content/site.ts`.
    ...(site.reviews
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: site.reviews.waardering,
            reviewCount: site.reviews.aantal,
          },
        }
      : {}),
  }
}

/** `WebSite`-schema — apart van `Organization`: het ene beschrijft de site-als-document, het
 *  andere het bedrijf erachter. `taal` (standaard `'nl'`) bepaalt `inLanguage`. */
export function websiteSchema(site: SiteInhoud, taal: Taal = 'nl'): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.naam,
    url: site.domein,
    inLanguage: TAAL_BCP47[taal],
  }
}

/** `BreadcrumbList` — `items` is Home eerst, huidige pagina laatst, met volledige (absolute)
 *  URL's. Geen aparte visuele kruimelpad-component nodig: dit is puur voor crawlers/AI. */
export function breadcrumbSchema(items: { naam: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.naam,
      item: item.url,
    })),
  }
}

/** `FAQPage`-schema uit een vragenlijst — `null` als de lijst leeg is (nooit schema zonder
 *  zichtbare, bijbehorende content op dezelfde pagina uitsturen). Neemt de vragenlijst zelf aan
 *  (niet `SiteInhoud['faq']`, dat object draagt ook de drempel-instellingen) zodat de aanroeper
 *  kiest welke lijst: de volledige (`/veelgestelde-vragen`, boven de drempel) of de eerste N
 *  (homepage, t/m de drempel) — "nooit op twee pagina's tegelijk", zie `docs/SEO.md` § 9/§ 10. */
export function faqSchema(items: SiteInhoud['faq']['items']): JsonLd | null {
  if (items.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.vraag,
      acceptedAnswer: { '@type': 'Answer', text: f.antwoord },
    })),
  }
}
