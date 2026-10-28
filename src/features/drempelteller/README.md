# drempelteller

"Nog 312 aanmeldingen tot we live gaan" of "68 van 100 plekken bezet", met een
voortgangsbalk. **Alleen met echte data:** de teller toont een getal dat jij
hem geeft, en verbergt zich als er geen geldig getal is. Hij verzint nooit iets.

- getal uit `data-waarde` (server-gerenderd) of uit een JSON-endpoint (`data-bron`)
- zonder geldige waarde: `hidden`, geen balk, geen getal
- het endpoint wordt pas opgehaald als de teller (bijna) in beeld komt, met een time-out
- optioneel telt het getal op (bij "minder beweging" direct de eindstand)
- eigen tekst en kleur zodra het doel bereikt is
- `role="progressbar"` (of `meter`) met `aria-valuenow`, `aria-valuemax` en `aria-valuetext`

## Wanneer wel

- Een wachtlijst met een drempel ("we gaan live bij 1.000 aanmeldingen").
- Beperkte plekken: een workshop, een pilot, een eerste batch.
- Een campagne of crowdfunding met een echt doelbedrag of doelaantal.

## Wanneer niet

- Je hebt de echte stand niet (nog geen koppeling met je database of
  formulierdienst). Dan geen teller: een gefingeerd getal is erger dan geen getal.
- Het getal is klein en tegenvallend ("3 van 1.000"): dat werkt tegen je. Wacht
  tot er iets te tonen valt, of toon de teller pas vanaf een minimum (zie Valkuilen).
- Realtime cijfers per seconde (koersen, scores): dit is een teller die één keer
  laadt, geen live-ticker.

## Installatie

```
component-library/badges/drempelteller/
├── drempelteller-kern.js         # vanilla ES-module, 0 dependencies
├── drempelteller.css        # namespaced op [data-drempelteller] en .dt__*
├── Drempelteller.tsx        # React/Next.js client-wrapper
├── demo.html                # zelfstandige demo (Studio Wester)
├── wachtlijst-stand.json    # voorbeeldstand voor de demo (verzonnen)
└── test/meet.mjs            # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./drempelteller.css" />

<!-- 1. Server-gerenderd: de zin staat in de HTML en blijft zichtbaar zonder JavaScript -->
<div data-drempelteller data-waarde="688" data-doel="1000" data-eenheid="aanmeldingen"
     data-tekst="Nog {resterend|aanmelding|aanmeldingen} tot we live gaan">Nog 312 aanmeldingen tot we live gaan</div>

<!-- 2. Uit een endpoint: verborgen tot er een getal is -->
<div data-drempelteller hidden data-bron="/api/wachtlijst/stand" data-eenheid="aanmeldingen"
     data-tekst="Nog {resterend|aanmelding|aanmeldingen} tot we live gaan"></div>

<script type="module">
  import { init } from './drempelteller-kern.js';
  const destroys = [...document.querySelectorAll('[data-drempelteller]')].map((el) => init(el));
</script>
```

**React / Next.js (App Router)**

```tsx
import { Drempelteller } from '@/component-library/badges/drempelteller/Drempelteller';

// waarde komt uit je database in een server component
<Drempelteller waarde={aantal} doel={1000} eenheid="aanmeldingen"
  tekst="Nog {resterend|aanmelding|aanmeldingen} tot we live gaan">
  Nog {1000 - aantal} aanmeldingen tot we live gaan
</Drempelteller>

// of uit een route handler
<Drempelteller bron="/api/wachtlijst/stand" doel={1000} eenheid="aanmeldingen" />
```

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema; laad de css met `wp_enqueue_style()` en de module met
   `wp_enqueue_script_module( 'drempelteller', $url, array(), null )` (6.5+,
   bewust `null` als versie zodat de `import` dezelfde URL houdt). Sluit het
   script uit van JS-combinatie in caching-plugins.
2. Server-gerenderd: laat PHP het getal invullen, met een echte telling, en
   escape het:
   ```php
   $aantal = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}wachtlijst" );
   printf(
     '<div data-drempelteller data-waarde="%1$d" data-doel="1000" data-eenheid="aanmeldingen" data-tekst="%2$s">%3$s</div>',
     $aantal, esc_attr( 'Nog {resterend|aanmelding|aanmeldingen} tot we live gaan' ),
     esc_html( sprintf( 'Nog %s aanmeldingen tot we live gaan', number_format_i18n( max( 0, 1000 - $aantal ) ) ) )
   );
   ```
3. Of een endpoint: `register_rest_route( 'wester/v1', '/stand', … )` dat
   `{"waarde": 688, "doel": 1000}` teruggeeft, en `data-bron="/wp-json/wester/v1/stand"`.
4. Pagina-cache: staat de pagina in een full-page cache (WP Rocket e.d.), dan is
   een server-gerenderd getal zo oud als de cache. Gebruik dan `data-bron`, met
   een endpoint dat je uitsluit van de cache.

## Markup-contract

- **Root** (`data-drempelteller`): het element dat je aan `init()` geeft. Krijgt
  `data-dt-actief` en `data-dt-status`: `wacht` (op in beeld), `laden`, `bezig`,
  `bereikt`, `leeg` (geen geldige waarde) of `geen-data` (endpoint faalde).
  Bij `bereikt` staat ook `data-dt-bereikt`; tijdens het optellen `data-dt-telt`.
- De inhoud van de root is de **server-gerenderde tekst**. JS vervangt hem door
  de zin (met het getal in een `<strong class="dt__getal">`) en de balk. `destroy()`
  zet de oorspronkelijke inhoud terug.
- **Geldige waarde:** een niet-negatief getal (cijfers, eventueel met een punt als
  decimaalteken). `0` is een echte waarde en wordt getoond. `""`, `abc`, `-5`, `12,5`,
  `NaN` en een ontbrekend attribuut zijn ongeldig. Het doel moet groter dan 0 zijn.
- **Endpoint** (`data-bron`): antwoordt met JSON `{ "waarde": 688, "doel": 1000 }`.
  `doel` mag ook uit `data-doel` komen. Niet-200, geen JSON, een ontbrekend of
  ongeldig veld, of een time-out: de teller blijft verborgen en gooit niets.
  Zet de root met `data-bron` in de markup op `hidden`: zonder JavaScript is er
  immers geen getal om te tonen.

## Opties (`init(root, opties)`, of als `data-`attribuut)

| Optie | Attribuut | Standaard | Omschrijving |
|---|---|---|---|
| `waarde` | `data-waarde` | | Huidige stand. |
| `doel` | `data-doel` | | Drempel; ook uit het endpoint mogelijk. |
| `bron` | `data-bron` | | URL van het JSON-endpoint. |
| `veldWaarde` / `veldDoel` | | `waarde` / `doel` | Sleutels in het JSON-antwoord. |
| `timeout` | `data-timeout` | `4000` | Milliseconden voor het ophalen wordt opgegeven. |
| `eenheid` | `data-eenheid` | leeg | Woord voor `{eenheid}`, bv. "aanmeldingen". |
| `eenheidEen` | `data-eenheid-een` | leeg | Enkelvoud voor `{eenheid}` als het getal ervoor precies 1 is, bv. "aanmelding". Zonder deze optie gebruik je beter `{resterend|aanmelding|aanmeldingen}`. |
| `tekst` | `data-tekst` | `Nog {resterend} {eenheid} te gaan` | Zin tot het doel. Plaatsvervangers: `{waarde}` `{doel}` `{resterend}` `{procent}` `{eenheid}`. Enkelvoud/meervoud: `{resterend|aanmelding|aanmeldingen}` toont het getal gevolgd door "aanmelding" bij precies 1 en anders "aanmeldingen" ("Nog 1 aanmelding", "Nog 2 aanmeldingen"). |
| `tekstBereikt` | `data-tekst-bereikt` | `Doel bereikt: {waarde} {eenheid}` | Zin bij waarde ≥ doel. |
| `optellen` | `data-optellen` | uit | Getal en balk tellen op zodra de teller in beeld komt. |
| `duur` | | `1200` | Duur van het optellen in ms. |
| `label` | `data-label` | `Voortgang` | Toegankelijke naam van de balk (`aria-label`). |
| `rol` | | `progressbar` | Of `meter`. |
| `bijGetoond` | | | Callback `({ waarde, doel, bereikt })` zodra de teller getoond wordt. |

Getallen worden in `nl-NL` genoteerd (1.000). CSS-variabelen: `--dt-ink`, `--dt-zacht`,
`--dt-spoor`, `--dt-vul`, `--dt-bereikt`, `--dt-hoogte`, `--dt-getal` (grootte van het getal).

## Toegankelijkheid

- De balk is `role="progressbar"` met `aria-valuemin="0"`, `aria-valuemax`, `aria-valuenow`
  (afgekapt op het doel), `aria-valuetext` (de volledige zin) en `aria-label`.
  De zichtbare zin is `aria-hidden`, zodat een schermlezer hem niet dubbel voorleest;
  wie de balk bereikt hoort "Nog 312 aanmeldingen tot we live gaan".
- Tijdens het optellen verandert `aria-valuenow` niet: de schermlezer krijgt meteen de
  eindstand en geen stroom aan tussenwaarden.
- Minder beweging (`prefers-reduced-motion: reduce`): geen optellen, meteen de eindstand.
  Zet de bezoeker het aan tijdens het optellen, dan springt hij direct naar de eindstand.
- Contrast: standaardkleuren halen ≥ 4,5:1 op wit (groen #1f4a3d, oranje #b4571b).
  Kleur is niet de enige aanwijzing: de tekst wisselt mee bij "bereikt".
- Er is niets bedienbaar; er valt dus geen focus of toetsenbordgedrag te regelen.

## Valkuilen

- **Eerlijkheid (R8/R9):** dit onderdeel telt nooit zelf iets. Zorg dat `data-waarde`
  of het endpoint dezelfde bron heeft als de tekst in je kopjes ("bij 1.000
  aanmeldingen" staat als `data-doel`, niet ook nog eens los in de tekst).
- **Server-gerenderde tekst komt uit dezelfde waarde als `data-waarde`.** De tekst in
  de root staat zonder JavaScript en tijdens het laden op het scherm, en de teller
  kan die niet corrigeren. Is de waarde ongeldig of onbekend, render dan niets: een
  lege root met `hidden`, zoals de kaart "Zonder waarde" in de demo. Zet een tekst
  met een getal nooit als vaste inhoud naast een `data-waarde` die je nog moet vullen.
- **Afronding:** `{resterend}` rondt naar boven af en `{waarde}` en `{procent}` naar beneden,
  zolang het doel niet gehaald is. Bij een doelbedrag ("€ 9.999,60 van € 10.000") staat er
  dus "Nog 1", nooit "Nog 0".
- **Nog geen echte stand?** Laat de teller weg. Ongeldig is verborgen, en dat is
  bewust zo: er is geen "voorbeeldwaarde" om op terug te vallen.
- **Minimum tonen:** wil je pas tonen vanaf 100 aanmeldingen, doe dat server-side
  (render de teller niet) of geef in je endpoint een ongeldig antwoord.
- **CORS:** een endpoint op een ander domein moet `Access-Control-Allow-Origin` sturen.
  De aanvraag gaat zonder cookies (`credentials: 'omit'`).
- **Caching:** een server-gerenderde waarde is zo oud als je pagina-cache. Bij veel
  verkeer: `data-bron` met een kort gecachet endpoint.
- **Time-out:** standaard 4 s; daarna verdwijnt de teller (nooit een oud getal).
- **Layout-shift:** tot het getal er is, neemt de teller geen ruimte in. Reserveer zelf
  hoogte (`min-height`) als hij boven de vouw staat en er niets onder mag verspringen.
- **Twee keer `init()`** op dezelfde root doet niets.

