# ghost-text

Reusachtig, doorzichtig woord (of letter) achter een sectie —
"UITGELICHT", een grote "R" — puur decoratief, met een optionele lichte
parallax bij scrollen.

## Wanneer wel

- Een sectie een grafisch anker geven zonder een foto te gebruiken: één
  groot woord of letter op de achtergrond, tekst en knoppen erbovenop.
- Werkt het beste bij secties met veel witruimte — het woord heeft ruimte
  nodig om niet met de voorgrondtekst te botsen.

## Wanneer niet

- Niet als het enige onderscheid tussen secties — bij herhaling op elke
  sectie verliest het effect zijn kracht (richtlijn: 1–2 per pagina).
- Niet met lange woorden op smalle containers: bij `clamp()` kan een lang
  woord bij de maximale schaal toch breder worden dan de container. Test op
  mobiel, of gebruik een korter woord/letter.

## Installatie

```
component-library/typography/ghost-text/
├── ghost-text.js      # vanilla ES-module, 0 dependencies (alleen parallax)
├── ghost-text.css     # namespaced op [data-ghost-text] / [data-ghost-text-host]
├── GhostText.tsx       # React/Next.js client-wrapper
├── demo.html            # zelfstandige demo
└── test/meet.mjs        # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./ghost-text.css" />
<section data-ghost-text-host>
  <span data-ghost-text aria-hidden="true">UITGELICHT</span>
  <div>
    <h2>Ons uitgelichte project</h2>
    <p>…</p>
  </div>
</section>

<script type="module">
  import { init } from './ghost-text.js';
  const destroy = init(document.querySelector('[data-ghost-text]'), { parallax: true });
</script>
```

Geen parallax nodig? Dan is er geen JS nodig — laat `<script>` weg, de
ghost-tekst is puur CSS.

**React / Next.js (App Router)**

```tsx
import { GhostText } from '@/component-library/typography/ghost-text/GhostText';

<GhostText word="UITGELICHT" parallax>
  <div>
    <h2>Ons uitgelichte project</h2>
    <p>…</p>
  </div>
</GhostText>
```

## Markup-contract

- `[data-ghost-text-host]` — de sectie/container, krijgt `position:relative`
  en zet alle directe kinderen behalve de ghost-tekst op `z-index:1` (zodat
  de echte inhoud er altijd bovenop staat).
- `[data-ghost-text]` — het decoratieve woord zelf, **verplicht
  `aria-hidden="true"`**. Positioneert zichzelf `absolute` binnen de host.
- Geen JS-vereiste markup verder — de schaal (`clamp()`) en positie
  (`--ghost-inset`) zijn CSS-variabelen, geen data-attributen.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `parallax` | `false` | Lichte verschuiving bij scrollen (transform, geen layout-eigenschap). |
| `speed` | `0.12` | Parallax-sterkte — fractie van de afstand tot het midden van de viewport. |

CSS-variabelen (op `[data-ghost-text]`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--ghost-size` | `clamp(4rem, 22vw, 13rem)` | Lettergrootte, schaalt met de viewport-breedte. |
| `--ghost-stroke` | `rgba(24,24,27,.14)` | Outline-kleur (`-webkit-text-stroke`). |
| `--ghost-inset` | `auto auto -0.08em -0.02em` | Plaatsing binnen de host (CSS `inset`). |
| `--ghost-shift` | `0px` | Door de JS gezet tijdens parallax — niet zelf zetten. |

## Toegankelijkheid

- **`aria-hidden="true"` is verplicht** — het woord is decoratie, geen
  content; schermlezers slaan het over.
- **`user-select:none` + `pointer-events:none`** — de ghost-tekst onderschept
  geen klikken of tekstselectie van de echte inhoud erboven.
- **Reduced motion**: `parallax` doet niets bij `prefers-reduced-motion:
  reduce` — geen observer, geen scroll-listener wordt zelfs opgezet.
- **Alleen `transform`**: de parallax animeert uitsluitend `transform`
  (geen `top`/`left`), en de scroll-/resize-listeners lopen via
  `requestAnimationFrame` met `passive:true` (R18). De listener stopt zodra
  de sectie buiten beeld is (IntersectionObserver) en start weer zodra hij
  terugkomt.

## Op WordPress

Geen build-stap. Zelfde patroon als de andere features in deze bibliotheek:
CSS + `ghost-text.js` in het thema, `wp_enqueue_style()` +
`wp_enqueue_script_module()`, `init()` per element na `DOMContentLoaded`. Zie
`scroll/reveal-on-scroll/README.md` voor het volledige recept.

## Valkuilen

- **Container zonder `position:relative`** — zonder `[data-ghost-text-host]`
  (of eigen `position:relative` op de sectie) positioneert de ghost-tekst
  zich relatief aan het eerstvolgende gepositioneerde voorouder-element,
  wat op een willekeurige plek kan uitkomen.
- **Lang woord + smalle sectie**: `clamp()` begrenst de schaal, niet de
  breedte van het woord zelf (`white-space:nowrap`) — controleer op mobiel
  of het woord niet buiten de sectie steekt; korte woorden/letters werken
  het beste.
- **Contrast met de voorgrondtekst**: pas `--ghost-stroke`/`--ghost-color`
  aan op de achtergrondkleur van de sectie, anders wordt de outline
  onzichtbaar of juist te dominant.

