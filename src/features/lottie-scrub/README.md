# lottie-scrub

Het frame van een Lottie hangt aan de scrollpositie van een element. Scroll je omlaag, dan tekent hij verder; scroll je terug, dan tekent hij terug. Typisch: een footer-logo dat zich tekent terwijl de footer in beeld komt. Een korte naloop (0,8 s) maakt het zacht.

Buiten beeld rendert hij niet. Bij "minder beweging" en zonder JS staat er het statische eindbeeld.

## Wanneer wel

- Een logo, beeldmerk of lijntekening die "af" moet zijn als de bezoeker onderaan is: footer, afsluitende CTA.
- Een uitlegtekening die met de tekst meegroeit (een route die zich tekent naast de stappen).
- Lijnwerk. Stroke-tekeningen met trim paths scrubben het mooist.

## Wanneer niet

- Voor een icoon dat vanzelf moet spelen (in beeld = afspelen): dat is `media/lottie-icon`.
- Voor Lotties met veel lagen, beelden of effecten: elk scrollframe rendert opnieuw. Houd het onder ±50 KB JSON en zonder rasterbeelden.
- Als de animatie iets vertelt dat de bezoeker zonder scrollen moet zien. Bij minder beweging staat er alleen het eindbeeld.

## Installatie

```
media/lottie-scrub/
├── lottie-scrub.js          vanilla ES-module (importeert de Lottie-speler lui)
├── lottie-scrub.css
├── LottieScrub.tsx          React/Next.js-wrapper
├── animaties/               wester-logo.json + .svg + maak.mjs (demo-logo, generator)
├── demo.html
└── test/meet.mjs
```

De speler staat als eigen kopie in `vendor/lottie_light.min.js` (lottie-web 5.13 light, MIT; dezelfde als bij `media/lottie-icon`). De JS laadt hem met een letterlijke `import('./vendor/lottie_light.min.js')`, zodat een bundler hem kan volgen en het pad ook in een platte kopie klopt. Kopieer de hele map, `vendor/` mee.

**Vanilla**

```html
<link rel="stylesheet" href="./lottie-scrub.css" />
<div data-lottie-scrub data-lottie-src="/animaties/logo.json" role="img" aria-label="Studio Wester" style="--ls-ratio: 500 / 125">
  <img data-lottie-scrub-fallback src="/animaties/logo.svg" alt="" width="500" height="125">
</div>
<script type="module">
  import { init } from './lottie-scrub.js';
  document.querySelectorAll('[data-lottie-scrub]').forEach((el) => init(el));
</script>
```

**React / Next.js**

```tsx
import { LottieScrub } from '@/component-library/media/lottie-scrub/LottieScrub';

<LottieScrub src="/animaties/logo.json" fallbackSrc="/animaties/logo.svg" breedte={500} hoogte={125} eind={0.92} label="Studio Wester" />
```

**WordPress**

1. Zet `media/lottie-scrub/` (met `vendor/`) in je thema.
2. `wp_enqueue_style` voor de CSS, `wp_enqueue_script_module()` (WP 6.5+) voor de JS, zonder versienummer (`null`).
3. De markup hierboven in een Custom HTML-blok, of in `footer.php`. Gebruik absolute paden naar de JSON en de SVG.
4. Een klein moduleblok in `wp_footer` dat `init()` per element aanroept.

## Markup-contract

| Wat | Waar | Verplicht |
|---|---|---|
| `data-lottie-scrub` | root | ja |
| `data-lottie-src` | root | ja (of optie `src`) |
| `<img data-lottie-scrub-fallback>` | in root | ja: het **laatste frame** als SVG, voor zonder JS en minder beweging |
| `--ls-ratio` | root, inline | aanbevolen: breedte / hoogte van de animatie (standaard 4 / 1) |
| `role="img"` + `aria-label` | root | als het beeld iets betekent (logo); anders `aria-hidden="true"` |
| `data-lottie-scrub-start` / `-eind` / `-naloop` | root | optioneel, zie Opties |

Door de JS gezet: `data-lottie-scrub-klaar` (speler heeft een frame), `data-lottie-scrub-stil` (minder beweging) en een `.ls-stage`-div met de Lottie-SVG.

## Opties

| Optie | Attribuut | Standaard | Wat |
|---|---|---|---|
| `src` | `data-lottie-src` | — | Pad naar de JSON (relatief aan de pagina). |
| `start` | `data-lottie-scrub-start` | `1` | Waar de bovenkant van het element staat bij frame 0, als deel van de schermhoogte. 1 = onderkant scherm. |
| `eind` | `data-lottie-scrub-eind` | `0` | Waar de onderkant staat bij het laatste frame. 0 = bovenkant scherm. Kan de pagina niet zo ver scrollen, dan is onderaan de pagina het eind. |
| `naloop` | `data-lottie-scrub-naloop` | `0.8` | Seconden die de animatie nodig heeft om de scroll in te halen. 0 = direct. |

## Toegankelijkheid

- Minder beweging: de speler laadt niet; het statische eindbeeld blijft staan. Zet de bezoeker het halverwege om, dan springt de Lottie naar zijn laatste frame en scrubt niet meer (R1).
- Een logo krijgt `role="img"` en een `aria-label` op de root; de `<img>` zelf heeft `alt=""`, zodat een schermlezer het één keer noemt.
- Niets is klikbaar of focusbaar.

## Valkuilen

- **De terugval moet het laatste frame zijn**, niet frame 0. Anders ziet een bezoeker met minder beweging een leeg vlak. `animaties/maak.mjs` laat zien hoe je JSON en SVG uit één definitie schrijft.
- **Footer-logo onderaan de pagina.** Met `eind: 0` haalt een logo onderaan nooit zijn laatste frame (de pagina houdt op). De module vangt dat af door het eind naar onderaan de pagina te verschuiven; `eind` iets onder 1 (bijv. 0.92) voelt meestal het best.
- **Lazy loading in een scrollcontainer** (een modal met eigen scroll) werkt niet: de module luistert naar het venster.
- **Zware Lotties** renderen bij elke scrollstap. Meet het op een middenklasse-telefoon.

## Herkomst

Eigen implementatie van Seveke Creative; het patroon is gezien bij meerdere bureausites. Code, teksten en
getallen zijn eigen werk.
