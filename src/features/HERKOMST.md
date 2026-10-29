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
- `device-mockup/` is verwijderd: de schermbeelden van de cases staan al in een laptop-mockup.
