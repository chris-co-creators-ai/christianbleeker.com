# page-transitions

Paginaovergangen tussen gewone, meerdere-pagina's-sites (géén single-page-
app). Waar de browser **cross-document View Transitions** ondersteunt,
voegt deze module de activerende CSS-regel toe (`@view-transition
{ navigation: auto; }`) en laat de browser + CSS het volledige werk doen —
inclusief het morphen van "benoemde" gedeelde elementen (`.pt-share`, bv.
een header-logo dat op elke pagina hetzelfde is). Waar dat niet ondersteund
wordt, valt de module terug op een eigen JS-overlay: fade uit, écht
navigeren, fade weer in op de nieuwe pagina.

## Wanneer wel

- Statische, meerdere-pagina's-sites (geëxporteerde Next.js-site, gewone
  server-rendered site, WordPress) waar je toch het "vloeiende" gevoel van
  een single-page-app wilt, zonder er een SPA-router voor te bouwen.

## Wanneer niet

- Al een client-side router in gebruik (React Router, Next.js App Router
  met `next/link`)? Die navigatie is al niet-volledig-herladend — gebruik
  dan de eigen (experimentele) View Transitions-integratie van dat
  framework, niet deze module.
- Pagina's met formulieren-in-bewerking waar je een navigatie liever
  helemaal laat afvangen door een "weet je het zeker?"-dialoog — deze
  module onderschept kliks alleen om te faden, niet om te blokkeren.

## Installatie

```
component-library/effects/page-transitions/
├── page-transitions.js      # vanilla ES-module, 0 dependencies
├── page-transitions.css     # .pt-share + de fallback-overlay-stijlen
├── PageTransitions.tsx      # React/Next.js client-wrapper
├── demo.html                # drie losse pagina's, zie hieronder
├── demo-over.html
├── demo-contact.html
└── test/meet.mjs            # Playwright-meting
```

**Vanilla / elk framework — op élke pagina van de site hetzelfde:**

```html
<head>
  <!-- Zo vroeg mogelijk in <head>, vóór je andere scripts: in browsers
       met native cross-document View Transitions verwerpt de browser soms
       zijn eigen transitie-promise (bv. bij snel opeenvolgend navigeren) met
       een AbortError ("Transition was skipped"). `init()` zelf luistert ook
       mee (pageswap/pagereveal + unhandledrejection), maar dat draait pas
       zodra de module geladen is — te laat om de allereerste afwijzing nog
       te vangen. Deze regel, vóór alle andere content geparsed wordt, wint
       die race altijd. Zonder deze regel telt een R20-keuring de afwijzing
       als JS-fout, terwijl er niets stuk is. -->
  <script>window.addEventListener('unhandledrejection',function(e){var r=e.reason;if(r&&r.name==='AbortError'&&/transition was skipped/i.test(String(r.message||'')))e.preventDefault();});</script>
  <link rel="stylesheet" href="./page-transitions.css" />
</head>

<header>
  <a class="pt-share" href="/">Jouw Merk</a>
  <!-- .pt-share op hetzelfde element, met dezelfde inhoud, op elke pagina -->
</header>

<script type="module">
  import { init } from './page-transitions.js';
  const destroy = init(document.body);
  // destroy() bij opruimen (idempotent) — dit is geen "undo" van een
  // navigatie, alleen het stoppen van de interceptie/luisteraars.
</script>
```

**React / Next.js (statisch geëxporteerde, meerdere-pagina's-site):**

```tsx
import { PageTransitions } from '@/component-library/effects/page-transitions/PageTransitions';

<PageTransitions>
  <header>
    <a className="pt-share" href="/">Jouw Merk</a>
  </header>
  {/* de rest van de pagina, met gewone <a href> naar andere pagina's */}
</PageTransitions>
```

## Markup-contract

- `root`: een container (meestal `document.body`) waarbinnen linkklikken
  worden onderschept — `init()` voegt er zelf één `<div class="pt-overlay">`
  aan toe.
- Elke pagina laadt hetzelfde `page-transitions.css`/`.js`-paar en roept
  `init()` zelf aan — dit is geen SPA-router, elke pagina is en blijft een
  losse, volledige laad.
- **Gedeeld element**: geef een element dat op meerdere pagina's identiek
  terugkomt (logo, headerbalk) de klasse `pt-share` — in browsers met
  native ondersteuning morft de browser dat element dan tussen de oude en
  nieuwe pagina in plaats van het hard te wisselen. Meerdere gedeelde
  elementen op één pagina hebben elk een **unieke** `view-transition-name`
  nodig — kopieer de `.pt-share`-regel in je eigen CSS met een andere
  naam voor een tweede gedeeld element.

## Welke links worden overgeslagen (nooit onderschept)

- Links met een `target` die niet `_self` is (bv. `target="_blank"`).
- Links met het `download`-attribuut.
- Zuivere hash-ankers (`href="#iets"`) en hash-wissels op dezelfde pagina
  (pad + query gelijk, alleen de hash verschilt) — de browser scrollt
  gewoon, geen paginawissel.
- Links naar een andere origin (inclusief `mailto:`/`tel:`, die hebben
  geen HTTP(S)-origin).
- Kliks met Ctrl/Cmd/Shift/Alt ingedrukt, of niet de linkermuisknop (zo
  blijft "open in nieuw tabblad" gewoon werken).

## Opties (`init(root, opties)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `duur` | `320` | Duur van de fade in ms — hou dit in de pas met de CSS-variabele `--pt-duur`. |
| `forceerFallback` | `false` | Negeer eventuele native ondersteuning en gebruik altijd de JS-fallback. Zet dit als je liever overal exact hetzelfde gedrag hebt, ongeacht de browser. **Let op:** hiermee voegt de module de `@view-transition`-regel niet toe — zo botst de JS-fallback niet met een gelijktijdige, natieve overgang op dezelfde navigatie (dat gaf anders een "AbortError: Transition was skipped" in de console). |

CSS-variabelen (op `.pt-overlay`, gezet door de module):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--pt-kleur` | `#0b0b0c` | Achtergrondkleur van de fallback-overlay. |
| `--pt-duur` | `0.32s` | Transitieduur (zie optie `duur`). |
| `--pt-ease` | `cubic-bezier(.22,1,.36,1)` | Easing. |

## Toegankelijkheid

- **R1, minder beweging**: bij `prefers-reduced-motion: reduce` intercept-
  eert de module niets — links navigeren meteen, instant, zonder fade. Voor
  de native-transitiepad dooft `@media (prefers-reduced-motion: reduce)`
  in de CSS alle `::view-transition-*`-animaties (`animation: none
  !important`).
- De overlay krijgt `aria-hidden="true"` en `pointer-events` alleen aan
  zolang hij daadwerkelijk zichtbaar is (`pt-is-in`) — daarbuiten blokkeert
  hij nooit interactie.
- Focus: omdat elke overgang een échte paginanavigatie is, reset de focus
  gewoon zoals bij elke normale paginawissel (naar `<body>`/eerste
  focusbaar element) — geen extra focus-management nodig.

## Op WordPress

Geen build-stap nodig — voeg `page-transitions.css`/`.js` toe aan het
thema en laad ze op elke pagina, met `init(document.body)` na
`DOMContentLoaded`. Zie `reveal-on-scroll`'s README voor het volledige
`wp_enqueue_script_module()`-patroon.

## Valkuilen

- **`forceerFallback` weglaten in een browser die wél native ondersteunt**
  én zelf ook nog met JS de overlay proberen aan te sturen, botst met de
  browser: laat in dat geval de browser + CSS gewoon hun werk doen (dat is
  precies wat deze module standaard al doet).
- **Eén `.pt-share` per gedeeld element, nooit twee tegelijk** met dezelfde
  `view-transition-name` op één pagina — de browser eist unieke namen en
  breekt de transitie anders af.
- **bfcache**: als een bezoeker wegklikt (overlay fadet in) en dan via
  vorige/volgende teruggaat vóórdat de nieuwe pagina klaar was, kan de
  oude pagina terugkomen uit de bfcache terwijl de overlay nog "aan" stond
  op het moment van vertrek. De `pageshow`-listener (met `persisted:true`)
  herstelt de overlay dan direct — dit is al ingebouwd, je hoeft er niets
  voor te doen.
- **De `unhandledrejection`-regel uit "Installatie" overslaan**: dan
  logt een browser met native ondersteuning af en toe een onschuldige
  `AbortError: Transition was skipped` als paginafout zodra de browser zijn
  eigen transitie afbreekt (bijvoorbeeld bij snel opeenvolgend navigeren).
  Niets werkt daardoor minder, maar een geautomatiseerde keuring (of een
  console-zuiverheid-check) telt hem dan mee als JS-fout. De regel moet vóór
  alle andere scripts in `<head>` staan — pas in de module zelf toevoegen is
  te laat om de eerste afwijzing nog te vangen (zie de code-comment bij
  `pageswap`/`pagereveal` in `page-transitions.js`).
- **`destroy()` is geen "undo"**: het stopt alleen de luisteraars en
  verwijdert de overlay/`<style>`-tag. Een navigatie die al onderweg is,
  loopt gewoon door.

## Performance

Alleen `opacity` animeert (CSS-transitie op de overlay); de native
transitiepad is volledig aan de browser/compositor. Er wordt niets
gepolld en er draait geen `requestAnimationFrame`-lus buiten de twee
korte, eenmalige frames die de "aankomst"/"pageshow"-herstel-fasering
gebruiken.

## Herkomst

Patroon (cross-document View Transitions + JS-overlay-fallback voor
oudere browsers) is een generieke, bekende techniek uit de bredere
webplatform-documentatie over View Transitions — geen specifieke
referentie. Eigen implementatie. De sessievlag + dubbele-rAF-
fasering voor de fallback-aankomst is dezelfde techniek als
`reveal-on-scroll` en `punt-zoom-intro` in deze bibliotheek gebruiken om
een "verbergen animeert niet mee"-flits te voorkomen.
