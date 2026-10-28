# drag-carousel

Een scroll-snap-basis (native swipe werkt al zonder JS) met slepen-met-de-
muis, pijlen, stippen, een uitgelichte actieve dia, pijltjestoetsen en een
`aria-live`-statusregel. Plus een tweede, aparte variant: `continuous` — een
doorlopende, niet-interactieve strip die pauzeert bij hover, buiten beeld, of
`prefers-reduced-motion`.

## Wanneer wel

- **`.carousel`**: een rij cases, producten of teamleden waar de bezoeker
  zelf doorheen wil bladeren — op touch met een veeg, op desktop door te
  slepen, met de pijlen/stippen, of met het toetsenbord.
- **`.carousel-strip`**: een klantenlogo-balk of quote-band die decoratief
  meebeweegt, geen interactie nodig heeft, en niet de aandacht mag vasthouden
  (stopt dus zodra hij niet in beeld is of de bezoeker minder beweging wil).

## Wanneer niet

- `.carousel` niet voor twee of drie items die ook prima naast elkaar in een
  gewoon grid passen — een carousel verbergt dan alleen maar content achter
  een sleep-actie die niet iedereen probeert.
- `.carousel-strip` niet voor content die je wílt dat mensen lezen: een
  doorlopende strip is bedoeld om even op te vallen, niet om woord voor
  woord gevolgd te worden.

## Installatie

```
component-library/carousels/drag-carousel/
├── drag-carousel.js       # vanilla ES-module, 0 dependencies, beide varianten
├── drag-carousel.css      # namespaced op .carousel / .carousel-strip
├── DragCarousel.tsx        # React/Next.js client-wrappers (<DragCarousel>, <ContinuousStrip>)
├── demo.html              # de twee basisvarianten
├── demo-gridlijn.html     # schermbrede strip met gridlijn en voortgangsduim
└── test/meet.mjs
```

**Vanilla / elk framework** — zie `demo.html` voor de volledige markup van
beide varianten. Eén `init()` volstaat voor alle `.carousel` én
`.carousel-strip`-instanties binnen de root:

```html
<link rel="stylesheet" href="./drag-carousel.css" />
<!-- markup: zie § Markup-contract -->

<script type="module">
  import { init } from './drag-carousel.js';
  const destroy = init(document.body);
</script>
```

**React / Next.js**

```tsx
import { DragCarousel, ContinuousStrip } from '@/component-library/carousels/drag-carousel/DragCarousel';

<DragCarousel label="Cases van Studio Wester" slides={[<CaseCard key="1" />, <CaseCard key="2" />]} />
<ContinuousStrip items={[<span key="1">Klant A</span>, <span key="2">Klant B</span>]} />
```

## Markup-contract

**`.carousel` (interactief)**

- `.carousel` > `.carousel__viewport` (`role="region"`,
  `aria-roledescription="carousel"`, `aria-label="…"`, `tabindex="0"` — dít
  is het daadwerkelijk scrollende element, `overflow-x:auto` +
  `scroll-snap-type`) > `.carousel__track` (`<div>`) > per dia een
  `.carousel__slide` (`<div role="group" aria-roledescription="slide"
  aria-label="Dia N van M">`).
- `.carousel__controls` met `.carousel__arrow--prev`/`--next` (`<button>`)
  en `.carousel__dots` (per dia een `.carousel__dot`, `<button>`).
- `.carousel__status[data-carousel-status]` met `aria-live="polite"` — de
  module zet hier "Dia N van M" in; visueel verborgen (CSS clip-rect), wél
  voorgelezen.
- De module leest het aantal dia's uit `.carousel__track`'s directe
  kinderen — geen los dia-aantal doorgeven.

**`.carousel-strip` (continuous)**

- `.carousel-strip` (`overflow:hidden`) > `.carousel-strip__track` > twee
  keer dezelfde `.carousel-strip__group` — de **tweede** kopie krijgt
  `aria-hidden="true"` (R15: dubbele marquee-kopieën zijn decoratief voor
  screenreaders, de eerste groep draagt de echte inhoud).

## Opties

`init(root, opties)`. Zonder opties worden beide varianten herkend aan hun
klasse (`.carousel` / `.carousel-strip`) en gedragen ze zich vast; er
verandert niets aan bestaand gedrag. De twee opt-ins gelden voor de
interactieve `.carousel`:

| Optie | Attribuut op `.carousel` | Omschrijving |
|---|---|---|
| `voortgang` | `data-carousel-voortgang` | Voortgangsduim onder de viewport. Breedte = max(zichtbaar / totaal x 100, 10) %, positie volgt de scroll. Een eigen `.carousel__progress` met `.carousel__thumb` erin wordt hergebruikt; anders maakt de module hem (`aria-hidden`, want de statusregel meldt de voortgang al). |
| `gridlijn` | `data-carousel-grid="<selector>"` (leeg = `true`) | Gridlijn-modus (zie hieronder). `true` = de inhoud van het bovenliggende element, een selector of Element = de linkerkant van de inhoud van dat element, een getal = px vanaf de linkerkant van de viewport. |

### Gridlijn en voortgangsduim

Een strip die schermbreed loopt, maar waarvan kaart 1 op de gridlijn van de pagina moet beginnen (de lijn van de kop erboven):

```html
<div class="wrap"><h2>Cases</h2></div>
<div class="carousel" data-carousel-grid=".wrap" data-carousel-voortgang> … </div>
<script type="module">
  import { init } from './drag-carousel.js';
  init(document.querySelector('.carousel'));
</script>
```

- De module meet de afstand tussen de linkerkant van de viewport en de gridlijn en zet een **spacer** (`.carousel__spacer`, `aria-hidden`) vooraan die zo breed is (min de `gap`). Kaart 1 begint dan op de gridlijn; `scroll-padding-inline-start` (`--car-grid-offset`) laat het snappen dezelfde lijn gebruiken. Bij een resize of als het font geladen is, wordt de maat opnieuw bepaald (ResizeObserver + `fonts.ready`).
- **Pijlen, stippen en pijltjestoetsen** springen naar de gridlijn: volgende = de eerste kaart voorbij de lijn (+10 px), vorige = de laatste kaart ervoor (-10 px). Aan de randen krijgen de pijlen `aria-disabled="true"` (de knop blijft focusbaar) en doet een klik niets. Zonder de gridlijn-optie zet de module geen `aria-disabled`.
- Kaartbreedte: `--car-kaart` (standaard `min(20rem, 78%)`). In deze modus is er geen "actieve dia dimmen" meer; `is-active` en de statusregel volgen de kaart die het dichtst bij de gridlijn staat.
- De duim en de besturing staan op de grid-breedte (`--car-grid-offset` als marge). Minder beweging: de pijlen scrollen direct i.p.v. smooth.

CSS-variabelen (op `.carousel`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--car-radius` | `1rem` | Hoekradius van de viewport. |
| `--car-accent` | `#2f6fed` | Kleur van de actieve stip en focus-outlines. |

Animatieduur van de strip: `animation: carousel-strip-scroll 22s linear
infinite` op `.carousel-strip__track` — pas `22s` aan voor een snellere/
tragere doorloop.

## Toegankelijkheid

- **Toetsenbord (R14).** `.carousel__viewport` heeft `tabindex="0"`:
  ArrowLeft/ArrowRight navigeren, pijlen en stippen zijn echte `<button>`s
  (Tab/Enter/Spatie), en elke focus-stijl heeft een zichtbare 2px outline.
- **Focus in een dia.** Krijgt een link of knop in een dia focus, dan scrolt de hele dia in beeld (`scrollIntoView`, `inline: nearest`), niet alleen het gefocuste element.
- **"Dia x van y" voor screenreaders.** Elke `.carousel__slide` heeft
  `aria-roledescription="slide"` + `aria-label="Dia N van M"`, en de
  `aria-live`-statusregel herhaalt dat bij elke wissel (sleep, pijl, stip of
  toetsenbord) — ook als de wissel puur door scrollen kwam.
- **Sleep blokkeert geen klik in de dia.** Een sleepbeweging (>4px) wordt
  onderscheiden van een klik; alleen een échte klik (geen sleep) activeert
  een link/knop in een dia.
- **`continuous`-strip: R1 volledig.** Pauzeert bij hover (`pointerenter`),
  buiten beeld (IntersectionObserver) en bij `prefers-reduced-motion:
  reduce` — en reageert live als een van die drie tijdens het bekijken
  verandert. Een CSS-`@media`-vangnet zet de animatie sowieso op `none`
  onder reduced-motion, ook zonder JS.
- **Voortgangsduim en spacer** zijn decoratief (`aria-hidden`); de statusregel ("Dia x van y") blijft de enige voortgangsmelding voor schermlezers. Een uitgeschakelde pijl is `aria-disabled` en niet `disabled`, zodat de focus niet verspringt.
- Touch krijgt native swipe via `scroll-snap-type` — geen JS-drag-code
  nodig of actief op touch (de module herkent `event.pointerType ===
  'touch'` en doet daar niets mee).

## Op WordPress

Geen build-stap nodig. Zet de map in je thema, laad `drag-carousel.css` en
`drag-carousel.js` zoals in `scroll/reveal-on-scroll/README.md`
(§ Op WordPress), plaats de markup in een Custom HTML-blok of template, en
roep `init(document.body)` aan na `DOMContentLoaded`.

## Valkuilen

- **`.carousel__track` moet de directe kinderen zijn de dia's zelf** — een
  extra wrapper-laag ertussen breekt zowel de IntersectionObserver
  (`slides.indexOf(entry.target)`) als `goTo()` (`scrollIntoView`).
- **`.carousel-strip__group` twee keer met verschillende inhoud** breekt de
  naadloze loop — de animatie verschuift precies 50% (één groepsbreedte),
  dus beide groepen moeten identiek zijn.
- **Een dia breder dan de viewport** (bv. `flex-basis: 120%`) voorkomt dat
  scroll-snap ooit een volgend/vorig punt bereikt — houd `flex-basis` onder
  de 100% van `.carousel__viewport`.

- **Sleep met beelden in de dia.** Een `<img>` of link in een dia start anders de native sleep van de browser en breekt het slepen af; de module onderdrukt `dragstart` binnen de viewport (uitbreiding 26-10-2026, gemeten met kaarten met een beeld).

## Herkomst

Eigen implementatie op native CSS scroll-snap, zonder Swiper of andere dependency; de module voegt sleep-UI,
besturing en toegankelijkheid toe. De voortgangsduim en de gridlijn (2026-10-26) komen erbij voor een schermbrede
rij waarvan de eerste kaart op de lijn van de kop begint, met `aria-disabled` aan de randen, herberekening bij
resize en fonts, en een directe sprong bij minder beweging. (Herkomst ingekort voor deze openbare repo.)
