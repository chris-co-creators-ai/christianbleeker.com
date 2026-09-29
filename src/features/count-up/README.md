# count-up

Eerlijke teller: telt van 0 naar een écht getal dat je zelf opgeeft. Zonder
dat getal toont het component **niets** — geen verzonnen startwaarde, geen
"oplopend" cijfer zonder bron.

## Wanneer wel

- Een concreet, controleerbaar getal dat je kunt onderbouwen: aantal
  projecten, jaren ervaring, gemiddelde beoordeling, aantal klanten.
- Wanneer hetzelfde getal op meerdere plekken op de pagina staat — gebruik
  dan `data-koppel` zodat ze nooit uit elkaar kunnen lopen.

## Wanneer niet

- **Nooit** voor een getal dat je niet kunt onderbouwen. Dit component
  weigert expres te draaien zonder `data-waarde` (zie "Herkomst").
- Niet voor een live, steeds veranderend getal (bv. actuele voorraad) — dit
  telt één keer op, naar een vaste waarde, niet doorlopend.

## Installatie

```
component-library/stats/count-up/
├── count-up.js       # vanilla ES-module, 0 dependencies
├── count-up.css      # namespaced op .cu
├── CountUp.tsx        # React/Next.js client-wrapper
├── demo.html          # zelfstandige demo
└── test/meet.mjs      # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./count-up.css" />
<div class="cu" data-count-up data-waarde="1000" data-suffix="+">
  <span class="cu__waarde" data-cu-waarde>1.000+</span>
  <span class="cu__label">afgeronde projecten</span>
</div>
<script type="module">
  import { init } from './count-up.js';
  const destroy = init(document.querySelector('[data-count-up]'));
  // destroy() bij opruimen
</script>
```

**React / Next.js**

```tsx
import { CountUp } from '@/component-library/stats/count-up/CountUp';

<CountUp waarde={1000} suffix="+" label="afgeronde projecten" bron="eigen boekhouding" bronDatum="2026" />
```

## Markup-contract

- Root: het element met `data-count-up`. Bevat optioneel een
  `[data-cu-waarde]`-kind — de tekstdrager die geteld wordt. Zonder dat kind
  telt de root zelf.
- **`data-waarde` is verplicht.** Ontbreekt hij of is hij geen geldig getal,
  dan krijgt de root het `hidden`-attribuut en verschijnt er een
  console-waarschuwing — er wordt nooit een verzonnen getal getoond (R8).
- De statische tekst in `[data-cu-waarde]` **is al de eindwaarde**, in
  NL-notatie (bv. `1.000+`, `4,9`) — dat is de inhoud zonder JS (R4). Met JS
  telt het component van 0 naar diezelfde waarde.
- `data-decimalen="1"` — aantal decimalen (komma als scheidingsteken).
- `data-suffix="+"` — tekst ná het getal (bv. `+`, `%`).
- `data-koppel=".jaren-elders"` — CSS-selector: andere elementen die na het
  tellen dezelfde eindtekst krijgen. Voorkomt tegensprekende claims zoals
  "6+ jaar ervaring" naast "25 jaar vakmanschap" (R9).
- `data-bron` + `data-bron-datum` (optioneel) — worden zichtbaar als een
  klein `<small data-cu-bron>Bron: …</small>`-element ná de teller.

## Opties (`init(root, opties)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `waarde` | `data-waarde` | Het te tonen getal. Verplicht. |
| `decimalen` | `data-decimalen` of `0` | Aantal decimalen. |
| `suffix` | `data-suffix` of `''` | Tekst ná het getal. |
| `koppel` | `data-koppel` | CSS-selector voor gekoppelde elementen. |
| `bron` | `data-bron` | Bronvermelding. |
| `bronDatum` | `data-bron-datum` | Datum/jaar bij de bron. |
| `duurMs` | `1600` | Animatieduur. |

## Toegankelijkheid

- Geen interactieve elementen — geen toetsenbord-contract nodig.
- `prefers-reduced-motion: reduce` (of een wissel halverwege de animatie)
  springt direct naar de eindwaarde — geen tellend cijfer voor wie daar
  gevoelig voor is (R1).
- De teller is puur visuele progressie; de eindwaarde staat al statisch in
  de HTML, dus een screenreader die vóór het tellen voorleest, leest gewoon
  het juiste getal.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/count-up/`.
2. Enqueue de CSS, laad `count-up.js` met `wp_enqueue_script_module()` (geen
   versienummer — zie `scroll/reveal-on-scroll/README.md` "Op WordPress").
3. Zet `data-waarde` op een ACF-cijferveld zodat een klant het zelf kan
   bijwerken zonder de tekst-fallback te hoeven aanpassen.

## Valkuilen

- **`data-waarde` vergeten**: het component verbergt zichzelf stil (met een
  console-waarschuwing) — geen kapotte lay-out, maar ook geen teller. Check
  de console als een teller "verdwenen" lijkt.
- **De statische tekst en `data-waarde` laten uiteenlopen** (bv. tekst
  "1.000+" maar `data-waarde="800"`): de teller telt naar het getal in
  `data-waarde`, dus de flash-of-final-content vóór JS laadt wijkt dan af
  van het geanimeerde eindresultaat. Houd ze gelijk.
- **`data-koppel` naar een selector die niet bestaat**: geen fout, het
  schrijft simpelweg nergens naartoe (`querySelectorAll` geeft een lege
  lijst).

## Herkomst

Bij Webstijn-klant Sloopteam telt een teller TikTok-views op door te
beginnen bij een **willekeurig startgetal** (JavaScripts ingebouwde
random-functie) en daar het "echte" getal bovenop te tellen — het resultaat
oogt indrukwekkend maar is voor een deel verzonnen. Dat is de reden dat dit
bestand geen enkele willekeurige-getalfunctie gebruikt: elk getal dat je
hier ziet staat letterlijk in `data-waarde`, door de bouwer ingevuld en dus
controleerbaar. Zonder die waarde toont het component liever niets dan een
geraden cijfer.
