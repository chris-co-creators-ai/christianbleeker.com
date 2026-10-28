# voor-na-verhaal

Het werk van de klant in stappen. Het blok blijft staan (sticky) terwijl de
bezoeker scrolt; de foto gaat van "voor" via 1 tot 4 tussenstappen naar "na",
met per stap één korte zin ("Dag 1 — alles eruit"). De overgang is rustig
(crossfade of een zachte wisveeg) en volgt de bezoeker: er beweegt niets
vanzelf. Op elk moment kan de bezoeker ook zelf slepen of toetsen tussen voor
en na, of een stap aanklikken.

Zonder JavaScript staan alle stappen als gewone figuren met bijschrift onder
elkaar.

Energie: **rustig**. Vijf-punter: dit is het wow-moment van een site, dus
gebruik het één keer per pagina.

## Wanneer wel

- Een klant die vooral met een resultaat verkoopt: hovenier, aannemer,
  badkamer- of keukenbouwer, schilder, kapper of beauty (haar, huid), zorg
  (revalidatie), interieur.
- Je hebt 2 tot 6 foto's van één project **vanaf dezelfde plek** (zelfde
  camerastandpunt en kadrering; zie Valkuilen).
- Je wilt de bezoeker laten zien wat de klant doet, in plaats van het te
  beweren.

## Wanneer niet

- De foto's hebben verschillende kadrering of belichting: de overgang oogt
  dan als een diavoorstelling, niet als een verhaal. Gebruik dan een gewone
  galerij of lightbox.
- Een pagina die al meerdere pinned scroll-secties heeft (`stapelpanelen`,
  `horizontal-scroll-pin`): één pin per scherm is genoeg. Er mogen er twee
  van dit onderdeel op één pagina staan (zie demo), maar niet direct na elkaar.
- Voor het laten zien van een lijst projecten naast elkaar: gebruik een raster
  of `bento-grid`.

## Installatie

```
component-library/scroll/voor-na-verhaal/
├── voor-na-verhaal.js       # vanilla ES-module, 0 dependencies
├── voor-na-verhaal.css      # namespaced op [data-vnv] en .vnv-*
├── VoorNaVerhaal.tsx        # React/Next.js client-wrapper
├── demo.html                # zelfstandige demo (Hoveniers Wester)
├── media/                   # demo-foto's (webp, ± 250 kB per stuk)
└── test/meet.mjs            # Playwright-meting
```

De JS importeert `../../_kwaliteit/basis.js`; neem die map mee (of kopieer
`basis.js` en pas het importpad bovenin aan).

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./voor-na-verhaal.css" />
<section id="tuin" data-vnv aria-label="Voor-en-na van een achtertuin">
  <figure data-vnv-stap data-vnv-label="Voor">
    <img src="voor.webp" width="1562" height="1067" alt="Verwilderde tuin met onkruid" />
    <figcaption>Voor — onkruid en kapotte tegels</figcaption>
  </figure>
  <figure data-vnv-stap data-vnv-label="Na">
    <img src="na.webp" width="1562" height="1067" alt="Afgewerkte tuin met terras en border" loading="lazy" />
    <figcaption>Na — klaar voor de lente</figcaption>
  </figure>
</section>
<script type="module">
  import { init } from './voor-na-verhaal.js';
  const destroy = init(document.getElementById('tuin'));
  // destroy() bij opruimen: zet de figuren terug op hun plaats
</script>
```

**React / Next.js (App Router)**

```tsx
import { VoorNaVerhaal } from '@/component-library/scroll/voor-na-verhaal/VoorNaVerhaal';

<VoorNaVerhaal overgang="fade" titel="Achtertuin Diepenveen" label="Voor-en-na van een tuin">
  <figure data-vnv-stap data-vnv-label="Voor">…</figure>
  <figure data-vnv-stap data-vnv-label="Na">…</figure>
</VoorNaVerhaal>
```

Houd de children statisch: de module verplaatst de figuren tijdens het leven
van het onderdeel. Bij wijzigende props start de wrapper opnieuw (eerst
destroy, dan init).

**WordPress**

1. Zet de map in je thema:
   `wp-content/themes/<thema>/component-library/scroll/voor-na-verhaal/` én
   `.../component-library/_kwaliteit/basis.js` (het relatieve importpad blijft dan kloppen).
2. Laad css en module vanaf WordPress 6.5:

```php
add_action( 'wp_enqueue_scripts', function () {
	$dir = get_stylesheet_directory_uri() . '/component-library/scroll/voor-na-verhaal/';
	wp_enqueue_style( 'voor-na-verhaal', $dir . 'voor-na-verhaal.css', array(), '1.0.0' );
	wp_enqueue_script_module( 'voor-na-verhaal', $dir . 'voor-na-verhaal.js', array(), null );
} );
```

3. Plaats de markup in een Custom HTML-blok (of Elementor HTML-widget): de
   `<section data-vnv>` met de figuren erin. Roep `init` aan na
   `DOMContentLoaded`:

```html
<script type="module">
  import { init } from '/wp-content/themes/<thema>/component-library/scroll/voor-na-verhaal/voor-na-verhaal.js';
  document.addEventListener('DOMContentLoaded', () =>
    document.querySelectorAll('[data-vnv]').forEach((el) => init(el)));
</script>
```

Op WordPress < 6.5 laad je de module via `wp_footer`. Zie Valkuilen voor
caching-plugins en thema's met `overflow: hidden`.

## Markup-contract

- **Root**: een element met `data-vnv` (aanbevolen: `<section aria-label="…">`).
  Alles wat er buiten de figuren in staat blijft gewoon staan.
- **Stappen**: `<figure data-vnv-stap>` met een `<img>` en een `<figcaption>`.
  De volgorde in de HTML is de volgorde van de stappen; de eerste figuur is
  "voor", de laatste "na". Minimaal 2, aanbevolen 2 tot 6 (bij meer dan 6 wordt
  het een lange scrollreis en overlappen de labels).
- **Bijschrift**: staat er ` — ` (of ` – `) in, dan wordt het deel ervoor het
  label boven de zin ("Dag 1") en het deel erna de zin. Zonder streepje is het
  hele bijschrift de zin en het label "Stap n". `data-vnv-label` op de figuur
  overschrijft het label (ook in de stapknoppen). Houd labels kort
  (maximaal ± 8 tekens): ze staan onder de schuif naast elkaar.
- **Foto's**: geef `width` en `height` mee (geen layout-shift), en
  `loading="lazy"` op alle foto's behalve de eerste. Alle foto's zijn zichtbaar
  in een kader dat `object-fit: cover` gebruikt: zelfde camerastandpunt en
  beeldverhouding voor alle stappen.
- **Attributen op de root**: `data-vnv-overgang="fade|veeg"`,
  `data-vnv-schuif="false"`, `data-vnv-scroll-lengte="70"`,
  `data-vnv-overgangsdeel="0.55"`, `data-vnv-titel="…"` (alternatief voor de
  opties hieronder).
- **Attributen op een figuur**: `data-vnv-label`, `data-vnv-scroll-lengte`
  (scrollruimte van juist die stap, in svh).
- **Wat de module zelf zet** (en bij `destroy()` weer weghaalt):
  `data-vnv-klaar` (JS-poort voor de CSS), `data-vnv-actief` (index van de
  getoonde stap), `data-vnv-p` (voortgang, 0 tot aantal-1), `data-vnv-minder`
  (bij minder beweging). Op de root gaat ook een `vnv:stap`-event af
  (`detail: { index, figuur }`).

## Opties (`init(root, opties)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `overgang` | `'fade'` | `'fade'` = crossfade, `'veeg'` = de nieuwe foto schuift als een venster van links over de vorige (met een lijn en greep tijdens de veeg). |
| `schuif` | `true` | Toon de schuif (role="slider") onder de foto. Bij `false` blijven scroll en stapknoppen. |
| `scrollLengte` | `70` | Scrollruimte per stap in svh (1 = 1% van de schermhoogte). Bij 4 stappen is het spoor 280 svh boven de eigen schermhoogte. Per figuur te overschrijven. |
| `overgangsdeel` | `0.55` | Deel (0,15 tot 1) van die ruimte waarin de overgang loopt; de rest blijft de stap stilstaan. |
| `titel` | *(geen)* | Kleine regel boven de foto ("Achtertuin Diepenveen"). Decoratief (`aria-hidden`). |
| `opStap` | *(geen)* | `(index, figuur) => void`, aangeroepen als de getoonde stap wisselt. |
| `stapSelector` | `'[data-vnv-stap]'` | Selector voor de figuren binnen de root. |

CSS-variabelen op `[data-vnv]`:

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--vnv-top` | `0px` | Hoogte van een vaste site-header: het podium plakt daaronder. |
| `--vnv-fg`, `--vnv-fg-zacht`, `--vnv-lijn` | donkere inkt | Kleur van labels en lijnen onder de foto. Zet ze licht op een donkere sectie. |
| `--vnv-vlak` | `#efece5` | Achtergrondkleur van de sectie (randje om de duim). Zet gelijk aan je sectieachtergrond. |
| `--vnv-accent` | `#4a5fa8` | Kleur van duim, vulling en gepasseerde stappen. |
| `--vnv-kaart-bg`, `--vnv-kaart-fg`, `--vnv-kaart-kop` | crème/inkt | Kleuren van de kaart met de zin (contrast is 4,5:1 of beter, R16). |
| `--vnv-radius` | `1.25rem` | Hoekstraal van het beeldkader. |
| `--vnv-pad` | `clamp(1rem, 3.5vw, 3rem)` | Binnenmarge rond het podium. |
| `--vnv-duur` | `0.5s` | Duur van het wisselen van de zin in de kaart. |
| `--vnv-focus` | `50% 60%` | `object-position` van de foto's; verschuif als het onderwerp hoog of laag staat. |

## Toegankelijkheid

- **Schuif**: `role="slider"`, `tabindex="0"`, `aria-valuemin="0"`,
  `aria-valuemax="100"`, `aria-valuenow` en een `aria-valuetext` met het
  bijschrift van de stap ("Dag 3 — …, stap 3 van 4"). Toetsen: pijl links en
  rechts (of omlaag en omhoog) = 5%, Page Up en Page Down = volgende of
  vorige stap, Home en End = voor en na.
- **Stappenindicator**: echte `<button>`s in een `<nav aria-label="Stappen">`;
  Tab, Enter en Spatie werken; de actieve stap heeft `aria-current="step"`.
  Alle knoppen en de schuif hebben een zichtbare focusring van 2 px.
- **Schermlezer**: de `<figcaption>`s blijven in de DOM (visueel verborgen, niet
  weg), de kaart met dezelfde zin is `aria-hidden`. Zet zinnige `alt`-teksten
  op de foto's. De sectie zelf krijgt van jou een `aria-label`.
- **Minder beweging** (live gevolgd): geen crossfade, geen veeg, geen animatie
  van de kaart; de stappen wisselen direct. Schuif, toetsen en knoppen werken
  nog steeds.
- **Touch**: de schuif laat verticaal scrollen van de pagina toe
  (`touch-action: pan-y`); horizontaal slepen bedient de schuif. Tikken op een
  stap of op de schuif werkt.
- **Geen scroll-kaping**: het spoor is gewone paginahoogte. De bezoeker
  scrolt altijd zelf, kan op elk moment door, en het wiel of de swipe wordt
  nooit onderschept.
- **Contrast**: de zin staat op een effen kaart, niet direct op de foto.

## Valkuilen

- **`overflow` op een voorouder**: `position: sticky` werkt niet als een
  voorouder van de sectie `overflow: hidden`, `auto` of `scroll` heeft. Gebruik
  op de wrapper `overflow-x: clip` als je horizontaal wilt afknippen. Veel
  WordPress-thema's en page builders zetten `overflow: hidden` op de
  contentwrapper; test dat.
- **Vaste site-header**: zet `--vnv-top` op de hoogte van de header, anders
  schuift het podium eronder.
- **Dezelfde camerastandpunt** is de hele truc. Bij het fotograferen op locatie:
  statief of markering op de grond, zelfde brandpunt, liggend beeld. Maak
  je de beelden met AI (zoals de demo), bewerk dan steeds het eindbeeld
  ("edit of") zodat muur, hek en boom op dezelfde plek blijven.
- **Zelfde beeldverhouding**: de foto's worden bijgesneden tot het kader
  (`cover`); op mobiel is dat kader staand (3:4). Zet het onderwerp in het
  midden of stel `--vnv-focus` in. Laat belangrijke dingen niet aan de zijkant staan.
- **Aantal stappen**: 2 is een klassiek voor-en-na (gebruik `veeg`), 4 tot 5 is
  een verhaal. Meer dan 6 wordt een lange scrollreis.
- **Lengte van het spoor**: 4 stappen x 70 svh = 280 svh extra scrollen. Zet
  `scrollLengte` lager (40 tot 50) voor een kortere passage, hoger (90 tot 120)
  voor een trage.
- **Caching- en minify-plugins** (WP Rocket, Autoptimize) die `type="module"`
  strippen of JS bundelen breken de `import`: sluit de module uit of gebruik
  `wp_enqueue_script_module()`.
- **React**: verander de children niet terwijl het onderdeel draait (de figuren
  zijn dan verplaatst); wissel liever de `key` van de wrapper.

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.

## Demo-materiaal

De vier tuinfoto's in `media/` zijn gemaakt met Codex (`image_gen`, geen API)
uit één eindbeeld, met dezelfde camerapositie voor alle stappen. "Hoveniers
Wester" is een verzonnen voorbeeldbedrijf.
