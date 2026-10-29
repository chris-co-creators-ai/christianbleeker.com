# levende-kaarten

Raster van kaarten (3 kolommen desktop, 2 op tablet, 1 op mobiel) met elk een **kleine lus-animatie als beeld**, plus label, h3, tekst en een meta-rij met appnaam en mono-domein. Het beeld kies je per kaart met `data-lk-visual`. Negen visuals:

| `data-lk-visual` | Beeld | Lus |
|---|---|---|
| `reis` | Een lijn groeit langs vier pagina's die één voor één binnenkomen | 7,2 s |
| `stapel` | Rollende stapel van 7 taken (scale 1 → .92 → .85 → .78, opacity 1 → .72 → .42 → .16) | 9,8 s |
| `schild` | Signalen van links en rechts lopen dood op een slot-tegel met een ademende halo | 4,2 s |
| `spotlight` | Drie kanalen; de spotlight loopt van boven naar beneden, het icoon tikt mee | 6 s |
| `flow` | Formulier → wiki → taak met een reizende stip, voortgangslijn en tikkende tegels | 5,4 s |
| `handtekening` | Document; de handtekening zet zichzelf en daarna verschijnt "Getekend" | 6 s |
| `agenda` | Vier slots draaien als carrousel door het midden (ma → di → wo → do) | 11,2 s |
| `balken` | Drie lijsten waarvan de balk vult | 6 s |
| `kijkers` | Drie lezers die om de beurt oplichten | 6 s |

Kaarten komen binnen met 12 px rise in 0,55 s, `--reveal-delay` 0,04 s per kaart.

## Wanneer wel
- Een overzicht van features, apps of diensten waarbij elk onderdeel iets *doet* dat je in één beeld kunt laten zien.
- Een rustige, premium pagina: de lussen zijn klein en traag, niet schreeuwerig.

## Wanneer niet
- Niet voor meer dan ±9 kaarten op één scherm: dan wordt het druk. Voor lange lijsten: `cards/hover-set` of een gewone lijst.
- Niet als de kaarten links zijn naar detailpagina's zonder dat je de linkstijl toevoegt (deze kaarten zijn bewust niet klikbaar).
- Niet met verzonnen cijfers die echt lijken (R8): de getallen in de beelden zijn illustratie, zet er geen "live"-claims bij.

## Installatie
```
cards/levende-kaarten/
├── levende-kaarten.js     binnenkomst + pauze (de lussen zelf zijn CSS)
├── levende-kaarten.css    raster, kaart, 9 visuals, keyframes, minder beweging
├── LevendeKaarten.tsx     React/Next-wrapper
├── demo.html              alle 9 visuals: kopieer de markup per kaart hieruit
└── test/meet.mjs
```

**Vanilla**
```html
<link rel="stylesheet" href="./levende-kaarten.css">
<div data-levende-kaarten id="kaarten">
  <div class="lk-raster">
    <article class="lk-kaart"> … zie markup-contract … </article>
  </div>
</div>
<script type="module">
  import { init } from './levende-kaarten.js';
  const destroy = init(document.getElementById('kaarten'));
</script>
```

**React / Next.js**
```tsx
import { LevendeKaarten } from '@/component-library/cards/levende-kaarten/LevendeKaarten';

<LevendeKaarten>
  <article className="lk-kaart">{/* … */}</article>
</LevendeKaarten>
```
De wrapper rendert zelf de `div[data-levende-kaarten] > .lk-raster`.

**WordPress** (6.5+): enqueue `levende-kaarten.css` en de module (`wp_enqueue_script_module`, versie `null`), plak de kaarten uit `demo.html` in een Custom HTML-blok en roep `init()` aan in een `<script type="module">` in de footer. Zonder JS lopen de lussen ook; je mist dan alleen de binnenkomst en de pauze buiten beeld.

## Markup-contract
```html
<article class="lk-kaart">
  <div class="lk-media">
    <div class="lk-visual" data-lk-visual="stapel" data-lk-tint="indigo" aria-hidden="true">
      <div class="lk-binnen lk-midden"> … beeld … </div>
    </div>
  </div>
  <div class="lk-tekst">
    <p class="lk-label">Projectbord</p>
    <h3>Zie in één oogopslag wie wat doet</h3>
    <p class="lk-body">…</p>
    <div class="lk-meta"><strong>Wolkhaven Projecten</strong><code>projecten.wester.nl</code></div>
  </div>
</article>
```
- `.lk-visual` is altijd `aria-hidden="true"`: het beeld is decor, de tekst eronder draagt de inhoud.
- `data-lk-tint="indigo|lucht|groen"` kleurt lijn, halo, licht en iconen (standaard indigo). `data-lk-vlak="rustig"` haalt de radiale gloed weg.
- Vaste aantallen per beeld (de vertragingen staan per item in de CSS): `stapel` 7, `agenda` 4, `reis` 4, `spotlight`, `balken`, `kijkers` en elke `.lk-seinen` 3, `flow` 3 knopen.
- De binnenkant per visual (klassen `lk-reis__*`, `lk-stapel`, `lk-schild__*`, `lk-seinen`, `lk-spot__*`, `lk-licht`, `lk-flow__*`, `lk-doc__*`, `lk-slots`, `lk-balk*`, `lk-kijkers*`, `lk-lid`, `lk-rol`) staat compleet in `demo.html`; kopieer een kaart en vervang de teksten.
- De handtekening is een eigen SVG-pad met `pathLength="1"`; elk ander pad werkt, zolang het die `pathLength` houdt.

## Opties
| Optie | Standaard | Wat |
|---|---|---|
| `stap` | `0.04` | Seconden extra vertraging per kaart; zet je zelf `--reveal-delay` inline, dan blijft die staan. |
| `rootMargin` | `"0px 0px -8% 0px"` | Wanneer een kaart binnenkomt. |

CSS-variabelen op de root: `--lk-ink`, `--lk-zacht`, `--lk-vlak(-hoog)`, `--lk-mist`, `--lk-lijn(-sterk)`, `--lk-indigo(-sterk/-zacht)`, `--lk-lucht(-zacht)`, `--lk-goed(-zacht)`, `--lk-ease`, `--lk-soft`, `--lk-io`, `--lk-sans`, `--lk-mono`, `--lk-schaduw` (terugval: de eu-hosted-tokens).

## Toegankelijkheid en zuinigheid
- Lussen animeren alleen `transform` en `opacity` (de handtekening tekent één klein pad met `stroke-dashoffset`). Ook de ring om de flow-tegels is een laag die vervaagt in plaats van een bewegende `box-shadow`.
- **Buiten beeld** staan de lussen van die kaart stil (`data-lk-uitbeeld`, IntersectionObserver per kaart); ook vóór een kaart ooit in beeld kwam.
- **Bewegingspauze** (`html[data-motion=paused]` / `beweging:pauze`) en **verborgen tab**: alle lussen stil, kaarten direct zichtbaar.
- **Minder beweging**: geen enkele lus, en elk beeld staat stil op een eindbeeld dat iets vertelt: stapel met midden plus één erboven en eronder, handtekening gezet met badge, agenda met drie slots, flow vol, eerste rij uitgelicht.
- Contrast gemeten in licht en donker: h3 18,81 / 17,17, tekst 7,59 / 8,51 (op `--surface-raised`), label en domein ≥ 7.
- Zonder JS: kaarten zichtbaar, lussen lopen (alleen geen pauze buiten beeld).

## Valkuilen
- **Meer of minder items** dan de vaste aantallen: de vertragingen kloppen dan niet meer (gaten of overlap). Voeg een `:nth-child`-regel toe in je eigen CSS.
- **Visual zonder hoogte**: `.lk-media` is 240 px (256 px vanaf 640 px). Pas je die aan, controleer dan `stapel` en `agenda`, die naar boven en opzij uitlopen (de kaart knipt ze netjes af).
- **Destroy midden in de binnenkomst**: lopende fades lopen uit naar zichtbaar; de kaart blijft nooit half verborgen staan.
- **Container queries**: `schild` en `flow` rekenen met `cqw`. Werkt in alle moderne browsers; in heel oude browsers staan de stippen stil aan het begin van de lijn.

## Herkomst
eu-hosted.com/nl (28-10-2026), sectie "Negen apps" (`features-module`). Keyframes en duren als vertrekpunt: `rolling` 9,8 s in 7 stappen, `journey*` 7,2 s, `privateSignal`/`privateHalo` 4,2 s, `spotlight`/`iconPulse` 6 s, `flowTravel`/`flowProgress`/`flowNode` 5,4 s, `signDraw`/`signedBadge` 6 s, `slotCycle` 11,2 s, `importFill` 6 s, `teamHighlight` 6 s, en de binnenkomst (12 px, .55 s, `--reveal-delay` .04 s). Teksten, namen, iconen en het handtekeningpad zijn van ons (Wolkhaven voor Studio Wester).

**Wat wij beter doen**
- Pauze buiten beeld zoals eu-hosted (daar via een React-hook en `data-motion-active`), hier zonder framework: twee IntersectionObservers voor het hele raster, ook bruikbaar in WordPress.
- Minder beweging toont per beeld een zinvol eindbeeld. Bij eu-hosted valt de rollende stapel dan samen tot één kaart en blijven spotlight en lezers leeg; hier staat de stapel met één kaart erboven en eronder en is de eerste rij uitgelicht.
- De reis en de stapel resetten met een korte fade in plaats van in één frame terug te springen.
- Het schild krijgt signalen van twee kanten, de agenda draait in weekvolgorde.
- De flow-ring animeert via opacity op een laag, niet via `box-shadow` (geen repaint per frame).
