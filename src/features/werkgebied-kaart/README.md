# werkgebied-kaart

Een getekende kaart (inline SVG, geen Google, geen OpenStreetMap, 0 externe verzoeken) van het werkgebied van de klant, met de projecten als punten. De kaart blijft staan terwijl je scrolt; bij elk projectkaartje dat je passeert vliegt de kaart rustig naar het bijbehorende punt, dat punt wordt actief en het kaartje ernaast krijgt de nadruk (foto, plaatsnaam, één zin, link). Punten en een knopenrij onder de kaart springen naar een project. Zonder JavaScript staat de kaart met alle punten er, plus een gewone lijst projecten.

De kaart maak je zonder handwerk met `maak-kaart.mjs`: plaatsen met lat/lon plus een regio-omtrek in de repo in, SVG uit.

## Wanneer wel

- Een klant die lokaal werkt en dat wil laten zien: bouw, groen, dakdekkers, zorg, zakelijke dienstverlening met een regio.
- 3 tot 6 projecten met een plaats en een foto. Minder dan 3 is een kaart zonder verhaal, meer dan 6 wordt een lange scroll.
- Als rustig wow-moment op de homepage of een pagina "Projecten".

## Wanneer niet

- Voor een echte, zoekbare kaart met routes of een adres: gebruik `media/map-facade` (echte kaart pas na een klik).
- Als de klant landelijk of internationaal werkt: een omtrek van een regio zegt dan niets.
- Zonder foto's of zonder plaatsnaam per project: dan is het alleen een kaart met stippen.

## Installatie

```
component-library/scroll/werkgebied-kaart/
├── werkgebied-kaart.js     # vanilla ES-module, 0 dependencies
├── werkgebied-kaart.css    # namespaced op .wk
├── WerkgebiedKaart.tsx     # React/Next.js client-wrapper
├── maak-kaart.mjs          # lijst plaatsen + regio-omtrek → SVG
├── data/                   # demo-invoer: wester-plaatsen.json + regio-west-friesland.geojson
├── media/                  # demofoto's (webp, ≤ 150 kB)
├── demo.html               # zelfstandige demo (Bouwbedrijf Wester)
└── test/meet.mjs           # Playwright-meting
```

**1. De kaart maken** (eenmalig per klant, Node 18+, geen installatie)

```
node maak-kaart.mjs plaatsen.json regio.geojson > kaart.svg
node maak-kaart.mjs plaatsen.json regio.geojson --in pagina.html   # vervangt wat tussen <!--wk-kaart:start--> en <!--wk-kaart:end--> staat
```

`plaatsen.json`:

```json
{ "breedte": 800, "plaatsen": [
  { "id": "hoorn", "naam": "Hoorn", "lat": 52.6425, "lon": 5.0597 },
  { "naam": "Alkmaar", "lat": 52.6324, "lon": 4.7534 }
] }
```

Een plaats met `id` is een project-punt (link naar `#wk-<id>`); zonder `id` is het een grijs stipje met naam voor de oriëntatie. `regio.geojson` is een Polygon of MultiPolygon in lon/lat; LineString-features worden dunne wegen. Een plaats zonder `id` met `"water": true` wordt alleen een cursieve naam (IJsselmeer). Water krijgt een golfpatroon; zo is de landingsplek van elk punt gevuld met context. Zet hem zelf in de repo (zelf vereenvoudigd, of gehaald uit een bron waarvan je de licentie kent); het script downloadt niets.

**2. Vanilla / elk framework**

```html
<link rel="stylesheet" href="./werkgebied-kaart.css" />
<div class="wk" data-wk>
  <div class="wk-podium" data-wk-podium>
    <div class="wk-kaartvak"> …de SVG uit maak-kaart… </div>
  </div>
  <ol class="wk-lijst">
    <li class="wk-project" id="wk-hoorn" data-wk-project="hoorn">
      <article class="wk-kaartje"> <img class="wk-foto" …> … </article>
    </li>
  </ol>
</div>
<script type="module">
  import { init } from './werkgebied-kaart.js';
  const destroy = init(document.querySelector('[data-wk]'), { zoom: 1.9 });
</script>
```

**React / Next.js (App Router)**

```tsx
import { WerkgebiedKaart } from '@/component-library/scroll/werkgebied-kaart/WerkgebiedKaart';

<WerkgebiedKaart zoom={1.9}>
  <div className="wk-podium" data-wk-podium>…</div>
  <ol className="wk-lijst">…</ol>
</WerkgebiedKaart>
```

Plak de SVG als markup in de JSX (of laad hem als string bij bouwtijd); hij hoeft niet op de client gemaakt te worden.

**WordPress**

1. Kopieer de map naar `wp-content/themes/<thema>/component-library/werkgebied-kaart/`.
2. Laad CSS en module met `wp_enqueue_style` en `wp_enqueue_script_module` (zoals bij `scroll/reislijn`); sluit het script uit van JS-combinatie of minificatie.
3. Zet de markup in een Custom HTML-blok en roep `init()` aan na `DOMContentLoaded`.

## Markup-contract

| Element | Betekenis |
|---|---|
| root (aan `init` gegeven, class `wk`) | Bevat alles hieronder. Krijgt `wk-js`, `data-wk-actief`, `data-wk-beweging` en CSS-variabelen. Geen `overflow: hidden` op de root of een voorouder (dan werkt sticky niet) |
| `[data-wk-podium]` | Blok met de kaart. Op mobiel is het zelf sticky (kaart boven), op desktop het kaartvak erin |
| `svg[data-wk-kaart]` met `g[data-wk-wereld]` | De kaart. Komt uit `maak-kaart.mjs` |
| `a[data-wk-punt="id"]` met `data-x`, `data-y` | Een projectpunt in de SVG (positie in viewBox-eenheden) |
| `[data-wk-project="id"]` | Het projectkaartje; volgorde in de lijst = volgorde van de reis. Het `id`-attribuut `wk-<id>` is het anker van het punt |

Punten en namen hebben op het scherm een vaste grootte, ongeacht de schaal van de kaart: de CSS-maten (`r`, `font-size`) in de SVG zijn schermpixels, want `init` rekent de schaal van de kaart weg.

Kleur en maat via CSS-variabelen op `.wk` of hoger: `--wk-land`, `--wk-water`, `--wk-kust`, `--wk-accent`, `--wk-punt`, `--wk-duur` (vluchtduur), `--wk-hoogte` (kaarthoogte desktop), `--wk-hoogte-mobiel`.

## Opties

| Optie | Standaard | Betekenis |
|---|---|---|
| `zoom` | `1.9` | Vergroting op het actieve punt (1 = de hele kaart) |
| `duur` | `1400` | Duur van de vlucht in ms |
| `drempel` | `0.15` | Fractie van een kaartjeshoogte waarbinnen het eerste kaartje nog als "overzicht" telt (de kaart is dan nog niet vastgezet) |
| `bijWissel` | – | `(id \| null, index) => void` bij een nieuw actief project (`null` = overzicht) |

`init(root, opties)` geeft `destroy()` terug: die haalt listeners, observers, timers, klassen, attributen, CSS-variabelen en de knopenrij weg en is veilig om twee keer aan te roepen.

## Toegankelijkheid

- Punten zijn links met `role="button"` en een naam (`aria-label`); Enter en Spatie kiezen het project. Focus is zichtbaar: een ring om het punt.
- De actieve staat staat in `aria-current="true"` op punt, knop en kaartje, niet alleen in kleur.
- Omdat de kaart inzoomt en andere punten dan uit beeld raken, voegt `init` een balk met knoppen met plaatsnamen toe onder de kaart (`role="group"`, echte `<button>`s; nooit over de kaart heen). Tab naar een punt buiten het ingezoomde stuk laat de kaart en de pagina naar dat punt gaan, zodat de focus nooit op iets onzichtbaars staat.
- De kaartgroep en de contextplaatsen zijn decoratie (`aria-hidden`).
- Minder beweging: geen vlucht (transities uit), klikken scrollt direct in plaats van vloeiend; live omschakelen werkt.
- Zonder JavaScript: de kaart met alle punten, elk punt is een gewone link naar zijn kaartje in de lijst eronder; niets is verborgen.
- Contrast: labels en kaartjestekst ≥ 4,5:1 (gemeten in de test).

## Valkuilen

- **De omtrek in de demo is een benadering.** `data/regio-west-friesland.geojson` is met de hand getekend uit een handvol kustpunten en is geen kadastrale of topografische grens. Voor een klant: teken of vereenvoudig zelf een echte omtrek (bijvoorbeeld uit CBS of PDOK-gebiedsgrenzen, met controle van de licentie) en zet die in de repo.
- **Projectie:** equirectangulair met cos(gemiddelde breedtegraad); voor een regio van enkele tientallen kilometers is de vertekening < 1%. Voor heel Nederland of groter: niet geschikt.
- **Afgeknipte namen** verdwijnen na de landing (klasse `wk-af`); na resize of draaien blijft het actieve project staan (alleen bij een breedtewijziging, niet bij de adresbalk).
- **Labels aan de rechterrand** klappen automatisch naar links (`text-anchor: end`) zodat ze niet worden afgeknipt.
- **Voorouders met `overflow: hidden`** breken `position: sticky`. Gebruik `overflow: clip` als je iets moet afknippen.
- **Foto's** met `width`, `height` en `loading="lazy"` (geen layout-shift). Bewaar ze ≤ 150 kB (webp); de demo gebruikt 800×600.
- **Links in de kaartjes** (`#project-…`) zijn in de demo bewust dood: vul de echte project-URL's in.
- **Eén per pagina:** de ids `wk-<id>` zijn uniek per project; twee kaarten op één pagina hebben verschillende ids nodig.

## Meten

```
node scroll/werkgebied-kaart/test/meet.mjs                    # Chromium
MEET_BROWSER=webkit  PLAYWRIGHT_BROWSERS_PATH=<machine/playwright-browsers> node scroll/werkgebied-kaart/test/meet.mjs
MEET_BROWSER=firefox PLAYWRIGHT_BROWSERS_PATH=<machine/playwright-browsers> node scroll/werkgebied-kaart/test/meet.mjs
```

Poort 4613 (`MEET_PORT` overschrijft). Dekt: `maak-kaart.mjs` (geldige SVG via DOMParser, juist aantal punten, projectie, demo = uitvoer van het script, foutmelding); actief project volgt de scrollpositie (aria-current, klasse, transform van de kaartgroep, punt in het midden van de kaart); de kaart blijft staan; klik, Enter, Spatie en de knopenrij; toetsenbord en focus; minder beweging (ook live omzetten); mobiel 390 px (overflow via `clientWidth`, kaart boven, kaartje volledig in beeld, raakvlak ≥ 40 px); zonder JavaScript; `destroy()`; 0 console-fouten en 0 externe verzoeken. Screenshots in `test/bewijs/`.

