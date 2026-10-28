# gradient-flow

Bewegend pastel-gradiëntveld ("lavaflow"): 3–4 vage kleurblobs die langzaam
ronddrijven achter een gedeelde blur. Alleen `transform` animeert (R18) —
geen `background-position`, geen layout-eigenschappen — en het veld
pauzeert vanzelf zodra het buiten beeld scrolt of het tabblad verborgen is.

**Ander middel dan `backgrounds/aurora-dream-css`.** Aurora is één statische
laag: vier gestapelde `radial-gradient()`'s op één `<div>`, geen animatie,
geen JS, geen DOM-kinderen. `gradient-flow` is vier losse, geblurde
blob-elementen die continu (traag) bewegen, met JS die de animatie actief
pauzeert wanneer hij niet gezien wordt — nodig omdat het hier, anders dan
bij aurora, om een doorlopende GPU-animatie gaat. Gebruik aurora voor een
goedkope, statische sfeerlaag; gebruik dit voor een achtergrond die
merkbaar "leeft".

## Wanneer wel

- Een hero, sectie-achtergrond of wachtscherm dat rustig moet ademen zonder
  concrete vorm — geen illustratie, geen foto, wél beweging.
- Merken met een zachte, pastel signatuur (wellness, kinderopvang, coaching).

## Wanneer niet

- Niet achter tekst zonder extra contrastmaatregel — dit is een véél
  lichtere, vager gradiëntveld dan `heroes/media-hero`'s videocontrast-
  kaart; zet tekst op een eigen ondoorzichtige achtergrond als hij feitelijk
  moet zijn (deze CSS garandeert zelf geen contrast).
- Niet meer dan één of twee velden per pagina — elk veld blijft continu
  (traag) animeren zolang het in beeld is; te veel tegelijk kost GPU-tijd
  zonder extra effect.
- Niet als "premium abstract" doel — zie ook de eigen notitie in
  `backgrounds/gradient-mesh-ogl/README.md`: voor LWD-klantsites is een
  shader/WebGL-variant vaak te abstract; dit CSS-only veld is zachter en
  past breder.

## Installatie

```
component-library/backgrounds/gradient-flow/
├── gradient-flow.js      # vanilla ES-module, 0 dependencies
├── gradient-flow.css     # namespaced op .gf, geen globale selectors
├── GradientFlow.tsx       # React/Next.js client-wrapper
├── demo.html              # zelfstandige demo (2 velden, elk eigen pauze-instantie)
└── test/meet.mjs          # Playwright-meting
```

### Vanilla

```html
<link rel="stylesheet" href="./gradient-flow.css" />
<div style="position: relative; isolation: isolate; min-height: 24rem;">
  <div class="gf" data-gradient-flow aria-hidden="true">
    <div class="gf__veld">
      <span class="gf__blob gf__blob--1"></span>
      <span class="gf__blob gf__blob--2"></span>
      <span class="gf__blob gf__blob--3"></span>
      <span class="gf__blob gf__blob--4"></span>
    </div>
  </div>
  <div style="position: relative; z-index: 1;">
    <h1>Titel over het veld</h1>
  </div>
</div>
<script type="module">
  import { init } from './gradient-flow.js';
  const destroy = init(document.querySelector('.gf'));
</script>
```

Zonder JS beweegt het veld gewoon door (de CSS start de animatie zelf) —
alleen de "pauze buiten beeld/tabblad" mist dan. Dat is een performance-
optimalisatie, geen zichtbaar gedrag: content blijft gewoon zichtbaar (R4).

### React / Next.js (App Router)

```tsx
import { GradientFlow } from '@/component-library/backgrounds/gradient-flow/GradientFlow';

<div style={{ position: 'relative', isolation: 'isolate', minHeight: '24rem' }}>
  <GradientFlow kleuren={['#ffece2', '#f2ecff', '#e2fcff', '#ffe2f0']} />
  <div style={{ position: 'relative', zIndex: 1 }}>
    <h1>Titel over het veld</h1>
  </div>
</div>
```

### Op WordPress

Geen build-stap nodig — zie `reveal-on-scroll`-README voor de
`wp_enqueue_script_module()`-aanpak. De markup hierboven werkt ongewijzigd
in een Custom HTML-blok of een sectie-achtergrond-template.

## Markup-contract

- `.gf[data-gradient-flow]` moet zelf `position: absolute; inset: 0;` innemen
  (zit al in de CSS) — plaats hem als **eerste kind** van een ouder met
  `position: relative` (of andere positioning-context) én `isolation:
  isolate` (voorkomt dat de blur-laag buiten de ouder lekt).
- `.gf__veld` bevat 3 of 4 `.gf__blob`-elementen — lege `<span>`'s, geen
  content, geen kinderen nodig.
- Content die over het veld moet staan: eigen `position: relative; z-index:
  1` (of hoger) op een broer-element van `.gf`.
- `.gf` heeft zelf `aria-hidden="true"` in de markup (geen inhoud, dus geen
  JS-gate nodig zoals bij `float-decor`).

## Opties

`init(root)` — geen tweede argument nodig, de module observeert alleen
zichtbaarheid.

CSS-variabelen op `.gf`:

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--gf-basis` | `#faf7f2` | Achtergrondkleur achter de blobs. |
| `--gf-kleur-1..4` | perzik / lavendel / cyaan / roze | Kleur per blob. |
| `--gf-duur` (per `.gf__blob--N`) | 24–34s | Duur van de drift-animatie van die blob. |

`GradientFlow`-props (React): `kleuren` (array van 4 CSS-kleuren), `basis`,
`className`.

## Toegankelijkheid

- Puur decoratief: `aria-hidden="true"` op de root, geen tekst, geen
  interactieve elementen.
- **`prefers-reduced-motion: reduce`**: alle blobs krijgen `animation: none`
  via een CSS `@media`-blok — geen JS nodig, reageert live op een wissel
  (R1). Het veld staat dan gewoon stil in zijn beginstand — geen leeg of
  kapot beeld.
- **Buiten beeld / verborgen tabblad (R18)**: JS zet `[data-gf-pauze]` op
  de root zodra het veld de viewport verlaat (IntersectionObserver) of het
  tabblad verborgen wordt (`visibilitychange`); de CSS zet dan
  `animation-play-state: paused` op alle blobs.

## Valkuilen

- **`isolation: isolate` op de ouder is geen decoratie, maar noodzaak.**
  Zonder een eigen stacking-context kan de geblurde `.gf__veld` (die groter
  is dan zijn container, `inset: -12%`) buiten de bedoelde sectie vallen en
  over content ernaast lopen.
- **De blur zit op `.gf__veld`, niet per blob.** Blur op elk van de vier
  blobs los zou vier keer zo veel filter-werk zijn voor hetzelfde
  eindresultaat — één gedeelde blur-laag is de goedkopere weg naar
  dezelfde zachte rand.
- **`background-position`-animatie is hier bewust vervangen
  door `transform`.** `background-position` triggert een paint per frame;
  `transform: translate()/scale()` blijft op de compositor-thread (R18) —
- **Twee velden op één pagina delen geen state.** Elke `init()`-aanroep
  observeert zijn eigen root; pauzeer/hervat gebeurt dus per veld (zie
  demo: veld 1 pauzeert zodra je naar veld 2 scrolt, los van veld 2's
  eigen status).

