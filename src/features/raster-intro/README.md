# raster-intro

Een hero die zich in ongeveer 3 seconden opbouwt:

- **Raster.** Een lijnenraster tekent zich als een bouwtekening. Rechte lijnen
  schalen van 0 naar 1 met een stagger, cirkels en diagonalen tekenen zich met de
  pen.
- **Merkteken.** In het midden verschijnt het merkteken.
- **Kop.** Een reuzenkop schuift woord voor woord van links in, op vaste
  starttijden en met ease circ.out. Grote woorden staan in een smalle display-letter
  (Anton), kleine woorden in een schreef-italic (Instrument Serif).

Er is geen scrollslot: de pagina werkt vanaf het eerste frame. Klik of druk een
toets, en het eindbeeld staat er meteen. Bij minder beweging en zonder JavaScript
staat het eindbeeld er direct.

## Wanneer wel

- De opening van een programma-, dienst- of campagnepagina met één sterke belofte
  in drie of vier delen, zoals "Van / idee / naar / ontwerp".
- Merken met een constructief of grafisch karakter (architectuur, ingenieurs,
  ontwerpbureaus, onderwijs), waar een bouwtekening iets betekent.

## Wanneer niet

- Een pagina waar iemand meteen iets moet doen (webshop, afspraak maken). De kop
  is hier de inhoud, en een knop zou drie seconden op de woorden moeten wachten.
- Kopteksten met lange woorden. Bij 23,5vw passen op een telefoon ongeveer zeven
  kapitalen Anton per regel. "Duurzaamheidsadvies" past niet.
- Meer dan één keer per site. Dit is een openingsmoment.

## Installatie

```
heroes/raster-intro/
├── raster-intro.js     # starttijden + attributen, 0 dependencies
├── raster-intro.css    # opmaak + alle keyframes
├── RasterIntro.tsx     # React-wrapper
├── fonts/              # Anton + Instrument Serif Italic (woff2) + OFL.txt
├── demo.html           # de volledige markup, inclusief de rastertekening
└── test/meet.mjs
```

**Vanilla.** Neem de `<section data-raster-intro>` uit `demo.html` over en laad dan:

```html
<link rel="preload" href="./fonts/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="./raster-intro.css" />
<script type="module">
  import { init } from './raster-intro.js';
  const destroy = init(document.querySelector('[data-raster-intro]'));
</script>
```

**React / Next.js**

```tsx
import { RasterIntro } from '@/component-library/heroes/raster-intro/RasterIntro';

<RasterIntro aria-labelledby="hero-kop">
  <div className="ri__raster" aria-hidden="true">{/* svg uit demo.html */}</div>
  <div className="ri__teken">{/* svg met data-ri-streep */}<p className="ri__merk" data-ri-merk>studio wester</p></div>
  <h1 className="ri__kop" id="hero-kop">
    <span className="ri__woord ri__woord--klein" data-ri-rij="1">Van</span>{' '}
    <span className="ri__woord ri__woord--groot" data-ri-rij="2">idee</span>{' '}
    <span className="ri__woord ri__woord--klein" data-ri-rij="2" data-ri-naast="">naar</span>{' '}
    <span className="ri__woord ri__woord--groot" data-ri-rij="3" data-ri-rechts="">ontwerp</span>
  </h1>
</RasterIntro>
```

Let op de `{' '}` tussen de woorden in JSX. Zonder die spaties plakt de
schermlezer de woorden aan elkaar ("Vanideenaar…").

## Op WordPress

1. Zet de map in je thema (`component-library/raster-intro/`).
2. Laad `raster-intro.css` met `wp_enqueue_style()` en de module met
   `wp_enqueue_script_module()` (WP 6.5+, zonder versienummer).
3. Zet de preload voor het Anton-bestand via `wp_head`. Anders wisselt de kop zichtbaar
   van letter.
4. Plak de `<section>` uit `demo.html` in een blok "Aangepaste HTML" bovenaan de
   pagina, of zet hem in `front-page.php`. Pas de woorden aan, maar houd de spaties
   tussen de spans.
5. Roep `init(document.querySelector('[data-raster-intro]'))` aan na
   `DOMContentLoaded`.

Sluit de module uit van het samenvoegen van JS in cache-plugins.

## Markup-contract

| Element | Rol |
|---|---|
| `section[data-raster-intro]` | Root. De JS zet hierop `data-ri-actief`, `data-ri-loopt` en `data-ri-klaar`. |
| `.ri__raster` (`aria-hidden`) | Bevat één `<svg>` (viewBox 1440×720, `preserveAspectRatio="xMidYMin slice"`). |
| `[data-ri-lijn="h"]` / `[data-ri-lijn="v"]` | Rechte lijnen. Ze schalen vanaf links of vanaf boven. |
| `[data-ri-vorm]` + `pathLength="1"` | Figuren die zich tekenen: cirkels, diagonalen, bogen. |
| `.ri__teken svg [data-ri-streep]` + `pathLength="1"` | De streken van het merkteken. |
| `[data-ri-merk]` | Woordmerk onder het teken. Komt omhoog en wordt zichtbaar. |
| `h1.ri__kop` | De kop: één h1 met spans en echte spaties ertussen. |
| `.ri__woord--groot` / `.ri__woord--klein` | Display-kapitalen of schreef-italic. |
| `data-ri-rij="1–4"` | Regel in het grid. |
| `data-ri-naast` | Naast het grote woord, op de onderkant van de kapitalen. |
| `data-ri-rechts` | Rechts uitgelijnd over de hele regel. |

Starttijden worden in DOM-volgorde verdeeld: de eerste `.ri__woord` krijgt
`woordStarts[0]`, enzovoort. Bij lijnen en figuren telt ook de volgorde in de SVG.

## Opties

`init(root, opties)`:

| Optie | Standaard | Wat |
|---|---|---|
| `woordStarts` | `[0.76, 1.04, 1.34, 1.59]` | Starttijd per woord in seconden. Ontbreekt er een, dan komt die 0,28 s na de vorige. |
| `tempo` | `1` | Vermenigvuldiger voor alle tijden. De failsafe blijft 4 s, dus boven ±1,3 wordt het einde afgekapt. |
| `perSessie` | `false` | `true` speelt de intro één keer per tabblad-sessie. Daarna staat meteen het eindbeeld er. |
| `overslaan` | `true` | Klik op de hero of een toets ergens springt naar het eindbeeld. |

Vaste tijden in de JS :

| Laag | Start | Stagger |
|---|---|---|
| horizontale lijnen | 0,2 s | 0,25 s, krimpt tot alles vóór 1,5 s is begonnen |
| verticale lijnen | 0,9 s | 0,2 s, krimpt tot alles vóór 1,8 s is begonnen |
| figuren | 0,45 s | 0,12 s, krimpt tot alles vóór 1,5 s is begonnen |
| merkteken | 0,85 s | 0,14 s per streek; woordmerk op 1,85 s |

CSS-variabelen op `[data-raster-intro]`:

| Variabele | Standaard | Wat |
|---|---|---|
| `--ri-bg`, `--ri-lijn`, `--ri-tekst`, `--ri-accent` | ultramarijn, papier 17 %, papier, amber | Kleuren. |
| `--ri-groot` | `clamp(4.6rem, min(19.5vw, 27svh), 19rem)` (mobiel 23,5vw) | Grootte van de kapitalen. Begrensd op de hoogte, zodat de hele kop op een laptopscherm past. |
| `--ri-klein` | `max(1.6rem, 0.27 × groot)` | Grootte van de schreefwoorden. |
| `--ri-inspring` | `clamp(0rem, 17vw − 2rem, 18rem)` | Inspringing van de kop. |
| `--ri-duur-lijn` / `-vorm` / `-teken` | `1.25s` / `1.5s` / `1.2s` | Duur van het tekenen. |
| `--ri-duur-woord-klein` / `-groot` | `.6s` / `.8s` | Duur per woord. |
| `--ri-woord-afstand` | `5rem` (mobiel `2.5rem`) | Hoe ver de woorden van links komen. |
| `--ri-circ-out` | `cubic-bezier(.075,.82,.165,1)` | Ease van de woorden. |

## Toegankelijkheid

- **Eén h1.** De kop is één echte `h1` met de zin als tekst. De meting leest de
  accessibility-tree van Chromium zelf uit: één kop van niveau 1, als hele zin. Het
  raster heeft `aria-hidden`, en het merkteken-svg ook. Het woordmerk is gewone
  tekst.
- **Hoofdletters.** De grote woorden staan in de bron in kleine letters en worden
  in CSS kapitalen. Chromium geeft de kapitalen door aan de schermlezer ("Van IDEE
  naar ONTWERP"). Gebruik daarom echte woorden en geen afkortingen. Een woord van
  drie hoofdletters kan een schermlezer gaan spellen.
- **Minder beweging.** De JS zet niets, dus het eindbeeld staat er op t=0 (gemeten
  in het eerste frame). Zet de bezoeker het halverwege om, dan springt alles direct
  naar het eindbeeld.
- **Niemand hoeft te wachten.** Er is geen scrollslot, een klik of toets slaat de
  intro over, en na uiterlijk 4 s ruimt de module zichzelf op (R2).
- **Beweging.** Er wordt alleen met `transform` en `opacity` geanimeerd, plus
  `stroke-dashoffset` op de SVG-lijnen.

## Valkuilen

- **Font laadt te laat.** Komt Anton binnen terwijl de woorden al schuiven, dan
  springt de kop halverwege van letter. Daarom staat de klok stil
  (`animation-play-state: paused`) tot het font er is, maximaal 450 ms. Zet de
  preload erbij, dan is dat wachten vrijwel nul.
- **Ronde lijnkappen.** Met `stroke-linecap: round` tekent een streep van lengte 0
  toch een stip. Elke streek staat daarom op opacity 0 tot de pen begint.
- **De tekening is `slice`.** Op een telefoon zie je alleen het midden van de
  1440 brede tekening, op een ultrabreed scherm de bovenkant. Zet figuren die altijd
  zichtbaar moeten zijn tussen x 480 en 960.
- **Minder beweging live omzetten.** Het `change`-event van `matchMedia` komt pas
  bij de volgende rendering-update. Onder belasting (een trage telefoon, of de Mac
  op load 20–70) is dat tot seconden later, terwijl `matches` en de CSS al zijn
  omgeslagen. Daarom staat alle beweging in de CSS binnen
  `@media (prefers-reduced-motion: no-preference)`: het beeld schakelt zodra de
  browser het ziet. De JS leest `matches` live bij elke actie (start, klaar,
  failsafe, klik of toets). Ook ruimt hij op zodra de CSS de animaties afbreekt (hun
  `finished` wordt afgewezen), en wacht hij dus niet op het event (gemeten
  26-10-2026, 2 van 5 runs faalden vóór deze fix).
- **Spaties tussen de spans.** Het grid toont ze niet, maar de schermlezer heeft ze
  nodig om de zin heel te houden.
- **`h1.scrollWidth` is groter dan de kop.** De bouwlijn boven de kop loopt
  expres tot in de rand van de hero. De hero knipt dat af (`overflow: clip`), dus de
  pagina schuift niet opzij.

