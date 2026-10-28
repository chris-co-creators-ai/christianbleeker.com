# kleur-configurator

Kleur kiezen = de productfoto wisselt. Kleurstalen zijn een gewone
`<input type="radio">`-groep (pijltjestoetsen werken dus vanzelf), de nieuwe
foto wordt eerst vooraf geladen en dan pas ingekruist, en de keuze komt in de
URL (`?kleur=`) én in een verborgen formulierveld terecht — inclusief naam en
meerprijs.

## Wanneer wel

- Eén product in meerdere kleuren/afwerkingen, met één foto per variant.
- Als de gekozen kleur ergens anders nodig is: in een bestelformulier
  (verborgen veld) of als deelbare link (`?kleur=`).

## Wanneer niet

- Voor meerdere onafhankelijke variant-assen tegelijk (kleur **en** maat
  **en** materiaal) — dit component regelt er één; combineer meerdere
  instances of bouw een eigen laag erbovenop.
- Voor tientallen kleuren met visueel vergelijkbare stalen: dan wil je
  waarschijnlijk ook kleurnamen als tooltip/label, niet alleen een gekleurde
  stip (dit component toont overigens al een tekstlabel per staal, zie de
  demo).

## Installatie

```
component-library/tools/kleur-configurator/
├── kleur-configurator.js      # vanilla ES-module, 0 dependencies
├── kleur-configurator.css     # namespaced op [data-kleur-*]/.kc-*
├── KleurConfigurator.tsx        # React/Next.js client-wrapper
├── demo.html                    # zelfstandige demo (Opmaet-stoel)
└── test/meet.mjs                # Playwright-meting
```

**Vanilla / elk framework**

```html
<div data-kleur-configurator>
  <div data-kleur-foto>
    <!-- src = de foto van de standaard-aangevinkte kleur (zelfde bestand als
         diens data-kleur-src hieronder) — zonder JS wordt src nergens gezet,
         dus zonder deze standaardwaarde toont de browser een kapot-beeldicoon (R4). -->
    <img data-kleur-img alt="Product, gekozen kleur" src="/foto-wit.jpg" />
  </div>
  <fieldset>
    <legend>Kies een kleur</legend>
    <div role="radiogroup" aria-label="Kleur">
      <label>
        <input type="radio" name="kleur-keuze" value="wit" data-kleur-src="/foto-wit.jpg" data-kleur-label="Wit" data-kleur-prijs="0" checked />
        Wit
      </label>
      <label>
        <input type="radio" name="kleur-keuze" value="zwart" data-kleur-src="/foto-zwart.jpg" data-kleur-label="Zwart" data-kleur-prijs="25" />
        Zwart
      </label>
    </div>
  </fieldset>
  <p data-kleur-naam></p>
  <p data-kleur-meerprijs></p>
  <input type="hidden" name="kleur" data-kleur-hidden />
</div>

<link rel="stylesheet" href="./kleur-configurator.css" />
<script type="module">
  import { init } from './kleur-configurator.js';
  const destroy = init(document.querySelector('[data-kleur-configurator]'));
</script>
```

**React / Next.js**

```tsx
import { KleurConfigurator } from '@/component-library/tools/kleur-configurator/KleurConfigurator';

<KleurConfigurator>
  <div data-kleur-foto><img data-kleur-img alt="Product" src="/wit.jpg" /></div>
  <div role="radiogroup" aria-label="Kleur">
    <label>
      <input type="radio" name="kleur-keuze" value="wit" data-kleur-src="/wit.jpg" data-kleur-label="Wit" data-kleur-prijs="0" checked />
      Wit
    </label>
  </div>
  <p data-kleur-naam />
  <p data-kleur-meerprijs />
  <input type="hidden" name="kleur" data-kleur-hidden />
</KleurConfigurator>
```

## Markup-contract

- `[data-kleur-img]` — verplicht, de productfoto. Geef een echte `src` mee
  die overeenkomt met de standaard-aangevinkte kleur (L6/R4): zonder JS wordt
  er nergens een `src` gezet, dus zonder standaardwaarde toont de browser een
  kapot-beeldicoon.
- Radiogroep: gewone `<input type="radio">`'s (zelfde `name`) met
  `data-kleur-src` (foto), `data-kleur-label` (weergavenaam) en
  `data-kleur-prijs` (getal, euro's — `0` = geen meerprijs). Bewust andere
  namen dan de weergave-elementen hieronder — anders matcht dezelfde
  selector zowel de radio's als de uitvoer.
- `[data-kleur-naam]` / `[data-kleur-meerprijs]` — optioneel, tonen de naam
  en meerprijs van de actieve keuze.
- `[data-kleur-hidden]` — optioneel, een `<input type="hidden">` die de
  gekozen `value` krijgt — geef hem een eigen `name` (niet dezelfde als de
  radiogroep, anders staat dezelfde naam twee keer in je `<form>`, zie de
  demo: radio's heten `kleur-keuze`, het verborgen veld heet `kleur`).

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `queryParam` | `"kleur"` | Naam van de querystring-parameter (`?kleur=…`). |
| `formatMeerprijs` | `(n) => n > 0 ? "+ €…" : "Geen meerprijs"` | Formatteert het getal uit `data-kleur-prijs` (op de radio) tot de tekst in `[data-kleur-meerprijs]` (de uitvoer). |

## Gedrag

- **Startkeuze**: `?kleur=` in de URL wint van de al aangevinkte radio in de
  markup — deel een link met een kleur erin, en die kleur staat al aan.
- **Preloaden + crossfade**: bij een wissel wordt de nieuwe foto eerst als
  los `Image()`-object geladen; pas als die klaar is, faden we de zichtbare
  foto uit, wisselen de `src`, en faden weer in (220ms). Zo is er nooit een
  kapotte-afbeelding-flits of een lege foto tijdens het laden.
- **Bij `prefers-reduced-motion: reduce`**: de foto wisselt direct, zonder
  fade (wel nog steeds voorafgaand geladen, dus geen flits van een kapotte
  afbeelding).
- **URL-sync** via `history.replaceState` (geen nieuwe entries in de
  back-button-geschiedenis per kleurwissel).

## Toegankelijkheid

- De radiogroep is een gewone native `<input type="radio">`-groep: Tab
  bereikt de groep, pijltjestoetsen bewegen én selecteren binnen de groep,
  Spatie werkt op de eerste focus — allemaal gratis, browser-native gedrag
  (R14).
- Elke `.kc-swatch-dot` is decoratief (`aria-hidden="true"`); de betekenisvolle
  tekst staat in `.kc-swatch-label` naast de stip.
- `focus-visible` op de radio toont een zichtbare outline rond de stip (via
  `:focus-visible + .kc-swatch-dot`).

## Valkuilen

- **Zelfde `name` voor de radiogroep én het verborgen veld** levert een
  `<form>` met twee formulierwaarden onder dezelfde naam op — geef ze
  bewust verschillende namen (zie Markup-contract).
- **Een kapotte foto-URL crasht niet**: bij een preload-fout (`onerror`)
  wordt de `src` alsnog gewisseld (de browser toont dan zijn eigen "kapotte
  afbeelding"-icoon) in plaats van dat de configurator blijft hangen op de
  vorige foto zonder enige terugkoppeling.
- **`data-kleur-prijs` is een getal, geen valutastring** — de module
  formatteert het zelf (via `formatMeerprijs`); zet er geen "€"-teken in de
  markup bij, anders formatteert de standaardfunctie het dubbel.

## Op WordPress

Zelfde patroon als `reveal-on-scroll`: bestanden in het thema, laden via
`wp_enqueue_script_module()`, `init()` na `DOMContentLoaded`. De
`data-kleur-src`/`data-kleur-label`/`data-kleur-prijs`-attributen kun je
uit WooCommerce-productvarianten renderen.

