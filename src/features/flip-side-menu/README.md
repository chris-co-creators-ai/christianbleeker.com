# flip-side-menu

Knop "MENU" klapt met een 3D-rotatie (rotateX) om naar "SLUIT". Een zijpaneel
groeit vanuit de knop (`transform: scale`, met `transform-origin` op de
knop-positie), de menu-items klappen daarna gestaffeld omhoog, en een pijltje
schuift in bij hover/focus. Achter het paneel verschijnt een scrim
(verduistering) over de rest van de pagina — dat maakt "klik buiten sluit"
betekenisvol. Volledig een dialoog: focus-trap, Escape sluit, klik op de
scrim sluit, focus komt terug op de knop, scroll-lock wordt hersteld.

## Wanneer wel

- Een fullscreen (of bijna-fullscreen) hoofdmenu met een klein aantal grote,
  uitgesproken menu-items — een "statement"-menu in plaats van een dropdown.
- Sites waar het menu-moment zelf een merkmoment mag zijn (groot lettertype,
  eigen kleur).

## Wanneer niet

- Voor een compacte, altijd-zichtbare navigatie zonder open/dicht-moment —
  gebruik dan `navigation/pill-nav`.
- Voor een menu met veel items (>8) of submenu's — het gestaffelde
  omhoog-klappen wordt dan traag en rommelig; gebruik een eenvoudiger
  uitklapmenu.
- Niet zonder de focus-trap/Escape-afhandeling uit dit bestand over te nemen
  als je het gedrag zelf nabouwt — dat is precies wat de MDW-referentie
  (zie Herkomst) niet regelt.

## Installatie

```
component-library/navigation/flip-side-menu/
├── flip-side-menu.js     # vanilla ES-module, 0 dependencies
├── flip-side-menu.css    # namespaced op .fsm / .fsm__*
├── FlipSideMenu.tsx      # React/Next.js client-wrapper
├── demo.html             # zelfstandige demo
└── test/meet.mjs         # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./flip-side-menu.css" />
<div class="fsm" id="fsm">
  <button type="button" class="fsm__button" aria-expanded="false" aria-controls="fsm-panel" data-fsm-button>
    <span class="fsm__button-face" data-fsm-face="closed" aria-hidden="true">MENU</span>
    <span class="fsm__button-face" data-fsm-face="open" aria-hidden="true">SLUIT</span>
    <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">Menu</span>
  </button>
  <div id="fsm-panel" class="fsm__panel" data-fsm-panel>
    <nav class="fsm__nav" aria-label="Hoofdmenu">
      <ul class="fsm__list">
        <li data-fsm-item><a href="#diensten">Diensten<span class="fsm__arrow" aria-hidden="true">→</span></a></li>
        <li data-fsm-item><a href="#contact">Contact<span class="fsm__arrow" aria-hidden="true">→</span></a></li>
      </ul>
    </nav>
  </div>
</div>
<script type="module">
  import { init } from './flip-side-menu.js';
  const destroy = init(document.getElementById('fsm'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { FlipSideMenu } from '@/component-library/navigation/flip-side-menu/FlipSideMenu';

<FlipSideMenu
  links={[
    { href: '#diensten', label: 'Diensten' },
    { href: '#werkwijze', label: 'Werkwijze' },
    { href: '#contact', label: 'Contact' },
  ]}
  meta="Studio Wester · hallo@studiowester.nl"
/>
```

## Markup-contract

- Root-element: bevat **verplicht** `[data-fsm-button]` (de knop) en
  `[data-fsm-panel]` (het paneel). Ontbreekt één van beide → de module logt
  een waarschuwing en doet niets (R5).
- Knop: twee `<span class="fsm__button-face" data-fsm-face="closed"|"open">`
  binnen `[data-fsm-button]` — beide `aria-hidden="true"` (puur decoratief,
  R15), plus een apart, altijd-aanwezig visueel-verborgen label ("Menu") voor
  schermlezers. De knopstatus zelf communiceert via `aria-expanded`, dat de
  module zet — niet via de zichtbare MENU/SLUIT-tekst.
- Paneel: elk item dat gestaffeld moet klappen krijgt `data-fsm-item` (de
  module zet er zelf `--fsm-index` op). Ankerlinks (`<a href="#...">`) binnen
  het paneel sluiten het menu automatisch bij klikken.
- De module zet zelf `id`/`aria-controls` niet — geef beide zelf mee zodat
  `aria-controls` naar het juiste paneel-`id` wijst (zie voorbeeld hierboven;
  `FlipSideMenu.tsx` genereert het `id` met `useId()`).
- De module maakt zelf een `.fsm__scrim`-element aan (vóór het paneel in de
  DOM) — die hoef je niet in de markup te zetten. `destroy()` verwijdert hem
  weer.
- Root krijgt tijdens openstaan `[data-fsm-open]` — daar stuurt de CSS op.

## Opties

Geen — het gedrag volgt volledig uit de markup. `init(root)` neemt geen
tweede argument.

## Toegankelijkheid

- **Dialoog-a11y volledig aanwezig**: `aria-expanded` op de knop,
  `aria-controls` (zelf in de markup te zetten) naar het paneel-`id`,
  `aria-hidden`/[`inert`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/inert)
  op het gesloten paneel (onbereikbaar met Tab en voor schermlezers), een
  Tab/Shift+Tab-focus-trap zolang het paneel open is, **Escape** sluit en
  zet de focus terug op de knop, en een klik/tik op de **scrim** (buiten het
  paneel en de knop) sluit ook.
- **Scroll-lock hersteld**: bij openen zet de module
  `document.documentElement.style.overflow = 'hidden'`, bij sluiten (of bij
  `destroy()`) komt de oorspronkelijke waarde terug — nooit hardcoded op
  `''`, voor het geval een andere component al iets anders had gezet.
- Klikken op een ankerlink in het paneel sluit het menu zónder de focus terug
  naar de knop te sturen (de browser springt naar het anker; de focus hoeft
  niet terug, dat zou de sprong "ongedaan" laten voelen).
- Reduced motion: alle transities vallen weg (`transition: none !important`),
  het eindbeeld (open of dicht) is direct het juiste.

## Op WordPress

Geen build-stap nodig.

1. Zet `flip-side-menu.css`/`.js` in je thema.
2. Enqueue met `wp_enqueue_style()` + `wp_enqueue_script_module()` (WP ≥
   6.5), zónder versienummer op de module (zelfde valkuil als
   `reveal-on-scroll`).
3. Plaats de markup uit "Markup-contract" in een headertemplate of Custom
   HTML-blok en roep `init()` aan ná `DOMContentLoaded`.

## Valkuilen

- **`inert` in oude browsers**: `inert` wordt breed ondersteund in moderne
  Chromium/Firefox/Safari (2023+). In een zeer oude browser werkt de
  focus-trap nog steeds (Tab/Shift+Tab worden afgevangen), alleen blijft het
  gesloten paneel dan in theorie via muis-hover bereikbaar — verwaarloosbaar
  omdat het ook `opacity: 0` + `pointer-events: none` heeft.
- **`aria-controls` zelf zetten**: de module genereert geen `id`. Vergeet je
  dit, dan blijft de knop functioneel werken, maar mist een schermlezer de
  koppeling tussen knop en paneel.
- **Panel-achtergrond ondoorzichtig houden**: het paneel is `position:
  fixed; inset: 0` met een volle achtergrondkleur — zonder die achtergrond
  (bijvoorbeeld als je `--fsm-bg` op `transparent` zet) blijft de
  onderliggende pagina scrollbaar ondanks de scroll-lock-styling, en oogt het
  paneel kapot.
- **Veel `data-fsm-item`'s**: de stagger-vertraging loopt lineair op
  (`index * 70ms`) — bij >8 items duurt het laatste item merkbaar lang voor
  hij verschijnt. Houd het menu kort (zie "Wanneer niet").

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
