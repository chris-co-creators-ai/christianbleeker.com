# SEO — wat standaard aan staat, wat je per klant invult, wat een keuze van Lars is

Uitbreiding van 24-09-2026 op de SEO/GEO-basis die dezelfde dag eerder is gebouwd (sitemap,
robots, JSON-LD, OG-beeld per pagina, RSS, `llms.txt`, `npm run keuring`, 404 — zie de
commit-geschiedenis en `AGENTS.md` § "Standaard aan / optioneel"). Dit document voegt daar de
resterende lagen aan toe: local SEO, structured data buiten Organization/Article, AI-vindbaarheid
(GEO/AEO) en de keuring die erop controleert. Doel (Lars, 24-09-2026): *"zorg ervoor dat in de
standaard buildstack de SEO optimaal is ingeregeld, zodat dat nooit een probleem kan zijn — ook
SEO die te vinden is door AI."*

Alles hieronder is code, geen belofte: `npm run keuring` faalt (exit 1) als een van de harde eisen
ontbreekt. Zie § "Keuring" onderaan voor precies welke regels dat zijn.

## 1. Eén bron: `content/site.ts`

NAP (naam/adres/telefoon), openingstijden, geo-coördinaten, werkgebied, FAQ, reviews en de
AI-crawler-schakelaar staan allemaal in `content/site.ts` — nergens anders. `src/lib/schema.ts`
bouwt alle JSON-LD daaruit; een pagina roept alleen een functie uit dat bestand aan, ze bouwt nooit
zelf een `@context`-object. Vul je een adres in bij een klant, dan klopt het automatisch overal
(LocalBusiness, elke `Service`, elke `Article`).

## 2. Technisch (altijd aan, geen configuratie)

| Wat | Waar | Opmerking |
|---|---|---|
| Unieke `<title>`/meta description per pagina | elke `page.tsx` z'n eigen `metadata` | TypeScript dwingt de VELDEN af (`beschrijving`/`metaBeschrijving` zijn verplicht in het type); de LENGTE (50–160 tekens) checkt `npm run keuring`, niet TypeScript — een string-lengtecheck op type-niveau bestaat niet zinvol voor vrije tekst. |
| Canonical per pagina | `alternates.canonical` | elke route zet 'm zelf (shallow-merge-val, zie de commentaren in de pagina's zelf). |
| Sitemap met `lastmod` | `sitemap.ts` | vaste pagina's: `site.bijgewerkt` (optioneel ISO-veld) of de builddatum; artikelen: hun eigen publicatiedatum uit de byline. |
| Robots.txt | `robots.txt/route.ts` (+ Content-Signal) | zie § 5 hieronder voor de AI-crawler-regels. |
| `noindex` nooit per ongeluk in productie, wél op previews | `layout.tsx` (`isPreviewDeploy`) + `robots.txt/route.ts` | `process.env.VERCEL_ENV === 'preview'` is een bouwtijd-check — een preview-deploy bakt `noindex`/`Disallow: /` in zijn eigen HTML, productie bakt `index`/de normale regels in de zijne. Getest door twee keer te bouwen met/zonder `VERCEL_ENV=preview` (zie de opleverronde). |
| 404 | `not-found.tsx` | eigen huisstijl, `noindex`, links terug naar home/artikelen/aanvraag. |
| 410 (permanent weg, geen vervanging) | — | geen kant-en-klare route in dit template (geen huidig gebruiksgeval). Nodig? Eigen `route.ts` die `new NextResponse(null, { status: 410 })` teruggeeft — géén redirect, want een 301 naar een niet-verwante pagina is voor Google ook een signaal van lage kwaliteit. |
| Redirects van een oude site | `content/redirects.ts` + `scripts/oude-site-urls.mjs` | zie AGENTS.md, ongewijzigd door deze ronde. |
| Trailing-slash-consistentie | `next.config.ts` (`trailingSlash: false`, expliciet) | voorkomt dat `/pad` en `/pad/` als twee URL's tellen. |
| Nette URL's | de routestructuur zelf | korte, leesbare paden (`/artikelen/<slug>`, geen query-string-routing). |
| Breadcrumbs | `BreadcrumbList`-JSON-LD op elke pagina behalve home (`schema.ts` → `breadcrumbSchema`) | onzichtbaar (puur voor crawlers/AI) — de zichtbare "← Alle artikelen"-link op de artikelpagina blijft zoals gemeten, geen visuele kruimelpad-balk toegevoegd (dat zou de pixel-gemeten homepage-stijl doortrekken naar plekken waar de referentiesite 'm niet had). |
| Hreflang | `alternates.languages` in elke `metadata` + `alternates` in `sitemap.ts` | alleen als `site.talen` meer dan NL bevat — zie de volledige uitwerking hieronder. |

### Meertaligheid (toegevoegd 27-09-2026 — eerste klant: Bistro Wadloper, NL/EN/DE)

Standaard uit, per klant aan te zetten in één config-veld: `content/site.ts`'s `talen: Taal[]`
(standaard `['nl']`). Zet 'm op bv. `['nl', 'en', 'de']` en de site bouwt automatisch de vertaalde
routes mee — met `['nl']` blijft het bouwresultaat identiek aan vóór deze functie bestond (geverifieerd:
zelfde routes, 0 hreflang-tags, zelfde HTML op de bestaande pagina's op één toegevoegd JSON-LD-veld
na, zie de laatste alinea hieronder). Geen aparte i18n-library (next-intl e.d.) — drie content-
bestanden per taal en een dun laagje ernaast doen hetzelfde werk zonder extra dependency.

**Routes.** NL blijft onvertaald op `/` (route-group `app/(nl)/…`, ongewijzigd bestandsstructuur
op één niveau dieper na — zie hieronder). Elke andere taal krijgt een prefix (`/en/…`, `/de/…`) via
het dynamische segment `app/[locale]/…`, met `generateStaticParams` gevoed door `overigeTalen(talen)`
(`src/lib/i18n.ts`). Beide bomen zijn eigen "root layouts" (`app/(nl)/layout.tsx` +
`app/[locale]/layout.tsx`, elk met een eigen `<html lang>`) — Next.js ondersteunt dit expliciet
("multiple root layouts" via route-groups, zie `node_modules/next/dist/docs/02-app/01-getting-started/
03-layouts-and-pages.mdx`). Bewuste vereenvoudiging: de padWOORDEN zelf worden niet vertaald
(`/en/artikelen`, niet `/en/articles`) — alleen de taalprefix verandert, dezelfde slug overal.
Gemirrorde routes: home, `/artikelen` (index + detail), `/aanvraag`, `/veelgestelde-vragen`
(zelfde drempel-logica als NL), `/privacy` (redirect). `feed.xml`/`llms.txt`/`llms-full.txt`/de
root-`opengraph-image` blijven NL-only (bewuste scope-cut, laag risico: geen van de acceptatie-eisen
raakt deze bestanden, en een RSS-feed/AI-samenvatting in drie talen is een aparte, grotere beslissing).

**Content per taal.** Elk `content/*.ts`-bestand krijgt een `*.xx.ts`-buur per extra taal
(`site.en.ts`, `artikelen.de.ts`, `aanvraag.en.ts`, `ui.de.ts`, …) — zelfde TypeScript-type als het
NL-bestand (compileert dus niet als er een verplicht veld ontbreekt), en apart gevalideerd door
`src/lib/vertaal.ts`s `valideerVertaling()`: een leeg of ontbrekend veld dat in de NL-referentie wél
gevuld is, gooit `Ontbrekende vertaling: veld "<pad>" ontbreekt of is leeg in taal "<taal>"` —
tijdens `next build`, dus vóórdat er iets gerenderd wordt. Geverifieerd: `hero.ondertitel` op `''`
gezet in `site.en.ts` laat `npm run build` falen met exact die melding (veld + taal), exit 1.
`src/lib/i18n-content.ts` is de resolver (`siteVoor(taal)`, `artikelenVoor(taal)`, `aanvraagVoor(taal)`,
`uiVoor(taal)`) — componenten importeren hiervandaan, nooit een taal-losse `content/site.ts` als ze
meertalig moeten zijn. Elke sectie-component (`Kop`/`Hero`/`Aanbod`/`Over`/`Faq`/`Contact`/`Voet`/
`AanvraagFunnel`/`AanvraagKaart`/`PrivacyDialog`/`Toestemming`) kreeg een optionele `taal`-prop die
standaard op `'nl'` staat — bestaande aanroepen zonder die prop (alle NL-routes) blijven dus
ongewijzigd. Formulier-/foutmeldingen, cookiemelding en 404 zijn meeverhuisd naar dit patroon
(`content/aanvraag.ts`s `aanvraagTeksten` resp. het nieuwe `content/ui.ts`); alleen het
nieuwsbrief-formulier (`src/lib/newsletter-actions.ts`, uit-by-default) is bewust NL-only gelaten —
lage prioriteit, geen acceptatie-eis raakt het.

**Kop/head per taal.** `<html lang>` per taal (route-group-layout zet 'm), canonical per taal
(`src/lib/i18n.ts`s `alternatesVoor()`, altijd een relatief pad — Next.js lost 'm zelf op tegen
`metadataBase`), hreflang + `x-default` in dezelfde `alternatesVoor()`-aanroep (leeg zodra
`talen.length <= 1` — dat is de "0 hreflang"-garantie), OG-locale per taal
(`TAAL_OG_LOCALE`/`openGraph.locale`), JSON-LD `inLanguage` op `WebSite`- en `Article`-schema
(`src/lib/schema.ts`, `TAAL_BCP47`). De taalwisselaar in de kop (`src/components/TaalWisselaar.tsx`)
rendert `null` zodra er maar één taal is (geen nieuwe DOM op een eentalige site), en zet anders per
link `hrefLang` + `aria-current="true"` op de actieve taal. `sitemap.ts` draagt dezelfde
`alternates.languages`-set per URL, voor élke taal (Next.js rendert dat als
`<xhtml:link rel="alternate" hreflang="…">` in de sitemap-XML).

**Keuring.** `scripts/keuring.mjs` faalt nu ook op: een `<html lang>` dat niet bij het pad past, een
hreflang-tag die naar een onbekende taalcode wijst, en (bij meer dan één taal) een ontbrekende,
kapotte of niet-wederkerige hreflang-set tussen de taalvarianten van dezelfde logische pagina — elke
taalvariant moet naar alle andere + `x-default` wijzen, met exact de URL van die variant. Twee
bestaande regels zijn taalbewust gemaakt in plaats van uitgeschakeld: "zelfde title op meerdere
pagina's" telt een groep taalvarianten van dezelfde pagina niet als dubbel (ze delen bewust de
sitenaam als title), en "`FAQPage`-schema op meer dan één pagina" wordt per taal beoordeeld (elke
taal draagt terecht zijn eigen schema; `/en` én `/en/veelgestelde-vragen` tegelijk zou nog steeds
een overtreding zijn).

**`nieuwe-site.mjs`.** `--talen nl,en,de` zet alleen `content/site.ts`s config-veld — de vertaling
van de daadwerkelijke klantcontent (`site.xx.ts` e.a., die nog de voorbeeldpersona dragen) blijft
handwerk; het script print een waarschuwing met de exacte bestandsnamen aan het eind.

**Wat er wél verandert op de standaardstand.** Met `talen: ['nl']` (de shipped default) is de
gebouwde site voor de bestaande routes identiek — zelfde routes, 0 hreflang-tags, zelfde `<html
lang="nl">`, zelfde canonical. Eén bewuste, kleine toevoeging: `Article`-JSON-LD draagt nu ook
`inLanguage: "nl-NL"` (voorheen ontbrak dat veld op artikelen helemaal — `WebSite`-schema had het al)
— een strikt additief, geldig JSON-LD-veld, geen bestaande waarde verandert. Verder is
`AanvraagKaart.tsx` opgeschoond: een paar knop-/legendateksten die al vóór deze ronde los in
`content/aanvraag.ts` stonden maar hardgecodeerd bleven in de component, lezen nu uit die content
(zelfde NL-tekst, nu op één plek in plaats van twee).

## 3. Structured data (JSON-LD) — `src/lib/schema.ts`

| Schema | Waar | Voorwaarde |
|---|---|---|
| `Organization`/`LocalBusiness` (of een preciezer subtype) | elke pagina (`layout.tsx`) | altijd; subtype via `site.schemaType`, standaard `LocalBusiness`. |
| `WebSite` | elke pagina (`layout.tsx`) | altijd. |
| `Service` | homepage (`page.tsx`) | één per blok in `site.aanbod.blokken` — dit template heeft geen losse dienst-route (de "diensten" zijn secties op de pixel-gemeten homepage), dus deze markup wordt daar onzichtbaar (`<script>`, geen nieuwe sectie) uitgestuurd. |
| `FAQPage` | homepage (t/m de drempel) óf `/veelgestelde-vragen` (erboven) — nooit beide tegelijk | alleen als `site.faq.items` niet leeg is; schema zonder bijbehorende zichtbare content op dezelfde pagina wordt nooit uitgestuurd. Zie § 9 en § 10. |
| `BreadcrumbList` | elke pagina behalve home | altijd. |
| `Article` | elke artikelpagina | met `image` (verwijst naar de al bestaande `opengraph-image`-route van dat artikel — geen los, kunstmatig plaatje) en `datePublished`/`dateModified` (uit de byline; ontbreekt de datum-notatie, dan laat de functie het veld gewoon weg in plaats van te gokken). |
| `Person` | binnen `Organization` (`founder`) en `Article` (`author`) | `site.naam` ís de persoon (E-E-A-T: een herkenbare, met naam genoemde auteur/eigenaar — zie het bestandscommentaar bovenaan `content/site.ts`). |
| `OpeningHoursSpecification`, `GeoCoordinates`, `areaServed`, `sameAs` | binnen `Organization` | optioneel, alleen als `site.openingstijden`/`site.geo`/`site.areaServed`/`site.voet.sociaal` zijn ingevuld. |
| `AggregateRating` (`Review`) | binnen `Organization` | **optioneel, standaard leeg.** Alleen invullen met échte cijfers via `site.reviews` (bv. van Google Bedrijfsprofiel) — nooit fabriceren. Zonder `site.reviews` verschijnt het veld helemaal niet in de JSON-LD. |

Elk JSON-LD-blok is gevalideerd door 'm te fetchen van de gebouwde site en met `JSON.parse` te
lezen (zie de opleverronde in de commit-geschiedenis voor de geplakte uitvoer) — geen los
schema.org-validatiepakket nodig voor iets zo klein als dit template.

## 4. Content/on-page

- Precies één `<h1>` per pagina — afgedwongen door `npm run keuring`.
- Kopstructuur: `h1` → `h2` (artikelen), geen niveaus overslaan.
- `alt` verplicht op elke `<img>` — afgedwongen door `npm run keuring` (runtime, over de gebouwde
  HTML — geen losse ESLint-regel nodig: `eslint-config-next`'s `jsx-a11y`-basis pakt de meeste
  gevallen al bij het schrijven, de keuring pakt de rest, inclusief `next/image`-rendering).
- Interne links: elke sectie/artikel linkt door naar `/aanvraag` of een andere pagina — geen
  doodlopende content.
- Afbeeldingen: `next/image` overal (automatische `width`/`height`, moderne formaten via Vercel se
  image-optimalisatie — geen aparte AVIF/WebP-stap nodig).
- **Skip-link verplicht (KWALITEITSREGELS R21)** — de eerste focusbare link in `<body>`
  (`src/app/(nl)/layout.tsx` + `src/app/[locale]/layout.tsx`, "Direct naar de inhoud") springt naar `#inhoud`, het `<main id="inhoud"
  tabIndex={-1}>` dat elke pagina zelf zet (`page.tsx`/`not-found.tsx` van elke route). Onzichtbaar
  tot een toetsenbordgebruiker 'm met Tab bereikt (`sr-only focus:not-sr-only`), dan zichtbaar
  linksboven. Geen keuze per klant — SEO/toegankelijkheid, altijd aan. `npm run keuring` faalt hard
  als de eerste link in `<body>` geen `#anker` is, of als dat anker niet op dezelfde pagina bestaat
  (zie § 11).

## 5. Core Web Vitals

- LCP-afbeelding: `priority` op precies één `<Image>` (de hero-portret, zie `Hero.tsx`) — Next.js
  vertaalt dat zelf naar `fetchpriority="high"` + preload.
- Fonts: `next/font/local`, `display: 'swap'` — geen font-blocking render, geen external
  Google-Fonts-fetch tijdens de build (zie het commentaar in `layout.tsx` voor waarom lokaal i.p.v.
  `next/font/google`).
- Geen render-blocking scripts: alle third-party-scripts (`Toestemming.tsx`) laden pas ná
  toestemming, nooit synchroon in de `<head>`.
- Budget in de keuring: **geen Lighthouse-run in `npm run keuring`** — Lighthouse in deze sandbox
  vraagt een eigen Playwright-Chromium-met-debugpoort-opzet (zie
  `~/.claude/projects/.../memory/reference_lighthouse_in_de_sandbox.md`) en is te breekbaar om als
  harde poort te laten draaien. Wil je een score: `mcp__chrome-devtools__lighthouse_audit` handmatig
  vóór livegang, of de `beta-tester`-agent (die kent de sandbox-aanpak). De keuring checkt wél de
  statische signalen die CWV beïnvloeden (font-strategie, geen dubbele trackingscripts, `priority`
  aanwezig — indirect, via code-review, niet via een geautomatiseerde regel).

## 6. Lokale SEO

- **NAP-consistentie**: adres/telefoon/bedrijfsnaam komen overal uit `content/site.ts` — nooit
  handmatig overgetypt op een tweede plek (zie § 1).
- **`LocalBusiness` met geo/areaServed**: `site.geo` (coördinaten) en `site.areaServed`
  (plaatsnamen/regio) — beide optioneel, beide leeg = geen fabriceren.
- **Openingstijden**: `site.openingstijden` → `OpeningHoursSpecification`. Werkt de klant alleen op
  afspraak zonder vaste tijden: laat het veld leeg.
- **Google Bedrijfsprofiel-checklist** (handmatig, per klant, niet in code af te dwingen):
  1. Profiel claimen/aanmaken op [business.google.com](https://business.google.com).
  2. Naam/adres/telefoon exact gelijk aan `content/site.ts` (Google straft afwijkingen af).
  3. Categorie kiezen die bij `site.schemaType` past.
  4. Openingstijden invullen — gelijk aan `site.openingstijden`.
  5. Website-URL = `site.domein`.
  6. Foto's uploaden (minstens het beeld dat ook als hero/OG-beeld dient).
  7. Verificatie afronden (post/telefoon/e-mail, per Google se eigen flow).
  8. Ná verificatie: `site.reviews` pas invullen zodra er echte reviews staan.
- **Lokale landingspagina's**: dit template bouwt er GEEN standaard — een losse
  `/zwolle`/`/kampen`-pagina per plaats die alleen de plaatsnaam verandert is precies het soort
  dunne, bijna-identieke content waar Google op afstraft (en waar Webstijn-achtige bureaus wél
  massaal in trappen). Heeft een klant écht meerdere, inhoudelijk verschillende vestigingen: geef
  elke vestiging een eigen pagina met een eigen `LocalBusiness`-schema (eigen adres/telefoon/
  openingstijden), eigen foto's en minstens een paar unieke alinea's — nooit een sjabloon met
  vind-en-vervang.

## 7. Social

- Open Graph + Twitter Card op elke pagina — `openGraph` per route (zie de commentaren in de
  pagina's over shallow-merge), `twitter: { card: 'summary_large_image' }` in de root-layout
  (geërfd tenzij een pagina zelf een `twitter`-object zet, zoals elk artikel — die herhaalt de
  `card` dan zelf).
- OG-beeld 1200×630, gegenereerd met `next/og` (`src/lib/og.tsx`) — huisstijlkleuren, geen los
  ontwerpbestand nodig.

## 8. AI-vindbaarheid (GEO/AEO)

- **`llms.txt`** (`/llms.txt`) — llmstxt.org-formaat, statisch uit `content/site.ts` +
  `content/artikelen.ts`.
- **`llms-full.txt`** (`/llms-full.txt`) — dezelfde structuur, met de volledige artikeltekst
  uitgeschreven; `llms.txt` linkt ernaar in een `## Optional`-sectie (de llmstxt.org-conventie voor
  "sla dit over als de context krap is").
- **`robots.txt` met AI-crawler-regels** (`robots.txt/route.ts`) — zie § "Keuzes voor Lars" hieronder voor de
  standaardhouding.
- **Volledige tekst in server-HTML** — alles is SSG (`next build`, geen client-side-only content),
  dus een crawler die geen JavaScript uitvoert (de meeste AI-crawlers doen dat niet) ziet exact
  dezelfde tekst als een bezoeker.
- **Citeerbare feitenblokken**: de FAQ-pagina (§ 9) is het duidelijkste voorbeeld — korte, op
  zichzelf staande vraag/antwoord-paren zijn precies wat een antwoordmachine citeert. Voor een
  klant met veel "wat kost het"/"hoe lang duurt het"-vragen: voeg ze toe aan `site.faq`.
- **E-E-A-T**: een met naam genoemde eigenaar (`site.naam`, `Person`-schema), een "Wie ik
  ben"-sectie met echte achtergrond, een werkend contactformulier en een privacyverklaring — dit
  template had dat al vóór deze ronde; nieuw is dat `Person` nu ook als schema.org-markup
  uitgestuurd wordt (niet alleen zichtbare tekst).
- **Datums**: elk artikel heeft `datePublished`/`dateModified` in de `Article`-schema (uit de
  byline). Werk je een artikel later inhoudelijk bij zonder de byline aan te passen, overweeg dan
  een apart "bijgewerkt op"-veld toe te voegen aan `content/artikelen.ts` — dit template heeft dat
  nu niet (YAGNI: geen enkel artikel is ooit bijgewerkt sinds publicatie).
- **IndexNow-ping — automatisch ná elke PRODUCTIE-uitrol** (besluit Lars, 25-09-2026, vervangt punt
  4 van § 10 hieronder — was: handmatig/los script). `scripts/keuring.mjs` roept aan het eind van
  een groene keuring `scripts/indexnow-lib.mjs`'s `pingIndexNow()` aan, die alléén iets doet bij
  `process.env.VERCEL_ENV === 'production'` — preview en lokaal (`npm run keuring` op een
  ontwikkelmachine) doen niets: geen fetch, geen bestandsschrijf. `scripts/indexnow.mjs
  <basis-url> <sleutel>` (de losse, handmatige CLI) blijft ook bestaan, voor een eenmalige her-ping
  zonder nieuwe deploy (bv. ná een contentwijziging via de CMS-loze `content/*.ts`-bestanden die
  wél opnieuw gedeployed is, maar je toch los wil herbevestigen).
  - **Sleutel**: geen handmatige `public/<sleutel>.txt`-stap meer. De sleutel is `sha256(site.
    domein)`, eerste 32 hex-tekens — stabiel zolang het domein niet wijzigt, per klantsite uniek,
    en hoeft niet geheim te zijn (IndexNow-sleutels zijn publiek, zie bing.com/indexnow — vandaar
    dat afleiden + wegschrijven zonder configuratie kan). `pingIndexNow()` schrijft
    `public/<sleutel>.txt` bij elke productie-build opnieuw; net als `.next` is dat bouwoutput, niet
    gecommit.
  - **Plek in de pipeline — eerlijk over de timing**: de ping vuurt binnen `vercel-build`
    (`next build && node scripts/keuring.mjs`), dus tijdens de BUILD-fase, een paar tientallen
    seconden vóórdat Vercel de nieuwe deployment daadwerkelijk aliast naar productie-verkeer — niet
    erná. Dat is een bewuste keuze: het alternatief (een GitHub Action op Vercels
    deployment-webhook, of een Vercel deploy-hook die dit script ná promotie aanroept) vraagt eigen
    infra buiten dit repo, voor een verschil dat voor IndexNow niet telt — het is een hint aan de
    crawler om "binnenkort" te checken, geen realtime-eis, en Bing crawlt sowieso niet
    milliseconden na de ping. Blijkt dat verschil ooit echt een probleem: bouw dan de deploy-hook-
    variant (aanroep: `node -e "import('./scripts/indexnow-lib.mjs').then(m=>m.pingIndexNow({domein:
    ..., paden: ..., vercelEnv: 'production'}))"` vanuit een losse workflow die de sitemap van de
    live URL leest, zoals `scripts/indexnow.mjs` dat al doet).
  - **Alle sitemap-URL's, niet alleen gewijzigd**: bewust, want (a) dit template bedient kleine
    marketingsites — enkele tot een paar dozijn pagina's, ruim binnen IndexNow's limiet van 10.000
    URL's per melding — en (b) "alleen gewijzigd" vereist een betrouwbare diff tegen de vórige
    productie-sitemap, wat een extra netwerkcall naar de nog-live oude site zou vragen (met een
    race-conditie: die site is nog live terwijl deze build draait) voor een risico dat IndexNow zelf
    niet kent — een ongewijzigde URL opnieuw melden kost niets, Bing crawlt 'm gewoon zoals toch al
    gepland.
  - **Een mislukte ping laat de uitrol nooit falen**: `pingIndexNow()` binnen een try/catch in
    `keuring.mjs`, alleen loggen. Getest zowel geïsoleerd (`scripts/test-indexnow-lib.mjs`, een
    mock-endpoint) als de volledige `vercel-build`-route met een gegarandeerd onbereikbaar endpoint
    — in beide gevallen blijft `process.exitCode` op 0.
- **Bing Webmaster Tools-checklist**: [bing.com/webmasters](https://www.bing.com/webmasters) →
  site toevoegen → verifiëren (meta-tag of DNS) → sitemap indienen (`/sitemap.xml`) → IndexNow-
  sleutel koppelen (zelfde sleutel als hierboven).
- **Google Search Console-checklist**: [search.google.com/search-console](https://search.google.com/search-console)
  → site toevoegen (domain-property via DNS, of URL-prefix) → sitemap indienen (`/sitemap.xml`) →
  "URL-inspectie" op de homepage om een eerste crawl te forceren → (optioneel) Google
  Bedrijfsprofiel koppelen.

## 9. FAQ — sectie op de homepage, route pas boven een drempel

**Besluit Lars (25-09-2026), vervangt punt 3 van § 10 hieronder (was: aparte route i.p.v.
sectie):** FAQ is STANDAARD een sectie op de homepage (`components/secties/Faq.tsx`, onderaan,
vóór Contact/Voet — de zes pixel-gemeten secties schuiven niet op). Pas als er écht veel vragen
zijn krijgt de site ook een eigen route.

Gestuurd door twee velden in `content/site.ts` (`faq.eigenPaginaVanaf`, standaard 8, en
`faq.toonAantal`, standaard 5):

| Aantal vragen (`site.faq.items.length`) | Homepage-sectie | `/veelgestelde-vragen` | `FAQPage`-schema |
|---|---|---|---|
| 0 | geen sectie | bestaat niet (404) | nergens |
| 1 t/m `eigenPaginaVanaf` | alle vragen, toegankelijk accordeon (`<details>/<summary>`, werkt zonder JS) | bestaat niet (404, via `notFound()` in de pagina) | op de homepage |
| boven `eigenPaginaVanaf` | eerste `toonAantal` vragen + link "Alle vragen" | bestaat, met de volledige lijst | alleen op `/veelgestelde-vragen` |

**Nooit op twee pagina's tegelijk** — `app/(nl)/page.tsx` en `app/(nl)/veelgestelde-vragen/page.tsx` (en hun `[locale]`-tegenhangers) sluiten
elkaar met dezelfde drempel-vergelijking uit, en `scripts/keuring.mjs` faalt hard als het toch
gebeurt (zie § 11: "FAQPage op meer dan één pagina"). Ook de sitemap en `llms.txt` nemen
`/veelgestelde-vragen` alleen op boven de drempel (`sitemap.ts`/`llms.txt/route.ts`); de
voettekst-link (`Voet.tsx`) is om dezelfde reden data-gedreven in plaats van hardcoded in
`content/site.ts`. `llms-full.txt` toont de volledige lijst altijd (dat bestand is sowieso "alles
in één keer", geen route).

De route zelf, wanneer hij bestaat, is gebouwd in dezelfde vorm als `/aanvraag`/`not-found.tsx`
(`Kop variant="terug"` + `kop-blok`-H1 + `Voet`, geen pixel-referentie om tegen af te zetten — de
bron heeft geen FAQ-pagina).

## 10. Keuzes voor Lars

Vijf plekken waar dit template een standaardkeuze maakt die per klant anders kan liggen — elk met
mijn standaardkeuze en de reden:

1. **AI-trainingscrawlers** (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot) —
   **standaard UIT** (`site.aiTraining = false`). Zoek-/citeer-crawlers (OAI-SearchBot,
   ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot) blijven ALTIJD aan, los van deze
   schakelaar. Reden: content blijft zo buiten trainingsdatasets zonder de vindbaarheid in
   ChatGPT/Claude/Perplexity-antwoorden te schaden. Een klant die trainingsgebruik juist wél wil
   toestaan (bv. voor naamsbekendheid) zet `site.aiTraining = true`.
2. **schema.org-subtype**: **standaard generiek `LocalBusiness`** (`site.schemaType` leeg). Reden:
   correct voor de meeste MKB-klanten zonder dat ik per branche een aanname hoef te doen; een
   klant met een preciezer subtype beschikbaar (`Dentist`, `Restaurant`, `ProfessionalService`, …)
   vult dat in — het is een boolean-achtige beslissing die de klant/Lars sneller weet dan ik kan
   raden.
3. **FAQ als sectie op de homepage, met een aparte route pas boven een drempel** — **besluit Lars,
   herzien 25-09-2026** (was tot dan: altijd een aparte route, nooit een sectie). Reden voor de
   herziening: bij een klant met maar een paar vragen is een aparte, bijna lege route juist het
   soort dunne pagina waar § 6 hierboven al voor waarschuwt bij lokale landingspagina's — en een FAQ
   is nu net de content die een AI-antwoordmachine het liefst direct naast de rest van het verhaal
   citeert (§ 8). De pixel-gemeten homepage (zes vaste secties, `page.tsx`) blijft intact: de
   FAQ-sectie is een bewuste, ongemeten zevende sectie, onderaan, vóór Contact/Voet — geen van de
   zes gemeten secties verschuift. Volledige uitwerking: § 9.
4. **IndexNow automatisch bij elke productie-uitrol** (herzien 25-09-2026, was: standaard
   handmatig/los script — geen CI/deploy-hook nodig, zie § 8 voor de volledige uitwerking). Reden
   voor de herziening: het ontbreken van een deploy-hook bleek geen echte blokkade — de ping kan
   ook vanuit `vercel-build` zelf vuren, zolang hij nooit de uitrol laat falen en nooit buiten
   productie draait. `scripts/indexnow.mjs` blijft daarnaast bestaan voor een handmatige, losse
   her-ping.
5. **`AggregateRating` blijft standaard leeg** — reviews komen pas in de JSON-LD zodra `site.reviews`
   met échte cijfers is ingevuld. Reden: nep-cijfers zijn precies de Webstijn-fout
   (`research/webstijn/OVERZICHT.md` § "Waar het rammelt") die dit template overal elders al
   vermijdt (zie R8/R9 in `component-library/_kwaliteit/KWALITEITSREGELS.md`).

## 11. Keuring

`npm run keuring` bouwt de site (of gebruikt een al lopende `--url`), loopt alle pagina's uit
`sitemap.xml` langs, en faalt (exit 1) bij:

- ontbrekende/dubbele `<title>` (en > 70 tekens), ontbrekende/dubbele/te korte (< 50)/te lange
  (> 160) meta description
- geen precies één `<h1>`
- `<img>` zonder `alt`
- geen skip-link ("naar de inhoud") als eerste link in `<body>`, of een skip-link die naar een
  anker wijst dat niet op diezelfde pagina bestaat (R21, zie § 4)
- ontbrekende `<link rel="canonical">`, ontbrekend `lang`-attribuut, ontbrekende `twitter:card`
- geen JSON-LD op de pagina, of een JSON-LD-blok dat geen geldige JSON is
- links naar localhost/`*.vercel.app`/staging/test./dev.-domeinen
- interne links die 404 geven (zowel via `<a>`-links als via de sitemap zelf)
- dubbele trackingscripts (GA4/GTM/Clarity)
- achtergebleven voorbeeldtekst (`example.com`, "lorem ipsum", `TODO`) — **op déze template zelf
  faalt dit bewust** zolang `content/site.ts` nog de voorbeeldpersona draagt; gebruik
  `--sta-placeholders-toe` om de rest te checken vóórdat je de content vervangen hebt
- sitemap.xml met minder `<lastmod>`- dan `<url>`-tags
- `robots.txt`/`llms.txt`/`llms-full.txt` niet bereikbaar of (bijna) leeg
- `FAQPage`-schema op meer dan één pagina tegelijk (besluit Lars 25-09-2026, zie § 9)
- een `FAQPage`-vraag die niet ook als zichtbare tekst op diezelfde pagina staat
- `/veelgestelde-vragen` die bestaat terwijl het aantal vragen niet boven `faq.eigenPaginaVanaf`
  ligt, of andersom ontbreekt terwijl het er wél boven ligt

De `seo-regels.mjs` van de onderdelenbibliotheek is dezelfde regelset, maar dan als losse,
site-onafhankelijke functies (geen fetch, geen kennis van fares-template) — voor een toekomstige
`_kwaliteit/site-keuring.mjs` om te importeren in plaats van deze checks opnieuw te schrijven.
Die heeft een eigen zelftest in de bibliotheek.
