# image-menu

Fullscreen beeldmenu: links de menu-items, rechts een beeld. Hoveren (muis)
én focussen (toetsenbord) van een item wisselt zowel het beeld als de
achtergrondkleur van het hele paneel — beide via data-attributen op de link
zelf. Beelden worden vooraf geladen zodra het menu voor het eerst opent.
Ankerlinks sluiten het menu.

## Wanneer wel

- Een merkgedreven hoofdmenu met een klein aantal diensten/secties (3–6),
  waar elke sectie een eigen sfeerbeeld en kleur verdient.
- Sites met genoeg beeldmateriaal om elk menu-item een eigen, betekenisvolle
  foto te geven — geen stockfoto's zonder verband met de tekst.

## Wanneer niet

- Voor een lange lijst menu-items of submenu's — het beeldmenu is ontworpen
  voor een handvol grote items, niet voor een uitgebreide sitemap.
- Op sites zonder goed beeldmateriaal: een leeg of onduidelijk beeld
  ondermijnt het hele idee. Gebruik dan `navigation/flip-side-menu`.
- Niet zonder alt-tekst per beeld (`data-im-alt`) — het beeld draagt hier
  betekenis, geen decoratie.

## Installatie

```
component-library/navigation/image-menu/
├── image-menu.js     # vanilla ES-module, 0 dependencies
├── image-menu.css    # namespaced op .im / .im__*
├── ImageMenu.tsx      # React/Next.js client-wrapper
├── demo.html          # zelfstandige demo
└── test/meet.mjs      # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./image-menu.css" />
<div class="im" id="im">
  <button type="button" class="im__button" aria-expanded="false" aria-controls="im-panel" data-im-button>Menu</button>
  <div id="im-panel" class="im__panel" data-im-panel>
    <div class="im__content">
      <nav class="im__nav" aria-label="Hoofdmenu">
        <ul class="im__list" data-im-list>
          <li><a href="#diensten" data-im-image="/img/diensten.jpg" data-im-alt="Diensten" data-im-color="#114232" aria-current="page">Diensten</a></li>
          <li><a href="#contact" data-im-image="/img/contact.jpg" data-im-alt="Contact" data-im-color="#5c0a11">Contact</a></li>
        </ul>
      </nav>
      <div class="im__visual" data-im-visual>
        <img src="/img/diensten.jpg" alt="Diensten" />
      </div>
    </div>
  </div>
</div>
<script type="module">
  import { init } from './image-menu.js';
  const destroy = init(document.getElementById('im'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { ImageMenu } from '@/component-library/navigation/image-menu/ImageMenu';

<ImageMenu
  links={[
    { href: '#diensten', label: 'Diensten', image: '/img/diensten.jpg', imageAlt: 'Diensten', color: '#114232', active: true },
    { href: '#contact', label: 'Contact', image: '/img/contact.jpg', imageAlt: 'Contact', color: '#5c0a11' },
  ]}
/>
```

## Markup-contract

- Root-element: bevat **verplicht** `[data-im-button]`, `[data-im-panel]`,
  `[data-im-list]` (de container met de links) en `[data-im-visual]` met
  daarin een `<img>` — ontbreekt één van deze → console-waarschuwing, de
  module doet niets (R5).
- Elke link die in het beeldmenu meedoet krijgt:
  - `data-im-image` — pad naar het beeld (verplicht om mee te doen).
  - `data-im-alt` — alt-tekst voor dat beeld (optioneel, standaard leeg).
  - `data-im-color` — achtergrondkleur van het paneel bij hover/focus op
    deze link (optioneel; CSS-kleurwaarde, bv. `#114232`).
  - `aria-current="page"` op precies één link markeert de standaardstand
    (beeld + kleur die te zien zijn vóór hover/focus, en waar het menu naar
    terugkeert als de muis de lijst verlaat).
- Klikken op een link (of Enter op een gefocuste link) sluit het menu en zet
  `aria-current="page"` op die link.

## Opties

Geen — het gedrag volgt volledig uit de markup. `init(root)` neemt geen
tweede argument.

## Toegankelijkheid

- **Hover én focus** wisselen het beeld — dit is geen muis-only-effect
  (R3): Tabben door de lijst wisselt het beeld precies zoals hoveren dat
  doet, via dezelfde `setActive()`-functie.
- **Dialoog-a11y**: `aria-expanded` op de knop, `aria-hidden`/`inert` op het
  gesloten paneel, een Tab/Shift+Tab-focus-trap zolang het paneel open is,
  **Escape** sluit en zet de focus terug op de knop, scroll-lock wordt
  hersteld bij sluiten. Omdat het paneel bewust fullscreen is, is er geen
  "gebied ernaast" om op te klikken — in plaats daarvan sluit een klik op de
  **padding rond de content** (het paneel zelf, niet de nav/het beeld) het
  menu, hetzelfde idee als een dialoogbackdrop.
- Het beeld zelf (`<img>` in `.im__visual`) is inhoudelijk (geen decoratie)
  — vandaar `data-im-alt` per link in plaats van een generieke
  `aria-hidden="true"`.
- Reduced motion: paneel-, kleurlaag- en linktransities vallen weg; het
  eindbeeld (open/dicht, actief item) is direct het juiste.

## Op WordPress

Geen build-stap nodig.

1. Zet `image-menu.css`/`.js` in je thema.
2. Enqueue met `wp_enqueue_style()` + `wp_enqueue_script_module()` (WP ≥
   6.5), zónder versienummer op de module (zelfde valkuil als
   `reveal-on-scroll`).
3. Plaats de markup uit "Markup-contract" in een headertemplate of Custom
   HTML-blok en roep `init()` aan ná `DOMContentLoaded`.

## Valkuilen

- **Beelden vooraf laden ≠ bij het laden van de pagina.** De module
  preload pas zodra het menu voor het eerst geopend wordt (`preloadImages()`
  in `openMenu()`), niet meteen bij `init()` — dat voorkomt onnodig
  dataverbruik voor bezoekers die het menu nooit openen, en toch is de
  eerste hover binnen het geopende menu instant (de browser-cache heeft de
  beelden dan al binnen).
- **`data-im-color` vergeten**: geen probleem — die link krijgt gewoon geen
  kleurlaag, het paneel houdt de kleur van het laatst actieve item (of de
  standaardkleur `--im-bg-default`).
- **Zelfde postcode-crash als bij Mobisolar vermeden**: de originele
  MDW-snippet crasht zonder null-check als een verwacht element ontbreekt
  (zie DOSSIER). Hier stopt `init()` met een waarschuwing in plaats van een
  crash zodra `[data-im-visual]` of de `<img>` erin ontbreekt (R5).
- **Op mobiel valt het beeld weg** (`display: none` onder 48rem) — dat is
  bewust (R19: geen half-geladen beeld dat de layout op een klein scherm
  verstoort), niet een bug.

## Herkomst

Gedrag gezien bij Webstijn-klant **Mobisolar**
(`research/webstijn/portfolio/mobisolar/DOSSIER.md`, feature 1 "Beeldmenu
(fullscreen)"): een MDW-snippet die bij `hover` met jQuery de spacer-widget
met dezelfde index opzoekt, diens achtergrondkleur leest en op het menu zet,
plus een `--index`-gestaffelde inkomst en automatisch sluiten bij
anker-links. Niet gekopieerd: eigen implementatie.

**Wat wij beter doen**: geen index-matching tussen twee aparte
widget-structuren (foutgevoelig zodra iemand een item toevoegt/verwijdert) —
hier dragen `data-im-image`/`data-im-color` gewoon rechtstreeks op de link.
De achtergrondkleur wisselt via opacity-crossfade tussen vooraf aangemaakte
kleurlagen in plaats van een `background-color`-transitie (R18: alleen
transform/opacity animeren). En: een volledige focus-trap, Escape en
backdrop-klik, die de MDW-snippet niet heeft — en, in tegenstelling tot het
postcodeveld-script op dezelfde site, crasht deze module niet als een
verwacht element ontbreekt.
