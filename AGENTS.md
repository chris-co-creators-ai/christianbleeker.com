# Chris Bleeker — website

Next.js-site voor Chris Bleeker (websites × marketing × AI), gebouwd door Seveke Creative.
Productie: https://www.christianbleeker.com (tak `main`). Vernieuwing: tak `vernieuwing-2026-10`.

## Tech stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict), alle pagina's statisch
- **Styling:** Tailwind CSS v4; huisstijl-tokens in `src/app/globals.css`, pagina-opmaak in `src/app/site.css`
- **Lettertypes:** Unbounded (koppen) en Manrope (tekst), lokaal in `src/fonts/` (OFL)
- **Mail:** Resend, afzender `formulier@seveke.nl`, replyTo = de bezoeker
- **Hosting:** Vercel

## Commando's
- `npm run dev` — ontwikkelserver
- `npm run build` — productiebouw
- `npm run qa` — de hele controlereeks (lint, typen, bouw, keuring en alle toetsen in `qa/`); exit 0 = groen
- `npm run keuring` — SEO-, toegankelijkheids- en veiligheidskeuring tegen de gebouwde site
- `npm run vercel-build` — wat Vercel draait: bouw + keuring. Rode keuring = geen uitrol
- `node scripts/beeld.mjs --bron <map>` — beeld omzetten naar AVIF/WebP binnen de gewichtsplafonds

## Waar staat wat
- **Alle tekst** staat in `src/content/`: `teksten.ts` (pagina's), `cases.ts` (de dertien websites),
  `site.ts` (gegevens, mail, SEO), `routes.ts` (alle pagina's: sitemap, llms.txt).
  Geen zichtbare zin in een `.tsx`-bestand.
- **Nieuwe tekst** die niet van de vorige site komt, staat ook in `docs/copy-nieuw.md` (voorstel,
  wacht op akkoord van Chris). `qa/herkomst.mjs` faalt op elke zin zonder herkomst.
- **Onderdelen** (effecten, menu, lightbox …) staan in `src/features/`, overgenomen uit de
  onderdelenbibliotheek van Seveke Creative; herkomst en afwijkingen in `src/features/HERKOMST.md`.
  Pas ze aan via hun CSS-variabelen in `site.css`, niet in het bestand zelf.
- **Beeld** in `public/beeld/` (gegenereerd), Lottie-iconen in `public/lottie/`.

## Nog open (vóór livegang)
- `url` per case in `cases.ts` is leeg tot Chris de adressen bevestigt: dan verschijnt
  "Bekijk de site ↗" vanzelf.
- Bedrijfsnaam, KvK en e-mail voor de privacyverklaring en het schema.

## Bouwregels
**Minimale code, nooit minimale vormgeving.** Voor logica en scripts: eerst kijken of het al bestaat,
dan het platform (HTML, CSS), dan pas eigen code. Vormgeving, beeld en beweging krijgen de aandacht die
ze vragen. Bezuinig nooit op validatie, foutafhandeling, beveiliging of toegankelijkheid.

**Geen AI-slop.** Volg de tokens in `globals.css`. Geen kaartenrasters met drie gelijke vakken, geen
gradients of glows als versiering, geen emoji, geen stockfoto's. Het maalteken × is de signatuur: één
×-moment per scherm, altijd `aria-hidden`.

**Beweging.** Alleen `transform` en `opacity`; interface-animaties onder 300 ms met ease-out; respecteer
`prefers-reduced-motion`; zonder JavaScript is alle inhoud zichtbaar.

**Vindbaarheid.** Sitemap met `lastmod`, `robots.txt`, canonical per pagina, JSON-LD (`Person`,
`WebSite`, `CreativeWork` per case, `VideoObject`, `BreadcrumbList`), deelplaatje per pagina,
`llms.txt`/`llms-full.txt`. Een preview-deploy krijgt `noindex`, productie nooit.

**Privacy.** Standaard alleen cookievrije meting (Vercel Analytics). YouTube laadt pas na een klik
(youtube-nocookie), Spotify is een gewone link. Geen extern domein zonder regel in `cspExtra` in
`next.config.ts`. `qa/extern.mjs` controleert 0 externe verzoeken en 0 cookies vóór een klik.

**Formulier.** Honeypot + minimale invultijd, gecontroleerd op de server. Mislukt verzenden, dan ziet
de bezoeker dat, met LinkedIn als uitweg. Een bericht gaat nooit stil verloren.

**De repo is openbaar.** Geen interne notities, klantdossiers, paden of sleutels.
`qa/openbaar.mjs` faalt erop.

## SEO-team
Voor gerichte SEO/AEO-taken `/christianbleeker-seo`, voor de volledige weekketen `/goseo`. De rollen
staan in `.seo-team/roles/`. Het team stelt voor; publiceren, robots.txt aanpassen en outreach pas na
akkoord.
