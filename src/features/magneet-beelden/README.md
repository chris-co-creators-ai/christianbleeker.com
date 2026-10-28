# magneet-beelden

Beelden binnen 250 px van de muis buigen er tot 30 px naartoe. Alleen bij een fijne pointer en zonder "minder beweging". De rAF-lus draait alleen zolang er iets beweegt.

## Wanneer wel
- Een hero of sectie met een handvol losse foto's of illustraties die luchtig om de kop heen staan.
- Op een site die al rustig is en één subtiel muismoment kan gebruiken.

## Wanneer niet
- Op beelden waar de bezoeker op moet klikken of die tekst dragen: een bewegend doel is vervelend. Hier is de verschuiving klein (maximaal 30 px), maar test het.
- Voor beelden die vanzelf zweven: dat doet `effects/float-decor`. De twee zijn te combineren op verschillende elementen, niet op één.
- Meer dan een stuk of tien beelden: de lus leest per frame van elk beeld de positie.

## Installatie
```
effects/magneet-beelden/
├── magneet-beelden.js    ES-module, 0 dependencies
├── magneet-beelden.css   namespaced op [data-magneet*]
├── MagneetBeelden.tsx    React/Next client-wrapper
├── demo.html
└── test/meet.mjs
```
**Vanilla**
```html
<link rel="stylesheet" href="./magneet-beelden.css" />
<section id="hero"><img data-magneet src="…" alt="…" width="300" height="300" /></section>
<script type="module">
  import { init } from './magneet-beelden.js';
  const destroy = init(document.getElementById('hero'));
</script>
```
**React / Next.js**
```tsx
import { MagneetBeelden } from '@/component-library/effects/magneet-beelden/MagneetBeelden';
<MagneetBeelden radius={250} sterkte={30}><img data-magneet src="/a.jpg" alt="" /></MagneetBeelden>
```
**WordPress**: CSS via `wp_enqueue_style`, JS als module via `wp_enqueue_script_module` (zonder versienummer). Geef de afbeeldingen in je Custom HTML-blok `data-magneet` en roep `init()` aan na `DOMContentLoaded`. Sluit het script uit van JS-combinatie door cachingplugins.

## Markup-contract
- `data-magneet` op elk beeld (of andere blokjes) binnen de root.
- De beweging komt uit de losse CSS-eigenschap `translate`. Een eigen `translate` op dat element wordt dus overschreven; `transform` blijft vrij voor andere effecten.

## Opties (`init(root, opties)`)
| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `[data-magneet]` | Beelden binnen de root. |
| `radius` | `250` | Afstand in px tot het middelpunt van het beeld waarbinnen de muis trekt. |
| `sterkte` | `30` | Maximale verschuiving in px bij afstand 0. |
| `aantrekken` | `0.12` | Lerp-factor zolang het beeld verder naar de muis toe beweegt. |
| `terug` | `0.18` | Lerp-factor terwijl het beeld terugkeert. |

Doel = richting x `sterkte` x (1 - afstand / `radius`); op 100 px afstand is dat 18 px, op afstand 0 geen verschuiving (er is dan geen richting).

## Toegankelijkheid
- Alleen bij `(hover: hover) and (pointer: fine)`; touch en grove pointers krijgen niets (R3). De check reageert live op wisselingen, bijvoorbeeld bij een tablet met een muis.
- Minder beweging: effect uit, de beelden staan op hun plek; omzetten halverwege zet alles meteen terug.
- Geen focus- of aria-wijzigingen; beelden blijven op hun plek in de DOM-volgorde. Decoratieve beelden krijgen `alt=""`.
- Verlaat de muis het venster, dan keren alle beelden terug.

## Valkuilen
- Het middelpunt wordt per frame gemeten min de eigen verschuiving: je mag de beelden dus ook laten meescrollen (parallax) zonder dat het effect uit de maat raakt.
- Een lus die nooit stopt is een veelgemaakte fout: hier stopt de lus zodra elk beeld binnen 0,05 px van het doel is. Ga niet zelf een `requestAnimationFrame` toevoegen.
- `will-change: translate` staat alleen aan zolang het effect actief is (`data-magneet-actief` op de root).

