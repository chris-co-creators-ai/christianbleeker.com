# handwritten-accent

Klein handgeschreven label boven een kop ("Net opgeleverd", "Binnenkort!",
"Klik of swipe →"), licht gekanteld, met een optioneel pijltje/krul (inline
SVG). Bij in beeld komen "schrijft" het label zich: de tekst wist zich open
en het SVG-pad tekent zich, via een CSS-transition — geen canvas, geen
per-letter DOM-manipulatie.

## Wanneer wel

- Boven een sectiekop een informeel, persoonlijk accent zetten — "dit is
  net af", "kijk hier eerst", een uitnodiging om te scrollen/swipen.
- Kleine hoeveelheden tekst (2–5 woorden). Het is een accent, geen alinea.

## Wanneer niet

- Voor lopende tekst of een volledige zin — de handgeschreven letter is bij
  langere tekst minder leesbaar dan een gewoon lettertype.
- Niet herhalen op elke sectie van een pagina; 1–3 keer per pagina houdt het
  bijzonder.

## Installatie

```
component-library/typography/handwritten-accent/
├── handwritten-accent.js      # vanilla ES-module, 0 dependencies
├── handwritten-accent.css     # namespaced op [data-handwritten-accent]
├── HandwrittenAccent.tsx      # React/Next.js client-wrapper
├── demo.html                  # zelfstandige demo
└── test/meet.mjs              # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./handwritten-accent.css" />
<p data-handwritten-accent>
  <svg class="hwa__squiggle" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M2 26C10 10 20 4 30 3M30 3l-6 1M30 3l-2 6" />
  </svg>
  <span class="hwa__label">Net opgeleverd</span>
</p>
<h2>De nieuwe website</h2>

<script type="module">
  import { init } from './handwritten-accent.js';
  const destroy = init(document.querySelector('[data-handwritten-accent]'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { HandwrittenAccent } from '@/component-library/typography/handwritten-accent/HandwrittenAccent';

<HandwrittenAccent label="Net opgeleverd" arrow tilt={-4}>
  <h2>De nieuwe website van Studio Wester</h2>
</HandwrittenAccent>
```

## Markup-contract

- Root: het element met `data-handwritten-accent` (meestal een `<p>`).
  Krijgt na `init()` het attribuut `data-hwa-ready` — dat, samen met de
  klasse `is-written`, de complete `.js`-gating vormt: zonder JS (of vóór
  init) toont de CSS het label en de krul gewoon meteen, zonder wipe.
- `.hwa__label` — verplicht, de zichtbare (en voor schermlezers gewoon
  aanwezige) tekst.
- `.hwa__squiggle` — optioneel, een inline `<svg>` met één of meer
  `<path>`-elementen. De module berekent zelf de padlengte
  (`getTotalLength()`) en zet `stroke-dasharray`/`stroke-dashoffset`; je
  hoeft die niet zelf te zetten. `aria-hidden="true"` is verplicht (puur
  decoratief).

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `animate` | `true` | "Wordt geschreven"-animatie bij in beeld. `false` = meteen af, geen observer. |
| `once` | `true` | Na de animatie niet opnieuw spelen bij terug-scrollen. |
| `threshold` | `0.4` | IntersectionObserver-threshold. |

CSS-variabelen (op `[data-handwritten-accent]`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--hwa-tilt` | `-4deg` | Kanteling. |
| `--hwa-color` | `#d1495b` | Tekst- en lijnkleur. |
| `--hwa-size` | `1.35rem` | Lettergrootte. |
| `--hwa-font` | `'Caveat', 'Segoe Print', 'Bradley Hand', cursive` | Fontstack. |

## Fontadvies

Caveat, **lokaal meegeleverd** in `./fonts/` (`caveat-latin-500-normal.woff2`,
`caveat-latin-600-normal.woff2`, licentie in `./fonts/OFL.txt` — SIL Open
Font License 1.1, vrij te hergebruiken/herverdelen). `handwritten-accent.css`
bevat de `@font-face`-regels al (`font-display: swap`), dus er is geen
externe `<link>` nodig — en dus ook geen request naar
fonts.googleapis.com/fonts.gstatic.com bij elk paginabezoek (AVG: een
lettertype van Google Fonts via hun CDN stuurt het IP-adres van de bezoeker
naar Google, zonder toestemmingsvraag — lokaal hosten voorkomt dat).

De subset dekt Latin-1 (U+0000–00FF), dus gewone NL-diakrieten (ë, ï, ç)
werken gewoon. Nodig je Cyrillisch/Grieks/Vietnamees, download dan de
bijbehorende `@fontsource/caveat`-bestanden erbij (zelfde bron, zie
"Herkomst van deze bestanden" hieronder) en voeg een `@font-face`-regel met
de juiste `unicode-range` toe.

Systeemfont-fallback (`--hwa-font`) is altijd actief: `Segoe Print` (Windows),
`Bradley Hand` (macOS), en anders de generieke `cursive`-stack — als de
`.woff2`-bestanden om wat voor reden dan ook niet laden, blijft de tekst dus
gewoon leesbaar.

**Herkomst van deze bestanden**: gedownload via het npm-pakket
`@fontsource/caveat` (jsdelivr-CDN-mirror van hetzelfde pakket), zelf geen
lettertype-bestanden geschreven. Caveat zelf is van The Caveat Project
Authors (Google Fonts), OFL 1.1.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/handwritten-accent/`.
2. Font-`<link>`'s (zie hierboven) toevoegen via `wp_enqueue_style()` of in
   `header.php`.
3. Laden:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'hwa-style', get_stylesheet_directory_uri() . '/component-library/handwritten-accent/handwritten-accent.css', array(), '1.0.0' );
	wp_enqueue_script_module( 'hwa-module', get_stylesheet_directory_uri() . '/component-library/handwritten-accent/handwritten-accent.js', array(), null );
} );
```

4. Markup in een Custom HTML-blok/widget, `init()` na `DOMContentLoaded`.

## Toegankelijkheid

- De tekst in `.hwa__label` staat gewoon in de DOM — schermlezers lezen hem
  in één keer voor, ongeacht de visuele wipe-animatie (die is puur
  `clip-path`, geen `display`/`visibility`-toggle en geen tekst die
  tussentijds verandert).
- `.hwa__squiggle` is decoratie: verplicht `aria-hidden="true"`.
- `prefers-reduced-motion: reduce` → het label en de krul staan meteen op
  hun eindstand, geen observer, geen transitie (CSS `!important`-vangnet
  plus JS die de eindstand direct zet — reageert ook live op een wissel
  halverwege de sessie).
- Geen interactief element, dus geen toetsenbordpad nodig.

## Valkuilen

- **SVG-pad moet al gerenderd zijn** wanneer `init()` draait —
  `getTotalLength()` op een `display:none`-element gooit een fout in sommige
  browsers. De module vangt dat af (try/catch) en laat het pad dan gewoon
  staan zonder animatie i.p.v. te crashen.
- **Lange tekst breekt de wipe niet**, maar oogt minder als "schrijven" — de
  clip-path-wipe is een rechte lijn, geen curve die de letters volgt.
- **`once:false`** laat de animatie herhalen bij op/neer scrollen; gebruik
  dat bewust, het kan onrustig ogen bij een label dat vaak in/uit beeld komt.

## Herkomst

Eigen implementatie; patroon gezien bij meerdere bureausites
(Caveat/Shadows Into Light/Pacifico, gekanteld, statisch). Het label staat
daar altijd meteen stil; hier "schrijft" het zich bij in beeld komen,
met een schermlezer- en reduced-motion-vaste fallback.
