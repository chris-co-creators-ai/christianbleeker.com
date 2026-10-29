# eigen-naam-preview

Een veld "Bekijk het met je eigen naam" onder een productvoorbeeld. Wat de bezoeker typt, verschijnt
live overal waar de pagina dat vraagt: als domein (`wiki.bakkerijgroot.nl`, via
`typography/domein-wissel`, als golf over alle adressen), als werkruimtenaam ("Bakkerij Groot") en als
initiaal ("B"). Leeg veld = alles terug naar de standaard. De naam blijft in dit tabblad
(sessionStorage) en gaat nergens heen.

## Wanneer wel
- Onder `portfolio/app-tour-venster` of een andere mock-up waarin de klantnaam terugkomt.
- Personalisatie zonder login: "zo ziet het eruit voor jouw bedrijf".

## Wanneer niet
- Als de naam echt ergens heen moet (offerte, account): dan is het een formulier met een
  verwerkingsgrondslag, niet dit.
- Voor persoonsnamen in gevoelige context: de naam staat (kort) in sessionStorage.

## Installatie
```
forms/eigen-naam-preview/
├── eigen-naam-preview.js     vanilla ES-module (alleen ../../_kwaliteit/basis.js)
├── eigen-naam-preview.css    namespaced op .enp / .enp__*
├── domein-wissel-kopie.js/.css   byte-gelijke kopie van typography/domein-wissel
├── EigenNaamPreview.tsx      React/Next client-wrapper
├── demo.html                 het app-tour-venster met dit veld eronder
└── test/meet.mjs             Playwright-meting
```
De map is zelfstandig: domeinen wisselen via `domein-wissel-kopie.js/.css`, een byte-gelijke kopie van
`typography/domein-wissel` (`test/meet.mjs` faalt als ze afwijken). Kopieer alleen `_kwaliteit/basis.js` mee.
Staan er al domeinen van een ander onderdeel (met `data-dw`), dan praat dit veld met die instantie via
het `domeinwissel`-event; twee kopieën van de module op één pagina werken dus samen.

**Vanilla**
```html
<link rel="stylesheet" href="./domein-wissel-kopie.css" />
<link rel="stylesheet" href="./eigen-naam-preview.css" />

<code data-eigen-naam="domein" data-eigen-naam-sjabloon="wiki.{slug}.nl">wiki.wester.nl</code>
<strong data-eigen-naam="werkruimte">Studio Wester</strong>
<span data-eigen-naam="initiaal">W</span>

<div class="enp" data-eigen-naam-veld>
  <div class="enp__rij">
    <label class="enp__label" for="enp-naam">Bekijk het met je eigen naam</label>
    <div class="enp__veld">
      <input id="enp-naam" class="enp__invoer" type="text" autocomplete="organization" spellcheck="false"
             maxlength="40" placeholder="Bijvoorbeeld Bakkerij Groot" aria-describedby="enp-uitleg" />
      <button type="button" class="enp__wis" data-enp-wis hidden aria-label="Naam wissen">×</button>
    </div>
  </div>
  <p class="enp__uitleg" id="enp-uitleg">Je naam blijft in dit tabblad en verdwijnt als je het sluit.</p>
</div>
<script type="module">
  import { init } from './eigen-naam-preview.js';
  const destroy = init(document.querySelector('[data-eigen-naam-veld]'));
</script>
```
Zet `init()` ná de onderdelen die zelf een plek beheren (zoals het app-tour-venster): dan luisteren zij
al als een bewaarde naam uit de sessie wordt teruggezet.

**React / Next.js**
```tsx
<AppTourVenster apps={APPS} slug="wester" />
<EigenNaamPreview />            {/* na de tour: React draait effecten van broers in volgorde */}
```

**WordPress**
Zelfde mappen en paden in je thema; `wp_enqueue_style()` voor beide CSS-bestanden en
`wp_enqueue_script_module()` voor de JS (WP 6.5+). Markup in een Custom HTML-blok.

## Markup-contract
- Root (bv. `.enp`) met een `<input>` en optioneel `[data-enp-wis]` (wisknop, start `hidden`).
- Plekken, waar dan ook in `doel` (standaard de hele pagina):
  - `[data-eigen-naam="domein"]` met `data-eigen-naam-sjabloon` (bv. `wiki.{slug}.nl`,
    `beheer@{slug}.nl`). Wordt een `domein-wissel`; meerdere domeinen wisselen als golf
    (0,05 s per plek, in DOM-volgorde).
  - `[data-eigen-naam="werkruimte"]`: de naam zoals getypt (spaties samengevoegd, max. 40 tekens).
  - `[data-eigen-naam="initiaal"]`: de eerste letter of cijfer, als hoofdletter.
- De tekst die er bij `init()` staat, is de standaard (terug bij een leeg veld en bij `destroy()`).
- De module voegt een `.enp__status` (`aria-live="polite"`) toe aan de root.
- **Plekken die een ander onderdeel beheert:** elke plek krijgt eerst het event `eigennaam`
  (`cancelable`, detail `{ naam, slug, initiaal, leeg, index, direct }`). Roept een listener
  `preventDefault()` aan, dan laat dit onderdeel die plek met rust. Zo doet de adresbalk van
  `portfolio/app-tour-venster` het: die wisselt per app zelf en gebruikt de slug.

**Slug-regels** (`maakSlug(naam, max)`, ook los te importeren): Unicode-normalisatie (NFKD) en
accenten weg (`Café Ölmann` → `cafeolmann`, `Ĳ` → `ij`, `ß` → `ss`, `ø` → `o`), kleine letters,
alles behalve `a-z`, `0-9` en `-` weg (dus ook spaties en `&`), dubbele koppeltekens samen, geen
koppelteken aan begin of eind, max. 24 tekens. Blijft er niets over (`!!!`), dan telt het als leeg.

## Opties
| Optie | Standaard | Wat |
|---|---|---|
| `doel` | `document` | Element, document of selector waarin de plekken staan. |
| `sleutel` | `"eigen-naam"` | Sleutel in sessionStorage. |
| `max` | `24` | Maximale lengte van de slug. |
| `wacht` | `220` | Milliseconden stilte na typen voordat de plekken wisselen (geen gefladder per toets). |
| `teksten` | `TEKSTEN` (Nederlands) | Meldingen in de live-regio: `bijgewerkt` (`Voorbeeld bijgewerkt voor {naam}, met domeinen op {slug}.nl.`) en `standaard` (`Voorbeeld staat weer op de standaardnaam.`). `{naam}` en `{slug}` worden ingevuld. |

De React-wrapper heeft daarnaast `label`, `placeholder` en `uitleg` (de zin over opslag) als props, en `teksten` met ook `wis` (aria-label van de wisknop, standaard `Naam wissen`). Engels: `label="See it with your own name"`, `uitleg="Your name stays in this tab and disappears when you close it. Nothing is sent to a server."`, `teksten={{ bijgewerkt: 'Example updated for {naam}, with domains on {slug}.com.', standaard: 'Example is back on the default name.', wis: 'Clear name' }}`.

## Toegankelijkheid
- Echt `<label for>`, uitleg via `aria-describedby`, invoer 16 px (iOS zoomt niet in) en 46 px hoog.
- **Schermlezer:** één melding in een `aria-live="polite"`-regio, 0,5 s nadat de plekken zijn
  gewisseld: "Voorbeeld bijgewerkt voor Bakkerij Groot, met domeinen op bakkerijgroot.nl." Bij het
  terugzetten uit de sessie geen melding. De domeinen zelf geven schermlezers alleen hun eindtekst.
- **Toetsenbord:** Escape wist het veld; de wisknop ("Naam wissen") zet de focus terug in het veld.
  Enter verstuurt niets, ook niet als het veld in een `<form>` staat.
- **Minder beweging en bewegingspauze:** domeinen wisselen met een crossfade van 0,15 s, de
  werkruimtenaam zonder animatie.
- **Contrast:** label, invoer, placeholder en uitleg ≥ 4,5:1 in licht en donker; de rand van het veld
  (`--line-strong`) ≥ 3:1 (bediening, WCAG 1.4.11). Gemeten in `test/meet.mjs`.
- **Zonder JS (R4):** het veld staat er, de pagina toont de standaardnaam.

## Privacy en opslag
- Alleen `sessionStorage`, via `veiligeOpslag('session')` uit `basis.js`: weg als het tabblad sluit,
  geen cookie, geen netwerkverzoek. Is opslag geblokkeerd (privévenster, cookies uit), dan werkt het
  voorbeeld gewoon, alleen zonder onthouden (getoetst).
- Zeg dat ook onder het veld, in je eigen woorden. Beloof niets wat niet klopt: "blijft in dit
  tabblad" is precies wat sessionStorage doet.

## Valkuilen
- **Sjabloon vergeten** op een `domein`-plek: dan blijft die plek op de standaardtekst staan.
- **Volgorde van init:** eerst het onderdeel dat een plek beheert, dan dit veld (zie boven).
- **Lange namen:** de slug stopt op 24 tekens, ook midden in een woord
  (`installatiebedrijfhoogev`). De werkruimtenaam wordt in de mock-up met een ellips afgekapt.
- **Initiaal bij een cijfer:** "3D Print Lab" geeft "3". Dat is bedoeld.
- **Kopie bijwerken:** pas je `typography/domein-wissel` aan, kopieer de `.js` en `.css` opnieuw naar
  `domein-wissel-kopie.*` hier én in `portfolio/app-tour-venster`.

## Herkomst
eu-hosted.com, het veld onder het productvenster op de homepage (gemeten 28-10-2026,
eigen meting). Daar: slug met koppeltekens, opgeslagen als
`eh-domain-name` in sessionStorage, werkruimtenaam in de nep-apps niet overal mee. Wat wij beter doen:
- Elke soort plek doet mee (domein, werkruimte, initiaal), ook buiten het venster, via één attribuut.
- Domeinen wisselen als golf met onze `domein-wissel`, alleen het deel dat verschilt.
- Een wachttijd na typen, een wisknop, Escape, en één rustige melding voor schermlezers.
- Andere onderdelen kunnen een plek zelf beheren via het `eigennaam`-event (cancelable).
- Opslag die nooit gooit, en een eerlijke zin over waar de naam blijft (eigen tekst).
