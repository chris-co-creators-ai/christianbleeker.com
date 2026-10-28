# rechtenmatrix

Een matrix die laat zien wie wat mag: links een lijst met rollen of personen,
rechts per categorie de handelingen, elk met een schakelaar van 2 tot 4 standen
("Doet dit zelf", "Vraagt eerst", "Nooit"). Bovenaan staat per rol een
samenvatting ("5 zelf · 2 vraagt eerst · 8 nooit"). Alles komt uit één
JSON-config; er staan geen teksten in de JS.

Twee modi: `toon` (alleen lezen, voor marketing) en `bewerk` (de bezoeker klikt,
bijvoorbeeld om zijn wensen door te geven; de stand gaat als event en als JSON
in een verborgen formulierveld mee).

## Wanneer wel

- Vertrouwen wekken bij AI-diensten: wat doet het systeem zelf, wat vraagt het
  eerst, wat nooit.
- "Wat doen wij, wat doet u" in een dienstverlening (website, boekhouding, onboarding).
- Rollen in een team of rechten per functie.
- Een klant zijn voorkeur laten doorgeven: startpunt kiezen, aanpassen, meesturen.

## Wanneer niet

- Echte toegangsrechten in een applicatie. Dit is voorlichting en invoer; afdwingen
  moet server-side.
- Meer dan 4 standen, of een vrij aan te vinken lijst met opties (gebruik dan
  checkboxes).
- Meer dan ± 8 rollen: de lijst wordt lang. Splits dan per team.

## Installatie

```
component-library/tools/rechtenmatrix/
├── rechtenmatrix-kern.js      # vanilla ES-module, 0 dependencies (import ../../_kwaliteit/basis.js)
├── rechtenmatrix.css     # namespaced op [data-rechtenmatrix] en .rm-*
├── Rechtenmatrix.tsx     # React/Next.js client-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla**

```html
<link rel="stylesheet" href="./rechtenmatrix.css" />
<div id="matrix" data-rechtenmatrix>
  <script type="application/json" data-rm-config>{ …config… }</script>
  <!-- optioneel maar aanbevolen: de tabel voor gebruik zonder JS, zie tabelHtml() -->
</div>
<script type="module">
  import { init } from './rechtenmatrix-kern.js';
  const destroy = init(document.getElementById('matrix'));
  // destroy() bij opruimen
</script>
```

**React / Next.js** (de tabel zonder JS wordt server-side uit dezelfde config gerenderd)

```tsx
import { Rechtenmatrix } from '@/component-library/tools/rechtenmatrix/Rechtenmatrix';
import config from './ai-team.json';

<Rechtenmatrix config={config} onWijziging={(d) => console.log(d.json)} />
```

**WordPress**: zet de CSS en JS in het thema (of via een kleine plugin), print het
root-element met de config in een shortcode en laad `rechtenmatrix-kern.js` als
`type="module"`. Genereer de fallbacktabel in PHP uit dezelfde JSON, of laat
`tabelHtml(config)` er één keer voor draaien in een bouwstap en plak het resultaat
in het root-element.

## Markup-contract

Het root-element heeft `data-rechtenmatrix`. De config komt uit `opties.config` of
uit `<script type="application/json" data-rm-config>` in het root-element. JS voegt
een `.rm-app` toe en zet `data-rm-actief` op het root (dat verbergt de fallbacktabel).
`destroy()` haalt beide weg. In bewerkmodus komt een `<input type="hidden">`
(`data-rm-veld`) in het root; staat er al zo'n input in het root, dan gebruikt de
feature die.

`tabelHtml(config)` (export uit `rechtenmatrix-kern.js`) geeft de `div.rm-fallback` met een
gewone tabel terug: kolommen = rollen, rijen = handelingen gegroepeerd per categorie,
cellen = het label van de stand als tekst. Alle waarden zijn ge-escaped.

### Config

```json
{
  "modus": "toon",
  "veldnaam": "werkverdeling",
  "standaard": "zelf",
  "standen": [
    { "id": "zelf",  "label": "Doet dit zelf", "kort": "zelf", "icoon": "check", "kleur": "#17603b" },
    { "id": "eerst", "label": "Vraagt eerst", "kort": "vraagt eerst", "icoon": "pauze" },
    { "id": "nooit", "label": "Nooit", "kort": "nooit", "icoon": "ban" }
  ],
  "teksten": { "lijstTitel": "Uw AI-team", "samenvattingTitel": "Samenvatting", "alleenLezen": "Alleen lezen",
               "categorieAantal": "{n} handelingen", "groepNaam": "{rol}: {handeling}",
               "melding": "{rol}: {handeling} staat nu op {stand}",
               "tabelTitel": "…", "kolomHandeling": "Handeling" },
  "rollen": [
    { "id": "noor", "naam": "Noor", "functie": "Content", "uitleg": "…", "tint": "#2c5e3f", "foto": "noor.jpg" }
  ],
  "categorieen": [
    { "id": "content", "naam": "Content", "dicht": false,
      "handelingen": [ { "id": "schrijven", "naam": "Concepten schrijven", "uitleg": "…", "standaard": "zelf" } ] }
  ],
  "waarden": { "noor": { "schrijven": "zelf" } }
}
```

- **standen**: 2 tot 4 (meer worden genegeerd). `label` staat op de schakelaar, `kort`
  in de samenvatting. `icoon`: `check`, `pauze`, `ban`, `vraag`, `user`, `users`,
  `samen`, `pen`. `kleur` overschrijft de standaardkleur (donker genoeg voor 4,5:1 op
  de lichte tint).
- **rollen**: `foto` (url), `icoon` of `initialen` voor het plaatje; zonder een van
  drie worden de eerste twee letters van de naam getoond op een tint (`tint`).
- **waarden**: `waarden[rol][handeling] = stand-id`. Ontbreekt een waarde, dan geldt
  `handeling.standaard`, dan `config.standaard`, dan de eerste stand.
- `teksten` bevat alle zichtbare tekst. `{rol}`, `{handeling}`, `{stand}` en `{n}`
  worden ingevuld. Een ontbrekende tekst laat het onderdeel weg.
- Een config zonder 2 standen, rollen of categorieën geeft een waarschuwing en een
  lege `destroy()`; er wordt niet gegooid.

## Opties

| Optie | Standaard | Wat het doet |
|---|---|---|
| `config` | uit `script[data-rm-config]` | De volledige config als object. |
| `modus` | `config.modus`, anders `toon` | `toon` (alleen lezen) of `bewerk`. Overschrijft de config. |

### Events en data (alleen `bewerk`)

Op het root-element, bubbelend: `rechtenmatrix:wijziging` met

```js
e.detail = { rol, handeling, stand, waarden, json }
// waarden = { rolId: { handelingId: standId } }, altijd de héle stand; json = JSON.stringify(waarden)
```

Het verborgen veld (`name` = `config.veldnaam`, standaard `rechtenmatrix`) bevat
dezelfde JSON, vanaf het laden, dus ook zonder één klik komt de beginstand mee met
het formulier. Valideer server-side: de bezoeker kan de waarde aanpassen.

## Toegankelijkheid

- Rollenlijst = `tablist` met `tab`s en één `tabpanel`. Pijltjes, Home en End wisselen
  van rol (de rol wordt direct actief), `aria-selected` en `aria-labelledby` volgen.
- Elke schakelaar is een `radiogroup` met `radio`'s (roving tabindex): één tabstop,
  pijltjes kiezen en verplaatsen de focus, Home/End springen. De naam is
  "rol: handeling" (`groepNaam`) en verandert mee met de rol.
- `toon`: `aria-readonly="true"` op de groep. De schakelaar krijgt gewoon focus
  (schermlezers lezen de stand voor), maar klik, pijl, spatie en Enter doen niets.
- Kleur is nooit het enige signaal: elke stand heeft een icoon én tekst, ook de
  niet-gekozen; de samenvatting heeft icoon + tekst per stand.
- Categorieën zijn een knop met `aria-expanded` en `aria-controls`; Enter en spatie werken.
- Een wijziging wordt via een verborgen `role="status"` voorgelezen (`teksten.melding`).
- Focus: minimaal 2 px outline. Tikdoelen op mobiel minstens 40 px hoog.
- Minder beweging: geen transities en geen animatie; de eindstand staat direct goed.
- Zonder JS: een gewone tabel met de standen als tekst.

## Valkuilen

- De fallbacktabel en de JSON moeten uit één bron komen; genereer de tabel dus met
  `tabelHtml()` in plaats van hem met de hand te typen (anders lopen ze uiteen, R9).
- Tot de module geladen is, ziet de bezoeker de tabel; daarna springt de layout naar
  de schakelaars. Zet bij een grote pagina een `min-height` op het root-element.
- Gebruik unieke `id`'s voor rollen en handelingen, en houd ze stabiel: ze zijn de
  sleutels in de JSON die je opslaat.
- Zeer smalle kolommen: de layout kiest op de breedte van het root-element (container
  query, omslag bij 46 rem), niet op die van het scherm.
- De schakelaar is bewust geen native `<input type="radio">`: alleen-lezen met focus
  kan daarmee niet. Een `<form>`-reset zet dus niets terug; luister zo nodig zelf naar `reset`.

