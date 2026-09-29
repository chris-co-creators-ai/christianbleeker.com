/**
 * Gedeelde opslag + event voor de toestemmingsmodule. Los van `Toestemming.tsx` zodat
 * `WijzigToestemmingKnop.tsx` (in de voettekst, ver weg in de boom) er zonder React-context bij
 * kan — één `window`-event i.p.v. een provider voor een enkele waarde.
 *
 * `Toestemming.tsx` leest de opgeslagen keuze via `useSyncExternalStore` (zie daar): elke
 * schrijf-functie hieronder stuurt na het opslaan hetzelfde event, en dat triggert dan vanzelf
 * een her-render — geen `setState` in een effect nodig (dat botst met
 * `react-hooks/set-state-in-effect`).
 */

export type ToestemmingKeuze = 'akkoord' | 'geweigerd'

const SLEUTEL = 'seveke-toestemming'
const EVENT = 'seveke:toestemming-gewijzigd'

function meldWijziging(): void {
  window.dispatchEvent(new Event(EVENT))
}

export function leesToestemming(): ToestemmingKeuze | null {
  try {
    const waarde = window.localStorage.getItem(SLEUTEL)
    return waarde === 'akkoord' || waarde === 'geweigerd' ? waarde : null
  } catch {
    // Privé-venster, geblokkeerde site-data, … — dan onthoudt de browser de keuze gewoon niet
    // tussen bezoeken en verschijnt de melding opnieuw. Geen fout, geen crash.
    return null
  }
}

export function schrijfToestemming(keuze: ToestemmingKeuze): void {
  try {
    window.localStorage.setItem(SLEUTEL, keuze)
  } catch {
    // Zie leesToestemming — stil negeren.
  }
  meldWijziging()
}

/** Voor de "wijzig je keuze"-knop (`WijzigToestemmingKnop.tsx`): wist de keuze zodat de melding
 *  opnieuw verschijnt. */
export function wisToestemming(): void {
  try {
    window.localStorage.removeItem(SLEUTEL)
  } catch {
    // Zie leesToestemming.
  }
  meldWijziging()
}

export function abonneerOpToestemming(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}
