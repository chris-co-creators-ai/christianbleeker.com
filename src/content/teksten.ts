/**
 * Alle zichtbare tekst van de pagina's (behalve de cases: `cases.ts`). Twee soorten:
 * - letterlijk van de vorige versie van de site (de bron);
 * - een voorstel, gemarkeerd met `// voorstel`, ook opgenomen in `docs/copy-nieuw.md`.
 *   Home en Werk staan in de wij-vorm (Chris, Lars en Brian), Over in de ik-vorm van Chris.
 *   Een voorstel voegt geen nieuwe feiten toe en wacht op het akkoord van Chris.
 */

export const linkedin = 'https://www.linkedin.com/in/christianbleeker/'
export const dicterenUrl = 'https://www.dicteren.ai'

export const kop = {
  merk: 'Chris Bleeker',
  ondertitel: 'Websites × marketing × AI',
  links: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'Over' },
    { href: '/work', label: 'Werk' },
    { href: '/ai', label: 'AI' }, // voorstel (nieuwe pagina)
    { href: '/contact', label: 'Contact' },
  ],
  checklist: 'Website-checklist prompt ↗',
  menu: 'Menu', // voorstel (knop van het mobiele menu)
}

export const voet = {
  kop: 'Een goed idee? Laten we praten.',
  bericht: 'Stuur me een bericht ↗',
  linkedin: 'LinkedIn',
  privacy: 'Privacyverklaring',
  naarBoven: 'Naar boven ↑',
}

export const home = {
  titel: 'Chris Bleeker — websites, marketing en AI', // voorstel (meta)
  beschrijving: 'Websites voor MKB-bedrijven, zelfstandig ondernemers en makers, met 15 jaar marketingervaring en een slimme blik op AI.', // voorstel (meta)
  kop: ['Jouw verhaal.', 'Sterk op het web.'],
  wissel: { voor: '×', woorden: ['websites', 'marketing', 'AI'] },
  fotoAlt: 'Chris Bleeker op het podium van TEDxEindhoven', // voorstel (alt)
  intro: 'We bouwen websites voor MKB-bedrijven, zelfstandig ondernemers en makers. Met 15 jaar marketingervaring en een slimme blik op AI.', // voorstel (wij)
  knop: 'Bekijk alle projecten',
  tellers: [
    { waarde: 15, label: 'jaar marketingervaring' },
    { waarde: 9, label: 'websites' },
    { waarde: 1, label: 'TEDx-talk over AI' },
  ],
  werk: {
    kop: 'Werk',
    tekst: 'Een selectie van websites die Chris heeft mogen maken, van kinderopvang en coaching tot teamreizen en AI.', // voorstel (wij-pagina, derde persoon: het werk is van Chris)
    naarCase: 'Bekijk de case', // voorstel (knop)
    alle: 'Bekijk alle projecten',
  },
  meer: { kop: 'Meer projecten', ondertitel: 'Verschillende merken, hun eigen verhaal' },
  doen: {
    kop: 'Wat we doen', // voorstel (wij)
    items: [
      { nr: '001', titel: 'Websites', sub: 'Jouw verhaal helder op het web.', tekst: 'We maken een website die laat zien wie je bent, wat je doet en waarom dat voor jouw bezoekers belangrijk is.', lottie: 'service-1' }, // voorstel (wij)
      { nr: '002', titel: 'Ontwerp', sub: 'Een uitstraling die bij je past.', tekst: 'Van eerste indruk tot laatste detail: inhoud en vorm werken samen om jouw merk herkenbaar te maken.', lottie: 'service-2' },
      { nr: '003', titel: 'Marketing', sub: 'Vijftien jaar ervaring in de mix.', tekst: 'We kijken niet alleen naar een mooie pagina, maar ook naar de mensen die je wilt bereiken en de stap die zij willen zetten.', lottie: 'service-3' }, // voorstel (wij)
      { nr: '004', titel: 'AI & producten', sub: 'Technologie met een menselijk doel.', tekst: 'We onderzoeken hoe AI en digitale producten echte vragen kunnen helpen oplossen, zonder jouw eigen stem te verliezen.', lottie: 'service-4' }, // voorstel (wij)
    ],
  },
  over: {
    kop: 'Over mij',
    tekst: 'Ik ben Chris Bleeker. Ik help ondernemers en teams hun verhaal online duidelijk te maken. Mijn achtergrond in marketing en mijn nieuwsgierigheid naar AI neem ik mee in websites en digitale producten die voor mensen werken.',
    link: 'Meer over mij',
    fotoAlt: 'Chris Bleeker, lachend met twee duimen omhoog', // voorstel (alt)
  },
}

export const eigenProduct = {
  kop: 'Eigen product',
  label: 'met Brian en Lars',
  dicteren: {
    naam: 'Dicteren.ai',
    tekst: 'Met Dicteren.ai bouwen we, Chris, Brian en Lars, aan een app die gesproken ideeën omzet in bruikbare tekst.', // voorstel (wij)
    link: 'Dicteren.ai ↗',
    beeldAlt: 'Logo van Dicteren.ai: een lachende microfoon', // voorstel (alt)
  },
  cocreatie: {
    naam: 'Co-creatie.ai',
    tekst: 'Een AI-partner is iets anders dan een losse tool of een verzameling prompts.', // voorstel (uit de casetekst, zonder "mijn")
    beeldAlt: 'Logo van Co-creatie.ai', // voorstel (alt)
  },
  team: [
    { naam: 'Chris', beeld: 'team-chris' },
    { naam: 'Brian', beeld: 'team-brian' },
    { naam: 'Lars', beeld: 'team-lars' },
  ],
}

export const over = {
  titel: 'Over Chris Bleeker — marketing, websites en AI', // voorstel (meta)
  beschrijving: 'Chris Bleeker maakt websites voor ondernemers, makers en teams, met vijftien jaar marketingervaring en een TEDx-talk over AI.', // voorstel (meta)
  kop: 'Over mij',
  alineas: [
    'Hoi, ik ben Chris Bleeker. Ik maak websites voor ondernemers, makers en teams die hun verhaal helder op het web willen zetten.',
    'Ik neem vijftien jaar marketingervaring mee in mijn werk. Daardoor kijk ik niet alleen naar hoe een website eruitziet, maar vooral naar wat bezoekers nodig hebben om je te begrijpen en een volgende stap te zetten.',
    'Ik houd van de combinatie van inhoud, ontwerp en technologie. Een goede website begint voor mij bij de mensen erachter: wat maakt hun werk waardevol, en hoe laat je dat online voelen?',
    'Naast websites werk ik met AI en digitale producten. Met Dicteren.ai bouwen we aan een manier om gesproken ideeën om te zetten in bruikbare tekst. Ik gaf een TEDx-talk over AI en sprak in podcasts over technologie en ondernemerschap.',
    'Wil je samen iets maken dat echt bij jouw verhaal past? Stuur me gerust een bericht.',
  ],
  knop: 'Stuur me een bericht', // bron: de voet, zonder pijl (interne link)
  portretAlt: 'Portret van Chris Bleeker aan tafel, met de microfoon van Dicteren.ai', // voorstel (alt)
  bekendVan: {
    kop: 'Bekend van',
    namen: [
      { naam: 'DenkProducties', beeld: 'logo-denkproducties', href: 'https://www.denkproducties.nl/experts/chris-bleeker' },
      { naam: 'TEDxEindhoven', beeld: 'logo-tedxeindhoven' },
      { naam: 'Dat is wel speciaal', beeld: 'podcast' },
    ],
  },
  websites: {
    kop: 'Websites',
    schijf: 'Bekijk alle projecten',
    ring: 'Websites × marketing × AI × ',
  },
  ervaringen: {
    kop: 'Ervaringen',
    hint: 'Klik om te vergroten',
    namen: [
      ['sven', 'Sven Dresen'], ['gina', 'Gina Schinkel'], ['els', 'Els Verheirstraeten'],
      ['annemieke', 'Annemieke Jongbloed'], ['bernard', 'Bernard Albada Jelgersma'],
      ['edwin', 'Edwin van Beers'], ['ela', 'Ela Zakrzewska'],
    ] as const,
    alt: (naam: string) => `LinkedIn-aanbeveling van ${naam} over Chris Bleeker`, // voorstel (alt)
  },
  gesprek: {
    kop: 'In gesprek',
    tedx: { titel: 'Mijn TEDx-talk', youtube: 'eOZOeLhRdcs' },
    denktank: { titel: 'DenkTank bij DenkProducties', youtube: 'ZAmHKw7I4YM' },
    podcast: { titel: 'Dat is wel speciaal', href: 'https://open.spotify.com/episode/3En3qEFfzzAaWAwRslOUJq', knop: 'Luister op Spotify ↗' }, // voorstel (knop)
  },
}

export const werk = {
  titel: 'Werk — websites van Chris Bleeker', // voorstel (meta)
  beschrijving: 'Negen websites van kinderopvang en coaching tot teamreizen en AI, plus de eigen producten Dicteren.ai en Co-creatie.ai.', // voorstel (meta)
  kop: 'Elk merk heeft een eigen verhaal. We helpen het zichtbaar te maken op het web.', // voorstel (wij)
  websites: 'Websites',
  cursor: 'Bekijk', // voorstel (label bij de cursor)
  kort: 'In het kort',
}

export const casePagina = {
  kort: 'In het kort',
  ontwerpdoel: 'Ontwerpdoel',
  bekijk: 'Bekijk de site ↗',
  volgende: 'Volgende case', // voorstel
  terug: 'Alle projecten', // voorstel
  schermAlt: (naam: string) => `Schermbeeld van de website van ${naam}`, // voorstel (alt)
  omslagAlt: (naam: string) => `De website van ${naam} op een scherm`, // voorstel (alt)
  titel: (naam: string) => `${naam} — werk van Chris Bleeker`, // voorstel (meta)
  beschrijving: (naam: string, kort: string) => `${naam}: ${kort} Een website van Chris Bleeker.`, // voorstel (meta)
}

export const ai = {
  titel: 'AI — persoonlijke AI-partners, Dicteren.ai en websites', // voorstel (meta)
  beschrijving: 'Wat Chris, Brian en Lars met AI doen: persoonlijke AI-partners, Dicteren.ai, websites met een slimme blik op AI en een TEDx-talk.', // voorstel (meta)
  kicker: 'AI', // voorstel
  kop: 'Technologie met een menselijk doel.',
  intro: 'We onderzoeken hoe AI en digitale producten echte vragen kunnen helpen oplossen, zonder jouw eigen stem te verliezen.', // voorstel (wij)
  tweede: 'Chris gaf er een TEDx-talk over bij TEDxEindhoven, en samen met Brian en Lars bouwt hij eigen AI-producten.', // voorstel
  fotoAlt: 'Chris Bleeker tijdens zijn TEDx-talk over AI', // voorstel (alt)
  wat: {
    kop: 'Wat we met AI doen', // voorstel
    items: [
      {
        titel: 'Persoonlijke AI-partners', // voorstel
        tekst: 'Een AI-partner is iets anders dan een losse tool of een verzameling prompts. Op Co-creatie.ai legt Chris uit hoe een persoonlijke partner werkt, wat het traject inhoudt en waar je hem in de praktijk voor gebruikt.', // voorstel (uit de casetekst)
        link: { href: '/work/co-creatie-ai', label: 'Bekijk de case' },
      },
      {
        titel: 'Dicteren.ai',
        tekst: 'Een app die gesproken ideeën omzet in bruikbare tekst, gebouwd door Chris, Brian en Lars.', // voorstel (uit Werk)
        link: { href: dicterenUrl, label: 'Dicteren.ai ↗' },
      },
      {
        titel: 'Websites met een slimme blik op AI', // voorstel (uit de Home-intro)
        tekst: 'Websites voor MKB-bedrijven, zelfstandig ondernemers en makers, met 15 jaar marketingervaring erachter.', // voorstel
        link: { href: '/work', label: 'Bekijk alle projecten' },
      },
      {
        titel: 'De website-checklist prompt', // voorstel
        tekst: 'Een intake-assistent in ChatGPT: in 20 tot 30 minuten zet je je bedrijf, je wensen en je materiaal op een rij.', // voorstel (uit de prompt zelf)
        link: { href: '/contact', label: 'Naar contact' }, // voorstel
      },
    ],
  },
  tedx: {
    kop: 'De TEDx-talk', // voorstel
    tekst: 'Chris gaf een TEDx-talk over AI bij TEDxEindhoven.', // voorstel (feit uit Over)
  },
}

export const contact = {
  titel: 'Contact — Chris Bleeker', // voorstel (meta)
  beschrijving: 'Wil je samen iets maken dat echt bij jouw verhaal past? Stuur een bericht of begin met de website-checklist prompt.', // voorstel (meta)
  kop: 'Contact',
  tekst: 'Wil je samen iets maken dat echt bij jouw verhaal past? Stuur me gerust een bericht.',
  formulier: {
    naam: 'Naam', // voorstel
    email: 'E-mailadres', // voorstel
    bericht: 'Je bericht', // voorstel
    verstuur: 'Verstuur bericht', // voorstel
    bezig: 'Bezig met versturen…', // voorstel
    privacy: 'We gebruiken je gegevens alleen om te reageren.', // voorstel
    privacyLink: 'Lees de privacyverklaring.', // voorstel
    gelukt: 'Dank je. Je bericht is verstuurd en je krijgt een bevestiging per mail.', // voorstel
    mislukt: 'Versturen lukte niet. Stuur je bericht via LinkedIn, dan komt het toch aan.', // voorstel
    fouten: {
      naam: 'Vul je naam in.', // voorstel
      email: 'Vul een geldig e-mailadres in.', // voorstel
      bericht: 'Schrijf een kort bericht.', // voorstel
    },
  },
  linkedin: 'LinkedIn ↗',
  checklist: {
    kop: 'Liever eerst alles op een rij?', // voorstel
    tekst: 'De website-checklist prompt opent een intake-assistent in ChatGPT. In 20 tot 30 minuten zet je je bedrijf, je wensen en je materiaal op een rij.', // voorstel (uit de prompt zelf)
  },
}

export const privacy = {
  titel: 'Privacyverklaring — Chris Bleeker', // voorstel (meta)
  beschrijving: 'Welke gegevens deze site verwerkt, waarom, hoe lang, en hoe je ze kunt laten inzien of wissen.', // voorstel (meta)
  kop: 'Privacyverklaring', // voorstel
  blokken: [
    { kop: 'Wie', tekst: 'Deze site is van Chris Bleeker. Vragen over je gegevens stel je via LinkedIn of het contactformulier.' },
    { kop: 'Het contactformulier', tekst: 'Vul je het formulier in, dan ontvangen we je naam, je e-mailadres en je bericht. We gebruiken ze alleen om te reageren, en bewaren ze niet langer dan daarvoor nodig is. De mail gaat via Resend, dat hem namens ons verstuurt.' },
    { kop: 'Bezoek meten', tekst: 'We tellen bezoek met Vercel Web Analytics. Dat werkt zonder cookies en zonder gegevens die jou persoonlijk herkennen.' },
    { kop: "Video's en podcast", tekst: "De video's van YouTube laden pas als je op afspelen klikt, via youtube-nocookie.com. De podcast opent op Spotify zelf. Tot die klik stuurt deze site niets naar YouTube of Spotify." },
    { kop: 'Je rechten', tekst: 'Je mag altijd vragen welke gegevens we van je hebben, en ze laten aanpassen of wissen. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.' },
  ], // voorstel (hele verklaring; bedrijfsnaam en e-mail volgen van Chris)
}

export const nietGevonden = {
  kop: 'Deze pagina bestaat niet.',
  tekst: 'Het adres klopt niet (meer), of de pagina is verplaatst.',
  home: 'Naar de homepage',
}

export const tabLokzin = 'Jouw verhaal wacht nog.' // voorstel (tabbladtitel bij wegklikken)
