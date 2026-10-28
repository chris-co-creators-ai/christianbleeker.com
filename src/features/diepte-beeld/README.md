# diepte-beeld

Eén foto van de klant, opgedeeld in 3–4 lagen, die licht ten opzichte van
elkaar meebewegen met de muis (desktop) en met scrollen (alle apparaten). Het
beeld krijgt diepte zonder 3D-model. De kop kan **tussen** de lagen staan: het
helmgras in de voorgrond valt er deels overheen, en dat is het moment waar een
bezoeker over praat. Rustig: een uitslag van een paar procent, gedempt met
lerp, en er beweegt niets zolang de bezoeker niets doet.

Middel-energie, 5-punter. Demo: `demo.html` (verzonnen klant "Paviljoen
Wester", strandpaviljoen en B&B aan zee).

## Wanneer wel

- Eén sterk beeld met duidelijke voor-, midden- en achtergrond als hero van een
  horeca-, beauty-, winkel- of opleidingssite: strand, terras, salon, werkplaats.
- Als er een kop of merknaam is die je in het beeld wilt laten staan in plaats
  van erbovenop.

## Wanneer niet

- Losse, niet-samenhangende elementen die op verschillende snelheid scrollen:
  dat is `scroll/parallax`. Dit onderdeel is één samengesteld beeld.
- Foto's zonder diepte (portret voor een egale muur, productfoto op wit): er is
  niets om te scheiden en het effect oogt als een schuivend plaatje.
- Foto's waar het onderwerp de hele beeldhoogte vult zonder dat er iets voor of
  achter staat.

## Van één klantfoto naar lagen

Het onderdeel is maar zo goed als de lagen. Geschikt is een foto waar je
zonder na te denken 3 vlakken in ziet: iets vooraan (gras, een railing, een
plant, een stoelrand), het onderwerp of de middenzone, en een achtergrond
(lucht, zee, gebouw). Ongeschikt: alles op één afstand, of een druk beeld waar
de randen tussen vlakken uit haar, glas of gaas bestaan.

**Route 1: Codex `image_gen` via het ChatGPT-abonnement (geen API-kosten).**
Maak de lagen los van elkaar in dezelfde compositie, in aparte aanroepen:

1. Achtergrond (geen alfa nodig): "lucht en zee, geen voorgrond, dezelfde
   horizon op 3/4 van de hoogte, 1536×1024".
2. Midden: "alleen de duinen, op een **volledig transparante achtergrond**,
   onderrand van het beeld gevuld, bovenkant leeg". Eén wijziging per prompt.
3. Voorgrond: "alleen het helmgras en de paal, transparante achtergrond,
   onderkant gevuld".
4. Gebruik als referentie de klantfoto en houd horizon, lichtrichting en
   kleurtemperatuur gelijk. Vraag altijd hetzelfde formaat (1536×1024).

Controleer de alfa met `sips -g hasAlpha laag.png`. Zegt Codex "transparant"
maar staat er een effen of geruit vlak in (komt voor), gebruik dan route 2 of
knip die laag alsnog uit.

**Route 2: handmatig uitknippen** (Photoshop/Affinity/Photopea "onderwerp
selecteren", of `rembg`): dupliceer de foto, knip voorgrond en midden uit,
vul de gaten in de achtergrond aan (generatief vullen of clone stamp) zodat er
achter het uitgeknipte deel beeld bestaat als de lagen verschuiven.

**Afwerking (beide routes)**

- Alle lagen exact even groot en op dezelfde positie exporteren.
- Naar WebP met alfa: `cwebp -q 80 -alpha_q 90 laag.png -o laag.webp` (achtergrond
  zonder alfa: `-q 78`). Mik op ≤ 300 kB per laag; de demo zit op ≈ 100 kB
  (achter) en ≈ 240 kB (midden).
- Harde randen op gras en haar hoeven niet perfect: de lagen bewegen maar een
  paar pixels. Vermijd wel een lichte rand (halo) rond de uitsnede: check de
  laag op een donkere en een lichte achtergrond.
- Alt-tekst schrijf je één keer, voor de foto als geheel (zie Toegankelijkheid).

## Installatie

```
component-library/effects/diepte-beeld/
├── diepte-beeld.js      # vanilla ES-module, 0 dependencies
├── diepte-beeld.css     # namespaced op data-attributen
├── DiepteBeeld.tsx      # React/Next.js client-wrapper
├── media/               # demolagen (Paviljoen Wester)
├── demo.html            # zelfstandige demo
└── test/meet.mjs        # Playwright-meting (Chromium, WebKit, Firefox)
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./diepte-beeld.css" />
<figure data-diepte-beeld>…</figure>
<script type="module">
  import { init } from './diepte-beeld.js';
  const destroy = init(document.querySelector('[data-diepte-beeld]'));
  // destroy() bij opruimen; init(document.body) pakt alle beelden op de pagina
</script>
```

`diepte-beeld.js` importeert `../../_kwaliteit/basis.js`; neem die map mee of
pas het importpad aan.

**React / Next.js**

```tsx
import { DiepteBeeld } from '@/component-library/effects/diepte-beeld/DiepteBeeld';

<DiepteBeeld className="hero">
  <div data-diepte-laag data-diepte="0.12">
    <img src="/achter.webp" alt="Strand bij Paviljoen Wester" width={1536} height={1024} />
  </div>
  <div data-diepte-laag data-diepte="0.4"><img src="/midden.webp" alt="" aria-hidden="true" width={1536} height={1024} /></div>
  <div data-diepte-laag className="db-tekst" data-diepte="0.6"><h1>Paviljoen Wester</h1></div>
  <div data-diepte-laag data-diepte="1"><img src="/voor.webp" alt="" aria-hidden="true" width={1536} height={1024} /></div>
</DiepteBeeld>
```

**WordPress**

Geen build nodig. Zet de map in je thema, laad `diepte-beeld.css` en de module
zoals bij `reveal-on-scroll` (`wp_enqueue_style` + `wp_enqueue_script_module`,
zonder versienummer op de module-enqueue), en plak de markup in een Custom
HTML-blok of HTML-widget. Sluit `diepte-beeld.js` uit van JS-
combinatie/minificatie (caching-plugins strippen `type="module"`). Roep
`init(document.body)` aan na `DOMContentLoaded`. Zet de afbeeldingen in de
Media-bibliotheek en verwijs met hun vaste URL; laat een lazy-load-plugin de
eerste laag met rust (of geef die `loading="eager"`).

## Markup-contract

- Root: `data-diepte-beeld`, met kinderen `data-diepte-laag`, van achter naar voor
  in DOM-volgorde (later = voor). Het beeld heeft een vaste `aspect-ratio`
  (`--db-verhouding`, standaard `3 / 2`), dus geen layout-shift.
- `data-diepte="0…1"` per laag: 0 = beweegt niet, 1 = beweegt het meest.
  Richtlijn: achtergrond 0,12, midden 0,4, tekst 0,6, voorgrond 1. Standaard 0,5.
- Beeldlagen bevatten een `<img>` (of `<picture>`) en liggen iets buiten het
  kader (`--db-overscan`, standaard 8%), zodat schuiven nooit een rand toont.
- Tekstlaag: extra klasse `db-tekst`; die past precies in het kader. Je bepaalt
  zelf de opmaak (in de demo `container-type: inline-size` en `cqw`, zodat de
  kop met het beeld meeschaalt).
- De lagen komen in dezelfde volgorde in de DOM als op het scherm: de kop staat
  tussen de beeldlagen, en is gewone koptekst voor schermlezers.

## Opties

| Optie | Standaard | Wat |
|---|---|---|
| `laag` | `[data-diepte-laag]` | Selector voor de lagen binnen het beeld |
| `muis` | `0.02` | Maximale muisuitslag van de voorgrond, als fractie van breedte/hoogte van het beeld |
| `scroll` | `0.05` | Maximale scrolluitslag van de voorgrond, als fractie van de hoogte van het beeld |
| `scrollTouch` | `0.12` | Idem op touch: alleen scroll-diepte, dus meer uitslag. Hoort bij `--db-overscan: 14%` (CSS zet dat automatisch op touch) |
| `demping` | `0.09` | Lerp per frame (0–1). Kleiner = trager en zachter |

`muis` + `scroll` moeten samen kleiner blijven dan `--db-overscan` (nu 2% + 5%
= 7% < 8%); op touch geldt `scrollTouch` (12%) tegen 14%. Verhoog je een van de
twee, verhoog dan de overscan mee.

CSS-variabelen op het beeld: `--db-verhouding`, `--db-overscan`, `--db-radius`,
`--db-uitsnede` (`object-position` van alle lagen). Op een telefoon kies je een
hoger kader en een uitsnede die de voorgrond in beeld houdt, zoals de demo doet
(`--db-verhouding: 5 / 6; --db-uitsnede: 100% 50%`): een breed beeld op 350 px
breed schuift anders nauwelijks.

## Toegankelijkheid

- **Alt-tekst op één plek**: alleen de achtergrondlaag heeft `alt="…"` (beschrijf
  het beeld als geheel); de andere lagen zijn decoratief: `alt=""` en
  `aria-hidden="true"`.
- **Minder beweging** (`prefers-reduced-motion`): de lagen blijven stilstaan als
  één samengesteld beeld, en het reageert live als de bezoeker de instelling
  halverwege omzet. De CSS dwingt ook `transform: none` af.
- **Contrast (R16)**: de kop staat op een foto. Kies kleur en plek in de kop
  zo dat hij 4,5:1 haalt tegen zowel lucht als duin, en test dat op mobiel.
- **Zonder JavaScript**: de lagen liggen als één beeld op elkaar; de kop staat
  erin. Er wordt niets verborgen.
- Geen focusbare elementen, dus geen toetsenbordgedrag om te regelen.

## Valkuilen

- **Lagen laden samen.** Zolang niet alle (niet-lazy) afbeeldingen binnen zijn, blijven alle lagen behalve de eerste onzichtbaar (`data-db-laden`); daarna komen ze samen in beeld. Bij een fout of na 4 s tonen we wat er is. De eerste laag hoort dus de achtergrond te zijn.
- **Kopcontrast meten.** `test/contrast.mjs` meet per letterpixel (WCAG-luminantie) tegen wat er achter de kop staat en of de eerste letter vrij blijft van de voorgrond; plaats je eigen kop en draai hem. In de demo: ≥ 4,5:1 overal (p1 7,2:1 desktop, 6,5:1 mobiel).

- **Bewust geen gyroscoop op mobiel.** `DeviceOrientationEvent` vraagt op iOS
  toestemming ("bewegingssensoren"), en een prompt bij binnenkomst is
  opdringerig (R11). Mobiel krijgt daarom alleen scroll-diepte, geen sensor en
  geen vraag.
- **Lagen die niet op elkaar passen**: alle lagen moeten dezelfde afmetingen en
  compositie hebben, anders zie je het beeld "scheuren" in rust. Controleer de
  lagen op elkaar vóór je ze in de site zet.
- **Te grote lagen**: 3–4 beelden van 1536×1024 zijn zwaar op mobiel. Houd ze
  ≤ 300 kB per stuk en laad de eerste laag met `fetchpriority="high"`; bij een
  hero staat het beeld boven de vouw en telt voor LCP.
- **Te hoge uitslag**: meer dan een paar procent oogt als een gimmick en toont
  de rand van het beeld. Bij twijfel lager.
- **`transform` op een ouder**: `will-change: transform` staat op elke laag,
  zodat de GPU ze los tekent. Zet een `filter` of `backdrop-filter` niet op het
  beeld zelf, dat kost een extra tekenronde per frame.
- Muisdiepte werkt op het beeld zelf (`pointermove`), dus niet als de muis er
  bovenaan overheen zit in een andere laag met eigen `pointer-events`.

