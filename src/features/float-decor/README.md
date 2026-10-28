# float-decor

Vijf lichte decor-hulpjes, elk via een eigen data-attribuut, onder één
gedeeld contract: een zwevend/dobberend object (`data-float`), een
kantel-utility (`data-tilt="-6"`), confetti-stippen rond een foto
(`data-confetti`), een offset-fotokader (`data-offset-kader`) en een
draaiende badge/stempel (`data-badge`). Puur decoratief: geen tekst, geen
klikbare inhoud.

## Wanneer wel

- Een pagina die net iets speelser mag ogen: een zwevend icoontje naast een
  kop, een scheef geplakt "Nieuw"-label, een fotokader met karakter.
- Elk attribuut werkt zelfstandig — gebruik er één, of alle vijf door
  elkaar, zonder dat ze van elkaar afhangen.

## Wanneer niet

- Niet op content die zelf al beweegt of aandacht vraagt (een video, een
  countdown) — twee bewegende dingen naast elkaar trekt het oog uit elkaar.
- Niet voor iets dat een gebruiker moet kunnen lezen of aanklikken — dit
  zijn decoratie-hulpjes, geen componenten met eigen inhoud.
- `data-confetti`/`data-offset-kader` niet op een element zonder eigen
  hoogte/breedte (bv. een lege `<span>`) — de pseudo-elementen hebben iets
  om zich rond of achter te plaatsen nodig.

## Installatie

```
component-library/effects/float-decor/
├── float-decor.js       # vanilla ES-module, 0 dependencies
├── float-decor.css      # namespaced op 5 data-attributen, geen globale selectors
├── FloatDecor.tsx        # React/Next.js client-wrapper
├── demo.html             # zelfstandige demo (alle 5 hulpjes)
└── test/meet.mjs         # Playwright-meting
```

### Vanilla

```html
<link rel="stylesheet" href="./float-decor.css" />

<!-- zwevend object -->
<div data-float style="--fd-zweef-amp: -14px; --fd-zweef-duur: 4s;">✎</div>

<!-- kantel-utility -->
<span data-tilt="-6">Nieuw: kleurenadvies</span>

<!-- confetti rond een foto -->
<img class="foto" src="team.jpg" alt="Het team van Studio Wester" data-confetti
     style="--fd-confetti-1:#ea580c; --fd-confetti-2:#2f6fed; --fd-confetti-3:#f2b705;" />

<!-- offset-fotokader -->
<img class="foto" src="pand.jpg" alt="Het pand van Studio Wester" data-offset-kader
     style="--fd-kader-x: 16px; --fd-kader-y: 16px; color: #ea580c;" />

<!-- draaiende badge -->
<div class="badge" data-badge style="--fd-draai-duur: 22s;">WARE AMBACHT SINDS 1998</div>

<script type="module">
  import { init } from './float-decor.js';
  const destroy = init(document.body); // vindt alle vijf data-attributen binnen root
</script>
```

`data-confetti` en `data-offset-kader` zijn **pure CSS** — ze werken al
zonder de `<script>`-regel. `data-tilt` heeft JS nodig (zet de graden-
waarde om naar de CSS-variabele `--fd-tilt`); zonder JS blijft het element
gewoon recht (0deg, geen fout). `data-float`/`data-badge` animeren ook
zonder JS (de CSS start de animatie zelf); JS voegt alleen de buiten-
beeld-pauze toe.

### React / Next.js (App Router)

```tsx
import { FloatDecor } from '@/component-library/effects/float-decor/FloatDecor';

<FloatDecor>
  <span data-tilt="-6">Nieuw</span>
  <img src="team.jpg" alt="Het team" data-confetti />
</FloatDecor>
```

### Op WordPress

Geen build-stap nodig. Zet de map in je thema, enqueue de CSS en (optioneel,
voor de kantel-utility en de buiten-beeld-pauze) de JS-module zoals
beschreven in de `reveal-on-scroll`-README (`wp_enqueue_script_module()`,
geen versienummer). Plaats de data-attributen rechtstreeks in een Custom
HTML-blok of widget-tekst.

## Markup-contract

| Attribuut | Nodig | CSS-variabelen |
|---|---|---|
| `data-float` | JS optioneel (alleen voor buiten-beeld-pauze) | `--fd-zweef-amp` (px, standaard `-12px`), `--fd-zweef-duur` (standaard `4.5s`) |
| `data-tilt="<graden>"` | JS verplicht (zet `--fd-tilt`) | — |
| `data-confetti` | Geen JS nodig | `--fd-confetti-1`/`-2`/`-3` (kleuren, standaard oranje/blauw/geel) |
| `data-offset-kader` | Geen JS nodig | `--fd-kader-x`/`-y` (px, standaard `14px`), `--fd-kader-kleur` (standaard `currentColor`) |
| `data-badge` | JS optioneel (alleen voor buiten-beeld-pauze) | `--fd-draai-duur` (standaard `22s`) |

`init(root)` zoekt binnen `root` (root zelf meegerekend als het matcht) naar
alle vijf attributen. Voor `data-float`/`data-badge` zet de module zelf
`aria-hidden="true"` als het element dat attribuut nog niet had (zie
Toegankelijkheid) — zet zelf `aria-hidden="false"` ná `init()` als een
badge/zwevend object uitzonderlijk wél voorgelezen moet worden.

## Opties

`init(root, opties)`:

| Optie | Standaard | Omschrijving |
|---|---|---|
| `rootMargin` | `"80px"` | IntersectionObserver-rootMargin voor de buiten-beeld-pauze (float/badge). |

## Toegankelijkheid

- **`data-float`/`data-badge` krijgen automatisch `aria-hidden="true"`**
  (tenzij je zelf al een `aria-hidden`-attribuut zette) — het zijn
  sfeer-elementen, geen content (R15).
- **`data-confetti`/`data-offset-kader`** zijn pseudo-elementen
  (`::before`) — per definitie onzichtbaar voor een schermlezer, geen
  extra `aria-hidden` nodig.
- **`prefers-reduced-motion: reduce`**: de bob-animatie (`data-float`) en de
  draai-animatie (`data-badge`) staan uit, direct via een CSS
  `@media`-blok — geen JS nodig, reageert live op een wissel (R1).
- **Buiten beeld**: JS pauzeert `data-float`/`data-badge` via
  `animation-play-state: paused` zodra het element de viewport verlaat
  (`rootMargin: 80px`), en hervat zodra het terugkomt (R18).

## Valkuilen

- **`data-tilt` zonder JS blijft recht.** De CSS-variabele `--fd-tilt` heeft
  een standaardwaarde van `0deg` — zonder de `<script>`-regel toont het
  element gewoon horizontaal, geen fout, alleen geen kanteling.
- **`z-index: -1` op de pseudo-elementen** (confetti, offset-kader) vraagt
  om `isolation: isolate` op de host — anders kan de stip/het kader wegzakken
  achter een ouder-achtergrond in plaats van alleen achter de host zelf. Zit
  al in `float-decor.css`; laat het niet weg als je de regel kopieert naar
  eigen CSS.
- **Twee `data-badge`/`data-float`-elementen met dezelfde duur** kunnen in
  de pas gaan lopen en er "machinaal" uit gaan zien — geef ze een eigen
  `--fd-zweef-duur`/`--fd-draai-duur` voor variatie (zie demo).
- **Confetti-stippen buiten de rand van hun container** (`inset: -1.75rem`)
  kunnen door een `overflow: hidden` op een strakkere ouder worden
  afgesneden — geef de ouder van een `data-confetti`-foto wat lucht.

