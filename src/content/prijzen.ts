/**
 * Open prijzen op /contact (prijzen-per-dienst) en het advies "welk pakket past bij jou" (advies-funnel).
 *
 * VOORSTEL — ALLE BEDRAGEN, PAKKETNAMEN EN INHOUD ZIJN EEN VOORSTEL VAN SEVEKE CREATIVE (28-10-2026; prijzen bijgesteld 29-10 door Lars: website vanaf € 750 met alles uit de Linkbox-standaardmail, twee verhogingen, marketing lager, interne apps erbij).
 * Chris heeft ze nog niet goedgekeurd; ze staan zo ook in docs/copy-nieuw.md. Eén bron: de funnel
 * leest zijn richtprijzen uit deze lijst, zodat advies en prijstabel elkaar nooit tegenspreken.
 */
export type Pakket = {
  id: string
  naam: string
  prijs: number
  eenheid: string
  tijd: string
  oplevert: string[]
  inbegrepen: string[]
  populair?: boolean
}
export type Dienst = { id: string; titel: string; pakketten: Pakket[]; faq: { vraag: string; antwoord: string }[] }

export const diensten: Dienst[] = [
  {
    id: 'website',
    titel: 'Websites',
    pakketten: [
      {
        id: 'start', naam: 'Start', prijs: 750, eenheid: 'excl. btw · eenmalig', tijd: '1 tot 2 weken',
        oplevert: ['Een complete website die gevonden wordt, door Google én door AI'],
        inbegrepen: [
          'Goed vindbaar in Google (SEO)',
          'Vindbaar voor AI zoals ChatGPT en Claude',
          'Snel op elke telefoon, gebouwd met Next.js',
          'Hosting op Vercel',
          'De code op GitHub, op jouw naam',
          'Veilig contactformulier met spamfilter',
          'Statistieken en een controle of je site online is',
          'Je oude site overzetten zonder kapotte links',
        ],
      },
      {
        id: 'groei', naam: 'Groei', prijs: 1495, eenheid: 'excl. btw · eenmalig', tijd: '2 tot 3 weken', populair: true,
        oplevert: ['Een site die je diensten, je werk en je verhaal laat zien en bezoekers raakt'],
        inbegrepen: ['Alles uit Start', 'Tot tien pagina’s', 'Bewegende onderdelen die blijven hangen', 'Teksten samen geschreven'],
      },
      {
        id: 'maatwerk', naam: 'Maatwerk', prijs: 2950, eenheid: 'excl. btw · eenmalig', tijd: '3 tot 5 weken',
        oplevert: ['Meerdere talen, een eigen tool of een slimme koppeling'],
        inbegrepen: ['Alles uit Groei', 'Meertalig of een tool op maat', 'Teksten zelf bijwerken met AI'],
      },
    ],
    faq: [
      { vraag: 'Is de site echt van mij?', antwoord: 'Ja. De code staat op GitHub op jouw naam en de hosting op jouw account. Bij de oplevering lopen we samen het stappenplan door; daarna beheer je hem zelf.' },
      { vraag: 'Schrijven jullie ook de teksten?', antwoord: 'Bij Groei en Maatwerk wel, samen met jou. Bij Start lever je ze aan via een korte vragenlijst in ChatGPT of Claude, die alles voor ons verzamelt.' },
      { vraag: 'Kan ik later zelf iets aanpassen?', antwoord: 'Ja. Bij elk pakket laten we zien hoe je teksten en beelden zelf bijwerkt.' },
    ],
  },
  {
    id: 'marketing',
    titel: 'Marketing',
    pakketten: [
      {
        id: 'klankbord', naam: 'Klankbord', prijs: 350, eenheid: 'excl. btw · per sessie', tijd: 'Twee uur',
        oplevert: ['Een frisse blik op je site en je verhaal'],
        inbegrepen: ['Voorbereiding op je huidige site', 'Sessie van twee uur', 'Verslag met de eerste stappen'],
      },
      {
        id: 'plan', naam: 'Plan', prijs: 950, eenheid: 'excl. btw · eenmalig', tijd: '1 tot 2 weken', populair: true,
        oplevert: ['Een plan voor de komende drie maanden'],
        inbegrepen: ['Alles uit Klankbord', 'Doelgroep en boodschap op papier', 'Contentkalender voor drie maanden'],
      },
    ],
    faq: [
      { vraag: 'Moet ik al een website hebben?', antwoord: 'Nee. Een plan kan ook het begin zijn van een nieuwe site.' },
    ],
  },
  {
    id: 'apps',
    titel: 'Interne apps',
    pakketten: [
      {
        id: 'proces', naam: 'Eén werkproces', prijs: 1950, eenheid: 'excl. btw · eenmalig', tijd: '2 tot 3 weken',
        oplevert: ['Eén app die één klus in je bedrijf makkelijker maakt, zoals uren, verlof of een checklist'],
        inbegrepen: ['Inloggen voor je hele team', 'Werkt op telefoon en computer', 'Gegevens op een server in Europa'],
      },
      {
        id: 'team', naam: 'Teamapp', prijs: 3950, eenheid: 'excl. btw · eenmalig', tijd: '4 tot 6 weken', populair: true,
        oplevert: ['Eén plek voor planning, klantdossiers en taken van je team'],
        inbegrepen: ['Alles uit Eén werkproces', 'Rollen en rechten per medewerker', 'Koppeling met je mail, agenda of boekhouding', 'Overzicht met de cijfers die ertoe doen'],
      },
      {
        id: 'platform', naam: 'Bedrijfsplatform', prijs: 7500, eenheid: 'excl. btw · eenmalig', tijd: '8 tot 12 weken',
        oplevert: ['Meerdere afdelingen in één systeem, met een AI-assistent die in je eigen gegevens zoekt'],
        inbegrepen: ['Alles uit Teamapp', 'Meerdere koppelingen en afdelingen', 'AI-assistent op je eigen kennis', 'Onderhoud en hulp in de eerste drie maanden'],
      },
    ],
    faq: [
      { vraag: 'Wat voor apps maken jullie?', antwoord: 'Bijvoorbeeld: urenregistratie per project, verlof en roosters, een klantportaal met offertes, voorraad en bestellingen, een checklist met foto’s voor inspecties, onboarding van nieuwe collega’s, of een kennisbank waarin je team met AI zoekt.' },
      { vraag: 'Waarom niet gewoon een bestaand pakket?', antwoord: 'Soms is dat beter, en dan zeggen we dat. Een eigen app is slim als je werkwijze niet in een standaardpakket past, of als je per gebruiker te veel betaalt voor wat je maar half gebruikt.' },
      { vraag: 'Van wie is de app?', antwoord: 'Van jou. De code en de gegevens staan op jouw naam.' },
    ],
  },
  {
    id: 'ai',
    titel: 'AI',
    pakketten: [
      {
        id: 'kennismaking', naam: 'Kennismaking met AI', prijs: 1250, eenheid: 'excl. btw · per workshop', tijd: 'Een dagdeel',
        oplevert: ['Zien wat AI in jouw werk al kan doen'],
        inbegrepen: ['Workshop voor jou of je team', 'Voorbeelden uit jouw eigen werk', 'Een lijst om morgen mee te beginnen'],
      },
      {
        id: 'partner', naam: 'Persoonlijke AI-partner', prijs: 2950, eenheid: 'excl. btw · eenmalig', tijd: '4 weken', populair: true,
        oplevert: ['Een AI-partner die jouw werk en jouw stem kent'],
        inbegrepen: ['Traject zoals op Co-creatie.ai', 'Ingericht op jouw werkwijze', 'Begeleiding in de eerste weken'],
      },
    ],
    faq: [
      { vraag: 'Moet ik technisch zijn?', antwoord: 'Nee. We beginnen bij je werk, niet bij de techniek.' },
    ],
  },
]

export const prijsTeksten = {
  vanaf: 'vanaf',
  populair: 'Meest gekozen',
  tijd: 'Doorlooptijd:',
  aanvraag: (pakket: string) => `Vraag ${pakket} aan`,
  maat: 'Liever iets op maat?',
  maatLink: 'Vertel wat je zoekt',
  tabs: 'Kies een dienst',
  oplevert: 'Wat het oplevert',
  inbegrepen: 'Inbegrepen',
  faq: (dienst: string) => `Veelgestelde vragen over ${dienst.toLowerCase()}`,
  maatTekst: 'Vertel wat je nodig hebt, dan kijken we samen wat past.',
}

export const euro = (n: number) => `€ ${n.toLocaleString('nl-NL')}`
const pakket = (dienst: string, id: string) => diensten.find((d) => d.id === dienst)!.pakketten.find((p) => p.id === id)!
const advies = (dienst: string, id: string, uitleg: string) => {
  const p = pakket(dienst, id)
  return { pakket: `${diensten.find((d) => d.id === dienst)!.titel}: ${p.naam}`, prijsIndicatie: `Richtprijs vanaf ${euro(p.prijs)} ${p.eenheid.split(' · ')[0]}`, uitleg }
}

/** advies-funnel: drie vragen per route, advies uit dezelfde pakketten. */
export const adviesConfig = {
  id: 'cb-pakket-v2',
  titel: 'Welk pakket past bij jou?',
  vragen: [
    {
      id: 'dienst', vraag: 'Waar heb je het meest behoefte aan?', type: 'enkel' as const,
      opties: [
        { waarde: 'website', label: 'Een website' },
        { waarde: 'marketing', label: 'Marketing en strategie' },
        { waarde: 'apps', label: 'Een app voor binnen het bedrijf' },
        { waarde: 'ai', label: 'Aan de slag met AI' },
      ],
    },
    {
      id: 'omvang', vraag: 'Hoeveel wil je laten zien?', type: 'enkel' as const, voorwaarde: { vraag: 'dienst', waarde: 'website' },
      opties: [
        { waarde: 'klein', label: 'Eén verhaal op een paar pagina’s' },
        { waarde: 'middel', label: 'Diensten, werk en een blog' },
        { waarde: 'groot', label: 'Meerdere talen of iets op maat' },
      ],
    },
    {
      id: 'vraag', vraag: 'Wat zoek je?', type: 'enkel' as const, voorwaarde: { vraag: 'dienst', waarde: 'marketing' },
      opties: [
        { waarde: 'blik', label: 'Een frisse blik op wat er is' },
        { waarde: 'plan', label: 'Een plan voor de komende maanden' },
      ],
    },
    {
      id: 'team', vraag: 'Voor wie is de app?', type: 'enkel' as const, voorwaarde: { vraag: 'dienst', waarde: 'apps' },
      opties: [
        { waarde: 'een', label: 'Eén klus, zoals uren of verlof' },
        { waarde: 'team', label: 'Mijn team, met planning en klanten' },
        { waarde: 'bedrijf', label: 'Meerdere afdelingen' },
      ],
    },
    {
      id: 'stand', vraag: 'Waar sta je met AI?', type: 'enkel' as const, voorwaarde: { vraag: 'dienst', waarde: 'ai' },
      opties: [
        { waarde: 'nieuw', label: 'Ik wil weten wat het kan' },
        { waarde: 'dagelijks', label: 'Ik wil er dagelijks mee werken' },
      ],
    },
  ],
  advies: [
    { als: { dienst: 'website', omvang: 'klein' }, ...advies('website', 'start', 'Een compacte site die in een paar pagina’s laat zien wie je bent en wat je doet.') },
    { als: { dienst: 'website', omvang: 'groot' }, ...advies('website', 'maatwerk', 'Meertalig of met een eigen tool: daar hoort een eigen plan bij, en tijd om het goed te doen.') },
    { als: { dienst: 'marketing', vraag: 'blik' }, ...advies('marketing', 'klankbord', 'Eén sessie waarin we samen naar je site en je verhaal kijken, met de eerste stappen op papier.') },
    { als: { dienst: 'marketing' }, ...advies('marketing', 'plan', 'Een plan met je doelgroep, je boodschap en wat je de komende drie maanden doet.') },
    { als: { dienst: 'apps', team: 'een' }, ...advies('apps', 'proces', 'Eén app voor één klus, zodat je team daar geen losse lijstjes meer voor nodig heeft.') },
    { als: { dienst: 'apps', team: 'bedrijf' }, ...advies('apps', 'platform', 'Eén systeem voor meerdere afdelingen, met een AI-assistent die in je eigen gegevens zoekt.') },
    { als: { dienst: 'apps' }, ...advies('apps', 'team', 'Eén plek voor de planning, de klanten en de taken van je team.') },
    { als: { dienst: 'ai', stand: 'nieuw' }, ...advies('ai', 'kennismaking', 'Een workshop met voorbeelden uit je eigen werk, zodat je morgen kunt beginnen.') },
    { als: { dienst: 'ai' }, ...advies('ai', 'partner', 'Een persoonlijke AI-partner die jouw werk en jouw stem kent.') },
    { default: true, ...advies('website', 'groei', 'Een site die je diensten, je werk en je verhaal laat zien, en die vindbaar is vanaf dag één.') },
  ],
  cta: { type: 'link', href: '#prijzen', label: 'Bekijk de pakketten en prijzen' },
}
