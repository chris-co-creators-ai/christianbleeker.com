# app-tour-venster

Een browservenster dat je product laat zien in plaats van beschrijft. Bovenin drie lichtjes en een
adresbalk waarin alleen het subdomein wisselt (`wiki.wester.nl` → `projecten.wester.nl`, via
`typography/domein-wissel`). Links een rail met app-tabs en een markering die meeglijdt. Per tab een
nep-app met een klein verhaal: balken lopen vol, een kaart wordt opgetild en verhuist naar "klaar",
een wachtwoord gaat open, iemand typt en een bericht komt binnen. Het venster schuift vanzelf door
(standaard elke 5 s); een dunne lijn onder de adresbalk laat zien wanneer.

## Wanneer wel
- Hero of productsectie van een SaaS, app of platform met 3–5 onderdelen die je wilt laten zien.
- Als het product "op jouw naam" draait (eigen domein, eigen werkruimte): combineer met
  `forms/eigen-naam-preview`.

## Wanneer niet
- Echte schermafbeeldingen of video die je al hebt: dan is `portfolio/device-mockup` of een
  `media/video-facade` eerlijker en sneller.
- Meer dan 5 apps: de rail wordt een menu, de rondleiding te lang.
- Als het venster echte, bedienbare software moet zijn: dit is een voorbeeld (alles `aria-hidden`).

## Installatie
```
portfolio/app-tour-venster/
├── app-tour-venster.js    vanilla ES-module (alleen ../../_kwaliteit/basis.js)
├── app-tour-venster.css   namespaced op .atv / .atv__* / .atv-*
├── domein-wissel-kopie.js/.css   byte-gelijke kopie van typography/domein-wissel
├── AppTourVenster.tsx     React/Next client-wrapper
├── demo.html              Wolkhaven bij Studio Wester, met het eu-hosted-palet
└── test/meet.mjs          Playwright-meting
```
De map is zelfstandig: de adresbalk gebruikt `domein-wissel-kopie.js/.css`, een byte-gelijke kopie
van `typography/domein-wissel` (`test/meet.mjs` faalt als ze afwijken). Kopieer alleen
`_kwaliteit/basis.js` mee.

**Vanilla**
```html
<link rel="stylesheet" href="../../_paletten/eu-hosted/tokens.css" />   <!-- optioneel: kleuren + donker -->
<link rel="stylesheet" href="./domein-wissel-kopie.css" />
<link rel="stylesheet" href="./app-tour-venster.css" />
<section class="atv" data-atv-slug="wester" role="region" aria-roledescription="rondleiding" aria-label="…">…</section>
<script type="module">
  import { init } from './app-tour-venster.js';
  const tour = init(document.querySelector('.atv'), { interval: 5 });
  // tour.kies(2) · tour.actief() · tour() = opruimen
</script>
```

**React / Next.js**
```tsx
import { AppTourVenster } from '@/features/app-tour-venster/AppTourVenster';

const APPS = [
  { label: 'Kennisbank', domein: 'wiki.{slug}.nl', icoon: <DocIcon />, beschrijving: 'Kennisbank met …', scherm: <KennisbankScherm /> },
  // …
];
<AppTourVenster apps={APPS} slug="wester" label="Rondleiding door Wolkhaven" />
```
De schermen zijn je eigen JSX met de `.atv-*`-klassen; kopieer de opbouw uit `demo.html`. Houd `APPS`
stabiel (buiten de component): de module start opnieuw als `interval` of `slug` verandert.

**WordPress**
Zet de map en `_kwaliteit/basis.js` met dezelfde onderlinge paden in je thema.
`wp_enqueue_style()` voor beide CSS-bestanden (`app-tour-venster.css`, `domein-wissel-kopie.css`),
`wp_enqueue_script_module()` voor de JS (WP 6.5+). De markup gaat in een Custom HTML-blok.

## Markup-contract
- Root `.atv` (een `<section>` met `role="region"`, `aria-roledescription="rondleiding"` en een
  `aria-label`). Optioneel `data-atv-slug` = de standaardnaam in de domeinen.
- `.atv__chrome` met `.atv__lichtjes` (`aria-hidden`), `.atv__adres` (`aria-hidden`) met daarin
  `<code data-atv-adres>`, en de pauzeknop `<button data-atv-pauze-knop hidden>` met een
  `<span data-atv-knoptekst>`. De module maakt hem zichtbaar zodra er iets vanzelf beweegt.
- `.atv__app` met:
  - `[role=tablist]` (`.atv__rail`), tabs = `<button role="tab" data-atv-domein="wiki.{slug}.nl"
    data-atv-label="Kennisbank">` met een icoon en `<span class="atv__tip">Kennisbank</span>` (dat is
    de toegankelijke naam én de tooltip). Optioneel `<span data-atv-railnaam aria-hidden="true">`
    (de appnaam naast de tabs op smal).
  - `.atv__podium` met per tab een `<div class="atv__paneel" role="tabpanel" tabindex="0">`, met
    `<p class="atv__sr">beschrijving</p>` en de nep-app in `<div class="atv-app" aria-hidden="true">`.
- Ids, `aria-controls` en `aria-labelledby` vult de module aan als ze ontbreken (tab *i* ↔ paneel *i*).
- De module voegt `.atv__markering` (rail) en `.atv__voortgang` (onder de adresbalk) toe en zet
  `data-atv-actief`, `data-atv-aan` (actief paneel) en `data-atv-pauze="<redenen>"` op de root.

**Scènes** (optioneel, per paneel, met data-attributen; de module speelt ze af als het paneel actief
wordt en zet ze terug als het opnieuw actief wordt):

| Attribuut | Wat er gebeurt |
|---|---|
| `data-atv-onthul` (+ `data-atv-na="1100"`) | krijgt na 1,1 s `data-atv-open` (bv. wachtwoord zichtbaar). |
| `data-atv-verhuis="klaar"` op een `[data-atv-kaart]` | wordt na 1,2 s opgetild en verhuist naar `[data-atv-kolom="klaar"] [data-atv-lijf]`; elke `[data-atv-aantal]` telt de kaarten in zijn kolom (één bron, R9). |
| `data-atv-typt` + `data-atv-nieuw` (`hidden`) | typpuntjes vanaf 0,45 s, daarna (`data-atv-na`, standaard 2,1 s) schuift het nieuwe bericht erin. |
| `.atv-in` met `style="--i:n"` | komt gestaffeld binnen (.045 s per stap). |
| `.atv-balk-rij` met `--w:.78` | balk groeit van 0 naar 78 %. |

## Opties
| Optie | Standaard | Wat |
|---|---|---|
| `interval` | `5` | Seconden per tab bij automatisch doorschuiven. `0` = alleen met de hand. |
| `slug` | `data-atv-slug` of `"bedrijf"` | Vult `{slug}` in de domeinen. |
| `teksten` | `TEKSTEN` (Nederlands) | Tekst en aria-label van de pauzeknop: `pauzeer` (`Pauzeren`), `speel` (`Afspelen`), `pauzeerLabel` (`Rondleiding pauzeren`), `speelLabel` (`Rondleiding afspelen`). |

De React-wrapper neemt dezelfde `teksten` als prop, plus `rol` (`aria-roledescription`, standaard `rondleiding`) en `railLabel` (aria-label van de tablist, standaard `Apps in het voorbeeld`); `label` blijft de naam van het hele venster. Engels: `teksten={{ pauzeer: 'Pause', speel: 'Play', pauzeerLabel: 'Pause the tour', speelLabel: 'Play the tour', rol: 'tour', railLabel: 'Apps in the example' }}`.

API: `destroy.kies(i)` kiest tab *i* (telt als keuze van de bezoeker), `destroy.actief()` geeft de
index. Event: de adresbalk luistert naar `eigennaam` (zie `forms/eigen-naam-preview`) en wisselt dan
naar de naam van de bezoeker.

CSS-variabelen op `.atv` (terugval tussen haakjes): `--atv-vlak` (`--surface`), `--atv-mist`
(`--surface-mist`), `--atv-hoog` (`--surface-raised`), `--atv-lijn` (`--line`), `--atv-inkt` (`--ink`),
`--atv-inkt-zacht` (`--ink-muted`), `--atv-accent` / `-sterk` / `-zacht` (`--indigo*`), `--atv-actie`
(`--action`), `--atv-nacht` (`--navy`), `--atv-radius` (`--radius-window`, 18 px), `--atv-schaduw`
(`--shadow-window`), `--atv-hoogte` (540 px, smal 470 px).

## Toegankelijkheid
- **Tabs (WAI-ARIA):** echte `role=tablist/tab/tabpanel`, roving tabindex, pijltjes (links/rechts én
  op/neer, want de rail staat op breed verticaal en op smal horizontaal), Home en End. De focus volgt
  de selectie. Tab vanuit de rail gaat naar het actieve paneel (`tabindex="0"`, focusring 2 px).
- **Schermlezer (R15):** elk paneel heeft een `sr-only`-zin die zegt wat er te zien is; de nep-UI en
  de adresbalk zijn `aria-hidden`. Inactieve panelen zijn `visibility: hidden` (dus ook weg voor de
  schermlezer).
- **WCAG 2.2.2 (pauzeren):** zichtbare knop "Pauzeren"/"Afspelen" (naam "Rondleiding pauzeren"/
  "Rondleiding afspelen", bevat de zichtbare tekst), als eerste in de tabvolgorde vóór de tabs.
  Doorschuiven pauzeert bij muis op de app, focus in de app, verborgen tabblad, buiten beeld,
  `html[data-motion="paused"]` en het event `beweging:pauze`. Zelf een tab kiezen stopt het
  doorschuiven tot de bezoeker op "Afspelen" drukt. De pauzeknop zelf telt niet als focus in de app,
  zodat "Afspelen" meteen werkt.
- **Minder beweging (R1):** niet automatisch, geen pauzeknop (er beweegt niets vanzelf), panelen
  wisselen zonder overgang en elke scène staat meteen in zijn eindstand. Live omzetten werkt.
- **Contrast (R16):** gemeten in `test/meet.mjs` op 24 soorten tekst in alle vier de apps, licht en
  donker: laagste 4,58:1 (wit op indigo in het ongelezen-bolletje), de rest ruim boven 5:1.
- **Zonder JS (R4):** de vier apps staan onder elkaar, met hun beschrijving; geen pauzeknop.

## Valkuilen
- **Icoon-sprite:** de demo zet de iconen in één `<svg class="atv__sprite">` met `<symbol id>`. Twee
  vensters op één pagina = dubbele ids; geef de tweede eigen ids of gebruik inline SVG.
- **Hoogte:** het podium is 540 px (smal 470 px) met een zachte fade onderaan. Wat er niet in past
  verdwijnt in de fade; zet onbelangrijke blokken op `atv-alleen-breed` (weg op smal).
- **Scènes en het interval:** de chatscène duurt ±2,6 s. Met een interval onder de 3 s zie je hem
  niet af.
- **Smal = container query:** de indeling hangt af van de breedte van het venster, niet van het
  scherm. Een smal venster in een brede pagina krijgt dus ook de smalle indeling.
- **Kopie bijwerken:** pas je `typography/domein-wissel` aan, kopieer de `.js` en `.css` dan opnieuw
  naar `domein-wissel-kopie.*` hier én in `forms/eigen-naam-preview`. De meting vangt het als je het
  vergeet.

## Herkomst
eu-hosted.com, het productvenster op de homepage (gemeten 28-10-2026,
tabel d, nummer 1). Nagemeten: ±5,6 s per tab, typpuntjes .35 → 1 opacity en −2 px in 1,2 s,
venster-schaduw navy-getint. Eigen code, eigen teksten en eigen nep-apps. Wat wij beter doen:
- De doorschuif-timer ís de voortgangslijn (één WAAPI-animatie): pauzeren bewaart de resterende tijd
  en de bezoeker ziet wanneer de volgende app komt.
- Een zichtbare pauzeknop in het venster zelf, niet alleen in de footer; plus pauze buiten beeld.
- Elke app vertelt een klein verhaal (verhuizende kaart met tellers uit de DOM, wachtwoord dat
  opengaat, bericht dat binnenkomt) in plaats van een stilstaand scherm.
- Geen GSAP: de adresbalk gebruikt onze eigen `domein-wissel` (WAAPI, als kopie in deze map).
- Werkt licht en donker, en op 390 px met een eigen smalle indeling (geen verkleind plaatje).
