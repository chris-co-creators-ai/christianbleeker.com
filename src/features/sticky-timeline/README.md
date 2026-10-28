# sticky-timeline

Een genummerde werkwijze-tijdlijn (01–0N): een verticale lijn die zich vult
terwijl de bezoeker scrolt, een stip per stap die "aan" gaat zodra die stap
de activatielijn passeert, en een gestickte "Stap X van N"-indicator.

## Wanneer wel

- Een "hoe we werken"-sectie met 3–6 vaste stappen (intake, ontwerp, bouw,
  oplevering) — precies het soort content waar deze visuele metafoor van
  "voortgang door een proces" bij past.
- Content die ook prima een gewone, statische lijst zou zijn — de tijdlijn
  is een visuele laag bovenop een `<ol>`, geen vervanging ervan.

## Wanneer niet

- Niet voor meer dan ~6 stappen: de lijn wordt dan zo lang dat de
  "vul-tijdens-scrollen"-metafoor zijn betekenis verliest (het duurt te
  lang voor de volgende stip aan gaat).
- Niet voor stappen die geen vaste volgorde hebben — een `<ol>` communiceert
  volgorde; gebruik een gewone lijst/grid als de items door elkaar mogen.

## Installatie

```
component-library/scroll/sticky-timeline/
├── sticky-timeline.js       # vanilla ES-module, 0 dependencies
├── sticky-timeline.css      # namespaced, verticaal + optioneel horizontaal
├── StickyTimeline.tsx        # React/Next.js client-wrapper (rendert de <ol> uit `steps`)
├── demo.html                  # zelfstandige demo (vier stappen)
└── test/meet.mjs              # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./sticky-timeline.css" />
<div data-sticky-timeline-root>
  <p data-sticky-timeline-status aria-hidden="true">Stap <span data-stl-status-num>1</span> van <span data-stl-status-total>4</span></p>
  <div data-sticky-timeline-track>
    <div data-sticky-timeline-line aria-hidden="true"><div data-sticky-timeline-line-fill></div></div>
    <ol data-sticky-timeline>
      <li data-sticky-timeline-step>
        <span data-sticky-timeline-dot aria-hidden="true"></span>
        <span data-sticky-timeline-num aria-hidden="true">01</span>
        <h3>Intake</h3>
        <p>…</p>
      </li>
      <!-- … -->
    </ol>
  </div>
</div>
<script type="module">
  import { init } from './sticky-timeline.js';
  const destroy = init(document.querySelector('[data-sticky-timeline-root]'));
</script>
```

**React / Next.js (App Router)**

```tsx
import { StickyTimeline } from '@/component-library/scroll/sticky-timeline/StickyTimeline';

<StickyTimeline
  steps={[
    { title: 'Intake', text: 'Een gesprek van een uur.' },
    { title: 'Ontwerp', text: 'Direct in de browser, met echte inhoud.' },
    { title: 'Bouw', text: 'Korte sprints, met een demo per sprint.' },
    { title: 'Oplevering', text: 'Een korte uitleg-sessie.' },
  ]}
/>
```

## Markup-contract

- Root: `[data-sticky-timeline-root]` — het element dat je aan `init(root)`
  geeft.
- `[data-sticky-timeline-track]` — wrapper die de lijn en de lijst samen
  positioneert (`position: relative`).
- `[data-sticky-timeline-line]` + `[data-sticky-timeline-line-fill]` — de
  achtergrondlijn en de vulling; de module zet `--stl-progress` (0–1) op de
  root, de CSS schaalt de vulling daarmee (`scaleY`, of `scaleX` in de
  horizontale variant).
- `<ol data-sticky-timeline>` — de **echte** geordende lijst. Dit geeft
  screenreaders gratis "lijst, N items" / "item X van N" (R-eis "ol-semantiek")
  zonder extra `aria`.
- `<li data-sticky-timeline-step>` — één stap, met daarin
  `[data-sticky-timeline-dot]` (decoratief, `aria-hidden`) en
  `[data-sticky-timeline-num]` (decoratief nummer, `aria-hidden` — de
  volgorde zit al in de `<ol>`, dit nummer is puur visueel).
- `[data-sticky-timeline-status]` (optioneel) + `[data-stl-status-num]` /
  `[data-stl-status-total]` — de gestickte "Stap X van N"-indicator, ook
  decoratief (`aria-hidden`) omdat dezelfde informatie al in de `<ol>` zit.
- `data-sticky-timeline-orientation="horizontal"` (optioneel, op de root) —
  schakelt op desktop (≥52rem) naar een horizontale rij; onder die breedte
  blijft het altijd verticaal (mobiel-eerst, R-eis "mobiel verticaal").

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `activationRatio` | `0.5` | Fractie van `window.innerHeight` waarop de "activatielijn" ligt (0 = boven in beeld, 1 = onderaan) — hier passeert een stap van "nog niet aan" naar "aan". |

## Toegankelijkheid

- `<ol>`/`<li>` geven de juiste lijst-semantiek automatisch — geen extra
  `aria` nodig voor de volgorde zelf.
- Alle decoratie (stip, nummer, de gestickte statusindicator) is
  `aria-hidden="true"` — een screenreader leest de titel/tekst van elke
  stap, niet de visuele duplicaten daarvan.
- `prefers-reduced-motion: reduce`: de vul- en stip-overgangen worden
  instant (geen `transition`) — de voortgang zelf blijft altijd 1-op-1
  gekoppeld aan de scrollpositie, dus er is nooit een aparte "spring naar
  het eind"-stap nodig.

## Op WordPress

Geen build-stap nodig.

**1. Bestanden plaatsen**

```
wp-content/themes/<jouw-thema>/component-library/sticky-timeline/
├── sticky-timeline.css
└── sticky-timeline.js
```

**2. Laden**

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'sticky-timeline-style',
		get_stylesheet_directory_uri() . '/component-library/sticky-timeline/sticky-timeline.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'sticky-timeline-module',
		get_stylesheet_directory_uri() . '/component-library/sticky-timeline/sticky-timeline.js',
		array(),
		null
	);
} );
```

**3. Markup + init** — plaats de markup uit "Installatie" in een Custom
HTML-blok, en roep `init()` aan ná `DOMContentLoaded` (zie reveal-on-scroll
README voor het volledige WordPress-recept).

## Valkuilen

- **Te weinig stappen na elkaar** (1–2) geeft nauwelijks een "vul"-effect
  te zien — de tijdlijn heeft er minstens 3 nodig om zijn nut te bewijzen.
- **De horizontale variant activeert de stippen niet per stap.** De
  vul-berekening is scroll-gebaseerd (verticaal); in de horizontale layout
  staan alle stappen op dezelfde hoogte, dus ze gaan daar vrijwel
  gelijktijdig "aan" zodra de sectie de activatielijn passeert, in plaats
  van na elkaar. Voor een echt sequentiële horizontale activatie is een
  aparte, breedte-gebaseerde berekening nodig — niet gebouwd (buiten scope
  van "optioneel horizontaal"); gebruik de verticale variant als de
  volgorde van het "aan"-gaan er echt toe doet.
- **`[data-sticky-timeline-status]` weglaten** is prima — de module checkt
  of het element bestaat vóór hij het bijwerkt, en de rest werkt gewoon door.

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.
