# Klantpakket-sjabloon — plugin voor nieuwe klantsites

Dit is het standaardpakket dat elke nieuwe klantsite van Seveke Creative / Websites met Chris krijgt: klantkennis, websitebediening, copy-werkwijze en een Creative Kit. Kopieer deze map naar het klantproject, vul de invulvelden in en vervang de voorbeeldtekst door de echte klantfeiten.

## Wat het pakket is

Vier skills (`skills/klant-*`) plus referentiebestanden die samen vastleggen hoe je voor een klant schrijft, de website bedient en documenten/e-mails/LinkedIn-content maakt — in de stem en met de feiten van díe klant. Elk referentiebestand is een invulsjabloon: het legt uit welke informatie erin hoort en geeft een neutraal voorbeeld, niet een kant-en-klaar antwoord.

## Hoe je het per klant vult

1. Kopieer deze map naar het klantproject (of naar de plugin-map van dat project) en hernoem waar gewenst.
2. Vervang overal de invulvelden hieronder door de echte klantwaarden.
3. Vul `CONTEXT.md`, `references/merk-en-aanbod.md`, `references/taal-en-paginas.md`, `references/doelgroep-themas.md`, `references/kennismaking.md` en `references/website-en-design.md` met de feiten, stem en pagina's van de klant. Laat niets van het neutrale voorbeeld staan.
4. Vul `creative-kit/merkkaart.md` met de echte kleuren, lettertypen en contactgegevens van de klant.
5. Werk `.codex-plugin/plugin.json` en `.claude-plugin/plugin.json` bij met de klantnaam en -beschrijving.
6. Vul `gpt/KENNISPAKKET.md` en `gpt/INSTRUCTIES-KLANT-GPT.md` in en volg `gpt/README.md` om de eigen GPT van de klant in te richten.

## Invulvelden

| Veld | Betekenis |
| --- | --- |
| `Chris Bleeker` | Bedrijfs- of merknaam van de klant |
| `https://www.christianbleeker.com` | Publiek domein, met `https://` |
| `Seveke-Creative-NL/christianbleeker-bouw` | GitHub-repo als `eigenaar/naam` |
| `christianbleeker-bouw` | Vercel-projectnaam |
| `ontvanger@nog-niet-geleverd.invalid` | Contact-e-mailadres van de klant |
| `Chris Bleeker` | Naam van de afzender/contactpersoon in e-mails en ondertekening |

Documentspecifieke velden (zoals `{{voornaam}}` of `{{datum}}` in de e-mailsjablonen) zijn per verzending in te vullen en horen niet bij deze lijst.

## Structuur

- `INDEX.md`, `CONTEXT.md` — vaste ingang en werkrichting per klant, als sjabloon.
- `skills/klant-website/`, `skills/klant-kennis/`, `skills/klant-copy/`, `skills/klant-creative-kit/` — de vier werk-skills.
- `references/` — merk, taal, doelgroep, kennismaking, website/design, bronnen/claims en websitebediening, allemaal als invulsjabloon.
- `scripts/website-local.sh` (+ `scripts/test-website-local.py`) — lokale start/stop/status-helper voor de klantsite.
- `gpt/` — overdracht naar de eigen GPT van de klant.
- `creative-kit/` — merkkaart en e-mailsjablonen; documenten, drukwerk en beeldmateriaal maak je per klant met diens eigen huisstijl.

## Stack-aanname

Next.js op Vercel, repository op GitHub, automatische deploy bij een push op `main`. Geen Payload/CMS: onze klanten beheren hun content via hun eigen ChatGPT (zie `gpt/`). Gebruikt een klant uitzonderlijk toch een CMS, behandel dat als aanvullende, expliciet te benoemen stap in `references/website-bediening.md`.

---

Gebaseerd op de WIN-plugin van Christian Bleeker (0.5.0, 24-09-2026); klantspecifieke delen blijven in die plugin.
