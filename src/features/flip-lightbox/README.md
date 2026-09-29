# flip-lightbox

Foto- en videotegels die bij klikken met een FLIP-animatie (First → Last →
Invert → Play) vloeiend opengaan naar een `<dialog>` op volledig scherm —
vanaf de exacte plek en grootte van de tegel — en op dezelfde manier weer
teruglopen naar de tegel bij het sluiten. Werkt ook als galerij: vorige/
volgende-knoppen, swipe, pijltjestoetsen en een teller ("3 / 12").

## Wanneer wel

- Een foto- of videogalerij (portfolio, "in de kwekerij", productfoto's,
  social-recap) waar je een groot, rustig aandachtspunt wilt zonder de
  pagina te verlaten.
- Wanneer je de precieze plek van de tegel wilt laten "meebewegen" naar het
  grote beeld — dat geeft de gebruiker een ruimtelijk verband tussen tegel
  en volledig scherm dat een gewone fade-in mist.

## Wanneer niet

- Eén enkele hero-afbeelding zonder galerij-behoefte: dan volstaat een
  simpele `<img>` of `<a href>` naar de volledige foto.
- Tientallen tegels op één pagina die allemaal tegelijk swipe-baar moeten
  zijn met zware full-res beelden: laad dat in kleinere batches, deze module
  laadt de volledige bron pas bij het openen maar bouwt geen paginering.

## Installatie

```
component-library/media/flip-lightbox/
├── flip-lightbox.js      # vanilla ES-module, 0 dependencies
├── flip-lightbox.css     # namespaced op [data-lightbox] en .flb-
├── FlipLightbox.tsx      # React/Next.js client-wrapper
├── demo.html              # zelfstandige demo
└── test/meet.mjs          # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./flip-lightbox.css" />
<div id="galerij">
  <a data-lightbox href="/foto-1-groot.jpg" data-caption="Het atelier">
    <img src="/foto-1-klein.jpg" alt="Het atelier" width="480" height="360" loading="lazy" />
  </a>
  <!-- … meer tegels … -->
</div>
<script type="module">
  import { init } from './flip-lightbox.js';
  const destroy = init(document.querySelector('#galerij'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { FlipLightbox } from '@/component-library/media/flip-lightbox/FlipLightbox';

<FlipLightbox className="galerij-grid">
  <a data-lightbox href="/foto-1-groot.jpg" data-caption="Het atelier">
    <img src="/foto-1-klein.jpg" alt="Het atelier" width={480} height={360} loading="lazy" />
  </a>
</FlipLightbox>
```

## Markup-contract

- Root-element: het element dat je aan `init(root)` geeft (de container met
  alle tegels van één galerij).
- Tegel: een `<a data-lightbox href="…">` — de `href` wijst **rechtstreeks
  naar de volledige bron** (foto of video). Dat is meteen ook de
  no-JS-fallback (zie R4 hieronder): zonder JavaScript is het gewoon een
  link die naar de eigen afbeelding/video navigeert.
  - `data-type="image"` (standaard) of `data-type="video"`.
  - `data-full-srcset` (optioneel, alleen beeld): responsive `srcset` voor
    de volledige afbeelding, bv. `"foto-1600.jpg 1600w, foto-960.jpg 960w"`.
  - `data-poster` (optioneel, alleen video): posterafbeelding.
  - `data-caption` (optioneel): bijschrift, getoond onder de teller.
  - `data-alt` (optioneel, alleen beeld): expliciet alt-text voor de grote
    afbeelding; valt anders terug op `data-caption`.
- Binnen de tegel hoort een kleine, meteen geladen `<img>` als thumbnail
  (`loading="lazy"`, eigen `width`/`height` om layout-shift te voorkomen —
  R19). De **volledige** bron (foto in groot formaat, of de video) wordt pas
  aangemaakt en geladen zodra de tegel echt geopend wordt (R17).
- Alle tegels binnen `root` vormen samen één galerij (volgorde = DOM-volgorde)
  — navigeren met vorige/volgende/pijltjes/swipe loopt door die hele set,
  rondlopend (na de laatste weer naar de eerste).

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `"[data-lightbox]"` | CSS-selector voor de tegels binnen `root`. |

CSS-variabelen (op `.flb-dialog`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--flb-duration` | `0.42s` | Duur van de FLIP-transitie. |
| `--flb-ease` | `cubic-bezier(.22,1,.36,1)` | Easing (ease-out-quint, zoals bij kwekerijomejoop.nl). |
| `--flb-bg` | `#101012` | Achtergrond van de dialoog. |
| `--flb-fg` | `#f5f4ef` | Tekst-/iconkleur. |

## Toegankelijkheid

- `<dialog>` met `showModal()`; sluiten via de sluitknop, Escape, of klikken
  op de backdrop (buiten de stage).
- **Focus-trap**: Tab/Shift+Tab blijven binnen de dialoog (sluiten/vorige/
  volgende/eventuele video-controls) zolang hij open is; bij openen krijgt
  de sluitknop focus, bij sluiten gaat de focus terug naar de tegel die de
  dialoog opende (of naar de tegel die op dat moment getoond werd, als je
  intussen had genavigeerd).
- Iconen in de knoppen zijn `aria-hidden`; de knoppen zelf hebben een
  `aria-label` ("Sluiten", "Vorige", "Volgende").
- De teller ("3 / 4") en het bijschrift staan als gewone tekst in de DOM —
  geen `aria-live`-geroezemoes, maar ook niets dat een schermlezer mist.
- Contrast: de knoppen en de teller staan op een halfdoorzichtige donkere
  cirkel/pil zodat ze ook op een lichte foto minimaal 4,5:1 contrast houden
  (R16) — niet afhankelijk van de onderliggende afbeelding.
- `prefers-reduced-motion: reduce`: geen FLIP-transitie, geen fade bij
  navigeren — het beeld staat direct op zijn eindpositie/-grootte.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/flip-lightbox/`.
2. Enqueue stijl en module:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'flip-lightbox-style',
		get_stylesheet_directory_uri() . '/component-library/flip-lightbox/flip-lightbox.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'flip-lightbox-module',
		get_stylesheet_directory_uri() . '/component-library/flip-lightbox/flip-lightbox.js',
		array(),
		null // bewust geen versie — zie de reveal-on-scroll-README voor waarom
	);
} );
```

3. Plaats de galerij-markup (zie "Markup-contract") in een Custom HTML-blok
   of template, en roep `init()` aan ná `DOMContentLoaded`:

```html
<script type="module">
  import { init } from '/wp-content/themes/<thema>/component-library/flip-lightbox/flip-lightbox.js';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.galerij').forEach((el) => init(el));
  });
</script>
```

## Valkuilen

- **Een vers `<img>`/`<video>` heeft nog geen grootte.** Meteen na het
  aanmaken is een nieuw media-element 0×0 tot het geladen is (`load` /
  `loadedmetadata`). De module wacht daarom intern op dat moment vóórdat hij
  de FLIP-transform berekent — reken je dit zelf na met eigen code, vergeet
  deze stap niet: zonder wachten meet je een leeg (0×0) eindrect en verschijnt
  het beeld zonder animatie.
- **Geef de thumbnail altijd `width`/`height` of `aspect-ratio`.** Zonder
  vaste afmeting springt de rest van de galerij-grid op zodra de kleine
  afbeelding laadt (R19).
- **Media-bestandsgrootte van de volledige bron.** Deze module regelt alléén
  *wanneer* geladen wordt (bij openen), niet de compressie zelf — lever de
  bron in `data-full-srcset` in een paar breedtes aan als de foto's groot
  zijn.
- **Eén `<dialog>` per `init()`-aanroep.** Meerdere galerijen op één pagina
  betekent meerdere `init()`-aanroepen (één per root) — elke root krijgt zijn
  eigen dialoog en teller, ze delen geen state.

## Herkomst

FLIP-video-lightbox gezien bij kwekerijomejoop.nl (Webstijn,
`research/webstijn/portfolio/kwekerijomejoop/DOSSIER.md`, feature 3 —
`code/js_ab13ac93.js` e.a.): `getBoundingClientRect()` voor de start-transform
en `cubic-bezier(.22,1,.36,1)` als easing zijn als vertrekpunt genomen. Eigen
implementatie, geen code overgenomen. Wat wij toevoegden dat kwekerijomejoop
niet had: een echte galerij (vorige/volgende, swipe, pijltjestoetsen, teller),
een toetsenbord-focus-trap, lazy-loading van de volledige bron, en het
wachten op `load`/`loadedmetadata` vóór de FLIP start (zie "Valkuilen").
