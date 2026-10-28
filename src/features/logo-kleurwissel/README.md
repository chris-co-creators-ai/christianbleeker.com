# logo-kleurwissel

Een vast SVG-logo met `currentColor` wisselt van kleur zodra het boven een sectie met
`data-logo="licht"` hangt. Geen scroll-listener: een IntersectionObserver met een `rootMargin`
op de hoogte van het logo. Ook als het mobiele menu open staat klopt de kleur.

## Wanneer wel
- Een logo (of menubalk) in de header dat over lichte en donkere secties schuift.
- Als de blend-variant (`effects/blend-logo`, mix-blend-mode) te onrustig oogt of per sectie een vaste kleur nodig is.

## Wanneer niet
- Het logo staat niet vast (fixed of sticky): dan is er niets om te wisselen.
- Als je logo boven video hangt: een sectiewissel helpt niet als de video zelf licht en donker is.

## Installatie
```
effects/logo-kleurwissel/  logo-kleurwissel.js · logo-kleurwissel.css · LogoKleurwissel.tsx · demo.html · test/meet.mjs
```

**Vanilla**
```html
<link rel="stylesheet" href="./logo-kleurwissel.css" />
<a class="logo-kleurwissel" id="logo" href="/" aria-label="Studio Wester, naar de voorpagina" style="position:fixed;top:1rem;left:1rem">
  <svg viewBox="0 0 172 28" aria-hidden="true" focusable="false">…paths met fill=currentColor…</svg>
</a>
<section data-logo="licht">…donkere sectie…</section>
<script type="module">
  import { init } from './logo-kleurwissel.js';
  const destroy = init(document.getElementById('logo'));
</script>
```

**React / Next.js**
```tsx
import { LogoKleurwissel } from '@/component-library/effects/logo-kleurwissel/LogoKleurwissel';
<LogoKleurwissel label="Studio Wester" href="/" className="mijn-header-logo"><svg …/></LogoKleurwissel>
```

**WordPress**: geef het logo-element de klasse `logo-kleurwissel`, zet `data-logo="licht"` op de donkere
Gutenberg-groepen (Geavanceerd, aanvullende attributen via een plugin of eigen blok) en laad de module met `type="module"`.

## Markup-contract
- Logo-element met klasse `.logo-kleurwissel`, `position: fixed` of `sticky`. De SVG tekent met `fill="currentColor"` (of `stroke`).
- `data-logo="licht"` op een sectie betekent: het logo wordt **licht** (je zet het dus op donkere secties). Elk andere waarde of geen attribuut: donker.
- Menu: de knop met `aria-expanded` krijgt `data-logo-menu-knop`, het paneel `data-logo-menu="licht"` (of `"donker"`). Staat de knop op `aria-expanded="true"`, dan wint het paneel van de sectie eronder.
- Kleuren via `--lk-donker`, `--lk-licht`, duur via `--lk-duur` (0,3 s).
- Het logo moet boven het menupaneel liggen (z-index), anders zie je hem niet.

## Opties
| Optie | Standaard | Werking |
|---|---|---|
| `secties` | `[data-logo]` | selector voor de secties |
| `menuKnop` | `[data-logo-menu-knop]` | knop met `aria-expanded` |
| `menuPaneel` | `[data-logo-menu]` | paneel met de kleur |

## Toegankelijkheid
- Naam via `aria-label` op de link; de SVG is `aria-hidden`.
- Contrast: kies `--lk-licht` en `--lk-donker` zo dat ze 4,5:1 halen tegen de secties waar ze op staan.
- Bij minder beweging wisselt de kleur direct, zonder overgang.
- Zonder JS blijft het logo in de standaardkleur staan (bruikbaar, niet gewisseld).

## Valkuilen
- De band wordt bepaald op de plek van het logo bij `init` en bij elke resize. Verplaats je het logo met een eigen script, bel dan `destroy()` en `init()` opnieuw.
- Het logo wisselt zodra het midden van het logo in de sectie valt, niet zodra de rand eraan raakt; een logo dat half over de rand hangt heeft dus één kleur.
- Staat een sectie met `data-logo` in een geneste scrollcontainer, dan kijkt de observer naar het venster, niet naar die container.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
