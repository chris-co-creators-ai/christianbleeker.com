# kaartenrij-lottie

Een rij kaarten die op het midden van het scherm vastpint. Een groot hoofdicoon tekent zich al met de scroll terwijl je de sectie nadert. Bij het pinnen komt de rij van onder het scherm omhoog en krimpt het hoofdicoon tot precies de plek en maat van het icoon van kaart 1. Op één frame wisselen ze, dus je ziet de overgang niet. Daarna schuift de rij zijwaarts mee met de scroll (1 px scroll is 1 px schuiven), en alleen de kaart in het midden speelt zijn Lottie.

Zonder JS en bij "minder beweging" is het een gewone genummerde lijst met statische iconen.

## Wanneer wel

- Een dienst of programma met 5 tot 10 onderdelen die bij elkaar horen (de "8 P's", fases, pijlers), waar je de bezoeker één voor één langs wilt leiden.
- Als het hoofdicoon iets betekent dat in kaart 1 terugkomt, zoals een mens die "Persona's" wordt.
- Op een pagina met één, hooguit twee pins. Meer gepinde secties voelen als een fuik.

## Wanneer niet

- Voor meer dan ±10 kaarten. De scrollafstand groeit met elke kaart (±360 px per kaart op desktop).
- Als de kaarten links of formulieren bevatten die de bezoeker moet gebruiken. Ze liggen tijdens de rij buiten beeld; gebruik dan `carousels/drag-carousel`.
- Voor een zijwaartse rij zonder overdracht of afspelende iconen: `scroll/horizontal-scroll-pin` is eenvoudiger.

## Installatie

```
scroll/kaartenrij-lottie/
├── kaartenrij-lottie.js     vanilla ES-module (importeert de Lottie-speler lui)
├── kaartenrij-lottie.css
├── KaartenrijLottie.tsx     React/Next.js-wrapper
├── animaties/               8 kaart-Lotties + hoofd.json + maak.mjs (generator)
├── iconen/                  8 statische SVG's (= frame 0 van elke Lottie)
├── demo.html
└── test/meet.mjs
```

De Lottie-speler staat als eigen kopie in `vendor/lottie_light.min.js` (lottie-web 5.13 light, MIT; dezelfde als bij `media/lottie-icon`). De JS laadt hem met een letterlijke `import('./vendor/lottie_light.min.js')`, zodat een bundler (Next, Vite) hem kan volgen en het pad ook in een platte kopie klopt. Kopieer de hele map, `vendor/` mee.

**Vanilla**

```html
<link rel="stylesheet" href="./kaartenrij-lottie.css" />
<script type="module">
  import { init } from './kaartenrij-lottie.js';
  const destroy = init(document.querySelector('[data-kaartenrij]'));
</script>
```

**React / Next.js**

```tsx
import { KaartenrijLottie } from '@/component-library/scroll/kaartenrij-lottie/KaartenrijLottie';

<KaartenrijLottie
  labelledBy="kr-kop"
  kop={<div className="kop"><h2 id="kr-kop">Acht kanten van jouw merk</h2></div>}
  hoofdLottie="/animaties/hoofd.json"
  hoofdIcoon="/iconen/doelgroep.svg"
  kaarten={[
    { titel: "Persona's", tekst: 'Wie kiest er voor jou…', lottie: '/animaties/doelgroep.json', icoon: '/iconen/doelgroep.svg' },
    // …
  ]}
/>
```

Zet de JSON's en SVG's in `public/`. Paden in `data-kaartenrij-lottie` worden opgehaald ten opzichte van de pagina, niet van de JS.

**WordPress**

1. Zet de map (met `vendor/`) in je thema: `component-library/scroll/kaartenrij-lottie/`.
2. Laad de CSS met `wp_enqueue_style` en de JS met `wp_enqueue_script_module()` (WP 6.5+), zonder versienummer (`null`), zodat de `import()` dezelfde URL gebruikt.
3. Plak de markup hieronder in een Custom HTML-blok. Gebruik absolute paden voor de JSON's en SVG's (`/wp-content/themes/…/animaties/doelgroep.json`).
4. Roep `init()` aan in een klein moduleblok in `wp_footer`.

## Markup-contract

```html
<section data-kaartenrij aria-labelledby="kop">
  <div class="kop"><h2 id="kop">…</h2></div>      <!-- vrij, scrolt gewoon mee -->
  <div data-kaartenrij-pin>                        <!-- krijgt een hoogte = blok + intro + rij -->
    <div data-kaartenrij-stage>                    <!-- het blok dat pint (sticky) -->
      <div data-kaartenrij-hoofd data-kaartenrij-lottie="animaties/hoofd.json" aria-hidden="true">
        <img src="iconen/doelgroep.svg" alt="" width="84" height="84">
      </div>
      <ol data-kaartenrij-track>
        <li data-kaartenrij-kaart>
          <h3>Persona's</h3>
          <div data-kaartenrij-icoon data-kaartenrij-lottie="animaties/doelgroep.json" aria-hidden="true">
            <img src="iconen/doelgroep.svg" alt="" width="84" height="84">
          </div>
          <p>…</p>
        </li>
        <!-- minstens 2 kaarten -->
      </ol>
    </div>
  </div>
</section>
```

Door de JS gezet (niet zelf in de markup zetten):

| Attribuut | Waar | Betekenis |
|---|---|---|
| `data-kaartenrij-aan` | root | pin-modus aan |
| `data-kaartenrij-fase="intro\|rij"` | root | vóór of na de overdracht |
| `data-kaartenrij-speelt` | kaart | de kaart in het midden |
| `data-kaartenrij-klaar` | icoonvak | Lottie heeft zijn eerste frame, statisch icoon verdwijnt |
| `--kr-top` | root | sticky-afstand, zodat het blok precies in het midden staat |

**De Lotties.** Elke kaart-Lottie is een lus waarvan frame 0 en het laatste frame het rustbeeld zijn, gelijk aan de SVG. De hoofd-Lottie tekent zich en eindigt in het rustbeeld van kaart 1. `animaties/maak.mjs` schrijft alle negen plus de SVG's uit één definitie, zodat dat altijd klopt. Andere kleur of ander icoon: pas `maak.mjs` aan en draai `node animaties/maak.mjs`.

## Opties

| Optie | Standaard | Wat |
|---|---|---|
| `introFactor` | `0.35` | Lengte van de intro (hoofdicoon af, kaarten omhoog), als deel van de schermhoogte. Bij 900 px is dat 315 px. |
| `voorStart` | `0.95` | Het hoofdicoon begint te tekenen als het midden van het blok op 95 % van het scherm staat. |
| `voorVoortgang` | `0.35` | Deel van de hoofd-Lottie dat al getekend is als het blok pint. |
| `startSchaal` | `2.4` | Hoeveel groter het hoofdicoon is dan een kaarticoon vóór de intro. |
| `veegQuery` | `(max-width: 767px)` | Waaronder horizontaal vegen tijdens de pin werkt. |
| `veegDrempel` | `8` | Pixels voordat de veegrichting vastligt. |
| `veegFactor` | `2` | Verticale scroll per pixel horizontaal vegen. |
| `uitloopSnelheid` | `2.5` | Een kaart die uit het midden schuift, maakt zijn lus op deze snelheid af en stopt in rust. |
| `voorOmhoog` | `0` | Deel (0 tot 1) van de opkomst van de kaarten dat al tijdens het naderen gebeurt. 0 = pas in de intro. |
| `mobiel` | `{ introFactor: 0.2, voorOmhoog: 0.8 }` | Overschrijft `introFactor` en `voorOmhoog` onder `veegQuery` (telefoon). Zonder dit stond de rij op 390×844 ±750 px bijna leeg terwijl alleen het icoon tekende; nu ±320 px, en het hoofdicoon tekent, krimpt en geeft over aan kaart 1 zoals op desktop. |
| `ankerFix` | `true` | Ankerlinks naar iets ná de sectie zelf uitrekenen, ook bij binnenkomst met een #hash. |

CSS-knoppen: `--kr-kaart`, `--kr-inkt`, `--kr-zacht`, `--kr-accent`, `--kr-kaart-b` (kaartbreedte), `--kr-hoogte` (blokhoogte, standaard `min(30rem, 64svh)`), `--kr-gap`, `--kr-icoon`, `--kr-radius`.

## Toegankelijkheid

- De kaarten zijn een echte `<ol>` met een `<h3>` per kaart. Een schermlezer leest ze in volgorde, ook als ze visueel buiten beeld staan.
- Iconen en Lotties zijn decoratie (`aria-hidden`). De betekenis zit in de titel.
- Minder beweging: geen pin, geen Lottie-speler, gewone lijst. Zet de bezoeker het halverwege om, dan schakelt de sectie live om (R1).
- Ankerlinks naar bijvoorbeeld `#contact` komen precies uit, ook al groeit de pagina pas na `init()`. De focus gaat mee naar het doel als dat focusbaar is (`tabindex="-1"` op een sectie).
- Niets in de kaarten is klikbaar. Wil je links in kaarten, kies dan een andere component (zie Wanneer niet).

## Valkuilen

- **Geen `overflow: hidden` op een voorouder.** Dan werkt `position: sticky` niet. De feature zet zelf `overflow-x: clip` op de sectie en het blok; `clip` maakt geen scrollcontainer en laat sticky heel.
- **Hoogte van de sectie volgt de kaarten.** Na een wijziging in breedte (≥ 5 px) meet de JS opnieuw. Alleen hoogte (toetsenbord, adresbalk op telefoons) meet niet opnieuw, zodat de rij niet verspringt.
- **Een `scroll-behavior: smooth` op `html`** wordt tijdens de ankersprong even uitgezet; anders scrolt de browser zacht door de hele pin heen.
- **Ander eerste icoon?** Laat het laatste frame van de hoofd-Lottie gelijk zijn aan frame 0 van kaart 1, anders zie je de overdracht.
- **Paden in `data-kaartenrij-lottie`** zijn relatief aan de pagina.
- **Twee kaartenrijen op één pagina** werkt (elk een eigen `init`), maar voelt lang. Liever niet.

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.
