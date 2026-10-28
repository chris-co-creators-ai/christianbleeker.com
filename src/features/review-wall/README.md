# review-wall

Toont reviews (naam, datum, score, tekst, bron-link) uit JSON, als raster of
carrousel, met een score-badge en een "lees meer" voor lange teksten. Zonder
reviews toont de sectie niets — liever verborgen dan een lege reviewwand.

## Wanneer wel

- Een sectie met échte klantreviews die je zelf beheert (JSON, CMS-veld,
  export uit Google/Facebook).
- Wanneer je een score wilt tonen die ofwel eerlijk berekend is uit de
  getoonde reviews, ofwel een groter, extern getal is (bv. "4,8 op basis van
  124 Google-reviews", terwijl je er hier maar 6 toont) — met bronvermelding.

## Wanneer niet

- Niet voor verzonnen of "voorbeeld"-reviews in productie — dit is een
  vertrouwenscomponent, nepdata ondermijnt precies waar het voor bedoeld is.
- Niet als enige SEO-strategie voor sterren in zoekresultaten: schema.org
  `AggregateRating` helpt, maar Google beslist zelf of/hoe het getoond wordt.

## Installatie

```
component-library/reviews/review-wall/
├── review-wall.js      # vanilla ES-module, 0 dependencies
├── review-wall.css     # namespaced op .rw
├── ReviewWall.tsx       # React/Next.js client-wrapper
├── demo.html            # zelfstandige demo (raster, carrousel, zwevende badge)
└── test/meet.mjs        # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./review-wall.css" />
<section class="rw" data-review-wall data-weergave="raster">
  <script type="application/json" data-rw-reviews>
  [{ "naam": "Marieke", "datum": "2026-08-14", "score": 5, "tekst": "Top!", "bron": "Google" }]
  </script>
  <div class="rw__score" data-rw-score></div>
  <ul class="rw__lijst" data-rw-lijst></ul>
</section>
<script type="module">
  import { init } from './review-wall.js';
  const destroy = init(document.querySelector('[data-review-wall]'));
  // destroy() bij opruimen
</script>
```

**React / Next.js**

```tsx
import { ReviewWall } from '@/component-library/reviews/review-wall/ReviewWall';

<ReviewWall reviews={reviews} weergave="carrousel" scoreVast={4.8} scoreBron="124 Google-reviews" />
```

## Markup-contract

- Root: sectie met `data-review-wall`. Bevat:
  - `<script type="application/json" data-rw-reviews>` — een array
    `Review[]` (`naam`, `datum` (ISO), `score` (1-5), `tekst`, optioneel
    `bron`/`bronUrl`). **Leeg of ontbrekend → de hele sectie krijgt
    `hidden`** en een console-waarschuwing.
  - `[data-rw-score]` — waar de module de score-badge in rendert.
    Optioneel `data-score-vast="4.8"` + `data-score-bron="124 Google-reviews"`
    om een extern getal te tonen in plaats van de berekening uit de getoonde
    reviews (R9 — als je dit zet, negeert de module de eigen berekening
    volledig, zodat de twee elkaar nooit tegenspreken).
  - `[data-rw-lijst]` — een `<ul>` waar de kaarten in komen.
  - Bij `data-weergave="carrousel"`: optioneel `[data-rw-vorige]` /
    `[data-rw-volgende]`-knoppen (buttons) voor bediening.
- `data-schema-org` (optioneel) — voegt `<script type="application/ld+json">`
  met `AggregateRating` toe.

### Zwevende score-badge

Klasse `.rw__score--zwevend` op het `[data-rw-score]`-element maakt er een
`position: absolute`-kaartje van (rechtsonder, met schaduw) — bedoeld om
over de hoek van een hero-foto te leggen. **Plaats hem altijd over een
lege/rustige hoek van een afbeelding, nooit over tekst of een CTA** — de
badge zelf verbergt niets onder zich (geen overlay, geen backdrop), maar
komt wél bovenop wat eronder staat. De ouder van het `.rw`-element moet
`position: relative` hebben.

## Opties (`init(root, opties)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `reviews` | uit `[data-rw-reviews]` | De reviewlijst. |
| `scoreVast` | `data-score-vast` | Vast scorecijfer; wint van de berekening. |
| `scoreBron` | `data-score-bron` | Bronvermelding bij `scoreVast`. |
| `weergave` | `data-weergave` of `'raster'` | `'raster'` of `'carrousel'`. |
| `schemaOrg` | `data-schema-org` aanwezig? | Voegt ld+json `AggregateRating` toe. |

## Toegankelijkheid

- Sterren zijn decoratief (`aria-hidden="true"`); elke kaart heeft een
  verborgen tekst ("5 van de 5 sterren") voor schermlezers.
- "Lees meer" is een echte `<button>` met `aria-expanded`, verschijnt alleen
  als de tekst ook echt is afgeknot (gemeten na render — geen nutteloze
  knop bij een tekst die toch al past).
- Carrousel-navigatie: echte `<button>`-elementen, met Tab bereikbaar,
  zichtbare focus (`:focus-visible`).
- Bronlinks openen in een nieuw tabblad met `rel="noopener"`.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/review-wall/`.
2. Enqueue de CSS, laad `review-wall.js` met `wp_enqueue_script_module()`
   (geen versienummer — zie `scroll/reveal-on-scroll/README.md` "Op WordPress").
3. Print de reviews als JSON in het `<script type="application/json" data-rw-reviews>`-blok,
   bijvoorbeeld vanuit een ACF-repeater-veld via `wp_json_encode()`.

## Valkuilen

- **`scoreVast` zonder `scoreBron`** werkt, maar laat de bezoeker gissen
  waar het cijfer vandaan komt — vul hem altijd in als je een extern getal
  toont.
- **Carrousel-knoppen vergeten** bij `data-weergave="carrousel"`: de
  horizontale scroll werkt dan nog gewoon met muis/touch/trackpad, maar
  zonder knoppen is er geen toetsenbord-manier om door te scrollen buiten
  natuurlijke scrollcontainer-navigatie. Voeg ze altijd toe.
- **Lange reviewteksten zonder witruimte** (bv. één urenlange zin) kunnen de
  `-webkit-line-clamp`-afkapping er raar laten uitzien; dat is een CSS-
  eigenschap van de browser, geen bug in dit component.

