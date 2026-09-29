# Eigen GPT van Chris Bleeker inrichten

Deze map is de overdracht voor de eigen GPT van de klant. Het klantpakket bevat daarnaast de merkkaart en e-mailsjablonen. Er is geen automatische koppeling met de GPT, e-mail, LinkedIn of cliëntdossiers van de klant.

De commando's `start website`, `stop website` en `publiceer website` horen bij Codex/Claude Code met dit pakket; zie [de pluginindex](../INDEX.md). GPT Knowledge kan geen proces op een computer starten of GitHub/Vercel bedienen. Voor die commando's gebruik je een sessie met toegang tot de juiste website-clone en de eigen accounts van de klant.

## Eenmalig in de GPT-editor

1. Open de eigen GPT van Chris Bleeker in de GPT-editor en maak zo nodig eerst een reservekopie van de bestaande instructies. Geef hem een herkenbare naam, bijvoorbeeld **Chris Bleeker | assistent**.
2. Kopieer de **inhoud** van [`INSTRUCTIES-KLANT-GPT.md`](INSTRUCTIES-KLANT-GPT.md) naar het veld **Instructions**. Combineer bestaande nuttige instructies zorgvuldig; laat tegenstrijdige opdrachten niet naast elkaar staan.
3. Voeg [`KENNISPAKKET.md`](KENNISPAKKET.md) toe onder **Knowledge**. Dit ene bestand bevat de merkbasis, documentkeuze, e-mailvoorbeelden en de kennismakingsroute van de klant.
4. Voeg voor bewerkbare documentoutput de sjablonen toe die je voor deze klant hebt gemaakt (intakeformulier, dossier, rapportage, bijlage). Het zijn lege voorbeelden; zet nooit een ingevuld cliëntdossier in GPT Knowledge.
5. Zet **Code Interpreter & Data Analysis** aan als de GPT zelf downloadbare bestanden moet maken. Controleer daarna in Preview of hij de kennisbestanden gebruikt, de juiste sjabloon kiest en bestanden kan leveren.
6. Test met de [proefvragen](TESTVRAGEN.md). Sla de GPT pas op nadat de antwoorden voor de klant kloppen.

## Bij nieuw werk

Geef bij een rapportage een transcript of samenvatting alleen in een werkomgeving die de klant voor cliëntinformatie geschikt vindt. Controleer feiten, sprekerstoewijzing, interpretaties en toestemming vóór delen.

Bij een nieuwe pakketversie: vervang de relevante Knowledge-bestanden en herhaal de proefvragen. Gebruik voor actuele afspraken, prijzen, beschikbaarheid en publicatie altijd een nieuwe controle.
