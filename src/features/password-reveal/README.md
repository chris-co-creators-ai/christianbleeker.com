# password-reveal

"BE\*\*\*\*\*\*\*\*" wordt letter voor letter "Beveiligd." terwijl je
scrolt — een scroll-gekoppelde onthulling met instelbaar startpunt en
afstand. Zonder JavaScript staat het echte woord er gewoon, onverborgen; mét
JavaScript blijft de echte tekst via een schermlezer-vaste kopie
beschikbaar — nooit alleen als sterretjes.

## Wanneer wel

- Eén kort woord of korte zin die iets over vertrouwen/beveiliging/kwaliteit
  zegt, als een klein visueel moment tijdens het scrollen.

## Wanneer niet

- Niet voor tekst die de bezoeker echt nodig heeft om verder te komen (een
  wachtwoordveld, een cruciale instructie) — het is een decoratief
  scroll-effect, geen formulierveld.
- Niet met lange zinnen — de letter-voor-letter-onthulling is bedoeld voor
  een kort woord of korte zin (2–15 tekens werkt het beste).

## Installatie

```
component-library/typography/password-reveal/
├── password-reveal.js      # vanilla ES-module, 0 dependencies
├── password-reveal.css     # namespaced op [data-password-reveal]
├── PasswordReveal.tsx      # React/Next.js client-wrapper
├── demo.html                 # zelfstandige demo
└── test/meet.mjs             # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./password-reveal.css" />
<h2 data-password-reveal data-pr-start="0.75" data-pr-distance="350">
  <span class="pr__real">Beveiligd.</span>
</h2>

<script type="module">
  import { init } from './password-reveal.js';
  const destroy = init(document.querySelector('[data-password-reveal]'));
</script>
```

**React / Next.js (App Router)**

```tsx
import { PasswordReveal } from '@/component-library/typography/password-reveal/PasswordReveal';

<PasswordReveal word="Beveiligd." start={0.75} distance={350} />
```

## Markup-contract

- Root: element met `data-password-reveal`. Optioneel `data-pr-start`
  (fractie van de viewporthoogte, standaard `0.75`) en `data-pr-distance`
  (scroll-pixels tot volledige onthulling, standaard `350`).
- `.pr__real` — verplicht, bevat **de echte tekst**, altijd. Zonder JS (of
  vóór `init()`) is dit gewoon de zichtbare tekst. Ná `init()` verplaatst de
  module hem visueel naar een schermlezer-vaste stijl (clip-technique) en
  zet er een decoratieve `.pr__mask aria-hidden="true"` vóór, die de
  scroll-gekoppelde sterretjes/tekst toont.

## Opties (`init(root, options)`)

| Optie | Standaard | Omschrijving |
|---|---|---|
| `start` | `data-pr-start` of `0.75` | Fractie van de viewporthoogte waarop de onthulling begint. Lager = later. |
| `distance` | `data-pr-distance` of `350` | Scroll-afstand in px voor volledige onthulling. |
| `mask` | `'*'` | Maskeerteken. |

## Toegankelijkheid

- **Echte tekst altijd beschikbaar**: zonder JS gewoon zichtbaar; mét JS
  blijft `.pr__real` in de DOM staan (visueel verborgen met de
  standaard-`clip`-techniek, niet `display:none`/`aria-hidden`) — een
  schermlezer leest gewoon "Beveiligd.", nooit sterretjes.
- **Reduced motion**: bij `prefers-reduced-motion: reduce` toont
  `.pr__mask` meteen de volledige tekst, geen scroll-koppeling. Reageert
  ook live op een wissel halverwege de sessie.
- **Alleen `transform`/tekstinhoud** — geen layout-eigenschappen die
  reflow forceren buiten de tekst zelf; scroll-/resize-listeners lopen via
  `requestAnimationFrame` met `passive:true` (R18) en ontkoppelen zodra de
  tekst ver buiten beeld is (IntersectionObserver, `rootMargin: 100%`).

## Op WordPress

Geen build-stap. CSS + `password-reveal.js` in het thema,
`wp_enqueue_style()` + `wp_enqueue_script_module()`, `init()` na
`DOMContentLoaded`. Zie `scroll/reveal-on-scroll/README.md` voor het
volledige WordPress-recept.

## Valkuilen

- **`start`/`distance` te klein** laat de onthulling binnen één
  scherm-scroll voltooien — test op een echt trage scroll of de timing goed
  aanvoelt; te groot en de tekst blijft lang half gemaskeerd in beeld.
- **Element buiten de standaard-`rootMargin` (100% van de viewporthoogte)**
  bij het laden: de scroll-listener start pas als het binnen die marge komt
  — bij een heel lange pagina met veel witruimte ervoor is dat gewenst
  gedrag (spaart CPU), niet een bug.
- **Kopieert/selecteert de gebruiker de tekst tijdens het maskeren**: die
  selecteert `.pr__real` (de echte tekst), niet de zichtbare sterretjes —
  bewust, maar kan verrassen bij het testen met de muis.

## Herkomst

Het patroon is gezien bij meerdere bureausites; de code is zelf geschreven en komt uit de onderdelenbibliotheek van Seveke Creative.
