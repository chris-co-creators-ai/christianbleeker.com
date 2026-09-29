# hover-set

Eén set kaart-hover-effecten via één attribuut: `data-hover="lift|tilt|grow|
zoom|arrow|corners"`. De hele kaart is klikbaar via precies één echte `<a>`
(stretched-link) — geen `onClick` op een `<div>`.

## Wanneer wel

- Een rij diensten-, case- of productkaarten waar je bij hover een duidelijk,
  licht signaal wilt geven dat de kaart klikbaar is.
- `grow` specifiek voor een rij van 2–4 kaarten waar je één kolom wilt laten
  uitlichten (werkwijze-stappen, tariefkeuzes).

## Wanneer niet

- Niet voor kaarten met meerdere interne links (lees-meer + los tags-linkje
  ernaast) — een stretched-link staat dat niet toe; gebruik dan gewone kaarten
  zonder deze module.
- `tilt` niet op een kaart die zelf al scroll-gebonden beweegt (bv. binnen
  `scroll/horizontal-scroll-pin`) — twee tegelijk bewegende transforms
  verstoren elkaar.

## Installatie

```
component-library/cards/hover-set/
├── hover-set.js       # vanilla ES-module, 0 dependencies
├── hover-set.css      # namespaced op .hover-card + data-hover
├── HoverSet.tsx        # React/Next.js client-wrapper + <HoverCard>-helper
├── demo.html
└── test/meet.mjs
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./hover-set.css" />
<div class="hover-card" data-hover="lift">
  <div class="hover-card__media"><img src="…" alt="" /></div>
  <div class="hover-card__body">
    <h3>Titel</h3>
    <p>Korte omschrijving.</p>
  </div>
  <a class="hover-card__link" href="/case/titel">Bekijk case: Titel</a>
</div>

<script type="module">
  import { init } from './hover-set.js';
  const destroy = init(document.body); // { maxTilt?: number }
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js**

```tsx
import { HoverSet, HoverCard } from '@/component-library/cards/hover-set/HoverSet';

<HoverSet>
  <HoverCard hover="lift" href="/case/website" title="Website op maat" description="…" image="/case.jpg" />
</HoverSet>
```

## Markup-contract

- Kaart: `.hover-card[data-hover="…"]`. De module zelf doet niets met deze
  klasse behalve (voor `tilt`) `--tilt-x`/`--tilt-y` erop zetten.
- **Stretched-link (verplicht, per kaart precies één):** `.hover-card__link`
  is een `<a href="…">` met CSS `position:absolute; inset:0`. Geef hem een
  toegankelijke naam die de bestemming noemt (`Bekijk case: Titel`), zichtbaar
  of via `aria-label` — de kop in `.hover-card__body h3` toont de titel al
  visueel, dus de linktekst zelf mag (via CSS) onzichtbaar zijn. Zet **geen**
  tweede interactief element in de kaart: dat ligt onder de stretched-link en
  is dan niet meer los klikbaar.
- `arrow`: extra `<span class="hover-card__arrow" aria-hidden="true">→</span>`
  in `.hover-card__cta`.
- `corners`: vier `<span class="hover-card__corner hover-card__corner--tl|tr|bl|br" aria-hidden="true">`,
  direct kind van `.hover-card`.
- `grow`: kaarten zitten in een `.hover-row` (flex-container); elke kaart
  krijgt `flex: 1 1 0%` en groeit bij hover/focus naar `flex-grow: 3`
  (bij 3 kolommen: 33% → 50%, bij Webstijn's Monkey Fiets hetzelfde principe).

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `maxTilt` | `6` | Maximale kantelhoek in graden voor `data-hover="tilt"`. |

CSS-variabelen (op `.hover-card`):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--hc-radius` | `1rem` | Hoekradius van de kaart. |
| `--hc-border` | `#e3ded0` | Randkleur. |
| `--hc-shadow` | zie CSS | Schaduw bij hover/focus. |
| `--hc-duration` | `0.4s` | Transitieduur. |
| `--hc-ease` | `cubic-bezier(.22,1,.36,1)` | Easing. |
| `--hc-accent` | `#2f6fed` | Kleur van hoekhaken, focus-outline, cta-tekst. |

## Toegankelijkheid

- **Eén link, geen JS-klik op een div.** Tab bereikt de kaart via de echte
  `<a>`; Enter activeert hem zoals elke link. `:focus-visible` op die link
  triggert (via CSS `:has()`) dezelfde stijl als `:hover`, dus toetsenbord-
  gebruikers zien hetzelfde signaal als muisgebruikers (R14).
  Focus-outline: 2px, `outline-offset: 3px`.
- **Touch krijgt geen plakkende hover (R3).** Alle `:hover`-regels staan
  achter `@media (hover: hover) and (pointer: fine)`. Wat hover laat zien is
  puur decoratief (geen verborgen content), dus een tik bereikt dezelfde
  bestemming zonder de hover-flair te missen.
- **Minder beweging (R1).** Onder `prefers-reduced-motion: reduce` staat elke
  transition- en animation-duur op ~0 — de eindstand (bv. de gegroeide kolom,
  de zichtbare hoekhaken) verschijnt direct in plaats van geanimeerd, en de
  regel reageert live als de bezoeker het middenin omzet.
- **Decoratie is `aria-hidden`**: de pijl en de vier hoekhaken dragen geen
  informatie, dus `aria-hidden="true"`.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/hover-set/`.
2. Enqueue met `wp_enqueue_style()` voor de CSS en `wp_enqueue_script_module()`
   (WP ≥ 6.5) voor `hover-set.js` — zie de WordPress-stappen in
   `scroll/reveal-on-scroll/README.md` voor het exacte patroon (geen
   versienummer op de module-enqueue, anders dubbele fetch).
3. Plaats de kaart-markup in een Custom HTML-blok of template, roep
   `init(document.body)` aan na `DOMContentLoaded`.

## Valkuilen

- **Twee interactieve elementen in één kaart** breekt de stretched-link: het
  tweede element ligt visueel boven de link maar de link ligt er als laatste
  in de DOM-volgorde overheen (hogere `z-index`) en vangt de klik alsnog, of
  andersom als je de volgorde omdraait ligt het tweede element boven de link
  en is de rand van de kaart niet meer klikbaar. Hou het bij één link per
  kaart.
- **`tilt` zonder `perspective`** oogt plat — de CSS zet `perspective(900px)`
  altijd mee met de `rotateX/rotateY`, verwijder die niet los.
- **`grow` buiten een flex-container** doet niets: `flex-grow` heeft alleen
  effect binnen `.hover-row` (of een eigen `display:flex`-ouder).

## Herkomst

Technieken gezien bij Webstijn-klantsites (`research/webstijn/OVERZICHT.md`):
Monkey Fiets Service (kaart groeit 33% → 50% via `flex-grow` bij hover),
Sloopteam (hoekhaken-hover op kaarten/knoppen), en het slide-in pijltje bij
Zwaartafelen/Mardoors. Eigen implementatie, geen code overgenomen — de exacte
transition-duur/easing van Monkey Fiets en de hoekmaten van Sloopteam stonden
niet in het onderzoek; die zijn hier een eigen, redelijke keuze. Wat wij beter
doen: de hele kaart is één toegankelijke stretched-link met werkende
`:focus-visible`-pariteit (bij Webstijn zelf niet gemeten), en alle hover
staat achter `(hover: hover)` zodat touch geen plakkende hover krijgt.
