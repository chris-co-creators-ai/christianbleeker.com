/**
 * Spamval — bouwsteen voor het formulier dat een klant via de PRD krijgt (deze kale basis heeft
 * zelf geen formulier meer, zie `LEESMIJ.md`).
 *
 * Puur en synchroon: geen `FormData`, geen server-only API's. Zo kan
 * `scripts/test-spamval.mjs` 'm rechtstreeks importeren en testen zonder Next.js op te
 * hoeven starten.
 *
 * Twee lagen:
 * 1. Honeypot — een veld dat een mens nooit invult, een script wel.
 * 2. Minimale invultijd — een formulier dat binnen `minMs` na het openen al verzonden is, is
 *    geen mens (geen JS/geen tijdstip aangeleverd = onbekend, en dan telt alleen de honeypot —
 *    anders zou een bezoeker zonder JavaScript altijd worden geweigerd).
 *
 * ponytail: de invultijd-check is alleen een net voor bots die wél JavaScript draaien maar te
 * snel typen/plakken. Een bot die de server-actie rechtstreeks aanroept zonder ooit de pagina
 * geladen te hebben, stuurt gewoon geen `geopendOm` mee en glipt door dit net heen — de honeypot
 * blijft dan de enige verdediging. Upgrade-pad: een ondertekend/versleuteld tijdstempel
 * (bijv. een JWT met korte vervaltijd) als dat ooit nodig blijkt.
 */
export const MINIMALE_INVULTIJD_MS = 1500

/**
 * @param honeypot Waarde van het honeypot-veld. Niet-leeg (na trimmen) = spam.
 * @param geopendOm Tijdstip (ms sinds epoch) waarop het formulier zichtbaar werd, als string of
 *   getal — komt uit een verborgen veld dat de client bij het laden vult. `null`/`undefined`/leeg
 *   betekent "onbekend" (geen JavaScript, of een oud formulier zonder dit veld): dan telt alleen
 *   de honeypot.
 * @param nu Tijdstip "nu" (ms sinds epoch). Alleen voor tests; standaard `Date.now()`.
 */
export function isSpamInzending(
  honeypot: string,
  geopendOm: string | number | null | undefined,
  nu: number = Date.now(),
): boolean {
  if (honeypot.trim() !== '') return true
  if (geopendOm === null || geopendOm === undefined || geopendOm === '') return false
  const geopend = Number(geopendOm)
  if (!Number.isFinite(geopend)) return false
  const verstreken = nu - geopend
  // Negatief = de klok van de bezoeker loopt voor op de server: dat is geen bot.
  return verstreken >= 0 && verstreken < MINIMALE_INVULTIJD_MS
}

/**
 * Optie voor B2B-formulieren: alleen een zakelijk
 * e-mailadres toestaan. Geen spamval in strikte zin (een echte zzp'er met een Gmail-adres is geen
 * spam), dus standaard UIT; zet hem per formulier aan en toon dan een vriendelijke melding
 * ("Gebruik je zakelijke e-mailadres"), nooit een stille weigering.
 *
 * ponytail: vaste lijst van de gratis domeinen die in NL/BE het vaakst voorkomen; een volledige
 * lijst (duizenden wegwerpdomeinen) pas als er echt misbruik is.
 */
export const GRATIS_MAILDOMEINEN = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.nl', 'outlook.com', 'outlook.nl',
  'live.nl', 'live.com', 'msn.com', 'yahoo.com', 'yahoo.nl', 'icloud.com', 'me.com', 'mac.com',
  'ziggo.nl', 'kpnmail.nl', 'planet.nl', 'home.nl', 'hetnet.nl', 'casema.nl', 'telenet.be',
  'skynet.be', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.net', 'aol.com',
] as const

export function isZakelijkEmail(email: string): boolean {
  const domein = email.trim().toLowerCase().split('@')[1] ?? ''
  if (!domein || !domein.includes('.')) return false
  return !(GRATIS_MAILDOMEINEN as readonly string[]).includes(domein)
}
