# Puntentelling christianbleeker.com v2

Punten per onderdeel uit `catalogus.json` van de onderdelenbibliotheek (`CATALOGUS=<pad>`). Een onderdeel telt één keer
per site; 1-punters tellen niet mee. `node scripts/punten.mjs` leest **alle** tabellen hieronder, controleert de
punten tegen de catalogus en zoekt per rij de selector in de DOM van de draaiende site (`BASIS_URL`, standaard
`http://localhost:4850`; `THEMA=licht|donker` meet in één thema). Komt een selector niet voor, dan telt hij niet.
Een selector die met `js:` begint is een meting in de pagina (voor onderdelen zonder DOM-spoor); gebruik daarin
geen `|`.

Doel v2: ≥ 150 punten en ≥ 4 onderdelen van 4+ (BOUWPLAN-V2.md). Stand na fase 1: zie de laatste uitvoer van
punten.mjs in het rapport van fase 1.

**Fase 2:** elke maker voegt rijen toe in het blok van zijn eigen pagina('s), alleen daar. Een onderdeel dat al
ergens telt, telt niet nog eens (de eerste rij wint); zet een tweede plaatsing op `nee`. Kolom `Pagina` = het pad
waarop gemeten wordt; `*` = elke route, ook de 404.

## Home `/`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| / | media-hero | heroes/media-hero | 3 | ja | `.hero[data-media-hero][data-mh-status]` | hero met TEDx-foto's en pauzeknop |
| / | rotating-headline | typography/rotating-headline | 3 | ja | `[data-rotating-headline][data-rh-ready]` | het wisselwoord onder de kop |
| / | count-up | stats/count-up | 2 | ja | `.tel .cu__waarde[data-cu-waarde]` | de telstrip onder de hero |
| / | stapelpanelen | scroll/stapelpanelen | 3 | ja | `.stapel[data-stapelpanelen][data-sp-modus]` | uitgelicht werk als stapel panelen |
| / | hover-set | cards/hover-set | 2 | ja | `.meer-rij .hover-card[data-hover]` | "Meer projecten" |
| / | lottie-icon | media/lottie-icon | 3 | ja | `.doen-icoon[data-lottie-active]` | de vier iconen bij "Wat we doen" |
| / | reveal-on-scroll | scroll/reveal-on-scroll | 2 | ja | `[data-ros-active] [data-reveal]` | secties komen in beeld (ook /about, /work, /ai) |
| / | letter-reveal | typography/letter-reveal | 3 | ja | `.voet-kop[data-letter-reveal] [data-lr-ch]` | de slotzin in de lange voet |
| / | sectie-dock | conversion/sectie-dock | 3 | ja | `.sd[data-sd-klaar]` | vaste CTA die per sectie wisselt |
| / | beeldexplosie | heroes/beeldexplosie | 5 | ja | `.werk-explosie[data-bx-actief] [data-bx-beeld]` | opening van Werk: elf klantomslagen vliegen uit, de showreel van dertien sites groeit (h2; de hero blijft media-hero) |
| / | kinetic-type | typography/kinetic-type | 4 | ja | `.doen h3[data-kinetic-type][style*="--kt-w"]` | de vier dienstkoppen bij "Wat we doen" worden vetter richting het midden (Unbounded, alleen wght) |
| / | story-word-light | scroll/story-word-light | 4 | ja | `.over-swl [data-story-word]` | de alinea van "Over mij" licht woord voor woord op, "verhaal" wordt vet |
| / | punt-zoom-intro | effects/punt-zoom-intro | 4 | ja | `[data-punt-zoom-intro] [data-zoom-target]` | intro 1× per sessie: het merk, de × opent de site |
| / | film-grain | effects/film-grain | 3 | ja | `.hero > .fg-laag` | filmkorrel alleen over de TEDx-foto van de hero |
| / | letter-rol | buttons/letter-rol | 3 | ja | `.knop [data-letter-rol][data-lr-actief]` | de knoppen "Bekijk alle projecten" rollen bij hover/focus |
| / | review-wall | reviews/review-wall | 3 | ja | `.reviews-wand[data-rw-weergave] .rw__kaart` | "Wat klanten zeggen": zes voorbeeldreviews, als voorbeeld gemarkeerd, zonder score |
| / | footer-opkomst | effects/footer-opkomst | 2 | ja | `footer.voet[data-opkomst] [data-opkomst-inhoud]` | de lange voet zakt bij het inscrollen op zijn plek |

## Over `/about`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /about | beeld-letters | typography/beeld-letters | 4 | ja | `.over-letters[data-bl-actief]` | foto door de letters van "Over mij" |
| /about | marquee | scroll/marquee | 4 | ja | `.bekend-band[data-marquee-ready]` | logoband "Bekend van" |
| /about | krachtveld-logowand | effects/krachtveld-logowand | 4 | ja | `[data-krachtveld][data-kv-actief]` | klantlogo's op veldlijnen rond de schijf |
| /about | circle-text | typography/circle-text | 3 | ja | `.kv__schijf[data-ct-ready]` | de draaiende ring rond de schijf van de logowand |
| /about | flip-lightbox | media/flip-lightbox | 4 | ja | `.ervaringen a.ervaring[data-lightbox]` | aanbevelingen die openklappen |
| /about | video-facade | media/video-facade | 1 | nee | `.gesprek .vf[data-video-facade]` | TEDx-talk en gesprekken (ook /ai) |
| /about | sticky-timeline | scroll/sticky-timeline | 4 | ja | `.reis-lijn[data-sticky-timeline-ready]` | "Van marketing naar AI": de lijn vult mee langs vier stappen |
| /about | hotspots | media/hotspots | 3 | ja | `js:(() => { const b = document.querySelector('.over-hotspots .hotspots__point'); b.click(); const ok = b.getAttribute('aria-expanded') === 'true' && !document.getElementById(b.getAttribute('aria-controls')).hidden; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return ok })()` | drie punten op het portret (wie, aan tafel, Dicteren.ai) |
| /about | justify-fill | typography/justify-fill | 3 | ja | `.statement-tekst[data-jf-ready] .jf__line` | "Een goede website begint bij de mensen erachter." over de volle breedte |
| /about | schreef-accent | typography/schreef-accent | 2 | ja | `js:getComputedStyle(document.querySelector('.reis-kop h2 em')).fontFamily.includes('Instrument Serif')` | "naar" in de kop van de tijdlijn |

## AI `/ai`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /ai | video-facade | media/video-facade | 1 | nee | `.ai-video .vf[data-video-facade]` | de video op de AI-pagina |
| /ai | voor-na-verhaal | scroll/voor-na-verhaal | 5 | ja | `.ai-vnv[data-vnv-klaar] .vnv-podium` | "Deze site, vóór en na": vorige site, nieuwe site, wit |
| /ai | impact-scan | tools/impact-scan | 4 | ja | `.ai-scan-knoppen[data-isc-init] [data-impact-scan-open]` | AI-scan in scoremodus (zeven stellingen) |
| /ai | kaartenrij-lottie | scroll/kaartenrij-lottie | 4 | ja | `.ai-vragen[data-kaartenrij-aan] [data-kaartenrij-kaart]` | "Zes vragen die AI over jou stelt" |
| /ai | password-reveal | typography/password-reveal | 4 | ja | `.ai-scan-woord[data-pr-ready] .pr__mask` | "onzichtbaar." onthult zich in de kop van de scan |

## Werk `/work`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /work | bento-grid | layouts/bento-grid | 3 | ja | `.werk-bento [data-tegel]` | de dertien klantwebsites |
| /work | custom-cursor | effects/custom-cursor | 3 | ja | `.vf-cursor--ring` | "Bekijk"-cursor boven de klanttegels |
| /work | handwritten-accent | typography/handwritten-accent | 2 | ja | `[data-handwritten-accent][data-hwa-ready]` | het handgeschreven label bij het team van Eigen product (ook Home) |
| /work | drag-carousel | carousels/drag-carousel | 4 | ja | `.demo-rij[data-carousel-gridlijn] .carousel__slide` | de twintig ontwerp-demo's, sleepbaar op de gridlijn |
| /work | device-mockup | portfolio/device-mockup | 3 | ja | `.demo-laptop [data-device-screen][style*="--dm-duration"]` | laptop + telefoon per ontwerp-demo |

## Casepagina `/work/[slug]` (gemeten op `/work/human-margin`)

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /work/human-margin | reislijn | scroll/reislijn | 4 | ja | `.case-lijn[data-reislijn-modus]` | de lijn langs de haltes van de case |
| /work/human-margin | marker-highlight | typography/marker-highlight | 1 | nee | `mark[data-marker]` | markeerstift onder de tussenkop |

## Contact `/contact`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|

## Elke pagina `*`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| * | pill-nav | navigation/pill-nav | 3 | ja | `nav.pn[data-pn-position]` | zwevende pil vanaf 960 px, met de thema-schakelaar |
| * | image-menu | navigation/image-menu | 4 | ja | `.kop-mobiel [data-im-panel]` | schermvullend menu met foto per item (mobiel/tablet) |
| * | chatgpt-intake-knop | tools/chatgpt-intake-knop | 2 | ja | `[data-cik-ready]` | "Website-checklist prompt" in de kop |
| * | page-transitions | effects/page-transitions | 3 | ja | `.pt-overlay` | paginaovergangen |
| * | tab-title-lokker | effects/tab-title-lokker | 2 | ja | `js:(async (t) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); await new Promise((r) => setTimeout(r, 300)); const anders = document.title !== t; delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); return anders })(document.title)` | lokzin in een verborgen tabblad |

Niet in de catalogus en dus zonder punten: `toestemming/` (cookiemelding, infrastructuur). De thema-schakelaar
(wit/donker) is eigen code, geen bibliotheekonderdeel.
