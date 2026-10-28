# flip-card

Een kaart die omdraait tussen voor- en achterkant: op desktop bij hover, en
overal met een echte `<button>` (`aria-pressed`) — tik, Enter of Spatie. De
verborgen kant krijgt `inert`, zodat hij niet focusbaar of voorleesbaar is
zolang je hem niet ziet. Bij `prefers-reduced-motion: reduce` faded de kaart
in plaats van te draaien.

## Wanneer wel

- Een compacte samenvatting vooraan, met meer detail op de achterkant
  (specialisatie-kaarten, teamleden, prijskaartjes met kleine lettertjes).
- Content waarbij "meer weten" een klein, losstaand extraatje is — geen
  content die verplicht gelezen moet worden (die staat gewoon zichtbaar).

## Wanneer niet

- Niet voor de enige plek waar belangrijke informatie staat: bezoekers die
  nooit hoveren of klikken, missen de achterkant. Herhaal essentiële info
  (prijs, contactgegevens) ook elders op de pagina.
- Niet voor lange, scrollbare tekst op de achterkant — de kaart heeft geen
  eigen scroll; gebruik in dat geval een gewone uitklapper (`accordions/`).

## Installatie

```
component-library/cards/flip-card/
├── flip-card.js       # vanilla ES-module, 0 dependencies
├── flip-card.css      # namespaced op .flip-card
├── FlipCard.tsx         # React/Next.js client-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./flip-card.css" />
<div class="flip-card">
  <div class="flip-card__inner">
    <div class="flip-card__face flip-card__face--front">
      <h3>Websites</h3>
      <p>Maatwerk, geen sjabloon.</p>
    </div>
    <div class="flip-card__face flip-card__face--back">
      <h3>Websites</h3>
      <p>Van sitemap tot livegang.</p>
    </div>
  </div>
  <button type="button" class="flip-card__toggle" aria-pressed="false" aria-label="Draai kaart Websites om">
    <span class="flip-card__toggle-icon" aria-hidden="true">⇄</span>
  </button>
</div>

<script type="module">
  import { init } from './flip-card.js';
  const destroy = init(document.body);
</script>
```

**React / Next.js**

```tsx
import { FlipCard } from '@/component-library/cards/flip-card/FlipCard';

<FlipCard
  toggleLabel="Draai kaart Websites om"
  front={<><h3>Websites</h3><p>Maatwerk, geen sjabloon.</p></>}
  back={<><h3>Websites</h3><p>Van sitemap tot livegang.</p></>}
/>
```

## Markup-contract

- `.flip-card` > `.flip-card__inner` > twee `.flip-card__face` (met
  `--front`/`--back`-modifier) + `.flip-card__toggle` (echte `<button>`,
  **buiten** `.flip-card__inner` — hij draait zelf niet mee, alleen zijn
  icoon).
- De knop heeft altijd `aria-pressed="false"` in de markup; de module
  bepaalt de echte waarde en zet hem live bij.
- Beide `.flip-card__face`-elementen staan in dezelfde grid-cel
  (`grid-area: 1/1`) — de kaart neemt daardoor altijd de hoogte van de
  hoogste kant aan, ongeacht welke kant zichtbaar is.
- De module zoekt met `querySelector('.flip-card__toggle')` binnen elke
  `.flip-card`; zonder die knop doet een kaart niets (geen crash, gewoon
  overgeslagen).

## Opties

`init(root)` heeft geen opties — het gedrag (hover op desktop, knop overal,
crossfade bij minder beweging) staat vast; kleur/maat via CSS-variabelen.

CSS-variabelen (op `.flip-card`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--fc-radius` | `1rem` | Hoekradius van beide kanten. |
| `--fc-border` | `#e3ded0` | Randkleur van de voorkant en de knop. |
| `--fc-duration` | `0.6s` | Duur van de 3D-draai. |
| `--fc-accent` | `#2f6fed` | Kleur van het knop-icoon en de focus-outline. |

## Toegankelijkheid

- **Echte knop, geen JS-klik op een div (R14).** `.flip-card__toggle` is een
  `<button>` met `aria-pressed` dat de echte staat weergeeft — een
  schermlezer hoort "Draai kaart Websites om, ingedrukt" zodra de achterkant
  toont. Tab bereikt hem, Enter/Spatie activeert hem (native knop-gedrag),
  `:focus-visible` geeft een 2px outline.
- **Verborgen kant is `inert` (niet alleen `aria-hidden`).** Zolang een kant
  niet getoond wordt, is hij met het `inert`-attribuut uitgesloten van
  focus, toetsenbordnavigatie én de accessibility-tree — een Tab-druk kan
  dus nooit op een link/tekst belanden die je niet ziet.
- **Minder beweging (R1).** Onder `prefers-reduced-motion: reduce` draait de
  kaart niet in 3D maar faded hij (opacity-crossfade, 0.25s) — de eindstand
  is meteen goed leesbaar, en de regel reageert live als de bezoeker de
  instelling middenin omzet.
- **Hover is een extra, geen vereiste.** Op desktop draait de kaart al bij
  hover, maar de knop werkt daar ook gewoon — wie liever met het
  toetsenbord werkt, hoeft niet over de kaart te bewegen.

## Op WordPress

Geen build-stap nodig. Zet de map in je thema, laad `flip-card.css` en
`flip-card.js` zoals in `scroll/reveal-on-scroll/README.md` (§ Op WordPress),
plaats de markup in een Custom HTML-blok of template, en roep
`init(document.body)` aan na `DOMContentLoaded`.

## Valkuilen

- **Interactieve content in `.flip-card__face`** (een eigen link of knop)
  wordt bij het tonen niet automatisch focusbaar — dat klopt, `inert`
  regelt dat zodra de kant zichtbaar wordt (`inert = false`), maar zet zulke
  content niet buiten de faces: dan mist hij de `inert`-bescherming en is
  hij altijd focusbaar, ook als zijn kant verborgen is.
- **`perspective` hoort op `.flip-card` zelf**, niet op `.flip-card__inner`
  — anders oogt de draai plat in plaats van 3D.
- **Twee kaarten met identieke content op voor- en achterkant** zijn zinloos
  voor bezoekers die nooit hoveren/klikken — zorg dat de achterkant altijd
  iets toevoegt.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
