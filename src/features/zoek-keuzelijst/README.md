# zoek-keuzelijst

Een doorzoekbare keuzelijst (combobox) bovenop een gewone `<select>`. Zonder
JavaScript blijft het die select; met JavaScript wordt het een invoerveld met
een lijst eronder. De waarde gaat gewoon mee in het formulier via de
oorspronkelijke select.

- zoekt zonder accenten en hoofdletters ("cafe" vindt "Café-eigenaar"), ook op
  synoniemen ("kapper" vindt "Haarstylist")
- groepen (`<optgroup>`), enkele of meervoudige keuze (chips)
- een optie "Staat er niet tussen" met een vrij invulveld
- toetsenbord: pijltjes, Enter, Escape, Home, End; typen springt naar de treffer
- schermlezer: `aria-activedescendant`, `aria-expanded` en de telling
  "12 resultaten" via `aria-live`
- meegeleverd: `beroepen.json`, 151 Nederlandse beroepen en branches voor zzp
  en mkb in 15 groepen, met synoniemen (eigen samenstelling)

## Wanneer wel

- Een lijst met meer dan zo'n 15 opties, waar scrollen door een gewone select
  onhandig is: beroep, branche, gemeente, land, vakgebied.
- Als de bezoeker de naam ongeveer weet ("kapper") maar niet hoe jij het noemt
  ("Haarstylist"): daar helpen de synoniemen.
- Wachtlijsten en intakeformulieren waar je de antwoorden wilt segmenteren op
  een vaste lijst, met een uitweg voor wie er niet tussen staat.

## Wanneer niet

- Minder dan ± 10 opties: een gewone select of radioknoppen zijn sneller.
- Vrije invoer zonder vaste lijst (dan is een gewoon tekstveld beter).
- Zoeken in duizenden records op de server (dan een aparte zoekfunctie met
  `aria-live`-resultaten; deze module filtert wat er al in de pagina staat).

## Installatie

```
component-library/forms/zoek-keuzelijst/
├── zoek-keuzelijst.js      # vanilla ES-module, 0 dependencies
├── zoek-keuzelijst.css     # namespaced op [data-zoek-keuzelijst] en .zk
├── ZoekKeuzelijst.tsx      # React/Next.js client-wrapper
├── beroepen.json           # de meegeleverde lijst (optioneel)
├── demo.html               # zelfstandige demo (wachtlijst Studio Wester)
└── test/meet.mjs           # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./zoek-keuzelijst.css" />

<div data-zoek-keuzelijst>
  <label for="beroep">Wat is je belangrijkste beroep?</label>
  <select id="beroep" name="beroep" required>
    <option value="">Kies of typ je beroep</option>
    <optgroup label="Schoonheid en verzorging">
      <option value="haarstylist" data-synoniemen="kapper, kapster, barber">Haarstylist</option>
    </optgroup>
    <option value="anders" data-anders>Staat er niet tussen</option>
  </select>
</div>

<script type="module">
  import { init } from './zoek-keuzelijst.js';
  const destroy = init(document.querySelector('[data-zoek-keuzelijst]'));
  // destroy() bij opruimen: de gewone select komt terug
</script>
```

**React / Next.js (App Router)**

Render de `<select>` gewoon op de server; de wrapper maakt er client-side een
combobox van.

```tsx
import { ZoekKeuzelijst } from '@/component-library/forms/zoek-keuzelijst/ZoekKeuzelijst';

<ZoekKeuzelijst andersLabel="Wat is je beroep dan?">
  <label htmlFor="beroep">Wat is je belangrijkste beroep?</label>
  <select id="beroep" name="beroep" required>…</select>
</ZoekKeuzelijst>
```

**De meegeleverde beroepenlijst gebruiken**

Server-side (aanbevolen, dan werkt het ook zonder JavaScript): loop over
`beroepen.json` en render `<optgroup>`/`<option>` (met `data-synoniemen`).
Client-side kan het ook, met de hulpfunctie:

```js
import { init, vulSelect } from './zoek-keuzelijst.js';
const data = await (await fetch('./beroepen.json')).json();
vulSelect(select, data, { placeholder: 'Kies of typ je beroep', anders: 'Staat er niet tussen' });
init(select.closest('[data-zoek-keuzelijst]'));
```

Formaat: `{ "groepen": [ { "naam": "…", "beroepen": [ { "naam": "…", "synoniemen": ["…"] } ] } ] }`.

## Op WordPress

Geen build-stap: `zoek-keuzelijst.js` is een kant-en-klare ES-module.

1. Zet de map in je thema (`wp-content/themes/<thema>/component-library/zoek-keuzelijst/`).
2. Laad de css met `wp_enqueue_style()` en de module met
   `wp_enqueue_script_module( 'zoek-keuzelijst', $url, array(), null )` (WordPress 6.5+;
   bewust `null` als versie, zodat de `import` en de enqueue dezelfde URL houden).
3. Zet de markup in een Custom HTML-blok of in je formulierplugin
   (Gravity Forms, Contact Form 7: een select met de klasse of het attribuut
   `data-zoek-keuzelijst` op de omhullende div). De waarde komt gewoon in
   `$_POST['beroep']`, en het vrije veld in `$_POST['beroep_anders']`.
4. Roep `init()` aan na `DOMContentLoaded`. Sluit het script uit van
   JS-combinatie in caching-plugins (WP Rocket, Autoptimize): die breken `type="module"`.

## Markup-contract

- **Root** (`data-zoek-keuzelijst`): een element met daarin de `<select>` en het
  `<label for>`. Krijgt `data-zk-actief` zodra de module draait.
- **`<select>`**: blijft de bron van de waarde. `multiple` geeft meervoudige keuze.
  `required` werkt: de foutmelding verschijnt onder het veld.
- **Lege optie** `<option value="">`: wordt de placeholder en het "niets gekozen".
  Zonder lege optie kiest de browser bij een enkele select vanzelf de eerste optie.
- **`data-synoniemen`** op een `<option>`: kommagescheiden zoektermen.
- **`data-anders`** op een `<option>`: dit is de uitweg. Hij staat altijd onderaan
  de lijst, ook bij zoeken zonder treffers. Bij kiezen verschijnt een tekstveld
  dat als `<selectnaam>_anders` (of `andersNaam`) meegaat; bij een andere keuze
  verdwijnt het en wordt het niet meegestuurd.

## Opties (`init(root, opties)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `placeholder` | tekst van de lege `<option>`, anders "Typ om te zoeken" | Tekst in het lege veld. |
| `andersNaam` | `<selectnaam>_anders` | `name` van het vrije invulveld. |
| `andersLabel` | "Vul zelf in" | Label boven het vrije invulveld. |
| `teksten` | Nederlands | Alle vaste teksten (`resultaten(n)`, `geen`, `verwijder(label)`, `verplicht`, `via(term)` …), bv. voor een Engelse site. |

CSS-variabelen op de root: `--zk-ink`, `--zk-zacht`, `--zk-line`, `--zk-bg`,
`--zk-hover`, `--zk-accent`, `--zk-accent-zacht`, `--zk-fout`, `--zk-radius`,
`--zk-hoogte`.

Events: bij elke keuze krijgt de `<select>` gewoon `input` en `change`, dus
bestaande formulier- en frameworkcode luistert mee.

## Toegankelijkheid

- Patroon: WAI-ARIA "editable combobox with list autocomplete". Het invoerveld
  heeft `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`
  en `aria-activedescendant` naar de actieve optie; de lijst is een `listbox`
  met `option`s en `group`s (`aria-multiselectable` bij meervoudig).
- Toetsen: pijl omlaag opent en beweegt, pijl omhoog beweegt, Home en End springen
  naar eerste en laatste, Enter kiest, Escape sluit en herstelt de tekst,
  Backspace in het lege veld verwijdert bij meervoudig de laatste chip, Tab sluit.
  Enter bij een gesloten lijst verstuurt het formulier gewoon.
- Typen zet de beste treffer meteen actief: typ "tim", druk Enter.
- `aria-live="polite"`: "12 resultaten", "1 resultaat" of "Geen resultaten…".
- De focus blijft altijd in het invoerveld; de opties krijgen nooit zelf focus.
- Chips hebben een knop met de naam "Verwijder <optie>", met 2 px focusrand.
- Minder beweging: de overgangen van lijst, chips en chevron staan dan uit.
- De originele select is `aria-hidden` en uit de tabvolgorde, maar blijft in het formulier.

## Valkuilen

- **`required`**: de browser kan zijn eigen melding niet op een verborgen select
  tonen. De module vangt `invalid` af en toont zelf een melding, met focus in het veld.
  Zet je `novalidate` op het formulier, dan controleer je zelf op de server.
- **Servervalidatie blijft nodig**: een waarde uit de select is niet vertrouwd,
  en `_anders` is vrije tekst (lengte begrensd op 120, escapen bij weergave).
- **Font-grootte**: het veld is minimaal 16 px, anders zoomt iOS Safari bij focus in.
  Maak het niet kleiner.
- **Langere lijsten**: alle opties staan als DOM-elementen in de pagina. Tot
  ± 500 opties voelt dat direct; daarboven beter server-side zoeken.
- **Twee keer `init()` op dezelfde select** doet niets (de tweede aanroep is een no-op).
- **`data-anders` in het midden van de select** wordt in de lijst toch onderaan getoond.
- **Weggaan met een getypte tekst**: staat er precies één optie die (zonder accenten en
  hoofdletters) gelijk is aan wat je typte, dan wordt die gekozen. Anders blijft de tekst staan
  met de hint "Kies een optie uit de lijst…"; er wordt dan niets gekozen of meegestuurd.
- **"Staat er niet tussen"** neemt het getypte woord over in het vrije veld en is
  verplicht als de select `required` is.
- **Touch**: de lijst past zijn hoogte aan het `visualViewport` aan (ruimte boven het
  schermtoetsenbord) en scrolt het veld zo nodig naar boven.
- **Formulier resetten** (`form.reset()`) leegt veld en chips.

