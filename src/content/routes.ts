import { cases } from '@/content/cases'
import { home, over, werk, ai, contact, privacy, casePagina } from '@/content/teksten'

/** Alle pagina's van de site, één keer: voedt de sitemap, llms.txt en de keuring (PRD P-1). */
export const routes: { pad: string; titel: string; beschrijving: string; prioriteit: number }[] = [
  { pad: '/', titel: home.titel, beschrijving: home.beschrijving, prioriteit: 1 },
  { pad: '/about', titel: over.titel, beschrijving: over.beschrijving, prioriteit: 0.8 },
  { pad: '/work', titel: werk.titel, beschrijving: werk.beschrijving, prioriteit: 0.9 },
  ...cases.map((c) => ({ pad: `/work/${c.slug}`, titel: c.naam, beschrijving: casePagina.beschrijving(c.naam, c.kort), prioriteit: 0.7 })),
  { pad: '/ai', titel: ai.titel, beschrijving: ai.beschrijving, prioriteit: 0.8 },
  { pad: '/contact', titel: contact.titel, beschrijving: contact.beschrijving, prioriteit: 0.8 },
  { pad: '/privacy', titel: privacy.titel, beschrijving: privacy.beschrijving, prioriteit: 0.2 },
]
