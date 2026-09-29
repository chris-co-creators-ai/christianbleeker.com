# Toestemming

Cookiemelding + Google Consent Mode v2, **standaard uit**. Zonder een meet-ID in
`content/site.ts` rendert `Toestemming` niets — geen melding, geen script, geen
`localStorage`-toegang.

## Aanzetten

Vul één of meer velden in bij `site.meting` in `src/content/site.ts`:

```ts
meting: { ga4: 'G-XXXXXXXXXX', gtm: '', clarity: '' },
```

Dat is alles. Zodra er minstens één ID staat:

1. `Toestemming` (gemount in `src/app/layout.tsx`) toont de cookiemelding.
2. Klikt een bezoeker op **Akkoord**: Google Consent Mode v2 wordt gezet (eerst `denied`,
   meteen daarna `granted`) en pas dán laden GA4 (`@next/third-parties/google`,
   `GoogleAnalytics`), GTM (`GoogleTagManager`) en/of Microsoft Clarity — elk alleen als het
   bijbehorende ID is ingevuld.
3. Klikt een bezoeker op **Liever niet**: er laadt niets, de keuze wordt onthouden
   (`localStorage`, met een `try`/`catch` — een geblokkeerde of privé-browser laat de melding
   dan gewoon opnieuw zien bij het volgende bezoek).
4. De knop `WijzigToestemmingKnop` (staat in de voettekst, `Voet.tsx`) wist de opgeslagen keuze
   zodat de melding opnieuw verschijnt. Ook deze knop verschijnt alleen als er een meet-ID is
   ingesteld.

## Wat hier bewust niet staat

- **Geen cookie-categorieën** (marketing/functioneel/analytisch apart aan- of uitzetten) — dit
  is één binaire keuze voor GA4/GTM/Clarity samen. Voeg categorieën toe zodra een klant
  daadwerkelijk meerdere diensten met een eigen toestemmingsstatus gebruikt.
- **Geen server-side proxy/consent-log** — de keuze leeft alleen in de browser van de bezoeker
  (`localStorage`).

## Bestanden

- `Toestemming.tsx` — de melding + het (voorwaardelijk) laden van de meetscripts.
- `WijzigToestemmingKnop.tsx` — de "wijzig je keuze"-knop voor de voettekst.
- `opslag.ts` — lezen/schrijven van de keuze in `localStorage` + het event waarmee beide
  componenten elkaar op de hoogte houden (geen React-context nodig voor één waarde).
