# lottie-icon

Een lijn-icoon dat zichzelf tekent (Lottie-animatie), maar de player pas laadt
zodra het bijna in beeld komt. Tot dat moment — en zonder JavaScript, en bij
"minder beweging" — staat er een statische SVG die het eindbeeld van de
tekening toont. Vier eigen, eenvoudige animaties zitten erbij: cirkel, kubus,
raster en vink.

## Wanneer wel

- Genummerde dienst-/featurekaarten met een klein, herkenbaar lijn-icoon dat
  zichzelf "tekent" zodra de bezoeker eraan toe is (zoals Chris' 001–004).
- Losse statusiconen (voltooid, laden, actief) waar een subtiele animatie het
  gebruik prettiger maakt, zonder dat de pagina zwaarder wordt vóór het nodig
  is.

## Wanneer niet

- Voor een hoofdillustratie of grote hero-animatie: een Lottie van
  honderden KB's die meteen zichtbaar moet zijn, is geen "lui laden"-geval
  meer — overweeg dan een gewone video (`media/video-facade`, komt eraan) of
  een handgemaakte CSS-animatie.
- Niet voor iconen die je toch al als inline SVG met een simpele CSS-
  animatie kan doen (een spinner, een vinkje dat verschijnt) — dat is
  lichter dan een hele Lottie-speler erbij halen. Gebruik dit component pas
  als de animatie echt meerdere gecoördineerde vormen/paden nodig heeft.

## Welke Lottie-speler, en waarom

Gekozen: **`lottie-web` 5.13.0, "light" SVG-only build** (MIT-licentie), lokaal
gevendord in `vendor/lottie_light.min.js` (ESM, 365KB, 0 dependencies binnen
het bestand zelf — geen `import`-statements).

Overwogen alternatief: `@lottiefiles/dotlottie-web`. Die is als package
kleiner (npm `unpackedSize` ≈ 7,4MB vs ≈ 25MB voor het hele `lottie-web`-
pakket, wat vooral door meegeleverde voorbeelden/docs komt), maar rendert via
een WASM-canvas-renderer (thorvg), niet via SVG. De opdracht vraagt expliciet
een **SVG-renderer** — met SVG blijft elke vorm een gewoon, inspecteerbaar
DOM-element (handig voor debugging en voor `prefers-reduced-motion`-CSS als
je die ooit op de paden zelf zou willen zetten), en het is de renderer die
het dichtst bij hoe browsers al werken staat (geen aparte WASM-download).
Binnen `lottie-web` is er bovendien specifiek een **light build zonder
expressions/canvas/html-renderer** (`lottie_light.min.js`, 365KB ESM) versus
de volledige speler (`lottie.min.js`, 589KB ESM) — dat scheelt ruim 220KB,
en licht genoeg om pas te laden wanneer het icoon bijna in beeld komt.

## Installatie

```
component-library/media/lottie-icon/
├── lottie-icon.js          # vanilla ES-module, 0 dependencies bij import
├── lottie-icon.css         # namespaced op attributen
├── LottieIcon.tsx           # React/Next.js client-wrapper
├── demo.html                # zelfstandige demo (dienstkaarten 001-004)
├── vendor/
│   ├── lottie_light.min.js  # lottie-web 5.13.0, SVG-only light build, MIT
│   └── LOTTIE-LICENSE.md    # originele MIT-licentietekst van lottie-web
├── animaties/                # eigen, eenvoudige lijn-animaties (JSON)
│   ├── cirkel.json
│   ├── kubus.json
│   ├── raster.json
│   └── vink.json
├── assets/                   # statische eindbeeld-SVG's (no-JS-fallback)
│   ├── cirkel.svg / kubus.svg / raster.svg / vink.svg
└── test/meet.mjs
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./lottie-icon.css" />
<div data-lottie-icon data-lottie-src="./animaties/kubus.json">
  <img data-lottie-fallback src="./assets/kubus.svg" alt="" width="64" height="64" />
</div>
<script type="module">
  import { init } from './lottie-icon.js';
  const destroy = init(document.querySelector('[data-lottie-icon]'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { LottieIcon } from '@/component-library/media/lottie-icon/LottieIcon';

<LottieIcon src="/animaties/kubus.json" fallbackSrc="/assets/kubus.svg" />
```

## Markup-contract

- Root: `[data-lottie-icon]`, met `data-lottie-src` (verplicht, tenzij je de
  JS-optie `src` gebruikt) en optioneel `data-lottie-loop="false"` (eenmalig
  i.p.v. doorlopend) en `data-lottie-label="…"` (maakt het icoon
  betekenisvol i.p.v. decoratief — zie Toegankelijkheid).
- Binnen root: exact één `[data-lottie-fallback]`-afbeelding (`<img>` of
  inline `<svg>`) die het eindbeeld van de animatie toont. Deze blijft altijd
  in de DOM staan; de module verbergt hem alleen via CSS
  (`[data-lottie-active] [data-lottie-fallback]{display:none}`) zodra de
  player daadwerkelijk gemount is.
- De module voegt bij het mounten zelf een `.li-stage`-container toe (de
  Lottie-SVG) en zet `data-lottie-active` op root.

## Op WordPress

Geen build-stap nodig — `lottie-icon.js` en `vendor/lottie_light.min.js`
zijn kant-en-klare ES-modules.

**1. Bestanden plaatsen** in je thema:

```
wp-content/themes/<jouw-thema>/component-library/lottie-icon/
├── lottie-icon.css
├── lottie-icon.js
├── vendor/lottie_light.min.js
├── animaties/*.json
└── assets/*.svg
```

**2. Laden als ES-module** (WordPress ≥ 6.5):

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'lottie-icon-style',
		get_stylesheet_directory_uri() . '/component-library/lottie-icon/lottie-icon.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'lottie-icon-module',
		get_stylesheet_directory_uri() . '/component-library/lottie-icon/lottie-icon.js',
		array(),
		null // geen versienummer, zie reveal-on-scroll/README.md "Valkuilen"
	);
} );
```

**3. Markup + init** — `[data-lottie-icon]` in een Custom HTML-blok, met
`init()` ná `DOMContentLoaded`:

```html
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/lottie-icon/lottie-icon.js';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lottie-icon]').forEach((el) => init(el));
  });
</script>
```

**Valkuil op WordPress**: cache-/minify-plugins die `type="module"` strippen
of alle JS tot één niet-module-bestand bundelen breken de `import()`. Sluit
`lottie-icon.js` en `vendor/lottie_light.min.js` uit van JS-combinatie.

## Opties (`init(root, options)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `src` | `data-lottie-src` | Pad naar de Lottie-JSON. |
| `loop` | `true` (of `data-lottie-loop !== "false"`) | Doorlopend loopen, of één keer spelen en op het laatste frame blijven staan. |
| `rootMargin` | `"200px"` | IntersectionObserver-rootMargin: hoe ver vóór het echte in-beeld-komen de player al laadt. Kleiner dan de 600px-richtlijn voor video/3D (R17) — een los icoon is klein en goedkoop, dus hoeft niet zo vroeg te starten. |
| `label` | `data-lottie-label` (of geen) | Gezet: `role="img"` + `aria-label`. Niet gezet: `aria-hidden="true"` (decoratief). |

CSS-variabele: `--li-size` (standaard `64px`) — breedte/hoogte van het
vierkante icoon.

## Toegankelijkheid

- **Decoratief (standaard)**: zonder `label`/`data-lottie-label` krijgt root
  `aria-hidden="true"` — een schermlezer negeert het icoon volledig. Gebruik
  dit als de tekst ernaast (zoals de dienstkaart-titel) de betekenis al
  draagt.
- **Betekenisvol**: met `label`/`data-lottie-label` krijgt root `role="img"`
  + `aria-label`, zodat een schermlezer de omschrijving voorleest alsof het
  een afbeelding met alt-tekst is (zie de demo, "Laatste controle geslaagd").
- **Geen interactief element.** Dit component heeft zelf geen knoppen of
  links — er is dus geen toetsenbord-scenario in `test/meet.mjs` (R14 is
  hier niet van toepassing, er is niets om te focussen).
- **`prefers-reduced-motion: reduce`**: staat de voorkeur al bij het laden,
  dan laadt de player helemaal niet — de statische fallback-SVG (die al het
  eindbeeld toont) blijft zichtbaar. Geen animatie, geen onnodige download.
  Zet de bezoeker de voorkeur **halverwege** aan terwijl een icoon al
  speelt, dan reageert de module live (`minderBeweging(onChange)`, niet
  alleen een eenmalige check bij het laden): de speler pauzeert en springt
  naar zijn laatste frame, zodat ook dan een vast eindbeeld blijft staan
  i.p.v. dat de animatie doorloopt (R1 — vastgelegd als regressietest in
  `test/meet.mjs`). Zet de
  bezoeker de voorkeur weer terug, dan hervat de animatie.
- **Contrast**: de meegeleverde iconen zijn `#18181b`-lijnen (donker) op de
  standaard papierkleur van de showcase; op een eigen achtergrond regel je
  zelf voldoende contrast (R16) via je eigen SVG/JSON-kleur.

## Valkuilen

- **Vergeet de fallback-afbeelding niet.** Zonder `[data-lottie-fallback]`
  in de markup is er niets te zien zolang de player nog niet gemount is (of
  bij "minder beweging"/zonder JS helemaal niet).
- **`data-lottie-src` moet vóór `init()` op root staan** (of geef `src` als
  optie mee) — zonder bron slaat de module zichzelf over met een
  console-waarschuwing (R5), geen crash.
- **`rootMargin` te klein op een lange lijst** kaarten kan een merkbare
  vertraging geven tussen "in beeld scrollen" en "animatie start" (de
  player + JSON moeten nog ophalen). Vergroot `rootMargin` als de kaarten
  snel na elkaar scrollen.
- **Eigen animaties toevoegen**: exporteer vanuit After Effects/Lottie-tools
  als Bodymovin-JSON, of schrijf zelf een minimale versie — een shape-laag
  met per vorm een stroke-only pad en een `tm` (Trim Paths)-modifier waarvan
  `e` (end) van 0% naar 100% keyframet over de tijdlijn. Precies zo zijn de
  vier meegeleverde animaties opgebouwd (zie `animaties/*.json`). Zorg dat de
  fallback-SVG hetzelfde eindbeeld toont als het laatste frame.
- **Een `tm`-keyframe zonder `i`/`o` (temporal ease) rendert stil een lege
  path.** Bij het met de hand schrijven van de vier meegeleverde JSON's bleek
  `lottie_light.min.js` een animated `e`-waarde (`"a":1`) zónder `i`/`o`-
  bezier-easing op de keyframes te accepteren als geldige JSON, maar het pad
  bleef de HELE animatie op `d="M0 0"` staan (leeg) — geen console-fout, geen
  crash, gewoon niets zichtbaar, terwijl de frame-teller van de player
  intussen heel gewoon doorliep. Pas met `i`/`o` op elke niet-laatste
  keyframe (bijv. de standaard bodymovin "easy ease": `i:{x:[.667],y:[1]}`,
  `o:{x:[.333],y:[0]}`) tekent het pad daadwerkelijk. `test/meet.mjs` heeft
  hier een vaste regressietest voor (leest de `d`-attributen na afloop).

## Meten

`test/meet.mjs` bewijst met een network-log dat `vendor/lottie_light.min.js`
en de Lottie-JSON's pas worden opgehaald nádat een icoon (bijna) in beeld
scrolt — bij "minder beweging" helemaal nooit. Verder: de animatie loopt
(frame-teller stijgt) zolang het icoon in beeld is, pauzeert zodra het
buiten beeld scrolt, en `destroy()` ruimt de speler, de toegevoegde
`.li-stage` en alle a11y-attributen weer op.

## Herkomst

Techniek gezien op christianbleeker.com (24-09-2026): genummerde
dienstkaarten (001–004) met lijnicoontjes die zichzelf tekenen en loopen —
`ServiceIcon` laadt daar Lottie via `next/dynamic` met `ssr:false` (lui), een
los JSON-bestand per dienst (`service-1.json` …). Eigen implementatie: geen
code of JSON van Chris overgenomen — de vier animaties hier (cirkel, kubus,
raster, vink) zijn zelf getekend/geschreven. Wat wij beter doen: bij
Chris stonden de iconen niet stil bij "minder beweging"; hier laadt
de player dan bewust helemaal niet.
