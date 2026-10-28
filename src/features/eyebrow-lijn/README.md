# eyebrow-lijn

Een grote intro-zin met een klein label ervoor. Komt het blok in beeld, dan gaat
het zo:

1. het label komt omhoog uit een masker;
2. een lijn met pijlpunt trekt uit tot aan de zin;
3. de zin schuift van links in.

De eerste regel van de zin springt in, en in die ruimte staan label en lijn. Die
opmaak is gewone CSS en werkt ook zonder JavaScript.

## Wanneer wel

- Een sectie-opening met één grote zin en daarna bullets of kaarten, zoals
  "Werkwijze → Met een frisse blik op je merk zie je…".
- Twee tot vier keer per pagina, als vast ritme tussen secties.

## Wanneer niet

- Korte koppen van een paar woorden. Voor de inspringing (30 % van de breedte) is
  een zin nodig die minstens anderhalve regel loopt, anders staat de tekst los
  rechts.
- Labels langer dan zo'n 14 tekens op mobiel. De lijn krimpt mee, maar is
  minimaal 1,5rem. Een langer label duwt hem kleiner dan goed oogt.

## Installatie

```
scroll/eyebrow-lijn/
├── eyebrow-lijn.js    # IntersectionObserver + klassen, 0 dependencies
├── eyebrow-lijn.css   # opmaak + keyframes
├── EyebrowLijn.tsx    # React-wrapper (rendert ook de markup)
├── demo.html
└── test/meet.mjs
```

**Vanilla**

```html
<link rel="stylesheet" href="./eyebrow-lijn.css" />
<div data-eyebrow-lijn>
  <div class="el__kop">
    <p class="el__label"><span>Werkwijze</span></p>
    <span class="el__lijn" aria-hidden="true">
      <span class="el__streep"></span>
      <span class="el__baan"><svg class="el__pijl" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </span>
  </div>
  <p class="el__zin">Met een frisse blik op je merk zie je alles wat je klant echt ervaart.</p>
</div>
<script type="module">
  import { init } from './eyebrow-lijn.js';
  const destroy = init(document.querySelector('main'));
</script>
```

**React / Next.js**

```tsx
import { EyebrowLijn } from '@/component-library/scroll/eyebrow-lijn/EyebrowLijn';

<EyebrowLijn label="Werkwijze">
  Met een frisse blik op je merk zie je <em>alles wat je klant echt ervaart.</em>
</EyebrowLijn>
```

## Op WordPress

1. Zet `eyebrow-lijn.css` en `eyebrow-lijn.js` in je thema, bijvoorbeeld onder
   `component-library/eyebrow-lijn/`.
2. Laad ze met `wp_enqueue_style()` en `wp_enqueue_script_module()` (WP 6.5+). Zet
   bij de module geen versienummer, net als bij `reveal-on-scroll`, zodat hij niet
   twee keer laadt.
3. Plak de markup hierboven in een blok "Aangepaste HTML", of maak er een
   herbruikbaar patroon van met het label en de zin als enige tekst.
4. Roep `init(document.body)` aan na `DOMContentLoaded`. Eén aanroep pakt alle
   blokken op de pagina.

Sluit de module uit van het samenvoegen van JS in cache-plugins (WP Rocket,
Autoptimize). Die halen `type="module"` weg.

## Markup-contract

| Element | Rol |
|---|---|
| `[data-eyebrow-lijn]` | Het blok. `init(root)` zoekt deze binnen `root` (root zelf telt ook mee). |
| `.el__kop` | Label en lijn, absoluut in de inspringing van regel 1. |
| `.el__label > span` | Het label. De `span` beweegt, de `p` is het masker. |
| `.el__lijn` (`aria-hidden`) | Bevat `.el__streep` (schaalt) en `.el__baan` met `.el__pijl` (rijdt mee). |
| `.el__zin` | De zin. Krijgt `text-indent: var(--el-inspring)`. |

De JS zet `data-el-actief` (verborgen beginstand) en `.is-in` (afspelen).

## Opties

`init(root, opties)`:

| Optie | Standaard | Wat |
|---|---|---|
| `selector` | `"[data-eyebrow-lijn]"` | Welke blokken. |
| `rootMargin` | `"0px 0px -20% 0px"` | Trigger: de bovenkant van het blok op 80 % van het scherm. |
| `once` | `true` | `false` speelt opnieuw als het blok onder het scherm is verdwenen en terugkomt. Van boven terugscrollen speelt niet opnieuw. |

CSS-variabelen op `[data-eyebrow-lijn]`:

| Variabele | Standaard | Wat |
|---|---|---|
| `--el-zin-grootte` | `clamp(1.3rem, 0.9rem + 2vw, 3.25rem)` | Grootte van de zin. Label en lijn rekenen hiermee hun hoogte uit. |
| `--el-zin-regel` | `1.32` | Regelhoogte van de zin. |
| `--el-inspring` | `clamp(8.75rem, 30%, 25rem)` | Inspringing van regel 1. |
| `--el-tussen` | `clamp(.75rem, 1.4vw, 1.5rem)` | Lucht tussen pijlpunt en eerste letter. |
| `--el-lijn-kleur`, `--el-label-kleur` | `currentColor` | Kleuren. |
| `--el-ease` | `cubic-bezier(.075,.82,.165,1)` | circ.out. |
| `--el-duur-label` / `-lijn` / `-zin` | `.7s` / `1.05s` / `.95s` | Duur per deel. |
| `--el-start-lijn` / `-zin` | `.12s` / `.24s` | Starttijden. |

Een `<em>` in de zin wordt een schreefletter als je `typography/schreef-accent`
laadt en `data-schreef-accent="alles"` op het blok zet (zie de demo).

## Toegankelijkheid

- Het label is echte tekst en wordt voorgelezen. De lijn en de pijl hebben
  `aria-hidden`.
- Bij minder beweging zet de JS niets: het eindbeeld staat er meteen. Zet de
  bezoeker het halverwege om, dan springen alle blokken direct naar het eindbeeld.
- Er wordt alleen met `transform` en `opacity` geanimeerd. Er is geen
  scroll-luisteraar: een IntersectionObserver doet het werk.

## Valkuilen

- **De hoogte van `.el__kop` rekent met `--el-zin-grootte`.** Geef je de zin een
  eigen `font-size` buiten die variabele om, dan staan label en lijn niet meer op
  de eerste regel. Pas de variabele aan, niet de `font-size`.
- **De pijl schaalt niet mee.** Bij het voorbeeld schaalt het hele lijn-plus-pijl-blok,
  waardoor de pijlpunt tijdens de beweging platgedrukt is. Hier rijdt de punt op
  een eigen baan (`translateX(-100%) → 0`) met dezelfde duur en ease als de lijn.
  Zo zit de punt elk frame op het uiteinde.
- **circ.out is heel snel aan het begin.** De lijn staat na 60 ms al op ongeveer
  44 % (gemeten). Dat is het karakter. Wil je hem rustiger, zet dan `--el-ease`
  op een ease-out-quint (`cubic-bezier(.22,1,.36,1)`).

