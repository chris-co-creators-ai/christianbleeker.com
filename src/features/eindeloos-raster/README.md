# eindeloos-raster

Portfoliomozaïek met per kolom grote staande casekaarten en kleine vierkante
tegels (foto of stille videoloop). Scrolt de bezoeker door, dan komt het raster
steeds terug, zonder sprong of naad. Na 20 rondes stopt het en volgen een lijst
met alle cases en de footer. Een knop onderin het scherm ("Alle cases als
lijst") brengt je daar meteen heen. Op een casekaart veert bij hover of focus
een lade met disciplines open. Energie: **middel**.

## Wanneer wel

- Cases- of portfoliopagina van een bureau, fotograaf, architect of aannemer
  met minstens 6 tot 8 cases en eigen sfeerbeeld.
- Als je wilt dat bladeren voelt als door een boek bladeren, niet als zoeken.

## Wanneer niet

- Als bezoekers iets zoeken: een filter of zoekveld is dan beter
  (`layouts/kennisbank-filter`). Dit raster heeft bewust geen filter.
- Minder dan 6 cases: dan zie je de herhaling meteen. Gebruik `layouts/bento-grid`.
- Een pagina waar de footer of het contactformulier de belangrijkste actie is.

## Installatie

```
component-library/layouts/eindeloos-raster/
  eindeloos-raster.js   vanilla ES-module, 0 dependencies (importeert _kwaliteit/basis.js)
  eindeloos-raster.css  alles onder .er
  EindeloosRaster.tsx   React/Next-wrapper
  media/                demobeelden en twee tegelloops (zie Herkomst)
```

**Vanilla**

```html
<link rel="stylesheet" href="eindeloos-raster.css" />
<script type="module">
  import { init } from './eindeloos-raster.js';
  const destroy = init(document.getElementById('werk'), { cycli: 20 });
</script>
```

**React / Next.js**

```tsx
import { EindeloosRaster } from './EindeloosRaster';

<EindeloosRaster labelledBy="er-kop" cycli={20}>
  {/* balk, lus met raster en einde-lijst uit het contract hieronder */}
</EindeloosRaster>
```

**WordPress**: genereer de markup in het template van het cases-archief (een
`WP_Query` op het posttype, één `<li>` per case en per sfeertegel). Laad de CSS
in de head en het script als `type="module"`. De lijst onderaan komt uit
dezelfde query.

## Markup-contract

```html
<section class="er" id="werk" aria-labelledby="er-kop">
  <h1 id="er-kop">Werk</h1>

  <!-- uitweg: staat vóór de tegels, dus de eerste Tab in de sectie -->
  <div class="er__balk" data-er-balk>
    <a class="er__uitweg" href="#er-lijst">Alle cases als lijst</a>
  </div>

  <div class="er__loop" data-er-loop>
    <ul class="er__raster" data-er-raster>
      <li class="er__item">                       <!-- groot: casekaart -->
        <article class="er__case">
          <img class="er__beeld" src="…" alt="" width="600" height="900" loading="lazy" />
          <div class="er__voet">
            <div class="er__kopgroep">
              <span class="er__label">Klantnaam</span>
              <h3 class="er__titel"><a href="/cases/klant">Titel van de case</a></h3>
            </div>
            <ul class="er__lade" aria-label="Disciplines"><li>Webdesign</li><li>Video</li></ul>
            <span class="er__meer" aria-hidden="true">Bekijk deze case</span>
          </div>
        </article>
      </li>
      <li class="er__item">                       <!-- klein: sfeertegel -->
        <figure class="er__tegel">
          <video muted loop playsinline preload="none" poster="…" aria-hidden="true">
            <source src="….webm" type="video/webm" /><source src="….mp4" type="video/mp4" />
          </video>
          <figcaption class="er__label">Klantnaam</figcaption>
        </figure>
      </li>
      <!-- … -->
    </ul>
  </div>

  <div class="er__einde" id="er-lijst" tabindex="-1">
    <h2>Alle cases</h2>
    <ol class="er__lijst"><li><a href="/cases/klant">Titel <span>Klantnaam</span></a></li></ol>
  </div>
</section>
```

- **Volgorde voor een naadloze herhaling.** Het raster is een CSS-kolomlayout
  (`columns`), gevuld van boven naar beneden, kolom na kolom. Elke kolom moet
  even hoog zijn, anders zit er bij de herhaling een gat. Met groot = 2:3 en
  klein = 1:1 werkt dit patroon voor 4 kolommen (desktop) én 2 (mobiel):
  `G K G K | K G K G | G K G K | K G K G` (16 items: 8 cases, 8 tegels). Andere
  aantallen: zorg dat elke kolom evenveel G's en K's krijgt. De meting toetst
  de balans (verschil 0,0 px).
- De hele casekaart is klikbaar via de link in de titel (`::after` over de
  kaart). Er is maar één link per kaart.
- Het `id` van de lijst (`#er-lijst`) is het doel van de uitweg. `tabindex="-1"`
  zorgt dat de focus mee springt.

## Opties (`init(root, opties)`)

| Optie | Standaard | Wat |
|---|---|---|
| `cycli` | `20` | aantal keer dat het raster terugkomt, daarna lijst en footer |
| `inkomen` | `true` | tegels in het eerste scherm komen bij het laden omhoog (0,9 s, 60 ms ertussen) |
| `videoMarge` | `'0px'` | `rootMargin` voor tegelvideo's; `'200px'` start ze iets eerder |

CSS-variabelen op `.er`: `--er-papier`, `--er-inkt`, `--er-accent`, `--er-voet`
(schuine voet), `--er-label` en `--er-label-tekst` (pil), `--er-kolommen` (4,
mobiel 2), `--er-gap`, `--er-rand`, `--er-radius`, `--er-lade` (hoogte van de
lade), `--er-veer` (easing van de lade, standaard outBack).

## Hoe het werkt

- Het origineel en 1 of 2 kopieën (genoeg om een scherm te vullen) liggen
  absoluut in `.er__loop`, die `cycli × rasterhoogte` hoog is (desktop 1.493 px
  × 20 = 29.860 px, mobiel ±36.500 px).
- Bij elke scrollstap (één passieve listener via `perFrame()`) rekent het script
  uit in welke cyclus de bovenkant van het scherm valt, en geeft die cyclus en de
  volgende elk een raster met `translate3d(0, cyclus × hoogte, 0)`. Dat is
  stateless: een sprong met de scrollbalk, Home of End staat meteen goed
  (gemeten op 37, 81 en 100 % van de lus).
- `overflow-anchor: none` op de lus: de browser mag niet zelf gaan corrigeren
  als een raster verspringt.
- Video's in tegels: `preload="none"`, een `IntersectionObserver` zet ze aan in
  beeld en uit erbuiten (ook in de kopieën). De knop "Pauzeer video's" zet ze
  allemaal stil (WCAG 2.2.2).
- Lade: alleen `transform` en `opacity`. De witte voet (`::before`) en de
  klantnaam met titel schuiven 2,75rem omhoog met outBack
  (`cubic-bezier(.34,1.56,.64,1)`, 500 ms), de disciplines faden in (150 ms), het
  beeld zoomt naar 1,08.

## Toegankelijkheid

- Kopieën zijn `inert` en `aria-hidden="true"`, zonder `id`'s. Een schermlezer
  en het toetsenbord krijgen elke case één keer (gemeten: 8 van de 16 links
  bereikbaar, focus in een kopie lukt niet).
- **Uitweg**: de link "Alle cases als lijst" staat vóór de tegels, dus de eerste
  Tab in de sectie. Hij plakt onderin het scherm zolang de sectie in beeld is.
  Enter springt naar de lijst, zet de focus erop, en de volgende Tab gaat de
  lijst in en daarna naar de footer.
- De lus stopt na 20 rondes: de footer is bereikbaar, de scrollbalk blijft
  bruikbaar (documenthoogte desktop 31.199 px, grens in de meting 60.000 px;
  Tandem: 701.622 px).
- **Minder beweging**: geen lus en geen kopieën, maar één gewoon eindig raster,
  geen inkomen, video's spelen niet (poster). Live omzetten werkt in beide
  richtingen.
- **Zonder JavaScript**: hetzelfde eindige raster, alle links werken.
- **Touch** (R3): de lade met disciplines staat altijd open; hover is niet nodig.
- Focus op een casekaart opent de lade ook (`:focus-within`) en toont een
  3 px ring om de hele kaart.

## Valkuilen

- Kolommen die niet even hoog zijn geven een gat bij de herhaling. Houd je aan
  het patroon hierboven of meet de balans.
- Een raster dat lager is dan het scherm: het script maakt dan zelf extra kopieën
  (`ceil(schermhoogte / rasterhoogte) + 1`), maar met 4 items voelt het als een
  echo. Minimaal 12 items.
- `position: sticky` van de uitweg werkt niet in een voorouder met
  `overflow: hidden`.
- Zet `loading="lazy"` op de beelden: in de kopieën laden ze pas als die in
  beeld komen.
- `content-visibility: auto` op de tegels hebben we niet gedaan: in een
  kolomlayout verandert een tijdelijke maat de verdeling over de kolommen, en
  dan klopt de naad niet meer.

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
