# impact-scan

Een korte scan (maximaal 12 vragen) in een dialoog, optioneel in een telefoonframe.
De bezoeker krijgt per stap de resterende tijd te zien ("Nog 3 vragen · ongeveer 60 seconden"),
beantwoordt keuzevragen en een getalvraag met rekenregel, ziet een kort laadmoment en krijgt een
**persoonlijke uitslag**: een kop en intro met zijn eigen doelen erin, een mogelijke richting,
ideeën als chips en een **passende case** met bewijsregel. Daarna één knop naar het
aanvraagformulier, dat al is ingevuld met een samenvatting van de antwoorden.

Alle teksten, vragen, cases en rekenzinnen staan in één config (JSON). In de JS staat geen zichtbare tekst.

Twee voorbeeldconfigs: `configs/tuinscan.json` (keuzes, doelen, case) en `configs/websitescan.json`
(**scoremodus**: stellingen met Ja/Nee, een score, een band en adviezen). Zie "Scoremodus" hieronder.

## Wanneer wel

- Dienstverleners waarbij een gesprek beter gaat als je weet wat de klant wil: hovenier (tuinscan),
  bureau (impactscan), bistro (feestscan), installateur (woningscan).
- Je wilt een **gekwalificeerde aanvraag** in plaats van "bel me maar": het formulier krijgt doel,
  budget en situatie mee, zonder dat de bezoeker iets overtypt.
- Je hebt echte cases of voorbeeldprojecten die je bij een doel kunt tonen.

## Wanneer niet

- Voor een prijs of advies dat je echt uitrekent: gebruik `tools/advies-funnel` (regels naar een pakket)
  of een calculator. Deze scan geeft richting, geen offerte.
- Voor een formulier met veel vrije velden of bijlagen: dat is een pagina, geen scan.
- Als je geen echte cases of ideeën hebt om te tonen: de uitslag wordt dan een herhaling van de antwoorden.
  Laat `case` en `ideeen` dan weg; de blokken verschijnen alleen als er inhoud is.
- Veel vragen: elke extra vraag kost bezoekers. De code accepteert maximaal 12 en weigert meer met een waarschuwing.

## Installatie

```
component-library/tools/impact-scan/
├── impact-scan.js            # vanilla ES-module, 0 dependencies
├── impact-scan.css           # namespaced op .isc
├── ImpactScan.tsx            # React/Next.js client-wrapper
├── configs/tuinscan.json     # voorbeeldconfig (Studio Wester) + configs/posters/
├── configs/websitescan.json  # voorbeeldconfig met scoremodus
├── demo.html
└── test/meet.mjs
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./impact-scan.css" />

<main id="scan-root">
  <!-- Zonder JavaScript is dit gewoon een link naar het formulier -->
  <a href="#aanvraag" data-impact-scan-open>Doe de tuinscan · 2 min</a>

  <form id="aanvraag-formulier">
    <textarea name="samenvatting" data-impact-scan-samenvatting></textarea>
    <input type="hidden" name="antwoorden" data-impact-scan-antwoorden />
  </form>
</main>

<script type="module">
  import { init } from './impact-scan.js';
  const config = await fetch('./configs/tuinscan.json').then((r) => r.json());
  const destroy = init(document.getElementById('scan-root'), config, {
    telefoon: true,
    formulier: '#aanvraag-formulier',
  });
  // destroy() bij opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { ImpactScan } from '@/component-library/tools/impact-scan/ImpactScan';
import tuinscan from './tuinscan.json';

<ImpactScan config={tuinscan} telefoon formulier="#aanvraag-formulier">
  <a href="/contact" data-impact-scan-open>Doe de tuinscan</a>
</ImpactScan>
```

De wrapper start de scan opnieuw als de inhoud van `config` verandert, niet bij een nieuw object met
dezelfde inhoud. Geef `onKlaar` mee of luister naar het event (zie hieronder).

**WordPress**

Zet de drie bestanden in het thema en laad `impact-scan.js` met `wp_enqueue_script_module()`. Zet de
config in een `<script type="application/json" id="scan-config">`-blok (of laad hem met `fetch()`) en
roep `init()` aan na `DOMContentLoaded`. Bij Contact Form 7 of Gravity Forms: geef `formulier` de selector
van het formulier en zet in het formulier een verborgen veld of textarea met `data-impact-scan-samenvatting`
(de meeste plugins laten je een eigen attribuut op een veld zetten). Anders koppel je via het event.

## Markup-contract

- **Root** (het element dat je aan `init` geeft): bevat de opener(s). De dialoog komt als laatste kind
  in de root. Krijgt `data-isc-init` zolang de scan draait. Een tweede `init` op dezelfde root doet niets.
- **Opener**: elk element met `data-impact-scan-open` binnen de root (standaard; instelbaar met `opener`).
  Gebruik een `<a href="…contactformulier">`, dan werkt het zonder JS ook. Een klik met Cmd, Ctrl of
  Shift laat de link zijn werk doen. `init` zet `aria-haspopup="dialog"` op de opener.
- **Formulier** (optie `formulier`): `[data-impact-scan-samenvatting]` krijgt de samenvatting als tekst
  (`textarea` of `input`), `[data-impact-scan-antwoorden]` krijgt de antwoorden als JSON. Na "Vraag een
  voorstel aan" sluit de dialoog, scrolt de pagina naar het formulier en staat de focus op het eerste veld.
- **Event** `impact-scan:klaar` (bubbelt vanaf de root, cancelable) met `detail`:
  `{ configId, antwoorden: [{ vraagId, vraag, antwoorden: [{ id, label }] }], samenvatting, uitslag: { kop, intro, richting, ideeen, noten, case } }`.
  Koppel zo aan `link-dialog-funnel` of een eigen formulier. Zonder `formulier` en zonder `preventDefault()`
  gaat de bezoeker naar `cta.href` (of de href van de opener) met `?scan=<samenvatting>`.

## Config

```jsonc
{
  "id": "studio-wester-tuinscan",       // uniek per scan
  "titel": "Tuinscan van Studio Wester", // naam van de dialoog voor schermlezers
  "secPerVraag": 20,                     // voor "ongeveer X seconden"
  "teksten": { "volgende": "Volgende", "laden": ["Regel 1…", "Regel 2…", "Regel 3…"], "…": "…" },
  "vragen": [ /* 1 tot 12 vragen, zie hieronder */ ],
  "uitslag": { "bronVraag": "doel", "kop": "Een tuin voor {doelen}.", "intro": "…{doelen}…", "…": "…" },
  "cta": { "href": "#aanvraag" },
  "pagina": { /* optioneel, alleen voor de host-pagina (zie hieronder) */ }
}
```

`teksten.opener` (bv. `"Doe de tuinscan · {seconden} sec"`) en `pagina` (`titel`, `lead`, `hint`, `stappen`, `veldLabel`, …) zijn geen onderdeel van de dialoog: de motor leest ze niet.
Ze horen bij de config zodat een host-pagina (de demo doet dit) alle scan-teksten uit één bestand haalt en de knoptijd klopt:
`seconden = aantal vragen × secPerVraag`, dezelfde som als "ongeveer X seconden" bij de eerste vraag.

**Vraag**

| Veld | Betekenis |
|---|---|
| `type` | `enkel` (radio), `meer` (checkbox, met `max` en `min`), `getal` (radio als pillen, met rekenregel) of `stelling` (Ja/Nee of een schaal; zie Scoremodus) |
| `vraag`, `hint` | Tekst boven de opties; `hint` mag "Kies er maximaal twee." zijn |
| `samenvattingLabel` | Naam in de samenvatting ("Doel van de tuin: …") |
| `gewicht`, `advies` | Scoremodus: weging van de vraag (standaard 1) en het advies dat bij een niet-volle score hoort |
| `rekenregel`, `factor` | Alleen `getal`: `"Dat is ongeveer {totaal} uur per jaar."`; `totaal = waarde × factor` |
| `richting`, `richtingOnbekend` | Alleen `getal`: regel in de richtinglijst (`{waarde}`, `{totaal}`) en de regel bij waarde 0 |
| `opties` | Lijst van optie-objecten |

**Optie**

| Veld | Betekenis |
|---|---|
| `id`, `label` | Verplicht |
| `richting` | Regel in "een mogelijke richting" als dit gekozen is |
| `ideeen` | Lijst chips voor de uitslag |
| `kop`, `kort` | Alleen op de bronvraag: woord voor `{doelen}`/`{doel}` en `{focus}`. Ontbreken ze terwijl het sjabloon ze gebruikt, dan gebruikt de motor **niet** het label ("Iets anders" midden in een zin), maar laat hij de zin weg en waarschuwt in de console. Bij een `vrij`-optie geldt de ingevulde tekst |
| `case` | `{ merk, bewijs, regel, poster, kleur }`: de case bij dit doel. Zonder `poster` komt een gekleurd vlak met de merknaam (`kleur`) |
| `vrij` | Placeholder van een invulveld: maakt dit een "Anders, namelijk…"-optie. Leeg = "Volgende" blijft uit |
| `uitslagRegel` | Extra notitie in de uitslag. Zo geef je bij "Minder dan € 5.000" een eerlijke doorverwijzing |
| `waarde` | Alleen `getal`: het getal voor de rekenregel (0 = onbekend, geen rekenregel) |
| `punten` | Scoremodus: punten die dit antwoord oplevert |

**Uitslag**

| Veld | Betekenis |
|---|---|
| `bronVraag` | Id van de vraag die `{doelen}`, `{focus}`, de case en de eerste ideeën bepaalt |
| `kop`, `intro` | Sjablonen. Beschikbaar: `{doelen}`, `{doel}` (het eerste), `{focus}`, `{n}` en `{<vraag-id>}` (het gekozen label) |
| `verbinder` | Tussen meerdere doelen (`" én "`) |
| `richtingFocus` | Sjabloon voor de focusregel, bv. `"Focus op {focus}"` |
| `maxIdeeen` | Maximum aantal chips (standaard 4) |
| `kopZonder`, `introZonder` | Terugval als een gekozen antwoord geen `kop`/`kort` heeft: dan vervalt de zin met `{doelen}` en komt deze tekst (bij `introZonder` leeg = geen intro) |
| `extra` | `[{ als: { vraagId: id | [id, …] }, tekst }]`: notitie die alleen verschijnt bij die combinatie van antwoorden |

**Hoe de uitslag ontstaat**

- **Case**: het eerste gekozen antwoord op de bronvraag (in aanklikvolgorde) dat een `case` heeft. Heeft
  geen enkel gekozen antwoord een case, dan is er geen case-blok. Er wordt niets bijverzonnen.
- **Chips**: de `ideeen` van alle gekozen antwoorden, per vraag in volgorde, in aanklikvolgorde, zonder
  dubbelen, gekapt op `maxIdeeen`.
- **Richting**: per vraag de `richting` van het gekozen antwoord, plus de focusregel voor de bronvraag.
- **Onder het minimum**: een optie met `uitslagRegel` toont die regel als notitie. Zo kan een klant met
  een klein budget eerlijk worden geholpen in plaats van afhaken.

## Scoremodus

Voeg `score` aan de config toe en geef antwoorden `punten`: de scan wordt een zelftest ("7 van 11").
Elke vraag met `punten` telt mee, ook `enkel`; alleen vragen zonder `punten` (zoals een doelvraag) doen niet mee.

```jsonc
{
  "vragen": [
    { "id": "s1", "type": "stelling", "gewicht": 2,
      "vraag": "Op de homepage staat in één zin wat je doet en voor wie.",
      "samenvattingLabel": "Duidelijke belofte",
      "advies": "Zet bovenaan één zin: wat je doet, voor wie, en wat de bezoeker nu kan doen.",
      "opties": [ { "id": "ja", "label": "Ja", "punten": 1 }, { "id": "nee", "label": "Nee", "punten": 0 } ] }
    // een schaal van 1-5 is hetzelfde type met vijf opties en punten 1 t/m 5
  ],
  "score": {
    "weergave": "punten",              // of "percentage"
    "totaal": "{score} van {max}", "percentage": "{percentage}%",
    "maxAdviezen": 3, "meter": true,
    "metUitslag": true,                // ook case, ideeën en richting uit de gewone uitslag tonen
    "banden": [
      { "id": "laag", "van": 0, "kop": "Je website verkoopt nog niet voor je", "tekst": "…" },
      { "id": "midden", "van": 5, "kop": "…", "tekst": "…" },
      { "id": "hoog", "van": 9, "kop": "…", "tekst": "…" }
    ]
  },
  "uitslag": { /* alleen nodig met metUitslag */ }
}
```

- **Score** = som van `punten × gewicht` van de gekozen antwoorden; **max** = de beste mogelijke uitkomst. Tekst in
  `teksten`: `scoreKop`, `meterLabel`, `adviesKop`, `samenvattingScore`, `samenvattingBand`, `samenvattingAdvies`.
- **Band**: de band met de hoogste `van` die kleiner dan of gelijk aan de score is. Precies op de drempel hoort dus bij de
  hogere band (5 is band 2, 4 band 1). `van` telt in gewogen punten, niet in aantal vragen. Gaten en overlap kunnen niet fout gaan.
- **Adviezen**: per vraag met `advies` waar de score onder het maximum bleef (dus "Nee", maar ook een 4 op een schaal van 5).
  Gesorteerd op verloren punten × gewicht, zwaarste eerst, bij gelijk verlies de volgorde van de config; hooguit `maxAdviezen`.
  Alle antwoorden goed: geen adviesblok.
- **Meter**: `role="meter"` met `aria-valuemin`, `aria-valuemax`, `aria-valuenow` en een `aria-valuetext` ("8 van 11: band-kop").
  De score staat ook als grote tekst, de drempelstreepjes zijn `aria-hidden`: niets hangt aan kleur alleen. `"meter": false` laat hem weg.
  De vulling animeert met `transform`, en staat bij minder beweging direct.
- **Los gebruiken**: `metUitslag: false` (en `uitslag` weglaten): kop = bandkop, intro = bandtekst, geen case/ideeën/richting.
  **Gecombineerd**: `metUitslag: true`: de gewone kop en intro, dan de score met bandkop en de adviezen, dan case en ideeën.
- **Event en formulier**: `detail.score = { score, max, percentage, totaal, band: { kop, tekst, van }, adviezen: [{ vraagId, tekst }] }`.
  De samenvatting krijgt regels "Score: 8 van 11", "Uitslag: …" en "Aandachtspunten:" met de adviezen.
- Optioneel: `teksten.opener` is de knoptekst voor de host-pagina (de demo zet hem op de opener bij het kiezen van een config).

## Opties (`init(root, config, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `telefoon` | `false` | Dialoog in een telefoonframe. Onder 520 px breed valt het frame weg: dan is het een vol scherm |
| `formulier` | | Element of selector van het formulier dat wordt ingevuld |
| `opener` | `[data-impact-scan-open]` | Selector voor de openers binnen de root |
| `laadMs` | `600` | Duur per laadregel in milliseconden (3 regels = 1,8 s) |
| `onKlaar` | | `(detail) => void`, naast het event |

`init` geeft `destroy()` terug: sluit de dialoog, haalt hem uit de DOM, ruimt timers, listeners en
attributen op. Twee keer aanroepen is veilig.

## Toegankelijkheid

- Native `<dialog>` met `showModal()`: achtergrond is inert; er is een eigen focus-trap voor Tab en
  Shift+Tab, Escape sluit, en de focus komt terug op de opener.
- Bij elke stap gaat de focus naar de vraagkop. Een verborgen `aria-live`-regel meldt "Vraag 2 van 5.
  Nog 4 vragen · ongeveer 80 seconden" en bij de uitslag "Je uitslag is klaar."
- Opties zijn echte `radio`- en `checkbox`-inputs in een `fieldset` met `aria-labelledby` op de vraag.
  Pijltjestoetsen en Spatie werken native. Bij het maximum worden de overige checkboxen `disabled`
  en meldt een live-teller "2 van 2 gekozen: dat is het maximum".
- "Volgende" is echt `disabled` tot het antwoord geldig is; bij "Anders" ook tot er tekst staat.
- Elk tikdoel is minimaal 44 px hoog, het invulveld heeft 16 px tekst (geen inzoomen op iOS), focus is
  een outline van 2 px. Decoratie (voortgangsstreepjes, notch, vinkjes) is `aria-hidden`.
- **Minder beweging**: geen overgangen, geen animaties, en het laadmoment wordt overgeslagen: de uitslag
  staat er direct. Zet de bezoeker het halverwege aan tijdens het laden, dan springt de scan meteen door.
- Tekst uit de config gaat altijd via `textContent`; er is geen `innerHTML`.

## Valkuilen

- **Cases zijn van jou.** De demo-cases (Rijnkade Stadstuin e.d.) en de illustraties zijn verzonnen
  voor Studio Wester. Zet er in productie alleen echte projecten in, met echte bewijsregels (R8).
- **Punten en drempels zijn een keuze, geen meting.** De scoremodus telt wat de bezoeker zelf aankruist; zeg in de band-tekst dat het een zelftest is en baseer de drempels op wat jij echt ziet bij klanten.
- **Een scan zonder bron verzint niets**: staat er bij een doel geen `case`, dan komt er geen case-blok.
- **Antwoorden blijven in het geheugen** zolang de scan draait (sluiten en heropenen gaat verder;
  "Opnieuw beginnen" wist). Er wordt niets opgeslagen in de browser of verstuurd.
- **Bereken geen prijs.** De uitslag is een richting. Zet "geen offerte" in de intro als er een bedrag
  in de buurt komt.
- **Kies één bronvraag.** Meerdere vragen met `kop`/`kort`/`case` worden genegeerd: alleen de vraag
  in `uitslag.bronVraag` bepaalt de case.
- **Laad-regels** zijn maximaal 2 tot 3 en samen onder 2 s (R12). Geef `"laden": []` om het moment
  weg te laten.
- **Formulier op een andere pagina**: gebruik dan geen `formulier` maar het event, en stuur de
  samenvatting mee (`?scan=` gebeurt automatisch als je het event niet cancelt).

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.
