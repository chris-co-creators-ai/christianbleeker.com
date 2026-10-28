# afstand-postcode

"Bij jou in de buurt": een bezoeker vult een postcode in (of deelt zijn
locatie) en ziet de lijst met vestigingen gesorteerd op afstand, met "12 km"
erbij en een optioneel filter op straal.

## Wanneer wel

- Een vestigingen-/locatorpagina met een handvol tot enkele tientallen
  vaste locaties (winkels, vestigingen, dependances).
- Als de lijst ook zonder JavaScript al bruikbaar moet zijn (R4) — dit
  component is daar expliciet op gebouwd.

## Wanneer niet

- Voor honderden of duizenden locaties: dan wil je server-side filtering/
  paginering, niet alles in de DOM met een client-side haversine-berekening.
- Voor een kaartweergave — dit component toont alleen een gesorteerde lijst,
  geen kaart.

## Installatie

```
component-library/tools/afstand-postcode/
├── afstand-postcode.js      # vanilla ES-module, 0 dependencies
├── afstand-postcode.css     # namespaced op [data-afstand-*]
├── AfstandPostcode.tsx        # React/Next.js client-wrapper
├── demo.html                  # zelfstandige demo
└── test/meet.mjs              # Playwright-meting (PDOK + geolocation gemockt)
```

**Vanilla / elk framework**

```html
<div data-afstand-postcode>
  <form data-afstand-form>
    <label for="postcode">Postcode</label>
    <input id="postcode" data-afstand-postcode-input placeholder="1234 AB" />
    <button type="submit">Zoek</button>
  </form>
  <button type="button" data-afstand-locatie>Gebruik mijn locatie</button>
  <select data-afstand-straal>
    <option value="0">Alles</option>
    <option value="25">25 km</option>
  </select>
  <p data-afstand-status role="status" aria-live="polite"></p>
  <ul data-afstand-lijst>
    <li data-locatie data-lat="52.3676" data-lng="4.9041">
      <a href="/vestigingen/amsterdam">Amsterdam</a>
      <span data-afstand-km></span>
    </li>
  </ul>
</div>

<link rel="stylesheet" href="./afstand-postcode.css" />
<script type="module">
  import { init } from './afstand-postcode.js';
  const destroy = init(document.querySelector('[data-afstand-postcode]'));
</script>
```

**React / Next.js**

```tsx
import { AfstandPostcode } from '@/component-library/tools/afstand-postcode/AfstandPostcode';

<AfstandPostcode>
  <form data-afstand-form>…</form>
  <ul data-afstand-lijst>
    <li data-locatie data-lat="52.3676" data-lng="4.9041">
      <a href="/vestigingen/amsterdam">Amsterdam</a>
      <span data-afstand-km />
    </li>
  </ul>
</AfstandPostcode>
```

## Markup-contract

- `[data-afstand-form]` + `[data-afstand-postcode-input]` — verplicht.
- `[data-afstand-lijst]` — verplicht; een `<ul>` met daarin één `<li
  data-locatie data-lat="…" data-lng="…">` per locatie. Zet er zelf een
  `<span data-afstand-km>` in als je de afstand wilt tonen.
- `[data-afstand-locatie]` — optioneel, een knop voor "gebruik mijn locatie"
  (geolocation).
- `[data-afstand-straal]` — optioneel, een `<select>` met km-waarden
  (`"0"` = geen filter/alles).
- `[data-afstand-status]` — optioneel, meldingen (laden/fouten/"geen
  resultaten"). Geef zelf `role="status" aria-live="polite"` mee.

**Zonder JavaScript**: de `<ul>` met alle locaties (en werkende links) is
gewoon zichtbaar — dit component verbergt bij het laden niets; het voegt
alleen zoek-/sorteer-/filtergedrag toe zodra JS actief is.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `pdokUrl` | PDOK Locatieserver `free`-endpoint | Override voor tests/mocks. |
| `texts.*` | NL-standaardteksten | Zie `DEFAULT_TEXTS` in `afstand-postcode.js` voor alle sleutels (zoeken, niet gevonden, netwerkfout, geolocation geweigerd/onbeschikbaar/timeout, geen resultaten binnen straal). |

Ook geëxporteerd: `haversineKm(lat1, lng1, lat2, lng2)` — de losse
afstandsberekening, herbruikbaar buiten dit component.

## Toegankelijkheid

- `[data-afstand-status]` is bedoeld als `aria-live`-regio (zie
  Markup-contract) — laadstatus, fouten en "geen resultaten binnen deze
  straal" worden zo voorgelezen.
- Alle bediening is gewone `<form>`/`<button>`/`<select>`-elementen: Tab,
  Enter en Spatie werken zonder extra code.
- Locaties buiten de gekozen straal krijgen `hidden` (niet alleen visueel
  verborgen) — ze zijn dan ook niet vindbaar voor een schermlezer of
  Tab-navigatie, wat hier gewenst is (ze passen niet bij de zoekopdracht).

## Valkuilen

- **Geolocation-fouten worden vertaald naar Nederlandse tekst**, niet als
  ruwe foutcode getoond: geweigerd (code 1), onbeschikbaar (code 2) of
  timeout (code 3) krijgen elk hun eigen `texts.geo*`-melding, met het advies
  om in plaats daarvan de postcode in te vullen.
- **PDOK-uitval breekt niets** (R5): een netwerkfout of lege respons toont
  een nette melding; de lijst blijft in zijn laatste (of ongesorteerde)
  staat zichtbaar en bruikbaar.
- **`[data-afstand-straal]` filtert op de laatst berekende afstanden.** Zet
  je de straal vóórdat er een postcode/locatie is opgegeven, dan is er nog
  niets om op te filteren — de module doet dan niets totdat er wél een
  afstand bekend is.
- **PDOK's `centroide_ll`** komt als WKT-punt (`"POINT(lon lat)"`) — let op
  de volgorde (longitude eerst) als je dit veld ergens anders ook uitleest.

## Op WordPress

Zelfde patroon als `reveal-on-scroll`: bestanden in het thema, laden via
`wp_enqueue_script_module()`, `init()` na `DOMContentLoaded`. De
locatie-`<li>`'s kun je met een gewone WordPress-lus (CPT "vestiging" met
lat/lng-velden) renderen — de module leest ze uit de DOM, niet uit een
aparte databron.

