/**
 * Alle zichtbare tekst van de pagina's (behalve de cases: `cases.ts`). Twee soorten:
 * - letterlijk van de vorige versie van de site (de bron);
 * - een voorstel, gemarkeerd met `// voorstel`, ook opgenomen in `docs/copy-nieuw.md`.
 *   Home en Werk staan in de wij-vorm (Chris, Lars en Brian), Over in de ik-vorm van Chris.
 *   Een voorstel voegt geen nieuwe feiten toe en wacht op het akkoord van Chris.
 */

export const linkedin = 'https://www.linkedin.com/in/christianbleeker/'
export const dicterenUrl = 'https://www.dicteren.ai'
export const cocreatorsWachtlijst = 'https://www.co-creators.ai/'

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
  tedx: 'Official TEDxEindhoven advisor', // voorstel (feit, aangeleverd 01-10-2026; Engels op verzoek)
  intro: 'We bouwen websites voor MKB-bedrijven, zelfstandig ondernemers en makers. Met 15 jaar marketingervaring en een slimme blik op AI.', // voorstel (wij)
  knop: 'Bekijk alle projecten',
  tellers: [
    { waarde: 15, label: 'jaar marketingervaring' },
    { waarde: 13, label: 'websites' },
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
      { nr: '003', titel: 'Marketing', sub: 'Vijftien jaar ervaring in de mix.', tekst: 'We kijken niet alleen naar een mooie pagina, ook naar de mensen die je wilt bereiken en de stap die zij willen zetten.', lottie: 'service-3' }, // voorstel (wij)
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

/** v2 (28-10-2026): nieuwe teksten op de Home. Voorstel; zie docs/copy-nieuw.md. */
export const homeV2 = {
  explosie: {
    kop: ['Elk merk heeft', 'een eigen verhaal.'], // uit Werk ("Elk merk heeft een eigen verhaal.")
    reelLabel: 'Showreel van dertien websites die Chris maakte', // voorstel (toegankelijke naam)
  },
  over: { nadruk: 'verhaal' }, // het woord in de alinea van "Over mij" dat bij het oplichten vetter wordt
  reviews: {
    kop: 'Wat klanten zeggen', // voorstel
    label: 'Voorbeeld', // voorstel
    toelichting: 'Deze reviews zijn verzonnen. Ze laten zien hoe deze plek eruitziet en maken plaats voor echte reviews van klanten.', // voorstel (eerlijk tegenover bezoekers)
    items: [
      { naam: 'Eigenaar van een kinderopvang', score: 5, tekst: 'Chris vroeg eerst naar onze ouders en pas daarna naar de website. Dat merk je: de site beantwoordt nu de vragen die we vroeger aan de telefoon kregen.' },
      { naam: 'Directeur van een adviesbureau', score: 5, tekst: 'We hadden veel te vertellen en wisten niet waar we moesten beginnen. Na twee gesprekken lag er een opbouw waarin ons hele team zich herkende.' },
      { naam: 'Zelfstandig coach', score: 5, tekst: 'Geen jargon, wel scherpe keuzes. Chris schrapte de helft van mijn teksten en de site werd er sterker van.' },
      { naam: 'Oprichter van een sportwinkel', score: 4, tekst: 'Hij keek verder dan de mooie pagina: wie komt er binnen en welke stap wil die zetten? Daar is de hele site op gebouwd.' },
      { naam: 'Ondernemer in de zorg', score: 5, tekst: 'Ik was sceptisch over AI in mijn werk. Chris liet zien waar het helpt en waar niet, zonder het groter te maken dan het is.' },
      { naam: 'Marketingmanager in het mkb', score: 5, tekst: 'Duidelijke planning, eerlijk over wat wel en niet kon, en de site stond er op de afgesproken dag.' },
    ],
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
  cocreators: {
    naam: 'Co-Creators.ai',
    kicker: 'Jouw eigen AI-werkplek', // van co-creators.ai
    tekst: 'Een AI-team dat jouw bedrijf kent. In een werkplek die je zelf kunt aanpassen. Met je eigen ChatGPT of Claude.', // van co-creators.ai
    verhaal: [
      "Co-Creators.ai is een AI-werkplek op je eigen computer. Je klanten, projecten, bestanden en bedrijfskennis staan bij elkaar, en je eigen ChatGPT of Claude stuurt een team van elf AI-collega's aan, ieder met een eigen vak.", // voorstel (feiten van co-creators.ai)
      'Chris heeft het voorwerk gedaan: de werkwijzen staan klaar als skills die je zelf kunt aanpassen. Per collega en per handeling bepaal je wat zelfstandig mag, wat eerst gevraagd wordt en wat nooit gebeurt.', // voorstel (feiten van co-creators.ai)
    ],
    wachtlijst: 'Bij 1.000 inschrijvingen op de wachtlijst gaat Co-Creators.ai officieel live.', // voorstel (feit van co-creators.ai)
    link: 'Zet mij op de wachtlijst ↗', // knoptekst van co-creators.ai
    beeldAlt: 'De werkplek van Co-Creators.ai: een overzicht met het AI-team, taken en cijfers van de maand', // voorstel (alt)
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
  // v2 (28-10-2026): voorstel, zie docs/copy-nieuw.md. Alleen feiten uit de teksten hierboven.
  punten: [
    { x: '40%', y: '24%', titel: 'Hoi, ik ben Chris', tekst: 'Vijftien jaar marketeer. Nu maak ik websites en werk ik met AI.' },
    { x: '58%', y: '90%', titel: 'Aan tafel', tekst: 'Ik begin bij de mensen erachter: wat maakt jullie werk waardevol, en hoe laat je dat online voelen?' },
    { x: '28%', y: '71%', titel: 'Dicteren.ai', tekst: 'De lachende microfoon is het logo van Dicteren.ai: een app die gesproken ideeën omzet in bruikbare tekst. Ik bouw hem met Brian en Lars.' },
  ],
  reis: {
    kop: ['Van marketing ', 'naar', ' AI'], // [voor, nadruk in de schreefletter, na]
    stappen: [
      { titel: 'Marketing', tekst: 'Vijftien jaar marketingervaring. Daar leerde ik kijken naar de mensen die je wilt bereiken, en de stap die zij willen zetten.' },
      { titel: 'Websites', tekst: 'Die blik zit nu in elke website die ik maak: voor ondernemers, makers en teams die hun verhaal helder op het web willen zetten.' },
      { titel: 'AI en producten', tekst: 'Met Brian en Lars bouw ik Dicteren.ai, en bij TEDxEindhoven gaf ik een talk over AI. Technologie met een menselijk doel.' },
      { titel: 'Jouw verhaal', tekst: 'De volgende stap schrijven we samen. Wil je iets maken dat echt bij jouw verhaal past?' },
    ],
  },
  statement: 'Een goede website begint bij de mensen erachter.',
}

export const werk = {
  titel: 'Werk — websites van Chris Bleeker', // voorstel (meta)
  beschrijving: 'Dertien websites van kinderopvang en coaching tot teamreizen en AI, plus de eigen producten Dicteren.ai, Co-creatie.ai en Co-Creators.ai.', // voorstel (meta)
  kop: 'Elk merk heeft een eigen verhaal. We helpen het zichtbaar te maken op het web.', // voorstel (wij)
  websites: 'Websites',
  cursor: 'Bekijk', // voorstel (label bij de cursor)
  kort: 'In het kort',
  // v2 (28-10-2026): filter en ontwerp-demo's naast de echte klanten. Voorstel, zie docs/copy-nieuw.md.
  filter: { label: 'Toon werk', alles: 'Alles', klanten: 'Klanten', demos: "Demo's" },
  demos: {
    kicker: "Ontwerp-demo's",
    kop: 'Twintig vakken, twintig eigen gezichten',
    tekst: 'Dit zijn geen klanten. Het zijn ontwerpen die we maakten om te laten zien hoe een site voor een vak kan voelen, van fysiotherapeut tot ingenieursbureau. Elke demo is een werkende site: klik door en kijk rond.',
    label: 'Ontwerp-demo',
    carousel: "Twintig ontwerp-demo's",
    bekijk: 'Bekijk de demo',
    bekijkAlt: (naam: string) => `Bekijk de ontwerp-demo ${naam} (opent in een nieuw tabblad)`,
    schermAlt: (naam: string) => `De homepage van de ontwerp-demo ${naam} op een laptop`,
  },
  // v2 fase 2 (maker C): beeldwand onder de showcase (eindeloos-raster). Voorstel, zie docs/copy-nieuw.md.
  alles: {
    kicker: 'Alles door elkaar',
    kop: 'Blader door alles wat we maakten',
    tekst: 'Klanten en ontwerp-demo’s in één beeldwand. Blijf scrollen en hij komt terug; onderaan staat alles op een rij.',
    uitweg: 'Alles als lijst',
    lijstKop: 'Alles op een rij',
    klant: 'Klant',
    demo: 'Ontwerp-demo',
    eigen: 'Eigen product',
    caseAlt: (naam: string) => `Bekijk de case ${naam}`,
  },
}

export const casePagina = {
  kort: 'In het kort',
  ontwerpdoel: 'Ontwerpdoel',
  bekijk: 'Bekijk de site',
  bekijkAlt: (naam: string) => `Bekijk de site van ${naam} (opent in een nieuw tabblad)`, // voorstel (toegankelijke naam)
  volgende: 'Volgende case', // voorstel
  terug: 'Alle projecten', // voorstel
  schermAlt: (naam: string) => `Schermbeeld van de website van ${naam}`, // voorstel (alt)
  omslagAlt: (naam: string) => `De website van ${naam} op een scherm`, // voorstel (alt)
  titel: (naam: string) => `${naam} — werk van Chris Bleeker`, // voorstel (meta)
  beschrijving: (naam: string, kort: string) => `${naam}: ${kort} Een website van Chris Bleeker.`, // voorstel (meta)
  // v2 fase 2 (maker C): de echte site in een kader (live-demo-kader) en de volgende cases (kaartenstapel-zij).
  kader: {
    label: (naam: string) => `De website van ${naam} in een browservenster`, // voorstel
    beeld: 'Schermbeeld van de echte site', // voorstel
    live: 'De echte site, live in dit venster', // voorstel
    laad: 'Laad de echte site hier', // voorstel
    open: 'Bekijk de site in dit venster', // voorstel
    sluit: 'Sluit het venster', // voorstel
    skip: 'Sla het venster over', // voorstel
    titel: (naam: string) => `De live website van ${naam}`, // voorstel (iframe-titel)
    melding: 'Dit is een schermbeeld. De echte site opent via de knop eronder.', // voorstel
  },
  stapel: {
    kop: 'Verder kijken', // voorstel
    bekijk: 'Bekijk de case',
    alle: 'Alle projecten',
    alleTekst: 'Dertien websites en twintig ontwerp-demo’s op één pagina.', // voorstel
  },
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
        link: { href: 'checklist', label: 'Website-checklist prompt ↗' },
      },
    ],
  },
  tedx: {
    kop: 'De TEDx-talk', // voorstel
    tekst: 'Chris gaf een TEDx-talk over AI bij TEDxEindhoven.', // voorstel (feit uit Over)
  },
  // v2 (28-10-2026): voorstel, zie docs/copy-nieuw.md.
  voorNa: {
    kop: 'Deze site, vóór en na',
    tekst: 'Wat verandert er als je een website bouwt met een slimme blik op AI? We lieten het zien op onze eigen site. De teksten bleven hetzelfde.',
    label: 'Voor en na van christianbleeker.com',
    titel: 'christianbleeker.com',
    stappen: [
      { beeld: 'vnv-oud', label: 'Voor', zin: 'Dezelfde teksten, maar zonder gestructureerde gegevens. Een AI-assistent moest zelf raden wat er stond.', alt: 'De vorige homepage van Chris Bleeker: witte achtergrond, de kop Jouw verhaal. Sterk op het web. en een foto met duimen omhoog' },
      { beeld: 'vnv-nu-donker', label: 'Na', zin: 'Nu met gestructureerde gegevens, een deelbeeld per pagina en een llms.txt die AI-assistenten de weg wijst.', alt: 'De nieuwe homepage in donker: dezelfde kop groot over een foto van de TEDx-talk' },
      { beeld: 'vnv-nu-licht', label: 'Wit', zin: 'Dezelfde site, nu ook in wit. Je kiest zelf met de knop bovenin.', alt: 'De nieuwe homepage in wit, met dezelfde kop en foto' },
    ],
  },
  vragen: {
    kop: 'Zes vragen die AI over jou stelt',
    tekst: 'Vraagt iemand ChatGPT om een goede fysiotherapeut of webbouwer, dan zoekt ChatGPT het antwoord op websites. Staat het daar niet, dan noemt hij een ander.',
    kaarten: [
      { icoon: 'doelgroep', titel: 'Voor wie werk je?', tekst: 'Zet in gewone woorden op je site voor wie je er bent. Dan kan een assistent je noemen als iemand precies die vraag stelt.' },
      { icoon: 'product', titel: 'Wat bied je aan?', tekst: 'Elke dienst met een eigen naam en een korte uitleg, in tekst. Wat alleen in een plaatje of pdf staat, leest een assistent vaak niet mee.' },
      { icoon: 'plaats', titel: 'Waar werk je?', tekst: 'Je plaats of regio, of dat je overal online werkt. Wie in de buurt zoekt, vindt je alleen als het er staat.' },
      { icoon: 'prijs', titel: 'Wat kost het?', tekst: 'Een vanafprijs of een eerlijke bandbreedte. Zonder prijs vult een assistent het gat zelf in, of slaat hij je over.' },
      { icoon: 'prestaties', titel: 'Wat levert het op?', tekst: 'Cases, cijfers en ervaringen van klanten. Bewijs dat op je site staat, kan een assistent aanhalen.' },
      { icoon: 'positionering', titel: 'Waarom jij?', tekst: 'Wat je anders doet dan de rest, in één zin. Die zin vertelt een assistent over je na.' },
    ],
  },
  scan: {
    kopVoor: 'Wat niet op je site staat, is voor AI',
    kopWoord: 'onzichtbaar.',
    tekst: 'Zeven stellingen over je eigen website, met Ja of Nee. Je krijgt een score en de drie punten waar je het meest wint. Het is een zelftest: er wordt niets opgeslagen of verstuurd.',
    opener: 'Doe de AI-scan · 1 minuut',
    of: 'Liever eerst alles op een rij?',
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
    gelukt: 'Dank je. Je bericht is verstuurd.', // voorstel
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
  // v2 fase 2 (maker C). Alles hieronder is een voorstel (docs/copy-nieuw.md); prijzen in src/content/prijzen.ts.
  badge: 'Ruimte voor nieuwe projecten in',
  intake: {
    stap1: 'Eerst even kennismaken',
    bedrijf: 'Je bedrijf of project (mag leeg blijven)',
    stap2: 'Waar wil {bedrijf} naartoe?',
    stap2Terugval: 'Waar wil je bedrijf naartoe?',
    doelen: [
      { waarde: 'website', titel: 'Een nieuwe website', tekst: 'Je huidige site past niet meer bij wie je nu bent.' },
      { waarde: 'marketing', titel: 'Meer uit je site halen', tekst: 'De site staat, maar er komen te weinig goede gesprekken uit.' },
      { waarde: 'ai', titel: 'Aan de slag met AI', tekst: 'Je wilt weten wat AI voor jouw werk kan doen, zonder je eigen stem te verliezen.' },
      { waarde: 'anders', titel: 'Iets anders', tekst: 'Vertel het in de volgende stap.' },
    ],
    stap3: '{voornaam}, wat heb je voor ogen?',
    stap3Terugval: 'Wat heb je voor ogen?',
    bedankt: 'Dank je, {voornaam}.',
    bedanktTerugval: 'Dank je.',
    bedanktTekst: 'Je bericht is verstuurd. Alvast iets doen terwijl je wacht?',
    tips: [
      'Zet met de website-checklist prompt je bedrijf, je wensen en je materiaal op een rij.',
      'Kijk rond bij het werk en noteer welke sites je aanspreken, en waarom.',
    ],
    vooraf: { doel: 'Waar het om gaat', bedrijf: 'Bedrijf of project', pakket: 'Gekozen pakket' },
  },
  advies: {
    kicker: 'Welk pakket past bij jou?',
    kop: 'Twee vragen, één advies',
    tekst: 'Twijfel je wat je nodig hebt? Beantwoord twee korte vragen en je ziet welk pakket past, met een richtprijs.',
  },
  prijzen: {
    kicker: 'Open prijzen',
    kop: 'Wat kost het?',
    tekst: 'Richtprijzen, exclusief btw. Na een kennismaking krijg je een offerte die past bij wat je echt nodig hebt.',
  },
  agenda: {
    kop: 'Liever eerst even praten?',
    titel: 'Kennismaking met Chris',
    rol: 'Websites, marketing en AI',
    duur: '30 minuten',
    waar: 'Online',
    tekst: 'Een vrijblijvend gesprek: je vertelt waar je staat, we denken mee over de volgende stap.',
    link: 'Open de agenda in een nieuw tabblad',
    // VOORSTEL: het echte agenda-adres volgt van Chris (cal.com is een aanname).
    url: 'https://cal.com/christianbleeker/kennismaking',
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
