# Website bedienen

## Exacte doelen

- **Live code:** `https://github.com/Seveke-Creative-NL/christianbleeker-bouw`, branch `main`. Een lokale clone moet `origin` naar deze repository laten wijzen. Gebruik `SITE_DIR` of werk vanuit de juiste clone.
- **Live hosting:** Vercel-project `christianbleeker-bouw`; pushes op `main` starten automatisch een productiedeployment. Controleer de actuele koppeling en de uiteindelijke deployment opnieuw vóór en na een publicatie.
- **Publiek domein:** `https://www.christianbleeker.com`.
- Content wordt beheerd in code (Next.js) of, waar de klant dat zelf doet, via diens eigen ChatGPT — niet via een CMS. Gebruikt een klant uitzonderlijk toch een CMS, behandel de CMS-publicatie dan als aparte stap: controleer database, draft/publicatiestatus, preview en terugzetmogelijkheid vóór je die publiceert.

## `start website`

1. Bepaal de lokale clone en controleer `git remote get-url origin` op `Seveke-Creative-NL/christianbleeker-bouw`. Lees de actuele `AGENTS.md`/`README.md`, het lokale `package.json` en relevante Next.js-documentatie voordat je websitecode verandert.
2. Gebruik de meegeleverde helper: `SITE_DIR=/pad/naar/clone zsh <plugin-root>/scripts/website-local.sh start`. Hij gebruikt `127.0.0.1:3000`, beheert alleen zijn eigen proces en stopt als die poort bezet is door iets anders. Installeer ontbrekende dependencies alleen in de geverifieerde clone.
3. Controleer de gemelde lokale URL en HTTP-respons. Meld een applicatiefout eerlijk, ook als de server luistert. Laat `.env*` en logbestanden buiten Git en toon geen geheimen.

## `stop website`

Gebruik dezelfde helper met `stop` en dezelfde `SITE_DIR`. Alleen een door de helper geregistreerd proces van de geverifieerde clone mag worden gestopt. Als poort 3000 door een andere app wordt gebruikt, meld dat en raak die app niet aan.

## `publiceer website`

Het expliciete commando van de klant of Seveke Creative autoriseert de publicatie van **de websitewijzigingen die bedoeld zijn**. Vraag geen tweede standaardbevestiging. Controleer vóór de eerste write:

1. De bedoelde wijziging is concreet en reviewbaar; inspecteer diff, niet-gecommitte bestanden, huidige branch, `origin` en de actuele remote `main`. Neem geen geheimen, cliëntdata of ongerelateerde wijzigingen mee. Los branchverschillen op zonder een force-push. Maak zo nodig een gerichte commit van alleen de bedoelde bestanden.
2. Gebruik uitsluitend de bevoegde GitHub- en Vercel-context van de klant/Seveke Creative. Controleer dat de GitHub-repository `Seveke-Creative-NL/christianbleeker-bouw` en het Vercel-project `christianbleeker-bouw` gekoppeld zijn; als dit niet aantoonbaar is, stop vóór de push.
3. Voer passende code-, TypeScript-, build- en browsercontroles uit. Maak vooraf het herstelpad concreet: vorige productie-deployment en commit, plus een geldige databaseback-up als data verandert.
4. Push de bedoelde commit naar `Seveke-Creative-NL/christianbleeker-bouw` `main`. De bestaande GitHub-integratie laat Vercel deployen; start niet ook nog een losse `vercel --prod` voor dezelfde commit. Wacht op een **Ready**-deployment voor de exacte commit en controleer de geraakte publieke routes op `https://www.christianbleeker.com`.
5. Meld commit, deployment, gecontroleerde URL's en eventuele resterende beperking. Als de nieuwe versie faalt, gebruik het vooraf vastgelegde Vercel-herstelpad en controleer de vorige werkende versie.

Ontbrekende toegang, een bezette poort, onduidelijke wijzigingsscope, een afwijkende repo/projectkoppeling, mislukte build of ontbrekend herstelpad is een concrete blokkade. Rapporteer die precies; zeg nooit dat iets is gestart, gestopt of gepubliceerd zonder readback.
