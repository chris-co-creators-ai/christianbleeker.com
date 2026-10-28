# advies-funnel

De motor achter elke "welk pakket past bij jou"-vragenlijst: een
configurator, een prijscalculator, of een simpele ja/nee-check. Vragen,
advies en de afsluitende call-to-action komen allemaal uit één JSON-config —
geen regel applicatiecode per funnel.

## Wanneer wel

- Een korte vragenlijst (2–6 vragen) die uitmondt in een concreet advies:
  een pakket, een prijsindicatie, een ja/nee-conclusie.
- Situaties waar je meerdere varianten wilt aanbieden zonder telkens nieuwe
  code te schrijven — alleen een nieuw JSON-bestand (zie `configs/`).

## Wanneer niet

- Voor een lang formulier zonder "advies" aan het eind — dat is gewoon een
  formulier, geen funnel (zie `modals/link-dialog-funnel` voor een
  stappen-aanvraagformulier zonder dit soort regel-gebaseerd advies).
- Voor vragenlijsten die serverside logica nodig hebben tussen de stappen
  (bv. een externe risicoscore ophalen per vraag) — deze motor is puur
  client-side en regelt advies via simpele JSON-regels.

## Installatie

```
component-library/tools/advies-funnel/
├── advies-funnel.js        # vanilla ES-module, 0 dependencies
├── advies-funnel.css       # namespaced op .af-*
├── AdviesFunnel.tsx          # React/Next.js client-wrapper
├── configs/
│   ├── website-pakket.json          # configurator, cta: formulier
│   ├── prijscalculator-oppas.json   # prijscalculator, cta: datumtijd
│   └── letselschade-check.json      # ja/nee-check, cta: link
├── demo.html                 # zelfstandige demo met een configkiezer
└── test/meet.mjs             # Playwright-meting
```

**Vanilla / elk framework**

```html
<div id="funnel-root"></div>
<link rel="stylesheet" href="./advies-funnel.css" />
<script type="module">
  import { init } from './advies-funnel.js';
  const config = await fetch('./configs/website-pakket.json').then((r) => r.json());
  const destroy = init(document.getElementById('funnel-root'), config, {
    onSubmit: (data) => console.log('funnel verstuurd', data),
  });
</script>
```

**React / Next.js**

```tsx
import { AdviesFunnel } from '@/component-library/tools/advies-funnel/AdviesFunnel';
import config from './configs/website-pakket.json';

<AdviesFunnel config={config} onSubmit={(data) => console.log(data)} />
```

## Markup-contract

- Root-element: een lege container. De module bouwt alles zelf (fieldset +
  legend per vraag, voortgangsbalk, samenvatting, CTA) — er hoeft vooraf
  niets in te staan.
- Elke vraag wordt een `<fieldset>` met een `<legend>` met een
  `<span class="af-legend-tekst" tabindex="-1">` erin: na elke
  stap gaat de focus daarnaartoe (Firefox kan een legend zelf niet focussen) (nieuwe-stapkop krijgt focus, zie
  Toegankelijkheid).

## De JSON-config

```jsonc
{
  "id": "website-pakket",        // uniek; ook de sleutel voor sessionStorage
  "titel": "…",
  "vragen": [
    {
      "id": "type",
      "vraag": "Wat voor site heb je nodig?",
      "type": "enkel",           // "enkel" (radio) of "meer" (checkbox)
      "opties": [{ "waarde": "landing", "label": "Eén landingspagina" }],
      "optioneel": false,         // true = toont "Overslaan", geen verplichte keuze
      "voorwaarde": {              // optioneel: alleen tonen als dit klopt
        "vraag": "type",
        "waarde": ["meerdere", "webshop"]
      }
    }
  ],
  "advies": [
    { "als": { "type": "webshop" }, "pakket": "…", "prijsIndicatie": "…", "uitleg": "…" },
    { "default": true, "pakket": "…", "prijsIndicatie": "…", "uitleg": "…" }
  ],
  "cta": { "type": "link" | "datumtijd" | "formulier", "…": "…" }
}
```

- **Regel-matching (`als`/`voorwaarde`)**: elke sleutel moet kloppen tegen
  het gegeven antwoord. Een array aan de kant van de config betekent "één
  van deze waarden"; bij een meerkeuze-antwoord (array) wordt gekeken naar
  overlap. De eerste niet-`default`-regel die volledig matcht wint; anders
  de regel met `"default": true`.
- **`cta.type: "link"`**: `{ href, label, heading? }` — een gewone link.
- **`cta.type: "datumtijd"`**: `{ label, heading?, bevestiging? }` — een
  datum- en tijdkiezer (native `<input type="date">` + `<input
  type="time">`), roept `options.onBooking(iso, data)` aan bij bevestigen.
- **`cta.type: "formulier"`**: `{ velden: [{name,type,label,required}],
  verstuur?, bevestiging?, heading? }` — verstuurt de ingevulde velden **plus**
  alle antwoorden en het advies via `options.onSubmit(data)`.

## Opties (`init(root, config, options)`)

| Optie | Omschrijving |
|---|---|
| `onSubmit` | `(data) => void`, aangeroepen bij `cta.type: "formulier"`. `data` bevat de formuliervelden + `antwoorden` + `advies`. |
| `onBooking` | `(iso, data) => void`, aangeroepen bij `cta.type: "datumtijd"`. |

## Gedrag

- **Voortgang**: "Stap x van y" boven elke vraag (verborgen bij 1 vraag).
  `y` is het aantal *actieve* vragen — een voorwaardelijke vraag die
  (nog) niet klopt telt niet mee.
- **Laadscherm**: ná de laatste vraag verschijnt kort "Advies wordt
  berekend…" (800ms, ruim onder de eis van max 1,2s) vóórdat het advies
  verschijnt. Bij `prefers-reduced-motion: reduce` wordt dit scherm
  overgeslagen (0ms) — zie R1.
- **Terug**: blijft altijd de eerder gegeven antwoorden tonen, ook vanuit de
  samenvatting terug naar de laatste vraag.
- **State**: opgeslagen in `sessionStorage` onder `af:<config.id>` bij elke
  wijziging — een pagina-ververs hervat dezelfde funnel op dezelfde stap met
  dezelfde antwoorden. `wisVoortgang(configId, doc)` wist dit expliciet (bv.
  voor een "opnieuw beginnen"-knop).

## Toegankelijkheid

- Elke vraag is een `<fieldset>`/`<legend>`; de tekst-span in de legend krijgt na elke
  stapwissel de focus (`tabindex="-1"` + `.focus()`), zodat een
  schermlezer- of toetsenbordgebruiker meteen weet dat er een nieuwe vraag
  staat.
- Radio's/checkboxen zijn gewone `<input>`-elementen: pijltjestoetsen binnen
  een radiogroep en Spatie/Enter werken zonder extra code (native gedrag).
- Het laadscherm heeft `role="status" aria-live="polite"`; de samenvatting
  gebruikt een `<h2>` als focus-doel.
- Foutmeldingen (verplichte vraag niet beantwoord) krijgen `role="alert"`.

## Valkuilen

- **Config zonder `id`/`vragen`/`advies` crasht niet** — `init()` logt een
  waarschuwing en doet verder niets (zie R5), zodat een lege of kapotte
  config de rest van de pagina niet meesleurt.
- **`sessionStorage` kan corrupt zijn** (handmatig aangepast, oude versie
  van de config). De module vangt een parse-fout op en begint gewoon
  opnieuw — geen crash, wel verlies van de eerdere voortgang in dat geval.
- **Meerdere funnels op één pagina**: geef elke config een uniek `id`, anders
  delen ze dezelfde `sessionStorage`-sleutel en overschrijven ze elkaars
  voortgang.

## Op WordPress

Zelfde patroon als `reveal-on-scroll`: bestanden in het thema, laden via
`wp_enqueue_script_module()`, `init()` na `DOMContentLoaded` met de config
als los JSON-bestand (`fetch()`) of ingebakken via `wp_localize_script`-achtig
patroon (een `<script type="application/json">`-blok dat je zelf uitleest).

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
