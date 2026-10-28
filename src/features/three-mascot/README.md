# three-mascot

Een levende 3D-mascotte — standaard een eigen, volledig procedureel
gebouwde bij (geen ingekocht model) — die idle beweegt, licht met de muis
meedraait en met de scroll meedraait. three.js wordt lokaal gevendord en pas
met een dynamic import geladen zodra de mascotte (bijna) in beeld komt.

## Wanneer wel

- Een klein, herkenbaar merk-mascotje in een hero of sectie dat "leeft"
  zonder een zware video of Lottie-animatie te zijn.
- Wanneer je een eigen 3D-identiteit wilt zonder een stockmodel of dure
  3D-artiest — het meegeleverde procedurele model is een vertrekpunt dat je
  vrij mag aanpassen (kleuren, vorm, aantal strepen) in de code zelf.

## Wanneer niet

- Een productconfigurator of iets waar de bezoeker zelf aan het 3D-object
  moet kunnen draaien/inzoomen — dat vraagt om echte controls (`OrbitControls`)
  en een eigen interactie-ontwerp, niet dit component.
- Op een pagina die toch al zwaar leunt op WebGL (bv. een canvas-hero) —
  twee onafhankelijke three.js-renderers op één pagina is dubbel werk voor
  de GPU; hergebruik dan één scene.
- Als de mascotte het enige of belangrijkste conversie-element is: een
  3D-canvas kan altijd uitvallen (contextverlies, geen WebGL) — leun niet op
  hem voor iets cruciaals, hij is decoratie.

## Installatie

```
component-library/effects/three-mascot/
├── three-mascot.js       # vanilla ES-module — 0 dependencies in de kern
├── three-mascot.css      # namespaced op [data-mascot]/[data-mascot-poster]/.tm-
├── ThreeMascot.tsx        # React/Next.js client-wrapper
├── demo.html              # zelfstandige demo
├── vendor/                # lokaal gevendord three.js (zie "Herkomst van de vendor")
│   ├── three.module.min.js
│   ├── GLTFLoader.js       # alleen gebruikt als je zelf `data-model` meegeeft
│   ├── BufferGeometryUtils.js
│   └── THREE-LICENSE
└── test/meet.mjs           # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./three-mascot.css" />
<div data-mascot data-mobiel="poster">
  <img data-mascot-poster src="/mascotte-poster.jpg" alt="" loading="lazy" />
</div>
<script type="module">
  import { init } from './three-mascot.js';
  const destroy = init(document.querySelector('[data-mascot]'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { ThreeMascot } from '@/component-library/effects/three-mascot/ThreeMascot';

<ThreeMascot posterSrc="/mascotte-poster.jpg" posterOnMobile />
```

## Markup-contract

- Root-element (`[data-mascot]`): container met (via CSS) een vaste
  `aspect-ratio` — voorkomt layout-shift zodra het canvas verschijnt (R19).
- Daarbinnen verplicht een `<img data-mascot-poster>`: de afbeelding die
  altijd meteen zichtbaar is (ook zonder JavaScript — R4) en die het
  eindbeeld blijft bij `prefers-reduced-motion: reduce`, zonder WebGL, of op
  mobiel met `data-mobiel="poster"`.
- `data-model="/pad/naar/model.glb"` (optioneel): laadt een eigen GLB in
  plaats van het procedurele standaardmodel. Mislukt het laden (verkeerd
  pad, corrupt bestand), dan blijft het procedurele model gewoon zichtbaar
  (R5 — crasht niet, waarschuwt alleen via `console.warn`).
- `data-mobiel="poster"` (optioneel): toon op touch-apparaten (`isTouch()`)
  altijd de poster — geen 3D, geen download van three.js. Zet dit aan
  wanneer de mascotte puur decoratief is; laat het weg als je 3D ook op
  mobiel wilt (muis-parallax staat dan sowieso uit, scroll-rotatie blijft
  werken).

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `modelUrl` | `root.getAttribute('data-model')` | URL naar een eigen GLB-model. |

CSS-variabelen (op `[data-mascot]`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--tm-aspect` | `1 / 1` | Aspect-ratio van de mascotte-container. |

## Toegankelijkheid

- Het canvas krijgt `aria-hidden="true"` — puur decoratief, schermlezers
  krijgen niets voorgeschoteld dat niet ook al als tekst/beeld elders staat.
  Geef de poster een lege `alt=""` als de mascotte echt alleen decoratie is,
  of een korte beschrijving als hij inhoudelijk relevant is.
- Geen klikbare/interactieve elementen in dit component — er is dus geen
  toetsenbord-scenario nodig (geen focus-trap, geen Tab-stops toegevoegd).
- `prefers-reduced-motion: reduce`: three.js wordt niet eens gedownload, de
  poster blijft het permanente beeld. Zet je de instelling live om terwijl
  de mascotte al draait, dan stopt de renderloop meteen en verschijnt de
  poster (live wissel, net als de andere features in deze bibliotheek).
- Zonder WebGL-ondersteuning (`canvas.getContext('webgl2'/'webgl')` geeft
  niets terug) wordt three.js evenmin gedownload — alleen de poster.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/three-mascot/`
   (inclusief de `vendor/`-map).
2. Enqueue stijl en module:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'three-mascot-style',
		get_stylesheet_directory_uri() . '/component-library/three-mascot/three-mascot.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'three-mascot-module',
		get_stylesheet_directory_uri() . '/component-library/three-mascot/three-mascot.js',
		array(),
		null // bewust geen versie — zie de reveal-on-scroll-README voor waarom
	);
} );
```

3. Plaats de markup (zie "Markup-contract") in een Custom HTML-blok, en roep
   `init()` aan ná `DOMContentLoaded`:

```html
<script type="module">
  import { init } from '/wp-content/themes/<thema>/component-library/three-mascot/three-mascot.js';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mascot]').forEach((el) => init(el));
  });
</script>
```

## Asset-budget

- **GLB via `data-model`: houd hem onder 1,5 MB** (gecomprimeerd, bv. met
  `gltf-transform` of Draco/Meshopt). De module laadt hem pas zodra de
  mascotte in beeld komt, maar een trage 3G-verbinding voelt zelfs dan een
  groot bestand — de poster blijft intussen gewoon zichtbaar (geen
  layout-shift), dus een trage download is nooit een gebroken pagina, alleen
  een langzamer 3D-moment.
- **Het meegeleverde procedurele model kost 0 KB aan assets** — puur
  geometrie/materialen in code, geen download naast three.js zelf.
- **three.js zelf**: `vendor/three.module.min.js` (≈ 672 KB) + optioneel
  `GLTFLoader.js`/`BufferGeometryUtils.js` (≈ 140 KB samen, alléén gedownload
  als je `data-model` gebruikt) — beide pas na lazy-load, nooit vóór de
  mascotte in beeld is.

## Valkuilen

- **Een vers `<canvas>` heeft geen inhoud tot de eerste render.** De module
  toont daarom de poster tot het canvas klaar is, en pas ná de eerste
  succesvolle `buildGL()` wisselt hij zichtbaarheid — zo is er nooit een
  leeg/zwart canvas-moment.
- **`preserveDrawingBuffer: true` staat aan** op de `WebGLRenderer` — nodig
  om de canvas-inhoud te kunnen uitlezen (screenshots, testen). Kost een
  kleine performance-marge; verwijder deze optie als je zeker weet dat je
  nooit `canvas.toDataURL()`/`readPixels` nodig hebt.
- **Contextverlies** (`webglcontextlost`, bv. bij een GPU-crash of te veel
  open WebGL-contexten) wordt opgevangen: de renderloop stopt en bij
  `webglcontextrestored` wordt het procedurele model opnieuw opgebouwd. Een
  zelf geladen GLB (via `data-model`) wordt bij herstel **niet** opnieuw
  ingeladen — dat zou een extra netwerkverzoek vergen; je krijgt dan het
  procedurele model terug. Wil je dat anders, vang `webglcontextrestored`
  zelf af en roep `init()` opnieuw aan.
- **`isTouch()` schakelt alléén de muis-parallax uit**, niet de
  scroll-rotatie — dat is bewust (R3: muis-effecten krijgen een
  alternatief, maar scroll werkt op touch ook prima). Wil je op mobiel
  helemaal geen 3D, zet dan `data-mobiel="poster"`.
- **Bare-specifier `'three'` bestaat niet in de browser.** `GLTFLoader.js`
  en `BufferGeometryUtils.js` importeren in de npm-package `from 'three'` —
  dat werkt alleen met een bundler of import-map. In `vendor/` zijn beide
  bestanden aangepast naar een relatief pad (`from './three.module.min.js'`)
  zodat ze als kale ES-modules in de browser laden. Vervang je de vendor-
  bestanden door een nieuwere versie, pas die twee import-regels opnieuw aan.

