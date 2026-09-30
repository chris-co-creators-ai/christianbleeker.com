# beeld-letters

Een grote kop waarvan de letters gevuld zijn met een foto of video, met
optioneel een typemachine ("Creatie" → "Ontwerp" → "Beeldtaal") met een eigen
knipperend cursorteken ("/") en een beeld dat langzaam meedrijft of met de muis
meebeweegt. De tekst blijft echte, selecteerbare tekst in de markup.

## Wanneer wel

- Eén opvallende kop bovenaan een pagina of sectie, waar het beeld het merk draagt.
- Een kop met een of enkele woorden per regel, in een zwaar lettertype (gewicht 700–800): dunne letters laten te weinig beeld zien.

## Wanneer niet

- Lange koppen of lopende tekst: het beeld verdwijnt in kleine letters en het contrast is niet te garanderen.
- Een licht beeld op een lichte pagina wordt door de tint donkerder gemaakt (dat is de prijs van leesbaarheid); wil je het beeld ongeroerd, zet dan `--bl-donker: 0` en `minContrast: 0` en zorg zelf voor contrast.
- Niet naast `typography/rotating-headline` voor hetzelfde doel: die wisselt één woord in een gewone kop (kleur, geen beeld). `gradient-text` vult met een verloop, `letter-reveal` laat letters inkomen; deze feature is de enige met echte foto/video in de letters en getypte woorden.

## Installatie

```
component-library/typography/beeld-letters/
├── beeld-letters.js     # vanilla ES-module, 0 dependencies
├── beeld-letters.css    # namespaced op data-attributen
├── BeeldLetters.tsx     # React/Next.js client-wrapper
├── demo.html            # Studio Wester: foto-kop met typen + video-kop
├── media/               # demobeelden (foto, video, poster)
└── test/meet.mjs        # Playwright-meting (99 asserts)
```

**Vanilla**

```html
<link rel="stylesheet" href="./beeld-letters.css" />
<div data-beeld-letters data-bl-woorden="Creatie|Ontwerp|Beeldtaal" data-bl-beweging="drijf"
     style="--bl-beeld: url('duinen.jpg'); --bl-terug: #7c2d12">
  <h1 data-bl-kop><span class="voor">Studio Wester staat voor</span> <span data-bl-woord>Creatie</span></h1>
</div>
<script type="module">
  import { init } from './beeld-letters.js';
  const destroy = init(document.querySelector('[data-beeld-letters]'));
</script>
```

Stel lettergrootte, gewicht en `letter-spacing` zelf in op de kop (`font-size: clamp(...)`, `font-weight: 800`).

**React / Next.js**

```tsx
import { BeeldLetters } from '@/component-library/typography/beeld-letters/BeeldLetters';

<BeeldLetters voor="Studio Wester staat voor" woord="Creatie" woorden={['Ontwerp', 'Beeldtaal']}
  beeld="/duinen.jpg" terug="#7c2d12" beweging="drijf" kopClassName="groot" />

<BeeldLetters als="h2" woord="Beeld in beweging" terug="#7c2d12"
  video={{ src: '/golven.webm', srcMobiel: '/golven-mobiel.webm', poster: '/golven-poster.jpg' }} />
```

**WordPress**: zet de markup in een HTML-blok, laad CSS en module via `wp_enqueue_style` / `wp_enqueue_script_module`, en zet de lettergrootte in de themastijl.

## Markup-contract

- Wrapper `[data-beeld-letters]`: hierop `data-bl-woorden` (`Woord|Woord|…`, het eerste is de tekst in de markup), `data-bl-beweging` (`drijf` | `muis` | `uit`), `data-bl-cursor` en de CSS-variabelen.
- Kop `[data-bl-kop]` (h1/h2): staat de volledige, echte tekst. Optioneel `[data-bl-woord]` om alleen dat woord te vullen (de rest blijft gewone tekst).
- Foto: `--bl-beeld: url(...)`. Video: `data-bl-video` op de wrapper en een `<video data-bl-video-bron muted loop playsinline preload="none" poster="…" data-bl-src="…" data-bl-src-mobiel="…" aria-hidden="true">` vóór de kop. Donkere pagina: `data-bl-thema="donker"`.
- CSS-variabelen: `--bl-beeld`, `--bl-terug` (terugvalkleur), `--bl-rand` + `--bl-rand-breedte` (omlijning), `--bl-cursor-kleur`, `--bl-donker` (tintsterkte 0–1, standaard .2, zonder JS) en `--bl-tint` (`r g b`, standaard `24 12 6`; lichte tint voor een donkere pagina), `--bl-schaal` (beeldbreedte, standaard 135%), `--bl-drijf-duur`, `--bl-lh` (regelhoogte, standaard 1.05).
- Na `init` staat in de kop een `.bl__sr` (de volledige tekst, één keer) en een `aria-hidden` laag `.bl__zicht` met het zichtbare woord.

## Opties (`init(root, opties)`)

| Optie | Standaard | Betekenis |
|---|---|---|
| `woorden` | uit `data-bl-woorden` | woorden om te typen; leeg = geen typemachine, alleen de vulling |
| `cursor` | `"/"` | cursorteken; `""` = geen |
| `typSnelheid` | 95 | ms per getypte letter |
| `wisSnelheid` | 55 | ms per gewiste letter |
| `wachtNa` | 1800 | ms stilstand als het woord af is |
| `wachtVoor` | 380 | ms tussen wissen en typen |
| `lus` | `true` | na het laatste woord opnieuw beginnen |
| `minContrast` | 3 | minimaal contrast van de vulling met de paginakleur voor ≥ 98% van de beeldpixels (0 = uit); zie Toegankelijkheid |
| `beweging` | `uit` | `drijf` (langzaam heen en weer), `muis` (volgt de muis, niet op touch) |

`init` geeft `destroy()` terug: herstelt de markup exact, idempotent.

## Toegankelijkheid

- Schermlezers krijgen de volledige kop één keer ("Studio Wester staat voor Creatie", gemeten in de toegankelijkheidsboom). De getypte laag, cursor en maten zijn `aria-hidden`; het cursorteken zit in CSS (`content`) en komt dus nooit in gekopieerde of voorgelezen tekst. De andere getypte woorden zijn decoratie: zet wat een zoekmachine of lezer moet weten in de kop zelf.
- Contrast (R16) van de vulling zelf, niet alleen van de terugvalkleur: over het beeld ligt een tint (`--bl-tint`, standaard bijna zwart, sterkte `--bl-donker`, standaard .2, zonder JS) in dezelfde `background` met `background-clip: text`; bij video ligt dezelfde tint tussen video en kop. De optie `minContrast` (standaard 3, de WCAG-norm voor grote tekst; 0 = uit) meet het echte beeld, bij video ook af en toe een beeldje tijdens het spelen, en zet `--bl-donker` op het minimum (stappen van 0,025) waarbij ≥ 98% van de beeldpixels de norm haalt met 5% marge; bij video alleen omhoog tijdens het spelen, dus geen geflikker. De tint is dus nooit zwaarder dan nodig. Voorwaarden: het beeld is van hetzelfde domein of heeft CORS (anders blijft de CSS-standaard gelden), en de paginakleur is de eerste dekkende achtergrond boven de wrapper. Gemeten uit echte schermpixels op de uiterste standen van het drijvende beeld: zie de tabel hieronder. Kies je een eigen foto, dan doet de bewaking het werk; de standaard 3:1 is voor koppen vanaf ±24px vet, voor kleinere tekst zet je `minContrast: 4.5`.
- Terugvalkleur: `--bl-terug` ligt als `background-color` onder het beeld. Faalt de foto, dan blijft de letter in die kleur (met de tint erover, dus donkerder) staan; demo `#7c2d12`.
- Omlijning: `--bl-rand` + `--bl-rand-breedte` (bijvoorbeeld donker en 1px) als extra houvast op foto's; bij video werkt alleen een lichte omlijning.
- Minder beweging (ook live): geen typen, geen drijvend beeld, geen cursor, de video speelt niet (poster), het eerste woord staat er volledig.
- Zonder JS: de volledige kop met dezelfde beeldvulling; bij video de poster in de letters.
- Windows-hoog-contrast (`forced-colors`): gewone systeemtekstkleur.
- Het typen pauzeert als de kop uit beeld is en bij een verborgen tabblad; de video pauzeert uit beeld en laadt pas bij (bijna) in beeld.

## Contrast gemeten (demo, letterpixels via masker-screenshot)

Twee screenshots per stand (letters zwart op wit als masker, en zoals de bezoeker het ziet); per letterpixel de WCAG-verhouding tegen de paginakleur. Norm in `test/meet.mjs`: ≥ 3:1 voor ≥ 90% van de letterpixels. Voor de bewaking was de eerste demo: mediaan 2,4–3,2:1, 61–99% onder 4,5:1. Nu, desktop en mobiel 390, vijf standen van het drijvende beeld: 92,5–100% ≥ 3:1 met mediaan 4,6–6,2:1 (tint 0,33; de test eist ook mediaan ≤ 7:1, zodat het beeld niet onnodig dichtgesmeerd wordt); video op drie tijdstippen: 98% ≥ 3:1, mediaan 4,9–5,1:1 (tint 0,17–0,20). Met `minContrast: 6` (tint 0,6): 92–99,6% haalt 6:1. Voor video kies je een beeld in middentonen: een bijna zwarte video geeft een egaal donkere kop, een bijna witte vraagt een zware tint.

## Valkuilen

- **Cursor en CLS.** Een cursor die in de tekststroom achter de getypte tekst staat, verspringt bij elke letter en telt als layout-shift (eerste versie: CLS 0,3 in 5 s). Nu staat hij absoluut en schuift met een `transform`; de breedte en hoogte van de kop liggen vast doordat alle woorden als onzichtbare maat in dezelfde gridcel staan. Gemeten CLS: 0.
- **Video in letters.** `background-clip: text` kan geen video vullen. We gebruiken een blend-lus (video onder een witte kop met zwarte tekst en `mix-blend-mode: screen`, het geheel `multiply` op de pagina). Het werkt op elke lichte paginakleur; op donker gebruik `data-bl-thema="donker"`. Een SVG-mask is afgevallen: een mask uit een SVG-afbeelding gebruikt het webfont van de pagina niet, dus de vorm klopt niet met de echte tekst. Zet niets met een eigen achtergrond of eigen stapelcontext direct achter de kop.
- **Negatieve letterspatiëring** laat de laatste letter buiten het vak steken; de CSS geeft de vulling daarom rechts 0,08em ruimte.
- **Video-lus**: een lus die niet naadloos is, springt zichtbaar; lever een naadloze loop.
- **Achtergrondpositie animeren** (drijven) is geen `transform`: het beeld zit in de letters, dus alleen het letteroppervlak wordt opnieuw geschilderd. Gebruik het op één of twee koppen, niet op tientallen.
- `basis.js` `minderBeweging().reduced` is een momentopname; deze feature volgt de wissel zelf via de callback.
- Meet een eigen foto met de lettergrootte die je gebruikt: bij een smalle kop moet de foto minstens zo hoog zijn als de letters (`--bl-schaal` past de breedte aan).

## Herkomst

Eigen implementatie; patroon gezien bij meerdere bureausites: een kop die wordt getypt, met letters die gevuld zijn met een foto (`background-clip: text`) en een knipperende "/" als cursor. Zonder typed.js. Schermlezertekst één keer, terugvalkleur en contrast gemeten, minder beweging live, pauze uit beeld en op een verborgen tabblad, CLS 0, en een video-variant.
