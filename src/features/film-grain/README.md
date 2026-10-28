# film-grain

Bewegende filmkorrel over de hele pagina. De ruis wordt zelf getekend op
een canvas (willekeurige grijswaarde + alpha per pixel) en als data-URL
gebruikt als tegelend achtergrondbeeld — er is geen los png-bestand nodig.
De laag is groter dan de viewport (130%) en beweegt met een lage framerate via `transform: translate()`
binnen die marge, zodat er nooit een rand zichtbaar wordt en er alleen met
`transform`/`opacity` geanimeerd wordt (R18).

## Wanneer wel

- Fotografie, video of donkere hero-secties die een filmische, tactiele
  textuur mogen krijgen.
- Merken die bewust "analoog"/"gefilmd" aanvoelen in plaats van glad-digitaal.

## Wanneer niet

- Tekstzware pagina's waar leesbaarheid voorop staat — een zichtbare korrel
  over lopende tekst is vermoeiend. Gebruik een lage `sterkte` (of helemaal
  niet) op contentpagina's.
- Sites die al zwaar leunen op andere achtergrondanimaties — twee bewegende
  lagen tegelijk oogt al snel onrustig.

## Installatie

```
component-library/effects/film-grain/
├── film-grain.js      # vanilla ES-module, 0 dependencies
├── film-grain.css     # namespaced op .fg-laag (eigen prefix)
├── FilmGrain.tsx       # React/Next.js client-wrapper
├── demo.html            # zelfstandige demo
└── test/meet.mjs        # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./film-grain.css" />

<script type="module">
  import { init } from './film-grain.js';
  const destroy = init(document.body);
  // destroy() bij opruimen (idempotent)
</script>
```

`root` (hier `document.body`) is alleen een mount-point: de module voegt er
zelf één `<div class="fg-laag">` aan toe en raakt verder niets van `root`
aan.

**React / Next.js (App Router)**

```tsx
import { FilmGrain } from '@/component-library/effects/film-grain/FilmGrain';

// Eén keer, hoog in de boom (bv. root-layout):
<FilmGrain sterkte={0.05} />
```

## Markup-contract

- `root`: elk element, meestal `document.body`. Geen vereiste inhoud —
  de module bouwt zijn eigen laag en voegt die toe als laatste kind.
- De toegevoegde laag (`.fg-laag`) heeft `pointer-events: none` en
  `aria-hidden="true"`: hij onderschept nooit klikken of toetsaanslagen,
  en is voor schermlezers onzichtbaar.

## Opties (`init(root, opties)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `sterkte` | `0.05` | Zichtbaarheid van de korrel (0..1) — wordt de CSS-opacity van de laag. |
| `fps` | `12` | Aantal wisselingen per seconde. Laag houden voor een filmisch (niet glad-digitaal) effect. |
| `tegelGrootte` | `200` | Breedte/hoogte in pixels van de gegenereerde ruistegel. |

CSS-variabelen (worden door de module zelf gezet op `.fg-laag`, maar zijn
ook los te overriden):

| Variabele | Omschrijving |
|---|---|
| `--fg-sterkte` | Opacity van de laag (zie optie `sterkte`). |
| `--fg-tegel` | `background-size` van de tegel (zie optie `tegelGrootte`). |

## Toegankelijkheid

- `pointer-events: none` + `aria-hidden="true"`: de laag is voor niemand
  interactief of voorleesbaar, dus er is niets om per ongeluk te "vangen".
- `prefers-reduced-motion: reduce`: de animatielus start niet — de laag
  blijft staan als **statische** textuur (geen beweging), in plaats van
  volledig te verdwijnen. Zet `sterkte: 0` als je liever hebt dat hij ook
  bij reduced-motion onzichtbaar is.
- Reageert live op een wissel van de voorkeur halverwege een sessie (R1):
  zet de bezoeker "minder beweging" aan terwijl de pagina open staat, dan
  stopt de laag meteen; zet hij het weer uit, dan hervat de beweging.

## Performance

- **Alleen `transform`** animeert (percentage-transform op de laag zelf),
  nooit `background-position` — dat laatste zou een repaint per frame
  kosten in plaats van alleen een compositor-verschuiving.
- **Framerate-gate**: de `requestAnimationFrame`-lus rekent elk frame,
  maar past het `transform` alleen aan als er `1000/fps` ms verstreken
  zijn sinds de vorige wissel — geen 60 wissels per seconde voor een
  effect dat er met 12 al filmisch uitziet.
- **Pauzeert bij `document.hidden`** (tabblad op de achtergrond, ander
  venster ervoor): de `requestAnimationFrame`-lus wordt volledig gestopt,
  niet alleen "onzichtbaar doorgerekend".
- **Eén canvas-tekening, bij `init()`**: de ruistegel wordt één keer
  gegenereerd en als data-URL hergebruikt; er wordt nooit per frame
  opnieuw getekend.

## Op WordPress

Geen build-stap nodig.

```
wp-content/themes/<jouw-thema>/component-library/film-grain/
├── film-grain.css
└── film-grain.js
```

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'film-grain-style',
		get_stylesheet_directory_uri() . '/component-library/film-grain/film-grain.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'film-grain-module',
		get_stylesheet_directory_uri() . '/component-library/film-grain/film-grain.js',
		array(),
		null
	);
} );
```

```html
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/film-grain/film-grain.js';
  document.addEventListener('DOMContentLoaded', () => {
    init(document.body);
  });
</script>
```

## Valkuilen

- **Een getransformeerde/`perspective`-voorziene voorouder van `root`**
  verandert het containing block van `position: fixed`-elementen: de laag
  dekt dan niet meer de hele viewport, maar het gebied van die voorouder.
  Zet `root` (of in elk geval een van zijn voorouders tot en met `<body>`)
  vrij van `transform`/`perspective`/`filter` als de laag de volle
  viewport moet blijven dekken.
- **Sepia/kleur-tint toevoegen**: deze module tekent alleen grijswaarde-
  ruis. Wil je een kleur, zet die met een CSS-`filter` of achtergrondkleur
  achter de laag — de canvas-ruis zelf blijft neutraal.
- **Meerdere instanties**: elke `init()`-aanroep tekent zijn eigen tegel en
  voegt zijn eigen laag toe; dat werkt, maar twee lagen tegelijk verdubbelt
  de zichtbare korrel. Roep `destroy()` van de vorige instantie aan vóór
  je een nieuwe start.

