# scroll-richting-nav

Een navigatie die uit beeld schuift als je omlaag scrolt en terugkomt zodra je een klein stukje omhoog scrolt. Zo heb je de hele hoogte voor de inhoud, en is het menu er meteen als je het zoekt.

- Drempel 8 px in één richting. Bij een richtingwissel begint de teller opnieuw, dus trillen op een trackpad doet niets.
- Binnen 20 px van de bovenkant altijd zichtbaar.
- Blijft staan als een menu open is (`aria-expanded="true"` in de nav, of een open modale `<dialog>`) en als de toetsenbordfocus erin zit.

## Wanneer wel

- Een sticky of fixed kop op lange pagina's: cases, blog, dienstpagina's.
- Samen met `navigation/vel-menu`: de nav blijft staan zolang het menu open is.

## Wanneer niet

- Als de kop alleen van uiterlijk moet veranderen na de hero (compacter, andere kleur): dat is `scroll/header-state`. Die twee kun je combineren op hetzelfde element.
- Op pagina's die maar een paar schermen lang zijn: dan is wegschuiven onrustiger dan blijven staan.
- Als de kop een actie bevat die altijd in beeld moet zijn (afrekenen, live-status): gebruik dan een mobiele actiebalk onderaan.

## Installatie

**Vanilla**

```html
<link rel="stylesheet" href="./scroll-richting-nav.css" />
<script type="module">
  import { init } from './scroll-richting-nav.js';
  init(document.querySelector('header'));
</script>
```

**React / Next.js**

```tsx
import { ScrollRichtingNav } from '@/component-library/navigation/scroll-richting-nav/ScrollRichtingNav';

<ScrollRichtingNav className="sticky top-0 z-20">
  <a href="/">Studio Wester</a>
  <nav>…</nav>
</ScrollRichtingNav>
```

**WordPress**

1. Zet `scroll-richting-nav.js`, `.css` en `_kwaliteit/basis.js` in je thema, met dezelfde onderlinge plek.
2. `wp_enqueue_style` en `wp_enqueue_script_module()` (WP 6.5+).
3. Roep `init(document.querySelector('.site-header'))` aan in `wp_footer`. Zorg dat de header `position: sticky` of `fixed` heeft.

## Markup-contract

```html
<header class="kop">   <!-- sticky of fixed, in je eigen CSS -->
  …
</header>
```

Door de JS gezet: `data-srn-aan` (overgang aan) en `data-srn-weg` (uit beeld). De CSS doet `translate: 0 -110%` in 0,45 s met `cubic-bezier(.215, .61, .355, 1)` (≈ power3.out). Er wordt alleen `translate` geanimeerd.

## Opties

| Optie | Standaard | Wat |
|---|---|---|
| `drempel` | `8` | Pixels in één richting voordat de stand wisselt |
| `bovenaan` | `20` | Binnen zoveel px van boven altijd zichtbaar |
| `blijfStaan` | – | `() => boolean`: extra reden om zichtbaar te blijven (bijvoorbeeld een open zoekveld) |
| `onChange` | – | `(weg) => void` |

De pure kern `stap(stand, scrollY, { drempel, bovenaan, vast })` wordt ook geëxporteerd, voor eigen tests.

## Toegankelijkheid

- Tab je de nav in (ook via de overslaanlink), dan komt hij direct terug en blijft hij staan tot de focus eruit gaat. Een CSS-vangnet (`:has(:focus-visible)`) doet hetzelfde als de JS een frame te laat is.
- Een muisklik op een navlink houdt hem niet vast. Die link houdt de focus, maar de bezoeker leest verder, dus omlaag scrollen laat de nav gewoon weggaan.
- Menu open: de nav blijft staan, zodat de sluitknop bereikbaar is.
- Minder beweging: de nav verdwijnt en verschijnt zonder overgang.
- De nav wordt alleen verschoven, niet verborgen voor schermlezers: hij blijft in de toegankelijkheidsboom.

## Valkuilen

- **Sticky werkt niet onder een voorouder met `overflow: hidden`.** Dan scrolt de kop gewoon mee en is wegschuiven zinloos. Zie `scroll/kaartenstapel-zij` voor uitleg en detectie.
- **Ankers onder een sticky kop:** geef secties `scroll-margin-top` gelijk aan de kophoogte. Bij een sprong omlaag gaat de nav weg, bij een sprong omhoog komt hij terug en bedekt hij anders de kop van de sectie.
- **`translate` en een eigen `transform` gaan samen**, maar gebruik je zelf al `translate` op de header, zet de stand dan op een binnenelement.
- **Een eigen scrollcontainer** (app-shell met `overflow: auto`) wordt niet gevolgd: de JS luistert naar het venster.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
