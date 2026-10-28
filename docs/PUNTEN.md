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
| /about | eyebrow-lijn | scroll/eyebrow-lijn | 2 | ja | `.verhaal-eerste[data-eyebrow-lijn][data-el-actief] .el__lijn` | "Wie ik ben" met een lijn en pijl naar de eerste zin (v3, ook op /ai) |
| /about | section-dividers | shapes/section-dividers | 2 | ja | `.logowand > .sdv[data-divider] > svg` | de band "Websites" krijgt een zachte boog boven en onder (v3) |
| /about | gradient-flow | backgrounds/gradient-flow | 3 | ja | `.statement > .gf[data-gradient-flow] .gf__blob` | warm, traag bewegend kleurveld achter "Een goede website begint bij de mensen erachter." (v3) |

## AI `/ai`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /ai | video-facade | media/video-facade | 1 | nee | `.ai-video .vf[data-video-facade]` | de video op de AI-pagina |
| /ai | voor-na-verhaal | scroll/voor-na-verhaal | 5 | ja | `.ai-vnv[data-vnv-klaar] .vnv-podium` | "Deze site, vóór en na": vorige site, nieuwe site, wit |
| /ai | impact-scan | tools/impact-scan | 4 | ja | `.ai-scan-knoppen[data-isc-init] [data-impact-scan-open]` | AI-scan in scoremodus (zeven stellingen) |
| /ai | kaartenrij-lottie | scroll/kaartenrij-lottie | 4 | ja | `.ai-vragen[data-kaartenrij-aan] [data-kaartenrij-kaart]` | "Zes vragen die AI over jou stelt" |
| /ai | password-reveal | typography/password-reveal | 4 | ja | `.ai-scan-woord[data-pr-ready] .pr__mask` | "onzichtbaar." onthult zich in de kop van de scan |
| /ai | kader-hover | cards/kader-hover | 3 | ja | `.ai-kaders[data-kader-actief] [data-kader] [data-kader-knop]` | "Wat we met AI doen" als vier kaarten: selectiekader met handvatjes, de vervolgstap veert uit (v3-C) |
| /ai | floating-contact-card | conversion/floating-contact-card | 2 | ja | `.ai-snel[data-floating-contact-card][style*="--fcc-overlap"]` | "Snel contact" zweeft over de onderrand van de AI-kop: beschikbaarheid en de weg naar contact; de dock wijkt zolang hij in beeld is (v3-C) |
| /ai | pulse-button | buttons/pulse-button | 2 | ja | `.ai-snel a.pulse-button[href="/contact"]` | de knop in Snel contact: drie ringen, alleen in beeld, stil bij minder beweging (v3-C) |
| /ai | diepte-beeld | effects/diepte-beeld | 5 | ja | `.ai-diepte[data-diepte-beeld][data-db-actief] [data-diepte-laag].db-tekst h1` | het TEDx-podium in drie lagen: podium, de kop, het publiek ervoor (v3) |
| /ai | parallax | scroll/parallax | 3 | ja | `.ai-lijst-diepte .ai-nr[data-parallax-y]` | de grote nummers 01–04 van "Wat we met AI doen" drijven elk in een eigen tempo (v3) |
| /ai | eyebrow-lijn | scroll/eyebrow-lijn | 2 | nee | `.ai-intro[data-eyebrow-lijn]` | "AI" met lijn en pijl naar de intro onder het podium (telt op /about) |

## Werk `/work`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /work | bento-grid | layouts/bento-grid | 3 | ja | `.werk-bento [data-tegel]` | de dertien klantwebsites |
| /work | custom-cursor | effects/custom-cursor | 3 | ja | `.vf-cursor--ring` | "Bekijk"-cursor boven de klanttegels |
| /work | handwritten-accent | typography/handwritten-accent | 2 | ja | `[data-handwritten-accent][data-hwa-ready]` | het handgeschreven label bij het team van Eigen product (ook Home) |
| /work | drag-carousel | carousels/drag-carousel | 4 | ja | `.demo-rij[data-carousel-gridlijn] .carousel__slide` | de twintig ontwerp-demo's, sleepbaar op de gridlijn |
| /work | device-mockup | portfolio/device-mockup | 3 | ja | `.demo-laptop [data-device-screen][style*="--dm-duration"]` | laptop + telefoon per ontwerp-demo |
| /work | eindeloos-raster | layouts/eindeloos-raster | 4 | ja | `.alles-wand[data-er-actief] .er__raster` | beeldwand onder de showcase: klanten en demo's door elkaar, met de lijst "Alles op een rij" |
| /work | raster-intro | heroes/raster-intro | 4 | ja | `.werk-raster[data-raster-intro] h1.ri__kop .ri__woord--groot` | opening: een bouwtekening tekent zich, het × verschijnt, "Elk merk heeft een eigen verhaal." schuift in (1× per sessie) (v3) |
| /work | magneet-beelden | effects/magneet-beelden | 2 | ja | `.werk-magneet[data-magneet-actief] [data-magneet]` | de drie teamfoto's van Dicteren.ai buigen licht naar de muis (v3) |

## Casepagina `/work/[slug]` (gemeten op `/work/human-margin`)

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /work/human-margin | reislijn | scroll/reislijn | 4 | ja | `.case-lijn[data-reislijn-modus]` | de lijn langs de haltes van de case |
| /work/human-margin | marker-highlight | typography/marker-highlight | 1 | nee | `mark[data-marker]` | markeerstift onder de tussenkop |
| /work/human-margin | live-demo-kader | portfolio/live-demo-kader | 4 | ja | `.case-kader[data-ldk-actief][data-ldk-modus]` | de echte site in een browservenster (live na een klik waar de site dat toelaat) |
| /work/human-margin | kaartenstapel-zij | scroll/kaartenstapel-zij | 4 | ja | `.volgende-stapel[data-kz-modus]` | de volgende vier cases als zijwaartse stapel |
| /work/human-margin | flip-card | cards/flip-card | 3 | ja | `.case-flip .flip-card__face--back[inert]` | de omslag draait om naar het ontwerpdoel en de link naar de echte site (op elke casepagina; v3-C) |

## Contact `/contact`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /contact | stappen-persoonlijk | forms/stappen-persoonlijk | 4 | ja | `#intake-formulier[data-sp-js] [data-sp-stap]` | het contactformulier als intake in drie stappen |
| /contact | advies-funnel | tools/advies-funnel | 4 | ja | `.pakket-advies .af-widget` | "Welk pakket past bij jou?" |
| /contact | prijzen-per-dienst | pricing/prijzen-per-dienst | 3 | ja | `.prijzen[data-ppd-actief] [role="tab"]` | open prijzen per dienst (voorstel, wacht op Chris) |
| /contact | agenda-facade | media/agenda-facade | 2 | ja | `.kennismaken .af[data-af-klaar]` | kennismaking plannen; de agenda laadt pas na een klik |
| /contact | availability-badge | badges/availability-badge | 2 | ja | `.contact-badge [data-ab-maand]` | "Ruimte voor nieuwe projecten in …" onder de kop |
| /contact | hero-motion | scroll/hero-motion | 3 | ja | `.contact-links[data-hero-stage] .contact-h1 [data-hero-ch]` | "Contact" rijst letter voor letter op, de rest volgt (zonder wegzakken: het formulier staat ernaast) (v3) |
| /contact | float-decor | effects/float-decor | 3 | ja | `.contact-foto-houder[data-offset-kader]` | verschoven kader in de hoofdkleur achter de foto (v3) |
| /contact | ghost-text | typography/ghost-text | 2 | ja | `.prijzen-ghost [data-ghost-text]` | een groot, open "€" achter "Wat kost het?" (v3) |

## Werkplaats `/werkplaats` (v3, maker A)

Nieuwe pagina "Wat we voor jouw vak bouwen": twaalf werkende proefstukken per vak, in vier groepen, elk gemarkeerd als
voorbeeld. Waar een ontwerp-demo bij het vak past, linkt het proefstuk ernaar.

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| /werkplaats | three-mascot | effects/three-mascot | 5 | ja | `.wp-hond [data-mascot] canvas.tm-canvas:not([hidden])` | Bobbie, de hond "voor een dierenarts" in de hero (3D op desktop, poster op touch en bij minder beweging) |
| /werkplaats | werkgebied-kaart | scroll/werkgebied-kaart | 5 | ja | `.wp-kaart.wk-js .wk-nav-knop` | "voor een aannemer of installateur": vier projecten in West-Friesland |
| /werkplaats | afstand-postcode | tools/afstand-postcode | 4 | ja | `.wp-afstand [data-afstand-lijst] [data-locatie][data-lat]` | "voor een fysiotherapeut met meer praktijken" (PDOK pas na Zoek) |
| /werkplaats | kleur-configurator | tools/kleur-configurator | 4 | ja | `.wp-kleur[data-kleur-actief] [data-kleur-img]` | "voor een timmerfabriek": de voordeur in vier kleuren |
| /werkplaats | boekingsvelden | tools/boekingsvelden | 3 | ja | `.wp-boeking[data-bv-actief] form` | "voor een restaurant": door naar een eigen voorbeeldpagina, 0 externe verzoeken |
| /werkplaats | rechtenmatrix | tools/rechtenmatrix | 3 | ja | `.wp-rechten[data-rm-actief] .rm-app` | "voor een data- en AI-bureau": wat de assistent zelf doet |
| /werkplaats | besteldeadline | tools/besteldeadline | 2 | ja | `.wp-deadline [data-besteldeadline-input][min]` | "voor een bakker": vóór 12.00 nog vandaag |
| /werkplaats | open-status | badges/open-status | 2 | ja | `.wp-open-status[data-os-status]` | "voor een tandartspraktijk" |
| /werkplaats | drempelteller | badges/drempelteller | 2 | ja | `.wp-drempel[data-dt-actief] [role="progressbar"]` | "voor een yogastudio": 9 van 12 aanmeldingen (voorbeeld) |
| /werkplaats | zoek-keuzelijst | forms/zoek-keuzelijst | 2 | ja | `.wp-keuzelijst[data-zk-actief] .zk__input` | "voor een boekhouder": 151 beroepen met zoekwoorden |
| /werkplaats | link-dialog-funnel | modals/link-dialog-funnel | 3 | ja | `js:(async () => { document.querySelector('.wp-intake a').click(); await new Promise((r) => setTimeout(r, 400)); const d = document.querySelector('dialog.ldf-dialog[open]'); if (d) d.close(); return !!d })()` | "voor een advocatenkantoor": intake in een dialoog, verstuurt niets |
| /werkplaats | kennisbank-filter | layouts/kennisbank-filter | 3 | ja | `.wp-kennis [data-kb-controls]:not([hidden])` | "voor een psychologenpraktijk" |

## Elke pagina `*`

| Pagina | Onderdeel | Map | Punten | Telt | Selector | Waar |
|---|---|---|---|---|---|---|
| * | pill-nav | navigation/pill-nav | 3 | ja | `nav.pn[data-pn-position]` | zwevende pil vanaf 960 px, met de thema-schakelaar |
| * | image-menu | navigation/image-menu | 4 | ja | `.kop-mobiel [data-im-panel]` | schermvullend menu met foto per item (mobiel/tablet) |
| * | chatgpt-intake-knop | tools/chatgpt-intake-knop | 2 | ja | `[data-cik-ready]` | "Website-checklist prompt" in de kop |
| * | page-transitions | effects/page-transitions | 3 | ja | `.pt-overlay` | paginaovergangen |
| * | scroll-richting-nav | navigation/scroll-richting-nav | 2 | ja | `.kop-desktop .pn[data-srn-aan]` | de pil (en de mobiele kop) wijkt bij omlaag scrollen en komt terug bij omhoog (v3-C, leesstand) |
| * | flip-side-menu | navigation/flip-side-menu | 3 | ja | `.ls-fsm [data-fsm-panel][aria-hidden="true"]` | desktop, leesstand: is de pil weg, dan klapt de knop MENU/SLUIT om en opent het zijmenu (v3-C) |
| * | vel-menu | navigation/vel-menu | 3 | ja | `.ls-vel-knop[aria-haspopup="dialog"][aria-controls="leesmenu"]` | telefoon/tablet, leesstand: is de kop weg, dan opent de menuknop het vel; bovenaan blijft het beeldmenu (v3-C) |
| * | logo-kleurwissel | effects/logo-kleurwissel | 2 | ja | `.ls-logo[data-lk-staat]` | het merk in de leesstand; boven de omgekeerde logowand op /about keert het om (v3-C) |
| * | lottie-scrub | media/lottie-scrub | 3 | ja | `footer .voet-lijn[data-lottie-scrub-klaar]` | de voetlijn "— × — × —" tekent zich mee met de scroll; eindbeeld bij minder beweging (v3-C) |
| /bestaat-niet | veeg-rij | cards/veeg-rij | 2 | ja | `.verder [data-veeg] [data-veeg-tekst]` | 404: "Misschien zocht je dit", vier pagina's als regels waar een kleurvlak overheen veegt (v3-C) |
| * | tab-title-lokker | effects/tab-title-lokker | 2 | ja | `js:(async (t) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); await new Promise((r) => setTimeout(r, 300)); const anders = document.title !== t; delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); return anders })(document.title)` | lokzin in een verborgen tabblad |

Niet in de catalogus en dus zonder punten: `toestemming/` (cookiemelding, infrastructuur). De thema-schakelaar
(wit/donker) is eigen code, geen bibliotheekonderdeel.
