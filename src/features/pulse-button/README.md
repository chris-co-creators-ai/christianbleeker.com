# pulse-button

Een CTA-knop met een uitdijende ring (`box-shadow`-keyframes) die de aandacht
trekt zonder eindeloos door te lopen: standaard stopt hij na 3 cycli, of hij
pulseert alleen zolang de knop in beeld is. Optionele glasknop-variant
(transparant + blur).

## Wanneer wel

- Eén primaire actie per scherm die je licht wilt benadrukken (aanvraag
  starten, offerte vragen) — niet meer dan één pulserende knop tegelijk.
- Een knop die pas relevant wordt zodra hij in beeld komt (`data-pulse-in-view`),
  bijvoorbeeld een CTA onderaan een lange pagina.

## Wanneer niet

- Niet voor meerdere knoppen tegelijk op één scherm — dat oogt onrustig en
  verwatert welke actie de belangrijkste is.
- Niet als vervanging van duidelijke kleur/contrast: de ring is een extra
  signaal, geen enige onderscheid tussen primaire en secundaire knop.

## Installatie

```
component-library/buttons/pulse-button/
├── pulse-button.js       # vanilla ES-module, 0 dependencies
├── pulse-button.css      # namespaced op .pulse-button
├── PulseButton.tsx        # React/Next.js client-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./pulse-button.css" />
<button type="button" class="pulse-button" data-pulse-max="3">Plan een kennismaking</button>

<script type="module">
  import { init } from './pulse-button.js';
  const destroy = init(document.body); // { maxPulses?: number, onlyInView?: boolean }
</script>
```

**React / Next.js**

```tsx
import { PulseButton } from '@/component-library/buttons/pulse-button/PulseButton';

<PulseButton maxPulses={3}>Plan een kennismaking</PulseButton>
<PulseButton glass href="/offerte">Vraag een offerte aan</PulseButton>
```

## Markup-contract

- Knop of link met klasse `.pulse-button` (optioneel `.pulse-button--glass`).
  Werkt op zowel `<button>` als `<a>` — de module zoekt op klasse, niet op tag.
- `data-pulse-max="3"` — stopt de ring na dit aantal cycli (`0` = onbeperkt
  zolang de knop niet buiten beeld gaat/JS niet reduced is). Standaard `3`
  als het attribuut ontbreekt.
- `data-pulse-in-view` — pulseert alleen zolang de knop de viewport raakt
  (IntersectionObserver, threshold 0.4); stopt zodra hij uit beeld scrolt en
  hervat bij terugscrollen (tenzij `data-pulse-max` intussen is bereikt).
- De module zet zelf de klasse `is-pulsing` (animatie aan) en
  `data-pulse-done="1"` (definitief gestopt na `data-pulse-max` cycli).

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `maxPulses` | attribuut of `3` | Overschrijft `data-pulse-max` voor alle knoppen binnen `root`. |
| `onlyInView` | attribuut of `false` | Overschrijft `data-pulse-in-view` voor alle knoppen binnen `root`. |

CSS-variabelen (op `.pulse-button`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--pulse-color` | `47, 111, 237` | Ring-kleur als "r, g, b"-triplet (geen `#hex`, zodat de ring zelf de alpha kan zetten). |
| `--pulse-bg` | `#2f6fed` | Achtergrond van de gevulde variant. |
| `--pulse-fg` | `#ffffff` | Tekstkleur. |
| `--pulse-duration` | `1.8s` | Duur van één ring-cyclus. |

## Toegankelijkheid

- Gewone `<button>`/`<a>` — toetsenbord, Enter/Spatie en `:focus-visible`
  werken zonder extra code (2px outline, 3px offset).
- **Minder beweging (R1).** De JS-module start geen `is-pulsing` als
  `prefers-reduced-motion: reduce` staat, en stopt live zodra de bezoeker het
  middenin omzet. De CSS heeft daarnaast een eigen `@media`-vangnet dat de
  animatie op `none` zet, ook als de JS onverhoopt niet laadt.
- **Niet opdringerig (R11/R13-geest).** De ring stopt uit zichzelf na een
  eindig aantal cycli — geen knop die de hele sessie blijft knipperen.
- De ring is decoratief (`box-shadow`, geen los DOM-element), dus geen
  `aria-hidden` nodig; hij verandert niets aan de toegankelijke naam of het
  gedrag van de knop.

## Op WordPress

Geen build-stap nodig. Zet de map in je thema, laad `pulse-button.css` en
`pulse-button.js` zoals beschreven in `scroll/reveal-on-scroll/README.md`
(§ Op WordPress — zelfde `wp_enqueue_script_module()`-patroon, zonder
versienummer op de module-enqueue), plaats `<button class="pulse-button">`
in een Custom HTML-blok of template, en roep `init(document.body)` aan na
`DOMContentLoaded`.

## Valkuilen

- **`data-pulse-max="0"` samen met géén `data-pulse-in-view`** laat de ring
  voor altijd doorlopen. Gebruik `0` bewust, meestal in combinatie met
  `data-pulse-in-view`.
- **`animationiteration` telt volledige cycli**, niet frames — bij een korte
  `--pulse-duration` en een trage device kan de telling iets achterlopen bij
  zeer snel scrollen in/uit beeld; onschuldig, de knop stopt uiterlijk één
  cyclus later.
- **Twee `.pulse-button`-instanties met dezelfde `--pulse-color`** op een
  donkere achtergrond kunnen de ring laten wegvallen tegen de achtergrond —
  zet dan de glasknop-variant (`--pulse-color` licht) in plaats van de
  gevulde variant.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
