# section-dividers

Sectieranden als inline SVG — 8 vormen: schuin, golf, dubbele golf, driehoek,
curve, verfstreep, gescheurd papier en borstel-golf. Elke vorm werkt boven of
onder een sectie, is spiegelbaar, schaalbaar in hoogte en overneemt de
tekstkleur (`currentColor`) of een eigen CSS-variabele. Vult altijd de volle
breedte van de sectie, zonder naad — ook op 390/1280/1920px (gemeten, zie
"Valkuilen").

## Wanneer wel

- Een sectie-overgang die net iets meer is dan een rechte lijn: hero →
  content, content → footer, een blok met een andere achtergrondkleur.
- Een merk met een handgemaakt of ambachtelijk randje (verfstreep, gescheurd
  papier) i.p.v. een strak geometrisch randje (schuin, driehoek, curve).

## Wanneer niet

- Niet als losstaand decoratief element midden in tekst — dit is uitsluitend
  een sectie**rand** (bovenkant/onderkant), geen illustratie.
- Niet stapelen (meerdere randen boven op elkaar): één rand per
  sectie-overgang is genoeg; twee gestapelde randen ogen al snel druk.
- Niet voor content die de rand zelf moet dragen (knoppen, links) — de SVG
  is `aria-hidden` en `pointer-events: none`, dus niets erin is klikbaar.

## Installatie

```
component-library/shapes/section-dividers/
├── section-dividers.js      # vanilla ES-module, 0 dependencies — optionele injectie-helper
├── section-dividers.css     # namespaced op .sdv, geen globale selectors
├── SectionDivider.tsx       # React/Next.js client-wrapper
├── demo.html                # zelfstandige demo (8 vormen + naad-testfixture)
└── test/meet.mjs            # Playwright-meting
```

### Zonder JS (de basisvorm — altijd beschikbaar)

Geen script nodig. Plak de wrapper + een van de acht `<svg>`-snippets
rechtstreeks in je markup, binnen een sectie met `position: relative`:

```html
<section style="position: relative;">
  …inhoud…
  <div class="sdv" data-positie="onder" aria-hidden="true">
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
    </svg>
  </div>
</section>
```

Alle acht `d`-waarden (viewBox altijd `0 0 1200 120`):

| Vorm | `d` |
|---|---|
| schuin | `M0,120 L1200,10 L1200,120 Z` |
| golf | `M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z` |
| dubbele-golf | `M0,90 C200,20 400,20 600,70 C800,120 1000,20 1200,60 L1200,120 L0,120 Z` |
| driehoek | `M0,120 L600,10 L1200,120 Z` |
| curve | `M0,120 Q600,0 1200,120 Z` |
| verfstreep | `M0,80 C40,60 80,100 130,75 C200,40 260,95 320,70 C400,35 460,100 540,65 C620,30 700,95 780,60 C860,25 940,90 1020,55 C1090,25 1150,70 1200,50 L1200,120 L0,120 Z` |
| papier | `M0,100 L60,70 L120,95 L180,60 L240,90 L300,55 L360,85 L420,50 L480,80 L540,45 L600,75 L660,40 L720,70 L780,50 L840,80 L900,45 L960,75 L1020,55 L1080,85 L1140,60 L1200,90 L1200,120 L0,120 Z` |
| borstel-golf | `M0,50 C100,90 200,10 320,55 C420,90 500,20 620,60 C720,95 820,15 940,55 C1040,90 1120,25 1200,55 L1200,120 L0,120 Z` |

### Vanilla + injectie-helper (meerdere randen zonder markup te dupliceren)

```html
<link rel="stylesheet" href="./section-dividers.css" />
<section style="position: relative;">
  …inhoud…
  <div class="sdv" data-divider="golf" data-positie="onder"></div>
</section>
<script type="module">
  import { init } from './section-dividers.js';
  const destroy = init(document.body); // vult alle [data-divider] die nog leeg zijn
  // destroy() bij opruimen — haalt alléén de door deze aanroep ingevoegde <svg>'s weg
</script>
```

### React / Next.js (App Router)

```tsx
import { SectionDivider } from '@/component-library/shapes/section-dividers/SectionDivider';

<section style={{ position: 'relative' }}>
  …inhoud…
  <SectionDivider vorm="papier" positie="onder" hoogte={96} kleur="#1c2b4a" />
</section>
```

### Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/section-dividers/`.
2. Enqueue de CSS en de JS-module (zonder versienummer op de module, zie
   `reveal-on-scroll`-README voor waarom):

```php
wp_enqueue_style( 'sd-style', get_stylesheet_directory_uri() . '/component-library/section-dividers/section-dividers.css', [], '1.0.0' );
wp_enqueue_script_module( 'sd-module', get_stylesheet_directory_uri() . '/component-library/section-dividers/section-dividers.js', [], null );
```

3. Zonder JS mag je de kant-en-klare `<svg>`-snippet (zie hierboven) direct
   in een Custom HTML-blok plakken — geen enqueue nodig.
4. Met de injectie-helper: `<div class="sdv" data-divider="golf" data-positie="onder"></div>`
   in een Custom HTML-blok, dan in de footer:

```html
<script type="module">
  import { init } from '/wp-content/themes/<thema>/component-library/section-dividers/section-dividers.js';
  document.addEventListener('DOMContentLoaded', () => init(document.body));
</script>
```

## Markup-contract

- Wrapper: `<div class="sdv">`, **binnen een sectie met `position: relative`**
  (of een andere positioning-context) — anders positioneert `.sdv` t.o.v. de
  verkeerde ouder.
- `data-positie="boven"` of `"onder"` (standaard `onder` als het attribuut
  ontbreekt). Alle vormen zijn getekend als bodemrand; `"boven"` spiegelt
  verticaal via CSS (`transform: scaleY(-1)`) — geen aparte paden nodig.
- `data-spiegel` (boolean-attribuut, geen waarde) — spiegelt horizontaal.
- Inhoud van `.sdv`: óf een handgeplakte `<svg>` (zonder JS), óf
  `data-divider="<vorm>"` zónder svg-kind (de helper vult die dan). Staat er
  al een `<svg>`-kind in, dan laat `init()` het met rust — idempotent en
  compatibel met server-gerenderde markup.
- Kleur: de `<path>` gebruikt `fill="currentColor"` — zet `color` op `.sdv`
  zelf of op een voorouder, of override de CSS-variabele `--sd-kleur`.

## Opties

`init(root, opties)`:

| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `"[data-divider]"` | CSS-selector voor de te vullen hosts. `root` zelf telt ook mee als hij matcht. |

Data-attributen per host:

| Attribuut | Standaard | Omschrijving |
|---|---|---|
| `data-divider` | — | Vorm-naam, zie tabel hierboven. Verplicht voor de JS-injectie; overbodig bij een handgeplakte `<svg>`. |
| `data-positie` | `onder` | `boven` of `onder`. |
| `data-spiegel` | afwezig | Aanwezig = horizontaal spiegelen. |
| `data-hoogte` | — | Hoogte in px als getal zonder eenheid (bv. `data-hoogte="120"`). Zonder JS: zet `style="--sd-hoogte: 120px"` rechtstreeks. |

CSS-variabelen op `.sdv`:

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--sd-hoogte` | `5rem` (80px) | Hoogte van de rand. |
| `--sd-kleur` | `currentColor` | Vulkleur. |

`SectionDivider`-props (React): `vorm` (verplicht), `positie`, `spiegel`,
`hoogte` (number, px), `kleur` (CSS-kleur), `className`.

## Toegankelijkheid

- Elke `<svg>` heeft `aria-hidden="true"` en `focusable="false"` — pure
  decoratie, nooit onderdeel van de leesvolgorde of tab-volgorde (R15).
- `.sdv` heeft `pointer-events: none`: een rand kan nooit per ongeluk een
  klik onderscheppen van content eronder/erboven.
- Geen beweging, dus `prefers-reduced-motion` is hier niet van toepassing —
  de rand is een statische vorm.

## Valkuilen

- **De klassieke 1px-naad.** Een `<svg>` is standaard `display: inline`, en
  krijgt dan de marge van een tekst-baseline (ruimte voor "staarten" zoals
  bij `g`/`y`) — dat laat een leesbare streep van de paginakleur onder de
  rand staan. Fix: `svg { display: block }` (zit al in `section-dividers.css`).
  Daarnaast kan subpixel-afronding bij niet-gehele viewportbreedtes een
  haarlijntje geven tussen `.sdv` en de sectierand zelf; de wrapper ligt
  daarom bewust 1px buiten alle vier de randen
  (`inset: -1px; width/height: calc(100% + 2px)`). Gemeten met een
  screenshot-pixelscan op 390/1280/1920px in `test/meet.mjs`: 0 pixels van
  de (felle, contrasterende) paginakleur zichtbaar op de grens.
- **`preserveAspectRatio="none"` is bewust.** Zonder dat attribuut schaalt
  de browser de viewBox met behoud van verhouding en laat hij lege
  letterbox-ruimte staan bij een sectiebreedte die niet overeenkomt met de
  1200:120-verhouding — met `"none"` rekt de vorm altijd exact tot de volle
  breedte/hoogte van `.sdv`.
- **Twee vormen stapelen (boven + onder in dezelfde sectie)** kan, maar geef
  ze allebei een eigen `data-hoogte` zodat ze elkaar niet overlappen bij een
  korte sectie.
- **`overflow: hidden` op de sectie** clipt de 1px-bleed netjes af — geen
  probleem, dat is precies waar de bleed voor bedoeld is.

