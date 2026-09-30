# chatgpt-intake-knop

Knop of pil die ChatGPT (standaard) of Claude opent met een kant-en-klare
intakeprompt. De prompt komt uit een los `.md`-bestand of een inline
template, met placeholders (`{{bedrijf}}`, `{{site}}`) die de bouwer vult via
data-attributen. Boven een instelbare lengte schakelt de module automatisch
om naar een klembord-flow, zodat de link nooit te lang wordt voor een
browser of proxy.

## Wanneer wel

- Een intakeknop/-pil op een portfolio- of bureausite, zoals in de
  navigatie, een hero-CTA, of een "voordat je belt"-blok.
- Elke prompt die je als los, onderhoudbaar `.md`-bestand wilt beheren in
  plaats van als string in de JS.

## Wanneer niet

- Voor een prompt die per bezoeker dynamisch moet worden opgebouwd uit
  formuliervelden — deze module vult alleen vaste placeholders in, geen
  live formulierdata.
- Niet voor het daadwerkelijk voeren van het gesprek in de eigen site (dat
  is een chat-widget, geen link-knop).

## Installatie

```
component-library/tools/chatgpt-intake-knop/
├── chatgpt-intake-knop.js      # vanilla ES-module, 0 dependencies
├── chatgpt-intake-knop.css     # namespaced op .cik
├── ChatgptIntakeKnop.tsx       # React/Next.js client-wrapper
├── intake-prompt.md            # voorbeeldprompt voor Seveke Creative-klanten
├── demo.html                   # zelfstandige demo (Studio Wester)
└── test/meet.mjs               # Playwright-meting
```

**Vanilla / elk framework**

```html
<a class="cik cik--pill" data-cik-trigger data-target="chatgpt"
   data-prompt-src="./intake-prompt.md" data-bedrijf="Studio Wester" data-site="studiowester.nl"
   href="./intake-prompt.md">Website-checklist prompt ↗</a>

<link rel="stylesheet" href="./chatgpt-intake-knop.css" />
<script type="module">
  import { init } from './chatgpt-intake-knop.js';
  const destroy = init(document.body); // zoekt zelf naar [data-cik-trigger]
</script>
```

**React / Next.js (App Router)**

```tsx
import { ChatgptIntakeKnop } from '@/component-library/tools/chatgpt-intake-knop/ChatgptIntakeKnop';

<ChatgptIntakeKnop placeholders={{ bedrijf: 'Studio Wester', site: 'studiowester.nl' }}>
  <a data-cik-trigger data-target="chatgpt" data-prompt-src="/intake-prompt.md" href="/intake-prompt.md">
    Website-checklist prompt ↗
  </a>
</ChatgptIntakeKnop>
```

**WordPress**

Geen build-stap nodig. Zet de map in je thema, enqueue de CSS en laad de JS
als module (zie de "Op WordPress"-sectie van `scroll/reveal-on-scroll` voor
het volledige `wp_enqueue_script_module()`-recept — dat geldt hier
onveranderd). Plaats de trigger-markup in een Custom HTML-blok en zet
`intake-prompt.md` als thema-asset neer; verwijs er met een absoluut pad
naar in `data-prompt-src`.

## Markup-contract

- Elke trigger is een échte `<a href="…">` die **zonder JS** naar het
  promptbestand zelf linkt (R4) — de bezoeker kan de tekst dan lezen en
  handmatig kopiëren.
- `data-cik-trigger` — markeert het element als trigger; `init()` zoekt
  hiernaar binnen `root` met `querySelectorAll`.
- `data-prompt-src` — relatief of absoluut pad naar een `.md`/`.txt`-bestand
  met de prompt, gefetcht bij `init()`. Genegeerd als `promptTemplate` is
  meegegeven aan `init(root, opties)`.
- `data-target` — `"chatgpt"` (standaard) of `"claude"`.
- `data-bedrijf`, `data-site` — vullen `{{bedrijf}}` / `{{site}}` in de
  prompt. Ontbreekt een data-attribuut, dan valt de module terug op
  `opties.placeholders`.
- `data-drempel` — overschrijft per trigger de lengte-drempel (tekens in de
  opgebouwde URL) waarboven de klembord-flow gebruikt wordt.
- Na `init()` krijgt een klare trigger `data-cik-ready` en
  `data-cik-modus="direct"` (korte URL) of `"klembord"` (lange prompt). Een
  `<span class="cik__feedback" role="status" aria-live="polite">` wordt na
  de trigger ingevoegd voor de kopieerfeedback.

## Opties (`init(root, opties)`), met standaardwaarden

| Optie | Standaard | Omschrijving |
|---|---|---|
| `selector` | `"[data-cik-trigger]"` | CSS-selector voor de triggers. |
| `promptTemplate` | `null` | Inline prompt-tekst; wint over `data-prompt-src` op elke trigger. |
| `placeholders` | `{}` | Standaardwaarden `{ bedrijf, site }`; een data-attribuut op de trigger zelf wint. |
| `drempel` | `8000` | Tekens in de opgebouwde URL waarboven de klembord-flow start. Chris' eigen link (christianbleeker.com) is 28.700 tekens — ver boven elke redelijke drempel. |

## Toegankelijkheid

- `target="_blank"` + `rel="noopener"` op elke trigger, en een
  `aria-label` die de zichtbare tekst aanvult met "(opent in nieuw
  tabblad)" — zodat een schermlezer dat vooraf aankondigt (R14/R15).
- De kopieerfeedback staat in een `role="status" aria-live="polite"`-element:
  een schermlezer hoort "Prompt gekopieerd — plak hem in ChatGPT" zonder dat
  de focus verspringt.
- Toetsenbord: de trigger is een gewone link — Tab + Enter activeert hem
  zoals elke link, met zichtbare focus via `:focus-visible`.
- Mislukt kopiëren (zeldzaam: geen Clipboard API én geen `execCommand`), dan
  meldt de feedback dat expliciet en verwijst naar het promptbestand — nooit
  een stille no-op.

## Valkuilen

- **Lange prompts kappen af.** Een prompt van tienduizenden tekens in een
  kale `?prompt=`-link kan door browsers, proxies of gedeelde chatlinks
  worden afgekapt (gezien bij christianbleeker.com, 28.700 tekens,
  ONGETEST of chatgpt.com dat zelf accepteert). Deze module test daarom
  altijd de lengte van de **volledige opgebouwde URL**, niet alleen de
  ruwe prompt-tekst, en schakelt zelf om.
- **`data-prompt-src` is een fetch.** Bij `file://` (dubbelklikken op
  `demo.html`) werkt `fetch()` niet in de meeste browsers — serveer de demo
  via een lokale server (`node _tools/test-server.mjs`-achtige setup) of
  gebruik `promptTemplate` in plaats van `data-prompt-src`.
  Mislukt de fetch (netwerk, 404), dan blijft de no-JS-link gewoon staan —
  de trigger crasht niet, hij blijft alleen in de "nog niet klaar"-staat.
- **`window.open()` na een `await`.** Bij de klembord-flow gebeurt de
  daadwerkelijke navigatie pas ná het kopiëren. Sommige pop-upblokkers
  beschouwen dat nog als user-gesture (het gebeurt synchroon binnen de
  click-afhandeling, alleen ná een `await` op een microtaak/korte promise),
  maar test dit altijd zelf in de browsers die je doelgroep gebruikt.
- **Placeholders die niet voorkomen in de prompt** worden gewoon genegeerd;
  een placeholder in de prompt die geen waarde heeft (`{{iets}}`) blijft
  onvervangen zichtbaar staan — vul dus altijd `data-bedrijf`/`data-site` in
  of geef ze mee via `opties.placeholders`.

## Herkomst

Idee gezien op christianbleeker.com: een pil in de navigatie
("Website-checklist prompt ↗") opent ChatGPT met een kant-en-klare
intake-assistent. Zo'n link kan zeer lang worden en kan afgekapt worden; wij meten de URL-lengte en vallen
automatisch terug op een klembord-flow met zichtbare feedback, zetten
`target="_blank"`/`rel="noopener"` en een beschrijvend `aria-label`, en
bieden zowel ChatGPT als Claude als doel aan. Eigen implementatie, geen
code overgenomen.
