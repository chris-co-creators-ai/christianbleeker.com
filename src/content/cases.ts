/**
 * De websites op /work en /work/<naam>. Negen komen letterlijk van de vorige versie van de site
 * (in de ik-vorm van Chris: het is zijn werk). De eerste vier maakten we samen; hun tekst is een
 * voorstel in de wij-vorm (docs/copy-nieuw.md). `url` blijft leeg tot het adres bevestigd en de
 * site live is — zonder `url` verschijnt er geen link naar de echte site.
 */
export type Case = {
  slug: string
  naam: string
  kort: string
  alineas: [string, string]
  ontwerpdoel: string
  /** Adres van de echte site. Leeg = nog niet bevestigd, dus niet tonen. */
  url: string
  /** Ook een eigen product (tegel bij Eigen product op /work). */
  eigenProduct?: boolean
}

export const cases: Case[] = [
  {
    slug: 'human-margin',
    naam: 'Human Margin',
    kort: 'Een uitgesproken site voor Els Verheirstraeten, die organisaties begeleidt bij het gebruik van AI.', // voorstel
    alineas: [
      'Human Margin is het bureau van Els Verheirstraeten. Ze begeleidt organisaties bij het gebruik van AI, met een nulmeting, een regietraject, een academie en sparring. We hebben haar site gebouwd in haar eigen huisstijl: zwart, wit en fel geel.', // voorstel
      'De site is zo gebouwd dat Els haar teksten zelf kan bijwerken via ChatGPT. Ze vraagt een wijziging in gewone taal, krijgt een voorstel te zien en keurt het goed voordat het online staat.', // voorstel
    ],
    ontwerpdoel: 'Eerst de stelling van Els en waarom die nu telt, daarna haar aanbod en de stap naar een kennismaking. De site laat zien waar zij voor staat voordat het over diensten gaat.', // voorstel
    url: '', // humanmargin.eu toont nog "Coming Soon" (gemeten 30-09-2026); invullen zodra de site live is
  },
  {
    slug: 'hoveniersbedrijf-nijboer',
    naam: 'Hovenier Nijboer',
    kort: 'Een site voor een hovenier, met bellen of appen vanaf het eerste scherm.', // voorstel
    alineas: [
      'Een hovenier wil gebeld worden, niet gelezen. We hebben deze site daarom kort en direct gehouden, in de toon van de hovenier zelf: geen praatjes vooraf, gewoon een tuin die klopt.', // voorstel
      'De site opent met wat de hovenier doet en waar hij werkt. Bellen of appen kan meteen vanaf het eerste scherm, en daaronder staat in drie stappen hoe het werkt.', // voorstel
    ],
    ontwerpdoel: 'Een bezoeker ziet bovenaan wie er komt, wat hij doet en hoe je hem bereikt. De rest van de site onderbouwt dat met diensten en projecten.', // voorstel
    url: '', // link volgt
  },
  {
    slug: 'stratenova-advisory',
    naam: 'Stratenova Advisory',
    kort: 'Een drietalige site voor een onafhankelijk adviseur in sourcing en contractmanagement.', // voorstel
    alineas: [
      'Stratenova Advisory is het adviesbureau van Devi Kencki. Hij helpt bestuurders en teams met sourcingstrategie, commerciële dealarchitectuur, contractmanagement en de transformatie van Finance, IT en Procurement. We hebben zijn site gebouwd in het Nederlands, Engels en Duits.', // voorstel
      'De toon is die van de boardroom: rustig, met een klassieke letter voor de koppen en uitspraken die groot in beeld komen. De inhoud staat per taal apart, zodat de teksten later makkelijk bij te werken zijn.', // voorstel
    ],
    ontwerpdoel: 'Van boardroomstrategie naar werkende deals, contracten en transformaties: de site volgt die lijn, van de expertise naar de stap naar een gesprek.', // voorstel
    url: '',
  },
  {
    slug: 'seveke-creative',
    naam: 'Seveke Creative',
    kort: 'De site van Seveke Creative, dat maatwerk software en slimme automatisering bouwt voor het mkb.', // voorstel
    alineas: [
      'Seveke Creative bouwt maatwerk software, AI-agents en slimme workflows voor mkb-organisaties, vanuit Nijmegen. De site zet de vraag van de ondernemer voorop: jij vertelt wat er knelt, wij bouwen wat het oplost.', // voorstel
      'Bezoekers kunnen meteen een gratis AI-scan starten en krijgen het rapport in hun inbox. Daarnaast legt de site uit waar elk project op rust, van één eigen systeem tot AI die werk overneemt.', // voorstel
    ],
    ontwerpdoel: 'Minder gedoe, meer resultaat: de site maakt de eerste stap klein, met een scan van vijf minuten.', // voorstel
    url: 'https://www.seveke.nl',
  },
  {
    slug: 'offbeat-peak',
    naam: 'Offbeat Peak',
    kort: 'Een redactionele ontdekkingstocht langs minder bekende plekken.',
    alineas: [
      'Bij Offbeat Peak draait reizen om plekken die je niet uit een standaard top-tienlijst haalt. Ik heb de site als een digitaal reisverhaal benaderd.',
      'Bestemmingen, ervaringen en routes nodigen uit om te dwalen, terwijl de navigatie bezoekers ook helpt gericht te plannen. De redactionele toon draagt het gevoel van ontdekking.',
    ],
    ontwerpdoel: 'Eerst ontstaat nieuwsgierigheid naar een plek; daarna komt de stap naar een eigen reisplan in beeld. De site brengt inspiratie en planning samen.',
    url: '',
  },
  {
    slug: 'digital-waves',
    naam: 'Digital Waves',
    kort: 'Een uitgesproken digitale agency-site voor ambitieuze merken.',
    alineas: [
      'Digital Waves vraagt om een website met dezelfde directheid als het bureau zelf. Ik heb de positionering vooraan gezet en de route naar diensten, eerder werk en contact kort gehouden.',
      'Grote typografie en een uitgesproken ritme geven het merk een eigen gezicht. De inhoud maakt duidelijk waar het bureau voor staat: marketing, content en AI in dienst van ambitieuze merken.',
    ],
    ontwerpdoel: 'De site laat meteen voelen wat voor bureau Digital Waves is en geeft daarna een eenvoudige weg naar de diensten, het werk en een gesprek.',
    url: '',
  },
  {
    slug: 'driftawave',
    naam: 'Driftawave',
    kort: 'Een avontuurlijke site voor retreats, workations en offsites.',
    alineas: [
      'Driftawave verkoopt geen standaard vergaderlocatie, maar ervaringen die teams buiten hun gewone omgeving brengen. Ik heb de website gebouwd rond die energie.',
      'Retreats, workations en offsites zijn direct herkenbaar, met ruimte voor programma’s, sfeer, ervaringen van klanten en het team erachter. De site brengt inspiratie en praktische oriëntatie bij elkaar.',
    ],
    ontwerpdoel: 'Wie binnenkomt met een eerste idee, kan verder kijken welk type ervaring bij het eigen team past en hoe een gesprek over een offsite begint.',
    url: '',
  },
  {
    slug: 'radstok-interim',
    naam: 'Radstok Interim',
    kort: 'Van operationele chaos naar voorspelbare groei.',
    alineas: [
      'Voor Stefan Radstok heb ik een website gemaakt die zijn belofte meteen helder neerzet: van operationele chaos naar voorspelbare groei. De combinatie van resultaat en aandacht voor mensen komt terug in het verhaal, de vormgeving en de route door de site.',
      'Bezoekers kunnen zijn aanpak en ervaring verkennen, of direct de stap zetten naar een kennismaking of de Operations Scan. Zo blijft de inhoud praktisch en persoonlijk, net als het werk van Radstok Interim.',
    ],
    ontwerpdoel: 'De site vertaalt ‘Hard én Hart’ naar een duidelijke structuur: eerst de operationele uitdaging, daarna de aanpak, de mens erachter en een concrete volgende stap.',
    url: '',
  },
  {
    slug: 'fuselabs',
    naam: 'FuseLabs',
    kort: 'AI-strategie en productbouw beginnen bij een zakelijke vraag.',
    alineas: [
      'Bij FuseLabs begint het gesprek niet met een AI-tool, maar met een zakelijke vraag. Ik heb de website zo opgebouwd dat bezoekers eerst het doel begrijpen.',
      'Daarna kunnen zij zien hoe strategie, een eerste werkend concept en maatwerksoftware daarop aansluiten. De onderdelen over werkwijze, mogelijkheden, eerder werk en private AI geven verdieping zonder de eerste boodschap te verstoppen.',
    ],
    ontwerpdoel: 'Technologie krijgt pas betekenis als een organisatie er echt mee kan werken. De site houdt die zakelijke uitkomst voorop.',
    url: '',
  },
  {
    slug: 'souplesse-runners-boutique',
    naam: 'Souplesse Runners Boutique',
    kort: 'Een plek voor hardlopers, advies en de webshop.',
    alineas: [
      'Souplesse is meer dan een winkel met hardloopschoenen. Voor de website heb ik de verschillende kanten van het merk bij elkaar gebracht: de boutique, het assortiment, de loopanalyse, verhalen voor lopers en de webshop.',
      'Bezoekers kunnen inspiratie opdoen, zich verdiepen in persoonlijk advies of gericht naar een product zoeken. Die combinatie maakt de site bruikbaar voor wie vandaag wil bestellen én voor wie eerst de mensen achter de winkel wil leren kennen.',
    ],
    ontwerpdoel: 'De website verbindt winkelbezoek, community, loopanalyse en online shoppen zonder dat één van die routes de rest verdringt.',
    url: '',
  },
  {
    slug: 'kinderopvang-ikke',
    naam: 'Kinderopvang Ikke',
    kort: 'Een warm digitaal welkom voor ouders in Nijmegen.',
    alineas: [
      'Een kinderopvangwebsite moet ouders niet overdonderen, maar vertrouwen geven. Voor Ikke heb ik de site rond hun eerste vragen opgebouwd: hoe ziet de opvang eruit, welke plek past bij mijn kind en wat gebeurt er na een rondleiding?',
      'De route naar een bezoek is zichtbaar, terwijl de verschillende locaties en opvangvormen ruimte krijgen om hun eigen verhaal te vertellen. Zo helpt de website ouders eerst een gevoel bij Ikke te krijgen en daarna een volgende stap te zetten.',
    ],
    ontwerpdoel: 'De site brengt dagopvang, buitenschoolse opvang, drie locaties en de rondleiding samen. Ouders kunnen zich oriënteren zonder de praktische weg naar een bezoek kwijt te raken.',
    url: '',
  },
  {
    slug: 'win-instituut',
    naam: 'WIN Instituut',
    kort: 'Een digitale plek voor weerbaarheid, groei en leiderschap.',
    alineas: [
      'WIN verbindt fysieke, mentale, sociale en emotionele weerbaarheid. Voor de website heb ik die veelomvattende methode een digitale structuur gegeven.',
      'Bezoekers kunnen zich verdiepen in de visie, therapie en coaching, opleidingen en workshops. Het onderwerp vraagt om meer dan een mooie eerste indruk: iemand moet kunnen herkennen welke ingang voor hem of haar relevant is.',
    ],
    ontwerpdoel: 'De inhoud maakt de integratieve, psychofysieke en systemische aanpak zichtbaar zonder die te reduceren tot één dienst of doelgroep.',
    url: '',
  },
  {
    slug: 'co-creatie-ai',
    naam: 'Co-creatie.ai',
    kort: 'Mijn eigen verhaal over persoonlijke AI-partners.',
    alineas: [
      'Voor Co-creatie.ai moest ik mijn eigen overtuiging helder maken: een AI-partner is iets anders dan een losse tool of een verzameling prompts.',
      'Op de website leg ik eerst het herkenbare probleem uit en daarna hoe een persoonlijke partner werkt, wat het traject inhoudt en waar je hem in de praktijk voor gebruikt.',
    ],
    ontwerpdoel: 'De opbouw helpt bezoekers mijn visie te toetsen voordat ze een demo boeken. Het is niet alleen een productpagina, maar ook een uitleg van hoe ik mens en technologie laat samenwerken.',
    url: '',
    eigenProduct: true,
  },
]

export const caseVoor = (slug: string) => cases.find((c) => c.slug === slug)

/** Volgorde op de Home-stapel: vijf uiteenlopende branches. */
export const homeSelectie = ['radstok-interim', 'fuselabs', 'driftawave', 'kinderopvang-ikke', 'co-creatie-ai']
