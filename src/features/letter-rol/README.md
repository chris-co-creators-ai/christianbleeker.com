# letter-rol

Bij hover of toetsenbordfocus rolt de tekst van een knop of link letter voor
letter omhoog en komt een kopie van onder. De kopie is de `text-shadow` van
dezelfde letter, dus er is geen dubbele tekst in de DOM. Zonder JS en bij
"minder beweging" blijft het gewone tekst.

## Wanneer wel
- Primaire knoppen en menulinks waar je beweging wilt zonder de tekst te veranderen.
- Korte teksten (één regel, tot ±25 tekens).

## Wanneer niet
- Lange of meerregelige tekst: de rol knipt op één regel.
- Meer dan ±8 plekken per scherm; het wordt onrustig.

## Installatie
```
buttons/letter-rol/  letter-rol.js · letter-rol.css · LetterRol.tsx · demo.html · test/meet.mjs
```

**Vanilla**
```html
<link rel="stylesheet" href="./letter-rol.css" />
<a class="btn" href="/contact"><span data-letter-rol>Plan een kennismaking</span></a>
<script type="module">
  import { init } from './letter-rol.js';
  const destroy = init(document.body); // { selector?, stagger? }
</script>
```

**React / Next.js**
```tsx
import { LetterRol } from '@/component-library/buttons/letter-rol/LetterRol';
<LetterRol href="/contact" className="btn">Plan een kennismaking</LetterRol>
```

**WordPress**: zet de CSS in het thema, laad de module met `type="module"`, en geef de
tekstspan in je knopblok het attribuut `data-letter-rol`.

## Markup-contract
- `data-letter-rol` staat op een **span binnen** de `<a>` of `<button>`. Padding, rand en
  achtergrond horen op de knop; de span knipt zijn eigen regel af. Zet je het attribuut
  rechtstreeks op een knop zonder padding, dan werkt dat ook.
- Alleen platte tekst in de span.
- Tweede kleur voor de kopie: `--lr-kleur-2` (standaard dezelfde kleur).

## Opties
| Optie | Standaard | Werking |
|---|---|---|
| `selector` | `[data-letter-rol]` | welke elementen geknipt worden |
| `stagger` | `0.23` | totale spreiding (s) over alle letters |

CSS-variabelen: `--lr-duur` (0,32 s), `--lr-ease` (cubic-bezier 0,76 · 0 · 0,24 · 1,
power4.inOut), `--lr-regel` (1,3em, regelhoogte én rolafstand), `--lr-kleur-2`.

## Toegankelijkheid
- Geen `aria-label`: de volle tekst staat als `.lr-sr` (schermlezertekst) in de knop, de letters zijn `aria-hidden`. Zo bevat de toegankelijke naam altijd de zichtbare tekst (WCAG 2.5.3).
- Werkt bij `:focus-visible`. Hover alleen waar `(hover: hover)` geldt, dus geen kleverige hover op touch.
- Bij `prefers-reduced-motion: reduce` knipt de module niet en de CSS zet transform en shadow uit; live omschakelen werkt.
- Een `aria-label` dat jij zelf op de knop zet, blijft ongemoeid (zet er dan dezelfde tekst in).

## Valkuilen
- Gradient- of `-webkit-text-fill-color`-tekst: `text-shadow` volgt die niet. Zet dan `--lr-kleur-2`.
- `--lr-regel` moet groter zijn dan de glyphhoogte, anders sneuvelen staarten van g en j. 1,3em is veilig voor de meeste fonts.
- Verandert React de tekst, dan moet `init` opnieuw lopen; de wrapper doet dat bij wijziging van `children`.

