# device-mockup

Laptop- en telefoonframes in **pure CSS** (geen framebeelden — alleen
`border-radius`, gradients en schaduwen) met een screenshot erin. Is de
screenshot een volledige, lange paginafoto, dan scrollt hij bij hover of
focus rustig van boven naar onder.

## Wanneer wel

- Een portfolio-/case-sectie die een website in context toont (desktop +
  mobiel) zonder een los, plat screenshot te plakken.
- Wanneer de screenshot een hele pagina is (langer dan het zichtbare
  schermvlak) en je zonder los klikken toch de rest wilt laten zien.

## Wanneer niet

- Een losse productfoto of icoon zonder "dit is een website/app"-context —
  dan is een gewone `<img>` duidelijker en lichter.
- Interactieve device-previews (bv. een live iframe van de site) — dit
  component toont een **statische afbeelding**, geen werkende site.

## Installatie

```
component-library/portfolio/device-mockup/
├── device-mockup.js      # vanilla ES-module, 0 dependencies
├── device-mockup.css     # namespaced op [data-device]/[data-device-screen]/.dm-
├── DeviceMockup.tsx       # React/Next.js client-wrapper
├── demo.html              # zelfstandige demo
└── test/meet.mjs          # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./device-mockup.css" />
<div id="portfolio">
  <figure data-device="laptop">
    <div class="dm-frame" tabindex="0" role="group" aria-label="Homepage van de website, desktopweergave">
      <div class="dm-screen" data-device-screen>
        <img src="/homepage-desktop.jpg" alt="Homepage van de website, desktopweergave" loading="lazy" />
      </div>
      <div class="dm-base" aria-hidden="true"></div>
    </div>
    <figcaption class="dm-caption">Homepage — desktop</figcaption>
  </figure>
</div>
<script type="module">
  import { init } from './device-mockup.js';
  const destroy = init(document.querySelector('#portfolio'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { DeviceMockup } from '@/component-library/portfolio/device-mockup/DeviceMockup';

<DeviceMockup device="laptop" src="/homepage-desktop.jpg" alt="Homepage, desktopweergave" caption="Homepage — desktop" />
<DeviceMockup device="phone" src="/homepage-mobiel.jpg" alt="Homepage, mobiele weergave" caption="Homepage — mobiel" />
```

## Markup-contract

- `<figure data-device="laptop">` of `<figure data-device="phone">` — de
  root van één frame (`init()` herkent dit element zelf al als "een
  toestel", of vind je meerdere frames binnen een container, dan initialiseer
  je die container in één keer — zie "Installatie").
- Daarbinnen `.dm-frame` met `tabindex="0"` — het element dat op focus (met
  het toetsenbord) het scroll-effect triggert, en dat de zichtbare
  focus-outline krijgt (R14, minimaal 2px). Geef het ook `role="group"` en
  een `aria-label` (dezelfde tekst als de `<img>`-alt volstaat) — zonder rol
  of label kondigt een schermlezer een focusbaar element zonder naam aan.
- `.dm-screen` met `data-device-screen`, met daarin de `<img>` — vaste
  `aspect-ratio` (16:10 voor laptop, 9:19.5 voor phone) komt uit de CSS, dus
  geen layout-shift zodra de afbeelding laadt (R19). Geef de `<img>` altijd
  `loading="lazy"`.
- Optioneel `.dm-base` (laptop, het onderstel/toetsenbordvlak) en
  `.dm-notch`/`.dm-sidebtn--*` (phone, de notch en zij-knopjes) — puur
  decoratief, `aria-hidden="true"`.
- `<figcaption>` (aanbevolen binnen `.dm-caption`) voor het bijschrift.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `"[data-device]"` | CSS-selector voor de frames binnen `root` (genegeerd als `root` zelf al een `[data-device]`-element is). |

CSS-variabelen (op `[data-device]`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--dm-focus` | `#2f6fed` | Kleur van de focus-outline. |

`--dm-scroll-distance` en `--dm-duration` worden door de module zelf gezet
op `[data-device-screen]` (afgeleid van de echte beeldverhouding) — niet
handmatig instellen.

## Toegankelijkheid

- `.dm-frame` is met Tab te bereiken en toont een zichtbare
  `:focus-visible`-outline (minimaal 2px, R14).
- Het scroll-effect triggert op `:focus-visible` — bewust niet op `:focus`:
  een tik op een `tabindex="0"`-element focust het op sommige
  touch-browsers óók, en die focus verdwijnt niet vanzelf bij een volgende
  tik. `:focus-visible` matcht alleen bij "echte" (doorgaans
  toetsenbord-)focus, dus die ambiguïteit speelt niet.
- **Touch krijgt een los alternatief** (R3): muis-only is `:hover`, apart
  gehouden achter `@media (hover: hover) and (pointer: fine)` — op touch telt
  dat niet mee. In plaats daarvan zet een tik op het frame (`isTouch()`) de
  klasse `.dm-is-active`, die hetzelfde scroll-effect aanzet; een tweede tik
  zet hem weer uit.
- `prefers-reduced-motion: reduce`: geen enkele transform-wijziging, ooit —
  de screenshot blijft op zijn bovenkant staan, hover/focus/tap doen niets.
  Dit is een pure CSS-`@media`-regel, dus een live wissel van de instelling
  werkt vanzelf, zonder dat de module ervan hoeft te weten.
- Decoratieve onderdelen (`.dm-base`, `.dm-notch`, `.dm-sidebtn--*`) hebben
  `aria-hidden="true"`.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/device-mockup/`.
2. Enqueue stijl en module:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'device-mockup-style',
		get_stylesheet_directory_uri() . '/component-library/device-mockup/device-mockup.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'device-mockup-module',
		get_stylesheet_directory_uri() . '/component-library/device-mockup/device-mockup.js',
		array(),
		null // bewust geen versie — zie de reveal-on-scroll-README voor waarom
	);
} );
```

3. Plaats de markup (zie "Markup-contract") in een Custom HTML-blok, en roep
   `init()` aan ná `DOMContentLoaded`:

```html
<script type="module">
  import { init } from '/wp-content/themes/<thema>/component-library/device-mockup/device-mockup.js';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-device]').forEach((el) => init(el));
  });
</script>
```

## Valkuilen

- **CSS-transition-reversal.** Onderbreek je het scroll-effect halverwege
  (muis weg, focus weg, nog een tik), dan keert hij niet in de volle
  `--dm-duration` terug, maar proportioneel sneller — hoe minder ver hij kwam,
  hoe sneller de terugweg. Dat is bewust standaardgedrag van CSS-transities
  (CSS Transitions Level 2, "reversing"): het geeft een constante,
  natuurlijke snelheid in beide richtingen in plaats van een trage terugweg
  na een korte hover. Test dit dus nooit op een exacte eindwaarde vlak na het
  wegnemen van hover/focus/tap — geef het dezelfde tijd die de heenweg ook
  nodig had.
- **`:hover` en touch bijten elkaar.** Zie "Toegankelijkheid" — daarom staat
  de `:hover`-regel achter een eigen `(hover: hover) and (pointer: fine)`.
  Kopieer je dit patroon naar een eigen component, vergeet die media-query
  niet: zonder haar kan een tik op touch een tegenstrijdige, "plakkende"
  hover-status achterlaten naast de expliciete tap-toggle.
- **Een lange screenshot heeft écht `loading="lazy"` nodig** — dit zijn vaak
  de zwaarste afbeeldingen op een portfoliopagina (een volledige pagina in
  één beeld).
- **`--dm-scroll-distance` is 0 tot de afbeelding geladen is** (de module
  wacht op `load` als het beeld nog niet compleet is) — vóór dat moment doet
  hover/focus/tap dus nog niets; dat is bedoeld gedrag, geen bug.

## Herkomst

Eigen ontwerp, geïnspireerd door het algemene "device mockup met scroll-preview"-patroon dat op portfoliosites
veel voorkomt. De aandacht voor een natuurlijke, onderbreekbare beweging is dezelfde motion-taal als
`media/flip-lightbox` in de bibliotheek. (Herkomst ingekort voor deze openbare repo.)
