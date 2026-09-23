export type Project = {
  slug: string;
  name: string;
  type: "Website";
  cover: string;
  hero: string;
  summary: string;
  intro: string[];
  designGoals: string;
  next: string;
};

export const projectOrder = [
  "offbeat-peak",
  "digital-waves",
  "driftawave",
  "radstok-interim",
  "fuselabs",
  "souplesse-runners-boutique",
  "kinderopvang-ikke",
  "win-instituut",
  "co-creatie-ai",
] as const;

export const projects: Record<string, Project> = {
  "kinderopvang-ikke": {
    slug: "kinderopvang-ikke",
    name: "Kinderopvang Ikke",
    type: "Website",
    cover: "projects/kinderopvang-ikke-cover.png",
    hero: "projects/kinderopvang-ikke-hero.png",
    summary: "Een warm digitaal welkom voor ouders in Nijmegen.",
    intro: [
      "Een kinderopvangwebsite moet ouders niet overdonderen, maar vertrouwen geven. Voor Ikke heb ik de site rond hun eerste vragen opgebouwd: hoe ziet de opvang eruit, welke plek past bij mijn kind en wat gebeurt er na een rondleiding?",
      "De route naar een bezoek is zichtbaar, terwijl de verschillende locaties en opvangvormen ruimte krijgen om hun eigen verhaal te vertellen. Zo helpt de website ouders eerst een gevoel bij Ikke te krijgen en daarna een volgende stap te zetten.",
    ],
    designGoals: "De site brengt dagopvang, buitenschoolse opvang, drie locaties en de rondleiding samen. Ouders kunnen zich oriënteren zonder de praktische weg naar een bezoek kwijt te raken.",
    next: "win-instituut",
  },
  "radstok-interim": {
    slug: "radstok-interim",
    name: "Radstok Interim",
    type: "Website",
    cover: "projects/radstok-interim-cover.png",
    hero: "projects/radstok-interim-hero.png",
    summary: "Van operationele chaos naar voorspelbare groei.",
    intro: [
      "Voor Stefan Radstok heb ik een website gemaakt die zijn belofte meteen helder neerzet: van operationele chaos naar voorspelbare groei. De combinatie van resultaat en aandacht voor mensen komt terug in het verhaal, de vormgeving en de route door de site.",
      "Bezoekers kunnen zijn aanpak en ervaring verkennen, of direct de stap zetten naar een kennismaking of de Operations Scan. Zo blijft de inhoud praktisch en persoonlijk, net als het werk van Radstok Interim.",
    ],
    designGoals: "De site vertaalt ‘Hard én Hart’ naar een duidelijke structuur: eerst de operationele uitdaging, daarna de aanpak, de mens erachter en een concrete volgende stap.",
    next: "fuselabs",
  },
  "win-instituut": {
    slug: "win-instituut",
    name: "WIN Instituut",
    type: "Website",
    cover: "projects/win-instituut-cover.png",
    hero: "projects/win-instituut-hero.png",
    summary: "Een digitale plek voor weerbaarheid, groei en leiderschap.",
    intro: [
      "WIN verbindt fysieke, mentale, sociale en emotionele weerbaarheid. Voor de website heb ik die veelomvattende methode een digitale structuur gegeven.",
      "Bezoekers kunnen zich verdiepen in de visie, therapie en coaching, opleidingen en workshops. Het onderwerp vraagt om meer dan een mooie eerste indruk: iemand moet kunnen herkennen welke ingang voor hem of haar relevant is.",
    ],
    designGoals: "De inhoud maakt de integratieve, psychofysieke en systemische aanpak zichtbaar zonder die te reduceren tot één dienst of doelgroep.",
    next: "co-creatie-ai",
  },
  driftawave: {
    slug: "driftawave",
    name: "Driftawave",
    type: "Website",
    cover: "projects/driftawave-cover.png",
    hero: "projects/driftawave-hero.png",
    summary: "Een avontuurlijke site voor retreats, workations en offsites.",
    intro: [
      "Driftawave verkoopt geen standaard vergaderlocatie, maar ervaringen die teams buiten hun gewone omgeving brengen. Ik heb de website gebouwd rond die energie.",
      "Retreats, workations en offsites zijn direct herkenbaar, met ruimte voor programma’s, sfeer, ervaringen van klanten en het team erachter. De site brengt inspiratie en praktische oriëntatie bij elkaar.",
    ],
    designGoals: "Wie binnenkomt met een eerste idee, kan verder kijken welk type ervaring bij het eigen team past en hoe een gesprek over een offsite begint.",
    next: "radstok-interim",
  },
  "co-creatie-ai": {
    slug: "co-creatie-ai",
    name: "Co-creatie.ai",
    type: "Website",
    cover: "projects/co-creatie-ai-cover.png",
    hero: "projects/co-creatie-ai-hero.png",
    summary: "Mijn eigen verhaal over persoonlijke AI-partners.",
    intro: [
      "Voor Co-creatie.ai moest ik mijn eigen overtuiging helder maken: een AI-partner is iets anders dan een losse tool of een verzameling prompts.",
      "Op de website leg ik eerst het herkenbare probleem uit en daarna hoe een persoonlijke partner werkt, wat het traject inhoudt en waar je hem in de praktijk voor gebruikt.",
    ],
    designGoals: "De opbouw helpt bezoekers mijn visie te toetsen voordat ze een demo boeken. Het is niet alleen een productpagina, maar ook een uitleg van hoe ik mens en technologie laat samenwerken.",
    next: "offbeat-peak",
  },
  "souplesse-runners-boutique": {
    slug: "souplesse-runners-boutique",
    name: "Souplesse Runners Boutique",
    type: "Website",
    cover: "projects/souplesse-runners-boutique-cover.png",
    hero: "projects/souplesse-runners-boutique-hero.png",
    summary: "Een plek voor hardlopers, advies en de webshop.",
    intro: [
      "Souplesse is meer dan een winkel met hardloopschoenen. Voor de website heb ik de verschillende kanten van het merk bij elkaar gebracht: de boutique, het assortiment, de loopanalyse, verhalen voor lopers en de webshop.",
      "Bezoekers kunnen inspiratie opdoen, zich verdiepen in persoonlijk advies of gericht naar een product zoeken. Die combinatie maakt de site bruikbaar voor wie vandaag wil bestellen én voor wie eerst de mensen achter de winkel wil leren kennen.",
    ],
    designGoals: "De website verbindt winkelbezoek, community, loopanalyse en online shoppen zonder dat één van die routes de rest verdringt.",
    next: "kinderopvang-ikke",
  },
  "offbeat-peak": {
    slug: "offbeat-peak",
    name: "Offbeat Peak",
    type: "Website",
    cover: "projects/offbeat-peak-cover.png",
    hero: "projects/offbeat-peak-hero.png",
    summary: "Een redactionele ontdekkingstocht langs minder bekende plekken.",
    intro: [
      "Bij Offbeat Peak draait reizen om plekken die je niet uit een standaard top-tienlijst haalt. Ik heb de site als een digitaal reisverhaal benaderd.",
      "Bestemmingen, ervaringen en routes nodigen uit om te dwalen, terwijl de navigatie bezoekers ook helpt gericht te plannen. De redactionele toon draagt het gevoel van ontdekking.",
    ],
    designGoals: "Eerst ontstaat nieuwsgierigheid naar een plek; daarna komt de stap naar een eigen reisplan in beeld. De site brengt inspiratie en planning samen.",
    next: "digital-waves",
  },
  "digital-waves": {
    slug: "digital-waves",
    name: "Digital Waves",
    type: "Website",
    cover: "projects/digital-waves-cover.png",
    hero: "projects/digital-waves-hero.png",
    summary: "Een uitgesproken digitale agency-site voor ambitieuze merken.",
    intro: [
      "Digital Waves vraagt om een website met dezelfde directheid als het bureau zelf. Ik heb de positionering vooraan gezet en de route naar diensten, eerder werk en contact kort gehouden.",
      "Grote typografie en een uitgesproken ritme geven het merk een eigen gezicht. De inhoud maakt duidelijk waar het bureau voor staat: marketing, content en AI in dienst van ambitieuze merken.",
    ],
    designGoals: "De site laat meteen voelen wat voor bureau Digital Waves is en geeft daarna een eenvoudige weg naar de diensten, het werk en een gesprek.",
    next: "driftawave",
  },
  fuselabs: {
    slug: "fuselabs",
    name: "FuseLabs",
    type: "Website",
    cover: "projects/fuselabs-cover.png",
    hero: "projects/fuselabs-hero.png",
    summary: "AI-strategie en productbouw beginnen bij een zakelijke vraag.",
    intro: [
      "Bij FuseLabs begint het gesprek niet met een AI-tool, maar met een zakelijke vraag. Ik heb de website zo opgebouwd dat bezoekers eerst het doel begrijpen.",
      "Daarna kunnen zij zien hoe strategie, een eerste werkend concept en maatwerksoftware daarop aansluiten. De onderdelen over werkwijze, mogelijkheden, eerder werk en private AI geven verdieping zonder de eerste boodschap te verstoppen.",
    ],
    designGoals: "Technologie krijgt pas betekenis als een organisatie er echt mee kan werken. De site houdt die zakelijke uitkomst voorop.",
    next: "souplesse-runners-boutique",
  },
};

export const contactUrl = "https://www.linkedin.com/in/christianbleeker/";
