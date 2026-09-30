# marker-highlight

Een woord of woordgroep in een kop krijgt een markeerstreep die van links naar
rechts inloopt zodra hij in beeld komt. Puur CSS (`background-size` 0 naar
100%) plus één IntersectionObserver. De streep breekt mee over regels, het
contrast wordt gemeten en zonder JS of bij minder beweging staat hij er meteen.

Anders dan `handwritten-accent` (een getekende onderstreping) is dit een
vlak achter de tekst; anders dan `gradient-text` kleurt het de letters niet.

## Wanneer wel
- Eén sleutelwoord of korte woordgroep per kop ("klanten opleveren").
- Koppen waar je de aandacht wilt sturen zonder extra beeld.

## Wanneer niet
- Hele alinea's of meer dan één markering per kop: dan is niets meer belangrijk.
- Kleuren waarbij de tekst er slecht op leesbaar is; de module waarschuwt, maar lost het niet op.

## Installatie
```
typography/marker-highlight/
  marker-highlight.js   marker-highlight.css   MarkerHighlight.tsx
```
**Vanilla**
```html
<link rel="stylesheet" href="./marker-highlight.css" />
<h1>Websites die <mark data-marker>klanten opleveren</mark></h1>
<script type="module">
  import { init } from './marker-highlight.js';
  const destroy = init(document.body); // destroy() bij opruimen
</script>
```
**React / Next.js**
```tsx
import { MarkerHighlight } from '@/component-library/typography/marker-highlight/MarkerHighlight';
<MarkerHighlight hoogte="half" kleur="#f4d35e">
  <h1>Websites die <mark data-marker>klanten opleveren</mark></h1>
</MarkerHighlight>
```
**WordPress**: zet de CSS via `wp_enqueue_style`, de JS via `wp_enqueue_script_module`, en markeer in de editor met "HTML bewerken" (`<mark data-marker>`). Zet `--mh-tekst` op de tekstkleur van je thema.

## Markup-contract
- `<mark data-marker>` of `<strong data-marker>` (elk inline element mag).
- `data-marker="half"` = onderste helft, `"regel"` of leeg = hele regel.
- `data-marker-kleur`, `data-marker-vertraging` (seconden), `data-marker-ruw`, `data-marker-schuin` per element.
- CSS-variabelen: `--mh-kleur`, `--mh-tekst`, `--mh-hoogte`, `--mh-duur`, `--mh-vertraging`.

## Opties (`init(root, opties)`)
| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `[data-marker]` | Te markeren elementen binnen root |
| `kleur` | `#f4d35e` (CSS) | Markeerkleur |
| `hoogte` | `regel` | `regel` of `half` |
| `vertraging` | `0` | Seconden |
| `duur` | `0.8` | Seconden looptijd |
| `ruw` | `false` | Ruwe stiftrand (SVG) |
| `schuin` | `0` | Schuinte van de ruwe rand, 0-8 (% breedte) |
| `once` | `true` | Niet opnieuw lopen bij terug-scrollen |
| `threshold` | `0.6` | IntersectionObserver-drempel |

`import { meetContrast, contrastRatio } from './marker-highlight.js'` levert de meting ook los.

## Toegankelijkheid
- Contrast wordt bij `init` gemeten (WCAG): minimaal 4,5:1, of 3:1 voor grote tekst (>= 24 px, of >= 18,66 px vet). Onder de norm volgt een `console.warn`. Een deels transparante markeerkleur wordt over de achtergrond heen gerekend. Kleuren die niet naar sRGB-rgb vertalen (oklch e.d.) worden niet gemeten.
- Bij half-hoogte staat de tekst deels op de streep en deels op de pagina; meet dus ook je paginakleur.
- `prefers-reduced-motion`: streep staat er direct, ook als de bezoeker dit halverwege omzet (live).
- Zonder JS staat de streep er meteen. De tekst staat altijd gewoon in de HTML.

## Valkuilen
- Het animeert `background-size`, niet `transform`: nodig zodat de streep over regelafbrekingen meebreekt. Het is een paint-only animatie op een kort stuk tekst; gebruik dit niet voor tientallen markeringen tegelijk.
- Bij een regelafbreking lopen alle regelstukken tegelijk in (`box-decoration-break: clone`), niet na elkaar.
- Een `<mark>` heeft standaard een gele browserachtergrond; `marker-highlight.css` zet die op transparant.
- Stel je `--mh-tekst` niet in, dan erft de tekst de kleur van de kop; op een donkere sectie dus lichte tekst op de markeerkleur.
- De ruwe rand is een gerekte SVG: bij zeer lange markeringen wordt de ruwheid ook uitgerekt.

## Herkomst
Eigen implementatie; patroon gezien bij meerdere bureausites: teal vlak onder `<strong>` in de kop, `background-size` 0 naar 100% in 0,8 s. Toegevoegd: contrastmeting met waarschuwing, hoogte-keuze, ruwe SVG-rand, live minder-beweging en `destroy()`.

## Meten
`node typography/marker-highlight/test/meet.mjs` (bewijs: `test/bewijs/`).
