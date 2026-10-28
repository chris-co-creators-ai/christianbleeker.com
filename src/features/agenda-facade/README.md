# agenda-facade

Een afspraakagenda van een externe dienst (Cal.com, Calendly, HubSpot
Meetings, Google Agenda-afspraakplanning, TidyCal of een losse iframe-URL)
pas laden na een klik. Tot dan staat er een eigen kaart: wie je spreekt, hoe
lang het duurt, waarover het gaat, een knop "Kies een moment" en een gewone
link "Open de agenda in een nieuw tabblad". Er gaat geen enkel verzoek naar de
dienst vóór de klik.

## Privacy: geen cookiemelding voor de kaart

Pas ná de klik gaan er gegevens naar de dienst (IP-adres, user-agent, en wat
de dienst zelf plaatst). Zolang niemand klikt, laadt er niets van Cal.com,
Calendly, HubSpot of Google, en worden er geen cookies of trackers van hen
gezet. Het tonen van de kaart hoeft dus geen toestemming: de klik op "Kies een
moment" is de bewuste handeling. Zeg dat ook in het privacybeleid ("de
afspraakagenda wordt pas geladen als je erom vraagt; daarna gelden de
voorwaarden van <dienst>"). De iframe krijgt `referrerpolicy="strict-origin-when-cross-origin"`:
alleen de site-origin gaat mee, niet het pad. Dit is geen juridisch advies;
laat het verwerkersdeel (overeenkomst met de dienst) door je eigen jurist of
je AVG-specialist controleren.

## Wanneer wel

- Een contactpagina of dienstpagina met één "plan een gesprek"-blok.
- Sites die vóór een bewuste keuze geen derde partij willen laden (zie
  Brandfabric: HubSpot Meetings laadt daar op elke pagina direct mee).
- Een agenda onderaan een lange pagina: de zware widget van de dienst
  (700+ px, eigen scripts) laadt alleen als iemand hem nodig heeft.

## Wanneer niet

- Een pagina waar de agenda het enige doel is (een aparte `/afspraak`-pagina
  die alleen daarvoor wordt geopend): laad hem dan gewoon direct, of gebruik
  `vooraf`.
- Betaalde boekingen met een eigen kassa-flow: gebruik dan de checkout van de
  dienst zelf in een nieuw tabblad.

## Installatie

```
component-library/media/agenda-facade/
├── agenda-facade.js     vanilla ES-module, 0 dependencies
├── agenda-facade.css    namespaced op .af
├── AgendaFacade.tsx     React/Next.js client-wrapper
├── assets/voorbeeld-agenda.html   eigen nep-agenda, alleen voor de demo
├── demo.html            Studio Wester: Cal.com, Calendly, HubSpot
└── test/meet.mjs        Playwright-meting (alle externe URL's gemockt)
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./agenda-facade.css" />

<div class="af" data-agenda-facade data-dienst="calendly" data-titel="Adviesgesprek met Joris de Wit">
  <div class="af__kaart">
    <div class="af__wie">
      <span class="af__avatar" aria-hidden="true">JW</span>
      <div><p class="af__naam">Joris de Wit</p><p class="af__rol">Strateeg</p></div>
    </div>
    <ul class="af__feiten"><li class="af__feit">30 minuten</li></ul>
    <p class="af__tekst">Waar we het over hebben.</p>
    <div class="af__acties">
      <a class="af__link" data-af-fallback href="https://calendly.com/jouw-naam/advies" target="_blank" rel="noopener noreferrer">Open de agenda in een nieuw tabblad</a>
    </div>
  </div>
</div>

<script type="module">
  import { init } from './agenda-facade.js';
  const destroy = init(document.body);
</script>
```

De `href` van de link is de enige bron van de URL: de embed-URL wordt daaruit
afgeleid (`data-url` is alleen nodig als de embed-URL anders is dan de
openbare link).

**React / Next.js (App Router)**

```tsx
import { AgendaFacade } from '@/component-library/media/agenda-facade/AgendaFacade';

<AgendaFacade mobielNieuwTabblad>
  <div className="af" data-agenda-facade data-dienst="cal" data-titel="Kennismaking">
    <div className="af__kaart">
      {/* zelfde markup als hierboven, className i.p.v. class */}
      <a className="af__link" data-af-fallback href="https://cal.com/jouw-naam/kennismaking" target="_blank" rel="noopener noreferrer">
        Open de agenda in een nieuw tabblad
      </a>
    </div>
  </div>
</AgendaFacade>
```

**WordPress**: CSS enqueuen, `agenda-facade.js` als module laden (zie
`scroll/reveal-on-scroll` voor het `wp_enqueue_script_module()`-recept) en de
markup in een Custom HTML-blok of template-part zetten. Sluit het bestand uit
van JS-combineerplugins (die strippen `type="module"`).

## Markup-contract

Attributen op `[data-agenda-facade]`:

| Attribuut | Verplicht | Betekenis |
|---|---|---|
| `data-dienst` | nee | `cal`, `calendly`, `hubspot`, `google`, `tidycal` of `iframe` (standaard: de URL ongewijzigd). |
| `data-titel` | aanbevolen | Voor de knoplabel, de kop en de `title` van de iframe. |
| `data-url` | nee | Boekingspagina als die afwijkt van de `href` van de link. Alleen `https:`. |
| `data-vooraf` | nee | Als de optie `vooraf`, maar voor deze ene facade. |
| `data-voorbeeld-src` | nee | **Alleen voor demo's**: laad deze eigen pagina in plaats van de dienst. |

Binnenin: één `.af__kaart` met daarin een `a[data-af-fallback]`. Naam, rol,
duur (`.af__feiten`), tekst en avatar zijn gewone HTML en dus ook zonder JS
zichtbaar. Een foto: `<img class="af__avatar" src alt="">` in plaats van de
initialen.

## Per dienst: embed-URL, hoogte en CSP

De facade laadt de dienst als gewone iframe, niet met hun `embed.js`. Daardoor
hoeft de CSP alleen `frame-src` te openen; `script-src` en `connect-src` niet.
De basis (`lab/site-basis/src/lib/csp.ts`) heeft `frame-src 'self'`, dus zonder
onderstaande regel laadt de iframe niet. Zet ze in `cspExtra` in
`next.config.ts`:

```ts
const cspExtra: CspBronnen = {
  'frame-src': ['https://cal.com', 'https://app.cal.com'],
};
```

| `data-dienst` | Publieke URL (link) | Embed-URL die wij bouwen | Hoogte | `cspExtra` `frame-src` |
|---|---|---|---|---|
| `cal` | `https://cal.com/naam/gesprek` | `…?embed=true&layout=month_view` | `min` 680 px, groeit mee via postMessage `__dimensionChanged` | `https://cal.com https://app.cal.com` (EU-instantie: `https://app.cal.eu`; eigen domein bij self-hosting) |
| `calendly` | `https://calendly.com/naam/gesprek` | `…?embed_domain=<jouw-host>&embed_type=Inline&hide_gdpr_banner=1` | 700 px, groeit mee via `calendly.page_height` | `https://calendly.com` |
| `hubspot` | `https://meetings.hubspot.com/naam/gesprek` | `…?embed=true` | vast 760 px (geen postMessage-hoogte gemeten) | `https://meetings.hubspot.com` (EU-datacenter: `https://meetings-eu1.hubspot.com`; eigen domein als je dat hebt gekoppeld) |
| `google` | `https://calendar.google.com/calendar/appointments/schedules/<ID>` | `…?gv=true` | vast 720 px | `https://calendar.google.com` |
| `tidycal` | `https://tidycal.com/naam/gesprek` | `…?embed=1` | vast 700 px | `https://tidycal.com` |
| `iframe` | elke https-URL | ongewijzigd | vast 720 px | het domein van die dienst |

Opmerkingen:

- **Google**: gebruik de lange `calendar.google.com/calendar/appointments/schedules/…`-URL
  uit "Delen → Afspraakplanning", niet de korte `calendar.app.google/…`-link:
  die stuurt door en laat zich niet inbedden.
- **Hoogte**: de iframe begint op de vaste hoogte uit `--af-hoogte`. Calendly
  en Cal.com sturen hun eigen hoogte via `postMessage`; die volgen we, maar
  alleen van berichten die uit onze eigen iframe komen (`event.source`),
  begrensd op 320–2400 px. Voor de andere diensten stel je de hoogte in met de
  CSS-variabele `--af-hoogte`.
- **Diensten die weigeren**: een dienst mag inbedden blokkeren met zijn eigen
  `frame-ancestors`. Zie je een lege iframe terwijl jouw CSP klopt, kijk dan in
  de instellingen van de dienst of "embedden op je eigen domein" aan staat
  (Calendly en HubSpot vragen je soms het domein toe te voegen).
- De URL-parameters zijn gebaseerd op de openbare embed-instructies van de
  diensten en tegen een mock gemeten, niet tegen de echte diensten. TidyCal's
  `embed=1` in het bijzonder: vergelijk met de embed-code in je eigen
  TidyCal-account voordat je live gaat.

## Opties (`init(root, opties)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `"[data-agenda-facade]"` | Selector voor de facades binnen `root`. |
| `vooraf` | `false` | Laad de agenda al als de kaart (bijna) in beeld komt, zonder klik en zonder de focus te verplaatsen. Dan gaan er wel gegevens naar de dienst zodra iemand ernaartoe scrolt: houd daar rekening mee in je privacyverhaal. |
| `mobielNieuwTabblad` | `true` | Op een smal scherm opent "Kies een moment" de dienst in een nieuw tabblad in plaats van een krappe iframe. De knoplabel zegt dat. `vooraf` laadt dan op mobiel niets. |
| `mobielQuery` | `"(max-width: 640px)"` | Media query die "mobiel" bepaalt. |
| `timeout` | `12000` | Na zoveel ms zonder `load` verschijnt een melding met de link naar een nieuw tabblad. |

CSS-variabelen op `.af`: `--af-accent` / `--af-accent-fg` (knop en avatar),
`--af-paper`, `--af-lijn`, `--af-vlak`, `--af-ink`, `--af-soft`, `--af-radius`,
`--af-hoogte`.

## Toegankelijkheid

- "Kies een moment" is een echte `<button>` met `aria-label="Kies een moment: <titel>"`
  (op mobiel: "… (opent in een nieuw tabblad)"). Enter en Spatie werken; de
  focusring is 2 px.
- Na de klik verdwijnt de knop. De focus gaat direct naar de kop
  "Kies een moment: <titel>" boven de iframe (die is programmatisch focusbaar),
  zodat hij nooit in het niets valt. Tab brengt je dan via de noodlink naar de
  iframe.
- Het scherm is een `role="region"` met naam. Tijdens het laden staat
  `aria-busy="true"`; een `role="status"`-regel meldt "Agenda laden…" en daarna
  "Agenda geladen. Kies een dag en tijd." of, na de time-out, dat het niet lukt
  met de link erbij.
- De iframe heeft een `title` ("Afspraakagenda Calendly: <titel>").
- Zonder JS: de kaart met een gewone link naar de dienst.
- Minder beweging: geen fade en geen draaiende laadring; de agenda staat
  meteen.

## Valkuilen

- **`http://`-URL, onbekende `data-dienst` of ontbrekende `.af__kaart` /
  `[data-af-fallback]`** → console-waarschuwing en overgeslagen; de kaart blijft
  gewoon staan (R5).
- **`data-voorbeeld-src` in productie laten staan** → bezoekers zien een
  nepagenda. Alleen in demo's gebruiken.
- **CSP vergeten** → knop werkt, iframe blijft leeg. Controleer de console op
  "Refused to frame". Zie de tabel hierboven.
- **`vooraf` en privacy**: met `vooraf` is de klik niet meer de trigger; het
  scrollen is dat. Wil je zonder cookiemelding blijven, laat dan `vooraf` uit.
- **Twee facades** op één pagina zijn onafhankelijk; elk laadt zijn eigen iframe.
- **De iframe krijgt geen `sandbox`**: boekingswidgets hebben scripts,
  formulieren, popups (Google/Zoom-login) en same-origin-opslag nodig.

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
