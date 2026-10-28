# open-status

Live openingsstatus: "Nu open · sluit om 17:00" of "Gesloten · morgen open om
9:00". Rekent altijd in Nederlandse tijd (`Europe/Amsterdam`), ook als de
bezoeker in een andere tijdzone zit. Ondersteunt meerdere tijdvakken per dag
(lunchpauze), uitzonderingen per datum (feestdagen, eenmalige aangepaste
uren) en een seizoensschema (bv. zomeruren).

## Wanneer wel

- Een winkel, praktijk of studio met vaste openingstijden die bezoekers in
  één oogopslag willen laten zien of ze nu terecht kunnen.
- Situaties met uitzonderingen: feestdagen dicht, een dag met aangepaste
  uren, een ander schema in het hoogseizoen.

## Wanneer niet

- Niet voor een agenda/booking-widget met losse afspraakslots — dit toont
  alleen open/dicht + de eerstvolgende wisseling.
- Niet als enige bron van waarheid voor spoedgevallen (brand, alarm): dit is
  een klantvriendelijke indicatie, geen operationeel systeem.

## Installatie

```
component-library/badges/open-status/
├── open-status.js      # vanilla ES-module, 0 dependencies
├── open-status.css     # namespaced op .os
├── OpenStatus.tsx       # React/Next.js client-wrapper
├── demo.html            # zelfstandige demo
└── test/meet.mjs        # Playwright-meting (incl. vaste-klok-scenario's)
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./open-status.css" />
<!-- class="os" is verplicht: de stylesheet zet de kleuren/focusring via CSS-variabelen op .os,
     zonder die klasse blijft de statusstip onzichtbaar en heeft "Alle openingstijden" geen
     zichtbare focusring (G9). -->
<div class="os" data-open-status>
  <script type="application/json" data-os-schema>
  { "weekschema": { "0": [], "1": [["09:00","17:00"]], "2": [["09:00","17:00"]],
    "3": [["09:00","17:00"]], "4": [["09:00","17:00"]], "5": [["09:00","17:00"]], "6": [] } }
  </script>
  <p class="os__regel">
    <span class="os__dot" aria-hidden="true"></span>
    <span data-os-tekst aria-live="polite" aria-atomic="true">Openingstijden laden…</span>
  </p>
  <noscript>Maandag t/m vrijdag 09:00–17:00, weekend gesloten.</noscript>
</div>
<script type="module">
  import { init } from './open-status.js';
  const destroy = init(document.querySelector('[data-open-status]'));
  // destroy() bij opruimen
</script>
```

**React / Next.js**

```tsx
import { OpenStatus } from '@/component-library/badges/open-status/OpenStatus';

<OpenStatus schema={{ weekschema: { 0: [], 1: [['09:00', '17:00']], /* … */ } }} />
```

## Markup-contract

- Root: het element met `class="os"` **en** `data-open-status` (de klasse levert de
  CSS-variabelen — kleuren en de focusring van "Alle openingstijden" werken niet zonder). Bevat:
  - `<script type="application/json" data-os-schema>` — het schema-object
    (zie hieronder), **of** je geeft het via `opties.schema`/de
    `schema`-prop mee. Attribuut wint als beide aanwezig zijn? Nee — de
    optie/prop wint (handig als het schema uit een CMS komt zonder inline
    `<script>`).
  - `[data-os-tekst]` — het element waarin de module de statustekst zet.
    Zet hier zelf `aria-live="polite" aria-atomic="true"` op (R15) en een
    zinvolle standaardtekst zoals "Openingstijden laden…" (R4).
  - Optioneel een `<noscript>` met een statische tabel — dat IS de
    "zonder JS bruikbaar"-fallback; de module raakt hem niet aan.
- `data-refresh-ms="60000"` (optioneel, standaard 60000) — hoe vaak
  herberekend wordt, uitgelijnd op de minuutgrens.
- `data-schema-org` (optioneel) — voegt een `<script type="application/ld+json">`
  met `OpeningHoursSpecification` toe (uit het basis-weekschema, zonder
  uitzonderingen/seizoenen — schema.org's `specialOpeningHoursSpecification`
  is hier bewust niet geïmplementeerd, zie Valkuilen).
- De module zet `data-os-status="open"` of `"dicht"` op de root — gebruik
  dat als CSS-haak voor eigen styling.

### Schema-vorm

```jsonc
{
  "weekschema": {
    // sleutel = weekdag, 0 = zondag … 6 = zaterdag (zelfde volgorde als nlTijd().weekdag)
    "1": [["09:00", "12:30"], ["13:00", "17:00"]] // meerdere tijdvakken per dag = lunchpauze
  },
  "uitzonderingen": {
    // sleutel = ISO-datum
    "2026-12-25": { "open": false, "label": "eerste kerstdag" }, // hele dag dicht, met reden
    "2026-12-05": [["10:00", "13:00"]] // aangepaste uren die dag
  },
  "seizoenen": [
    { "van": "2026-07-01", "tot": "2026-08-31", "weekschema": { /* zelfde vorm als hierboven */ } }
  ]
}
```

Prioriteit per datum: **uitzondering** > **seizoen** (als de datum binnen
`van`–`tot` valt) > **basis-weekschema**.

## Opties (`init(root, opties)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `schema` | uit `[data-os-schema]` | Het schema-object; wint van het inline `<script>`. |
| `verversMs` | `data-refresh-ms` of `60000` | Hoe vaak herberekend wordt. |
| `schemaOrg` | `data-schema-org` aanwezig? | Voegt ld+json `OpeningHoursSpecification` toe. |

## Toegankelijkheid

- `[data-os-tekst]` hoort `aria-live="polite" aria-atomic="true"` te hebben
  (door de bouwer gezet, niet door de module — zo is de live-region er ook
  al vóór JS laadt). De module schrijft alleen naar de DOM als de tekst
  **echt verandert**: elke minuut herberekenen betekent niet elke minuut een
  aankondiging (R15 — geen spam).
- `.os__dot` is decoratief (`aria-hidden="true"`); de puls stopt bij
  `prefers-reduced-motion: reduce` via CSS.
- Het "Alle openingstijden"-blok is een native `<details>/<summary>` —
  toetsenbord (Tab + Enter/Spatie) en schermlezer-ondersteuning komen gratis
  mee, geen eigen ARIA-toggle-logica nodig.
- Tijden staan in `<time datetime="17:00">17:00</time>`.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/open-status/`.
2. Enqueue de CSS met `wp_enqueue_style()`, laad `open-status.js` met
   `wp_enqueue_script_module()` (geen versienummer — zie
   `scroll/reveal-on-scroll/README.md` "Op WordPress" voor waarom).
3. Zet het schema in een ACF-veld of custom field als JSON, en print het in
   het `<script type="application/json" data-os-schema>`-blok via PHP
   (`echo wp_json_encode( $schema );`).
4. Roep `init()` aan ná `DOMContentLoaded`.

## Valkuilen

- **Tijdzone van de server ≠ tijdzone van de bezoeker.** Dit component
  negeert beide — het rekent altijd in `Europe/Amsterdam` via `nlTijd()`.
  Een bezoeker in New York ziet dus Nederlandse tijd, niet zijn eigen (dat
  is hier bewust: "sluit om 17:00" moet 17:00 Nederlandse tijd betekenen).
- **`specialOpeningHoursSpecification` ontbreekt in de schema.org-output.**
  We genereren alleen `OpeningHoursSpecification` uit het basisschema.
  Uitzonderingen per datum zijn voor zoekmachines niet 1-op-1 in schema.org
  te vangen zonder een aparte, complexere structuur — voeg die zelf toe als
  je daar SEO-winst van verwacht.
- **Middernacht-overgang**: de status hoort om 00:00 automatisch de
  volgende dag te gebruiken (nieuwe weekdag, nieuwe uitzonderingen). Dat
  gebeurt vanzelf omdat elke herberekening opnieuw `nlTijd()` opvraagt — er
  wordt niets gecachet op basis van "vandaag" over een herberekening heen.
- **Schema met een leeg tijdvak-array vergeten voor een gesloten dag**: een
  ontbrekende sleutel in `weekschema` wordt ook als "geen tijdvakken"
  behandeld, maar expliciet `"0": []` is duidelijker leesbaar.

