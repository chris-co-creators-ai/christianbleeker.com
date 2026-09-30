# reislijn

Een of twee dunne lijnen lopen verticaal in de marge langs de hele pagina, met
een stip bij elke sectie. Het stuk lijn tot waar je gescrold hebt is getekend,
de rest staat er gestippeld. Bij een open FAQ-vraag of CTA buigt de lijn er
met een vloeiende bocht naartoe af. Op browsers met scroll-driven animations
draait het zonder scrollhandler; zonder JavaScript is er niets te zien en niets
dat de inhoud bedekt.

## Wanneer wel

- Lange verhaalpagina's met 4 tot 8 secties (over ons, werkwijze, dienst, FAQ)
  waar je de bezoeker een gevoel van voortgang wilt geven.
- Sites met een ruime linkermarge op desktop, zodat de lijn naast de tekst kan lopen.
- Als rustige rode draad in plaats van een zware voortgangsbalk.

## Wanneer niet

- Voor een kale voortgangsbalk of leesindicator: gebruik `scroll/scroll-progress`.
- Voor een genummerde werkwijze met een lijn die zich vult binnen één blok:
  gebruik `scroll/sticky-timeline`. Reislijn loopt over de hele pagina en werkt
  op secties, niet op stappen in één lijst.
- Op pagina's zonder marge (tekst loopt tot de rand) op desktop: de lijn zou de
  tekst raken. Zet dan `mobiel: 'uit'` en gebruik een smallere kolom, of laat hem weg.
- Bij meer dan 10 haltes: de stippen worden dan een rij kralen.

## Installatie

```
component-library/scroll/reislijn/
├── reislijn.js      # vanilla ES-module, 0 dependencies
├── reislijn.css     # namespaced op [data-reislijn] en .rl-*
├── Reislijn.tsx     # React/Next.js client-wrapper
├── demo.html        # zelfstandige demo (Studio Wester)
└── test/meet.mjs    # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./reislijn.css" />
<main id="pagina">
  <section data-reislijn-halte> <div data-reislijn-kolom> … </div> </section>
  <section data-reislijn-halte="2"> … </section>
</main>
<script type="module">
  import { init } from './reislijn.js';
  const destroy = init(document.querySelector('#pagina'), { lijnen: 2 });
  // destroy() bij unmount
</script>
```

**React / Next.js (App Router)**

```tsx
import { Reislijn } from '@/component-library/scroll/reislijn/Reislijn';

<Reislijn lijnen={2}>
  <section data-reislijn-halte>…</section>
  <section data-reislijn-halte="2">…</section>
</Reislijn>
```

**WordPress**

1. Kopieer de map naar `wp-content/themes/<thema>/component-library/reislijn/`.
2. Laad de CSS en de module:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'reislijn', get_stylesheet_directory_uri() . '/component-library/reislijn/reislijn.css', array(), '1.0.0' );
	wp_enqueue_script_module( 'reislijn', get_stylesheet_directory_uri() . '/component-library/reislijn/reislijn.js', array(), null );
} );
```

3. Geef in het thema de secties `data-reislijn-halte` (Custom HTML-blok of een
   `Extra HTML-attributen`-veld) en één kolom `data-reislijn-kolom`.
4. Roep `init(document.querySelector('main'))` aan na `DOMContentLoaded`.
   Sluit `reislijn.js` uit van JS-combinatie/minificatie (WP Rocket, Autoptimize),
   anders breekt de `import`.

## Markup-contract

| Attribuut | Waar | Betekenis |
|---|---|---|
| root (aan `init` gegeven) | wrapper om de hele pagina | Krijgt `data-reislijn`, `data-reislijn-route` en `data-reislijn-modus`; de laag wordt er als laatste kind aan toegevoegd |
| `data-reislijn-halte` | sectie | Krijgt een stip. Waarde `2` = stip op lijn 2 (alleen bij `lijnen: 2`), anders lijn 1 |
| `data-reislijn-kolom` | de tekstkolom (eerste match telt) | De lijn loopt `afstand` px links van de binnenkant ervan. Zonder kolom: vaste x van 24 px |
| `data-reislijn-anker` | element in een halte (optioneel) | Hoogte van de stip. Standaard de eerste `h1`, `h2` of `h3`, anders 40 px onder de sectiekop |
| `data-reislijn-ring` | halte (optioneel) | Kleur van de lege stip. Standaard de achtergrondkleur van de sectie |
| `data-reislijn-aftakking` | `<details>` of element met `aria-expanded` | Krijgt een bocht vanaf lijn 1 zolang het `open`, `aria-expanded="true"` of `data-open` heeft |

Kleur en maat via CSS-variabelen, op de root of hoger:

```css
[data-reislijn] {
  --rl-kleur-1: #3d6bf0;   /* lijn 1 en aftakking */
  --rl-kleur-2: #d99a1e;   /* lijn 2 */
  --rl-dun: rgb(128 128 118 / .42);  /* de gestippelde, nog niet gelopen lijn */
  --rl-lijn: 1.5px;
  --rl-punt: 12px;
}
```

Kies kleuren met genoeg contrast op zowel de lichte als de donkere secties;
de lijn loopt over beide heen.

## Opties

| Optie | Standaard | Betekenis |
|---|---|---|
| `route` | `'auto'` | `'auto'` kiest zelf, `'css'` of `'terugval'` forceert (voor tests). Zonder ondersteuning valt `'css'` terug op `'terugval'` |
| `lijnen` | `2` | Aantal lijnen, 1 of 2 |
| `kolom` | `'[data-reislijn-kolom]'` | Selector van de tekstkolom |
| `afstand` | `48` | Px tussen lijn 1 en de tekstkolom (desktop) |
| `lijnAfstand` | `18` | Px tussen lijn 1 en lijn 2 |
| `activatie` | `0.6` | Fractie van de viewporthoogte waarop de getekende lijn eindigt en een stip oplicht |
| `mobielTot` | `720` | Viewportbreedte (px) tot en met waar de mobiele modus geldt |
| `mobiel` | `'dun'` | `'dun'`: één dunne lijn tegen de linkerrand, geen aftakking. `'uit'`: helemaal weg |
| `xMobiel` | `7` | Mobiel: x van de lijn in px |

`init(root, opties)` geeft `destroy()` terug. Die ruimt alles op (laag, attributen,
listeners, observers) en is veilig om twee keer aan te roepen.

## Hoe het werkt

Er zijn drie routes; de root meldt de gekozen route in `data-reislijn-route`.

- **`css`**: de browser kent `animation-timeline: scroll()`. De JS rekent alleen
  de geometrie uit (waar begint en eindigt de lijn, bij welke scrollpositie licht
  welke stip op) en zet die als CSS-variabelen (`--rl-r0`, `--rl-r1`, `--rl-van`).
  Het tekenen en het oplichten is een scroll-gebonden CSS-animatie. Er is geen
  scroll-, wheel- of rAF-lus.
- **`terugval`**: één passieve scrolllistener via `perFrame` (één rAF per frame)
  zet de lengte van de getekende lijn; een IntersectionObserver zet de stippen.
- **`statisch`** (minder beweging): de lijn staat er volledig; een stip is gevuld
  zodra zijn sectie de activatielijn voorbij is, zonder transitie.

Paden worden uit de posities van de haltes berekend en opnieuw berekend bij
resize, bij hoogtewijzigingen (ResizeObserver op de root, `<html>`, haltes en
aftakkingen), bij het laden van lettertypen en bij het openen of sluiten van een
aftakking (MutationObserver op `open`, `aria-expanded`, `data-open`).

De laatste sectie haalt de activatielijn vaak nooit; die stip is daarom gevuld
zodra je onderaan de pagina bent.

## Toegankelijkheid

- De hele laag is decoratie: `aria-hidden="true"`, `pointer-events: none`, geen
  focusbare elementen. De inhoud verandert niet en schermlezers merken niets.
- Minder beweging (`prefers-reduced-motion: reduce`): geen animatie en geen
  transitie, de lijn staat volledig en stippen zijn gevuld zodra ze in beeld zijn.
  Zet de bezoeker de voorkeur halverwege om, dan schakelt de route live mee.
- Kleur is nooit de enige drager: een gevulde stip verschilt van een lege in
  vorm (vol tegenover omlijnd), niet alleen in tint.
- Zonder JavaScript bestaat de laag niet: niets zichtbaar, niets dat de inhoud bedekt.

## Valkuilen

- **Marge nodig**: op desktop moet er links van `data-reislijn-kolom` minstens
  ongeveer `afstand` + 10 px ruimte zijn. Anders raakt de lijn de rand van het scherm;
  de code houdt hem op minimaal 10 px van de linkerrand.
- **Root moet de hele pagina omvatten** (of het deel waarover de lijn loopt).
  De laag is zo hoog als de root. Heeft de root `overflow: hidden` en een
  vaste hoogte, dan wordt de lijn afgeknipt.
- **De root krijgt `position: relative`** (via de CSS). Zet je zelf `position: static`
  met een hogere specificiteit, dan staat de laag op de verkeerde plek.
- **Aftakkingen** lopen altijd vanaf lijn 1 en verschijnen alleen op desktop.
  De open vraag moet zo ver naar rechts staan dat er minstens 30 px tussen lijn 1
  en het element zit (in de demo staat de FAQ 72 px ingesprongen).
- **Afbeeldingen zonder afmetingen** verschuiven de pagina nadat de lijn is
  uitgerekend. De ResizeObserver corrigeert dat, maar geef afbeeldingen toch `width`/`height`.
- **Doorschijnende secties**: de lege stip neemt de achtergrondkleur van zijn
  sectie (`--rl-ring`). Zie je de kleur van de pagina in plaats van van de
  sectie, zet dan `data-reislijn-ring` op de halte.
- **Safari en oudere browsers** kennen `animation-timeline` (nog) niet overal;
  dan draait automatisch de terugval. Test beide met `route: 'terugval'`.

## Meten

```
node scroll/reislijn/test/meet.mjs
```

Dekt: stippen in de juiste volgorde op 4 scrollposities, groeiende lijn,
aftakking open/dicht, herberekening na resize en hoogtewijziging, CSS-route én
terugval (geforceerd en via ontbrekende ondersteuning), minder beweging (ook live
omzetten), mobiel 390 px (overflow via `clientWidth`, geen overlap met tekst),
geen klikken opgevangen, `destroy()`, zonder JS, en 0 console- en pageerrors.
De screenshots staan in `test/bewijs/`.

## Herkomst

Eigen implementatie; patroon gezien op een andere site: twee lijnen (blauw en geel) met stippen per
sectie en een aftakking naar de open FAQ-vraag. Daar tekenen ze een vaste SVG-laag die met een scroll-tijdlijn
meeschuift. Eigen implementatie, geen code overgenomen.

Wat wij anders doen: de lijn ligt in de pagina zelf (één hoge laag, geen vaste
viewportlaag die over de inhoud kan vallen), het tekenen loopt op de lengte van het
pad tot de activatielijn in plaats van een verschuiving, er is een volledige
terugval zonder scroll-tijdlijnen, de stippen lichten op precies waar hun sectie
de activatielijn passeert, en de mobiele variant schuift geen tekst op.
