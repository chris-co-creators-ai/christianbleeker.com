# parallax

Attribuut-gestuurde parallax: `data-parallax-y`, `-x`, `-rotate`, `-scale` en
`-mouse` op losse elementen, geen wrapper-markup nodig. Elk element beweegt
onafhankelijk, met zijn eigen sterkte, terwijl de bezoeker scrolt — en
optioneel ook terwijl de muis beweegt.

## Wanneer wel

- Decoratieve vormen, badges, kopregels die je een lichte, laagjes-diepte
  willen geven terwijl de bezoeker scrolt door een hero of sectie.
- Een scène waar losse elementen op de muispositie mogen reageren (alleen
  met muis — zie "Wanneer niet").

## Wanneer niet

- Niet voor content die moet stilstaan om leesbaar te blijven (lange
  tekstblokken, formulieren) — parallax is decoratie, geen leeservaring.
- Niet voor de enige manier waarop informatie zichtbaar wordt — alles moet
  ook zonder de beweging (en zonder JS) gewoon op zijn plek staan.

## Installatie

```
component-library/scroll/parallax/
├── parallax-kern.js       # vanilla ES-module, 0 dependencies
├── parallax.css       # will-change-hint, namespaced
├── Parallax.tsx        # React/Next.js client-wrapper
├── demo.html            # zelfstandige demo (scroll + muis-volgen)
└── test/meet.mjs        # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./parallax.css" />
<div class="scene">
  <div data-parallax-y="60" data-parallax-rotate="12"></div>
  <p data-parallax-y="30" data-parallax-scale="0.08">Titel</p>
</div>
<script type="module">
  import { init } from './parallax-kern.js';
  const destroy = init(document.querySelector('.scene'));
</script>
```

**React / Next.js (App Router)**

```tsx
import { Parallax } from '@/component-library/scroll/parallax/Parallax';

<Parallax>
  <div data-parallax-y="60" data-parallax-rotate="12" />
  <p data-parallax-y="30" data-parallax-scale="0.08">Titel</p>
</Parallax>
```

## Markup-contract

- Root: het element dat je aan `init(root)` geeft — de module zoekt
  hierbinnen naar elk element met minstens één `data-parallax-*`-attribuut.
- `data-parallax-y="60"` — verticale reikwijdte in pixels over de hele
  doorloop van het element door de viewport (van net onderin tot net
  bovenuit).
- `data-parallax-x="-30"` — horizontale reikwijdte in pixels, zelfde principe.
- `data-parallax-rotate="12"` — rotatie in graden over dezelfde doorloop.
- `data-parallax-scale="0.08"` — extra schaal (± dit percentage rond 1.0)
  over dezelfde doorloop.
- `data-parallax-mouse="20"` — muis-volg-sterkte in pixels (max. uitwijking
  bij muis in een hoek van het scherm). **Staat uit op touch** (R3) —
  daar is geen aanhoudende muispositie.
- Elk attribuut is optioneel en onafhankelijk combineerbaar; een element
  met alleen `data-parallax-mouse` beweegt dus niet mee met scrollen.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | alle vijf `data-parallax-*`-attributen samen | CSS-selector om de gezochte elementen te vernauwen. |
| `rootMargin` | `"25% 0px 25% 0px"` | IntersectionObserver-marge: hoe ver vóór het in beeld komen de module al begint te rekenen. |

## Toegankelijkheid

- Puur visueel/decoratief: geen tekstinhoud verandert, geen `aria`-status
  nodig.
- `prefers-reduced-motion: reduce`: alle transforms gaan eraf, geen
  listeners actief — reageert live op een halverwege omgezette voorkeur
  (R1).
- Toetsenbordnavigatie is nooit betrokken: parallax is puur `transform`, dus
  focus-volgorde en scroll-via-toetsenbord blijven ongemoeid.

## Op WordPress

Geen build-stap nodig.

**1. Bestanden plaatsen**

```
wp-content/themes/<jouw-thema>/component-library/parallax/
├── parallax.css
└── parallax-kern.js
```

**2. Laden**

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'parallax-style',
		get_stylesheet_directory_uri() . '/component-library/parallax/parallax.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'parallax-module',
		get_stylesheet_directory_uri() . '/component-library/parallax/parallax-kern.js',
		array(),
		null
	);
} );
```

**3. Markup + init**

```html
<div class="hero" data-parallax-scene>
  <div data-parallax-y="60"></div>
</div>
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/parallax/parallax-kern.js';
  document.addEventListener('DOMContentLoaded', () => {
    init(document.querySelector('[data-parallax-scene]'));
  });
</script>
```

**Valkuilen (WordPress)**: Pagebuilders met eigen "motion effects" gebruikt
dezelfde soort `data-`-attributen niet, dus er is geen naamconflict — wel
kan een pagebuilder de elementen in extra wrapper-`<div>`s stoppen; dat is
geen probleem zolang `data-parallax-*` op het uiteindelijke element blijft
staan (querySelectorAll zoekt op elke diepte binnen de root).

## Valkuilen

- **`overflow: hidden` op de scène** is meestal nodig — parallax-elementen
  bewegen buiten hun oorspronkelijke plek, en zonder een begrenzende
  container met `overflow: hidden` kan dat een onverwachte horizontale
  scrollbar geven (zie demo.html `.scene`).
- **Te veel elementen tegelijk** met een hoge sterkte oogt onrustig.
  Richtlijn: 2–5 parallax-elementen per scène, met uiteenlopende sterktes
  voor een gevoel van diepte (niet alles even hard).
- **`data-parallax-mouse` zonder duidelijke scène-grenzen**: de sterkte is
  relatief aan de hele viewport, niet aan de sectie. Op een lange, smalle
  sectie kan het effect daardoor zwakker aanvoelen dan verwacht — geef zulke
  elementen een hogere sterkte, of beperk de sectie tot het zichtbare deel
  van het scherm.

