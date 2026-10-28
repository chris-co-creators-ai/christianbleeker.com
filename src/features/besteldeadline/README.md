# besteldeadline

Een `<input type="date">` met een afsluittijd: vóór de deadline is vandaag
nog kiesbaar, erna pas morgen — gerekend in Nederlandse tijd, ook als de
bezoeker zelf in een andere tijdzone zit. Gesloten weekdagen en losse
gesloten datums worden geweigerd met een melding.

## Wanneer wel

- Bestel-/afhaalformulieren met een dagelijkse afsluittijd (bakkers,
  lunchzaken, bezorgdiensten).
- Elke datumkiezer waarbij "vandaag" niet altijd een geldige keuze is.

## Wanneer niet

- Voor een kalender met tijdslots per dag (ochtend/middag/avond) — dit
  component kiest alleen een datum, geen tijdvak.
- Als je serverside al een volledig geboekte-dagen-systeem hebt: dit
  component kent alleen *vaste* gesloten dagen/weekdagen, geen dynamische
  capaciteit.

## Installatie

```
component-library/tools/besteldeadline/
├── besteldeadline-kern.js      # vanilla ES-module, 0 dependencies
├── besteldeadline.css     # namespaced op [data-besteldeadline*]
├── Besteldeadline.tsx       # React/Next.js client-wrapper
├── demo.html                # zelfstandige demo (Het Lunchcafé)
└── test/meet.mjs            # Playwright-meting (vaste klok, andere tijdzone)
```

**Vanilla / elk framework**

```html
<div data-besteldeadline data-deadline="10:00" data-gesloten-weekdagen="0,1" data-gesloten-datums="2026-12-25">
  <label for="datum">Ophaaldatum</label>
  <input type="date" id="datum" name="ophaaldatum" data-besteldeadline-input />
  <p data-besteldeadline-melding></p>
</div>

<link rel="stylesheet" href="./besteldeadline.css" />
<script type="module">
  import { init } from './besteldeadline-kern.js';
  const destroy = init(document.querySelector('[data-besteldeadline]'));
</script>
```

**React / Next.js**

```tsx
import { Besteldeadline } from '@/component-library/tools/besteldeadline/Besteldeadline';

<Besteldeadline deadline="10:00" geslotenWeekdagen="0,1" geslotenDatums="2026-12-25">
  <label htmlFor="datum">Ophaaldatum</label>
  <input type="date" id="datum" name="ophaaldatum" data-besteldeadline-input />
  <p data-besteldeadline-melding />
</Besteldeadline>
```

## Markup-contract

- `data-deadline` (op de root) — afsluittijd `"UU:MM"`, Nederlandse tijd.
- `data-gesloten-weekdagen` (op de root, optioneel) — komma-gescheiden,
  `0`=zondag … `6`=zaterdag.
- `data-gesloten-datums` (op de root, optioneel) — komma-gescheiden
  ISO-datums (`JJJJ-MM-DD`).
- `[data-besteldeadline-input]` — verplicht, een `<input type="date">`.
- `[data-besteldeadline-melding]` — optioneel (wordt aangemaakt als hij
  ontbreekt); krijgt automatisch `role="status" aria-live="polite"`.

De waarde van het datumveld is al ISO (`JJJJ-MM-DD`, het native formaat van
`<input type="date">`) — die gaat rechtstreeks het formulier in bij
`name="…"`, geen aparte omzetting nodig.

## Opties (`init(root, options)`)

| Optie | Omschrijving |
|---|---|
| `texts.teVroeg` | `(iso) => string` — melding als een datum vóór de vroegst mogelijke datum gekozen wordt (kan eigenlijk alleen via een programmatische wijziging, want de native kiezer grijst `min` al uit). |
| `texts.gesloten` | `(iso) => string` — melding als een gesloten weekdag/datum gekozen wordt. |

Ook geëxporteerd: `berekenMinDatum(deadline, nu?)` en
`eerstvolgendeOpenDatum(vanafIso, geslotenWeekdagenSet, geslotenDatumsSet)` —
de losse, puur-functionele berekeningen (handig om apart te testen of elders
te hergebruiken).

## Gedrag

- **Vóór de deadline**: `input.min` = vandaag (NL-tijd). **Op of ná de
  deadline**: `input.min` = morgen.
- **Bij het laden** krijgt het veld, als het nog leeg is, alvast de
  eerstvolgende geldige datum als waarde (nooit een gesloten dag).
- **Gesloten weekdagen/datums** kan de native datumkiezer niet zelf
  uitgrijzen (`min`/`max`/`step` ondersteunen geen los patroon per weekdag) —
  dit component vangt dat op met een `change`-listener: kiest de bezoeker
  toch zo'n dag, dan springt het veld naar de eerstvolgende open dag mét een
  zichtbare melding.

## Toegankelijkheid

- `[data-besteldeadline-melding]` is een `aria-live="polite"`-regio: de
  correctie ("we zijn dan dicht, eerstvolgende datum is …") wordt
  voorgelezen.
- Verder gewoon een native `<input type="date">` met een `<label>` — volledig
  toetsenbord- en schermlezer-toegankelijk zonder extra werk.

## Valkuilen

- **NL-tijd, niet de klok van de bezoeker.** Een bezoeker in
  `America/New_York` die om 09:00 lokale tijd bestelt, zit dan al ná 10:00
  Nederlandse tijd — `nlTijd()` uit `_kwaliteit/basis.js` rekent altijd in
  `Europe/Amsterdam`, ongeacht de tijdzone van de browser.
- **Datumvergelijking als tekst.** ISO-datums (`JJJJ-MM-DD`) vergelijken
  correct als gewone strings (`"2026-09-24" < "2026-09-25"`) — geen
  `Date`-object-vergelijking nodig, en dus ook geen tijdzone-valkuil daarin.
- **Weekdag van een ISO-datum** wordt met `Date.UTC` berekend, nooit met de
  lokale tijdzone van de browser — anders zou "2026-09-27" (een zondag) in
  sommige tijdzones als zaterdag geteld kunnen worden.

## Op WordPress

Zelfde patroon als `reveal-on-scroll`: bestanden in het thema, laden via
`wp_enqueue_script_module()`, `init()` na `DOMContentLoaded`. De
`data-deadline`/`data-gesloten-*`-attributen kun je vanuit een ACF-veld of
theme-optie renderen.

