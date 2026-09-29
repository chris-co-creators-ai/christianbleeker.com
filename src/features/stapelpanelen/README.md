# stapelpanelen

2 tot 5 panelen (diensten, stappen) onder een kop. Tijdens het scrollen blijft het blok staan: het open paneel schuift dicht terwijl het volgende opengaat, gekoppeld aan de scrollpositie. De koppen blijven zichtbaar als tabs, zodat je altijd ziet waar je bent. Na het laatste paneel scrolt de pagina gewoon door. Zonder JavaScript staat alles open onder elkaar.

## Wanneer wel

- Een reeks van 2 tot 5 diensten of stappen die elk een eigen beeld en tekst hebben, en die je als geheel wilt tonen.
- Als de bezoeker de volgorde mag ervaren zonder te klikken, terwijl een klik op een kop ook werkt.

## Wanneer niet

- Meer dan 5 panelen: de scrollreis wordt te lang. Gebruik een gewone uitklapper (`accordions/`).
- Zijwaarts scrollen door een rij kaarten: dat is `horizontal-scroll-pin`. Een genummerde tijdlijn met een vullende lijn: `sticky-timeline`.
- Panelen met zo veel inhoud dat ze niet in een schermhoogte minus de koppen passen. Onder 520 px vensterhoogte schakelt het onderdeel zelf over naar de uitklapper.

## Installatie

```
scroll/stapelpanelen/
├── stapelpanelen.js     # vanilla ES-module, 0 dependencies
├── stapelpanelen.css    # namespaced op data-attributen
├── Stapelpanelen.tsx    # React/Next.js client-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla**

```html
<link rel="stylesheet" href="./stapelpanelen.css" />
<script type="module">
  import { init } from './stapelpanelen.js';
  const destroy = init(document.querySelector('#diensten'), { breakpoint: 768 });
</script>
```

**React / Next.js (App Router)**

```tsx
import { Stapelpanelen } from '@/component-library/scroll/stapelpanelen/Stapelpanelen';

<Stapelpanelen
  panelen={[
    { titel: 'Strategie', inhoud: <Strategie />, achtergrond: '#efe8d8' },
    { titel: 'Ontwerp', inhoud: <Ontwerp /> },
  ]}
/>
```

De inhoud van een paneel vult de volledige paneelhoogte (`height: 100%`); centreer en vul die zelf, zoals `.dienst` in `demo.html`.

**WordPress**: zet de markup uit het contract in een Custom HTML-blok (of in je themasjabloon), laad de CSS in het thema en de JS als `type="module"` via `wp_enqueue_script` met het `script_loader_tag`-filter. Het onderdeel heeft geen build nodig.

## Markup-contract

```html
<section id="diensten" data-stapelpanelen aria-label="Onze diensten">
  <div data-sp-track>
    <div data-sp-stage>
      <article data-sp-item style="--sp-item-bg:#efe8d8; --sp-item-ink:#1f2e27">
        <h3 data-sp-kop>
          <button type="button" data-sp-knop>
            <span data-sp-nr aria-hidden="true">01</span>
            <span data-sp-titel>Strategie</span>
            <span data-sp-icoon aria-hidden="true"></span>
          </button>
        </h3>
        <div data-sp-paneel><div data-sp-inhoud> ... jouw inhoud ... </div></div>
      </article>
      <!-- 1 tot 4 items meer -->
    </div>
  </div>
</section>
```

Het onderdeel zet zelf `data-sp-modus` (`pin`, `uitklap` of `open`), `data-sp-motor` (`css` of `js`), `aria-controls`, `aria-current`, `aria-expanded`, `data-sp-actief`, `data-sp-open`, `inert` (alleen uitklap), de `--sp-n`/`--sp-i`/`--sp-ease`-variabelen en één verborgen `[data-sp-live]`-element. `destroy()` haalt dat allemaal weer weg.

## Opties

| Optie | Standaard | Betekenis |
|---|---|---|
| `breakpoint` | `768` | Onder deze breedte (px) geen pin |
| `mobiel` | `'uitklap'` | Onder het breakpoint: `'uitklap'` (gewone uitklapper, eerste open) of `'onder'` (alles open onder elkaar) |
| `motor` | `'auto'` | `'auto'` gebruikt de CSS-scrolltimeline als de browser die kent, `'css'` idem, `'js'` dwingt de terugval af |
| `rust` | `0.2` | Deel (0 tot 0,4) van elk scrollstuk waarop een paneel stilstaat voordat het volgende beweegt |
| `minHoogte` | `520` | Onder deze vensterhoogte (px) geen pin |

CSS-variabelen op de root: `--sp-bg`, `--sp-ink`, `--sp-zacht`, `--sp-lijn`, `--sp-accent`, `--sp-kop` (hoogte van een kop, standaard 4,5rem), `--sp-pad`, `--sp-per` (scrolllengte per overgang, standaard 100svh). Per item: `--sp-item-bg`, `--sp-item-ink`.

## Hoe het werkt

Eén getal stuurt alles: de voortgang `p` (0 = paneel 1 open, N-1 = laatste open). Item `i` staat op `translateY(i*kop + H*clamp(i-p, 0, 1))`, met `H` = vensterhoogte min N koppen. Zo stapelen de open koppen boven en wachten de andere onderaan; een later paneel schuift als een gordijn over het vorige. De tekst wordt dus niet opnieuw gelegd, alleen verplaatst (transform en opacity, R18).

- **Route CSS** (Chrome, Edge, Safari 26+): `view-timeline` op de wrapper, `animation-range: contain` en een `linear()`-easing die de rustmomenten bevat. Gemeten: er draait een echte `ScrollTimeline`. JS doet dan alleen toegankelijkheid.
- **Route JS** (terugval, bijvoorbeeld Firefox): dezelfde formule; één `requestAnimationFrame` per scrollframe schrijft `--sp-t`, alleen zolang de wrapper in beeld is (`IntersectionObserver`).
- De wrapper is `100svh + (N-1) * 100svh` hoog, dus N x viewporthoogte, in `svh` en niet `vh` (mobiele adresbalk). Er wordt niets aan het scrollen zelf veranderd.

## Toegankelijkheid

- De koppen zijn `<button>`s met `aria-controls`. Klik of Enter/Spatie scrolt naar dat paneel (pin) of klapt het open (uitklap).
- De actieve kop heeft `aria-current="true"` en `aria-expanded="true"`; een verborgen `aria-live="polite"`-element meldt "Paneel 2 van 3: Ontwerp" bij elke wissel.
- Alle inhoud blijft in de DOM en bereikbaar met Tab. Valt de focus in een dicht paneel, dan scrolt de pagina er direct naartoe zodat het opengaat. Het blok gebruikt `overflow: clip`, zodat de browser het niet zelf intern kan verschuiven.
- Minder beweging: alles open onder elkaar, geen pin, live omschakelbaar. Mobiel en zonder JS: geen pin.
- Focusring: 2 px, in de kop naar binnen getekend zodat hij niet wordt afgeknipt.

## Valkuilen

- **Geen sticky header erboven mee laten schuiven**: het blok is een volledig scherm hoog en plakt aan `top: 0`. Een vaste sitekop legt zich dus over de eerste kop.
- **Geen `overflow: hidden` of `clip` op een voorouder** van het onderdeel: dat breekt `position: sticky`.
- **Inhoud moet passen** in vensterhoogte min N koppen (bij 900 px hoog en 3 panelen circa 684 px). Wat niet past wordt afgeknipt; houd tekst kort of verlaag `--sp-kop`.
- De CSS-route animeert een geregistreerde variabele; die draait op de hoofdthread. Voor de paar panelen van dit onderdeel is dat geen probleem, voor tientallen zware elementen per paneel wel.
- Het onderdeel kent geen "sla dit over"-knop: het is scrollen door N-1 schermhoogtes. Houd het bij 5 panelen of minder.

## Herkomst

Gedrag gezien op merkmotief.nl ("Gestapelde diensten die opengaan tijdens het scrollen": Merkpositionering, Merkcreatie, Websites en online), waar het met GSAP ScrollTrigger (pin plus scrub, panelen van 100% naar 0% hoogte) is gebouwd. Wij schreven het zelf, zonder GSAP en zonder hun code. Wat wij anders doen: geen hoogte-animatie maar een transform (geen herlayout); CSS scroll-driven animations met een lichte JS-terugval; rustmomenten per paneel; toetsenbord, `aria-current`, focus die een dicht paneel opent; en een uitklapper of open lijst waar de pin niet past (mobiel, minder beweging, geen JS).
