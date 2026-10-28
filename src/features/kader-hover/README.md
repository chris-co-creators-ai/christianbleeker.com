# kader-hover

Een kaart die bij hover of focus een selectiekader met 8 handvatjes krijgt (zoals een geselecteerd object in een ontwerpprogramma), beige kleurt en onderin een knop laat uitveren. Het effect is CSS; `init()` is alleen het opt-in.

## Wanneer wel
- Dienstenblokken, pakketten of cases in een rij van 2 tot 4 kaarten, waar één kaart tegelijk "geselecteerd" mag voelen.
- Kaarten met een kleine lijst en één vervolgstap (meer informatie, offerte, bekijk case).

## Wanneer niet
- Een lange lijst met tientallen kaarten: het kader en de uitveerknop worden dan ruis. Gebruik `cards/veeg-rij` voor lijstregels.
- Kaarten zonder vervolgstap: dan is er niets om uit te veren, en is een eenvoudige hover genoeg.

## Installatie
```
cards/kader-hover/
├── kader-hover.js     ES-module, 0 dependencies
├── kader-hover.css    namespaced op [data-kader*]
├── KaderHover.tsx     React/Next client-wrapper
├── demo.html
└── test/meet.mjs
```
**Vanilla**
```html
<link rel="stylesheet" href="./kader-hover.css" />
<script type="module">
  import { init } from './kader-hover.js';
  const destroy = init(document.querySelector('#diensten'));
</script>
```
**React / Next.js**
```tsx
import { KaderHover } from '@/component-library/cards/kader-hover/KaderHover';
<KaderHover className="rij">
  <article data-kader>…<div data-kader-knop><div><a href="/strategie">Meer informatie</a></div></div></article>
</KaderHover>
```
**WordPress**: zet de map in je thema, laad de CSS met `wp_enqueue_style` en de JS als module (`wp_enqueue_script_module`, zonder versienummer, zie `scroll/reveal-on-scroll`). Plak de kaarten als Custom HTML-blok en roep `init(document.body)` aan na `DOMContentLoaded`. Sluit het script uit van JS-combinatie door cachingplugins. Zonder JS werkt alles nog, alleen staat de knop dan altijd open.

## Markup-contract
```html
<article data-kader>
  …inhoud…
  <div data-kader-knop><div><a href="…">Meer informatie</a></div></div>
</article>
```
- `data-kader` op de kaart. De kaart krijgt `position: relative`; zet de kaarten in een grid met `align-items: start` zodat een geopende kaart de buren niet mee rekt.
- `data-kader-knop` met precies één kind (de uitklapper) en daarin de link of knop. Dat dubbele element is nodig voor de `0fr → 1fr`-truc.
- Zet op de wrapper geen padding of marge: die blijft zichtbaar als de knop dicht is.

## Opties (`init(root, opties)`)
| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `[data-kader]` | Kaarten binnen de root. Gevonden elementen zonder `data-kader` krijgen het attribuut, en verliezen het bij `destroy()`. |

CSS-variabelen (op de kaart of een ouder):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--kader-accent` | `#26379b` | Kleur van lijn, handvatjes en knop. |
| `--kader-bg` | `#fffef9` | Achtergrond in rust. |
| `--kader-bg-hover` | `#ebe4d6` | Achtergrond bij hover of focus. |
| `--kader-radius` | `1.5rem` | Hoekradius van kaart en kader. |
| `--kader-handvat` | `7px` | Maat van de handvatjes. |

## Toegankelijkheid
- Werkt ook op `:focus-within`: Tab naar de knop opent het kader en de knop. De knop is altijd bereikbaar en wordt voorgelezen, ook als hij visueel nog dicht is.
- Focusring van minimaal 2 px op de knop.
- Touch heeft geen hover (R3): bij `hover: none` staat de knop altijd open en blijft het kader weg.
- Minder beweging: alle transities uit, de eindtoestand verschijnt direct.
- Forced colors: het kader krijgt de systeemkleur `Highlight`, de handvatjes vallen weg.

## Valkuilen
- De spring (outBack) van de knop zit in een `linear()`-easing op `translate`, niet op de hoogte: een rij van `1.1fr` overshoot niet. Oudere browsers zonder `linear()` krijgen de knop zonder veer.
- De transities worden een frame na `init()` ingeschakeld; anders zie je de knop bij het laden dichtklappen.
- Hele kaart klikbaar maken? Doe dat met een `::after` op de link in de kaart, niet met een `<a>` om de hele kaart, anders staat er een link in een link.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
