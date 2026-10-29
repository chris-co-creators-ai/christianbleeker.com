# besparingscalculator

Rekenhulp "Wat bespaar jij?": een schuif voor de teamgrootte (1–10), vinkkaarten voor de tools die de bezoeker nu gebruikt ("In plaats van Notitio · €70 /mnd"), en een donkere uitkomstkaart met de besparing per jaar (het getal telt mee), de opbouw per maand, het aantal apps, de prijs per app, een pakketkortingbadge en een CTA naar contact met de keuze in de URL (`?team=8&apps=docs,projecten`). Daaronder een vergelijkbalk, een blokgrafiek van de pakketkorting en de tabel "Alle pakketten op een rij" met een gemarkeerde rij. De toestand staat in de adresbalk en wordt bij laden teruggelezen.

## Wanneer wel
- Een aanbod met een open, rekenbare prijs (per app, per plek, per pakket) dat je wilt afzetten tegen wat de bezoeker nu kwijt is.
- Als opstap naar een gesprek: de CTA neemt de keuze mee naar `forms/aanvraag-voorgevuld`, dat de velden voorinvult.

## Wanneer niet
- Prijzen op aanvraag of met veel uitzonderingen: een rekenhulp die "ongeveer" zegt, kost vertrouwen. Gebruik dan een prijsindicatie in tekst.
- Als je geen echte, controleerbare vergelijkingsprijzen hebt. Zet geen bedragen van andere bedrijven op je site zonder bron en datum (zie Valkuilen).

## Installatie
```
tools/besparingscalculator/
├── besparingscalculator-kern.js      ES-module; gebruikt stats/vergelijkbalk en stats/blokgrafiek (relatief geïmporteerd)
├── besparingscalculator.css     namespaced: .bc, .bc__*, data-bc-*
├── Besparingscalculator.tsx     React/Next-wrapper
├── wolkhaven.json               voorbeeldconfiguratie (verzonnen demowaarden)
├── teksten-en.json              alle teksten in het Engels, voor `config.teksten`
├── demo.html
└── test/meet.mjs                rekentoets in Node + browsermeting
```
De map is zelfstandig: vergelijkbalk en blokgrafiek zitten erin als `-kopie`-bestanden, zodat hij ook werkt als platte kopie in `src/features/besparingscalculator/`. Pas je `stats/vergelijkbalk` of `stats/blokgrafiek` aan, kopieer dan opnieuw; `test/meet.mjs` faalt zolang de kopieën afwijken.

**Vanilla**
```html
<link rel="stylesheet" href="./vergelijkbalk-kopie.css" />
<link rel="stylesheet" href="./blokgrafiek-kopie.css" />
<link rel="stylesheet" href="./besparingscalculator.css" />
<div class="bc" id="rekenhulp">
  <div data-bc-terugval>Eén app kost €25 per maand … <a href="/contact">Plan een gesprek</a></div>
</div>
<script type="module">
  import { init } from './besparingscalculator-kern.js';
  const config = await fetch('./wolkhaven.json').then((r) => r.json());
  const stop = init(document.getElementById('rekenhulp'), { config });
</script>
```
Zonder `config`-optie leest de module een `<script type="application/json">` in de root.

**React / Next.js**
```tsx
import config from './wolkhaven.json';
import { Besparingscalculator } from '@/component-library/tools/besparingscalculator/Besparingscalculator';

<Besparingscalculator config={config}>
  <p>Eén app kost €25 per maand. <a href="/contact">Plan een gesprek</a></p>
</Besparingscalculator>
```
Geef `config` als stabiel object (JSON-import of `useMemo`); een nieuw object per render bouwt de calculator opnieuw op.

**WordPress**: zet de map in je thema, laad de drie CSS-bestanden (`vergelijkbalk-kopie.css`, `blokgrafiek-kopie.css`, `besparingscalculator.css`) met `wp_enqueue_style` en de module met `wp_enqueue_script_module` (WP 6.5+, zonder versienummer). De configuratie kan als `<script type="application/json">` in een Custom HTML-blok binnen de root staan. Sluit de modules uit van JS-combinatie in cache-plugins.

## Configuratie (de enige bron van prijzen en regels)
```json
{
  "product": "Wolkhaven",
  "team": { "min": 1, "max": 10, "standaard": 8 },
  "staffel": { "perApp": 25, "kortingPerExtraApp": 1, "minimumPerApp": 10 },
  "standaardApps": ["docs", "projecten", "kluis"],
  "contactUrl": "/contact",
  "locale": "nl-NL",
  "btwRegel": "Alle bedragen per maand en exclusief btw.",
  "teksten": { "cta": "Plan een gesprek" },
  "apps": [
    { "id": "docs", "naam": "Kennisbank & documenten", "inPlaatsVan": "Notitio", "perGebruikerCent": 875 },
    { "id": "automatisering", "naam": "Automatiseringen", "inPlaatsVan": "Koppelaar", "vastCent": 1900 },
    { "id": "ondertekenen", "naam": "Digitaal ondertekenen", "inPlaatsVan": "Tekenklaar", "perGebruikerCent": 2500, "maxGebruikers": 3 }
  ]
}
```
Rekenregels:
1. Toolprijs per maand = `vastCent`, of `perGebruikerCent × min(team, maxGebruikers)`; één keer afgerond naar hele euro's (halve euro naar boven).
2. Prijs per app bij n apps = `max(minimumPerApp, perApp − (n − 1) × kortingPerExtraApp)`; per maand = n × prijs per app.
3. Nu = som van de getoonde toolprijzen. Verschil = nu − ons. Per jaar = verschil × 12. Pakketkorting = (n × perApp − ons) / (n × perApp).
Elk getoond bedrag is zo de som van andere getoonde bedragen: wie narekent, komt op hetzelfde uit (R9).

Id's mogen alleen `a-z`, `0-9` en `-` bevatten (ze gaan in de URL). Ongeldige apps worden met een waarschuwing overgeslagen; een ongeldige configuratie bouwt niets.

## Taal
Alle zinnen, ook die met een getal erin, staan in `TEKST` bovenin de JS (ook geëxporteerd) en zijn per sleutel te overschrijven met `config.teksten`. Een Engelse set staat in `teksten-en.json`. `config.btwRegel`, `product` en de app-namen geef je zelf in de goede taal.

| Configuratie | Standaard | Omschrijving |
|---|---|---|
| `locale` | `'nl-NL'` | Notatie van alle bedragen via `Intl.NumberFormat` (`en-GB`/`en-IE`: `€1,020`), het rangtelwoord via `Intl.PluralRules` en het lezen van de prijstabel door de blokgrafiek. |
| `teksten` | `TEKST` (Nederlands) | Object met de zinnen die je wilt vervangen; ontbrekende sleutels blijven Nederlands. |

Plekhouders: `{product}` en `{max}` werken in elke zin. Verder per zin: `{n}` (`persoon`, `personen`, `mensen`, `app`, `apps`, `gebruiker`, `gebruikers`: enkelvoud bij 1), `{team}`, `{pct}`, `{prijs}`, `{aantal}`, `{apps}`, `{mensen}`, `{perMaand}`, `{perJaar}`, `{perApp}`, `{extra}`, `{verschil}`, `{rang}`, `{kop}`, `{tekst}`, `{naam}`. `**…**` maakt een stuk vet (alleen in `volgende`, `volgendeLeeg`, `volgendeAlles`).

| Sleutels | Waar |
|---|---|
| `teamVraag`, `teamHulp`, `toolsVraag`, `inPlaatsVan`, `perMaandKort` | invoer; `perMaandKort` (`/mnd`) staat achter elk maandbedrag |
| `persoon`, `personen` | `aria-valuetext` van de schuif |
| `labelLeeg`, `labelBesparing`, `labelDuurder`, `labelGelijk`, `eerlijk` | kop en uitleg van de uitkomstkaart |
| `nuLabel`, `onsLabel`, `verschilLabel`, `aantalLabel`, `perAppLabel`, `badge`, `badgeEen`, `cta` | regels van de uitkomstkaart |
| `volgendeLeeg`, `volgendeAlles`, `volgende`, `rang` | zin over de volgende app; `rang` is een object per Intl-ordinaalcategorie: nl `{ "other": "{n}e" }`, en `{ "one": "{n}st", "two": "{n}nd", "few": "{n}rd", "other": "{n}th" }` |
| `vergelijkKop`, `vergelijkSub`, `vergelijkSubLeeg`, `huidigeTools`, `vastePrijs`, `gebruiker`, `gebruikers`, `mensen`, `app`, `apps`, `voetBesparing`, `voetDuurder`, `voetGelijk` | vergelijkbalk |
| `kortingKop`, `kortingSub`, `legendaGekozen`, `legendaOverig`, `legendaSpook`, `legendaSpookPrijs`, `grafiekBeschrijving` | blokgrafiek |
| `tabelKop`, `tabelBijschrift`, `kolomApps`, `kolomPerApp`, `kolomPerMaand`, `kolomZonder`, `kolomKorting` | prijstabel |
| `liveBesparing`, `liveDuurder`, `liveGelijk`, `liveLeeg` | de `aria-live`-zin na een wijziging |

```js
import en from './teksten-en.json' with { type: 'json' };
init(root, { config: { ...config, locale: 'en-GB', teksten: en, btwRegel: 'All amounts per month, excluding VAT.' } });
```

## Opties
| Optie | Standaard | Omschrijving |
|---|---|---|
| `config` | `<script type="application/json">` in root | De configuratie hierboven. |
| `urlStaat` | `true` | Keuze in de adresbalk bijhouden met `history.replaceState` (geen nieuwe geschiedenisregels) en bij laden teruglezen. |

Export voor eigen gebruik en tests: `bereken(config, { team, apps })`, `pakketten(config)`, `leesKeuze(config, search)`, `naarQuery(keuze)`, `controleerConfig(ruw)`, `prijsPerApp`, `toolPrijs`, `euro(n, locale)`, `TEKST`.

CSS-variabelen op `.bc`: `--bc-sticky` (24px, afstand van de bovenrand voor de sticky kaart; zet hem op de hoogte van je vaste header), `--bc-accent`, `--bc-nacht`, `--bc-nacht-2`, `--bc-let-op`, `--bc-radius`, `--bc-ease`.

## URL
- Schrijven: `?team=8&apps=docs,projecten,kluis` (komma's leesbaar). Andere parameters en de hash blijven staan. Geen tools gekozen: `apps=` (leeg), zodat herladen ook 0 tools geeft.
- Lezen: team alleen als heel getal binnen min–max; app-id's alleen als ze in de configuratie staan; dubbelen en hoofdletters worden rechtgezet; `apps` met alleen onzin geeft de standaardkeuze. Niets uit de URL komt als HTML in de pagina.
- CTA: `contactUrl` + dezelfde query (bij 0 tools alleen `team`).

## Toegankelijkheid
- Native `<input type="range">` met `<label>`, `aria-valuetext` ("8 personen") en een hulptekst via `aria-describedby`. Pijltjes, Home en End werken vanzelf. Het grote teamgetal is decor (`aria-hidden`), de schuif zegt de waarde.
- Vinkkaarten zijn echte checkboxes in een `<fieldset>` met `<legend>`; spatie werkt, de focusring staat om de hele kaart (`:has(:focus-visible)`).
- Het tellende getal is `aria-hidden`; ernaast staat de eindwaarde voor schermlezers. Een `aria-live="polite"`-zin vat de uitkomst samen, pas 0,7 s nadat de bezoeker stopt met schuiven (geen geratel per stap).
- Tabel met `scope`, gemarkeerde rij met `aria-current`; de grafiek is één tabstop met pijltjes (zie `stats/blokgrafiek`).
- Minder beweging, `html[data-motion="paused"]` en `beweging:pauze`: het getal springt direct, geen overgangen.
- Contrast gemeten op 19 tekstsoorten: licht ≥ 4,58:1, donker ≥ 6,26:1.

## Valkuilen
- **Vergelijkingsprijzen van echte merken** zijn een claim. Noem bron, datum en abonnementsvorm in `btwRegel`, of gebruik categorieën in plaats van merknamen.
- **Sticky werkt binnen de rij**: de kaart reist alleen mee zolang de keuzekolom langer is dan de kaart. Zet geen `overflow: hidden` op een voorouder, dan werkt sticky helemaal niet.
- **`--bc-sticky`** moet je ophogen als de site een vaste header heeft, anders schuift de kaart eronder.
- **Afronden per tool** is bewust: wie de kaartbedragen optelt, komt op "Nu". Rond je pas aan het eind af (zoals eu-hosted), dan klopt €84 × 12 niet met €1.006.
- **`replaceState` in een sandbox-iframe** kan een fout geven; de module vangt die af en werkt dan zonder URL-staat.

## Herkomst
eu-hosted.com, pagina `/nl/prijzen` (gemeten 28-10-2026 in Chromium): schuif 1–10 met indigo vulling tot `--p`, duim 24 px die bij indrukken naar 1,15 schaalt, vinkkaarten in 1–3 kolommen (container queries 400/540 px), donkere uitkomstkaart sticky op `top: 88px`, getal 44 px in tabular-nums, eerlijke staat "Bij dit kleine team is SaaS goedkoper", CTA naar `/nl/contact?team=8&apps=docs,projects,passwords`, staffel €25 − €1 per extra app. Eigen code, eigen teksten en verzonnen toolnamen en -prijzen; geen CSS of JS overgenomen.

Wat wij beter doen:
- **Bedragen tellen op.** eu-hosted toont "Verschil per maand €84" en "€1.006 per jaar" (84 × 12 = 1.008): het rekent met onafgeronde prijzen. Hier is elk bedrag de som van getoonde bedragen.
- **Toestand in de URL.** Op eu-hosted verandert alleen de CTA-link; herladen of delen verliest de keuze. Hier staat hij in de adresbalk en komt hij terug.
- **Eerlijke lege staat.** Bij 0 tools zegt eu-hosted "Je bespaart per jaar €0" met "− €0" (gemeten). Hier staat "Kies je huidige tools", zonder nepverschil, en de CTA neemt alleen de teamgrootte mee.
- **Streepjes onder de duim.** eu-hosted zet 1–10 in een gelijk raster, waardoor 8 niet onder de duim staat. Hier staan ze op exact dezelfde positie als de duim, en de vulling eindigt onder het midden van de duim.
- **Contrast**: de streepjes 1–10 zijn bij eu-hosted `line-strong` (3,42:1); hier `ink-muted` (7,59:1).
- **Rustige schermlezer**: één samenvattende zin na een pauze, niet bij elke stap.
