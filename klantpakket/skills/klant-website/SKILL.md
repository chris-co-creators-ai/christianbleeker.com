---
name: klant-website
description: Use when starting, stopping, publishing, changing, reviewing, or planning the client website, its content, design system, navigation, page structure, or kennismaking flow.
---

# Klant-website

Volg altijd de [pluginindex](../../INDEX.md): de klantstem en bronhiërarchie gelden ook wanneer de klant ze niet noemt. Voor `start website`, `stop website` of `publiceer website` volg [websitebediening](../../references/website-bediening.md) en voer het gevraagde commando uit met lokale tools. Lees bij inhoud of ontwerp [website en design](../../references/website-en-design.md), [merk en aanbod](../../references/merk-en-aanbod.md) en waar relevant [taal en pagina's](../../references/taal-en-paginas.md). Bij de boekingsroute: [kennismaking](../../references/kennismaking.md). De referenties zijn momentopnamen; inspecteer de actuele repo en browserweergave opnieuw.

## Werkwijze

1. Bepaal de geraakte route, het component, de gedeelde onderdelen en de bron van de zichtbare tekst. Controleer onopgeslagen wijzigingen vóór een edit.
2. Behoud de merkkleuren, lettertypen, beeldgebruik, witruimte en bestaande componenttaal tenzij de klant of Seveke Creative bewust anders beslist. Nieuwe copy volgt `klant-copy`.
3. Los de kleinste gedeelde oorzaak op. Maak geen tweede component of parallelle inhoudsbron wanneer een bestaand onderdeel de taak al draagt.
4. Gebruik de bevestigde diensten/aanbod uit `merk-en-aanbod.md` als positionering; controleer per dienst de actuele route en inhoud. Voeg geen dode links of onbevestigde productdetails toe.
5. Controleer desktop en mobiel, toegankelijkheid, links/CTA's, SEO-basis en build/tests in verhouding tot de wijziging. Content wordt beheerd in code (Next.js) of via de eigen GPT/ChatGPT van de klant, niet via een CMS — gebruikt de klant toch uitzonderlijk een CMS, controleer dan ook preview, draft/publicatiestatus en rollback.
6. Publiceer alleen na de expliciete `publiceer website` van de klant of Seveke Creative en de controles uit websitebediening. Een DNS-wijziging, externe verzending of andere productiewrite vraagt een afzonderlijke, passende opdracht en herstelpad.

Rapporteer bij een plan of review compact onder drie statussen: **bevestigde keuze**, **huidige repo-toestand** en **voorstel/open besluit**. Zo wordt een gewenste nieuwe pagina of flow niet verward met wat al gebouwd is.

Bij wijzigingen aan de actuele site: lees eerst de `AGENTS.md`/`README.md` van de geverifieerde clone en relevante Next.js-documentatie. De live repo is `Seveke-Creative-NL/christianbleeker-bouw` op GitHub. Deze plugin vervangt projectinstructies niet.
