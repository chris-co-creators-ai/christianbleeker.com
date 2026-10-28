# prijzen-per-dienst

Open prijzen per dienst (They Ask, You Answer): tabs per dienst, per tab 1 tot 4 pakketkaarten met "vanaf"-prijs in NL-notatie, doorlooptijd, wat het oplevert, wat erin zit en een CTA. Eronder een eigen FAQ en een regel "Liever iets op maat?". De dienst en het pakket gaan als URL-parameters mee in de CTA-link, zodat een aanvraagformulier voor te vullen is. Zonder JavaScript staan alle diensten gewoon onder elkaar, elk met een kop.

## Wanneer wel
- Een dienstverlener met 2 tot 5 diensten die kopers eerst op prijs laat zoeken.
- Je wilt dat een aanvraag al weet welke dienst en welk pakket gekozen is.

## Wanneer niet
- Eén product met een tabel van 4 abonnementen naast elkaar: gebruik `pricing-table-compare`.
- Prijzen die je niet openlijk wilt noemen. Zonder vanafprijs is dit onderdeel een lege huls.

## Installatie
```
pricing/prijzen-per-dienst/
├── prijzen-per-dienst.js    # vanilla ES-module, 0 dependencies (gebruikt ../../_kwaliteit/basis.js)
├── prijzen-per-dienst.css   # namespaced onder .ppd
├── PrijzenPerDienst.tsx     # React/Next.js client-wrapper
├── demo.html
└── test/meet.mjs
```

**Vanilla**
```html
<link rel="stylesheet" href="./prijzen-per-dienst.css" />
<script type="module">
  import { init } from './prijzen-per-dienst.js';
  const destroy = init(document.querySelector('#prijzen'));
</script>
```

**React / Next.js**
```tsx
import { PrijzenPerDienst } from '@/component-library/pricing/prijzen-per-dienst/PrijzenPerDienst';
<PrijzenPerDienst activatie="auto" kanteling={3}>{/* markup uit het contract */}</PrijzenPerDienst>
```
De wrapper voegt de tablist in buiten React om. Laat React de panelen daarom niet conditioneel renderen na mount.

**WordPress**: zet de markup in een HTML-blok, laad het CSS-bestand en het script als `type="module"` (via `wp_enqueue_script_module` of een eigen `<script type="module">`).

## Markup-contract
```html
<div class="ppd" id="prijzen">
  <section class="ppd__paneel" data-ppd-paneel data-dienst="website" data-titel="Website">
    <h3 class="ppd__paneelkop" data-ppd-paneelkop>Website</h3>
    <div class="ppd__kaarten">
      <article class="ppd__kaart" data-ppd-pakket="groei" data-populair>
        <p class="ppd__badge">Meest gekozen</p>
        <h4 class="ppd__naam">Groei</h4>
        <p class="ppd__prijs"><span class="ppd__vanaf">vanaf</span>
          <span class="ppd__bedrag" data-prijs="6800">€ 6.800</span>
          <span class="ppd__eenheid">excl. btw · eenmalig</span></p>
        <p class="ppd__tijd">Doorlooptijd: <strong>6 weken</strong></p>
        <ul class="ppd__lijst ppd__lijst--punt">…</ul>   <!-- wat het oplevert -->
        <ul class="ppd__lijst ppd__lijst--vink">…</ul>   <!-- inbegrepen -->
        <a class="ppd__cta" data-ppd-cta href="/aanvraag">Vraag Groei aan</a>
      </article>
    </div>
    <div class="ppd__faq"><details><summary>Vraag</summary><p>Antwoord</p></details></div>
    <p class="ppd__maat">Liever iets op maat? <a data-ppd-cta data-pakket="op-maat" href="/aanvraag">…</a></p>
  </section>
</div>
```
Zie `demo.html` voor de volledige opzet. JS maakt de tablist zelf uit de panelen, formatteert `data-prijs` naar `€ 2.400`, en zet `?dienst=<data-dienst>&pakket=<data-ppd-pakket>` op elke `[data-ppd-cta]`. Bestaande parameters en `#hash` in de href blijven behouden. De prijs komt uit één bron (`data-prijs`); de tekst in de markup is alleen de fallback zonder JS.

## Opties
| Optie | Standaard | Betekenis |
|---|---|---|
| `activatie` | `'auto'` | `auto`: pijltjes activeren meteen. `handmatig`: pijltjes verplaatsen de focus, Enter/Spatie activeert. |
| `hash` | `true` | Actieve tab in de URL-hash en openen vanuit de hash. |
| `hashVoorvoegsel` | `'dienst-'` | Hash wordt `#dienst-website`. |
| `kanteling` | `3` | Maximale kanteling in graden onder een fijne muis; `0` = uit; nooit meer dan 3. |
| `paramDienst` / `paramPakket` | `'dienst'` / `'pakket'` | Namen van de URL-parameters. |
| `tablijstLabel` | `'Kies een dienst'` | `aria-label` van de tablist. |

`init(root, opties)` geeft `destroy()` terug (idempotent). `formatEuro(n)` is ook geëxporteerd.

## Toegankelijkheid
- WAI-ARIA tabs: `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabindex`.
- Pijl links/rechts (met omslag), Home, End. Focus met 2 px outline.
- "Meest gekozen" is tekst, niet alleen kleur. FAQ is native `details/summary`.
- Minder beweging: geen kanteling en geen paneel-animatie; live omzetten werkt.
- Touch: geen kanteling (grove aanwijzer).

## Valkuilen
- Bij een hash die niet bestaat opent de eerste tab; er gebeurt niets vreemds.
- De hash wordt met `replaceState` gezet, dus tabwissels vullen de terugknop niet. Een wijziging van de hash door de bezoeker (link plakken, hash typen) opent wel de tab.
- Meerdere instanties op één pagina delen de URL-hash: geef ze een eigen `hashVoorvoegsel` of zet `hash: false`.
- De prijzen in `demo.html` zijn voorbeeld (Studio Wester is verzonnen). Vul altijd echte tarieven in; er is bewust geen "berekende" prijs.
- Hoort de CTA-pagina de parameters te lezen? Dat doet het aanvraagformulier, niet dit onderdeel.

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
