# custom-cursor

Een eigen cursor — een stip die de muis direct volgt plus een ring die met
lichte vertraging (lerp) achteraankomt. De ring vergroot boven links en
knoppen, kan een label tonen (`data-cursor-label`) en optioneel magnetiseren
naar een knop (`data-cursor-magnetic`). Vier ringvarianten: `dot`,
`crosshair`, `groot`, `bal`.

## Wanneer wel

- Een portfolio, bureausite of productvitrine met een aanwijzer (desktop),
  waar één rustig, herkenbaar cursor-moment bij het merk past.
- Content waar een label bij hover ("Bekijken", "Afspelen") het klikdoel
  verduidelijkt zonder een tooltip te hoeven bouwen.

## Wanneer niet

- Niet op een site met veel formulieren of tekstinvoer als primaire taak —
  de cursor schakelt daar terecht steeds terug naar de systeemcursor, wat
  op zichzelf al aangeeft dat dit niet de juiste plek is voor het effect.
- Niet op touch (schakelt zichzelf al uit, zie § Toegankelijkheid) en niet
  als de belangrijkste interactie in een dialoog of `<iframe>` zit — daar
  is de eigen cursor bewust nooit zichtbaar.

## Installatie

```
component-library/effects/custom-cursor/
├── custom-cursor.js       # vanilla ES-module, 0 dependencies
├── custom-cursor.css      # namespaced op .vf-cursor + html.vf-cursor-active
├── CustomCursor.tsx        # React/Next.js client-wrapper (rendert niets zichtbaars)
├── demo.html
└── test/meet.mjs
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./custom-cursor.css" />
<a href="/cases" data-cursor-label="Bekijken">Bekijk case</a>
<button data-cursor-magnetic>Magnetische knop</button>

<script type="module">
  import { init } from './custom-cursor.js';
  const destroy = init(document.body); // eenmalig, op paginaniveau
</script>
```

**React / Next.js** — zet `<CustomCursor />` één keer op paginaniveau (bv. de
root-layout), niet per component:

```tsx
import { CustomCursor } from '@/component-library/effects/custom-cursor/CustomCursor';

<CustomCursor variant="bal" />
```

## Markup-contract

- Geen verplichte markup nodig — de module hangt de cursor-elementen zelf
  aan `document.body`. `init(root)` bepaalt alleen wáár naar interactieve
  elementen gezocht wordt (normaal `document.body`, de hele pagina).
- `data-cursor-label="Tekst"` op een link/knop toont die tekst in een pilletje
  naast de ring zolang je erboven hangt.
- `data-cursor-magnetic` op een link/knop laat hem licht meebewegen met de
  cursor (magnetisch effect), terug naar `0,0` zodra je 'm verlaat.
- `data-cursor-hover` op een willekeurig element telt ook als "interactief"
  (ring vergroot), zonder dat het zelf een link/knop hoeft te zijn.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `variant` | `"dot"` | `dot` \| `crosshair` \| `groot` \| `bal`. |
| `lerp` | `0.18` | Smoothing per animatieframe (0–1; hoger = strakker volgen). |
| `interactiveSelector` | `a, button, [role="button"], [data-cursor-hover]` | Welke elementen de ring laten vergroten. |
| `textFieldSelector` | `input, textarea, select, [contenteditable]` | Welke elementen de systeemcursor terugkrijgen. |
| `magnetic` | `true` | Zet `data-cursor-magnetic` aan/uit. |
| `magneticStrength` | `0.35` | Hoe ver een magnetische knop meebeweegt (0–1). |

CSS-variabelen (op `.vf-cursor` / `:root` — override globaal of alleen op de
ring):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--vf-cursor-color` | `#18181b` | Kleur van stip, ring en het gevulde `bal`-vlak. |
| `--vf-cursor-label-bg` / `--vf-cursor-label-fg` | `#18181b` / `#fff` | Achtergrond/tekstkleur van het label-pilletje. |
| `--vf-cursor-ring-size` | `2.5rem` (`groot`: `4.5rem`) | Diameter van de ring. |

## Toegankelijkheid

- **UIT op touch (R3).** `init()` doet op een touch-apparaat (`isTouch()`)
  helemaal niets — geen elementen, geen listeners. Een muis-volgende cursor
  heeft op touch geen functie en zou alleen maar in de weg zitten.
- **UIT bij minder beweging (R1).** Bij `prefers-reduced-motion: reduce`
  worden de cursor-elementen verwijderd en blijft de systeemcursor gewoon
  zichtbaar; de module reageert live als de bezoeker dit middenin omzet. De
  CSS heeft daarnaast een eigen `@media`-vangnet (`display:none` + systeem-
  cursor terug), ook als JS het onverhoopt niet had afgevangen.
- **Systeemcursor bij tekstvelden.** Boven `input`/`textarea`/`select`/
  `[contenteditable]` verdwijnt de eigen cursor en komt de systeem-
  tekstcursor terug — nodig om te kunnen zien waar je typt.
- **Nooit boven dialogen/iframes.** Boven `dialog[open]` of `<iframe>`
  verdwijnt de eigen cursor eveneens: die inhoud (soms van een andere bron)
  hoort nooit onder een zwevend, niet-klikbaar element te liggen.
- **Weg zodra de muis het venster verlaat** (`pointerleave` op `document`,
  plus `blur` op `window` als extra vangnet bij bv. Alt-Tab).
- De cursor-elementen zelf zijn decoratief: `aria-hidden="true"`,
  `pointer-events: none` — ze veranderen niets aan de toegankelijke naam of
  het gedrag van de onderliggende pagina.

## Op WordPress

Geen build-stap nodig. Zet de map in je thema, laad `custom-cursor.css` en
`custom-cursor.js` zoals in `scroll/reveal-on-scroll/README.md`
(§ Op WordPress), en roep `init(document.body)` één keer aan na
`DOMContentLoaded` — niet per pagina-sectie.

## Valkuilen

- **Twee keer `init(document.body)` aanroepen** zonder de eerste `destroy()`
  te gebruiken, geeft twee sets cursor-elementen over elkaar. Bewaar de
  `destroy`-functie en roep hem op vóór een herinitialisatie (bv. bij
  client-side navigatie in een SPA).
- **`magneticStrength` te hoog** (richting `1`) laat de knop bijna exact de
  cursor volgen in plaats van er licht naar toe te trekken — houd het onder
  `0.5`.
- **Eigen `cursor: none` op een element** buiten deze module kan botsen met
  de globale `html.vf-cursor-active * { cursor: none }`-regel; dat is
  onschuldig (beide willen hetzelfde), maar een element dat juist wél een
  systeemcursor nodig heeft, hoort in `textFieldSelector`, niet in eigen CSS
  opgelost.
- **Zeer hoge z-index elders op de pagina** (>2147483000) kan boven de
  cursor komen te liggen. Kom je dat tegen, verlaag die andere z-index —
  de cursor zelf gaat bewust niet hoger, want dat zou hem ook boven
  browser-eigen UI (autofill-dropdowns e.d.) kunnen duwen.

## Herkomst

Eigen implementatie van een gangbaar patroon (stip + vertraagde ring, lerp-
gebaseerd) — niet uit een specifieke referentiesite gehaald. Wat wij
toevoegen t.o.v. de meeste tutorial-versies van dit patroon: verplicht uit op
touch én bij `prefers-reduced-motion`, een aparte `textFieldSelector` die de
systeemcursor teruggeeft op tekstvelden, en een expliciete uitsluiting voor
`dialog[open]`/`iframe` zodat de cursor nooit boven vreemde of gemodaliseerde
inhoud kan blijven hangen.
