'use client'

import { useEffect, useState } from 'react'

/**
 * `true` zodra de bezoeker iets doet (scrollen, aanraken, muis, toets) of na `terugvalMs`.
 *
 * Waarom: meetscripts (GA4/GTM/Clarity)
 * laden dan pas ná de eerste interactie, zodat ze het eerste beeld (LCP) en de eerste
 * interactie (INP) niet vertragen. De terugval zorgt dat een bezoeker die niets doet en weggaat
 * (een "bounce") toch nog meetelt; zonder die terugval mis je juist die bezoekers.
 */
export function useEersteInteractie(terugvalMs = 4000): boolean {
  const [klaar, setKlaar] = useState(false)
  useEffect(() => {
    if (klaar) return
    const zet = () => setKlaar(true)
    const gebeurtenissen = ['scroll', 'pointerdown', 'keydown', 'touchstart', 'mousemove'] as const
    gebeurtenissen.forEach((g) => window.addEventListener(g, zet, { once: true, passive: true }))
    const t = window.setTimeout(zet, terugvalMs)
    return () => {
      gebeurtenissen.forEach((g) => window.removeEventListener(g, zet))
      window.clearTimeout(t)
    }
  }, [klaar, terugvalMs])
  return klaar
}
