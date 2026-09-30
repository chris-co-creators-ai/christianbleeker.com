# tab-title-lokker

Zodra de bezoeker naar een ander tabblad wisselt, wisselt de titel van dit
tabblad (en optioneel het favicon) tussen de originele titel en een
lokzin — bedoeld om de aandacht terug te trekken zonder opdringerig te
worden. Bij terugkomst staat alles direct weer op het origineel.

## Wanneer wel

- Sites/tools waar het waardevol is dat een bezoeker die is afgedwaald
  terugkomt (een sessie die nog loopt, een winkelwagen, een formulier in
  bewerking) — de titel is de enige zichtbare plek als het tabblad
  minimaal of op de achtergrond staat.

## Wanneer niet

- Op elke pagina van elke site — dit is een bewust incidenteel trucje,
  geen standaard-gedrag. Overweeg goed of het bij het merk past (kan als
  opdringerig/clickbait overkomen als de lokzin te opzichtig is).
- Meerdere keren per sessie een ándere lokzin tonen om op te vallen — dat
  is precies het soort patroon dat bezoekers leert de titel te negeren.

## Installatie

```
component-library/effects/tab-title-lokker/
├── tab-title-lokker.js      # vanilla ES-module, 0 dependencies
├── tab-title-lokker.css     # bewust (bijna) leeg — geen zichtbare DOM, zie het bestand zelf
├── TabTitleLokker.tsx       # React/Next.js client-wrapper
├── demo.html                 # zelfstandige demo
└── test/meet.mjs             # Playwright-meting
```

**Vanilla / elk framework**

```html
<script type="module">
  import { init } from './tab-title-lokker.js';
  const destroy = init(document);
  // destroy() bij opruimen (idempotent) — herstelt titel/favicon meteen
</script>
```

**React / Next.js (App Router)**

```tsx
import { TabTitleLokker } from '@/component-library/effects/tab-title-lokker/TabTitleLokker';

// Eén keer, hoog in de boom (bv. root-layout) — rendert niets zichtbaars:
<TabTitleLokker lokzin="Je koffie wordt koud ☕" />
```

## Markup-contract

- Geen DOM-vereisten. `init(root, opties)` accepteert `document` zelf als
  `root` (of een willekeurig element — de module gebruikt dat alleen om
  bij het juiste `document`/`window` te komen, bv. in een iframe-scenario).
  Er wordt niets aan de pagina toegevoegd of verwijderd; alleen
  `document.title` en (optioneel) het `href`-attribuut van
  `<link rel="icon">` wisselen.

## Opties (`init(root, opties)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `lokzin` | `"Je koffie wordt koud ☕"` | Tekst die afwisselt met de originele titel. |
| `interval` | `1200` | Tijd in ms tussen elke wissel, zolang het tabblad verborgen is. |
| `favicon` | `null` | URL/data-URI voor een tweede favicon. `null` = favicon blijft ongemoeid. Vereist een bestaande `<link rel="icon">` in de pagina — ontbreekt die, dan wisselt alleen de titel (met een `console.warn`). |

## Toegankelijkheid

- Geen zichtbare/interactieve UI op de pagina zelf — er is niets om te
  focussen, te klikken of over te struikelen.
- **R1, minder beweging**: bij `prefers-reduced-motion: reduce` wisselt de
  titel **één keer** naar de lokzin zolang het tabblad verborgen is, en
  blijft daarna stabiel (geen doorlopend knipperen). Reageert ook live op
  een wissel van de voorkeur terwijl het tabblad al verborgen is.
- Titelwisselingen zijn voor schermlezers niet relevant — de titel van een
  achtergrondtabblad wordt sowieso niet voorgelezen terwijl de gebruiker
  ergens anders is; bij terugkomst staat de originele titel er weer, dus
  er is geen inconsistentie voor ondersteunende technologie.

## Op WordPress

Geen build-stap nodig.

```
wp-content/themes/<jouw-thema>/component-library/tab-title-lokker/
└── tab-title-lokker.js
```

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_script_module(
		'tab-title-lokker-module',
		get_stylesheet_directory_uri() . '/component-library/tab-title-lokker/tab-title-lokker.js',
		array(),
		null
	);
} );
```

```html
<script type="module">
  import { init } from '/wp-content/themes/<jouw-thema>/component-library/tab-title-lokker/tab-title-lokker.js';
  document.addEventListener('DOMContentLoaded', () => {
    init(document);
  });
</script>
```

## Valkuilen

- **Meerdere `init()`-aanroepen tegelijk** overschrijven elkaars "originele
  titel" niet bewust — de tweede instantie onthoudt als origineel wat de
  eerste er op dat moment had staan. Gebruik dit maar één keer per pagina.
- **`document.title` elders in de app aanpassen** terwijl de lokker actief
  is (bv. een route-wissel in een SPA die de titel update) kan verwarrend
  overlappen met het knipperen. Roep bij een titelwissel eerst `destroy()`
  aan en start daarna opnieuw met de nieuwe titel als uitgangspunt.
- **Favicon-optie zonder bestaande `<link rel="icon">`**: de module crasht
  niet (R5), maar wisselt dan alleen de titel — zet altijd een
  `<link rel="icon">` in de `<head>` als je de favicon-optie gebruikt.

## Performance

Eén `visibilitychange`-listener en, alleen zolang het tabblad verborgen
is, één `setInterval` — geen scroll-/pointerhandlers, geen
`requestAnimationFrame`. Bij terugkomst wordt de interval direct gestopt.

## Herkomst

Generieke, bekende "come back"-titelwissel-techniek — geen specifieke
referentie. Eigen implementatie, met de frequentie-/reduced-
motion-bouwstenen uit de gedeelde `basis.js` zodat hij aan dezelfde
kwaliteitsregels voldoet als de rest van de bibliotheek (met name: geen
knipperen bij minder beweging).
