# boekingsvelden

Een compact boekingsblok voor in een hero of als balk. De bezoeker kiest
aankomst, vertrek en gasten (`verblijf`) of datum, tijd en personen (`tafel`),
en gaat met die keuze al ingevuld door naar jouw boekings- of
reserveringsmodule: Mews, Zenchef, Formitable, TheFork, Resengo/Lightspeed of
elke dienst met een URL-sjabloon. Zonder JavaScript is het een gewone link
"Boek direct".

Het onderdeel boekt zelf niets en meet zelf niets. Het bouwt een URL, opent
hem waar jij wilt en meldt dat met een event.

## Wanneer wel

- Een hotel, B&B, camping of vakantiehuis met een externe boekingsmotor: de
  datumvelden staan op de eigen pagina, de motor doet de rest.
- Een restaurant met Zenchef, Formitable, TheFork of Resengo: "vier personen,
  vrijdag 20:30" op de homepage in plaats van een knop "Reserveren".
- Als je de keuze van de bezoeker wilt laten meetellen in je eigen analytics
  (het event).

## Wanneer niet

- Je hebt zelf de beschikbaarheid: dan bouw je een echt formulier met een
  eigen backend. Dit onderdeel weet niets van kamers of tafels.
- De dienst heeft geen URL waarmee je waarden kunt meegeven en ook geen
  JavaScript-widget (dan wordt het een link zonder waarden; gebruik dan liever
  alleen een knop).
- Betalen of gegevens invullen op jouw pagina: dat gebeurt altijd bij de dienst.

## Installatie

```
component-library/tools/boekingsvelden/
├── boekingsvelden-kern.js      vanilla ES-module, 0 dependencies
├── boekingsvelden.css     namespaced op .bv
├── Boekingsvelden.tsx     React/Next.js client-wrapper
├── assets/voorbeeld-boeking.html   eigen nepdienst, alleen voor de demo
├── demo.html              Hotel De Wadloper en Bistro Wadloper (verzonnen)
└── test/meet.mjs          Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./boekingsvelden.css" />

<div class="bv" data-boekingsvelden data-modus="verblijf" data-dienst="mews" data-doel="nieuw" data-taal="nl-NL"
     data-url="https://app.mews.com/distributor/JOUW-ID">
  <a class="bv__fallback" data-bv-fallback href="https://app.mews.com/distributor/JOUW-ID">Boek direct</a>
</div>

<script type="module">
  import { init } from './boekingsvelden-kern.js';
  const destroy = init(document.querySelector('[data-boekingsvelden]'));
</script>
```

**React / Next.js (App Router)**

```tsx
import { Boekingsvelden } from '@/component-library/tools/boekingsvelden/Boekingsvelden';

<Boekingsvelden
  dienst="mews"
  url="https://app.mews.com/distributor/JOUW-ID"
  taal="nl-NL"
  doel="nieuw"
  onVerstuurd={(d) => window.plausible?.('boeking-gestart', { props: { dienst: d.dienst } })}
/>
```

**WordPress**: CSS enqueuen, `boekingsvelden-kern.js` als module laden
(`wp_enqueue_script_module()`, zie `scroll/reveal-on-scroll`), de markup in een
Custom HTML-blok. Sluit het bestand uit van JS-combineerplugins (die strippen
`type="module"`).

## Markup-contract

Attributen op `[data-boekingsvelden]` (of dezelfde namen als optie in
`init(root, opties)`; een optie wint van het attribuut):

| Attribuut | Optie | Standaard | Betekenis |
|---|---|---|---|
| `data-modus` | `modus` | `verblijf` | `verblijf` of `tafel`. |
| `data-dienst` | `dienst` | `generiek` | `mews`, `zenchef`, `formitable`, `thefork`, `resengo`, `lightspeed`, `generiek` (alias `booking`). |
| `data-url` | `url` | `href` van de link | De boekingsmodule zonder waarden. Relatief of `https:`. |
| `data-doel` | `doel` | `nieuw` | `zelfde` (hetzelfde tabblad), `nieuw` (nieuw tabblad) of `dialoog` (iframe). |
| `data-iframe="ja"` | `iframe` | per adapter: nee | Zet `dialoog` echt aan. Zie "Dialoog" hieronder. |
| `data-kinderen` | `kinderen` | uit | Extra veld Kinderen; "Gasten" heet dan "Volwassenen". |
| `data-kamers` | `kamers` | uit | Extra veld Kamers. |
| `data-ticket` | `ticket` | - | Formitable: id van het ticket dat opent. |
| `data-sjabloon` | `sjabloon` | - | Volledige URL met placeholders, zie hieronder. |
| `data-taal` | `taal` | - | Doorgegeven aan Mews (`nl-NL`) en Formitable (`nl`). |
| `data-max-gasten` | `maxGasten` | 8 (verblijf) / 12 (tafel) | Hoogste keuze in het aantal-veld. |
| - | `labels` | NL | Alle teksten overschrijven (voor EN/DE). Sleutels staan bovenin `boekingsvelden-kern.js`. |
| - | `adapters` | - | Eigen of overschreven adapters, zie "Adapter toevoegen". |
| - | `nu` | `new Date()` | Functie die de klok levert (alleen voor tests). |

Binnenin: één `a[data-bv-fallback]`. Dat is de link die zonder JS werkt; met
JS verdwijnt hij en komt het formulier ervoor. Bij een dialoog gebruikt
`data-titel` op die link als kop van de dialoog.

`destroy()` haalt het formulier en de dialoog weg, haalt alle listeners weg en
zet de root terug zoals hij was. Twee keer aanroepen mag. Een tweede `init`
op dezelfde root doet niets.

## Adapters: welke parameters gaan er mee

| Dienst | Modus | URL die we bouwen | Status |
|---|---|---|---|
| **Mews** | verblijf | `https://app.mews.com/distributor/<id>?mewsStart=JJJJ-MM-DD&mewsEnd=JJJJ-MM-DD&mewsAdultCount=N[&mewsChildCount=N][&language=nl-NL]` | Parameters staan in de Mews-documentatie (Booking Engine, Standalone, Deeplinks). **Niet tegen een echte Mews-omgeving gemeten.** |
| **Zenchef** | tafel | `https://bookings.zenchef.com/results?rid=<id>&pax=N&day=JJJJ-MM-DD` | `rid`, `pax`, `day` volgens het voorbeeld van Zenchef. **Tijd wordt niet doorgegeven**: een parameter daarvoor vonden we niet. Niet tegen Zenchef gemeten. |
| **Formitable** | tafel | `<jouw restaurantpagina>?ft-ticket=<id>&ft-date=JJJJ-MM-DD&ft-time=UUMM&ft-partysize=N[&ft-language=nl]` | Volgens het Formitable-helpcentrum (widget-deeplinks). Werkt alleen op de pagina waar de Formitable-widget staat, dus `data-url` is jouw eigen site. Zonder `data-ticket` opent de widget zonder gekozen ticket. Niet tegen Formitable gemeten. |
| **TheFork** | tafel | `<restaurant-URL>?date=JJJJ-MM-DD&hour=<minuten>&partySize=N` | De namen `date`, `hour` (minuten sinds middernacht, 20:30 = 1230) en `partySize` komen uit de TheFork-zoek-URL. **Op een restaurantpagina ONGETEST**: het kan zijn dat TheFork ze daar negeert. Controleer met je eigen restaurant, of gebruik `data-sjabloon`. |
| **Resengo** / **Lightspeed** | beide | alleen via `data-sjabloon` | **Geen openbare deeplink-parameters gevonden.** Haal het formaat uit je eigen account of bij de dienst. Zonder sjabloon krijg je de gewone link zonder waarden (met een console-waarschuwing). |
| **Generiek** (`booking`) | beide | verblijf: `?checkin=&checkout=&group_adults=&group_children=&no_rooms=`, tafel: `?datum=&tijd=&personen=` | De verblijfsnamen zijn die van Booking.com-achtige zoekpagina's. Voor elke andere dienst: gebruik `data-sjabloon`. Niet tegen een echte dienst gemeten. |

Alle diensten zijn alleen tegen onze eigen nepdienst (`assets/voorbeeld-boeking.html`)
gemeten: de meting bewijst dat de URL precies zo wordt opgebouwd als hierboven,
niet dat de dienst hem accepteert. Test elke adapter met een echte proefboeking
vóór livegang.

**Sjabloon.** Een volledige URL met placeholders; ze worden URL-gecodeerd
ingevuld en onbekende placeholders worden leeg:

`{aankomst} {vertrek} {nachten} {gasten} {kinderen} {kamers}` (verblijf),
`{datum} {tijd} {tijd_hhmm} {tijd_min} {personen}` (tafel).

```html
data-sjabloon="https://boek.example.nl/zoek?van={aankomst}&tot={vertrek}&volw={gasten}"
```

**Adapter toevoegen.** Een adapter is een object; hij krijgt de basis-URL als
`URL`-object, de waarden en de opties:

```js
init(root, {
  adapters: {
    smoobu: {
      label: 'Smoobu', modi: ['verblijf'], iframe: false,
      bouw: (u, w) => { u.searchParams.set('arrival', w.aankomst); u.searchParams.set('departure', w.vertrek); return u; },
    },
  },
  dienst: 'smoobu',
});
```

## Datums en tijd

- De minimumdatum is **vandaag in Nederland** (`nlTijd()`, `Europe/Amsterdam`),
  niet de datum op de klok van de bezoeker. Gemeten met een browser in Los
  Angeles: om 00:30 Nederlandse tijd is het daar nog de vorige dag, en het
  minimum staat toch goed.
- Blijft de pagina open over middernacht, dan gaat het minimum vanzelf
  mee (een timer op Nederlandse middernacht, plus een controle bij focus en bij
  terugkeer naar het tabblad). Wordt daarbij een datum bijgetrokken, dan staat er
  een melding in een `aria-live="polite"`-regio: "Aankomst is aangepast naar
  vandaag." (tafel: "Datum is aangepast naar vandaag."). Springt de klok toch
  ongemerkt (een slapende laptop) en klikt de bezoeker op verstuur, dan wordt er
  niets verstuurd: de datum wordt bijgetrokken, de melding verschijnt en de
  tweede klik verstuurt.
- **Eén regel voor knop en Enter:** na elke bijgetrokken datum verstuurt de
  eerstvolgende klik of Enter niets (ook als de correctie al bij het verlaten
  van het veld gebeurde); de melding staat er dan en de volgende klik of Enter
  verstuurt. Zodra de bezoeker zelf iets wijzigt, telt de melding als gezien en
  verstuurt de eerstvolgende actie direct.
- **Typen met het toetsenbord** werkt zoals in een gewoon datumveld: het veld
  waarin je typt wordt nooit herschreven, ook niet als er even een halve datum
  in staat (voor de browser is `05-01-2026` al geldig terwijl je nog bij de
  maand bent). Bijtrekken (verleden, vertrek na aankomst) gebeurt pas als je het
  veld verlaat en bij het versturen. Het vertrek schuift wel al mee terwijl je
  de aankomst typt.
- **Vertrek** ligt altijd na aankomst. Verzet je de aankomst, dan schuift het
  vertrek mee met behoud van het aantal nachten; kies je een vertrek op of voor
  de aankomst, dan wordt het +1 nacht. Datums in het verleden worden vandaag.
- Het aantal nachten staat bij het vertrekveld ("1 nacht", "3 nachten") en is
  een `<output>` met `aria-live="polite"`.
- Het formaat is overal `JJJJ-MM-DD` en `UU:MM`, ongeacht hoe de browser de
  datum toont.

## Event

```js
document.addEventListener('boekingsvelden:verstuurd', (e) => {
  // e.detail = { modus, dienst, url, doel, gevraagdDoel, waarden }
  // waarden (verblijf) = { modus, aankomst, vertrek, nachten, gasten, kinderen?, kamers? }
  // waarden (tafel)    = { modus, datum, tijd, personen }
});
```

Het event borrelt op vanaf de root en gaat af vóór de navigatie, zodat een
handler in hetzelfde tabblad nog draait. `doel` is wat er echt gebeurde,
`gevraagdDoel` wat je instelde (een dialoog kan een nieuw tabblad worden).
Het onderdeel stuurt niets zelf door: koppel het aan je eigen meting.

## Dialoog

`data-doel="dialoog"` opent de module in een `<dialog>` met een iframe. Dat mag
alleen als de dienst inbedden toestaat, en dat weten we van geen enkele dienst
zeker: **alle adapters staan standaard op "iframe niet toegestaan"**, en dan
opent `dialoog` een nieuw tabblad (het event zegt dat). Heb je zelf gemeten dat
je dienst inbedden toelaat, zet dan `data-iframe="ja"` (of `iframe: true`). De
demo doet dat voor de nepdienst.

Voor een iframe moet je CSP het domein van de dienst toelaten. In
`lab/site-basis` zet je dat in `cspExtra` in `next.config.ts`:

```ts
const cspExtra: CspBronnen = { 'frame-src': ['https://app.mews.com'] };
```

| Dienst | `frame-src` |
|---|---|
| Mews | `https://app.mews.com` |
| Zenchef | `https://bookings.zenchef.com` |
| Formitable | `https://reservations.formitable.com` (controleer in je widget-code) |
| TheFork | `https://www.thefork.nl` (controleer; TheFork kan inbedden weigeren) |
| Resengo / Lightspeed | het domein uit je eigen boekingslink |

Voor "hetzelfde tabblad" en "nieuw tabblad" is er geen CSP-regel nodig: het is
een gewone navigatie. Mews' eigen `distributor.js`-overlay gebruiken we niet:
die vraagt `script-src` en `frame-src` en zet cookies zodra hij laadt. Een
deeplink laadt niets voordat de bezoeker klikt.

De iframe heeft geen `sandbox` (boekingsmodules hebben scripts, formulieren en
opslag nodig) en `referrerpolicy="strict-origin-when-cross-origin"`.

## Toegankelijkheid

- Elk veld is een native `<input type="date|time">` of `<select>` met een echt
  `<label for>`. Op telefoon opent daardoor de eigen datum- en tijdkiezer van
  het toestel. Alle velden zijn minstens 16 px, dus iOS zoomt niet in.
- Tab loopt door alle velden naar de knop; Enter op een veld of de knop
  verstuurt. Focusring 2 px, ook op de knop.
- Het formulier heeft een `aria-label` ("Boeking"). Het aantal nachten wordt
  aangekondigd via `aria-live="polite"`.
- De dialoog is een modale `<dialog>`: Escape sluit zolang de focus in onze
  eigen dialoog staat, en na sluiten staat de focus weer op de knop waarmee hij
  openging. Er zijn twee sluitknoppen die met het toetsenbord bereikbaar zijn:
  de X bovenin (Shift+Tab vanuit de module) en "Sluiten" onderin (Tab vanuit de
  module). Klikken op de achtergrond sluit ook. De iframe heeft een `title`, en
  onderin staat een link naar een nieuw tabblad voor als het inbedden niet lukt.
- **Escape met de focus in de boekingsmodule (iframe) is niet te onderscheppen**
  als de module van een ander domein is: de toetsaanslag gaat naar de iframe en
  de pagina krijgt hem niet te zien. Alleen bij een iframe van hetzelfde domein
  (zoals de demo) sluiten we op Escape. Beloof bezoekers dus geen Escape; de
  sluitknoppen zijn het vangnet.
- Minder beweging: de dialoog verschijnt zonder animatie. Anders alleen een
  korte fade en schaal (200 ms). De knop schaalt kort bij indrukken.
- Zonder JS: de link `a[data-bv-fallback]`, gewoon zichtbaar als knop.

## Valkuilen

- **Parameters die een dienst niet kent worden stilletjes genegeerd.** De
  bezoeker komt dan aan met een leeg formulier. Test elke adapter met een echte
  boeking (zie de tabel: niets is tegen een echte dienst gemeten).
- **Mews-ID**: neem het ID uit je Mews Commander (Booking Engine, Deeplinks),
  niet dat van de `distributor.js`-widget: dat zijn "configuration IDs". Het
  originele derousch.nl-script gebruikt zulke IDs met de JavaScript-widget.
  Wij bouwen de datum als tekst (`JJJJ-MM-DD`) en rekenen niet met `Date`-maanden of
  tijdzones.
- **Popupblokkers**: een nieuw tabblad opent binnen het versturen van het
  formulier (een klik van de bezoeker), dus dat mag. Roep `submit` nooit met een
  timer of na een `await` aan.
- **Zenchef en tijd**: de tijd wordt niet doorgegeven; de bezoeker kiest die op
  de Zenchef-pagina. Heb je de parameter gevonden, voeg dan een eigen adapter
  toe.
- **Tafel op vandaag**: het tijdveld weet niet of 19:00 al voorbij is. De dienst
  zelf toont alleen de vrije tijden.
- **De CSP vergeten** bij `doel="dialoog"`: de dialoog opent, de iframe blijft
  leeg ("Refused to frame" in de console).
- **Datumformaat**: de browser toont de datum in de taal van het toestel; de
  URL krijgt altijd `JJJJ-MM-DD`. Wil je een ander formaat, dan is `data-sjabloon`
  niet genoeg: schrijf een eigen adapter.
- **Twee blokken** op één pagina zijn onafhankelijk (eigen id's voor de labels).

