# blur-woorden

Sectiekop die bij in beeld **per woord van wazig naar scherp** gaat, licht gestaggerd. De eyebrow komt 8 px omhoog, de beschrijving 10 px. Schermlezers horen de hele zin in één keer. Zonder JavaScript, bij minder beweging en bij een gepauzeerde site staat de kop direct scherp.

## Wanneer wel
- Een sectiekop op een rustige, premium pagina (SaaS, dienstverlener) die net iets meer aandacht verdient dan een gewone fade.
- Eén of twee keer per pagina, bij een kantelpunt in het verhaal ("Zo werkt het", "Waarom wij").

## Wanneer niet
- Niet op elke kop: na de tweede keer is het effect op. Gebruik voor de rest `scroll/reveal-on-scroll`.
- Niet voor lange lopende tekst (woord-voor-woord oplichten tijdens het scrollen is `story-word-light`).
- Niet voor de hero-kop die direct leesbaar moet zijn (LCP): die animeert pas als hij in beeld komt, en de hero is al in beeld.

## Installatie
```
typography/blur-woorden/
├── blur-woorden.js    vanilla ES-module, 0 dependencies
├── blur-woorden.css   namespaced op data-attributen
├── BlurWoorden.tsx    React/Next-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla**
```html
<link rel="stylesheet" href="./blur-woorden.css">
<div data-blur-woorden>
  <p data-bw-eyebrow>Zo werkt het</p>
  <h2 data-bw-kop>
    <span data-bw-regel>Drie stappen naar je eigen werkplek.</span>
    <span data-bw-regel data-bw-zacht>Op het domein van Studio Wester.</span>
  </h2>
  <p data-bw-tekst>Je kiest de apps, wij zetten ze klaar.</p>
</div>
<script type="module">
  import { init } from './blur-woorden.js';
  const destroy = init(document.querySelector('[data-blur-woorden]'));
</script>
```

**React / Next.js**
```tsx
import { BlurWoorden } from '@/component-library/typography/blur-woorden/BlurWoorden';

<BlurWoorden
  eyebrow="Zo werkt het"
  regels={['Drie stappen naar je eigen werkplek.', 'Op het domein van Studio Wester.']}
  zachteRegels={[1]}
  tekst="Je kiest de apps, wij zetten ze klaar."
  id="kop-werkt"
/>
```

**WordPress** (6.5+)
```php
add_action( 'wp_enqueue_scripts', function () {
  $map = get_stylesheet_directory_uri() . '/component-library/blur-woorden';
  wp_enqueue_style( 'blur-woorden', "$map/blur-woorden.css", array(), '1.0.0' );
  wp_enqueue_script_module( 'blur-woorden', "$map/blur-woorden.js", array(), null );
} );
```
Zet de markup in een Custom HTML-blok en roep in de footer aan:
```html
<script type="module">
  import { init } from '/wp-content/themes/<thema>/component-library/blur-woorden/blur-woorden.js';
  document.querySelectorAll('[data-blur-woorden]').forEach((el) => init(el));
</script>
```
`basis.js` moet op `../../_kwaliteit/basis.js` naast de map staan (of pas het importpad aan).

## Markup-contract
| Element | Verplicht | Wat |
|---|---|---|
| root `[data-blur-woorden]` | ja | Krijgt `data-bw-verborgen` (synchroon), `data-bw-actief` (frame later), `data-bw-in` (in beeld) en `data-bw-af` (klaar). |
| `[data-bw-kop]` | ja (anders de eerste h1–h3) | De kop. Alle tekstknopen daarin worden woord-spans `.bw-woord` met `aria-hidden="true"`; inline-elementen zoals `<em>` blijven staan. |
| `[data-bw-regel]` | nee | Eén regel van de kop (display: block). `data-bw-zacht` = zachte tekstkleur. |
| `[data-bw-eyebrow]` | nee | Klein label boven de kop, komt 8 px omhoog. |
| `[data-bw-tekst]` | nee | Beschrijving, komt 10 px omhoog na `tekstVertraging`. |

## Opties
| Optie | Standaard | Wat |
|---|---|---|
| `stap` | `0.06` | Seconden tussen twee woorden. |
| `maxSpreiding` | `0.6` | Maximale tijd tussen eerste en laatste woord; bij lange koppen wordt de stap kleiner. |
| `blur` | `10` | Startblur per woord in px. |
| `drempel` | `0.4` | Deel van de kop dat in beeld moet zijn voordat hij start. |
| `tekstVertraging` | `0.3` | Seconden voordat de beschrijving start. |

CSS-variabelen op de root: `--bw-ink`, `--bw-zacht`, `--bw-accent`, `--bw-ease` (terugval: de eu-hosted-tokens `--ink`, `--ink-muted`, `--indigo-strong`, `--ease-out`). Timing per woord: opacity 0,7 s, blur en rise (24 % van de woordhoogte) 0,9 s.

## Toegankelijkheid
- De kop krijgt `aria-label` met de hele zin (alleen als hij er zelf geen heeft); de woord-spans zijn `aria-hidden`. Bij regels in losse spans zet de JS er een spatie tussen, ook als React ze tegen elkaar aan rendert.
- `prefers-reduced-motion: reduce`: de verborgen staat wordt nooit gezet, alles staat direct scherp. Zet de bezoeker het halverwege aan, dan springt de kop naar zijn eindbeeld.
- Bewegingspauze: `html[data-motion="paused"]` of het event `beweging:pauze` (detail `{ gepauzeerd: true }`) zet de kop direct scherp, ook midden in de overgang.
- Zonder JS staat alles gewoon zichtbaar (de CSS werkt alleen onder `data-bw-verborgen`).
- Contrast gemeten in licht en donker: kop 18,81 / 17,17, zachte regel 7,59 / 8,51, eyebrow 6,30 / 9,01.

## Valkuilen
- **Kopiëren en vertalen**: de tekst staat nog gewoon in de DOM (in losse spans), dus selecteren en vertalen werkt. Een sr-only kopie hadden we bewust niet: dan kopieer je de zin dubbel.
- **React**: de wrapper rendert de kop zelf uit `regels`. Zet je eigen children in een `[data-bw-kop]` die React beheert, wijzig ze dan niet terwijl de kop gesplitst is; `destroy()` zet precies de originele tekstknopen terug, zodat React ze daarna weer kan bijwerken.
- **Filter is duur**: blur op 10+ woorden tegelijk is prima, op honderd niet. Na afloop zet de module `data-bw-af`: geen `will-change` en `filter: none` meer.
- **Kop al in beeld bij laden** (bovenaan de pagina): hij komt dan direct binnen. Gebruik dit niet voor de hero.

## Herkomst
eu-hosted.com/nl (28-10-2026), sectie "Hoe het werkt". Daar met GSAP, ScrollTrigger en SplitText (samen een flinke chunk) en een `aria-label` op de h2. Getallen overgenomen als vertrekpunt: blur 10 px, rise 24 %, opacity 0,7 s, blur/rise 0,9 s, stap 0,06 s (max 0,6 s), eyebrow 0,45 s / 8 px, beschrijving 0,5 s / 10 px, ease-out (.16, 1, .3, 1).

**Wat wij beter doen**
- Geen library: CSS-overgangen met een vertraging per woord, plus één IntersectionObserver.
- Minder beweging = direct scherp (eu-hosted doet daar nog een fade van 0,25 s), en de bewegingspauze stopt ook een overgang die al loopt.
- Zonder JS gewoon leesbaar; `destroy()` zet de originele tekstknopen terug (veilig onder React).
- De spreiding is begrensd, zodat een lange kop niet seconden blijft hangen; de beschrijving wacht 0,3 s, zodat kop en tekst niet tegelijk vechten om aandacht.
