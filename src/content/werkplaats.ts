/**
 * De Werkplaats (v3, 28-10-2026): werkende proefstukken per vak. Alles is een voorbeeld: verzonnen
 * namen, tijden en getallen, en er wordt niets verstuurd. Voorstel, staat ook in docs/copy-nieuw.md.
 * `demo` = de slug van een ontwerp-demo uit demos.ts die bij het vak past (alleen waar dat klopt).
 */
import { demos } from '@/content/demos'
import type { Schema } from '@/features/open-status/OpenStatus'

export type Proefstuk = { id: string; voor: string; zin: string; demo?: string }

const demoNaam = (slug: string) => demos.find((d) => d.slug === slug)?.naam ?? slug

export const werkplaats = {
  titel: 'Werkplaats — wat we voor jouw vak bouwen',
  beschrijving: 'Werkende proefstukken per vak: een werkgebied-kaart voor een aannemer, openingstijden voor een tandarts, een intake voor een advocaat. Allemaal voorbeelden om zelf te proberen.',
  menu: 'Werkplaats',
  kicker: 'Werkplaats',
  kop: 'Wat we voor jouw vak bouwen',
  intro: 'Een goede website vertelt niet alleen wie je bent. Hij helpt je bezoeker ook verder: een keuze, een afspraak, een antwoord. Hieronder staan proefstukken die we per vak bouwen. Ze werken echt, dus probeer ze gerust.',
  eerlijk: 'Alles op deze pagina is een voorbeeld. Namen, tijden en getallen zijn verzonnen, en er wordt niets verstuurd.',
  label: 'Voorbeeld',
  inhoud: 'Op deze pagina',
  demo: (slug: string) => `Bekijk de ontwerp-demo ${demoNaam(slug)}`,
  demoAria: (slug: string) => `Bekijk de ontwerp-demo ${demoNaam(slug)} (opent in een nieuw tabblad)`,

  hond: { id: 'dierenarts', voor: 'Voor een dierenarts', zin: 'Bobbie kijkt met je muis mee en draait mee als je scrolt. Een mascotte die bij de praktijk hoort, in 3D en zonder video.', demo: 'staldeur', alt: 'Bobbie, de bruine hond van de dierenartspraktijk, zittend met een groene halsband' },

  groepen: [
    { id: 'in-de-buurt', naam: 'In de buurt', kop: 'Laat zien waar je werkt', tekst: 'Voor wie in de eigen regio werkt: waar je projecten zitten, hoe ver het rijden is en of je nu open bent.' },
    { id: 'kiezen', naam: 'Kiezen en bestellen', kop: 'Kiezen zonder te bellen', tekst: 'Een kleur, een ophaaldag, een plek in de groep. De bezoeker regelt het zelf, op de pagina.' },
    { id: 'afspreken', naam: 'Afspreken en aanvragen', kop: 'De eerste stap zo kort mogelijk', tekst: 'Datum en tijd al ingevuld, een aanvraag zonder nieuwe pagina en een keuzelijst die je vak kent.' },
    { id: 'kennis', naam: 'Kennis en vertrouwen', kop: 'Laat zien wat je weet', tekst: 'Een kennisbank die je doorzoekt zonder zoekmachine, en eerlijk over wat een AI-assistent wel en niet zelf doet.' },
  ],

  kaart: {
    stuk: { id: 'aannemer', voor: 'Voor een aannemer of installateur', zin: 'Scroll langs de projecten en de kaart vliegt mee van plaats naar plaats. Getekend, zonder Google Maps en zonder cookies.' } as Proefstuk,
    projecten: [
      { id: 'hoorn', plaats: 'Hoorn', foto: 'project-keuken', alt: 'Eiken keuken met kookeiland in een jaren-dertigwoning', zin: 'Eiken keuken in een jaren-dertigwoning in de binnenstad, van sloop tot eerste kop koffie in zes weken.' },
      { id: 'enkhuizen', plaats: 'Enkhuizen', foto: 'project-badkamer', alt: 'Badkamer met terrazzovloer en inloopdouche', zin: 'Badkamer van vier vierkante meter met terrazzovloer en een inloopdouche, alles op maat gezaagd.' },
      { id: 'medemblik', plaats: 'Medemblik', foto: 'project-dakkapel', alt: 'Nieuwe dakkapel op een pannendak', zin: 'Dakkapel over de volle breedte, in één dag geplaatst. De melding bij de gemeente regelden we mee.' },
      { id: 'schagen', plaats: 'Schagen', foto: 'project-veranda', alt: 'Houten veranda met glazen schuifwanden aan de achterkant van een woning', zin: 'Houten veranda met glazen schuifwanden: de tuin is al in maart bruikbaar.' },
    ],
  },

  afstand: {
    stuk: { id: 'fysiotherapeut', voor: 'Voor een fysiotherapeut met meer praktijken', zin: 'Vul een postcode in en de praktijken staan op volgorde van afstand, met de kilometers erbij.', demo: 'stapvoets' } as Proefstuk,
    postcode: 'Postcode', zoek: 'Zoek', straal: 'Straal', alles: 'Alles',
    praktijken: [
      { naam: 'Praktijk Zwolle', lat: 52.5125, lng: 6.0944 },
      { naam: 'Praktijk Kampen', lat: 52.555, lng: 5.9114 },
      { naam: 'Praktijk Dalfsen', lat: 52.505, lng: 6.26 },
      { naam: 'Praktijk Hattem', lat: 52.475, lng: 6.065 },
      { naam: 'Praktijk Raalte', lat: 52.388, lng: 6.275 },
    ],
  },

  open: {
    stuk: { id: 'tandarts', voor: 'Voor een tandartspraktijk', zin: 'Nu open of dicht, met de lunchpauze en de feestdagen erin. Altijd in Nederlandse tijd, ook voor wie vanaf de camping kijkt.', demo: 'lachlijn' } as Proefstuk,
    laden: 'Openingstijden laden…',
    tabelKop: 'Openingstijden',
    dagen: [
      { dag: 'Maandag tot en met donderdag', tijd: '8.00–12.30 en 13.30–17.00' },
      { dag: 'Vrijdag', tijd: '8.00–13.00' },
      { dag: 'Zaterdag en zondag', tijd: 'Gesloten' },
    ],
  },

  kleur: {
    stuk: { id: 'timmerfabriek', voor: 'Voor een timmerfabriek', zin: 'Kies een kleur en de voordeur verandert mee, met de meerprijs erbij. De keuze staat in het adres, dus je kunt hem delen.' } as Proefstuk,
    legend: 'Kies een kleur',
    alt: 'Voordeur met bovenlicht in de gekozen kleur',
    kleuren: [
      { id: 'wit', naam: 'Gebroken wit', hex: '#ece5d8', prijs: 0 },
      { id: 'antraciet', naam: 'Antraciet', hex: '#30353a', prijs: 0 },
      { id: 'groen', naam: 'Monumentengroen', hex: '#2e4b3c', prijs: 85 },
      { id: 'ossenbloed', naam: 'Ossenbloed', hex: '#6e2622', prijs: 85 },
    ],
  },

  deadline: {
    stuk: { id: 'bakker', voor: 'Voor een bakker', zin: 'Vóór twaalf uur besteld kan nog vandaag, daarna vanaf morgen. Een dag waarop de winkel dicht is, kun je niet kiezen.' } as Proefstuk,
    label: 'Ophaaldag voor je taart',
    hint: 'Bestellen tot 12.00 uur voor dezelfde dag. Op zondag en maandag zijn we dicht.',
  },

  drempel: {
    stuk: { id: 'yogastudio', voor: 'Voor een yogastudio', zin: 'Een nieuwe beginnersgroep start bij twaalf aanmeldingen. De teller laat zien hoe ver het is, met een echt getal of helemaal niets.', demo: 'viertellen' } as Proefstuk,
    waarde: 9,
    doel: 12,
    tekst: 'Nog {resterend|aanmelding|aanmeldingen} tot de nieuwe groep start',
    tekstBereikt: 'De nieuwe groep is vol: {waarde} aanmeldingen',
    label: 'Aanmeldingen voor de nieuwe beginnersgroep',
    zonderJs: '9 van de 12 aanmeldingen voor de nieuwe beginnersgroep.',
  },

  boeking: {
    stuk: { id: 'restaurant', voor: 'Voor een restaurant', zin: 'Datum, tijd en aantal personen kies je al op de eigen site. De reserveringsmodule opent daarna met alles ingevuld.' } as Proefstuk,
    url: '/werkplaats/voorbeeld-boeking.html',
    fallback: 'Reserveer een tafel',
  },

  funnel: {
    stuk: { id: 'advocaat', voor: 'Voor een advocatenkantoor', zin: 'Elke knop opent hetzelfde korte formulier, met de juiste vraag al aangevinkt. Geen nieuwe pagina, geen zoeken.', demo: 'paraaf' } as Proefstuk,
    links: [
      { interesse: 'intake', tekst: 'Plan een intake' },
      { interesse: 'second-opinion', tekst: 'Vraag een second opinion' },
    ],
    interesses: [
      { id: 'intake', label: 'Een intakegesprek' },
      { id: 'second-opinion', label: 'Een second opinion' },
      { id: 'contract', label: 'Een contract laten nakijken' },
    ],
    velden: { naam: 'Je naam', email: 'Je e-mailadres', vraag: 'Waar gaat het over?' },
    teksten: {
      heading: 'Afspraak aanvragen (voorbeeld)',
      interestLegend: 'Waarmee kunnen we helpen?',
      next: 'Volgende',
      back: 'Terug',
      submit: 'Aanvraag versturen',
      submitting: 'Even geduld…',
      close: 'Sluiten',
      successTitle: 'Dit was een voorbeeld',
      successBody: 'Er is niets verstuurd. Op een echte site komt je aanvraag nu binnen bij het kantoor.',
      errorTitle: 'Dat ging mis',
      errorBody: 'Probeer het nog eens.',
      privacyText: 'Er wordt niets verstuurd of bewaard. Meer staat in de',
      privacyLinkLabel: 'privacyverklaring',
      requiredError: 'Vul dit veld in.',
      emailError: 'Vul een geldig e-mailadres in.',
      chooseInterestError: 'Kies een onderwerp.',
    },
  },

  keuzelijst: {
    stuk: { id: 'boekhouder', voor: 'Voor een boekhouder', zin: 'Een nieuwe klant typt "kapper" en vindt Haarstylist. Honderdeenenvijftig beroepen met zoekwoorden, en een uitweg als het zijne er niet bij staat.', demo: 'opdecent' } as Proefstuk,
    label: 'Wat is je beroep?',
    leeg: 'Typ je beroep',
    anders: 'Mijn beroep staat er niet tussen',
    andersLabel: 'Vul je beroep zelf in',
  },

  kennisbank: {
    stuk: { id: 'psycholoog', voor: 'Voor een psychologenpraktijk', zin: 'Artikelen, podcasts en video’s filteren op onderwerp en zoeken zonder op hoofdletters te letten. De stand staat in het adres.', demo: 'opklaring' } as Proefstuk,
    items: [
      { titel: 'Piekeren voor het slapengaan', samenvatting: 'Waarom je hoofd juist in bed aan gaat, en drie dingen die helpen.', categorie: 'Slaap|Stress', soort: 'artikel', datum: '2026-10-20' },
      { titel: 'Wat gebeurt er in een eerste gesprek?', samenvatting: 'Van de eerste vraag tot het plan: zo ziet een intake eruit.', categorie: 'Praktisch', soort: 'artikel', datum: '2026-10-12' },
      { titel: 'Ademhalen bij paniek', samenvatting: 'Een rustige oefening van vier minuten om mee te doen.', categorie: 'Angst', soort: 'video', datum: '2026-10-05' },
      { titel: 'Somberheid in de winter', samenvatting: 'Licht, ritme en beweging: wat je zelf kunt doen als de dagen kort worden.', categorie: 'Stemming', soort: 'artikel', datum: '2026-09-28' },
      { titel: 'Werkstress herkennen', samenvatting: 'Een gesprek over de signalen die je vaak pas achteraf ziet.', categorie: 'Stress', soort: 'podcast', datum: '2026-09-21' },
      { titel: 'Vergoeding uit de basisverzekering', samenvatting: 'Wanneer je zorg vergoed wordt en wat het eigen risico betekent.', categorie: 'Praktisch', soort: 'artikel', datum: '2026-09-14' },
      { titel: 'Als je kind faalangst heeft', samenvatting: 'Twee ouders en een psycholoog over toetsen, verwachtingen en rust.', categorie: 'Angst', soort: 'podcast', datum: '2026-09-02' },
      { titel: 'Slaapritme na een nachtdienst', samenvatting: 'Hoe je weer in slaap komt als de rest van de wereld wakker is.', categorie: 'Slaap', soort: 'artikel', datum: '2026-08-25' },
      { titel: 'Rouw heeft geen schema', samenvatting: 'Over verlies, en waarom verdriet niet in vijf fases past.', categorie: 'Stemming', soort: 'podcast', datum: '2026-08-18' },
    ],
    soorten: { artikel: 'Artikel', podcast: 'Podcast', video: 'Video' } as Record<string, string>,
  },

  rechten: {
    stuk: { id: 'ai-bureau', voor: 'Voor een data- en AI-bureau', zin: 'Wat doet de AI-assistent zelf, wat vraagt hij eerst en wat nooit? Zet de standen om en de samenvatting rekent mee.', demo: 'klaarblijk' } as Proefstuk,
  },
}

/** Config van de rechtenmatrix (proefstuk "Voor een data- en AI-bureau"). */
export const rechtenConfig = {
  modus: 'bewerk',
  veldnaam: 'werkverdeling',
  standaard: 'eerst',
  standen: [
    { id: 'zelf', label: 'Doet dit zelf', kort: 'zelf', icoon: 'check' },
    { id: 'eerst', label: 'Vraagt eerst', kort: 'vraagt eerst', icoon: 'pauze' },
    { id: 'nooit', label: 'Nooit', kort: 'nooit', icoon: 'ban' },
  ],
  teksten: {
    lijstTitel: 'De assistenten',
    samenvattingTitel: 'Samenvatting',
    categorieAantal: '{n} handelingen',
    groepNaam: '{rol}: {handeling}',
    melding: '{rol}: {handeling} staat nu op {stand}',
    tabelTitel: 'Wie mag wat',
    kolomHandeling: 'Handeling',
  },
  rollen: [
    { id: 'inbox', naam: 'Inbox', functie: 'Mail', uitleg: 'Leest mee in de gedeelde mailbox.', initialen: 'IN' },
    { id: 'planner', naam: 'Planner', functie: 'Agenda', uitleg: 'Houdt de agenda van het team bij.', initialen: 'PL' },
    { id: 'schrijver', naam: 'Schrijver', functie: 'Teksten', uitleg: 'Maakt eerste versies van rapporten.', initialen: 'SC' },
  ],
  categorieen: [
    { id: 'mail', naam: 'Mail', handelingen: [
      { id: 'sorteren', naam: 'Mail sorteren', standaard: 'zelf' },
      { id: 'opstellen', naam: 'Antwoord opstellen', standaard: 'zelf' },
      { id: 'versturen', naam: 'Antwoord versturen', standaard: 'eerst' },
    ] },
    { id: 'agenda', naam: 'Agenda', handelingen: [
      { id: 'voorstellen', naam: 'Afspraak voorstellen', standaard: 'zelf' },
      { id: 'verzetten', naam: 'Afspraak verzetten', standaard: 'eerst' },
    ] },
    { id: 'geld', naam: 'Geld', handelingen: [
      { id: 'factuur', naam: 'Factuur klaarzetten', standaard: 'eerst' },
      { id: 'betalen', naam: 'Betaling doen', standaard: 'nooit' },
    ] },
  ],
  waarden: {
    planner: { sorteren: 'nooit', opstellen: 'eerst', versturen: 'nooit', factuur: 'nooit' },
    schrijver: { sorteren: 'nooit', versturen: 'nooit', voorstellen: 'nooit', verzetten: 'nooit', factuur: 'nooit' },
  },
}

/** Schema van de open-status (proefstuk tandarts): lunchpauze, feestdagen dicht. */
export const openSchema: Schema = {
  weekschema: {
    '1': [['08:00', '12:30'], ['13:30', '17:00']],
    '2': [['08:00', '12:30'], ['13:30', '17:00']],
    '3': [['08:00', '12:30'], ['13:30', '17:00']],
    '4': [['08:00', '12:30'], ['13:30', '17:00']],
    '5': [['08:00', '13:00']],
  },
  uitzonderingen: {
    '2026-12-25': { open: false, label: 'eerste kerstdag' },
    '2026-12-26': { open: false, label: 'tweede kerstdag' },
    '2027-01-01': { open: false, label: 'nieuwjaarsdag' },
  },
}
