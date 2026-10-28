# kaartenstapel-zij

Een rij kaarten die vastpint terwijl je scrolt. Kaart 2, 3, 4 … schuiven één voor één zijwaarts over kaart 1 heen, en de rest van de rij schuift mee. De kaart die bedekt raakt wordt 25 % donkerder. Zodra een kaart bovenop ligt, veert zijn knop uit (`clip-path: inset()` met een overshoot). De variant `team` heeft geen knoppen.

Op mobiel, bij "minder beweging" en zonder JS is het een gewone zijwaartse rij met native scroll-snap, met alle knoppen zichtbaar.

## Wanneer wel

- Een werkwijze in 3 tot 6 stappen, waarbij elke stap een eigen vervolgactie heeft ("Plan een gesprek", "Over de merkscan").
- Een team van 4 tot 9 mensen op een over-ons- of casepagina (variant `team`).
- Eén of twee keer per pagina.

## Wanneer niet

- Voor meer dan ±9 kaarten: elke kaart kost ±0,9 schermhoogte scroll.
- Als de bezoeker de kaarten naast elkaar moet vergelijken (prijzen, pakketten): de stapel toont er steeds maar één helemaal.
- Verticaal stapelen van panelen: dat is `scroll/stapelpanelen`. Zijwaarts meeschuiven zonder stapel: `scroll/horizontal-scroll-pin`. Een rij met Lottie-iconen: `scroll/kaartenrij-lottie`.

## Installatie

**Vanilla**

```html
<link rel="stylesheet" href="./kaartenstapel-zij.css" />
<script type="module">
  import { init } from './kaartenstapel-zij.js';
  document.querySelectorAll('[data-kz]').forEach((el) => init(el));
</script>
```

**React / Next.js**

```tsx
import { KaartenstapelZij } from '@/component-library/scroll/kaartenstapel-zij/KaartenstapelZij';

<KaartenstapelZij
  labelledBy="werkwijze"
  kop={<h2 id="werkwijze">Zo werken we</h2>}
  kaartClassName="stap"
  kaarten={[
    <><h3>Kennismaken</h3><p>…</p><a data-kz-knop href="/contact">Plan een gesprek</a></>,
    <><h3>Merkscan</h3><p>…</p><a data-kz-knop href="/merkscan">Over de merkscan</a></>,
  ]}
/>
```

**WordPress**

1. Zet `kaartenstapel-zij.js`, `.css` en `_kwaliteit/basis.js` in je thema, met dezelfde onderlinge plek (`component-library/scroll/kaartenstapel-zij/` en `component-library/_kwaliteit/`).
2. `wp_enqueue_style` voor de CSS, `wp_enqueue_script_module()` (WP 6.5+) voor de JS.
3. Plak de markup in een Custom HTML-blok en roep `init()` aan in een klein moduleblok in `wp_footer`.
4. Controleer de valkuil hieronder: veel thema's zetten `overflow-x: hidden` op een wrapper.

## Markup-contract

```html
<section data-kz [data-kz-variant="team"] aria-labelledby="kop">
  <div data-kz-pin>              <!-- krijgt de scrollhoogte -->
    <div data-kz-stage>          <!-- het blok dat pint (sticky, 100svh) -->
      <h2 id="kop">…</h2>        <!-- vrij: pint mee -->
      <ol data-kz-rij>
        <li data-kz-kaart>
          …
          <a data-kz-knop href="…">Plan een gesprek</a>   <!-- optioneel; niet bij team -->
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
| `data-kz-modus="pin\|snap"` | root | vastgepinde stapel of gewone snap-rij |
| `data-kz-open` | kaart | ligt bovenop: knop veert uit |
| `<span data-kz-schaduw aria-hidden>` | in elke kaart | de 25 %-schaduw |
| `--kz-lengte` | root | extra scrollhoogte van de pin |

Reserveer in de kaart vaste ruimte voor de knop (bijvoorbeeld `min-height` op zijn houder): de knop wordt geknipt, niet ingeklapt, dus er verspringt niets.

## Opties

| Optie | Standaard | Wat |
|---|---|---|
| `variant` | uit `data-kz-variant` | `team` = geen knoppen |
| `breakpoint` | `768` | Vanaf deze breedte (px) pinnen, daaronder scroll-snap |
| `minHoogte` | `480` | Onder deze vensterhoogte niet pinnen |
| `vhPerStap` | `0.8` | Scroll per tijdlijn-eenheid, als deel van de vensterhoogte (Tandem: 0,8vh per stap) |
| `start` | `0.4` | Moment waarop kaart 2 vertrekt |
| `interval` | `1.15` | Tijd tussen twee vertrekken |
| `duur` | `1` | Hoe lang één kaart schuift |
| `donker` | `0.25` | Opacity van de schaduw op een bedekte kaart |
| `naloop` | `0.12` | Tijdconstante (s) waarmee de stapel de scroll volgt; `0` = direct |
| `overflowFix` | `'clip'` | Wat te doen met een voorouder die sticky breekt, zie Valkuilen |

CSS-knoppen: `--kz-kaart` (breedte), `--kz-gap`, `--kz-rand` (zijmarge en scroll-padding), `--kz-radius`, `--kz-schaduw-kleur`, `--kz-veer` (de `linear()`-curve van de knop).

## Toegankelijkheid

- De kaarten zijn een echte `<ol>`. Een schermlezer leest ze in volgorde, ook als ze visueel onder een andere kaart liggen.
- Toetsenbord: tab je naar een link in een kaart die bedekt is of nog rechts wacht, dan scrolt de pagina naar het moment waarop die kaart bovenop ligt. De gefocuste knop is daarna echt zichtbaar (gemeten met `elementFromPoint`) en een geknipte knop gaat open bij `:focus-within`.
- De schaduwlaag is `aria-hidden`.
- Minder beweging: geen pin, een gewone snap-rij. Zet de bezoeker het halverwege om, dan schakelt de sectie live om (R1).
- Geef een team-rij zonder links `tabindex="0"` en een `aria-label`, zodat hij met pijltjes te scrollen is in de snap-modus.

## Valkuilen

- **`overflow: hidden` op een voorouder breekt `position: sticky`.** Die voorouder wordt dan de scrollcontainer, en die scrolt niet: het blok schuift gewoon mee met de pagina. Zo ging het mis bij bureautandem.nl, waar `body` een `overflow: hidden` had en de stapelkaarten op de dienstpagina's niet plakten. `init()` zoekt zulke voorouders op. Met `overflowFix: 'clip'` (standaard) vervangt hij hun overflow inline door `clip` (snijdt even hard af, maar is geen scrollcontainer), en meldt in de console welk element hij aanpaste. `destroy()` zet het terug. Met `overflowFix: 'melden'` raakt hij niets aan: waarschuwing plus terugval op de snap-rij. Een voorouder die echt zelf scrolt (een app-shell met `overflow: auto` en vaste hoogte) wordt nooit aangepast: dan altijd snap. De meting toont alle drie, en ook dat het blok zonder reparatie 400 px meeschuift bij 400 px scroll.
- **`overflow: hidden` op `<body>` is meestal onschuldig**, want dat gaat naar de viewport. Behalve als `<html>` zelf ook een overflow heeft, zoals veel thema's met `overflow-x: hidden` doen. Dat geval vangt de detectie ook.
- **Geen `overflow` op `[data-kz-stage]` zelf zetten.** De feature zet daar `overflow-x: clip`.
- **Hoogte van de sectie** volgt het aantal kaarten en de vensterhoogte. Na een breedtewijziging (≥ 5 px) meet de JS opnieuw. Een hoogte-wijziging alleen (adresbalk) niet, zodat de stapel niet verspringt.
- **Knoppen moeten `data-kz-knop` hebben**, anders veren ze niet uit (ze blijven dan gewoon zichtbaar).

## Herkomst

Eigen code uit de onderdelenbibliotheek van Seveke Creative. (Herkomst ingekort voor deze openbare repo.)
