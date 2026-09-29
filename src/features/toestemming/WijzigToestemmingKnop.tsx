'use client'

import { site } from '@/content/site'
import { wisToestemming } from './opslag'

/**
 * Kleine footer-knop om de cookiekeuze te wijzigen — verschijnt de melding in
 * `Toestemming.tsx` weer opnieuw. Rendert `null` zolang er geen meet-ID is ingesteld: dan is er
 * ook geen keuze om te wijzigen.
 */
export function WijzigToestemmingKnop({ className }: { className?: string }) {
  const { ga4, gtm, clarity } = site.meting
  if (!ga4 && !gtm && !clarity) return null

  return (
    <button type="button" onClick={() => wisToestemming()} className={className}>
      Cookie-toestemming wijzigen
    </button>
  )
}
