# veeg-rij

Een lijstregel (vacature, dienst, artikel) waarover bij hover of focus een kleurvlak van links veegt. De tekst schuift 2em op en wisselt van kleur. Het effect is CSS; `init()` is optioneel.

## Wanneer wel
- Vacaturelijsten, dienstenoverzichten, artikellijsten: regels die elk naar een eigen pagina leiden.
- Overal waar een rij met veel witruimte een duidelijke "dit ga je openen"-terugkoppeling nodig heeft.

## Wanneer niet
- Kaarten met meer dan een regel of twee tekst en een knop: gebruik `cards/kader-hover`.
- Regels zonder link: een hover-effect dat nergens naartoe leidt misleidt.

## Installatie
```
cards/veeg-rij/
├── veeg-rij.js     ES-module, 0 dependencies
├── veeg-rij.css    namespaced op [data-veeg*]
├── VeegRij.tsx     React/Next client-wrapper
├── demo.html
└── test/meet.mjs
```
**Vanilla**
```html
<link rel="stylesheet" href="./veeg-rij.css" />
<script type="module">
  import { init } from './veeg-rij.js';
  const destroy = init(document.querySelector('#vacatures'), { richting: 'pointer' });
</script>
```
Zonder `init()` werkt het effect ook, zolang je `data-veeg` zelf in de markup zet; `init()` is alleen nodig voor `richting: 'pointer'` of voor de `selector`.

**React / Next.js**
```tsx
import { VeegRij } from '@/component-library/cards/veeg-rij/VeegRij';
<VeegRij richting="pointer">
  <a data-veeg href="/vacature/art-director"><span data-veeg-tekst>Art director</span></a>
</VeegRij>
```
**WordPress**: CSS via `wp_enqueue_style`, JS als module via `wp_enqueue_script_module` (zonder versienummer). Plak de lijst als Custom HTML-blok. Of laat de JS weg en geef de regels in je thema `data-veeg` en `data-veeg-tekst`.

## Markup-contract
```html
<a data-veeg href="…">
  <span data-veeg-tekst>Titel</span>
  <span aria-hidden="true">→</span>   <!-- blijft staan, schuift niet mee -->
</a>
```
- `data-veeg` op de regel (meestal de `<a>`). De regel krijgt `display:flex`, `overflow:hidden` en `isolation:isolate`.
- `data-veeg-tekst` op wat opschuift. Alles daarbuiten blijft staan.
- Het vlak is `scaleX(0 → 1)` met `transform-origin: left`, 500 ms, `cubic-bezier(.075,.82,.165,1)`.

## Opties (`init(root, opties)`)
| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `[data-veeg]` | Regels binnen de root. Elementen zonder `data-veeg` krijgen het attribuut, en verliezen het bij `destroy()`. |
| `richting` | `'links'` | `'pointer'`: het vlak komt van de kant waar de muis binnenkomt en trekt zich terug naar de kant waar hij vertrekt. Alleen voor een muis. |

CSS-variabelen: `--veeg-vlak` (kleur vlak, `#26379b`), `--veeg-tekst` (`#14173a`), `--veeg-tekst-hover` (`#fffef9`), `--veeg-schuif` (`2em`), `--veeg-duur` (`.5s`).

## Toegankelijkheid
- Werkt op `:hover` én `:focus-visible`; de focusring (2 px) blijft zichtbaar op het vlak, in de lichte tekstkleur.
- Contrast: kies `--veeg-vlak` en `--veeg-tekst-hover` zo dat ze samen minstens 4,5:1 halen (de demo: ruim 9:1).
- Touch: geen hover; `:active` geeft bij het aantikken dezelfde terugkoppeling (R3).
- Minder beweging: transities uit, de eindtoestand verschijnt direct.
- Forced colors: vlak en tekst volgen `Highlight` en `HighlightText`.

## Valkuilen
- De tekst schuift 2em: geef de regel voldoende rechterruimte, anders raakt lange tekst de pijl.
- Het vlak ligt op `z-index: -1` binnen de regel; zet je zelf een achtergrond op een kind, dan dekt die het vlak af.
- Elke regel heeft een eigen link: zet geen tweede link in `data-veeg-tekst`.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
