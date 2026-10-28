# live-demo-kader

Een kader (browservenster met adresbalk, of app-venster met zijbalk) waarin een
**klikbare demo met voorbeelddata** draait. Het onderdeel levert het kader en de
spelregels; de app erin (schermen, zijbalk, gegevens) maak je zelf per klant.

## Wanneer wel

- Een klant met een app, portaal, dashboard of configurator, en je wilt dat de
  bezoeker het uitprobeert zonder account.
- De demo moet eerlijk blijven: verzonnen gegevens, duidelijk gemarkeerd, en niets
  wat echt iets doet.

## Wanneer niet

- Een statische afbeelding van een site of app is genoeg: gebruik `portfolio/device-mockup`.
- De echte app zelf (met inloggen en opslaan): dit is een demo, nooit de productie-app.
- Een video-uitleg: gebruik `media/video-facade`.

## Installatie

```
portfolio/live-demo-kader/
├── live-demo-kader.js     vanilla ES-module, 0 dependencies
├── live-demo-kader.css    namespaced op [data-demo-kader] en .ldk-
├── LiveDemoKader.tsx      React/Next.js client-wrapper
├── assets/demo-poster.jpg schermafbeelding voor smalle schermen (zelf maken, zie Valkuilen)
├── demo.html              Studio Wester klantportaal (4 schermen)
└── test/meet.mjs          Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./live-demo-kader.css" />
<script type="module">
  import { init } from './live-demo-kader.js';
  const destroy = init(document.querySelector('[data-demo-kader]'), { type: 'browser' });
</script>
```

**React / Next.js (App Router)**

```tsx
import { LiveDemoKader } from '@/component-library/portfolio/live-demo-kader/LiveDemoKader';

<LiveDemoKader label="Demo: klantportaal" adresBasis="portaal.voorbeeld.example"
  startAdres="portaal.voorbeeld.example/overzicht" naDemoId="na-demo" poster="/demo-poster.jpg"
  zijbalk={<><a href="#overzicht" data-demo-naar="overzicht">Overzicht</a>…</>}>
  <section data-demo-scherm="overzicht">…</section>
  <section data-demo-scherm="facturen">…</section>
</LiveDemoKader>
<p id="na-demo" tabIndex={-1}>Verder met de pagina</p>
```

**WordPress**: zet de markup uit het contract in een Aangepaste HTML-blok, laad de
css in je thema en de module via `wp_enqueue_script_module`. Geen PHP nodig.

## Markup-contract

```html
<div data-demo-kader data-demo-type="browser" data-demo-adres-basis="portaal.voorbeeld.example" data-demo-poster="poster.jpg">
  <a class="ldk-skip" href="#na-demo">Sla de demo over</a>
  <div class="ldk-kop"><p class="ldk-markering" data-demo-markering>Voorbeeld met verzonnen gegevens</p></div>
  <div class="ldk-vak" data-demo-vak>
    <div class="ldk-venster" data-demo-venster role="group" aria-label="Demo: …">
      <div class="ldk-balk"> … <button data-demo-terug aria-disabled="true"> <button data-demo-vooruit …> <div class="ldk-adres"><span data-demo-adres>…</span></div></div>
      <div class="ldk-body">
        <nav class="ldk-nav" data-demo-nav> <a href="#a" data-demo-naar="a">A</a> … </nav>
        <div class="ldk-schermen"> <section data-demo-scherm="a" data-demo-pad="/a">…</section> … </div>
      </div>
    </div>
    <div class="ldk-melding" data-demo-melding></div>
  </div>
</div>
<p id="na-demo" tabindex="-1">…</p>
```

- Het eerste `data-demo-scherm` is het startscherm en het enige scherm zonder JS.
- `data-demo-naar="naam"` op een link (in of buiten de zijbalk): wisselt van scherm.
  `aria-current="page"` komt alleen op links **binnen** `[data-demo-nav]`.
- `data-demo-pad` (standaard `/naam`) en `data-demo-titel` (standaard de eerste kop) sturen wat de adresbalk toont.
- Een link telt als **echt** (verlaat het kader) als hij `data-demo-extern` heeft, of naar een andere
  herkomst (`https:`) of naar `mailto:`/`tel:` wijst. Elke andere link, knop of formulier doet niets
  en toont de melding.
- Ontbreken de markering, overslaanlink of meldingsregio, dan voegt `init` ze zelf toe.
- Styling van de app zelf is van jou. Container-query naam: `@container ldk (max-width: 640px)`
  voor de smalle indeling (zie `demo.html`).

## Opties

| Optie | Standaard | Wat |
|---|---|---|
| `type` | `'browser'` | `'browser'` (adresbalk met pad) of `'app'` (titelbalk met schermnaam). Ook `data-demo-type`. |
| `start` | eerste scherm | Naam van het beginscherm. Ook `data-demo-start`. |
| `adresBasis` | `''` | Host vóór het pad. Ook `data-demo-adres-basis`. |
| `poster` | `''` | Schermafbeelding voor de terugval. Ook `data-demo-poster`. |
| `minBreedte` | `720` | Onder deze kaderbreedte (px): terugval i.p.v. schalen. |
| `minSchaalTouch` | `0.85` | Op touch schaalt het kader alleen vanaf deze schaal (tekst ≥ 12 px, tikdoelen ≥ 24 px); daaronder de terugval. |
| `ontwerpBreedte` / `ontwerpHoogte` | `1120` / `680` | Maat waarop de demo is ontworpen. Alleen kleiner schalen, nooit groter. |
| `meldingTekst` | `In de demo wordt niets opgeslagen` | Tekst van de zachte melding. |
| `meldingDuur` | `3500` | Milliseconden zichtbaar. |
| `onWissel(scherm, pad)` | – | Callback; ook DOM-event `demo:wissel` op de root (`detail.scherm`, `detail.pad`). |

CSS-variabelen op het root-element: `--ldk-nav-bg`, `--ldk-nav-ink`, `--ldk-nav-actief-bg`,
`--ldk-nav-actief-ink`, `--ldk-venster-bg`, `--ldk-balk-bg`, `--ldk-rand`, `--ldk-focus`, `--ldk-knop-bg`.

## Schalen of terugval: wat we kozen en waarom

Gemeten aan `demo.html`. **Vanaf 720 px kaderbreedte** schaalt het kader als geheel
(`transform: scale`, schaal = breedte / 1120, minimaal 0,64): het vak reserveert de geschaalde
hoogte, de verhouding blijft 1120:680, en de meting geeft CLS 0. Puur CSS doet dat al vóór JS
(`tan(atan2(100cqw, 1120px))`), zodat er bij het opstarten niets verspringt. **Onder 720 px** zou
een geschaald kader onleesbaar worden (tekst van 15 px wordt ±5 px), dus daar staat een
schermafbeelding met de knop "Open de demo". Die opent een fullscreen-dialoog waarin de echte demo
op volle breedte draait, met de zijbalk als rij bovenaan. Dezelfde DOM verhuist (staat en
geschiedenis blijven), Escape sluit en zet de focus terug op de knop.

Een open dialoog blijft open bij draaien of resizen; bij sluiten valt de focus nooit op BODY (naar de knop,
of naar het huidige scherm als de knop verdwenen is). Op smalle kaders toont de adresbalk alleen het pad.
De melding wordt geklemd op het zichtbare deel van het vak, dus staat altijd in beeld.

## Toegankelijkheid

- "Sla de demo over" is de eerste tab-stop in het kader en wijzigt de URL/geschiedenis niet.
- Alles in het kader is met Tab, Enter en Spatie bruikbaar; focus is 2 px, ook als het kader geschaald is.
- Na een klik op een zijbalklink gaat de focus naar het nieuwe scherm; terug/vooruit houden de focus op de knop.
- Terug/vooruit gebruiken `aria-disabled` (geen `disabled`, zodat de focus niet verdwijnt).
- De melding staat in een `role="status"`-regio (`aria-live="polite"`) die buiten de schaal blijft.
- De markering is nooit meegeschaald: minimaal 13 px, ook op 390 px.
- Minder beweging: geen wisselanimatie en geen overgang in de melding; live omzetten werkt.
- De dialoog is een native `<dialog>` met `showModal()`: focus gevangen, Escape sluit.

## Valkuilen

- De schermafbeelding maak je opnieuw als het ontwerp verandert: `MAAK_POSTER=1 node test/meet.mjs`
  schrijft `assets/demo-poster.jpg` (element-screenshot van het venster op 1120×680).
- Geen `pushState` of hash: de browsergeschiedenis blijft van de pagina. Diepe links naar een scherm
  bestaan dus niet; gebruik `start` als je een scherm wilt openen.
- Gebruik voor formulieren `<form>` met een submitknop; `preventDefault` en de melding regelt het kader.
- Herkomstvergelijking voor "externe link" gebruikt `location.origin`: een absolute link naar je eigen
  domein telt dus als intern, tenzij je `data-demo-extern` zet.
- Gegevens in de demo moeten zichtbaar verzonnen zijn (R8); de markering is een vangnet, geen excuus.

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
