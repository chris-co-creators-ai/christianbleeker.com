# Link Dialog Funnel

Onderschept links naar een aanvraagpagina (bv. `/aanvraag` of `?interesse=demo`) en opent in
plaats daarvan een native `<dialog>` met een korte, stapsgewijze aanvraag-funnel waarin de
interesse al is voorgeselecteerd. Zonder JavaScript doet de link gewoon wat een link doet:
navigeren naar de echte aanvraagpagina.

## Wat dit oplost

Een "Aanvraag" of "Vraag een demo aan"-link stuurt bezoekers normaal naar een aparte pagina met
een formulier. Dat kost een paginawissel, en de bezoeker moet zelf opnieuw aangeven waar hij
naar vroeg. Deze component vangt zulke links af, opent een korte funnel ín de huidige pagina
(geen paginawissel, geen contextverlies), en zet de interesse die uit de link blijkt meteen vast
— één stap minder voor de bezoeker.

## Wanneer wel, wanneer niet

**Wel gebruiken** als:
- de site meerdere "Aanvraag voor X"-achtige links heeft die naar dezelfde soort formulier
  leiden, met alleen een andere interesse/context;
- een korte funnel (2-4 velden per stap) volstaat — dit is geen wizard voor lange formulieren
  met bijlages, betalingen of meerdere pagina's aan voorwaarden;
- de aanvraagpagina zelf al bestaat (voor de no-JS-fallback) of gepland is.

**Niet gebruiken** als:
- er maar één simpel contactformulier is zonder interesse-varianten — dan is een gewone modal of
  een losse pagina eenvoudiger en dit overhead niet waard;
- het formulier bestanden moet uploaden, betaling verwerkt, of meer dan een paar stappen nodig
  heeft — bouw dat als eigen pagina, niet als dialoogfunnel.

## Installatie

Geen dependencies. Kopieer `link-dialog-funnel.js` en `link-dialog-funnel.css` naar je project.

```html
<link rel="stylesheet" href="./link-dialog-funnel.css" />
<script type="module">
  import { init } from './link-dialog-funnel.js';
  const destroy = init(document.body, { /* opties, zie hieronder */ });
</script>
```

In React/Next.js (App Router):

```tsx
import { LinkDialogFunnel } from './LinkDialogFunnel';

export default function Layout({ children }) {
  return (
    <LinkDialogFunnel
      interests={[{ id: 'demo', label: 'Een demo' }]}
      onSubmit={async (data) => { await fetch('/api/aanvraag', { method: 'POST', body: JSON.stringify(data) }); }}
    >
      {children}
    </LinkDialogFunnel>
  );
}
```

## Markup-contract

Geen speciale markup nodig op de links zelf. Elke `<a href="...">` waarvan `config.linkMatch(href)`
`true` teruggeeft, wordt onderschept. Standaard matcht dat elke href die `"aanvraag"` of
`"interesse="` bevat — dus zowel `/aanvraag`, `#aanvraag`, `/aanvraag?interesse=demo` als
`/?interesse=demo#aanvraag` werken zonder verdere aanpassing.

De interesse zelf komt uit de querystring-parameter die `interestParam` noemt (standaard
`interesse`): `?interesse=workshop` selecteert de interesse met `id: "workshop"`.

Init scoopt de klik-luisteraar op het element dat je meegeeft als `root` (bv. `document.body`,
of een specifieke `<nav>`). Links buiten die subtree worden niet onderschept.

## Op WordPress

Geen build-stap nodig — `link-dialog-funnel.js` is een kant-en-klare ES-module.

**1. Bestanden plaatsen** — zet de map in je thema (of een eigen plugin):

```
wp-content/themes/<jouw-thema>/component-library/link-dialog-funnel/
├── link-dialog-funnel.css
└── link-dialog-funnel.js
```

**2. Laden als ES-module** — vanaf WordPress 6.5 met `wp_enqueue_script_module()`:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'link-dialog-funnel-style',
		get_stylesheet_directory_uri() . '/component-library/link-dialog-funnel/link-dialog-funnel.css',
		array(),
		'1.0.0'
	);
	wp_enqueue_script_module(
		'link-dialog-funnel-module',
		get_stylesheet_directory_uri() . '/component-library/link-dialog-funnel/link-dialog-funnel.js',
		array(),
		null
	);
} );
```

Bewust **geen** versienummer op de module-enqueue (`null` i.p.v. `'1.0.0'`): WordPress plakt bij een expliciete versie een `?ver=`-parameter achter de URL, terwijl de `import` in stap 4 hieronder dezelfde module zonder die parameter ophaalt — twee verschillende URL's voor de browser, dus twee keer fetchen en evalueren. Met `null` gebruiken beide dezelfde, kale URL en laadt de module maar één keer.

Op WordPress < 6.5 laad je de module via `wp_footer` of een Custom HTML-blok
met `<script type="module">`.

**3. Markup plaatsen** — geen speciale markup nodig (zie § Markup-contract
hierboven): gewone `<a href="...">`-aanvraagknoppen, waar dan ook op de
pagina, in Custom HTML-blokken, gewone Gutenberg-knop-blokken of een
Elementor-knop-widget met die `href`.

**4. `init()` aanroepen** ná `DOMContentLoaded`, met je eigen `onSubmit` die
naar een WordPress-endpoint post (bv. de REST API of `admin-ajax.php`):

```html
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/link-dialog-funnel/link-dialog-funnel.js';
  document.addEventListener('DOMContentLoaded', () => {
    init(document.body, {
      interests: [ /* … zie § Opties … */ ],
      contactFields: [ /* … */ ],
      async onSubmit(data) {
        await fetch('/wp-json/jouw-plugin/v1/aanvraag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': wpApiSettings.nonce },
          body: JSON.stringify(data),
        });
      },
    });
  });
</script>
```

Registreer het REST-endpoint (`register_rest_route`) of een
`admin-ajax.php`-actie zelf server-side — dat hoort niet bij dit onderdeel.

**Valkuilen**

- **Caching-/minify-plugins** (WP Rocket, Autoptimize, W3 Total Cache e.d.)
  bundelen JS standaard tot één niet-module-script, of strippen
  `type="module"` — dat breekt de `import`. Sluit `link-dialog-funnel.js` uit
  van JS-combinatie/-minificatie, of laad het via `wp_enqueue_script_module()`.
- **jQuery-conflicten**: n.v.t. — geen jQuery-afhankelijkheid, en de dialoog
  gebruikt het native `<dialog>`-element in plaats van een jQuery-modal-plugin.
- **`wp_localize_script`/nonces**: voor een REST-call heb je een geldige
  `X-WP-Nonce` nodig — `wp_enqueue_script_module()` ondersteunt
  `wp_localize_script()` niet; print de nonce zelf via een kleine inline
  `<script>` vóór de module (`wp_add_inline_script` werkt ook niet op module-
  scripts), of haal 'm op via een los REST-endpoint dat alleen de nonce
  teruggeeft.
- **Caching van de hele pagina** (WP Rocket/W3TC full-page cache) mag geen
  probleem zijn — de funnel is puur client-side vóór verzending — maar test
  wel of de nonce niet uit een gecachete pagina komt die inmiddels verlopen is.

## Opties (met standaardwaarden)

```js
init(root, {
  // Welke links de dialoog openen.
  linkMatch: (href) => href.includes('aanvraag') || href.includes('interesse='),

  // Querystring-parameter waaruit de voorgeselecteerde interesse komt.
  interestParam: 'interesse',

  // Hash die bij laden/hashchange de dialoog ook opent.
  hashTrigger: '#aanvraag',

  // Naam van het honeypot-veld. Gevuld => stille weigering, geen onSubmit, geen netwerkverkeer.
  honeypotName: '_gotcha',

  // class op het <dialog>-element.
  dialogClass: 'ldf-dialog',

  // De interesses waartussen gekozen kan worden op de eerste stap.
  interests: [
    { id: 'demo', label: 'Een demo' },
    { id: 'prijzen', label: 'Prijzen' },
    { id: 'anders', label: 'Iets anders' },
  ],

  // Interesse-specifieke extra stap vóór het contactblok. Key = interest-id.
  extraSteps: {
    // demo: { heading: '...', fields: [ /* zie "Velden configureren" */ ] },
  },

  // Velden van de (altijd aanwezige, altijd laatste) contactstap.
  contactFields: [
    { name: 'naam', type: 'text', label: 'Naam', required: true, autoComplete: 'name' },
    { name: 'email', type: 'email', label: 'E-mail', required: true, autoComplete: 'email' },
    { name: 'toelichting', type: 'textarea', label: 'Korte toelichting', required: true },
  ],

  // Alle teksten (labels, knoppen, foutmeldingen) — Nederlands, overschrijfbaar per sleutel.
  texts: { heading: 'Aanvraag', next: 'Volgende', back: 'Terug', submit: 'Versturen', /* ... */ },

  // href voor de privacyverklaring-link onder het formulier.
  privacyHref: '/privacy',

  // Actie-URL voor de progressive-enhancement-fallback + fetch-eindpunt zonder eigen onSubmit.
  action: null,

  // Mailadres getoond bij een mislukte verzending (leeg = geen mailto-uitweg).
  supportEmail: '',

  // Toon "Stap X van Y" boven het formulier zodra er meer dan 1 stap is. Standaard aan.
  showStepCount: true,

  // Toon de privacyregel op élke stap i.p.v. alleen de laatste (contact)stap. Standaard uit.
  privacyOnEveryStep: false,

  // async (data) => void | Promise. Krijgt { interesse, ...veldnaam: waarde }.
  onSubmit: null,
});
```

`showStepCount` en `privacyOnEveryStep` (optioneel, standaard `true` resp. `false` — dat is het
bestaande gedrag, dus zonder deze opties verandert er niets). Zet `showStepCount: false,
privacyOnEveryStep: true` voor een funnel zonder stapteller en met de privacyregel op elke stap.

Zie de code van `DEFAULT_TEXTS` in `link-dialog-funnel.js` voor alle tekstsleutels.

## Stappen en velden per interesse configureren

De funnel bouwt de stappenreeks dynamisch op uit drie ingrediënten:

1. **Interesse-stap** (altijd stap 1, tenzij de link al een geldige interesse meegaf — dan wordt
   hij overgeslagen totdat de bezoeker zelf op "Terug" klikt).
2. **Eén optionele extra stap per interesse**, via `extraSteps[interestId]`. Alleen de interesse
   die op dat moment gekozen is, laat zijn extra stap zien.
3. **Contactstap** (altijd de laatste stap). Een veld met `onlyFor: ['workshop']` wordt alleen
   getoond én verplicht wanneer die interesse actief is — zo kun je bv. een datumveld alleen voor
   een workshop-aanvraag tonen.

Een veld-definitie:

```js
{
  name: 'omvang',           // wordt de sleutel in de data die onSubmit ontvangt
  type: 'choice',           // 'text' | 'email' | 'date' | 'textarea' | 'choice'
  label: 'Hoe groot is jullie team?',
  required: true,
  requiredError: 'Kies hoe groot jullie team is.',  // optioneel; anders config.texts.requiredError
  placeholder: '...',       // niet voor 'choice'
  autoComplete: 'name',     // niet voor 'choice'
  onlyFor: ['workshop'],    // alleen in contactFields; weglaten = altijd tonen
  options: [                // alleen voor type 'choice'
    { id: '1-5', label: '1–5 mensen' },
  ],
}
```

`requiredError` (optioneel, per veld): overschrijft de generieke `config.texts.requiredError` met een
veld-specifieke foutmelding ("Kies hoe groot jullie organisatie is." i.p.v. "Dit veld is verplicht.").


## Verzenden aansluiten

Twee manieren, te combineren:

- **`onSubmit(data)`** — je eigen functie (`fetch` naar een eigen endpoint, een server action,
  een tracking-call). Krijgt een plat object: `{ interesse: '<leesbaar label>', naam: '...', ... }`.
  Gooi een `Error` (of laat de promise rejecten) om de foutstatus te tonen; de funnel toont dan
  `errorTitle`/`errorBody` plus (als `supportEmail` gezet is) een mailto-uitweg.
- **`action`** — een URL. Zonder `onSubmit` doet de funnel zelf een `fetch(action, { method:
  'POST', body: new FormData(form) })`. `action` is ook de fallback-`action` van het `<form>`-
  element zelf, voor het geval een consumer-site het formulier ooit server-side wil laten
  posten.

Zonder een van beide blijft de funnel na de laatste stap gewoon de succesmelding tonen zonder
iets te versturen — handig voor demo's, niet voor productie.

## Toegankelijkheid

- Focus gaat bij openen naar het eerste veld van de actieve stap, en bij sluiten (Esc,
  backdropklik, kruisje) terug naar het element dat de dialoog opende.
- Elk veld met een fout krijgt `aria-invalid="true"` en `aria-describedby` gekoppeld aan de
  zichtbare foutmelding; die koppeling verdwijnt zodra de fout is opgelost.
- De voortgang (`Stap 2 van 3`) staat in een `aria-label` op de puntjes-indicator.
- De bevestiging (`role="status" aria-live="polite"`) en de foutmelding (`role="alert"
  aria-live="assertive"`) worden aangekondigd door schermlezers zodra ze verschijnen.
- Alle interactieve elementen zijn met het toetsenbord te bereiken; Escape sluit de dialoog zoals
  bij elk native `<dialog>`-element.

## Browserondersteuning

Draait op alles met native `<dialog>` + `showModal()` (alle actuele browsers; Safari sinds 15.4).
Geen polyfill inbegrepen — voor oudere browsers valt de site terug op gewone paginanavigatie,
wat hier toevallig ook meteen de no-JS-fallback is.

## Valkuilen

- **De demo-pagina heeft geen echte `/aanvraag`-pagina.** In een echt project moet die URL
  bestaan, anders werkt de no-JS-fallback (en een gedeelde link, of een zoekmachine die erop
  uitkomt) niet.
- **Backdropklik werkt via `event.target === dialogEl`**, niet via een eigen overlay-`<div>`.
  Zet geen eigen volledige-viewport-laag óver de dialoog heen — dat blokkeert klikken op de
  dialoog zelf (zie de bevinding "een dialoog onder zijn eigen waas" in het projectgeheugen).
- **De bron voegt naast de honeypot ook een tijdval toe** (verzenden binnen anderhalve seconde na
  laden telt ook als bot). Deze implementatie neemt dat bewust niet over: het maakt geautomatiseerd
  testen onnodig broos (een test die snel door de stappen klikt, zou zelf als bot geteld worden)
  terwijl de honeypot alleen al de meeste geautomatiseerde formulier-bots tegenhoudt. Wil je de
  tijdval alsnog, voeg hem toe in je eigen `onSubmit`.
- **`extraStepsIfNeeded` her-bouwt de extra stap alleen als de interesse wijzigt**, niet bij elke
  render. Verander je `extraSteps`/`contactFields` runtime na `init()`, roep dan `destroy()` en
  `init()` opnieuw aan — de module leest zijn configuratie maar één keer in.
- **Eén `<dialog>` per `root`.** `init()` is idempotent: een tweede aanroep op dezelfde `root`
  breekt eerst de vorige instance af. Twee verschillende `root`-elementen geven wel twee losse
  dialogen.

