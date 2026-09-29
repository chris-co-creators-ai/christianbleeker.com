# krachtveld-logowand

Een logo- of partnerwand op magnetische veldlijnen. In het midden een ronde CTA-schijf (een echte link) met optioneel draaiende tekst eromheen. Daaromheen de veldlijnen van een dipool, met 6 tot 10 klantlogo's óp de lijnen. Bij binnenkomst in beeld tekenen de lijnen zich in; met een fijne muis buigen ze licht mee onder de cursor en veren ze terug.

Rustig genoeg voor een notaris of accountant, en toch een wow-moment. Zonder JavaScript staan alle lijnen en logo's er gewoon.

Bestanden: `krachtveld-logowand.js` · `krachtveld-logowand.css` · `KrachtveldLogowand.tsx` · `genereer-paden.mjs` · `demo.html` · `test/meet.mjs`

## Wanneer wel

- Een logo- of partnerwand die meer moet zijn dan een vlak rijtje (`clients/logo-cloud-*`), bijvoorbeeld boven een contactkaart of afsluiter van een dienstenpagina.
- Als je een sterke, maar rustige CTA wilt met sociaal bewijs eromheen.
- 6 tot 10 logo's, liefst als eenkleurig woordmerk.

## Wanneer niet

- Meer dan 10 logo's: neem dan een marquee of een raster.
- Logo's die per stuk klikbaar moeten zijn of een eigen verhaal hebben (de wand is bedoeld als sfeer en bewijs).
- Logo's met veel kleur of een foto-achtergrond: de wand werkt het best met één inktkleur.

## Installatie

De wand hergebruikt `typography/circle-text` (draaiende tekst) en `_kwaliteit/basis.js`. Kopieer dus drie mappen mee: `effects/krachtveld-logowand`, `typography/circle-text` en `_kwaliteit` (alleen `basis.js`), met dezelfde onderlinge paden.

**Vanilla**

```html
<link rel="stylesheet" href="typography/circle-text/circle-text.css" />
<link rel="stylesheet" href="effects/krachtveld-logowand/krachtveld-logowand.css" />
<script type="module">
  import { init } from './effects/krachtveld-logowand/krachtveld-logowand.js';
  const destroy = init(document.querySelector('[data-krachtveld]'));
  // destroy() bij opruimen
</script>
```

De markup (paden en logoplekken) reken je vooraf uit:

```bash
node effects/krachtveld-logowand/genereer-paden.mjs 8
```

Dat print beide `<svg>`-lagen (desktop en mobiel) en een `<li>` per logo met de juiste `--dx --dy --mx --my`. Zet je logo in de `<li>`. `demo.html` is een volledig uitgewerkt voorbeeld. De module exporteert ook `berekenLaag`, `lusPunten`, `naarD` en `OPZET`, zodat je de paden in een eigen build- of servertap kunt uitrekenen.

**React / Next.js (App Router)**

```tsx
import { KrachtveldLogowand } from '@/component-library/effects/krachtveld-logowand/KrachtveldLogowand';

<KrachtveldLogowand
  thema="donker"
  href="/contact"
  label="Plan een kennismaking met Studio Wester"
  ringTekst="Kennismaking bij Studio Wester"
  logos={[
    { alt: 'Hofstra', src: '/logos/hofstra.svg' },
    { alt: 'Meridiaan', svg: <MeridiaanWoordmerk /> },
    // … 6 tot 10
  ]}
/>
```

De wrapper rekent de paden tijdens het renderen uit (ook op de server), dus de HTML is zonder JS al compleet.

**WordPress**

Genereer de markup met `genereer-paden.mjs`, plak hem in een Aangepaste HTML-blok en laad de twee stylesheets plus de module via `wp_enqueue_style` / `wp_enqueue_script_module` (of een `<script type="module">` in het blok). Geef de logo's een `alt` in de Mediabibliotheek.

## Markup-contract

```
<section data-krachtveld [data-kv-thema="donker"]>          ← root voor init()
  <div class="kv__wand">
    <svg class="kv__veld kv__veld--d" viewBox=… aria-hidden="true"
         data-kv-veld="d" data-kv-r="135" data-kv-draai="0">
      <path data-kv-l="360" data-kv-kant="-1" style="--kv-i:4" pathLength="1" d="…"/>   ← × 14
    </svg>
    <svg class="kv__veld kv__veld--m" … data-kv-veld="m" data-kv-r="80" data-kv-draai="1"> … </svg>
    <div class="kv__midden">
      <a class="kv__schijf" href="…" data-circle-text aria-label="…">
        <svg class="ct__ring" viewBox="0 0 100 100" aria-hidden="true"> … textPath … </svg>
        <span class="ct__center" aria-hidden="true">Plan een kennismaking …</span>
      </a>
    </div>
    <ul class="kv__logos">
      <li class="kv__logo" style="--dx:…;--dy:…;--mx:…;--my:…;--kv-n:0"> <img alt="…"> of <svg role="img" aria-label="…"> </li>
    </ul>
  </div>
</section>
```

- `data-kv-l` (de L van de veldlijn), `data-kv-kant` (-1 links of boven, 1 rechts of onder), `data-kv-r` (schijfstraal) en `data-kv-draai` moeten kloppen met de `d`; de JS rekent er de punten mee uit voor het buigen. Laat `genereer-paden.mjs` ze schrijven.
- Zonder `[data-circle-text]` (of met `ring: false`) draait er geen tekst.
- Logo's: kleur via `currentColor`, verhouding liefst 4:1 tot 5:1.

## Opties

| Optie | Standaard | Wat het doet |
|---|---|---|
| `entree` | `true` | Lijnen tekenen in als de wand in beeld komt. |
| `buigen` | `true` | Lijnen buigen mee onder een fijne muis. |
| `kracht` | `16` | Maximale verplaatsing in viewBox-eenheden (de wand is 1200 breed). |
| `bereik` | `120` | Straal van de invloed van de cursor, in viewBox-eenheden. |
| `ring` | `true` | Start `circle-text` op `[data-circle-text]`. |
| `ringDuur` | `28` | Seconden per omwenteling van de cirkeltekst. |

`init(root, opties)` geeft `destroy()` terug. Die is idempotent, zet alle paden terug op hun rust-`d` en haalt alle attributen weg.

**CSS-variabelen op de root** (licht is standaard, `data-kv-thema="donker"` voor donker): `--kv-bg`, `--kv-ink`, `--kv-lijn`, `--kv-logo`, `--kv-schijf-bg`, `--kv-schijf-ink`, `--kv-focus`, `--kv-lijn-breedte`, `--kv-breed`, `--kv-logo-breed`, `--kv-schijf`, `--kv-font`, `--kv-ease`. `--kv-bg` moet gelijk zijn aan de achtergrond achter de wand: de logo's krijgen die kleur als vlakje, zodat er geen lijn dwars door een woordmerk loopt.

## Hoe het werkt

- **Veldlijn.** Een dipool met de schijf als magneet: r = L·sin²θ, met θ vanaf de as. Punt = (L·sin³θ, L·sin²θ·cosθ). Elke lijn is één lus (schijfrand, evenaar, schijfrand) aan één kant van de schijf; 7 waarden van L geven 14 lijnen op desktop, 8 waarden geven 16 lijnen op mobiel. Catmull-Rom naar kubische Bézier houdt elk pad rond 1 KB.
- **Twee lagen.** Desktop heeft de as horizontaal (lijnen links en rechts), mobiel heeft de as verticaal (lijnen boven en onder), met een kleinere schijf. CSS kiest de laag op breedte (breekpunt 47,5 rem); beide staan in de markup.
- **Logo's op de lijn.** Elke plek is een lijn plus een hoek θ; de positie komt als percentage van de wand in `--dx/--dy` (desktop) en `--mx/--my` (mobiel).
- **Intekenen.** Elk pad heeft `pathLength="1"`, `stroke-dasharray: 1` en een `stroke-dashoffset` die van 1 naar 0 gaat, met 0,12 s vertraging per lijn (binnenste eerst). Twee fasen zoals bij `reveal-on-scroll`: `data-kv-wacht` verbergt zonder transitie, één frame later zet `data-kv-actief` de transitie aan, en `data-kv-in` (bij 25% in beeld) laat de lijnen komen. Daarna verschijnen schijf en logo's.
- **Buigen.** `pointermove` schrijft alleen de cursorpositie weg; één rAF-lus rekent. De cursor trekt punten van elke lijn met een Gauss-gewicht licht naar zich toe, met sin(πt) langs de lijn, zodat de uiteinden aan de schijf vastzitten. De sterkte is een lichte veer: bij loslaten (pointer verlaat de wand) veren de lijnen terug en krijgen ze exact hun rust-`d`. De lus slaapt als er niets beweegt.

## Toegankelijkheid

- De schijf is een echte `<a href>` met `aria-label` (die de zichtbare tekst bevat) en een zichtbare focusstijl van 3 px. Ring en tekst in de schijf zijn `aria-hidden`; de link heeft zijn naam uit het label.
- De veldlijnen zijn `aria-hidden="true"`. Logo's hebben alt-tekst (`<img alt>` of `role="img"` met `aria-label`). De lijst heeft een `aria-label` (`lijstLabel`).
- Minder beweging (R1): geen intekenen, geen buigen, de ring draait niet; alles staat er direct. Zet de bezoeker het halverwege aan, dan reageert de wand live.
- Touch (R3): geen muisbuiging. Er valt niets te missen: de lijnen zijn decoratie.
- Contrast: logo's en lijnen staan in de themakleuren; toets `--kv-logo` op je eigen achtergrond (minimaal 4,5:1 voor woordmerken).
- Plaats zelf een "Ga naar inhoud"-link bovenaan de site (R21), zoals in de demo.

## Valkuilen

- **Logo's zonder eigen achtergrond.** Het vlakje achter een logo is `--kv-bg`. Staat de wand op een afwijkende achtergrond (foto, verloop), zet dan `--kv-bg` daarop af of laat het vlakje weg via `background: transparent` en laat de lijn erdoorheen lopen.
- **Meer dan 10 logo's.** De opzet heeft 10 plekken (`OPZET` in de JS). Meer plekken vragen om eigen lijnen en hoeken, en om een botsingstest zoals in `test/meet.mjs`.
- **Bewegende ring en tabbladen.** De cirkeltekst pauzeert buiten beeld en bij hover of focus (via circle-text); niets extra nodig.
- **`stroke-dashoffset` is geen transform.** Het intekenen animeert eenmalig een niet-compositor-eigenschap. Dat is bewust gekozen voor het effect; het duurt 2 tot 3 s en gebeurt één keer per wand. Het buigen schrijft `d` per frame, maar alleen zolang de muis in de wand is.
- **Eigen `viewBox`.** De wand heeft een vaste `aspect-ratio` (1200:480 desktop, 380:704 mobiel) en de logo's staan in percentages. Verander je de opzet, houd dan de `aspect-ratio` in de CSS gelijk aan de nieuwe `viewBox`.

## Herkomst

Social Next Agency (services-pagina, "Krachtveld", onderzoek 2026-09, rij S3): een lime schijf met draaiende tekst en magnetische veldlijnen met klantlogo's, die erin glijden en onder de muis buigen. De wiskunde (dipoolformule, Catmull-Rom) is algemeen bekend; **de code is volledig eigen werk**, niets is overgenomen uit hun bundel.

Wat wij anders doen: de paden staan vooraf berekend in de markup (ook zonder JS en met server-render), het is een echte link met zichtbare focus, minder beweging en touch krijgen een volwaardige statische wand, `destroy()` zet alles terug, en er is een gemeten mobiele variant met een gedraaid veld waarop de logo's aantoonbaar niet overlappen. De demo gebruikt neutrale, verzonnen woordmerken.
