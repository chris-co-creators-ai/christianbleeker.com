# schreef-accent

Zet je een woord in een kop tussen `<em>`, dan wordt het een italic schreefletter
(Instrument Serif Italic) in de kleur van de kop. Een strakke schreefloze kop krijgt
zo één woord met karakter. Het is alleen CSS. De `.js` doet niets en bestaat omdat
elk onderdeel in de bibliotheek dezelfde vorm heeft.

## Wanneer wel

- Koppen in een schreefloze letter waarin één of twee woorden de nadruk krijgen,
  zoals "Van eerste schets *naar iets* waar je elke dag mee werkt".
- Sites waar de redactie zelf koppen schrijft (CMS, WordPress). Ze hoeven alleen
  italic aan te zetten, zonder klassen.

## Wanneer niet

- Lopende tekst. Standaard geldt de regel alleen voor `h1`–`h6`. Een `<em>` in een alinea
  blijft een gewone cursief, en dat is goed zo.
- Als de kop zelf al een schreefletter is: het contrast is dan weg.
- Meer dan een paar woorden per kop. Een hele zin in de schreef leest als een
  stijlbreuk en niet meer als nadruk.

## Installatie

```
typography/schreef-accent/
├── schreef-accent.css    # de hele werking
├── schreef-accent.js     # no-op init/destroy (vaste vorm)
├── SchreefAccent.tsx     # React-wrapper
├── fonts/                # Instrument Serif Italic (woff2) + OFL.txt
├── demo.html
└── test/meet.mjs
```

**Vanilla**

```html
<link rel="stylesheet" href="./schreef-accent.css" />
<main data-schreef-accent>
  <h2>Drie dingen die <em>altijd</em> meegaan</h2>
</main>
```

**React / Next.js**

```tsx
import { SchreefAccent } from '@/component-library/typography/schreef-accent/SchreefAccent';

<SchreefAccent as="h2">Drie dingen die <em>altijd</em> meegaan</SchreefAccent>
```

**WordPress**: zet `fonts/` en `schreef-accent.css` in je thema, laad de CSS met
`wp_enqueue_style()` en zet `data-schreef-accent` op de content-wrapper (bijvoorbeeld
`<main>` in `single.php`), of zet het attribuut op een Groep-blok via "Geavanceerd →
HTML-anker/aanvullende attributen". Daarna wordt elke cursieve kop in Gutenberg
vanzelf de schreefletter. Er is geen script nodig.

## Markup-contract

- `data-schreef-accent` op een kop (`<h2 data-schreef-accent>`) of op een container
  erboven. Daarbinnen telt elke `<em>` in een `h1`–`h6`.
- Geen klassen nodig. Kleur komt van de kop (`color: inherit`).
- `data-schreef-accent="alles"`: dan telt elke `<em>` in dat element, ook buiten
  koppen. Bedoeld voor een grote intro-zin die geen kop is, zoals in
  `scroll/eyebrow-lijn`. Zet het niet op een hele pagina, want dan wordt ook de
  cursief in lopende tekst een schreef.

## Opties (CSS-variabelen op de `em`)

| Variabele | Standaard | Wat |
|---|---|---|
| `--sa-font` | `"Instrument Serif", "Iowan Old Style", Georgia, serif` | De schreefletter. |
| `--sa-schaal` | `1.1em` | Grootte ten opzichte van de kop. Instrument Serif heeft een lagere x-hoogte; met 1.1em staan de kleine letters optisch gelijk. |
| `--sa-spatiering` | `-0.005em` | Letterafstand. Koppen hebben vaak een negatieve spatiëring die de schreef te krap maakt. |

## Toegankelijkheid

- `<em>` blijft `<em>`: schermlezers die nadruk uitspreken, doen dat nog steeds.
- Geen beweging, dus niets te doen voor "minder beweging".
- Contrast is gelijk aan dat van de kop, want de kleur is dezelfde.

## Valkuilen

- **Nep-vet.** Koppen staan vaak op 600–700, en van de schreef bestaat alleen 400.
  Zonder `font-weight: 400` en `font-synthesis: none` maakt de browser er een
  uitgesmeerde nepvette letter van. Beide staan in de CSS.
- **Opgerekte regel.** Een em van 1.1em zou de regelhoogte van de kop oprekken.
  Daarom heeft hij `line-height: 0`. De meting vergelijkt de kophoogte met en zonder
  accent: gelijk.
- **Font laadt pas als er een em is.** De browser haalt het woff2-bestand (22 KB)
  pas op als er een kop met `<em>` op de pagina staat. Er is geen preload nodig.
- **Inschuiven bij in beeld komen** zit er bewust niet in. Een `transform` werkt
  niet op een inline element. Met `inline-block` kan het wel, maar dan breekt een
  em van meerdere woorden niet meer over twee regels. Wil je beweging op de hele
  kop, combineer dan met `scroll/reveal-on-scroll`.

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.
