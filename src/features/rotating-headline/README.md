# rotating-headline

Eén woord in een kop wisselt om de zoveel tijd — "Wij zijn [Webstijn /
Studio Wester / voor jou]." — in vier varianten: `blinds`, `clip`, `slide`,
`typing`. De stage-breedte animeert mee naar het nieuwe woord (geen
layout-sprong), pauzeert buiten beeld en op een verborgen tabblad, en staat
volledig stil bij `prefers-reduced-motion: reduce` (dan blijft het eerste
woord gewoon staan).

## Wanneer wel

- Eén kop die meerdere diensten, waarden of invalshoeken kort na elkaar wil
  tonen zonder de bezoeker te dwingen te scrollen of te klikken.

## Wanneer niet

- Niet voor de hoofdboodschap van de pagina — een bezoeker die binnen 1
  seconde weg is, mist het eerste woord misschien nog. Zet de belangrijkste
  aanbieding niet uitsluitend in het wisselende deel.
- Niet met veel (>4) woorden of lange woorden — de stage-breedte springt dan
  te veel heen en weer.

## Installatie

```
component-library/typography/rotating-headline/
├── rotating-headline.js      # vanilla ES-module, 0 dependencies
├── rotating-headline.css     # namespaced op [data-rotating-headline]
├── RotatingHeadline.tsx      # React/Next.js client-wrapper
├── demo.html                  # zelfstandige demo, 4 varianten
└── test/meet.mjs              # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./rotating-headline.css" />
<h2 data-rotating-headline data-rh-variant="clip" data-rh-interval="2600">
  Wij zijn
  <span class="rh__stage">
    <span class="rh__word" data-rh-word>Studio Wester</span>
    <span class="rh__word" data-rh-word hidden>vakmensen</span>
    <span class="rh__word" data-rh-word hidden>voor jou</span>
  </span>.
</h2>

<script type="module">
  import { init } from './rotating-headline.js';
  const destroy = init(document.querySelector('[data-rotating-headline]'));
</script>
```

**React / Next.js (App Router)**

```tsx
import { RotatingHeadline } from '@/component-library/typography/rotating-headline/RotatingHeadline';

<RotatingHeadline
  prefix="Wij zijn"
  words={['Studio Wester', 'vakmensen', 'voor jou']}
  suffix="."
  variant="clip"
  interval={2600}
/>
```

## Markup-contract

- Root: element met `data-rotating-headline`, meestal een `<h1>`/`<h2>`.
  Optioneel `data-rh-variant` (`blinds`|`clip`|`slide`|`typing`, standaard
  `clip`) en `data-rh-interval` (ms, standaard `2600`).
- `.rh__stage` — verplicht, de wissel-container.
- `[data-rh-word]` — elk kandidaat-woord binnen de stage. **Zet `hidden` op
  alle woorden behalve het eerste** — dat is de complete zonder-JS-fallback:
  zonder JS toont de HTML gewoon het eerste woord, statisch, geen lege
  stage.
- Na `init()` herschrijft de module de root tot twee delen: een visuele,
  `aria-hidden="true"` kopie (`.rh__visible`, met de wisselende stage erin)
  en een `.rh__sr-only`-zin met de volledige tekst en alle alternatieven
  (bv. "Wij zijn Studio Wester, vakmensen, voor jou."), zodat een schermlezer
  de hele zin één keer hoort — niet bij elke wissel opnieuw.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `variant` | `data-rh-variant` of `'clip'` | `blinds` \| `clip` \| `slide` \| `typing`. |
| `interval` | `data-rh-interval` of `2600` | Tijd per woord in ms. |
| `duration` | `420` | Duur van de wissel-animatie in ms. |

CSS-variabele: `--rh-color` (standaard `var(--sc-accent, #2f6fed)`) kleurt het
wisselende woord.

## Toegankelijkheid

- **Schermlezer hoort de hele zin één keer**: zie Markup-contract. Er is
  geen `aria-live`-regio — dat zou bij elke wissel opnieuw voorlezen, wat
  hier expliciet niet de bedoeling is.
- **Reduced motion**: bij `prefers-reduced-motion: reduce` stopt de timer
  volledig en toont de CSS puur via `:first-of-type` altijd het eerste
  woord — dat werkt zelfs als JS nog niet gereageerd heeft (dubbel vangnet,
  zie Valkuilen). Reageert ook live op een wissel halverwege de sessie
  (`minderBeweging`-callback snapt meteen terug naar het eerste woord).
- **Pauzeert buiten beeld**: `IntersectionObserver` stopt de timer zodra de
  kop niet zichtbaar is, en start hem weer zodra hij terugkomt (R18). Ook op
  een verborgen tabblad (`visibilitychange`) staat de timer stil.
- **Alleen `opacity`/`clip-path`/`transform`** in de animaties — geen
  doorlopende scroll-/pointerhandler, dus geen `perFrame` nodig hier.

## Op WordPress

Geen build-stap. CSS + `rotating-headline.js` in het thema,
`wp_enqueue_style()` + `wp_enqueue_script_module()`, `init()` per kop na
`DOMContentLoaded`. Zie `scroll/reveal-on-scroll/README.md` voor het
volledige WordPress-recept (inclusief de caching-plugin-valkuil bij
ES-modules).

## Valkuilen

- **Stage-breedte animeert met `width`**, niet alleen `transform`/`opacity`
  — een bewuste uitzondering op R18: dit is de enige manier om de kop
  "netjes mee te laten ademen" zonder layout-sprong, het is een korte
  overgang op een klein inline-element (geen doorlopende animatie, geen
  scroll-/pointerhandler), dus de performance-impact is verwaarloosbaar.
- **`.rh__stage`-hoogte staat vast op `1.2em`** — bij een extreem grote of
  kleine `line-height` op de kop kan het wisselende woord net iets
  hoger/lager staan dan de rest van de tekst. Pas zo nodig de hoogte aan met
  een eigen regel op `.rh__stage`.
- **`typing`-variant en emoji/accenttekens**: `--rh-steps` telt
  `String.length` (UTF-16-eenheden), niet zichtbare tekens — bij emoji of
  samengestelde tekens kan de steps-reveal net iets ongelijkmatig ogen.
- **Woorden met heel verschillende breedte** laten de stage duidelijk
  "ademen" — gewenst effect, maar bij een sterk wisselende breedte kan de
  omliggende tekst licht meebewegen als de kop op een smalle kolom staat.

## Herkomst

"Wisselende kop" gezien bij 9 Webstijn-klantsites + webstijn.nl zelf
(Elementor Animated Headline, varianten blinds/clip). Eigen implementatie,
geen code overgenomen. Wat wij beter doen: een expliciete schermlezer-zin
(Elementor's eigen variant regelt dat niet consistent) en een extra
`typing`-variant met een per-woord `steps()`-reveal.
