# justify-fill

Een kop die precies de volle breedte vult, per regel — zonder de bekende
`::after`-truc. Woorden per regel komen in een eigen flex-rij
(`justify-content: space-between`); de browser verdeelt de ruimte, geen
handmatige letter-spacing-berekening. Robuust bij resize (regels worden
herberekend) en bij fontload (`document.fonts.ready` vóór de eerste meting).

## Wanneer wel

- Een impactvolle, korte kop (1–4 regels) die de volle breedte van zijn
  kolom moet innemen — een magazine-achtig effect.

## Wanneer niet

- Niet voor lopende tekst/alinea's — dit is voor een kop, niet voor body-
  tekst (bij lange tekst wordt de uitrekking per regel te grillig).
- Niet bij een kop die vaak client-side van tekst wisselt zonder de
  component opnieuw te initialiseren — roep dan `destroy()` + `init()`
  opnieuw aan bij een tekstwissel (zie Valkuilen).

## Installatie

```
component-library/typography/justify-fill/
├── justify-fill.js      # vanilla ES-module, 0 dependencies
├── justify-fill.css     # namespaced op [data-justify-fill]
├── JustifyFill.tsx      # React/Next.js client-wrapper
├── demo.html              # zelfstandige demo
└── test/meet.mjs          # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./justify-fill.css" />
<h1 data-justify-fill>Studio Wester bouwt websites die precies passen bij wat jij nodig hebt</h1>

<script type="module">
  import { init } from './justify-fill.js';
  const destroy = init(document.querySelector('[data-justify-fill]'));
</script>
```

**React / Next.js (App Router)**

```tsx
import { JustifyFill } from '@/component-library/typography/justify-fill/JustifyFill';

<JustifyFill as="h1">Studio Wester bouwt websites die precies passen bij wat jij nodig hebt</JustifyFill>
```

## Markup-contract

- Root: element met `data-justify-fill`, **platte tekst als enige inhoud**
  (geen geneste HTML — die gaat bij `init()` verloren, de module leest
  `textContent` en herschrijft de hele inhoud tot `.jf__line`/`.jf__word`).
- Na `init()`: elke regel wordt een `.jf__line` (flex-rij), elk woord een
  `.jf__word` erbinnen. De tekst zelf verandert niet — alleen de opmaak
  eromheen — dus een schermlezer leest gewoon dezelfde zin.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `lastLine` | `true` | Ook de laatste regel volledig uitvullen. `false` = laatste regel van nature links uitgelijnd (`.jf__line--loose`). |

## Toegankelijkheid

- **Tekst blijft tekst**: de module verandert geen letters, voegt niets
  onzichtbaars toe — alleen `<span>`-wrappers om woorden/regels. Een
  schermlezer leest de zin normaal voor.
- **Geen animatie/beweging** in deze feature — R1 is niet van toepassing.
- **Toetsenbord**: n.v.t., geen interactief element.

## Op WordPress

Geen build-stap. CSS + `justify-fill.js` in het thema,
`wp_enqueue_style()` + `wp_enqueue_script_module()`, `init()` per kop na
`DOMContentLoaded`. Zie `scroll/reveal-on-scroll/README.md` voor het
volledige WordPress-recept.

## Valkuilen

- **Alleen platte tekst** — bevat de kop een `<span>` met een merkkleur of
  een `<br>`, dan gaat die opmaak verloren zodra `init()` de tekst herleest
  en herschrijft. Voor gekleurde nadruk: pas de kleur toe via CSS op
  `.jf__word:nth-child(n)` ná initialisatie, niet in de brontekst.
- **Tekst dynamisch wisselen** (bv. in React bij een prop-wijziging): roep
  `destroy()` en daarna opnieuw `init()` aan (de React-wrapper doet dit al
  automatisch via de `useEffect`-dependency op `children`) — de module leest
  de tekst maar één keer, bij `init()`.
- **`lineHeight`/`fontWeight` die tussentijds wijzigen** (bv. via een eigen
  CSS-animatie op de kop) kunnen de regelverdeling laten afwijken tot de
  volgende `resize`-hertelling; roep zo nodig zelf `destroy()`+`init()` aan
  na zo'n wijziging.
- **Eén woord op de laatste regel**: kan niet "uitgevuld" worden (er is maar
  één flex-item, niets om ruimte tussen te verdelen) — dat is inherent aan
  de techniek, geen bug.

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.
