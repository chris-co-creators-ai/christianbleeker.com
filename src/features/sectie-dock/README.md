# sectie-dock

Eén vaste CTA rechtsonder waarvan **tekst én actie per sectie wisselen**. Op
mobiel een ronde schijf met een pijl en tekst eromheen die langzaam draait;
op desktop optioneel een compacte pil "● Websitescan · 2 min". De dock
verschijnt na de hero, verdwijnt in secties die zelf al een CTA hebben, en
trekt (optie) met een fijne muis naar de cursor.

## Wanneer wel

- Een landingspagina of klantsite met meerdere secties waarin de beste
  volgende stap steeds anders is: kennismaking bij de hero, een scan bij het
  werk, bellen bij de werkwijze, tarieven bij de diensten.
- Je wilt op mobiel één duidelijke actie in beeld houden zonder een balk over
  de hele breedte.

## Wanneer niet

- Eén pagina met één doel: dan is een vaste knop of `conversion/whatsapp-button`
  genoeg.
- Sites met veel content in de rechteronderhoek (kaartjes, chat-widgets).

**Kies er één voor de plek onderin.** `sectie-dock`, `conversion/mobile-action-bar`,
`conversion/smart-popup` en `conversion/whatsapp-button` claimen dezelfde
plek. Deze dock vervangt de mobile-action-bar (dus niet allebei): heb je
naast de dock een WhatsApp-knop nodig, zet die dan in een sectie als gewone
link of in de `actie`-config van een sectie.

## Installatie

```
component-library/conversion/sectie-dock/
├── sectie-dock.js       # vanilla ES-module, 0 dependencies
├── sectie-dock.css      # namespaced op .sd en data-sd-*
├── SectieDock.tsx       # React/Next.js client-wrapper
├── demo.html            # demo rond "Studio Wester"
└── test/meet.mjs        # Playwright-meting
```

**Vanilla / elk framework**

```html
<link rel="stylesheet" href="./sectie-dock.css" />
<script>document.documentElement.classList.add('sd-js');</script> <!-- optioneel, in de <head> -->

<a class="sd" href="#contact" data-sectie-dock>Neem contact op</a>

<script type="module">
  import { init } from './sectie-dock.js';
  const destroy = init(document.body, {
    pil: true,
    magneet: true,
    secties: {
      hero:     { tekst: 'Neem contact op', href: '#contact' },
      diensten: { tekst: 'Bekijk de tarieven', href: '#tarieven' },
      werk:     { tekst: 'Doe de websitescan', pil: 'Websitescan · 2 min',
                  label: 'Doe de websitescan, duurt twee minuten',
                  href: '#websitescan', event: 'sectiedock:scan' },
    },
  });
</script>
```

**React / Next.js (App Router)**

```tsx
import { SectieDock } from '@/component-library/conversion/sectie-dock/SectieDock';

<SectieDock href="#contact" pil magneet secties={{
  hero: { tekst: 'Neem contact op', href: '#contact' },
  werk: { tekst: 'Doe de websitescan', event: 'sectiedock:scan', href: '#websitescan' },
}}>
  Neem contact op
</SectieDock>
```

**WordPress.** Geen build-stap. Zet de map in je thema, enqueue de CSS, laad
`sectie-dock.js` met `wp_enqueue_script_module()`, en print de `<a>` via
`wp_footer`. Secties zijn gewone blokken met een `id` (Anker-veld in de
blok-instellingen); `data-dock-verberg` zet je via "Extra attributen" of een
eigen klasse plus `verberg: '.geen-dock'`.

## Markup-contract

- Eén `<a class="sd" href="…" data-sectie-dock>tekst</a>`. **Tekst en href zijn
  de zonder-JS-fallback**: een vaste pil rechtsonder naar het contact. Ze zijn
  ook de standaardactie voor plekken buiten alle geconfigureerde secties.
- JS vervangt de kinderen door schijf (ring + pijl) en pil, en zet ze bij
  `destroy()` terug.
- Secties zijn gewone elementen met een `id`; de config koppelt die id's aan
  een actie. De volgorde van de sleutels is de paginavolgorde.
- `data-dock-verberg` op elk element waarin de dock weg moet (afsluiter,
  footer, een blok met een eigen CTA).
- Zet de `<a>` vroeg in de DOM (na de overslaanlink). Wie midden op de pagina
  staat, bereikt hem dan met Shift+Tab; zit hij onderaan de DOM en staat er een
  CTA in de afsluiter, dan is hij daar verborgen en wordt hij overgeslagen.
  De dock is een snelkoppeling: dezelfde acties horen ook als gewone link in de
  pagina te staan.

## Opties (`init(root, opties)`)

`root` bevat de secties en de dock; `document.body` mag.

| Optie | Standaard | Omschrijving |
|---|---|---|
| `secties` | `{}` | Sectie-id → actie (zie hieronder). |
| `standaard` | tekst + href van de `<a>` | Actie buiten alle secties. |
| `toonNa` | eerste sectie in `secties` | Selector van het element dat voorbij moet zijn (zijn onderkant boven 50% van het scherm), of een getal = scroll-Y in px. |
| `verberg` | `[data-dock-verberg]` | Selector voor elementen waarin de dock verdwijnt. |
| `drempel` | `0.4` | Een sectie is actief zodra haar top boven dit deel van de schermhoogte komt. |
| `pil` | `false` | Vanaf 900 px breed met muis een pil in plaats van een schijf. |
| `magneet` | `false` | Schijf trekt naar de cursor binnen 140 px (max. 22 px, pijl 6 px verder), veert terug bij loslaten. |
| `reserveer` | `false` | Zet padding-bottom op `root` zodat de laatste regel nooit onder de dock valt. Niet nodig als de laatste sectie `data-dock-verberg` heeft. |
| `wisselMs` | `220` | Duur van de fade bij tekstwissel. |
| `dock` | `[data-sectie-dock]` | Element of selector van de dock. |

**Actie per sectie**

| Veld | Omschrijving |
|---|---|
| `tekst` | Tekst rond de schijf (wordt hoofdletters, herhaald tot de omtrek vol is; te lang = kleiner lettertje). Houd het onder ± 28 tekens. |
| `label` | Toegankelijke naam. Standaard `tekst`. Noem hier de actie. |
| `pil` | Andere tekst voor de desktop-pil, bv. `Websitescan · 2 min`. |
| `href` | Link. Blijft ook de fallback als er een `event` of `actie` is. |
| `event` | Naam van een `CustomEvent` dat op `document` wordt verstuurd (`detail.sectie`). De link volgt dan niet. |
| `actie` | Callback `({ sectie, cfg, event })` bij klik. De link volgt dan niet. |

Elke tekst en tijdsaanduiding ("2 min") is inhoud die jij invult: de module
verzint niets (R8).

CSS-variabelen op `.sd`: `--sd-maat` (96px), `--sd-rand` (16px), `--sd-z` (60),
`--sd-ring`, `--sd-accent`, `--sd-ink`, `--sd-cream`, `--sd-font`, `--sd-focus`.

## Toegankelijkheid

- De dock is een echte `<a>`. Zijn **naam is het `aria-label` van de huidige
  actie** en wisselt meteen mee met de sectie, ook voor wie de fade niet ziet.
  De draaiende ring en de pil zijn `aria-hidden` (label-in-naam: begin het
  `label` met de zichtbare tekst).
- Verborgen = `visibility: hidden` (na de fade): niet met Tab bereikbaar, niet
  voorgelezen.
- Zichtbare focus: 3 px outline plus witte tussenrand, werkt op licht en donker.
- Minder beweging (ook live omgezet): geen draai, geen puls, geen magneet, geen
  overgangen; de tekst wisselt direct.
- Touch: geen magneet. De schijf is 96 px, ruim boven 44 px.
- `env(safe-area-inset-bottom/right)` wordt gerespecteerd (zet `viewport-fit=cover`).
- Contrast tekst: inkt (#14110f) op oranje (#ff5b24) is ≈ 6:1; pil crème op inkt ≈ 17:1.
- **Niet-tekstcontrast (WCAG 1.4.11): ≥ 3:1 op elke scrollpositie, los van de sectie.** Oranje
  alleen haalt dat niet op een lichte pagina (≈ 2,7:1). Daarom heeft de dock een dubbele rand:
  een inktkleurig lichaam (pil) of 3 px inktrand (schijf), met daaromheen een 2 px crème halo.
  Op licht steekt de inkt af, op donker de halo (gemeten ≥ 16:1), ook in de overgang tussen twee
  secties, want de kleur hangt niet van de actieve sectie af. De meting scrolt in stappen van 30 px
  over de hele demo (390 en 1440 breed) en toetst per positie tegen de echte achtergrond naast
  de dock. Met eigen kleuren (`--sd-ring`, `--sd-halo`, `--sd-ink`, `--sd-cream`) meet je opnieuw.
- **Label in naam (WCAG 2.5.3):** de zichtbare pil-tekst (`pil`, anders `tekst`) moet letterlijk in
  het `label` voorkomen. Vangnet: de module geeft een `console.warn` (één keer per tekst) als dat
  niet zo is, bv. pil "Kennismaking plannen" tegenover label "Plan een kennismaking".
- De dock bedekt nooit blijvend content: hij verdwijnt in `data-dock-verberg` en
  verschijnt pas na de hero. Tijdens het scrollen zweeft hij natuurlijk over
  content; zet `reserveer` aan als de laatste sectie hem niet verbergt.

## Valkuilen

- **`console.warn` over label en pil**: pas `label` of `pil` aan tot de zichtbare tekst in de naam staat.
- **Sectie-id ontbreekt**: die sectie wordt overgeslagen, de vorige blijft actief.
- **Tarief- of afsluitersectie zonder `data-dock-verberg`**: de dock hangt dan
  over de eigen knop. Zet het attribuut, of `reserveer`.
- **Secties korter dan het scherm**: de afsluiter komt dan al in beeld terwijl de
  vorige sectie nog actief is; de dock verdwijnt dan iets eerder. Bedoeld gedrag.
- **`event` zonder luisteraar**: klik doet niets. Luister met
  `document.addEventListener('sectiedock:scan', …)`.
- **Lange tekst**: onder ± 28 tekens blijft de ring leesbaar; erboven krimpt het lettertype.
- **Andere vaste elementen rechtsonder** (WhatsApp-knop, cookiebalk): kies er één.
- **Flits van de fallback-pil** vóór init voorkom je met de `sd-js`-klasse op `<html>`.
- **React**: `actie`-functies horen niet in de effect-sleutel; de wrapper leest ze uit
  de laatste props, maar wijzig `secties` niet elke render (geen nieuw object per keer
  met andere inhoud).

## Herkomst

Sectie-dock en magnetische schijven van **socialnextagency.nl** (onderzocht
29-09-2026, `research/socialnextagency/OVERZICHT.md` rij S4 en S8): schijf met
draaiende tekst, tekst en actie per sectie via `window.SNA_DOCK`, verdwijnt bij de
afsluiter, draai gepauzeerd buiten beeld, magneet 140 px / 22 px / pijl 6 px.
Eigen implementatie, geen code overgenomen; getallen als vertrekpunt.

**Wat wij beter doen:** de dock is een echte link met een naam die de huidige actie
noemt (bij hen leest een schermlezer de draaiende tekst); zonder JS een vaste link
naar het contact; de ring sluit exact op de omtrek bij elke tekstlengte;
`prefers-reduced-motion` reageert live op de draai én de magneet; de magneet staat
uit op touch; `destroy()` ruimt alles op en zet de oorspronkelijke link terug; de
verberg-zones zijn een attribuut in plaats van een vaste sectie-naam `contact` in de
code.
