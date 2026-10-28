# punt-zoom-intro

Fullscreen intro in merkkleur met een inline SVG-logo. Na een korte pauze
zoomt het logo in op één gemarkeerd deel (`data-zoom-target`, bijvoorbeeld
een punt of een letter) — dat deel wordt tegelijk een rond gat in de
overlay (SVG-mask) dat groeit tot de hele viewport bedekt is, waardoor de
site zichtbaar wordt. Eén matrix-transform op het logo en één cirkelradius,
in dezelfde animatieframe-lus, met `easeInOutCubic`.

## Wanneer wel

- Een merk met een herkenbaar, klein detail in het logo (een punt, een
  losse letter, een icoon) dat zich leent als "vertrekpunt" van de site.
- Een homepage waar één keer per sessie een kort, opvallend merkmoment
  gewenst is — géén contentpagina's, géén herhaling per paginabezoek.

## Wanneer niet

- Logo's zonder een duidelijk geïsoleerd detail om op te zoomen — gebruik
  dan `effects/logo-loader` (eenvoudige fade/scale, geen maskertruc nodig).
- Sites waar de eerste seconde keihard telt (bijv. een winkelwagen-flow):
  de intro voegt altijd nog een korte pauze toe vóór de site bruikbaar is,
  ook al is die begrensd op 2,5s.
- Meer dan 1x per sessie tonen — dat is opdringerig (R12) en deze module
  staat dat ook niet toe.

## Installatie

```
component-library/effects/punt-zoom-intro/
├── punt-zoom-intro.js      # vanilla ES-module, 0 dependencies
├── punt-zoom-intro.css     # namespaced op [data-punt-zoom-intro] / .pzi-*
├── PuntZoomIntro.tsx       # React/Next.js client-wrapper
├── demo.html               # zelfstandige demo
└── test/meet.mjs           # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./punt-zoom-intro.css" />

<div data-punt-zoom-intro aria-hidden="true">
  <div class="pzi-logo-wrap">
    <svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="56" font-family="Georgia, serif" font-size="52" fill="currentColor">Wester</text>
      <circle data-zoom-target cx="300" cy="60" r="9" fill="currentColor" />
    </svg>
  </div>
</div>

<script type="module">
  import { init } from './punt-zoom-intro.js';
  const destroy = init(document.querySelector('[data-punt-zoom-intro]'));
  // destroy() bij unmount / handmatig opruimen (idempotent)
</script>
```

Zet deze markup zo vroeg mogelijk in `<body>`, vóór de rest van de pagina.

**React / Next.js (App Router)**

```tsx
import { PuntZoomIntro } from '@/component-library/effects/punt-zoom-intro/PuntZoomIntro';

<PuntZoomIntro>
  <div className="pzi-logo-wrap">
    <svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="56" fontFamily="Georgia, serif" fontSize="52" fill="currentColor">Wester</text>
      <circle data-zoom-target cx="300" cy="60" r="9" fill="currentColor" />
    </svg>
  </div>
</PuntZoomIntro>
```

## Markup-contract

- Root-element: krijgt `data-punt-zoom-intro` (of gebruik `<PuntZoomIntro>`,
  die zet dat attribuut zelf). `init()` verwijdert `root` **nooit** uit de
  DOM — hij verbergt hem met `[hidden]`. Veilig voor React-children.
- Verplicht binnen root: `.pzi-logo-wrap` → daarbinnen precies één `<svg>`
  → daarbinnen precies één element met `[data-zoom-target]` (een `<circle>`,
  `<path>`, of elk ander SVG-vorm-element met een `getBBox()`). Ontbreekt
  één van deze drie, dan verbergt de module zichzelf meteen met een
  `console.warn` — geen crash (R5).
- Kleur van het logo: gebruik `fill="currentColor"` in je SVG-paden: de
  overlay zet zelf `color: var(--pzi-logo-kleur)`. Wil je een eigen kleur
  per pad, override dat gewoon zelf.
- De module bouwt zelf een `<svg class="pzi-mask-svg">` (het SVG-masker) en
  voegt die toe/verwijdert die — dat element hoef je niet zelf te schrijven.

## Opties (`init(root, opties)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `startVertraging` | `500` | Pauze in ms vóór de zoom start (logo staat eerst stil). |
| `duur` | `1200` | Duur van de zoom-animatie in ms. |
| `extraRadius` | `200` | Extra pixels bovenop de minimale radius die de hele viewport dekt. |
| `sleutel` | `"punt-zoom-intro"` | Sleutel voor de frequentiegrens — 1x per sessie. Geef een eigen sleutel op als je meerdere intro's op één domein gebruikt. |
| `faalveiligMs` | `2500` | Absolute grens: hierna is de overlay hoe dan ook weg (R2/R12), ongeacht wat er misging. |

CSS-variabelen (op `[data-punt-zoom-intro]`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--pzi-kleur` | `#141821` | Achtergrondkleur van de overlay (en van het masker-vlak). |
| `--pzi-logo-kleur` | `#f8f4ef` | `color` op de root — gebruik `currentColor` in je SVG-paden om deze te volgen. |
| `--pzi-logo-breedte` | `min(300px, 72vw)` | Breedte van het logo vóór de zoom start. |

## Toegankelijkheid

- Root krijgt `aria-hidden="true"`: puur decoratief, geen tekst die een
  schermlezer moet voorlezen (R15) — de echte inhoud van de site staat
  eronder en is normaal in de DOM aanwezig.
- **Overslaan werkt altijd**, ook zonder muis: een `keydown`-listener op
  het hele document (niet alleen op de overlay) sluit de intro bij élke
  toetsaanslag, dus ook bij Tab of Escape. Een klik ergens op de overlay
  doet hetzelfde.
- Geen `inert`-attribuut op de root: dat zou in sommige browsers ook
  klikken onderdrukken. In plaats daarvan blijft de overlay simpelweg vrij
  van focusbare elementen (een `<svg>` is standaard niet in de taborde),
  dus er valt niets "gevangen" te raken.
- `prefers-reduced-motion: reduce`: de overlay verschijnt helemaal niet
  (CSS `display:none !important` als vangnet, JS verbergt hem ook meteen
  bij `init()`) — geen flits, geen zoom, direct een bruikbare site.

## Op WordPress

Geen build-stap nodig.

**1. Bestanden plaatsen** in je thema:

```
wp-content/themes/<jouw-thema>/component-library/punt-zoom-intro/
├── punt-zoom-intro.css
└── punt-zoom-intro.js
```

**2. Laden als ES-module** (WordPress ≥ 6.5):

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'punt-zoom-intro-style',
		get_stylesheet_directory_uri() . '/component-library/punt-zoom-intro/punt-zoom-intro.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'punt-zoom-intro-module',
		get_stylesheet_directory_uri() . '/component-library/punt-zoom-intro/punt-zoom-intro.js',
		array(),
		null // geen ?ver= — zie reveal-on-scroll README voor waarom
	);
} );
```

**3. Markup** in `header.php`, direct na de openende `<body>`-tag, vóór de
rest van de pagina — anders is er even een flits van onopgemaakte inhoud
voordat de overlay verschijnt.

**4. `init()` aanroepen** ná `DOMContentLoaded`, zelfde patroon als
`reveal-on-scroll` (zie die README voor het volledige voorbeeld).

## Valkuilen

- **Meerdere `[data-zoom-target]`-elementen** in dezelfde svg: de module
  gebruikt `querySelector` en pakt dus alleen de eerste. Zet het attribuut
  op precies één element.
- **`.pzi-logo-wrap` met eigen `transform`/`position` in je eigen CSS**
  botst met de matrix-transform die de module zet — laat die twee eigen-
  schappen op dat element met rust.
- **Logo met een `viewBox` die niet klopt met de zichtbare inhoud** (bv.
  een SVG geëxporteerd met te veel witruimte): de module rekent de positie
  van het doel-element om via `viewBox`/`getBBox()`, dus een kloppende
  viewBox is nodig voor een precieze landing van het gat op het doel.
- **`getBBox()` bestaat niet in elke render-omgeving** (bv. sommige
  server-side SVG-renderers tijdens SSR) — dit is de reden dat `init()`
  alleen in de browser draait (`useEffect`), nooit tijdens SSR.
- **Meerdere intro's op dezelfde pagina** werken, maar delen standaard
  dezelfde `sleutel` ("punt-zoom-intro") in de frequentiegrens — geef elke
  instantie een eigen `sleutel` als je dat niet wilt.

## Performance

Alleen `transform` (matrix) op het logo en een SVG-`r`/`cx`/`cy`-attribuut
op de maskercirkel, in één `requestAnimationFrame`-lus — geen lay-out-
thrashing. De meting (`getBoundingClientRect`/`getBBox`) gebeurt eenmalig,
twee animatieframes na het laden, zodat CSS en viewBox al gestabiliseerd
zijn.

