# marquee

Eén marquee-motor met vier varianten (`giant`, `tilted`, `ticker`, `logos`) —
een oneindig doorlopende band tekst, iconen of logo's. De snelheid staat in
pixels per seconde en blijft gelijk, ongeacht hoe breed de inhoud is.

## Wanneer wel

- Een lopende band met diensten, klantnamen of een statusregel
  ("Wij werken nu aan: …") die decoratief is, niet de enige plek waar die
  informatie staat.
- Een reeks logo's van klanten of partners die je niet allemaal tegelijk op
  één rij kwijt kunt.

## Wanneer niet

- Niet voor content die de bezoeker **moet** lezen om verder te kunnen (een
  waarschuwing, een foutmelding, een belangrijke actie) — een marquee is
  per definitie vluchtig.
- Niet voor lange, complexe zinnen in de `giant`-variant: bij 10–20vw
  lettergrootte is een zin van meer dan een paar woorden nauwelijks in één
  keer leesbaar.

## Installatie

```
component-library/scroll/marquee/
├── marquee.js       # vanilla ES-module, 0 dependencies
├── marquee.css      # namespaced op data-attributen, vier varianten
├── Marquee.tsx       # React/Next.js client-wrapper
├── demo.html         # zelfstandige demo (alle vier varianten)
└── test/meet.mjs     # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./marquee.css" />
<div data-marquee data-marquee-variant="ticker" data-marquee-speed="60">
  <div data-marquee-track>
    <span data-marquee-item>Wij werken nu aan: …</span>
  </div>
</div>
<script type="module">
  import { init } from './marquee.js';
  const destroy = init(document.querySelector('[data-marquee]'));
</script>
```

**React / Next.js (App Router)**

```tsx
import { Marquee } from '@/component-library/scroll/marquee/Marquee';

<Marquee variant="giant" speed={90}>
  <span data-marquee-item>Websites</span>
  <span data-marquee-icon aria-hidden="true">✺</span>
  <span data-marquee-item>Workshops</span>
</Marquee>
```

## Markup-contract

- Root: `[data-marquee]` — het element dat je aan `init(root)` geeft.
- Verplicht kind: `[data-marquee-track]`, met de items als **directe**
  kinderen. De module verplaatst die items eenmalig in een eigen
  groep-wrapper (`[data-marquee-group]`) om ze als geheel te kunnen klonen —
  raak de track dus niet meer aan ná `init()`.
- Items: gewone elementen (`<span>`, `<a>`, …), geef ze `data-marquee-item`
  voor de variant-styling. Decoratieve scheidingstekens/iconen krijgen
  `data-marquee-icon` + `aria-hidden="true"`.
- De module zet zelf `data-marquee-variant`, `data-marquee-direction` en
  (zodra de kopieën staan) `data-marquee-ready` op de root — die laatste is
  de `.js`-gating: zónder dat attribuut (geen JS, of "minder beweging")
  toont de CSS de items gewoon als een wrappende rij, zonder animatie.
- Gekloonde kopieën krijgen automatisch `aria-hidden="true"` (R15) — de
  echte tekst staat één keer, onverborgen, in de oorspronkelijke groep.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `variant` | attribuut `data-marquee-variant`, anders `"ticker"` | `giant` \| `tilted` \| `ticker` \| `logos`. |
| `speed` | attribuut `data-marquee-speed`, anders `80` | Pixels per seconde. Blijft gelijk ongeacht de contentbreedte — de module berekent de animatieduur zelf uit de gemeten breedte van één groep (`afstand / snelheid`). |
| `direction` | attribuut `data-marquee-direction`, anders `"left"` | `left` \| `right`. |

CSS-variabelen: `--marquee-gap` (ruimte tussen items, standaard `2rem`),
`--marquee-tilt` (alleen `tilted`, standaard `-3deg`).

## Toegankelijkheid

- Gekloonde kopieën zijn `aria-hidden="true"` — een schermlezer leest de
  inhoud maar één keer voor (R15).
- Focusbare items (bv. logo-links) krijgen een zichtbare focusring
  (`:focus-visible`, 2px).
- `prefers-reduced-motion: reduce`: geen animatie, geen kopieën, de items
  staan gewoon leesbaar in een wrappende rij — reageert live op een
  halverwege omgezette voorkeur (R1).
- Pauzeert bij `:hover`/`:focus-within` op de band, en zodra de band buiten
  beeld scrolt (IntersectionObserver) — geen onnodig werk, en de bezoeker
  kan de tekst stilzetten om te lezen.

## Op WordPress

Geen build-stap nodig.

**1. Bestanden plaatsen**

```
wp-content/themes/<jouw-thema>/component-library/marquee/
├── marquee.css
└── marquee.js
```

**2. Laden**

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'marquee-style',
		get_stylesheet_directory_uri() . '/component-library/marquee/marquee.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'marquee-module',
		get_stylesheet_directory_uri() . '/component-library/marquee/marquee.js',
		array(),
		null
	);
} );
```

**3. Markup + init**

```html
<div data-marquee data-marquee-variant="ticker">
  <div data-marquee-track>
    <span data-marquee-item>…</span>
  </div>
</div>
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/marquee/marquee.js';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-marquee]').forEach((root) => init(root));
  });
</script>
```

**Valkuilen (WordPress)**: caching-/minify-plugins die `type="module"`
strippen breken de `import` — sluit `marquee.js` uit van JS-combinatie.

## Valkuilen

- **Track ná `init()` niet meer wijzigen.** De module meet de breedte van
  de items ÉÉN keer bij het opbouwen van de kopieën. Nieuwe items later
  toevoegen vereist `destroy()` + opnieuw `init()`.
- **Te weinig items = te grote sprong.** Bij zeer weinig/korte items en een
  hoge snelheid ziet de lus er "hakkelig" uit omdat de groep vaak herhaalt.
  Vul de track met genoeg inhoud voor minstens 3–4 seconden leestijd.
- **`giant` op smalle schermen**: 20vw op 390px is ~78px — nog steeds groot.
  Test op mobiel of de tekst niet te veel regels beslaat per woord.
- **`overflow: hidden` op de root** clipt alles wat buiten de band steekt
  (bv. bij `tilted`, dat roteert en dus breder wordt dan de container) —
  geef de sectie eromheen wat extra ruimte, zoals in de demo.

## Herkomst

Het gedrag (reuzeletters, gekantelde band, smalle topticker met fade-randen
via `mask-image`, logo-balk) is gezien bij meerdere Webstijn-klantsites
(`../research/webstijn/inline/css_f75d8f6b.css`, `css/post-5242.css`) — de
code hier is zelf geschreven, niets overgenomen. Wat wij beter doen: de
snelheid is hier expliciet in px/s en dus onafhankelijk van de breedte van
de inhoud (bij Webstijn is de animatieduur vaak een vaste tijd, wat bij een
bredere set items juist trager oogt); en de kopieën pauzeren automatisch
zodra de band buiten beeld scrolt.
