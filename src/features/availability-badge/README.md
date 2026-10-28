# availability-badge

Klein badge met een pulserende stip: "Ruimte voor nieuwe projecten in
december". De maand komt uit precies één bron (R9 — nooit twee tegensprekende
waarden): een vaste tekst die de bouwer typt, of een berekening op basis van
vandaag.

## Wanneer wel

- Homepage of contactpagina van een zzp'er/studio die laat zien wanneer er
  weer ruimte is voor nieuwe klussen.
- Content die je periodiek handmatig bijwerkt (vaste maand) of die zichzelf
  actueel houdt zonder dat iemand eraan hoeft te denken (berekend).

## Wanneer niet

- Niet voor een exacte beschikbaarheidskalender met losse dagen/weken — dit
  is bewust grof (één maand als tekst), voor detail heb je een planner nodig.
- Niet als "live" bezetting — dit toont geen actuele boekingsstatus, alleen
  een door de bouwer bepaalde maand.

## Installatie

```
component-library/badges/availability-badge/
├── availability-badge.js      # vanilla ES-module, 0 dependencies
├── availability-badge.css     # namespaced op .ab
├── AvailabilityBadge.tsx      # React/Next.js client-wrapper
├── demo.html                  # zelfstandige demo
└── test/meet.mjs              # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./availability-badge.css" />
<span class="ab" data-availability-badge data-maanden-vooruit="1">
  <span class="ab__dot" aria-hidden="true"></span>
  <span class="ab__tekst">Ruimte voor nieuwe projecten in <span data-ab-maand>december</span></span>
</span>
<script type="module">
  import { init } from './availability-badge.js';
  const destroy = init(document.querySelector('[data-availability-badge]'));
  // destroy() bij opruimen
</script>
```

**React / Next.js**

```tsx
import { AvailabilityBadge } from '@/component-library/badges/availability-badge/AvailabilityBadge';

<AvailabilityBadge standaardMaand="december" maandenVooruit={1} />
```

## Markup-contract

- Root: het element met `data-availability-badge` (of de wrapper die je aan
  `init()` geeft). Bevat verplicht één `[data-ab-maand]`-element — de tekst
  die vervangen wordt.
- De tekst in `[data-ab-maand]` staat **altijd al statisch in de HTML**
  (bijvoorbeeld "december"). Dat is de zinvolle standaardtekst zonder JS
  (R4) — de module overschrijft hem alleen als er iets te overschrijven valt.
- Precies één van deze twee attributen bepaalt of/hoe de tekst wordt
  overschreven; `data-maand` wint als beide aanwezig zijn:
  - `data-maand="december"` — vaste maandnaam, letterlijk overgenomen.
  - `data-maanden-vooruit="1"` — berekent de NL-maandnaam van
    (vandaag + N maanden) in Nederlandse tijd. Geen geldig getal? Dan blijft
    de standaardtekst staan en komt er een console-waarschuwing (R5).
- Geen van beide attributen aanwezig: de statische tekst blijft ongewijzigd.

## Opties (`init(root, opties)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `maand` | `root.dataset.maand` | Vaste maandnaam; wint van `maandenVooruit`. |
| `maandenVooruit` | `root.dataset.maandenVooruit` | Aantal maanden vooruit vanaf vandaag (NL-tijd). |

CSS-variabelen (op `.ab`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--ab-bg` | `#eef7ee` | Achtergrondkleur van het badge. |
| `--ab-line` | `#cfe8cf` | Randkleur. |
| `--ab-ink` | `#16341c` | Tekstkleur. |
| `--ab-dot` | `#2fae4e` | Kleur van de stip + puls. |

## Toegankelijkheid

- De stip (`.ab__dot`) is puur decoratief en heeft `aria-hidden="true"` —
  screenreaders lezen alleen de tekst.
- `prefers-reduced-motion: reduce` zet de puls-animatie uit via een
  CSS media query (geen JS nodig, dus ook actief vóórdat de module laadt en
  live wanneer de instelling tijdens het bezoek wisselt).
- Geen interactieve elementen — geen toetsenbord-contract nodig.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/availability-badge/`.
2. Enqueue met `wp_enqueue_style()` voor de CSS en `wp_enqueue_script_module()`
   voor `availability-badge.js` (zonder versienummer op de module — zie de
   toelichting in `scroll/reveal-on-scroll/README.md` "Op WordPress").
3. Plaats de markup uit "Markup-contract" in een Custom HTML-blok of template.
4. Roep `init()` aan ná `DOMContentLoaded`.

## Valkuilen

- **`data-maand` en `data-maanden-vooruit` samen zetten is verwarrend** — het
  werkt (vaste maand wint), maar de berekende waarde ligt er dan onbenut bij.
  Kies er één.
- **Grote sprongen in `maandenVooruit`** (bijvoorbeeld 14) werken prima —
  de berekening rolt gewoon door naar het volgende jaar — maar lees dan niet
  hardcoded "december" in de standaardtekst; die klopt dan niet meer als
  fallback zonder JS.
- **`[data-ab-maand]` vergeten** in de markup: de module logt een
  waarschuwing en doet verder niets (R5, crasht niet).

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
