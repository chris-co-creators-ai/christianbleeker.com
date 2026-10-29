# blokgrafiek

Staafgrafiek waarin elke staaf een stapel blokjes is, bijvoorbeeld één blok per app. Met legenda, waarde boven de staaf, label eronder, een gestippelde "spookstaaf" (zoals de prijs zonder korting), een gemarkeerde staaf voor de huidige keuze en een tooltip bij hover, focus of tik. De bron van waarheid is een gewone `<table>`.

## Wanneer wel
- Een staffel of pakketkorting uitleggen: "hoe meer, hoe goedkoper per stuk", met een zichtbaar aantal per staaf.
- Kleine reeksen (3 tot ±12 staven) met hele aantallen die je letterlijk wilt laten tellen: apps, plekken, licenties, kamers.
- Naast een rekenhulp die de gekozen staaf live verzet (`tools/besparingscalculator`).

## Wanneer niet
- Reeksen door de tijd of meer dan ±12 staven: een lijn- of gewone staafgrafiek leest beter.
- Waarden zonder natuurlijke eenheid om in blokken te hakken (omzet, procenten): gebruik `stats/vergelijkbalk`.
- Meer dan 24 blokken per staaf: de module kapt af op 24, daarboven worden de blokken te dun om te tellen.

## Installatie
```
stats/blokgrafiek/
├── blokgrafiek-kern.js     vanilla ES-module, 0 dependencies (alleen _kwaliteit/basis.js)
├── blokgrafiek.css    namespaced: .bgf, .bgf__*, data-bgf-*
├── Blokgrafiek.tsx    React/Next-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla**
```html
<link rel="stylesheet" href="./blokgrafiek.css" />
<script type="module">
  import { init } from './blokgrafiek-kern.js';
  const grafiek = init(document.querySelector('.bgf'), {
    legenda: { gekozen: 'Jouw pakket', overig: 'Andere pakketten', spook: 'Prijs zonder korting' },
  });
  grafiek.kies(4);   // markeer staaf 5 (en zijn tabelrij)
  // grafiek() ruimt alles op
</script>
```

**React / Next.js**
```tsx
import { Blokgrafiek } from '@/component-library/stats/blokgrafiek/Blokgrafiek';

<Blokgrafiek gekozen={aantalApps - 1} legenda={{ gekozen: 'Jouw pakket' }}>
  <div className="bgf__bron">
    <table className="bgf__tabel">…</table>
  </div>
</Blokgrafiek>

// Of met een zichtbare tabel elders op de pagina als bron:
<Blokgrafiek bron="#alle-pakketten" gekozen={2} />
```

**WordPress**: map in je thema, CSS via `wp_enqueue_style`, module via `wp_enqueue_script_module` (WP 6.5+, zonder versienummer; zie `scroll/reveal-on-scroll/README.md`). De tabel kan gewoon een Gutenberg-tabelblok zijn: zet `data-grafiek="waarde"` op de kopcel via de HTML-weergave, of geef de tabel mee als `bron`.

## Markup-contract
```html
<div class="bgf">
  <div class="bgf__bron">                         <!-- huls om visueel te verbergen (aanbevolen) -->
    <table class="bgf__tabel">
      <caption>Maandprijs per aantal apps</caption>   <!-- wordt de naam van de grafiek -->
      <thead><tr>
        <th scope="col">Apps</th>
        <th scope="col" data-grafiek="sub">Per app</th>          <!-- kleine regel onder het label -->
        <th scope="col" data-grafiek="waarde">Per maand</th>     <!-- hoogte van de staaf (verplicht) -->
        <th scope="col" data-grafiek="spook">Zonder korting</th> <!-- gestippelde staaf erachter -->
        <th scope="col">Korting</th>                             <!-- alleen in tooltip en aria-label -->
      </tr></thead>
      <tbody>
        <tr><th scope="row">1 app</th><td>€25</td><td>€25</td><td>€25</td><td>0%</td></tr>
        <tr data-huidig><th scope="row">3 apps</th>…</tr>          <!-- gemarkeerde staaf bij start -->
      </tbody>
    </table>
  </div>
</div>
```
- Getallen leest de module uit de celtekst in NL-notatie (`€1.006`, `€17,50`, `8%`, `−€84`). Voor- en achtervoegsel van de eerste waardecel (`€`) komen ook op de as.
- Aantal blokken: `data-blokken` op de `<tr>`, anders het eerste getal in de rijkop ("3 apps" → 3), anders de waarde als die een heel getal ≤ 24 is.
- Korte labels op smalle schermen: het eerste getal uit de rijkop ("3").

## Opties
| Optie | Standaard | Omschrijving |
|---|---|---|
| `bron` | eerste `<table>` in root | Element of selector. Een tabel buiten root wordt nooit verborgen of verplaatst. |
| `tabel` | `'verborgen'` | `'zichtbaar'` laat de tabel in root onder de grafiek staan. |
| `label` | de `<caption>` | Toegankelijke naam van de grafiek. |
| `legenda` | `{ gekozen: 'Huidige keuze', overig: 'Overige', spook: <kop van de spookkolom> }` | Teksten in de legenda; `gekozen` komt ook in het aria-label van de gemarkeerde staaf. |
| `teksten` | `{ grafiek: 'Staafgrafiek', beschrijving: '{naam}. Staafgrafiek met {n} staven; pijltjes lopen langs de staven.' }` | Vaste zinnen voor schermlezers: `grafiek` is de naam als er geen `label` of `<caption>` is, `beschrijving` het aria-label van de grafiek (`{naam}`, `{n}` = aantal staven). |
| `locale` | `'nl-NL'` | Notatie van de getallen in de tabel (lezen: `€1,006` bij `en-GB`) en op de as (schrijven), via `Intl.NumberFormat`. |
| `drempel` | `0.3` | Deel in beeld voordat de opbouw start. |

Terug krijg je `destroy()` met `destroy.kies(index | null)`. De module exporteert ook `leesGetal(tekst, locale = 'nl-NL')`.

CSS-variabelen op `.bgf`: `--bgf-hoogte` (260px, 220px smal), `--bgf-as` (breedte van de aslabels), `--bgf-inzet` (19 %, ruimte naast de staaf), `--bgf-gekozen`, `--bgf-overig`, `--bgf-tip-bg`, `--bgf-tip-tekst`, `--bgf-ease`.

## Toegankelijkheid
- De tabel blijft in de DOM en is de bron. Zonder JavaScript is hij gewoon zichtbaar.
- De grafiek is één tabstop (`role="group"` met een naam). Pijltjes, Home en End lopen langs de staven (roving tabindex); elke staaf is `role="img"` met een aria-label uit de tabelrij, plus "Jouw pakket." bij de gemarkeerde. Focus toont de tooltip, Escape sluit hem (WCAG 1.4.13).
- Een schermlezer vindt de gegevens dus twee keer (tabel en grafiek). Dat is bewust: de tabel voor wie wil vergelijken, de grafiek voor wie met het toetsenbord bladert. Zet nooit `aria-hidden` op de tabel: dan verdwijnt de bron.
- Tik op touch toont de tooltip, tweede tik sluit hem (R3).
- Minder beweging, `html[data-motion="paused"]` en `beweging:pauze`: geen opbouw en geen tooltip-animatie, de grafiek staat direct af.
- Contrast (gemeten): waarde 18,81:1, gekozen waarde 6,30:1, labels en as 7,59:1, tooltip 10,35–18,81:1; donker 7,36–17,17:1.

## Valkuilen
- **Een `<table>` krimpt niet onder zijn inhoud.** Visueel verbergen met `width: 1px` werkt op een tabel niet; hij duwt dan een smal scherm opzij. Zet hem in een `<div class="bgf__bron">`. Zonder huls valt de module terug op `position: fixed` (telt niet mee in de scrollbreedte).
- **Cijfers in de cellen moeten kloppen met wat je wilt tekenen**: de module rekent niets uit, ze leest. Rekenen gebeurt waar de tabel gemaakt wordt (één bron, R9).
- **Data die na `init()` verandert** pikt de module niet op; roep `destroy()` en opnieuw `init()` aan. Alleen de keuze is live (`kies`).
- **`overflow: hidden` op een voorouder** kan de tooltip of de focusring van de buitenste staaf afknippen.

## Herkomst
eu-hosted.com, pagina `/nl/prijzen`, blok "Zo werkt de pakketkorting" (gemeten 28-10-2026): SVG met per kolom gestapelde blokken, `blockIn` .5 s ease-out met `--delay` 0 · 45 · 67 · 90 ms, spookstaaf gestippeld in `line-strong`, tooltip `tipIn` .15 s vanaf 4 px lager. Eigen code (HTML en CSS in plaats van SVG); geen CSS of JS overgenomen.

Wat wij beter doen:
- **Tabel als bron.** Bij eu-hosted staan de cijfers in de SVG-code en los daarvan nog eens in de tabel eronder. Hier leest de grafiek de tabel, dus ze kunnen niet uiteenlopen.
- **Eén tabstop met pijltjes** in plaats van negen losse tabstops.
- **Contrast**: eu-hosted zet de prijs per stuk onder de staaf in `line-strong` (3,42:1, onder AA). Wij gebruiken `ink-muted` (7,59:1) en `indigo-strong` voor de gekozen waarde.
- **Tooltip op touch en met Escape**, en hij blijft binnen de grafiek.
- **Responsief zonder te krimpen**: op smal scherm korte labels en lagere staven in plaats van een geschaalde SVG met 9 px-tekst.
