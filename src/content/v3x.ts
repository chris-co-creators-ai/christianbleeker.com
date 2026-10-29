/**
 * v3x (29-10): teksten voor de nieuwe blokken. Alles hieronder is een VOORSTEL van Seveke Creative (nog niet
 * goedgekeurd door Chris). Namen, bedrijven, uren en abonnementen in de voorbeelden zijn verzonnen; de
 * pakketprijzen komen uit src/content/prijzen.ts (één bron).
 */
import { diensten, euro } from './prijzen'

const apps = diensten.find((d) => d.id === 'apps')!
const website = diensten.find((d) => d.id === 'website')!
export const appPakketten = apps.pakketten
export const startPrijs = website.pakketten[0].prijs
const proces = apps.pakketten[0]

/** Maanden waarover de eenmalige prijs van één werkproces in de rekenhulp wordt verdeeld (alleen om te vergelijken). */
export const MAANDEN = 36

export const interneApps = {
  id: 'interne-apps',
  nr: '05',
  naam: 'Interne apps',
  kop: 'Apps voor binnen je bedrijf',
  tekst: 'Niet voor je klanten, maar voor je team: uren, verlof, klantdossiers en een kennisbank waarin je met AI zoekt. Op je eigen adres en op een server in Europa.',
  label: 'Voorbeeld',
  tour: {
    label: 'Rondleiding door vier voorbeeld-apps voor binnen een bedrijf',
    slug: 'jouwbedrijf',
    werkruimte: 'Jouw bedrijf',
  },
  naamVeld: {
    label: 'Bekijk het met je eigen bedrijfsnaam',
    placeholder: 'Bijvoorbeeld Installatiebedrijf Vos',
    uitleg: 'Je naam blijft in dit tabblad en verdwijnt als je het sluit. Er gaat niets naar een server.',
  },
  kaarten: {
    kop: 'Wat we bijvoorbeeld bouwen',
    tekst: 'Elke app doet één ding goed. Begin met één klus en bouw later uit.',
  },
  varianten: {
    kop: 'Drie varianten',
    tekst: 'Hoe meer je team ermee doet, hoe langer het bouwen. De prijzen zijn richtprijzen, exclusief btw.',
    caption: 'Interne apps: richtprijs per variant',
    blokUitleg: 'Elk blok is een week bouwtijd (de bovengrens).',
    link: 'Bekijk wat er in elke variant zit',
  },
  rekenen: {
    kop: 'Losse abonnementen of één eigen app?',
    tekst: 'Een indicatie: wat je nu per gebruiker betaalt, naast wat een eigen app per maand zou kosten als je de eenmalige prijs over drie jaar verdeelt.',
    terugval: `Eén werkproces kost eenmalig ${euro(proces.prijs)}, exclusief btw.`,
    terugvalLink: 'Vraag een eigen app aan',
  },
}

/** Configuratie van de besparingscalculator. SaaS-namen en -prijzen zijn verzonnen voorbeelden (indicatie). */
export const rekenConfig = {
  product: 'Eigen app',
  team: { min: 1, max: 12, standaard: 8 },
  staffel: { perApp: Math.round(proces.prijs / MAANDEN), kortingPerExtraApp: 0, minimumPerApp: 0 },
  standaardApps: ['uren', 'verlof', 'klanten'],
  contactUrl: '/contact?dienst=apps&pakket=proces',
  locale: 'nl-NL',
  btwRegel: `Indicatie, exclusief btw. De abonnementen en hun prijzen zijn verzonnen voorbeelden. Elke vervangen tool rekenen we als één werkproces (${euro(proces.prijs)} eenmalig), verdeeld over ${MAANDEN} maanden zodat je per maand kunt vergelijken. Hosting en onderhoud zijn niet meegerekend.`,
  teksten: {
    teamVraag: 'Met hoeveel mensen werk je ermee?',
    teamHulp: 'Losse abonnementen rekenen vaak per gebruiker. Een eigen app kost hetzelfde, of je nu met 2 of {max} mensen bent.',
    toolsVraag: 'Welke abonnementen betaal je nu? (verzonnen voorbeelden)',
    nuLabel: 'Nu aan abonnementen',
    huidigeTools: 'Huidige abonnementen',
    onsLabel: 'Eigen app, per maand verdeeld',
    aantalLabel: 'Werkprocessen',
    perAppLabel: 'Per werkproces',
    cta: 'Vraag een eigen app aan',
    vergelijkKop: 'Wat je nu betaalt, en wat een eigen app kost',
    vastePrijs: `eenmalig, verdeeld over ${MAANDEN} maanden`,
    app: '{n} werkproces',
    apps: '{n} werkprocessen',
    labelLeeg: 'Kies je huidige abonnementen',
    labelBesparing: 'Indicatie: je bespaart per jaar',
    labelDuurder: 'Indicatie: je betaalt per jaar meer',
    labelGelijk: 'Indicatie: je betaalt per jaar hetzelfde',
    eerlijk: 'Voor een team van {team} zijn losse abonnementen goedkoper. Een eigen app kies je dan omdat je werkwijze niet in een standaardpakket past, niet om de prijs.',
    volgendeLeeg: `Vink aan welke abonnementen je nu betaalt. Eén werkproces kost eenmalig ${euro(proces.prijs)}, verdeeld over ${MAANDEN} maanden {prijs} per maand.`,
    volgendeAlles: 'Je vervangt alle {aantal} abonnementen. Vraag dan naar een Teamapp: meer werkprocessen in één app.',
    volgende: 'Vervang je er nog een, dan komt er **{extra}** per maand bij. Bij drie of meer is een Teamapp vaak voordeliger.',
    vergelijkSub: 'Per maand, voor {apps} en een team van {mensen}.',
    vergelijkSubLeeg: 'Kies hierboven je huidige abonnementen om te vergelijken.',
    voetBesparing: 'Indicatie: {pct}% minder, {perMaand} per maand en {perJaar} per jaar. Een nieuwe collega kost bij een eigen app niets extra.',
    voetDuurder: 'Voor een team van {team} zijn losse abonnementen {verschil} per maand goedkoper.',
    voetGelijk: 'Je betaalt ongeveer hetzelfde als nu.',
    liveBesparing: 'Indicatie: met {apps} en een team van {team} bespaar je {perJaar} per jaar.',
    liveDuurder: 'Indicatie: bij deze keuze betaal je {perJaar} per jaar meer dan met losse abonnementen.',
    liveGelijk: 'Indicatie: bij deze keuze betaal je ongeveer hetzelfde als nu.',
    liveLeeg: 'Geen abonnementen gekozen.',
  },
  apps: [
    { id: 'uren', naam: 'Urenregistratie', inPlaatsVan: 'Klokwerk', perGebruikerCent: 700 },
    { id: 'verlof', naam: 'Verlof en rooster', inPlaatsVan: 'Roosterpad', perGebruikerCent: 450 },
    { id: 'klanten', naam: 'Klantdossier', inPlaatsVan: 'Klantkompas', perGebruikerCent: 1500 },
    { id: 'kennis', naam: 'Kennisbank met AI-zoeken', inPlaatsVan: 'Weetwiki', perGebruikerCent: 1000 },
    { id: 'checklist', naam: 'Checklists met foto’s', inPlaatsVan: 'Vinkvast', perGebruikerCent: 600 },
  ],
}

/** Werkwijze websites (stappen uit de Linkbox-standaardmail, herschreven voor een klant zonder partner). */
export const werkwijze = {
  kicker: `Websites vanaf ${euro(startPrijs)}`,
  kop: 'Zo werken we samen',
  tekst: 'Van één prompt tot een site die van jou is. Gemiddeld één tot twee weken voor een Start-site.',
  label: 'Voorbeeld',
  stappen: [
    { kop: 'Je krijgt een prompt van ons.', tekst: 'Die plak je in ChatGPT of Claude.' },
    { kop: 'De AI stelt je de vragen.', tekst: 'Hij verzamelt alles wat wij nodig hebben: teksten, afbeeldingen, logo en wensen.' },
    { kop: 'Het bestand stuur je naar ons.', tekst: 'Daarmee kunnen we meteen beginnen.' },
    { kop: 'Wij bouwen je site.', tekst: 'Tot hij aan onze eisen voldoet, en dan krijg je een voorbeeldlink.' },
    { kop: 'Je geeft feedback.', tekst: 'Je loopt door de site en zegt wat anders moet, tot je tevreden bent.' },
    { kop: 'Live en overdracht.', tekst: 'Wij zetten de site live en dragen alles over, ook de server en de opslag. Met ons stappenplan kan dat binnen 20 minuten; daarna beheer je hem zelf.' },
  ],
}

/** Team op /about: de drie teamleden en waar ze aan werken. */
export const teamHub = {
  label: 'Chris, Brian en Lars, verbonden met Dicteren.ai, Co-Creators.ai en Seveke Creative',
  bronLabel: 'Team',
  doelLabel: 'Producten en bureau',
  leden: [{ naam: 'Chris', foto: 'team-chris' }, { naam: 'Brian', foto: 'team-brian' }, { naam: 'Lars', foto: 'team-lars' }],
  hub: 'Samen',
  via: '',
  met: 'verbonden met',
}
