# Website en design — Chris Bleeker (invulsjabloon)

*Repo-inspectie: [datum]. Paden hieronder zijn relatief aan de root van de klant-clone. Controleer code en browser opnieuw vóór een wijziging; dit bestand is geen live manifest.*

## Technische vorm

- Stack: Next.js op Vercel, repository `Seveke-Creative-NL/christianbleeker-bouw` op GitHub, automatische deploy bij een push op `main`. Geen CMS (zoals Payload): content staat in code of wordt door de klant beheerd via zijn eigen ChatGPT (zie `gpt/`).
- [Invullen: App Router-structuur, waar pagina's/componenten staan, of er gedeelde content-config is.]

## Designsystem (invullen per klant)

| Token | Waarde | Rol |
| --- | --- | --- |
| Primair | `#______` | [bijv. CTA's, accenten] |
| Secundair | `#______` | [bijv. koppen, donkere vlakken] |
| Achtergrond | `#______` | [rustige achtergrond] |
| Tekst | `#______` | [lopende tekst] |
| Kopfont | [naam] | Koppen |
| Bodyfont | [naam] | Lopende tekst en labels |

*Neutraal voorbeeld:* Primair `#1F6F5C` (CTA's), Secundair `#0E2A24` (koppen, donkere vlakken), Achtergrond `#F6F4EF`, Tekst `#20221F`, Kopfont Space Grotesk, Bodyfont Inter.

## Sitemap (invullen per klant)

`/`, `/[dienst-of-werkwijze]`, `/[aanbod]`, `/over`, `/kennismaking` — pas aan op de daadwerkelijke pagina's van de klant. Presenteer een pagina pas als bestaand wanneer ze daadwerkelijk gepubliceerd is.

## Componentkeuze

- Gebruik bestaande componenten en bloktypen van het project waar passend; maak geen tweede component voor iets dat al bestaat (zie ook de `taste`- en `buildstack`-skills voor de bouwkwaliteit zelf).
- Gedeelde navigatie-, footer- en herobestanden kunnen meerdere routes tegelijk raken. Controleer aanroepers en mobiele weergave.
- Controleer op lopende gebruikerswijzigingen voordat je gedeelde componenten bewerkt.

## Review op een pagina

Controleer: juiste dienst en kernvraag, begrijpelijke H1 en tussenkoppen, hiërarchie/contrast op mobiel, afbeelding en alt-tekst, één primaire CTA naar de passende route, alle links, geen niet-bestaande route, feitelijke claims, SEO-titel/omschrijving en eventuele console- of buildfouten.
