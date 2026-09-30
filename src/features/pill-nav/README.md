# pill-nav

Zwevende, volledig afgeronde navigatiebalk met glaseffect (backdrop-filter +
een solide fallback-achtergrond voor browsers zonder support). Een pilvormige
indicator schuift naar het actieve item; optioneel duikt de balk weg bij
omlaag scrollen en komt hij terug bij omhoog scrollen.

## Wanneer wel

- Een compacte hoofdnavigatie die over de content zweeft (hero, portfolio,
  landingspagina) in plaats van een volle breedte header.
- Sites met een kort menu (3–6 items) — bij veel items scrolt de lijst
  intern horizontaal, maar wordt de pil dan minder overzichtelijk.

## Wanneer niet

- Voor een uitgebreide hoofdnavigatie met submenu's — een zwevende pil heeft
  geen ruimte voor dropdowns. Gebruik dan een gewone header met
  `navigation/flip-side-menu` of `navigation/image-menu` als uitklapmenu.
- Niet los boven video/foto zónder de meegeleverde CSS: de contrastberekening
  (zie Toegankelijkheid) gaat uit van de meegeleverde kleurtokens.

## Installatie

```
component-library/navigation/pill-nav/
├── pill-nav.js      # vanilla ES-module, 0 dependencies
├── pill-nav.css     # namespaced op .pn / .pn__*
├── PillNav.tsx       # React/Next.js client-wrapper
├── demo.html         # zelfstandige demo
└── test/meet.mjs     # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./pill-nav.css" />
<nav class="pn" aria-label="Hoofdnavigatie" id="hoofdnav">
  <a class="pn__brand" href="#top">Studio Wester</a>
  <ul class="pn__list" data-pn-list>
    <li><a href="#diensten" aria-current="page">Diensten</a></li>
    <li><a href="#werkwijze">Werkwijze</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a class="pn__cta" href="#offerte">Offerte</a>
</nav>
<script type="module">
  import { init } from './pill-nav.js';
  const destroy = init(document.querySelector('#hoofdnav'), {
    position: 'bottom',
    hideOnScroll: false,
  });
  // destroy() bij unmount / opruimen
</script>
```

**React / Next.js (App Router)**

```tsx
import { PillNav } from '@/component-library/navigation/pill-nav/PillNav';

<PillNav
  brand="Studio Wester"
  links={[
    { href: '#diensten', label: 'Diensten', active: true },
    { href: '#werkwijze', label: 'Werkwijze' },
    { href: '#contact', label: 'Contact' },
  ]}
  ctaLabel="Offerte"
  ctaHref="#offerte"
  hideOnScroll
/>
```

## Markup-contract

- Root-element: een `<nav>` (of ander element) met daarin **verplicht** één
  container met `data-pn-list` — een echte `<ul>` — dat is waar de JS-module
  de `<a>`-links in zoekt en waar de indicator in wordt geplaatst. Geen
  `data-pn-list` → de module logt een waarschuwing en doet niets (R5).
- Links: gewone `<a href>`-elementen, elk in een eigen `<li>`, direct kind
  van `[data-pn-list]`. De module markeert zelf de eerste link met
  `aria-current="page"` als geen enkele link dat al heeft. Geen `role`-
  attributen nodig of gewenst op de `<li>`/`<a>` — de native lijst-/link-rol
  is precies wat een schermlezer nodig heeft (een eerdere versie zette
  `role="listitem"` op de `<a>` zelf, wat de link-rol overschreef en de
  links onvindbaar maakte voor schermlezers en `getByRole('link', …)`).
- De module voegt zelf een `.pn__indicator-item` (`<li aria-hidden="true">`,
  `display:contents`) toe als laatste kind van `[data-pn-list]` — die telt
  niet mee als navigatie-item en verdwijnt weer bij `destroy()`.
- Klikken op een link zet `aria-current="page"` op die link (en haalt het bij
  de rest weg) en schuift de indicator mee — dit werkt met gewone
  in-pagina-ankers; voor een meerdere-pagina's-site zet je `aria-current`
  zelf op de link van de huidige pagina (server-side of bij hydratie) en laat
  je de klik-logica verder met rust (een echte paginanavigatie herlaadt de
  module toch opnieuw).
- Optioneel: `.pn__brand` (merk/logo-link) vóór de lijst, `.pn__cta`
  (call-to-action) ná de lijst — beide buiten `[data-pn-list]`, dus niet
  onderdeel van de indicator-tracking.
- Root krijgt na `init()` `data-pn-position="top"` of `"bottom"` (stuurt de
  CSS-positionering) en, tijdens verbergen, `data-pn-hidden`.

## Opties (`init(root, options)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `position` | `"bottom"` | `"top"` of `"bottom"` — waar de balk zweeft. |
| `hideOnScroll` | `false` | Verberg bij omlaag scrollen, toon weer bij omhoog scrollen. |
| `hideThreshold` | `24` | Vanaf hoeveel pixels scroll-vanaf-top het verbergen mag beginnen (voorkomt wiebelen vlak bovenaan de pagina). |

CSS-variabelen (op `.pn`, override per instantie):

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `--pn-bg` | `rgba(17,17,20,.82)` | Glas-achtergrond (met backdrop-filter). |
| `--pn-bg-fallback` | `rgba(17,17,20,.94)` | Achtergrond zonder backdrop-filter-support. |
| `--pn-ink` | `#f5f5f2` | Volle tekstkleur (merk, hover, focus). |
| `--pn-ink-soft` | `rgba(245,245,242,.72)` | Gedimde tekstkleur (niet-actieve links in rust). |
| `--pn-accent` | `#48d4ff` | Indicator- en CTA-achtergrond. |
| `--pn-accent-ink` | `#0b1620` | Tekst op de indicator/CTA. |
| `--pn-radius` | `999px` | Afronding van balk, links en indicator. |
| `--pn-blur` | `14px` | Blur-sterkte van het glaseffect. |

## Toegankelijkheid

- **Toetsenbord**: puur native `<a href>`-elementen — Tab loopt er doorheen
  in DOM-volgorde, Enter activeert de link (en verplaatst de indicator, want
  dat gebeurt via hetzelfde `click`-event dat een `<a>` bij Enter zelf
  afvuurt). Zichtbare focus via `outline: 2px solid var(--pn-accent)`.
- **Contrast (R16)**, gemeten met de WCAG-relatieve-luminantieformule, worst
  case (pagina-achtergrond áchter het glas is wit — het ongunstigste geval
  voor een donker paneel):
  - volle tekst (`--pn-ink`) op het glas: **10,10:1** (fallback zonder
    backdrop-filter: 15,00:1)
  - gedimde link-tekst (`--pn-ink-soft`) op het glas: **6,13:1**
  - indicator-/CTA-tekst (`--pn-accent-ink`) op `--pn-accent`: **10,56:1**
  - Alle drie ruim boven de eis van 4,5:1. `test/meet.mjs` rekent deze som
    opnieuw uit op de daadwerkelijk gerenderde `getComputedStyle`-kleuren.
- `[data-pn-list]` is een echte `<ul>` met een `<li>` per link (demo en
  `PillNav.tsx` gebruiken dezelfde structuur) — geen `role`-overrides nodig,
  dus de native lijst-/link-semantiek komt gewoon aan bij een schermlezer.
- Geen dialoog, geen focus-trap nodig — het is een gewone linkenset.

## Op WordPress

Geen build-stap nodig.

1. Zet `pill-nav.css` en `pill-nav.js` in je thema, bijvoorbeeld
   `wp-content/themes/<thema>/component-library/pill-nav/`.
2. Enqueue met `wp_enqueue_style()` en `wp_enqueue_script_module()` (vanaf
   WP 6.5), zónder versienummer op de module (zie de toelichting in de
   `reveal-on-scroll`-README, zelfde valkuil).
3. Plaats de markup uit "Markup-contract" in een Custom HTML-blok of
   headertemplate, en roep `init()` aan ná `DOMContentLoaded`.

## Valkuilen

- **`[data-pn-list]` vergeten** → de module doet niets (bewuste keuze, R5).
  Controleer de console-waarschuwing.
- **Veel menu-items op mobiel**: de lijst scrolt dan intern horizontaal
  (`overflow-x: auto`) in plaats van de pagina breder te maken — dat is
  bewust zo (R19/mobiel-scenario), maar bij >5 items oogt het al snel
  overvol. Houd het menu kort. Een randfade (`.pn__list--fade-end` /
  `--fade-start`, gezet door de module zelf) toont wanneer er nog meer te
  scrollen valt, zodat een afgekapte link niet oogt alsof hij onder de CTA
  verdwijnt.
- **`hideOnScroll` + een pagina korter dan het scherm**: er is dan niets om
  in/uit te scrollen — geen probleem, de balk blijft gewoon zichtbaar.
- **Geen `role="listitem"` op de `<a>` zetten** als je zelf markup schrijft —
  dat overschrijft de implicit link-rol van het element (zie hierboven).
  Elke link hoort in een eigen `<li>`, niet in een `role`-attribuut op de
  link zelf.

## Herkomst

Eigen implementatie; patroon gezien bij meerdere bureausites: zwevende
pil-navigatie met `border-radius: 1000px` en `backdrop-filter: blur(6px)`, met
een schuivende actief-indicator als cyaan pilletje onder het actieve
menu-item (`border-radius: 1000px`, kleur `#48D4FF`, hier als `--pn-accent`).

Toegevoegd: een expliciete backdrop-filter-fallback (via
`@supports`), een indicator die met `getBoundingClientRect` meebeweegt met
willekeurige tekstlengtes (niet met vaste breedtes), en een verberg-bij-scroll
die via `prefers-reduced-motion` altijd een correcte eindstand toont.
