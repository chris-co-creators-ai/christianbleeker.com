# stappen-mini-ui

Drie stapkaarten ("hoe het werkt") met elk een **levende mini-interface** die start zodra de kaart in beeld komt. Het product laat zien hoe het werkt in plaats van het te beschrijven:

1. **Kiezen**: vinkjes gaan één voor één aan, de prijs telt mee op en een regel met pakketkorting schuift in.
2. **Opzetten**: logregels komen binnen, een installatiebalk vult, de status gaat van "Wordt opgezet" naar "Actief" met een ping en een succesring.
3. **Koppelen**: een échte DNS-tabel; de SSL-kolom springt per regel op "Actief" en de knop kopieert de records naar het klembord.

Kaarten komen binnen van blur 8 px en 18 px omlaag. Optioneel een `backgrounds/mesh-wolk` als achtergrond per kaart.

## Wanneer wel
- Een SaaS- of dienstsite met een proces van drie stappen dat je kunt *laten zien*: bestellen → klaarzetten → koppelen.
- Als de stappen echte, herkenbare data hebben (prijzen, domeinen, tijden) die de bouwer invult.

## Wanneer niet
- Niet voor een proces van vijf of meer stappen (gebruik `process/how-it-works-3-step` of een tijdlijn).
- Niet als er geen echte data is: verzonnen prijzen of tijden ondermijnen het vertrouwen (R8).
- Niet in een smalle zijkolom: de mini-kaarten hebben ±300 px breedte nodig.

## Installatie
```
process/stappen-mini-ui/
├── stappen-mini-ui.js     ES-module
├── stappen-mini-ui.css
├── mesh-wolk-kopie.js     byte-gelijke kopie van backgrounds/mesh-wolk/mesh-wolk.js
├── mesh-wolk-kopie.css    byte-gelijke kopie van backgrounds/mesh-wolk/mesh-wolk.css
├── StappenMiniUi.tsx      React/Next-wrapper (laadt beide CSS-bestanden)
├── demo.html
└── test/meet.mjs
```
De map is zelfstandig: de wolk zit erin als `-kopie`-bestanden, zodat hij ook werkt als platte kopie in `src/features/stappen-mini-ui/`. Pas je `backgrounds/mesh-wolk` aan, kopieer dan opnieuw; `test/meet.mjs` faalt zolang de kopieën afwijken. Alleen `_kwaliteit/basis.js` komt van buiten de map.

**Vanilla**
```html
<link rel="stylesheet" href="./mesh-wolk-kopie.css">
<link rel="stylesheet" href="./stappen-mini-ui.css">
<div data-stappen-mini-ui id="stappen"> … markup hieronder … </div>
<script type="module">
  import { init } from './stappen-mini-ui.js';
  const destroy = init(document.getElementById('stappen'));
</script>
```

**React / Next.js**
```tsx
import { StappenMiniUi } from '@/component-library/process/stappen-mini-ui/StappenMiniUi';

<StappenMiniUi>
  <ol className="smu-rij">{/* drie <li data-smu-stap> volgens het contract */}</ol>
</StappenMiniUi>
```

**WordPress** (6.5+): enqueue beide CSS-bestanden en `stappen-mini-ui.js` als module (`wp_enqueue_script_module`, versie `null`), zet de markup in een Custom HTML-blok en roep `init()` aan in een `<script type="module">` in de footer. Sluit de module uit van JS-combineren in cache-plugins.

## Markup-contract
De markup is de **eindtoestand**: zonder JS, bij minder beweging en bij een gepauzeerde site staat die er direct. Kopieer `demo.html` als startpunt.

| Element | Wat |
|---|---|
| root `[data-stappen-mini-ui]` | Een wrapper (geen `<ol>`): de JS zet er een live-regio (`role="status"`) in. |
| `.smu-rij` | `<ol>` met de stappen. |
| `<li class="smu-stap" data-smu-stap>` | Eén stap: `.smu-beeld` (vlak) + `.smu-onderschrift` (label, h3, tekst). |
| `[data-mesh-wolk]` in `.smu-beeld` | Optionele wolk, met `data-mw-preset`. |
| `[data-smu-mini="kiezen"]` | `data-smu-basisprijs`, `data-smu-korting` (euro korting per app per extra app), optioneel `data-smu-leeg`. Daarin `[data-smu-teller]`, keuzes `.smu-keuze` (`data-smu-kies` = wordt aangevinkt, in volgorde), `[data-smu-korting-regel]` met `[data-smu-korting-tekst]` en `.smu-ring`, `[data-smu-bedrag]`. |
| `[data-smu-sr]` | Schermlezertekst bij de kiezen-kaart; de JS schrijft hem uit dezelfde data. |
| `[data-smu-mini="opzetten"]` | `[data-smu-server]` met `data-staat` en een `.smu-wissel` (labels `data-smu-als="bezig|klaar"`), regels `[data-smu-regel]` (één met `data-smu-installeer` + `.smu-balk`), `[data-smu-voet]`. |
| `[data-smu-mini="koppelen"]` | `<table>` met `<tr data-smu-record>` (naam, type, SSL), SSL-pillen `[data-smu-ssl]`, doel `[data-smu-doel]`, en `<button data-smu-kopieer hidden>` (de JS maakt hem zichtbaar). |

Prijs per aantal apps `n`: `n × (basisprijs − korting × (n − 1))`; korting % = `1 − prijs / (n × basisprijs)`. Met 20 en 1: 1 app €20, 2 apps €38 (5 %), 3 apps €54 (10 %).

## Opties
| Optie | Standaard | Wat |
|---|---|---|
| `wolk` | `true` | Start `mesh-wolk` op elk `[data-mesh-wolk]` binnen de root. |
| `meldingGekopieerd` | `DNS-records gekopieerd naar het klembord.` | Tekst in de live-regio na kopiëren. |
| `meldingMislukt` | `Kopiëren lukte niet. Selecteer de records en kopieer ze zelf.` | Tekst als kopiëren niet lukt. |
| `teksten` | `TEKSTEN` (Nederlands) | Zinnen die de JS zelf schrijft. `leeg` (`Nog niets gekozen`, alleen als `data-smu-leeg` ontbreekt), `gekozen` (`{n} gekozen`), `korting` (`{pct} % pakketkorting`), `voorbeeld` (de schermlezerzin van stap 1: `Voorbeeld: {n} apps gekozen ({namen}), samen {bedrag} per maand met {pct} % pakketkorting.`). Ontbrekende sleutels blijven Nederlands. Engels: `{ leeg: 'Nothing chosen yet', gekozen: '{n} selected', korting: '{pct}% bundle discount', voorbeeld: 'Example: {n} apps selected ({namen}), together {bedrag} per month with a {pct}% bundle discount.' }`. |

CSS-variabelen op de root: `--smu-ink`, `--smu-zacht`, `--smu-vlak`, `--smu-mist`, `--smu-lijn`, `--smu-accent(-sterk/-zacht)`, `--smu-goed(-zacht)`, `--smu-focus`, `--smu-ease`, `--smu-sans`, `--smu-mono` (terugval: de eu-hosted-tokens).

## Toegankelijkheid
- De mini-interfaces van stap 1 en 2 zijn decor (`aria-hidden`) met een sr-only zin ernaast. Stap 3 is echte inhoud: een `<table>` met `scope="col"` en een echte `<button>`.
- Kopieerknop: Tab, Enter en Spatie; dubbele focusring; het zichtbare label is de naam ("Kopieer" → "Gekopieerd"); de live-regio meldt het resultaat; raakvlak 44 px op touch.
- Labelwissels (knop, status, SSL): het nieuwe label is meteen zichtbaar en het oude krijgt meteen `aria-hidden`; alleen het oude vervaagt nog 240 ms. Zo heet de knop nooit even "Kopieer Gekopieerd" of leeg, ook niet als de pagina druk is (gemeten met drie WebGL-wolken en twee andere meetscripts tegelijk).
- Klembord: Clipboard API, terugval via een verborgen textarea + `execCommand('copy')` (focus gaat daarna terug naar de knop), en als ook dat niet lukt: "Lukt niet" plus uitleg.
- Minder beweging: direct de eindstand, geen lussen, geen succesring.
- Bewegingspauze (`html[data-motion=paused]` / `beweging:pauze`): een reeks die bezig is springt naar het eindbeeld, ping en ring staan stil. Buiten beeld en bij een verborgen tab staan de lussen ook stil.
- Contrast gemeten in licht en donker, ook in de mini-kaarten: tabelkop 7,27 / 8,30, SSL-label 4,75 / 6,50, kopieerknop 6,30 / 9,01.

## Valkuilen
- **Data klopt niet met de markup?** De JS rekent prijs, teller, korting en schermlezertekst uit de data-attributen en overschrijft de markup. Zet de markup wel goed: dat is wat bezoekers zonder JS zien.
- **React**: de JS past alleen attributen en bestaande tekstknopen aan en zet ze bij `destroy()` exact terug (gemeten: markup na destroy = bronmarkup, ook midden in de reeks). Laat React die waarden niet tegelijk wijzigen.
- **Kopieerknop zonder `hidden`** in je markup: dan zien bezoekers zonder JS een knop die niets doet.
- **Veel wolken**: elke kaart met `data-mesh-wolk` is een WebGL-context. Drie is prima; zet `wolk: false` als je ze elders al gebruikt.
- **Tekst in de mini-kaart is 12 px**: dat is decor op schaal. Zet echte, belangrijke inhoud in het onderschrift.

## Herkomst
eu-hosted.com/nl (28-10-2026), sectie "Hoe het werkt". Daar met Framer Motion voor de binnenkomst en CSS voor ping (`75 % → scale(2), opacity 0`, 1 s) en succesring (1 → 1,5 en .65 → 0, 3,2 s met .8 s vertraging); die getallen zijn overgenomen, net als de binnenkomst (blur 8 px, 18 px, .62 s, .08 s per kaart). Teksten, iconen en prijzen zijn van ons (Wolkhaven voor Studio Wester).

**Wat wij beter doen**
- De kopieerknop werkt echt (Clipboard API + terugval + meldingen); op eu-hosted is het een nagebootste knop in een `aria-hidden`-illustratie.
- De DNS-tabel is een echte tabel voor schermlezers; de tabelkop haalt 7,27:1 (eu-hosted gebruikt daar `line-strong`, 3,42:1).
- Prijs, korting en schermlezertekst komen uit één bron (data-attributen), en de prijs telt zichtbaar op.
- Statuspillen glijden mee naar de breedte van het nieuwe label in plaats van te springen.
- Geen `backdrop-filter` op de mini-kaart boven een bewegende WebGL-wolk (scheelt elke frame een blur-pass); de kaart is 94 % dekkend en ziet er hetzelfde uit.
- Zonder JS, bij minder beweging en bij pauze direct de eindstand; `destroy()` laat de markup achter zoals hij was.
