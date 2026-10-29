# verbindingshub

Een centrale tegel (logo-plek) met lijnen naar drie knopen links en drie rechts, bijvoorbeeld AI-assistenten ↔ jouw product ↔ apps. Een stip reist van een bron naar de hub en door naar een doel; de knopen lichten om de beurt op en de hub geeft een korte ontvangstpuls. Op een smalle container staan de groepen boven en onder de hub en lopen de lijnen verticaal.

## Wanneer wel
- Uitleggen dat jouw product iets verbindt: "je assistent praat via ons met je eigen apps", "elk apparaat via ons naar een Europese server", "je kassa, webshop en boekhouding via één koppeling".
- Als rustige blikvanger boven een sectiekop.

## Wanneer niet
- Meer dan 4 knopen per kant: dan wordt het een spinnenweb; maak er een lijst of tabel van.
- Als de verbinding echt live data moet tonen (status, latency): dit is uitleg, geen monitor. De stip loopt een vaste route.
- Twee keer op één scherm.

## Installatie

```
layouts/verbindingshub/
├── verbindingshub-kern.js      # init(root, opties) → destroy
├── verbindingshub.css
├── Verbindingshub.tsx
├── demo.html
└── test/meet.mjs
```

**Vanilla**

```html
<link rel="stylesheet" href="/pad/naar/verbindingshub.css">
<figure class="vh" id="hub" aria-label="Koppeling tussen AI-assistenten en je apps">
  <div class="vh__vlak">
    <ul class="vh__groep" data-vh-kant="bron" aria-label="AI-assistenten">
      <li class="vh__knoop"><span class="vh__tegel"><svg aria-hidden="true">…</svg></span><span class="vh__naam">ChatGPT</span></li>
      … (3×)
    </ul>
    <div class="vh__hub">
      <span class="vh__tegel"><svg aria-hidden="true">…logo…</svg></span>
      <span class="vh__naam"><span class="vh-sr">verbonden via </span>Wolkhaven<span class="vh-sr"> met</span></span>
    </div>
    <ul class="vh__groep" data-vh-kant="doel" aria-label="Apps">
      … (3×)
    </ul>
  </div>
</figure>
<script type="module">
  import { init } from '/pad/naar/verbindingshub-kern.js';
  const destroy = init(document.getElementById('hub'));
</script>
```

**React / Next.js**

```tsx
import { Verbindingshub } from '@/component-library/layouts/verbindingshub/Verbindingshub';

<Verbindingshub
  label="Koppeling tussen AI-assistenten en je apps"
  bronLabel="AI-assistenten"
  doelLabel="Apps"
  bronnen={[{ naam: 'ChatGPT', icoon: <IconSparkle aria-hidden /> }, …]}
  hub={{ naam: 'Wolkhaven', icoon: <Logo aria-hidden /> }}
  doelen={[{ naam: 'Kennisbank', icoon: <IconDoc aria-hidden /> }, …]}
/>
```

**WordPress**

```php
add_action( 'wp_enqueue_scripts', function () {
	$basis = get_stylesheet_directory_uri() . '/component-library/verbindingshub/';
	wp_enqueue_style( 'verbindingshub', $basis . 'verbindingshub.css', array(), '1.0.0' );
	wp_enqueue_script_module( 'verbindingshub', $basis . 'verbindingshub-kern.js', array(), null );
} );
```
Plak de markup in een blok "Aangepaste HTML" (de iconen als inline-SVG) en roep `init()` aan zoals bij vanilla. Laat optimalisatieplugins inline-SVG's niet "lazy" maken: de lijnen meten de tegels bij het laden.

## Markup-contract
- `root` (`.vh`, liefst een `<figure aria-label>`) > `.vh__vlak` > `.vh__groep[data-vh-kant="bron"]`, `.vh__hub`, `.vh__groep[data-vh-kant="doel"]`.
- Elke knoop: `.vh__knoop` > `.vh__tegel` (icoon) + `.vh__naam`. De lijnen hechten aan de tegel, niet aan de naam.
- De twee lijsten en de hub zíjn de tekst voor schermlezers. De twee `.vh-sr`-stukjes in de hubnaam maken er een zin van: "AI-assistenten: ChatGPT, Le Chat, Claude · verbonden via Wolkhaven met · Apps: …".
- De module voegt toe: `svg.vh__lijnen` (aria-hidden) als eerste kind van `.vh__vlak`, `root.vh--actief`, `root[data-vh="loopt|gepauzeerd|stil"]`, en tijdelijk `.is-actief` op knopen en `.is-ontvangt` op de hub.

## Opties

| Optie | Standaard | Omschrijving |
|---|---|---|
| `reisduur` | `950` | ms voor één lijn (bron → hub of hub → doel), ease-in-out |
| `rust` | `650` | ms tussen twee verbindingen |

Vaste ritme: bron i → hub → doel (2i+1) mod 3, dus alle bronnen en doelen komen in drie rondes aan de beurt. Eén ronde ≈ 2,8 s.

CSS-variabelen op `.vh`: `--vh-vlak`, `--vh-gloed`, `--vh-rand`, `--vh-tegel`, `--vh-tegel-rand`, `--vh-tekst`, `--vh-tekst-zacht`, `--vh-accent`, `--vh-lijn`, `--vh-licht-1`/`--vh-licht-2` (verloop van de oplichtende lijn, sky → indigo), `--vh-stip`, `--vh-ease`. Standaard de palettokens met vaste terugval.

## Toegankelijkheid
- Decor (`svg.vh__lijnen`) is `aria-hidden`; de relatie staat als echte tekst in de markup (twee lijsten met `aria-label` en een hub met verbindende woorden).
- Niets in het diagram is focusbaar: Tab gaat er gewoon langs.
- Contrast namen: 7,2:1 licht, 8,2:1 donker (gemeten).
- Beweging stopt buiten beeld (IntersectionObserver, 80 px marge), bij een verborgen tabblad, bij `prefers-reduced-motion` (stil diagram zonder stip, live omschakelbaar) en bij `html[data-motion="paused"]` / `beweging:pauze` (bevriest waar het is; zie `effects/beweging-pauze`).

## Valkuilen
- **Lijnen meten de tegels.** Een `transform` op een tegel (bijv. een eigen hover-schaal) verschuift het beeld maar niet de lijn. Daarom licht een knoop op met een ring, niet met een lift. Een eigen hover-lift is kort en mag; een blijvende transform niet.
- **Herberekenen** gaat via ResizeObserver op het vlak, de hub en elke knoop, plus `document.fonts.ready`. Verandert iets buiten dat (bijvoorbeeld een webfont die later laadt via JS), roep dan `destroy()` + `init()` opnieuw aan.
- **Smal = container, niet scherm.** Onder 560 px containerbreedte (`@container`) gaat de opbouw verticaal. In een smalle kolom op desktop dus ook.
- **Niet in `overflow: hidden` met een te kleine hoogte**: het vlak heeft `min-height: 400px` op breed.
- **Iconen van merken**: gebruik je eigen of neutrale iconen. Logo's van ChatGPT, Mistral of Claude vallen onder hun merkrecht; de demo gebruikt eigen, neutrale tekeningen.

## Herkomst
eu-hosted.com, sectie "AI en MCP": een diagram met ChatGPT, Copilot en Claude links, EU-hosted in het midden en drie apps rechts, met een lichtstreep die over een lijn loopt. Eigen implementatie, geen code, paden of logo's overgenomen.

Wat wij beter doen:
- eu-hosted zet `role="img"` met een afgekapte `aria-label` op het hele diagram. Bij ons is de relatie echte, volledige tekst (lijsten + verbindende woorden) die ook zonder JS staat.
- Een verhaal in plaats van losse stralen: van bron via de hub naar een doel, met een ontvangstpuls en een knoop die oplicht bij aankomst.
- Op mobiel een verticale opbouw met lijnen die ook dan precies op de tegels aansluiten, in plaats van een verkleinde kopie.
- Volgt het pauzecontract (`data-motion` / `beweging:pauze`) en stopt buiten beeld.
