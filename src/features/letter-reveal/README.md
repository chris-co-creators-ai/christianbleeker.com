# letter-reveal

Een kop komt letter voor letter omhoog en in beeld — opacity 0 → 1,
`translateY(18px)` → 0, 0,8s ease-out per letter, met instelbare stagger. Een
tweede regel (`data-lr-line="secondary"`) krijgt een eigen kleur en een eigen
startvertraging. Woorden breken nooit af midden in het woord. Zonder
JavaScript staat er gewoon de platte, leesbare kop.

## Verschil met `scroll/hero-motion`

Beide splitsen een kop in letters, maar:

| | `letter-reveal` | `scroll/hero-motion` |
|---|---|---|
| Masker | geen — letters bewegen 18px omhoog terwijl ze al zichtbaar zijn | elke regel zit in een `overflow:hidden`-masker; letters schuiven van ónder de regel vandaan (105% → 0%) |
| Scroll-koppeling | geen | ja — de hele hero trekt zich terug (schaalt, vervaagt) bij wegscrollen, met een scroll/resize-listener |
| Gebruik | een losse kop, ergens op de pagina | een complete hero-sectie |
| Gewicht | alleen CSS-animatie + eenmalige split | CSS-animatie + doorlopende `requestAnimationFrame`-lus tijdens scrollen |

Gebruik `letter-reveal` voor een kop die "aankomt" zonder verdere scroll-fysica;
gebruik `hero-motion` als de hero zelf ook moet reageren op scrollen.

## Wanneer wel

- Een sectie- of pagina-kop van één of twee regels die je wilt laten
  "aankomen" zodra de pagina laadt of in beeld komt.
- Twee regels waarvan de tweede in een andere (meestal zachtere) kleur moet
  staan, zoals Chris' "Jouw verhaal. / Sterk op het web.".

## Wanneer niet

- Voor een hele hero-sectie die ook bij wegscrollen moet reageren: dat is
  `scroll/hero-motion`.
- Voor lopende tekst die tijdens het scrollen woord voor woord oplicht: dat is
  `scroll/story-word-light`.
- Niet voor lange alinea's — de letter-voor-letter-animatie is voor korte
  koppen (een paar woorden per regel), niet voor bodytekst.

## Installatie

```
component-library/typography/letter-reveal/
├── letter-reveal.js      # vanilla ES-module, 0 dependencies
├── letter-reveal.css     # namespaced op klassen/attributen
├── LetterReveal.tsx      # React/Next.js client-wrapper
├── demo.html             # zelfstandige demo
└── test/meet.mjs         # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./letter-reveal.css" />
<h1 data-letter-reveal>
  <span data-lr-line>Jouw verhaal.</span>
  <span data-lr-line="secondary">Sterk op het web.</span>
</h1>
<script type="module">
  import { init } from './letter-reveal.js';
  const destroy = init(document.querySelector('[data-letter-reveal]'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { LetterReveal } from '@/component-library/typography/letter-reveal/LetterReveal';

<LetterReveal>
  <span data-lr-line>Jouw verhaal.</span>
  <span data-lr-line="secondary">Sterk op het web.</span>
</LetterReveal>
```

## Markup-contract

- Root-element: de kop zelf (`init(root)`, of het element dat `<LetterReveal>`
  rendert — standaard een `<h1>`). De module zet hierop `aria-label` (de hele
  zin, in één keer) en de CSS-variabele `--lr-duration`.
- Regels: `[data-lr-line]` voor de standaardkleur, `[data-lr-line="secondary"]`
  voor de secundaire kleur (`--lr-secondary`, standaard `#6b6a62`). Elke regel
  wordt sowieso `display:block` — dat geldt óók zonder JS, want die regel zit
  in de CSS op het attribuut, niet op een door JS gezette klasse.
- Per-regel eigen startvertraging (optioneel): `data-lr-line-delay="0.3"`
  (seconden, als getal zonder eenheid) — overschrijft de automatische
  `lineGap × regelindex`-vertraging voor die regel.
- Na `init()` bevat elke regel losse `<span data-lr-ch>`-letters, gegroepeerd
  per woord in `<span class="lr-word">` (woorden breken nooit af: de stagger
  loopt per letter, maar de browser wrapt nooit midden in een woord naar een
  nieuwe regel omdat het woord één `inline-block` is met `white-space:nowrap`).

## Op WordPress

Geen build-stap nodig — `letter-reveal.js` is een kant-en-klare ES-module.

**1. Bestanden plaatsen** in je thema (of een eigen plugin):

```
wp-content/themes/<jouw-thema>/component-library/letter-reveal/
├── letter-reveal.css
└── letter-reveal.js
```

**2. Laden als ES-module** (WordPress ≥ 6.5):

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'letter-reveal-style',
		get_stylesheet_directory_uri() . '/component-library/letter-reveal/letter-reveal.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'letter-reveal-module',
		get_stylesheet_directory_uri() . '/component-library/letter-reveal/letter-reveal.js',
		array(),
		null // bewust geen versienummer, zie reveal-on-scroll/README.md "Valkuilen"
	);
} );
```

**3. Markup + init** — zet `[data-letter-reveal]`/`[data-lr-line]` in een
Custom HTML-blok (Gutenberg) of template, en roep `init()` aan ná
`DOMContentLoaded`:

```html
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/letter-reveal/letter-reveal.js';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-letter-reveal]').forEach((el) => init(el));
  });
</script>
```

## Opties (`init(root, options)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `lineSelector` | `"[data-lr-line]"` | CSS-selector voor de regel-containers binnen de kop. |
| `duration` | `0.8` | Seconden animatieduur per letter (zet `--lr-duration`). |
| `stagger` | `0.035` | Seconden vertraging per volgende (niet-spatie-)letter, doorlopend over alle regels heen. |
| `lineGap` | `0.15` | Extra vertraging (seconden) per regel-index bovenop de doorlopende stagger — regel 2 krijgt dus stagger-vertraging + 1×`lineGap`, tenzij `data-lr-line-delay` dat overschrijft. |

CSS-variabelen (op `[data-letter-reveal]`, override per element of globaal):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--lr-y` | `18px` | Verticale startverschuiving van elke letter. |
| `--lr-secondary` | `#6b6a62` | Tekstkleur van `[data-lr-line="secondary"]`. |
| `--lr-duration` | `0.8s` | Animatieduur (door JS gezet uit optie `duration`). |
| `--d` | `0s` | Per-letter vertraging (door JS gezet). |

## Toegankelijkheid

- **Eén keer, de hele zin.** De module zet `aria-label` op de kop met de
  volledige, opgeschoonde tekst (beide regels met een spatie ertussen). De
  regel-containers krijgen `aria-hidden="true"` — een schermlezer negeert dus
  de losse letter-spans en leest alleen de `aria-label`, één keer, niet
  letter voor letter.
- **`prefers-reduced-motion: reduce`** → geen splitsing: de platte tekst
  blijft gewoon staan (nog steeds via `aria-label` voorgelezen), meteen
  zichtbaar, geen animatie.
- **Geen layout-shift.** Letters staan al op hun uiteindelijke plek in de
  tekstflow vóór de animatie start — alleen `opacity`/`transform` bewegen
  (R18/R19), dus de kop neemt zijn eindruimte al in vanaf het eerste frame.
- **Toetsenbord**: dit component zelf bevat geen interactieve elementen (puur
  een kop); de demo's "Opnieuw afspelen"-knop is normaal focusbaar/klikbaar
  HTML en heeft een zichtbare focus-outline.

## Valkuilen

- **Vergeet de CSS niet te laden.** Zonder `letter-reveal.css` heeft
  `[data-lr-line]` geen `display:block` en lopen de twee regels door elkaar
  op één regel.
- **`root` moet vóór `init()` al de `[data-lr-line]`-regels bevatten.** De
  module splitst één keer bij het opstarten; regels die je daarna toevoegt,
  worden niet automatisch meegenomen — roep `destroy()` + `init()` opnieuw
  aan.
- **Niet voor lange tekst.** Elke letter is een eigen element; bij een lange
  zin (tientallen woorden) wordt de DOM onnodig zwaar. Richtlijn: een paar
  woorden per regel, maximaal twee regels.
- **`destroy()` herstelt de oorspronkelijke `innerHTML`.** Heb je na `init()`
  handmatig iets in de kop veranderd (los van deze module), dan gaat dat bij
  `destroy()` verloren — bewaar zulke wijzigingen zelf, of pas ze pas na
  `init()` toe buiten de kop.

## Performance

Alleen een eenmalige DOM-split bij `init()` en daarna pure CSS
`@keyframes`-animaties (`opacity`/`transform`, R18) — geen scroll-listener,
geen `requestAnimationFrame`-lus, geen `IntersectionObserver`. Lichter dan
`hero-motion`, dat wél een doorlopende scroll-gekoppelde lus heeft.

## Herkomst

Techniek gezien op christianbleeker.com (24-09-2026): de koptekst "Jouw
verhaal. / Sterk op het web." komt letter voor letter omhoog via een CSS
`@keyframes hero-reveal` (`opacity:0;transform:translateY(18px)` →
`opacity:1;transform:translateY(0)`), gemeten in de bundel
`../research/christianbleeker/bundles/0vbyedifgybiy.css`: `.hero-letter`
draait de keyframe 0,5s per letter, en de tweede regel (`.home-hero-copy`)
draait diezelfde keyframe als één blok van 0,8s met 1,05s vertraging. Eigen
implementatie, geen code overgenomen: wij passen 0,8s toe op élke losse
letter (niet alleen op de tweede regel als geheel), splitsen zelf per letter
met een doorlopende stagger over beide regels, en maken zowel de stagger als
de regelvertraging instelbaar via opties/attributen in plaats van vaste
getallen in de CSS.
