# stappen-persoonlijk

Een aanvraag in drie stappen waarin je eerdere antwoorden terugkomen in de vragen: "Waar wil *Bakkerij De Gouden Korst* naartoe?" en "*Fatima*, wanneer wil je dat het staat?". Stap 2 heeft keuzekaarten met hoekjes, stap 3 een vrij veld, daarna volgt een bedankscherm met tips. Elke stap is een `<fieldset>`, gevalideerd met native `checkValidity`/`reportValidity`, met Nederlandse meldingen.

## Wanneer wel
- Een offerte- of intakeaanvraag waar je eerst contactgegevens wilt, daarna één keuze en één open vraag.
- Als de drempel laag moet blijven: kleine stappen voelen lichter dan één lang formulier.

## Wanneer niet
- Een formulier met meer dan ± 6 velden per stap of voorwaardelijke vertakkingen; gebruik dan `modals/link-dialog-funnel` (aanvraag-popup met voorgekozen keuze) of `tools/advies-funnel`.
- Een enkel postcodeveld: zie `forms/nl-postcode`. Dit onderdeel bouwt dat niet opnieuw.

## Installatie
```
forms/stappen-persoonlijk/
├── stappen-persoonlijk.js   init(root, opties) → destroy(), 0 dependencies
├── stappen-persoonlijk.css  namespaced op [data-sp] en .sp-*
├── StappenPersoonlijk.tsx   React/Next-wrapper
├── demo.html
└── test/meet.mjs            Playwright-meting
```
**Vanilla**
```html
<link rel="stylesheet" href="stappen-persoonlijk.css" />
<script type="module">
  import { init } from './stappen-persoonlijk.js';
  const destroy = init(document.getElementById('aanvraag'), { actie: '/api/aanvraag' });
</script>
```
**React / Next.js**: `<StappenPersoonlijk actie="/api/aanvraag">…fieldsets…</StappenPersoonlijk>`; het bedankscherm zet je naast de component (selector `[data-sp-bedankt]`).

**WordPress**: zet de markup in een Custom HTML-blok, laad de `.css` en de `.js` (type module) in het thema en laat `action` naar je formulierverwerker (bijvoorbeeld admin-post.php) wijzen. Zonder JS blijft het een gewoon formulier.

## Markup-contract
- `<form data-sp action="…" method="post">` met per stap een `<fieldset data-sp-stap>` en daarin `<legend><h2 data-sp-kop>…</h2></legend>`.
- Een kop met `data-sp-sjabloon="Waar wil {bedrijf} naartoe?"` wordt gevuld met de waarde van `name="bedrijf"`; `{voornaam}` is het eerste woord van `name="naam"`. De tekst in de kop zelf is de terugval zonder JS.
- Keuzekaarten: `<label class="sp-kaart"><input type="radio" name="doel" required>…</label>`. Radio's geven een native "kies er één" en pijltoetsen.
- Honeypot: `<div data-sp-val-wrap aria-hidden="true"><input name="website" data-sp-val tabindex="-1" autocomplete="off"></div>`.
- Eén `<button type="submit">` aan het eind; JS verplaatst hem naast Vorige/Volgende.
- Bedankscherm: `<section data-sp-bedankt hidden>` buiten het formulier, met een eigen `[data-sp-kop]` en de tips.
- Velden: een `data-sp-label="je naam"` bepaalt de melding "Vul je naam in."

## Opties
| Optie | Standaard | Betekenis |
|---|---|---|
| `actie` | `form.action` | URL voor de POST (FormData) |
| `duur` | `300` | ms voor het binnenkomen van een stap (schuif 32 px + fade, circ.out) |
| `minimaleTijd` | `1500` | sneller verstuurd dan dit (ms) = bot, geen POST |
| `terugval` | `{bedrijf:'je bedrijf', voornaam:'Hoi'}` | tekst als het veld leeg is |
| `onVerzonden` | geen | callback met de Response na een geslaagde POST |

## Spamval
Zelfde aanpak als `lab/site-basis/src/lib/spamval.ts`: een honeypot plus een minimale invultijd (`geopend` wordt bij het laden meegegeven). Bij spam krijgt de afzender gewoon een bedankscherm, maar er gaat geen POST uit. De server moet de honeypot (`website`) en `geopend` ook nog controleren; dit is een client-net, geen vervanging.

## Toegankelijkheid
- Na een stapwissel gaat de focus naar de kop van de nieuwe stap (`tabindex="-1"`), en een `aria-live="polite"`-regio meldt "Stap 2 van 3".
- Validatie via `setCustomValidity`; `aria-invalid` volgt de staat. De eerste foute veld krijgt de focus via `reportValidity`.
- Enter in een tekstveld werkt als Volgende; de honeypot staat buiten de tabvolgorde.
- Bij `prefers-reduced-motion: reduce` geen animatie: de stap staat direct op zijn plek.
- Velden zijn 16 px, zodat iOS niet inzoomt.

## Valkuilen
- JS zet `novalidate` op het formulier zodat het submit-event ook afgaat met verborgen stappen; zonder JS valideert de browser alles zelf (let op: het veld `pattern` voor de telefoon werkt met de `v`-vlag, dus `\-` en geen losse `(`).
- Het bedankscherm hoort buiten het `<form>`, want het formulier wordt na het versturen verborgen.
- De serif-letter (Instrument Serif, OFL) staat niet in de map; laad hem zelf via Google Fonts of vervang `--sp-serif`. Zonder valt de kop terug op Georgia.
- De demo mockt `/api/aanvraag` zelf; de meting doet het met `page.route`.

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
