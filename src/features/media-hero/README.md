# media-hero

Hero met bewegend achtergrondbeeld, in twee varianten: een **achtergrondvideo**
(met mobiele bron, poster en een zichtbare pauzeknop) of een **Ken
Burns-diashow** (fade + langzame zoom). Beide pauzeren automatisch zodra de
hero buiten beeld scrolt, het tabblad verborgen is, of de bezoeker
`prefers-reduced-motion: reduce` heeft ingesteld — en altijd met een
tekstkaart die het contrast garandeert, ook boven een lichte foto of video.

## Wanneer wel

- De hero van een dienstverlener/bedrijf die met sfeerbeeld wil openen:
  ambacht, horeca, vastgoed, wellness.
- Je hebt een korte, silent-loopende clip (geen belangrijke audio) of 3–6
  sterke foto's voor de diashow.

## Wanneer niet

- Niet als het achtergrondbeeld zelf informatie draagt die nergens anders
  staat (ondertitels/transcript ontbreken hier bewust — dit is decoratief
  sfeerbeeld, geen instructievideo).
- Niet voor meer dan één hero per pagina — twee bewegende hero's tegelijk is
  onrustig en kost dubbel zoveel bandbreedte.
- Video met belangrijke audio: gebruik dan een los, klikbaar te starten
  videoblok (niet dit component — deze video is altijd `muted`).

## Installatie

```
component-library/heroes/media-hero/
├── media-hero.js       # vanilla ES-module, 0 dependencies
├── media-hero.css      # namespaced op .mh, geen globale selectors
├── MediaHero.tsx        # React/Next.js client-wrapper
├── demo.html            # zelfstandige demo (video + diashow + contrast-testfixture)
└── test/meet.mjs        # Playwright-meting
```

### Vanilla — videomodus

```html
<link rel="stylesheet" href="./media-hero.css" />
<div class="mh" data-media-hero data-modus="video" style="--mh-aspect: 16 / 7;">
  <div class="mh__stage">
    <video class="mh__video" muted playsinline preload="metadata" poster="poster.jpg" autoplay aria-hidden="true">
      <source media="(max-width: 640px)" src="hero-mobiel.mp4" type="video/mp4" />
      <source src="hero-desktop.mp4" type="video/mp4" />
    </video>
    <img class="mh__poster" src="poster.jpg" alt="" fetchpriority="high" aria-hidden="true" />
    <div class="mh__overlay" aria-hidden="true"></div>
  </div>
  <button type="button" class="mh__pauze" data-mh-pauze aria-pressed="false">Pauzeer achtergrond</button>
  <div class="mh__inhoud">
    <h1>Titel</h1>
    <p>Korte toelichting.</p>
  </div>
</div>
<script type="module">
  import { init } from './media-hero.js';
  const destroy = init(document.querySelector('#hero'), { modus: 'video' });
</script>
```

### Vanilla — diashowmodus

Zelfde markup, maar `data-modus="diashow"` en een reeks `.mh__dia`-afbeeldingen
i.p.v. `<video>`. Geef de **eerste** afbeelding `fetchpriority="high"` (LCP),
de rest `loading="lazy"`:

```html
<div class="mh" data-media-hero data-modus="diashow" style="--mh-dia-duur: 6s;">
  <div class="mh__stage">
    <img class="mh__dia is-actief" src="1.jpg" alt="" fetchpriority="high" />
    <img class="mh__dia" src="2.jpg" alt="" loading="lazy" />
    <img class="mh__dia" src="3.jpg" alt="" loading="lazy" />
    <div class="mh__overlay" aria-hidden="true"></div>
  </div>
  <button type="button" class="mh__pauze" data-mh-pauze aria-pressed="false">Pauzeer achtergrond</button>
  <div class="mh__inhoud">…</div>
</div>
<script type="module">
  import { init } from './media-hero.js';
  init(document.querySelector('#hero'), { modus: 'diashow', diaInterval: 6000 });
</script>
```

Zet één afbeelding vooraf op `is-actief` (server-rendered, geen flits vóór
JS laadt).

### React / Next.js (App Router)

```tsx
import { MediaHero } from '@/component-library/heroes/media-hero/MediaHero';

<MediaHero
  modus="video"
  poster="/hero/poster.jpg"
  bronnen={[
    { src: '/hero/mobiel.mp4', media: '(max-width: 640px)' },
    { src: '/hero/desktop.mp4' },
  ]}
>
  <h1>Titel</h1>
  <p>Korte toelichting.</p>
</MediaHero>
```

### Op WordPress

Geen build-stap nodig — zie `reveal-on-scroll`-README voor de
`wp_enqueue_script_module()`-aanpak (zelfde patroon, geen versienummer op
de module-enqueue). Zet de video/afbeeldingen in de theme-uploads en verwijs
er met een absoluut pad naar; de markup hierboven werkt ongewijzigd in een
Custom HTML-blok of een pagina-template.

## Markup-contract

- Root: `.mh[data-media-hero][data-modus="video"|"diashow"]`.
- `.mh__stage`: bepaalt de hoogte via `aspect-ratio` (CSS-variabele
  `--mh-aspect`, standaard `16/9`) — **niet** via het laden van de
  video/afbeelding (R19, geen CLS).
- Videomodus: `.mh__video` (met `<source media="…">` vóór de bron zonder
  `media` — die laatste is de standaardbron) + `.mh__poster`
  (`fetchpriority="high"`, dit is het LCP-beeld).
- Diashowmodus: reeks `.mh__dia`, exact één met de klasse `is-actief` bij
  page-load (server-rendered fallback vóór JS). Eerste `.mh__dia`
  `fetchpriority="high"`, de rest `loading="lazy"`.
- `[data-mh-pauze]`: de pauzeknop — een `<button type="button">`, geen link
  (WCAG 2.2.2 Pause, Stop, Hide: altijd zichtbaar, nooit alleen-op-hover).
- `.mh__inhoud`: de tekstkaart. Alles wat leesbaar moet zijn hoort **hierin**
  — buiten de kaart plaatsen laat het contrast afhangen van het
  achtergrondbeeld, wat de garantie doorbreekt.
- JS zet `[data-mh-status="speelt"|"gepauzeerd"]` op de root. Zonder JS
  ontbreekt dit attribuut en speelt de video native af via het
  `autoplay`-attribuut (of blijft de eerste `.mh__dia` gewoon staan).

## Opties

`init(root, opties)`:

| Optie | Standaard | Omschrijving |
|---|---|---|
| `modus` | `data-modus`-attribuut, anders `"video"` | `"video"` of `"diashow"`. |
| `diaInterval` | `6000` | Alleen diashow: ms tussen wisselingen. |

`MediaHero`-props (React): `modus` (verplicht), `poster`, `bronnen`
(videomodus, array van `{ src, media?, type? }`), `dias` (diashowmodus,
array van `{ src, alt? }`), `diaInterval`, `aspectRatio`, `children`
(inhoud van de kaart).

## Toegankelijkheid

- **Pauzeknop (WCAG 2.2.2).** Een `<button>`, altijd zichtbaar (niet
  alleen-op-hover), met `aria-pressed` dat de staat weergeeft en een
  zichtbare focusring (`:focus-visible`, 2px). Werkt met Tab + Enter/Spatie
  (native buttongedrag, geen custom key-handling nodig).
- **Contrast (R16).** `.mh__inhoud` is een ondoorzichtige kaart
  (`rgba(10,15,31,.85)`), geen doorzichtige gradient. Bij witte tekst
  (relatieve luminantie 1) en een volledig wit beeld erachter — het
  slechtste geval — is de gemengde achtergrondluminantie
  `(1-.85)×1 = .15`, dus contrastratio `(1.05)/(.15+.05) = 5,25 : 1`: boven
  de eis van 4,5:1, ook in het slechtste geval. Gemeten in `test/meet.mjs`
  op een witte testfixture (zie `demo.html` → "Contrast-testfixture").
- **`prefers-reduced-motion: reduce`.** Video wordt nooit gestart (of
  meteen gepauzeerd als de voorkeur tijdens het bezoek wisselt); de
  diashow-animatie (`@keyframes mh-kenburns`) staat uit via een
  `@media`-blok in de CSS én de JS start geen wisseltimer.
- **Decoratie.** Video, poster-`<img>` en diashow-`<img>`'s hebben
  `aria-hidden="true"` (of een lege `alt=""`) — het zijn sfeerbeelden, geen
  content die een schermlezer moet voorlezen. Staat er wél
  content-dragende tekst in beeld (bv. een logo-overlay), zet die dan als
  echte tekst in `.mh__inhoud`, niet in de afbeelding.

## Valkuilen

- **`autoplay` + `muted` + `playsinline` moeten alle drie aanwezig zijn**
  op `<video>`, anders weigeren de meeste browsers autoplay (en zonder JS
  blijft dan alleen de poster staan — geen ramp, maar minder "wow").
- **Eén `<source>` zonder `media`-attribuut, als laatste.** De
  browser doorloopt de `<source>`-elementen in volgorde en kiest de eerste
  met een matchende (of ontbrekende) `media`-query — zet de specifieke
  (mobiele) bron dus vóór de algemene.
- **De pauzeknop wint van "weer in beeld".** Een handmatige pauze blijft
  staan totdat de bezoeker zelf weer op de knop klikt — scrollt de hero
  opnieuw in beeld, dan hervat hij niet vanzelf. Dat is bewust: anders kan
  een bezoeker een video nooit écht stopzetten.
- **Ken Burns-duur en dia-interval loskoppelen kan een sprong geven.** Zet
  `--mh-dia-duur` (CSS) gelijk aan `diaInterval` (JS, in ms) — anders is de
  zoom nog niet klaar (of allang klaar en dus stilstaand) op het moment dat
  de volgende dia binnenkomt.
- **`fetchpriority="high"` hoort maar op één beeld** (het LCP-beeld: de
  poster in videomodus, de eerste dia in diashowmodus) — op alle
  afbeeldingen zetten maakt de prioriteit betekenisloos.

## Herkomst

Achtergrondvideo en Ken Burns-diashow komen op bureausites veel voor.
Elementor bouwt dit via `background_video_link`/`background video` en
`background slideshow` + `ken_burns`-instelling; geen code overgenomen. Wat
wij beter doen: een expliciete, geteste pauzeknop-plus-status-machine (uit
beeld → handmatig → reduced-motion, met de juiste voorrang), en een
contrast-kaart met een uitgerekende worst-case-garantie i.p.v. een
gok-gradient — Elementor's ingebouwde overlay-optie is een vaste
kleur/opacity zonder die garantie.
