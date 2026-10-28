# vel-menu

Een menu dat opent als een vel. Eerst rekt een smalle lijn uit vanuit de hoek van de hamburgerknop, daarna vouwt die lijn open tot een heel vel. Dan komen het paneel met links, de losse links en het adres één voor één binnen. Het logo blijft leesbaar: in het menu krijgt het de menukleur. Sluiten speelt de reeks korter terug.

Gebouwd op `<dialog>`. De browser regelt de modaliteit (de rest van de pagina is inert) en Esc. De scrollslot zit in de CSS. Zonder JS opent de knop het menu ook, via een invoker-commando (`commandfor`).

## Wanneer wel

- Het mobiele hoofdmenu van een site met 5 tot 12 links, eventueel gegroepeerd.
- Ook op desktop als zijvel rechts, voor sites die bewust alleen een menuknop tonen.

## Wanneer niet

- Voor een menu met afbeeldingen per link: `navigation/image-menu`.
- Als het menu van de zijkant moet komen met een flip: `navigation/flip-side-menu`.
- Alleen het icoon dat naar een kruis morft is `navigation/morph-hamburger`. Dit menu gebruikt diens CSS voor de knoppen, maar werkt ook met elke andere knop.

## Installatie

**Vanilla**

```html
<link rel="stylesheet" href="../morph-hamburger/morph-hamburger.css" /> <!-- optioneel: het icoon -->
<link rel="stylesheet" href="./vel-menu.css" />
<script type="module">
  import { init } from './vel-menu.js';
  init(document.getElementById('hoofdmenu'));
</script>
```

**React / Next.js**

```tsx
import { VelMenu } from '@/component-library/navigation/vel-menu/VelMenu';

<header>
  <a href="/" data-vel-merk>Studio Wester</a>
  <button aria-label="Menu openen" aria-controls="hoofdmenu" commandfor="hoofdmenu" command="show-modal">☰</button>
</header>
<VelMenu id="hoofdmenu" label="Hoofdmenu" logo={<a href="/">Studio Wester</a>}>
  <ul data-vel-stap>…</ul>
  <address data-vel-stap>…</address>
</VelMenu>
```

**WordPress**

1. Zet `vel-menu.js`, `.css` en `_kwaliteit/basis.js` in je thema, met dezelfde onderlinge plek.
2. `wp_enqueue_style` en `wp_enqueue_script_module()` (WP 6.5+).
3. Zet de knop in `header.php` en de `<dialog>` direct erna. De links kun je met `wp_nav_menu(['container' => false, 'items_wrap' => '<ul data-vel-stap>%3$s</ul>'])` laten genereren.
4. Roep `init()` aan in een klein moduleblok in `wp_footer`.

## Markup-contract

```html
<header>
  <a href="/" data-vel-merk>Studio Wester</a>                 <!-- het logo in de paginakop -->
  <button aria-label="Menu openen" aria-controls="hoofdmenu"
          commandfor="hoofdmenu" command="show-modal">…</button>
</header>

<dialog id="hoofdmenu" data-vel aria-label="Hoofdmenu">
  <div data-vel-vel aria-hidden="true"></div>               <!-- het vel dat schaalt -->
  <a href="/" data-vel-logo>Studio Wester</a>               <!-- komt op de pixel van data-vel-merk -->
  <button data-vel-sluit aria-label="Menu sluiten"
          commandfor="hoofdmenu" command="close">…</button> <!-- komt op de pixel van de openknop -->
  <nav data-vel-inhoud aria-label="Hoofdmenu">
    <div data-vel-stap>…</div>                              <!-- elk blok komt apart binnen -->
    <ul data-vel-stap>…</ul>
    <address data-vel-stap>…</address>
  </nav>
</dialog>
```

Door de JS gezet: `aria-expanded` (en `aria-haspopup="dialog"`) op de openknop, `data-mh-open` op de sluitknop (het kruis van morph-hamburger), `--vel-knop-*` en `--vel-merk-*` op de dialog, en `data-vel-logo-naast` als het paginalogo naast het vel valt (breed scherm): dan blijft het paginalogo zichtbaar en verbergt het menulogo zich. `commandfor`/`command` worden tijdens `init` weggehaald en bij `destroy` teruggezet.

## Opties

| Optie | Standaard | Wat |
|---|---|---|
| `knop` | `[aria-controls="<id>"]` | De openknop (element of selector) |
| `merk` | `[data-vel-merk]` | Het paginalogo waar het menulogo op komt te liggen |
| `lijnDuur` | `250` | ms: lijn rekt uit, `scale(.36, .075) → (1, .075)`, outCirc |
| `rust` | `100` | ms rust tussen lijn en vel |
| `velDuur` | `350` | ms: vel vouwt open, `scaleY .075 → 1`, outCirc |
| `startSchaal` | `[0.36, 0.075]` | Beginschaal (x, y) |
| `inhoudStart` | `600` | ms waarop het eerste inhoudsblok binnenkomt |
| `stagger` | `70` | ms tussen twee inhoudsblokken |
| `sluitDuur` | `380` | ms voor de hele sluitreeks |
| `onChange` | – | `(open) => void` |

CSS-knoppen op `dialog[data-vel]`: `--vel-kleur` (vel), `--vel-paneel`, `--vel-inkt`, `--vel-accent`, `--vel-logo-kleur`, `--vel-rand` (afstand tot de schermrand), `--vel-breedte` (max. breedte, standaard 30rem), `--vel-radius`, `--vel-backdrop`.

## Toegankelijkheid

- `<dialog>` met `showModal()`: de rest van de pagina is inert voor muis, toetsenbord en schermlezer.
- Bij openen gaat de focus naar de eerste link. Tab loopt rond binnen het menu (de browser zou na het laatste element naar de adresbalk gaan).
- Esc sluit, met de korte terugspeelreeks, en de focus keert terug naar de menuknop. Klik naast het vel sluit ook.
- Een link sluit het menu meteen, zodat de scrollslot eraf is voordat de browser naar het anker springt. De focus gaat dan mee naar het doel, niet terug naar de knop. Anker op dezelfde pagina: de focus gaat naar dat anker. Andere pagina (ook client-side routering): naar `main h1`, anders `main`, zodra het pad wisselt (max. 3 s); eigen keuze via optie `focusDoel` (kommagescheiden voorkeurslijst).
- `aria-expanded` op de knop volgt de stand. Het vel is `aria-hidden`.
- Het menulogo staat op het lichte vel in `--vel-logo-kleur` (gemeten 7,8:1 in de demo).
- Minder beweging: het menu staat direct open en is direct dicht, zonder animaties.

## Valkuilen

- **Scrollslot werkt via `:has()`.** Safari 15.4+, Chrome 105+, Firefox 121+. In oudere browsers scrolt de pagina achter het menu, maar het menu werkt.
- **`scrollbar-gutter: stable`** op `html` tijdens het openen voorkomt dat de pagina op desktop opzij springt als de scrollbalk verdwijnt.
- **De sluitknop en het logo liggen op de plek van die in de kop.** De JS meet ze bij openen en bij resize. Staat de kop niet bovenaan (sticky header die weg-scrolt), dan komt het menulogo op de gemeten plek: dat is goed, zolang de knop in beeld is.
- **Geen `transform` op de dialog zelf** of een voorouder ervan: de top-layer trekt het zich niets aan, maar de gemeten posities kloppen dan niet.
- **Invoker-commando's** (`commandfor`) bestaan in Chrome 135+ en Firefox 144+, in Safari pas in de nieuwste versies (niet nagemeten). In oudere browsers doet de knop zonder JS niets; zet dan een `<noscript>`-link naar een sitemap of de footer.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
