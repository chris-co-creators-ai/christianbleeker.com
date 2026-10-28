# kennisbank-filter

Een kenniscentrum met artikelen, podcasts en video's zonder CMS: filteren op
categorie en soort, zoeken (zonder accenten of hoofdletters), sorteren,
"Toon meer", een telling met aria-live en een lege staat. De stand staat in de
URL, dus je kunt hem delen, bookmarken en er met terug/vooruit doorheen lopen.
De kaarten staan als gewone markup in de pagina: zonder JavaScript zie je ze
allemaal.

## Wanneer wel

- Een kennisbank, blog of mediatheek van tientallen tot enkele honderden items.
- Statische sites (Next, Astro, WordPress-template) waar de kaarten al bij het
  bouwen gerenderd worden en zoekmachines ze moeten kunnen lezen.

## Wanneer niet

- Duizenden items of inhoud die uit een database komt: filter dan op de server.
- Zoeken in de volledige tekst van artikelen. Dit doorzoekt alleen titel en
  samenvatting.
- Een webshop met prijs-sliders en varianten; daar zijn andere patronen voor.

## Installatie

```
component-library/layouts/kennisbank-filter/
├── kennisbank-filter.js     # vanilla ES-module, 0 dependencies
├── kennisbank-filter.css    # namespaced op data-kb / kb-*
├── vacature-jsonld.mjs      # JobPosting-JSON-LD-helper (server/build, geen DOM)
├── KennisbankFilter.tsx     # React/Next client-wrapper
├── demo.html                # kenniscentrum
├── demo-vacatures.html      # vacaturemodus met salarisbereik (verzonnen vacatures)
├── demo-masonry.html        # masonry-portfolio (verzonnen cases)
└── test/meet.mjs
```

**Vanilla**

```html
<link rel="stylesheet" href="./kennisbank-filter.css" />
<script type="module">
  import { init } from './kennisbank-filter.js';
  const destroy = init(document.getElementById('kb'), { perPagina: 9 });
</script>
```

**React / Next.js**

```tsx
import { KennisbankFilter } from '@/component-library/layouts/kennisbank-filter/KennisbankFilter';

<KennisbankFilter perPagina={9}>
  {artikelen.map((a) => (
    <li key={a.slug} className="kb-kaart" data-kb-kaart
        data-kb-categorie={a.categorieen.join('|')} data-kb-soort={a.soort} data-kb-datum={a.datum}>
      <a className="kb-link" href={`/kennis/${a.slug}`}>…</a>
    </li>
  ))}
</KennisbankFilter>
```

Render de kaarten op de server (server component) zodat ze in de HTML staan.
Geef je `bron` mee, dan rendert de wrapper de kaarten pas na hydratie.

**WordPress**

1. Zet de map in je thema en laad de CSS met `wp_enqueue_style`.
2. Laad de JS als module met `wp_enqueue_script_module()` (WP 6.5+), zonder
   versienummer (`null`), zodat de `import` dezelfde URL gebruikt.
3. Laat het archief-template de kaarten uitprinten met de `data-kb-*`
   attributen (categorie-namen uit `get_the_category()`, soort uit een
   taxonomie of veld, datum uit `get_the_date('Y-m-d')`).
4. Roep `init(document.getElementById('kb'))` aan na `DOMContentLoaded`.

Valkuil: caching- en minify-plugins strippen `type="module"`. Sluit het
script uit van JS-combinatie.

## Markup-contract

```html
<div id="kb" data-kb>
  <div class="kb-layout">
    <aside data-kb-controls hidden aria-label="Filters"></aside>
    <div class="kb-hoofd">
      <ul class="kb-lijst" data-kb-lijst>
        <li class="kb-kaart" data-kb-kaart
            data-kb-categorie="SEO|Content"  data-kb-soort="artikel"  data-kb-datum="2026-09-03">
          <a class="kb-link" href="/kennis/zoekintentie">
            <div class="kb-body">
              <h3 class="kb-titel" data-kb-titel>Zoekintentie: schrijf voor de vraag</h3>
              <p class="kb-samenvatting" data-kb-samenvatting>Waarom één zoekwoord …</p>
            </div>
          </a>
        </li>
      </ul>
    </div>
  </div>
</div>
```

- `data-kb-categorie`: één of meer namen, gescheiden door `|`. De filters,
  labels en URL-waarden worden hieruit afgeleid, dus er is geen aparte lijst.
- `data-kb-soort`: één soort (artikel, podcast, video of eigen keuze).
- `data-kb-datum`: `JJJJ-MM-DD`, voor het sorteren.
- `[data-kb-titel]` en `[data-kb-samenvatting]`: de doorzoekbare tekst. Zonder
  die attributen wordt de hele kaarttekst doorzocht.
- `[data-kb-controls hidden]`: de plek voor de bediening. Het `hidden`-attribuut
  is de no-JS-fallback: JS haalt het weg. Ontbreekt de plek, dan wordt hij
  boven de root gemaakt.
- Optioneel: `style="--kb-c:#2f5bd1"` per kaart voor de accentkleur van het
  beeld, en `.kb-beeld` / `.kb-soort` voor het kaartbeeld (zie demo).

## Opties

| Optie | Standaard | Wat |
|---|---|---|
| `perPagina` | `9` | Kaarten per stap; "Toon meer" voegt er zoveel toe |
| `debounce` | `200` | Milliseconden wachten na typen in het zoekveld |
| `url` | `true` | Stand in de querystring (`q`, `cat`, `soort`, `sort`, `p`) |
| `bron` | geen | Lijst objecten `{titel, samenvatting, categorieen[], soort, datum, href, meta}` in plaats van markup |
| `eenheid` | `['item','items']` | Woord in de telling ("12 van 84 items"); neutraal omdat soorten gemengd zijn |
| `facetten` | geen | Extra checkbox-filters: `[{ sleutel: 'locatie', label: 'Locatie' }]` op `data-kb-locatie` (waarden gescheiden door `\|`), URL `?locatie=utrecht` |
| `bereiken` | geen | Numerieke bereikfilters, zie "Bereikfilter" |
| `modus` | geen | `'vacatures'`: voorinstelling, zie "Vacaturemodus" |
| `weergave` | `'raster'` | `'masonry'`: kolommen van ongelijke hoogte, zie "Masonry" |
| `tekst` | Nederlands | Overschrijf labels: `zoeken`, `sorteren`, `nieuwste`, `oudste`, `soort`, `categorie`, `filters`, `wis`, `meer`, `leegTitel`, `leegTekst` |

## Bereikfilter (salaris, prijs, oppervlak)

```js
init(root, { bereiken: [{ sleutel: 'salaris', label: 'Salaris per maand', stap: 100, formaat: formatEuro }] });
```

- Kaart: `data-kb-salaris="3400"` of `data-kb-salaris="3400-4600"`. Een kaart telt mee
  als zijn waarde of bereik het gekozen bereik **overlapt**. Kaarten zonder waarde vallen af zodra het
  bereik smaller is dan het geheel.
- Bediening: twee native `<input type="range">` ("Van" en "Tot") in een `fieldset` met `legend`, plus een
  live label ("€ 3.000 – € 4.500"). Elke schuif heeft een `label` en een `aria-valuetext` in dezelfde
  weergave. "Van" kan niet boven "Tot".
- `min`/`max` komen standaard uit de kaarten (afgerond op `stap`), zodat de schaal nooit nep is.
- URL: `?salaris=3000-4500`. Het volle bereik staat niet in de URL; een ongeldige waarde (`abc`),
  een omgekeerd bereik (wordt gewisseld) of een bereik buiten de schaal wordt bij het laden opgeruimd.
- Slepen is **één** stap in de geschiedenis (eerste `input` = nieuwe stap, rest vervangt, `change` sluit af).
- Het bereik telt mee in de tellers van de andere filters, in de telling ("5 van 12 vacatures"),
  in de lege staat, in de aanduiding op de "Filters"-knop en bij "Wis filters".
- `formatEuro` (export) geeft "€ 3.400" in nl-NL; eigen `formaat: (n) => string` mag ook.

## Vacaturemodus

`init(root, { modus: 'vacatures' })` zet de voorinstelling: facetten Locatie, Uren per week en Contracttype
(`data-kb-locatie`, `data-kb-uren`, `data-kb-contract`), bereik Salaris per maand, de telling "12 van 12
vacatures", en Nederlandse labels (Vakgebied voor `data-kb-categorie`). Alles is te overschrijven met
`facetten`, `bereiken`, `eenheid` en `tekst`.

**JobPosting-JSON-LD** maak je op de server of tijdens de build met `vacature-jsonld.mjs`. Het onderdeel zelf
zet nooit JSON-LD in de pagina (zoekmachines lezen het uit de server-HTML).

```js
import { jobPostingJsonLd, jobPostingScript, controleerJobPosting } from './vacature-jsonld.mjs';

const ld = jobPostingJsonLd({
  titel: 'UX-/UI-ontwerper', omschrijving: '…', datum: '2026-09-19', geldigTot: '2026-11-15',
  contract: 'vast', uren: 36, salarisMin: 3400, salarisMax: 4600,            // salarisPer: 'MONTH'
  locatie: { plaats: 'Utrecht', regio: 'Utrecht' }, id: 'v02', url: 'https://…/vacatures/v02',
}, { naam: 'Studio Wester', url: 'https://…' });
html += jobPostingScript(ld);            // <script type="application/ld+json">…</script>, veilig geëscaped
```

- Uitvoer: `title`, `description`, `datePosted`, `validThrough`, `employmentType` (afgeleid van `contract`
  en `uren`, of zelf meegeven), `baseSalary` (MonetaryAmount met `unitText`), `jobLocation` (PostalAddress,
  land standaard NL), `hiringOrganization`, `identifier`. Thuiswerk: `remote: true` geeft
  `jobLocationType: TELECOMMUTE` + `applicantLocationRequirements`.
- `jobPostingJsonLd` **gooit** bij een ontbrekend verplicht veld (titel, omschrijving, datePosted,
  organisatienaam, plaats van werk met land), zodat een build faalt in plaats van ongeldige data te leveren.
  `controleerJobPosting(obj)` geeft de problemen als lijst. Gecontroleerd worden de verplichte velden van
  Google plus foutgevoelige waarden (ISO-datum, `validThrough` na `datePosted`, `employmentType`-waarden,
  `unitText`, min ≤ max). Dit is een controle op de bekende regels, geen vervanging van Google's Rich
  Results Test: doe die voor livegang één keer.
- Houd de kaart en de JSON-LD uit dezelfde bron (één vacatureobject → kaartmarkup én JSON-LD),
  zodat salaris, plaats en datum niet uiteen kunnen lopen. De meting toetst dat op de demo.
- Verlopen vacatures: haal ze na `validThrough` uit de lijst én uit de JSON-LD.

## Masonry

`init(root, { weergave: 'masonry' })` zet `data-kb-weergave="masonry"`; de lijst wordt CSS-`columns`
(kolombreedte `--kb-kolom`), zonder library. Geef beelden een eigen `aspect-ratio` voor ongelijke hoogtes.

- **Leesvolgorde = kolom voor kolom** (boven naar onder in kolom 1, dan kolom 2). DOM-volgorde,
  tabvolgorde en visuele volgorde zijn daardoor gelijk; de meting toetst dat met echte Tab-drukken,
  ook na filteren. Wie liever links-naar-rechts leest, krijgt met CSS-`columns` geen rij-volgorde: kies
  dan `raster`.
- Nieuwe kaarten faden alleen in (opacity, geen transform), zodat er niets verspringt; bij minder beweging
  geen animatie.
- CSS-kolommen balanceren opnieuw als het aantal kaarten wijzigt: bij "Toon meer" kunnen kaarten van kolom
  wisselen. Zet `perPagina` daarom hoog (de demo toont alles) of kies `raster`.

CSS-variabelen op `[data-kb]`: `--kb-paper`, `--kb-surface`, `--kb-ink`,
`--kb-soft`, `--kb-line`, `--kb-accent`, `--kb-radius`, `--kb-gap`,
`--kb-kolom` (minimale kaartbreedte), `--kb-zijkant`.

Gedrag: categorieën onderling = OF, soort en categorie samen = EN, elk woord
in de zoekterm moet voorkomen. De tellers ("Sales (14)") tellen mee met de
andere actieve filters en zoekterm. Ze laten dus zien wat je krijgt als je dat
filter aanzet.

Geschiedenis: een reeks toetsaanslagen in het zoekveld is één stap in terug/vooruit
(eerste aanslag = nieuwe stap, daarna vervangen). Ongeldige waarden in de URL
(onbekende categorie, soort of pagina) worden bij het laden opgeruimd.

## Toegankelijkheid

- Filters staan in `fieldset` met `legend`; elk veld heeft een gekoppeld
  `label`. Het zoekveld heet "Zoeken".
- De telling is een `role="status"` met `aria-live="polite"`: bij elke wijziging
  hoort de schermlezer "10 van 31 items".
- Focus blijft op het bedieningselement dat je gebruikte. Na "Toon meer" gaat
  hij naar de eerste nieuwe kaart; na "Wis filters" naar het zoekveld.
- Op smalle schermen zit onderin het paneel een vaste knop "Toon N resultaten": die sluit het paneel en scrolt naar de telling.
- Op smalle schermen zit de bediening achter een knop met `aria-expanded` en
  `aria-controls`. Escape sluit hem en zet de focus terug.
- Focus is overal ≥ 2 px zichtbaar. Onder `prefers-reduced-motion` staan
  animaties en transities uit.
- Enter in het zoekveld past direct toe, zonder wachttijd.

## Valkuilen

- Een **lijst met honderden kaarten** is prima (300 kaarten: filteren ± 4 ms
  in de meting), maar 300 afbeeldingen niet. Gebruik `loading="lazy"` en geef
  beelden vaste afmetingen (`aspect-ratio`), anders verschuift de layout.
- **Zoeken is titel + samenvatting.** Wil je meer vindbaarheid, zet
  zoekwoorden in de samenvatting.
- **Nieuwe kaarten via JS na `init()`** worden niet opgepakt; roep `destroy()`
  en dan opnieuw `init()` aan.
- **React-hydratie:** het onderdeel zet `hidden` op kaarten die React
  gerenderd heeft. Dat geeft geen fout zolang React ze niet zelf herrendert;
  wissel de `children` niet zonder de key van de wrapper te wisselen.
- **Meerdere kennisbanken op één pagina** delen de querystring: gebruik `url: false`
  op alle behalve één.
- De categorienaam is de sleutel: "SEO" en "seo" zijn dezelfde categorie
  (URL-slug), "Copy & content" wordt `copy-content`.
- **Paginering:** dit onderdeel gebruikt "Toon meer" (alle kaarten blijven in
  de HTML voor zoekmachines). Genummerde pagina's zitten er niet in.

