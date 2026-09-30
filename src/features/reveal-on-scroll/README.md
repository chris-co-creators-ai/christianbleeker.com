# reveal-on-scroll

Elementen met `data-reveal` komen in beeld met een fade + lichte verschuiving
(omhoog / van links / van rechts), met instelbare vertraging per element.
Zonder JavaScript is alles gewoon meteen zichtbaar.

## Wanneer wel

- Sectie-koppen, kaartrijen, losse blokken die je bij het scrollen wilt laten
  "aankomen" — een standaard, lichte in-view-onthulling.
- Content die **direct leesbaar moet blijven** als JS uitstaat of faalt
  (progressive enhancement, geen layout-shift zonder JS).

## Wanneer niet

- Voor tekst die woord-voor-woord moet oplichten tijdens het scrollen (dat is
  `story-word-light`), of voor een lettergewijze intro-animatie (`hero-motion`).
- Niet voor tientallen elementen tegelijk op één scherm — bij te veel
  gelijktijdige reveals oogt een pagina onrustig. Richtlijn: 3–8 reveals per
  viewport.

## Installatie

```
component-library/scroll/reveal-on-scroll/
├── reveal-on-scroll.js      # vanilla ES-module, 0 dependencies
├── reveal-on-scroll.css     # namespaced op data-attributen
├── RevealOnScroll.tsx       # React/Next.js client-wrapper
├── demo.html                # zelfstandige demo
└── test/meet.mjs            # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./reveal-on-scroll.css" />
<script type="module">
  import { init } from './reveal-on-scroll.js';
  const destroy = init(document.querySelector('#content'));
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { RevealOnScroll } from '@/component-library/scroll/reveal-on-scroll/RevealOnScroll';

<RevealOnScroll>
  <h2 data-reveal>Titel</h2>
  <p data-reveal data-reveal-delay="0.1">Tekst die iets later komt.</p>
</RevealOnScroll>
```

## Markup-contract

- Root-element: het element dat je aan `init(root)` geeft (of de wrapper-div
  van `<RevealOnScroll>`). De module zet hierop **twee** attributen, in twee
  fasen — **die attributen zijn samen de `.js`-gating**: zonder JS (of vóór
  init) bestaat geen van beide, en toont de CSS alles gewoon.
  1. `data-ros-hidden` — synchroon, zodra `init()` loopt: zet de verborgen
     staat (opacity 0 + verschuiving) direct, zónder transition.
  2. `data-ros-active` — één animatieframe later: schakelt pas dán de
     transition in. Dit voorkomt dat het verbergen zelf zichtbaar animeert
     (een "reveal in omgekeerde richting"-flits bij het opstarten) — zie
     Valkuilen.
- Onthulbare elementen: `data-reveal` (= richting "omhoog", standaard),
  `data-reveal="left"` of `data-reveal="right"`.
- Per-element vertraging (optioneel): `data-reveal-delay="0.2"` (seconden,
  als getal zonder eenheid). De module zet dit om naar de CSS-variabele
  `--reveal-delay`. Je mag die variabele ook rechtstreeks via inline
  `style="--reveal-delay: .2s"` zetten — de JS overschrijft hem alleen als
  `data-reveal-delay` aanwezig is.
- Elementen mogen genest zijn — `init()` zoekt met `querySelectorAll` binnen
  de root, dus een `data-reveal` op elke diepte werkt.

## Op WordPress

Geen build-stap nodig — `reveal-on-scroll.js` is een kant-en-klare ES-module.

**1. Bestanden plaatsen** — zet de map in je thema (of een eigen plugin):

```
wp-content/themes/<jouw-thema>/component-library/reveal-on-scroll/
├── reveal-on-scroll.css
└── reveal-on-scroll.js
```

**2. Laden als ES-module** — vanaf WordPress 6.5 met `wp_enqueue_script_module()`:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'reveal-on-scroll-style',
		get_stylesheet_directory_uri() . '/component-library/reveal-on-scroll/reveal-on-scroll.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'reveal-on-scroll-module',
		get_stylesheet_directory_uri() . '/component-library/reveal-on-scroll/reveal-on-scroll.js',
		array(),
		null
	);
} );
```

Bewust **geen** versienummer op de module-enqueue (`null` i.p.v. `'1.0.0'`): WordPress plakt bij een expliciete versie een `?ver=`-parameter achter de URL, terwijl de `import` in stap 4 hieronder dezelfde module zonder die parameter ophaalt — twee verschillende URL's voor de browser, dus twee keer fetchen en evalueren. Met `null` gebruiken beide dezelfde, kale URL en laadt de module maar één keer.

Op WordPress < 6.5 laad je de module via `wp_footer` of een Custom HTML-blok
met `<script type="module">`.

**3. Markup plaatsen** — `data-reveal`/`data-reveal="left"`/`"right"` op
losse blokken, kaarten of secties, in een Custom HTML-blok (Gutenberg), een
HTML-widget (Elementor), of een template. Omdat `init()` met
`querySelectorAll` binnen de root zoekt, mag je `document.body` als root
gebruiken (zie stap 4) en het attribuut vrij verspreiden over de hele
pagina-content, ook content die uit losse Gutenberg-blokken komt.

**4. `init()` aanroepen** ná `DOMContentLoaded`:

```html
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/reveal-on-scroll/reveal-on-scroll.js';
  document.addEventListener('DOMContentLoaded', () => {
    init(document.body);
  });
</script>
```

**Valkuilen**

- **Caching-/minify-plugins** (WP Rocket, Autoptimize, W3 Total Cache e.d.)
  bundelen JS standaard tot één niet-module-script, of strippen
  `type="module"` — dat breekt de `import`. Sluit `reveal-on-scroll.js` uit
  van JS-combinatie/-minificatie, of laad het via `wp_enqueue_script_module()`.
- **jQuery-conflicten**: n.v.t. — geen jQuery-afhankelijkheid.
- **Lazy-load-plugins voor afbeeldingen** kunnen de layout nog laten
  verschuiven ná de reveal-animatie (afbeelding laadt pas later in). Geef
  afbeeldingen binnen een `data-reveal`-blok altijd `width`/`height` (of
  `aspect-ratio`) mee, zodat er geen ruimte "opspringt" na de onthulling.

## Opties (`init(root, options)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `"[data-reveal]"` | CSS-selector voor de te onthullen elementen. |
| `threshold` | `0.18` | IntersectionObserver-threshold. |
| `rootMargin` | `"0px 0px -18% 0px"` | IntersectionObserver-rootMargin — triggert iets vóór het element volledig in beeld is. |
| `once` | `true` | Na onthullen niet opnieuw verbergen bij uitscrollen. Zet op `false` voor een herhaalbare reveal. |
| `opacityVertraging` | *(niet gezet)* | Seconden extra vertraging vóór de opacity-transitie start, bovenop `--reveal-delay` — laat transform en opacity los van elkaar lopen. Niet gezet = opacity en transform starten gelijktijdig (ongewijzigd standaardgedrag). Zet dit voor het christianbleeker.com-effect: transform beweegt meteen, de inhoud vervaagt pas een fractie later in beeld — een zachtere aankomst dan alles-tegelijk. |

CSS-variabelen (op `[data-reveal]`, override per element of globaal):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--ros-duration` | `0.95s` | Transitieduur (geldt voor zowel transform als opacity). |
| `--ros-ease` | `cubic-bezier(.22,1,.36,1)` | Easing (ease-out-quint). |
| `--ros-up` | `2.75rem` | Verschuiving bij `data-reveal` (omhoog). |
| `--ros-side-x` | `5.5rem` | Horizontale verschuiving bij `left`/`right`. |
| `--ros-side-y` | `3.25rem` | Verticale verschuiving bij `left`/`right`. |
| `--reveal-delay` | `0s` | Per-element vertraging (zie hierboven), geldt voor zowel transform als opacity. |
| `--reveal-opacity-delay` | *(niet gezet, effectief 0s)* | Extra vertraging, alléén voor opacity, bovenop `--reveal-delay` — door JS gezet op de root uit optie `opacityVertraging`. Rechtstreeks op een element zetten (inline `style`) mag ook, zonder de JS-optie. |

**Transform en opacity los van elkaar laten lopen** (`opacityVertraging`):

```js
init(document.querySelector('#content'), { opacityVertraging: 0.5 });
```

Dat geeft, samen met de standaard `--ros-duration`, hetzelfde ritme als
christianbleeker.com: transform beweegt gedurende de volle transitieduur,
terwijl de opacity pas 0,5s later begint te veranderen. Wil je ook een
kortere opacity-duur (zoals Chris' 0,3s tegenover 0,8s voor transform), zet
dan `--ros-duration` op het element zelf voor transform en override de
opacity-duur niet via deze optie maar met een eigen `transition`-regel na de
module — deze optie regelt bewust alleen de **vertraging**, niet een tweede
duur, om de API klein te houden.

**Let op wat dit in de praktijk oplevert** (gemeten op 24-09): met de
standaard `--ros-duration` (0,95s) is de transform-beweging bij 0,5s
vertraging al voor zo'n 95% klaar tegen de tijd dat de opacity start te
veranderen (gemeten: `translateY` nog maar 2,1px bij 450ms, op een start van
20,8px). Het effect is dus in de praktijk vooral een **vertraagde fade**
bovenop een bijna voltooide verschuiving, niet twee even zware bewegingen na
elkaar. Dat is bewust zo — zelfde ritme als bij Chris — maar reken er niet op
dat de transform nog "iets doet" op het moment dat de opacity zichtbaar
wordt. Zie de losse sectie onderaan `demo.html` ("Transform en opacity los
van elkaar") voor een direct vergelijkbaar voorbeeld.

## Toegankelijkheid

- Puur visueel: geen `aria-*`-aanpassingen nodig, de tekst zelf verandert
  niet. Screenreaders zien de content zoals hij in de DOM staat.
- `prefers-reduced-motion: reduce` → alle elementen krijgen direct
  `opacity: 1; transform: none` zonder transitie, en de module slaat de
  IntersectionObserver over (geen onnodig werk).
- Focus-volgorde verandert niet: reveal is puur opacity/transform, geen
  `display`/`visibility`-toggle, dus toetsenbordnavigatie blijft normaal
  werken ook vóórdat een element "in beeld" is geweest.

## Browserondersteuning

IntersectionObserver (alle moderne browsers). Bij afwezigheid (zeer oude
browser) valt de module terug op meteen alles tonen — geen observer, geen
fout.

## Valkuilen

- **Transitie op het verbergen zelf voorkomen.** Eerdere, eenvoudigere versie
  van deze module zette één attribuut synchroon, mét transition erop — de
  browser zag dat dan als een echte waardewijziging (opacity 1 → 0) en
  animeerde het verbergen zelf zichtbaar (een korte "omgekeerde reveal"-flits
  bij het laden). Vandaar de twee-fasen-aanpak (`data-ros-hidden` synchroon
  zonder transition, `data-ros-active` een frame later mét transition) —
  gemeten met Playwright: zonder deze scheiding stond een element buiten
  beeld na 150ms nog op opacity ≈0,38 in plaats van 0.
- **Vergeet de CSS niet te laden.** Zonder `reveal-on-scroll.css` hebben de
  `data-ros-*`-attributen geen effect en blijft alles gewoon zichtbaar
  (onschuldig, maar dan mis je de animatie).
- **`root` moet vóór `init()` al de `data-reveal`-elementen bevatten.** De
  module zoekt ze één keer bij het opstarten; dynamisch toegevoegde
  elementen daarna worden niet automatisch opgepikt — roep `destroy()` +
  `init()` opnieuw aan, of observeer ze zelf.
- **`once:false` + snel op/neer scrollen** kan drukke transitions geven bij
  veel elementen tegelijk; gebruik dit bewust, niet als default.
- **`init()` zonder geldig element crasht niet meer** (R5, sinds 24-09):
  `init(null)` of een niet-DOM-waarde geeft een console-waarschuwing en een
  no-op `destroy()` terug, in plaats van een `throw`. Dit bestond al vóór
  de `opacityVertraging`-uitbreiding.

## Performance

Alleen een IntersectionObserver-callback (geen scroll-listener, geen rAF-lus)
— de browser doet het meet-werk zelf, buiten het hoofdproces om. `once:true`
(standaard) ontkoppelt elk element van de observer zodra het onthuld is.

## Herkomst

Eigen implementatie; techniek gezien bij meerdere bureausites
(IntersectionObserver, dezelfde threshold/rootMargin,
`.js`-klasse op `<html>` voor de no-JS-fallback). De `.js`-gating is hier verplaatst van een globale
`<html>`-klasse naar een per-instantie attribuut op de root, zodat de module
zonder gedeelde globale state werkt.

**Toevoeging 24-09-2026** (optie `opacityVertraging`): techniek gezien op
christianbleeker.com, CSS `[data-reveal]{transition:transform .8s
cubic-bezier(.22,1,.36,1),opacity .3s .5s}` — daar lopen
transform en opacity met een eigen duur/vertraging, zodat het beeld zachter
"aankomt" dan wanneer beide gelijktijdig veranderen. Eigen implementatie:
alleen de vertraging is overgenomen als losse, optionele optie
(`opacityVertraging` → `--reveal-opacity-delay`); de duur blijft gedeeld via
`--ros-duration` om de API klein te houden (zie "Opties" hierboven).
