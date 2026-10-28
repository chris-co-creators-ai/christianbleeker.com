# Herkomst van de features in deze map

Deze basis komt kaal: alleen `toestemming/` (de cookiemelding + Consent Mode-koppeling) staat
hier standaard in, want dat is infrastructuur (privacy/toestemming), geen ontwerp.

Elk ander effect komt per klant binnen, gekozen in de PRD (stap 5 van het websiteproces —
zie de catalogus van de bibliotheek) en
gekopieerd met:

```
node scripts/nieuwe-site.mjs --slug <slug> --naam "<Naam>" --domein https://... \
  --mail-naar iemand@bedrijf.nl --features <map>,<map>
```

Dat kopieert elke genoemde map uit de onderdelenbibliotheek van Seveke Creative (vanilla JS/CSS + de dunne
React-wrapper, zonder `test/`, `demo.html`, `.claude/`) naar `src/features/<naam>/` en zet 'm
hieronder in de tabel — inclusief de reden ("gekozen in PRD/stap 5"). Een map die niet in
`catalogus.json` staat wordt geweigerd (zie het script voor de foutmelding).

| Map | Bron in `component-library/` | Gekopieerd | Reden |
|---|---|---|---|
| `media-hero/` | `heroes/media-hero/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `rotating-headline/` | `typography/rotating-headline/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `count-up/` | `stats/count-up/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `stapelpanelen/` | `scroll/stapelpanelen/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `lottie-icon/` | `media/lottie-icon/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `handwritten-accent/` | `typography/handwritten-accent/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `bento-grid/` | `layouts/bento-grid/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `custom-cursor/` | `effects/custom-cursor/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `hover-set/` | `cards/hover-set/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `page-transitions/` | `effects/page-transitions/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `reislijn/` | `scroll/reislijn/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `marker-highlight/` | `typography/marker-highlight/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `beeld-letters/` | `typography/beeld-letters/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `marquee/` | `scroll/marquee/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `krachtveld-logowand/` | `effects/krachtveld-logowand/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `flip-lightbox/` | `media/flip-lightbox/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `video-facade/` | `media/video-facade/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `pill-nav/` | `navigation/pill-nav/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `image-menu/` | `navigation/image-menu/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `chatgpt-intake-knop/` | `tools/chatgpt-intake-knop/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `sectie-dock/` | `conversion/sectie-dock/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `letter-reveal/` | `typography/letter-reveal/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `reveal-on-scroll/` | `scroll/reveal-on-scroll/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `tab-title-lokker/` | `effects/tab-title-lokker/` | 2026-09-29 | gekozen in PRD/stap 5 |
| `drag-carousel/` | `carousels/drag-carousel/` (f605c67) | 2026-10-28 | v2: de twintig ontwerp-demo's op /work |
| `device-mockup/` | `portfolio/device-mockup/` (f605c67) | 2026-10-28 | v2: laptop + telefoon per ontwerp-demo |
| `beeldexplosie/` | `heroes/beeldexplosie/` | 2026-10-28 | v2 Home: opening van Werk (zonder `media/`; eigen showreel in `public/videos/werk-reel*`) |
| `kinetic-type/` | `typography/kinetic-type/` | 2026-10-28 | v2 Home: dienstkoppen (zonder `fonts/`: het huisfont Unbounded, alleen wght) |
| `story-word-light/` | `scroll/story-word-light/` | 2026-10-28 | v2 Home: alinea van "Over mij" |
| `punt-zoom-intro/` | `effects/punt-zoom-intro/` | 2026-10-28 | v2 Home: intro 1× per sessie |
| `film-grain/` | `effects/film-grain/` | 2026-10-28 | v2 Home: korrel over de hero-foto |
| `letter-rol/` | `buttons/letter-rol/` | 2026-10-28 | v2 Home: knoppen |
| `review-wall/` | `reviews/review-wall/` | 2026-10-28 | v2 Home: voorbeeldreviews |
| `footer-opkomst/` | `effects/footer-opkomst/` | 2026-10-28 | v2 Home: lange voet |
| `sticky-timeline/` | `scroll/sticky-timeline/` (e81470a) | 2026-10-28 | v2 Over: "Van marketing naar AI" |
| `hotspots/` | `media/hotspots/` (e81470a) | 2026-10-28 | v2 Over: punten op het portret (kern van e81470a) |
| `justify-fill/` | `typography/justify-fill/` (e81470a) | 2026-10-28 | v2 Over: de uitgevulde zin |
| `schreef-accent/` | `typography/schreef-accent/` (e81470a) | 2026-10-28 | v2 Over: "naar" in de kop van de tijdlijn |
| `voor-na-verhaal/` | `scroll/voor-na-verhaal/` (e81470a) | 2026-10-28 | v2 AI: deze site, vóór en na |
| `impact-scan/` | `tools/impact-scan/` (e81470a) | 2026-10-28 | v2 AI: de AI-scan (scoremodus, titel h2) |
| `kaartenrij-lottie/` | `scroll/kaartenrij-lottie/` (e81470a) | 2026-10-28 | v2 AI: zes vragen; iconen opnieuw gemaakt met maak-iconen.mjs |
| `password-reveal/` | `typography/password-reveal/` (e81470a) | 2026-10-28 | v2 AI: "onzichtbaar." in de kop van de scan |

## Hoe je later bijwerkt

1. Vergelijk het bestand in `component-library/<pad>/` met het gelijknamige bestand hier
   (`diff <bibliotheek>/<pad>/<bestand> src/features/<naam>/<bestand>`).
2. Kopieer opnieuw met dezelfde aanpak (zonder `test/`, `demo.html`, `.claude/`) als de
   bibliotheek-versie is bijgewerkt en je die verbetering wilt overnemen.
3. Wijzig je hier iets projectspecifieks (een kleurtoken, een uitzondering) dat je niet in de
   bibliotheek wilt: zet dat bij voorkeur als een **eigen, specifiekere CSS-selector in
   `src/app/globals.css`** of als een **prop/optie op de React-wrapper** — niet als een
   handmatige wijziging ín het gevendorde bestand zelf. Een wijziging ín een gevendord bestand
   overleeft de volgende her-vendor niet.

## Wat hier bewust niet in zit

Elk effect dat in het voorbeeldproject waar deze basis uit ontstaan is standaard meekwam (zie
`LEESMIJ.md`) — een glazen cursorlens, een gepinde horizontale scroll-track, een
scroll-gestuurd "dichtdrukkend" lettertype-effect, een aanvraagfunnel-dialoog, een
scroll-gestuurde oplichtende storyline en dergelijke — is hier verwijderd. Dat waren
ontwerpkeuzes voor één klant, geen infrastructuur; ze komen terug zodra een PRD ze kiest, via
`--features` hierboven.

## Afwijkingen in deze site

- `marquee/Marquee.tsx`, `reislijn/Reislijn.tsx` en `stapelpanelen/Stapelpanelen.tsx` heten hier
  `MarqueeBand.tsx`, `ReislijnLijn.tsx` en `StapelpanelenBlok.tsx`. Op een schijf die hoofdletters
  niet onderscheidt (macOS) wees TypeScript `./marquee.js` anders naar de wrapper zelf. De inhoud is
  ongewijzigd.
- `circle-text/` (css + js) komt uit `typography/circle-text/`: de draaiende
  ring rond de schijf van `krachtveld-logowand` (dat onderdeel importeert hem).
- `src/_kwaliteit/basis.js` komt uit `_kwaliteit/basis.js` van de bibliotheek: tien onderdelen importeren hun gedeelde hulpjes (minder beweging, in beeld, touch) via `../../_kwaliteit/basis.js`.
- `device-mockup/` was verwijderd (de schermbeelden van de cases staan al in een laptop-mockup) en kwam in v2 terug voor de ontwerp-demo's, waarvan de schermbeelden kaal zijn. De telefoon naast de laptop volgt de markup van het onderdeel zonder `tabindex`: hij is decoratief (`aria-hidden`), de laptop draagt de naam.
- De acht v2-onderdelen van de Home (28-10-2026) zijn zonder `test/`, `demo.html`, `media/` en `fonts/` gekopieerd; de herkomstparagraaf van hun README is weggelaten (de repo is openbaar). `_kwaliteit/basis.js` kreeg `zonderUndefined()` uit de bibliotheek, die vijf van hen importeren. Thema-tokens en plaatsing staan per onderdeel in `src/components/home/*.css`.
- v2 fase 2 (maker C, 28-10-2026): `live-demo-kader/` (portfolio/), `kaartenstapel-zij/` (scroll/),
  `eindeloos-raster/` (layouts/), `stappen-persoonlijk/` (forms/), `advies-funnel/` (tools/),
  `prijzen-per-dienst/` (pricing/), `agenda-facade/` (media/) en `availability-badge/` (badges/), zonder
  `test/`, `demo.html`, demobeelden en voorbeeldconfigs; de herkomst-alinea van de READMEs is ingekort voor de
  openbare repo. Twee kleine aanpassingen, als opties zodat de standaard gelijk blijft: `live-demo-kader.js` kreeg
  `openTekst`, `sluitTekst` en `posterAlt` (een echte klantsite is geen "demo"; er is geen React-wrapper, die zit
  in `src/components/v2c/CaseKader.tsx`), en `stappen-persoonlijk.js` kreeg `foutTekst` en `foutLink` (een
  mislukte verzending wijst naar LinkedIn, zoals het oude formulier). `src/_kwaliteit/basis.js` kreeg
  `zonderUndefined`, letterlijk uit de bibliotheek. Het contactformulier is nu de intake in stappen; hij post naar
  dezelfde `/api/contact` met dezelfde velden (`ContactFormulier.tsx` is daarom weg).
| `vel-menu/` | `navigation/vel-menu/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `flip-side-menu/` | `navigation/flip-side-menu/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `scroll-richting-nav/` | `navigation/scroll-richting-nav/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `flip-card/` | `cards/flip-card/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `kader-hover/` | `cards/kader-hover/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `lottie-scrub/` | `media/lottie-scrub/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `veeg-rij/` | `cards/veeg-rij/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `pulse-button/` | `buttons/pulse-button/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `floating-contact-card/` | `conversion/floating-contact-card/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |
| `logo-kleurwissel/` | `effects/logo-kleurwissel/` | 2026-10-28 | v3 maker C (navigatie, kaarten, knoppen) |

**Afwijking van de bibliotheek (v3 maker C):** `logo-kleurwissel/logo-kleurwissel.js` meet met een band van 1 px op het
midden van het logo in plaats van de hele logohoogte. Gemeten op /about (390, 28-10): kwam de logowand binnen tussen
de onderrand en het midden van het logo, dan bleef het merk de verkeerde kleur houden, omdat de observer daarna niets
meer meldde. Terug te zetten naar de bibliotheek.
