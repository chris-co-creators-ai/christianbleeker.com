# hotspots

Klikbare punten op een afbeelding, elk met een tooltip. Posities in
procenten, zodat ze meeschalen met de afbeelding op elk scherm. Een tooltip
opent bij hover, focus of klik, sluit met Escape, en er staat er maximaal
één tegelijk open. Steekt een tooltip buiten de afbeelding uit, dan flipt hij
naar de andere kant.

## Wanneer wel

- Een productfoto, plattegrond of teamfoto waar je losse punten wilt
  toelichten zonder de foto vol tekst te zetten.
- Content waarbij elk punt kort is (een kop + één, twee zinnen) — niet een
  vervanging voor een volwaardige sectie met doorlopende tekst.

## Wanneer niet

- Niet voor meer dan 6–8 punten op één foto — dat wordt onoverzichtelijk en
  de punten gaan elkaar overlappen.
- Niet als het enige interactiemoment op de pagina: de informatie in een
  tooltip is optioneel bij bezoek (hover/focus is niet gegarandeerd), dus
  herhaal essentiële info ook gewoon in doorlopende tekst.

## Installatie

```
component-library/media/hotspots/
├── hotspots-kern.js       # vanilla ES-module, 0 dependencies
├── hotspots.css      # namespaced op .hotspots
├── Hotspots.tsx        # React/Next.js client-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./hotspots.css" />
<div class="hotspots">
  <div class="hotspots__media">
    <img src="werkplek.jpg" alt="Werkplek van Studio Wester" />
    <button type="button" class="hotspots__point" style="--hx: 30%; --hy: 62%" aria-expanded="false" aria-controls="hotspot-1">
      1
      <span class="hotspots__pulse" aria-hidden="true"></span>
    </button>
    <div class="hotspots__panel" id="hotspot-1" hidden>
      <h4>Planning op het bord</h4>
      <p>Elk traject begint met een kort plan.</p>
    </div>
  </div>
</div>

<script type="module">
  import { init } from './hotspots-kern.js';
  const destroy = init(document.body);
</script>
```

**React / Next.js**

```tsx
import { Hotspots } from '@/component-library/media/hotspots/Hotspots';

<Hotspots
  src="/werkplek.jpg"
  alt="Werkplek van Studio Wester"
  points={[
    { x: '30%', y: '62%', marker: '1', title: 'Planning op het bord', description: 'Elk traject begint met een kort plan.' },
  ]}
/>
```

## Markup-contract

- `.hotspots` > `.hotspots__media` (`position: relative`, bevat de `<img>`
  plus alle punten/panelen) > voor elk punt: een `.hotspots__point`
  (`<button>`, positie via inline `style="--hx: …; --hy: …"` — procenten
  t.o.v. de afbeelding) met een `.hotspots__pulse`-span erin, plus een los
  `.hotspots__panel` met hetzelfde `id` als het punt in `aria-controls`.
- Punt en paneel horen niet per se broer/zus te zijn — de module zoekt het
  paneel via `document.getElementById(point.getAttribute('aria-controls'))`,
  dus het paneel mag ergens anders in `.hotspots__media` staan.
- Zet in de markup alvast `aria-expanded="false"` en `hidden` op het paneel;
  de module beheert beide daarna.

## Opties

`init(root)` heeft geen opties — gedrag (hover/focus/klik opent, Escape
sluit, max 1 open, flip bij randoverschrijding) staat vast; kleur/maat via
CSS-variabelen.

CSS-variabelen (op `.hotspots__point`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--hp-accent` | `#2f6fed` | Kleur van het punt, de focus-ring en het pulsje. |

## Toegankelijkheid

- **Toetsenbord (R14).** Elk punt is een echte `<button>`: Tab bereikt hem,
  Enter/Spatie opent hem (native knop-gedrag activeert de klik-handler),
  Escape sluit de open tooltip en zet de focus terug op het punt.
  `aria-expanded`/`aria-controls` kloppen altijd met de echte staat. Klikken
  is bewust altijd een open-actie, geen toggle: dat voorkomt dat een tik op
  touch (die net als hover ook als "enter" telt) het net geopende paneel
  meteen weer dichtklikt. Sluiten op een apparaat zonder hover gaat via
  Escape of een klik ernaast — ergens anders op de afbeelding, of op een
  ander punt (dat schakelt automatisch om, zie hieronder).
- **Eén tegelijk open.** Een nieuw punt openen sluit automatisch het vorige
  — voorkomt een scherm vol tegelijk-open tooltips.
- **Binnen de afbeelding blijven.** De module meet de tooltip vóór het tonen
  en flipt hem (horizontaal en/of verticaal) zodra hij anders buiten
  `.hotspots__media` zou uitsteken.
- **Minder beweging (R1).** Het pulsje rond elk punt (`@keyframes
  hotspots-pulse`) staat stil onder `prefers-reduced-motion: reduce` — de
  punten blijven gewoon zichtbaar en klikbaar, alleen de aandachttrekker
  stopt.
- Het pulsje is decoratief: `aria-hidden="true"`.

## Op WordPress

Geen build-stap nodig. Zet de map in je thema, laad `hotspots.css` en
`hotspots-kern.js` zoals in `scroll/reveal-on-scroll/README.md` (§ Op WordPress),
plaats de markup (afbeelding + punten + panelen) in een Custom HTML-blok of
template, en roep `init(document.body)` aan na `DOMContentLoaded`.

## Valkuilen

- **`.hotspots__media` moet `position: relative` houden** (staat al in de
  CSS) — zonder dat positioneren de punten (`position: absolute`) relatief
  aan een verder weg gelegen voorouder, meestal `<body>`.
- **Een paneel zonder bijbehorend punt-`id`** (of andersom) wordt door de
  module overgeslagen — geen crash, het punt doet dan gewoon niets.
- **Zeer brede/lange tooltip-tekst** kan de flip-berekening in de weg zitten
  op een smalle afbeelding: houd de tekst kort (één kop + 1–2 zinnen), zoals
  ook onder § Wanneer niet staat.

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.
