/**
 * De twintig ontwerp-demo's van Seveke Creative (reeks 1 en 2, oktober 2026). Geen echte klanten:
 * elke demo is een werkende site op <slug>.portfolio.seveke.nl (noindex). Schermbeelden in
 * public/demo/<slug>-{1440,390}.webp, uit _demo-portfolio/eindronde.
 */
export type Demo = { slug: string; naam: string; beroep: string; plaats: string }

export const demos: Demo[] = [
  { slug: 'stapvoets', naam: 'Stapvoets', beroep: 'Fysiotherapie', plaats: 'Zwolle' },
  { slug: 'tussenuur', naam: 'Bureau Tussenuur', beroep: 'Virtual assistant', plaats: 'Utrecht' },
  { slug: 'schrapwerk', naam: 'Schrapwerk', beroep: 'Brandstrateeg', plaats: 'Rotterdam' },
  { slug: 'opdecent', naam: 'Op de Cent', beroep: 'Boekhouder', plaats: 'Amersfoort' },
  { slug: 'koerspeil', naam: 'Koerspeil', beroep: 'Executive coach', plaats: 'Den Haag' },
  { slug: 'ooghoogte', naam: 'Ooghoogte', beroep: 'Portretfotograaf', plaats: 'Eindhoven' },
  { slug: 'tweedelezing', naam: 'Tweede Lezing', beroep: 'Copywriter', plaats: 'Utrecht' },
  { slug: 'doorsnede', naam: 'Doorsnede', beroep: 'Interieurarchitect', plaats: 'Maastricht' },
  { slug: 'lachlijn', naam: 'Mondzorg Lachlijn', beroep: 'Tandarts', plaats: 'Haarlem' },
  { slug: 'viertellen', naam: 'Vier Tellen', beroep: 'Yogastudio', plaats: 'Arnhem' },
  { slug: 'paraaf', naam: 'Paraaf Advocaten', beroep: 'Advocaat voor ondernemers', plaats: 'Groningen' },
  { slug: 'punaise', naam: 'Punaise', beroep: 'Creatief bureau', plaats: 'Groningen' },
  { slug: 'detoeter', naam: 'De Toeter', beroep: 'Verloskundigen', plaats: 'Nijmegen' },
  { slug: 'opklaring', naam: 'Opklaring', beroep: 'Psychologenpraktijk', plaats: 'Nijmegen' },
  { slug: 'staldeur', naam: 'De Staldeur', beroep: 'Dierenartsen', plaats: 'Barchem' },
  { slug: 'jaarring', naam: 'Jaarring', beroep: 'Landschapsarchitectuur', plaats: 'Wageningen' },
  { slug: 'peiljaar', naam: 'Peiljaar', beroep: 'Financieel planner', plaats: 'Deventer' },
  { slug: 'draaglijn', naam: 'Draaglijn', beroep: 'Ingenieursbureau', plaats: 'Zwolle' },
  { slug: 'klankbouw', naam: 'Klankbouw', beroep: 'Logopedie', plaats: 'Leiden' },
  { slug: 'klaarblijk', naam: 'Klaarblijk', beroep: 'Data en AI', plaats: 'Eindhoven' },
]

export const demoUrl = (slug: string) => `https://${slug}.portfolio.seveke.nl`
