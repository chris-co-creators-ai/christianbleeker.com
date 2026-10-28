# beeldexplosie

Hero met losse foto's rond een grote kop. Bij het laden springen de foto's in
vier golven vanuit het midden naar hun plek en schuift de kop regel voor regel
uit een masker. Scrolt de bezoeker, dan vliegen de foto's naar buiten en worden
ze 1,25 tot 3 keer groter, zakt de kop weg en groeit in het midden een
videokaart tot ±80vw (op mobiel een staande kaart). Daarna loopt de pagina
gewoon door. Energie: **druk** (één groot moment bij laden, één bij scrollen).

## Wanneer wel

- Een bureau, studio of maker met veel eigen beeld: ontwerpbureau, fotograaf,
  architect, evenementenbedrijf, horecagroep.
- Als homepage-hero met een showreel of één sterk beeld als ontknoping.
- De kop is kort: drie regels van hooguit 18 tekens.

## Wanneer niet

- Minder dan zeven goede foto's. Met stockbeeld valt het door de mand.
- Naast een andere grote hero op dezelfde pagina: niet samen met
  `merkvorm-venster`, `media-hero`, `reelwand` of `dagdeel-hero`.
- Pagina's waar de bezoeker meteen een prijs, formulier of telefoonnummer zoekt.
  De hero kost twee schermen scrollen.

## Installatie

```
component-library/heroes/beeldexplosie/
  beeldexplosie-kern.js     vanilla ES-module, 0 dependencies (importeert _kwaliteit/basis.js)
  beeldexplosie.css    alles onder .bx
  Beeldexplosie.tsx    React/Next-wrapper
  media/               demobeelden en showreel (zie Herkomst)
```

**Vanilla**

```html
<link rel="stylesheet" href="beeldexplosie.css" />
<script type="module">
  import { init } from './beeldexplosie-kern.js';
  const destroy = init(document.getElementById('hero'));
</script>
```

**React / Next.js**

```tsx
import { Beeldexplosie } from './Beeldexplosie';

<Beeldexplosie labelledBy="bx-kop" kaartStart={0.46}>
  {/* de markup uit het contract hieronder, vanaf .bx__spoor */}
</Beeldexplosie>
```

**WordPress**: zet de markup in een blok Aangepaste HTML bovenaan de pagina.
Laad `beeldexplosie.css` in de head en het script als `type="module"` (via
`wp_enqueue_script` en het filter `script_loader_tag`). Vervang de `src` door
URL's uit de mediabibliotheek. Zet het blok niet in een container met
`overflow: hidden` (zie Valkuilen).

## Markup-contract

```html
<section class="bx" id="hero" aria-labelledby="bx-kop">
  <div class="bx__spoor" data-bx-spoor>
    <div class="bx__podium" data-bx-podium>
      <div class="bx__veld">
        <ul class="bx__beelden" aria-hidden="true">
          <li class="bx__beeld" data-bx-beeld data-uit-x="-230" data-uit-y="-40" data-uit-schaal="3" data-golf="0"
              style="--l:-3%;--t:16%;--b:11%;--r:4/5;--ml:-6%;--mt:29%;--mb:22%">
            <div class="bx__binnen" data-bx-binnen><img src="…" alt="" width="480" height="600" /></div>
          </li>
          <!-- … 7 tot 12 beelden; data-bx-mobiel="nee" verbergt er een op mobiel -->
        </ul>
        <div class="bx__tekst">
          <h1 class="bx__kop" id="bx-kop">
            <span class="bx__regel" data-bx-regel><span>Ontwerp dat</span></span>
            <span class="bx__regel bx__regel--accent" data-bx-regel><span>mensen raakt</span></span>
            <span class="bx__regel" data-bx-regel><span>en blijft hangen</span></span>
          </h1>
        </div>
      </div>
      <div class="bx__kaart" data-bx-kaart>
        <video muted loop playsinline preload="none" controls poster="poster.webp" aria-label="Showreel van …">
          <source src="reel-mobiel.webm" type="video/webm" media="(max-width: 720px)" />
          <source src="reel.webm" type="video/webm" />
          <source src="reel.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  </div>
</section>
```

Per beeld:

| Attribuut / variabele | Wat |
|---|---|
| `--l`, `--t`, `--b` | plek op desktop: links, boven en breedte in % van het podium |
| `--ml`, `--mt`, `--mb` | plek op mobiel (onder 720 px); ontbreekt er een, dan geldt de desktopwaarde |
| `--r` | beeldverhouding, bijvoorbeeld `4/5`, `3/2`, `1/1` |
| `data-uit-x`, `data-uit-y` | richting waarin het beeld wegvliegt, in % van zijn eigen maat (zonder: weg van het midden) |
| `data-uit-schaal` | eindschaal bij wegvliegen, standaard `1.6` (Tandem: 1,25 tot 3) |
| `data-golf` | golf 0 tot 3 van de intro (standaard: om de beurt) |
| `data-start`, `data-duur` | eigen interval in de scrollvoortgang (standaard start 0,01 tot 0,16, duur 0,62 tot 0,74) |
| `data-bx-mobiel="nee"` | beeld niet tonen op mobiel |

De lengte van de vliegbaan rekt het script zelf op tot het beeld aan het eind
van zijn baan helemaal buiten beeld staat, ook op een schermmaat waar de
opstelling anders uitvalt. De richting blijft van jou.

Het `<video>` mag ook een `<img>` zijn (een beeldkaart). `controls` staat er
voor wie geen JavaScript heeft; het script haalt het weg en zet er een eigen
pauzeknop in.

## Opties (`init(root, opties)`)

| Optie | Standaard | Wat |
|---|---|---|
| `intro` | `true` | laadanimatie aan of uit |
| `introPerSessie` | `false` | intro maar 1× per tabblad-sessie (`frequentie()` uit basis.js) |
| `golven` | `[0.04, 0.14, 0.24, 0.39]` | starttijden in seconden van de vier golven |
| `kopStart` | `0.35` | start in seconden van de eerste kopregel |
| `kopStagger` | `0.12` | seconden tussen de kopregels |
| `kaartStart` | `0.46` | voortgang (0 tot 1) waarop de kaart begint te groeien |
| `kaartEind` | `0.87` | voortgang waarop de kaart vol is |

CSS-variabelen op `.bx`: `--bx-papier`, `--bx-inkt`, `--bx-accent` (de
schreefregel), `--bx-rand` (rand om de kaart), `--bx-spoor` (`300svh`, mobiel
`250svh`), `--bx-radius`, `--bx-schreef` (lettertype van de accentregel).

## Hoe het werkt

- Het spoor is 300svh hoog en het podium plakt daarin (`position: sticky`,
  100svh, `overflow: clip`). Eén scrolllezer (passief, via `perFrame()`) zet
  `--p` van 0 tot 1 op de sectie. Al het andere is CSS: elk beeld rekent zijn
  eigen stukje voortgang uit met
  `clamp(0, (var(--p) - var(--s)) / var(--d), 1)` en zet dat in `transform`.
- Gemeten getallen van Tandem als vertrekpunt: kaartschaal 0 tot 45 %, dan
  0,37 bij 60 %, 0,87 bij 80 % en 1 vanaf ±87 %. Wij meten 0,375 / 0,850 / 1,000.
  Beeld 1 groeit 1,29 / 1,61 / 1,94 / 2,42 / 2,90 / 3 bij 10/20/30/45/60/75 %
  (Tandem: 1,28 / 1,60 / 1,91 / 2,38 / 2,85 / 3).
- De intro is WAAPI op een binnenlaag (`[data-bx-binnen]`, de binnenste span van
  een kopregel), zodat hij nooit botst met de scroll-transform op de buitenlaag.
  Easing `cubic-bezier(.215,.61,.355,1)` (≈ power3.out), duur 1 tot 1,2 s. De
  kopregels gebruiken `cubic-bezier(.16,1,.3,1)`, 0,9 s, 0,12 s ertussen.
- Geen scrollslot. Scrollen, tikken of een toets tijdens de intro maakt hem
  meteen af, en na 4 s maakt een vangnet hem in elk geval af (R2).

## Toegankelijkheid

- De kop is één echte `h1` met gewone tekst; de maskers zijn alleen spans. De
  fotolijst heeft `aria-hidden="true"` en lege `alt`'s: de foto's zijn decor.
  De video heeft een `aria-label`.
- **Minder beweging**: geen intro en geen scrollbeweging, maar een statische
  compositie (foto's rond de kop, de kaart op volle grootte eronder). Het
  podium plakt niet. De video speelt niet vanzelf; de knop zegt "Speel video
  af". Zet de bezoeker het halverwege om, dan stopt alles direct en staat het
  eindbeeld er (gemeten).
- **Zonder JavaScript**: dezelfde statische compositie, met de native
  bediening op de video.
- **Pauzeknop** (WCAG 2.2.2): rechtsonder in de kaart, 3 px focusring, het label
  wisselt tussen "Pauzeer video" en "Speel video af". Tabt iemand naar de knop
  terwijl de kaart nog klein is, dan zet het script de pagina direct op het punt
  waar de kaart vol in beeld staat.
- Contrast: de kop staat op het effen papier, niet op een foto. De demo-inkt
  `#14163f` op `#f3eee4` haalt 14,9:1, de accentregel `#2430c4` 7,9:1.

## Prestatie

- Per frame verandert alleen `--p`. De browser rekent de `transform` en
  `opacity` van ±15 elementen opnieuw uit; geen layout per frame.
- De video heeft `preload="none"` en laadt pas als de kaart begint te groeien.
  Hij pauzeert als de kaart weer krimpt of als de hero uit beeld is
  (`IntersectionObserver`). Mobiel krijgt een staande bron van 360×640
  (370 kB) in plaats van 1200×800 (1,2 MB).
- De foto's hebben vaste `width`/`height` en `aspect-ratio`: geen layout-shift.

## Valkuilen

- `position: sticky` werkt niet als een voorouder `overflow: hidden` of `auto`
  heeft. Op `html`/`body` alleen `overflow-x: clip`.
- Houd het midden vrij: een foto achter de kop maakt hem onleesbaar. Het
  middelste derde van het podium is voor de kop.
- Schaal 3× maakt een foto drie keer zo groot op het scherm. Lever beelden van
  minstens 3 × de getoonde breedte, of houd `data-uit-schaal` laag voor grote
  foto's.
- Een spoor langer dan 300svh voelt als een gevangen pagina. Blijf op 250 tot
  300svh.

