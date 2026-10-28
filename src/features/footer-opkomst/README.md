# footer-opkomst

De inhoud van de footer schuift tijdens het inscrollen van -25 % naar 0, als een gordijn dat op zijn plek zakt. Met `animation-timeline: view()` in CSS, en een IntersectionObserver als terugval.

## Wanneer wel
- Een footer met een grote tekst, contactgegevens of een reuzenwoord, die rustig mag aankomen.
- Pagina's die al een duidelijk einde hebben: de footer is het laatste blok.

## Wanneer niet
- Een kleine footer van een paar links: de beweging valt dan weg tegen de hoogte.
- Een footer die al vastgeplakt (sticky of fixed) staat: de tijdlijn hoort bij scrollen langs de footer.

## Installatie
```
effects/footer-opkomst/
├── footer-opkomst.js    ES-module, 0 dependencies
├── footer-opkomst.css   namespaced op [data-opkomst*]
├── FooterOpkomst.tsx    React/Next client-wrapper
├── demo.html
└── test/meet.mjs
```
**Vanilla**
```html
<link rel="stylesheet" href="./footer-opkomst.css" />
<footer id="footer" data-opkomst><div data-opkomst-inhoud>…</div></footer>
<script type="module">
  import { init } from './footer-opkomst.js';
  const destroy = init(document.getElementById('footer'));
</script>
```
In browsers met `animation-timeline` werkt de CSS al zonder `init()`. `init()` is voor de terugval in de rest.

**React / Next.js**
```tsx
import { FooterOpkomst } from '@/component-library/effects/footer-opkomst/FooterOpkomst';
<FooterOpkomst>…footerinhoud…</FooterOpkomst>
```
**WordPress**: CSS via `wp_enqueue_style`, JS als module via `wp_enqueue_script_module` (zonder versienummer); wikkel de footerinhoud in `data-opkomst-inhoud` in `footer.php`. Roep `init(document.querySelector('footer[data-opkomst]'))` aan na `DOMContentLoaded`.

## Markup-contract
- `data-opkomst` op de footer: die krijgt `position: relative`, `overflow: clip` en de scroll-tijdlijn.
- `data-opkomst-inhoud` op één wrapper in de footer: die schuift. De footer heeft zelf een achtergrond, zodat de inhoud erin "wegzakt" in plaats van over de pagina boven te hangen.

## Hoe de twee routes werken
| | Native | Terugval |
|---|---|---|
| Voorwaarde | `CSS.supports('animation-timeline: view()')` | alle andere browsers met IntersectionObserver |
| Wie rekent | de browser: `animation-range: entry 0% entry 100%` op de tijdlijn van de footer | 50 drempels (`stappen`) van de observer, voortgang in `--opkomst-p` |
| Op de main thread | niets | alleen bij drempel-overgangen |
| Test | `modus: 'auto'` | `modus: 'js'` forceert deze route |

De terugval schaalt de voortgang als de footer hoger is dan het scherm, zodat hij toch 1 bereikt.

## Opties (`init(root, opties)`)
| Optie | Standaard | Omschrijving |
|---|---|---|
| `modus` | `'auto'` | `'auto'`, `'native'` (nooit terugval) of `'js'` (altijd terugval). |
| `stappen` | `50` | Aantal drempels voor de terugval. |

CSS-variabele: `--opkomst-afstand` (standaard `-25%`).

## Toegankelijkheid
- Puur visueel: geen `aria`-wijzigingen, de DOM-volgorde en focus veranderen niet.
- Minder beweging: de inhoud staat altijd op zijn plek, in beide routes, en reageert live als de bezoeker het omzet.
- Zonder JS: native browsers animeren gewoon; de rest ziet de footer statisch op zijn plek.

## Valkuilen
- `overflow: clip` op de footer knipt alles af wat buiten de footer valt (schaduwen, uitstekende knoppen). Geef de footer dan padding.
- Een footer die korter is dan de afstand van -25 % laat de inhoud boven de footer wegvallen: dat is bedoeld, houd er rekening mee met een hoge kop.
- Zet geen `transform` op `data-opkomst-inhoud`: de animatie gebruikt de losse eigenschap `translate`, maar een eigen `translate` wordt overschreven.

