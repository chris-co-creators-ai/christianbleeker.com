# floating-contact-card

Zwevend "Snel contact"-kaartje (telefoon + openingsregel + CTA) dat met een
negatieve bovenmarge over de rand van een hero heen zweeft. Op mobiel geen
overlap: daar staat de kaart gewoon in de paginaflow.

## Wanneer wel

- Direct onder een hero, om de aandacht meteen naar een contactmoment te
  trekken zonder dat de bezoeker eerst helemaal naar beneden hoeft te
  scrollen.
- In combinatie met `badges/open-status` voor een levende openingsregel
  ("Nu open · sluit om 17:00") — zie demo.html voor hoe je ze samen
  gebruikt (twee losse `init()`-aanroepen, dit component importeert
  open-status niet zelf).

## Wanneer niet

- Niet over een hero-afbeelding met belangrijke tekst/gezichten in de
  onderste strook — kies dan een grotere `data-overlap`-marge, of laat de
  kaart gewoon niet zweven (verwijder `data-vermijd`/de negatieve marge).
- Niet op een pagina zonder hero: zonder iets om "over de rand" van te
  zweven oogt de negatieve marge willekeurig.

## Installatie

```
component-library/conversion/floating-contact-card/
├── floating-contact-card.js      # vanilla ES-module, 0 dependencies
├── floating-contact-card.css     # namespaced op .fcc
├── FloatingContactCard.tsx        # React/Next.js client-wrapper
├── demo.html                      # zelfstandige demo (incl. open-status-compositie)
└── test/meet.mjs                  # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./floating-contact-card.css" />
<section class="hero">
  <h1 data-hero-kop>…</h1>
</section>
<div class="fcc" data-floating-contact-card data-overlap="4rem" data-vermijd="[data-hero-kop]">
  <span class="fcc__label">Snel contact</span>
  <a class="fcc__telefoon" href="tel:+31612345678">085 - 123 45 67</a>
  <p class="fcc__openingsregel">Nu open · sluit om 17:00</p>
  <a class="fcc__cta" href="#offerte">Offerte aanvragen</a>
</div>
<script type="module">
  import { init } from './floating-contact-card.js';
  const destroy = init(document.querySelector('[data-floating-contact-card]'));
  // destroy() bij opruimen
</script>
```

**React / Next.js**

```tsx
import { FloatingContactCard } from '@/component-library/conversion/floating-contact-card/FloatingContactCard';

<FloatingContactCard
  telefoon="+31612345678"
  telefoonLabel="085 - 123 45 67"
  openingsregel="Nu open · sluit om 17:00"
  ctaHref="#offerte"
  ctaLabel="Offerte aanvragen"
  vermijd="[data-hero-kop]"
/>
```

## Markup-contract

- Root: het kaartje zelf, met `data-floating-contact-card`, geplaatst direct
  ná de hero in de HTML (de negatieve marge trekt hem visueel omhoog, de
  volgorde in de HTML blijft "na de hero").
- `data-overlap="4rem"` (optioneel) — hoever de kaart over de hero-rand
  zweeft, **als JS geladen is**. Zonder JS geldt de kleine, veilige
  standaardwaarde uit `floating-contact-card.css` (`--fcc-overlap: 1.5rem`)
  — dat IS de zonder-JS-fallback (R4). Wil je een grotere overlap, zet 'm
  dan zowel in `data-overlap` als (voor de zonder-JS-situatie) in je eigen
  CSS via `--fcc-overlap` op het element.
- `data-vermijd="[data-hero-kop]"` (optioneel) — CSS-selector van het
  tekstelement dat nooit bedekt mag raken. De module is hier een **vangnet**:
  hij meet ná render of de kaart dit element toch overlapt (bv. door een
  langere vertaling die meer regels beslaat) en verkleint dan de overlap
  stap voor stap tot het niet meer zo is.
- `data-breakpoint="768"` (optioneel, standaard 768) — onder deze
  viewportbreedte vervalt de overlap altijd (CSS, `@media (max-width: …)`),
  de kaart staat dan gewoon in de flow.

## Opties (`init(root, opties)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `overlap` | `data-overlap` of `"4rem"` | Overlap als CSS-lengte, toegepast zodra JS draait (zonder JS geldt de CSS-standaard `1.5rem`, zie hierboven). |
| `vermijd` | `data-vermijd` | CSS-selector van het te beschermen tekstelement. |
| `breakpoint` | `data-breakpoint` of `768` | Boven deze breedte (px) is de overlap actief. |

## Toegankelijkheid

- Telefoonlink en CTA zijn gewone `<a>`'s: bereikbaar met Tab, zichtbare
  focus (`:focus-visible`).
- Geen visuele truc die de leesvolgorde verandert: de kaart staat in de
  HTML gewoon ná de hero, `z-index`/negatieve marge zijn puur visueel.

## Op WordPress

Geen build-stap nodig.

1. Zet de map in je thema: `wp-content/themes/<thema>/component-library/floating-contact-card/`.
2. Enqueue de CSS, laad `floating-contact-card.js` met
   `wp_enqueue_script_module()` (geen versienummer — zie
   `scroll/reveal-on-scroll/README.md` "Op WordPress").
3. Plaats de markup direct ná je hero-template-part.

## Valkuilen

- **`data-vermijd` wijst naar een element dat niet bestaat**: de module
  slaat de defensieve aanpassing dan stil over — de statische
  `data-overlap`-waarde blijft gewoon staan. Test dus altijd ook met de
  standaardwaarde of die op zichzelf al veilig is (R4).
- **Een hero zonder vaste hoogte** (bv. puur tekst-gedreven, hoogte
  varieert sterk per taal/lengte) kan de overlap bij een lange kop toch
  laten schuren — daarvoor is `data-vermijd` bedoeld, geef hem altijd mee
  als de hero-kop kan variëren.
- **`--fcc-overlap` ook door eigen CSS laten zetten**: mag, maar dan
  overschrijft de module dat bij `init()` met `data-overlap` — houd ze
  gelijk of gebruik alleen het attribuut.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
