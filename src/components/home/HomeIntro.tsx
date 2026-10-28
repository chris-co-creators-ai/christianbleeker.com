'use client'

import { useEffect, useRef } from 'react'
import { init } from '@/features/punt-zoom-intro/punt-zoom-intro.js'
import '@/features/punt-zoom-intro/punt-zoom-intro.css'
import './intro.css'

/**
 * punt-zoom-intro op de Home: het merk "Chris Bleeker" met de × die overal op de site terugkomt.
 * De × is het vertrekpunt: daar opent het gat waardoor de site verschijnt. Eén keer per sessie; het
 * inline script `INTRO_AL_GEZIEN` in de pagina verbergt hem vóór de eerste paint als hij al gezien is.
 */
export function HomeIntro({ merk }: { merk: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => (ref.current ? init(ref.current, { startVertraging: 450, duur: 1100 }) : undefined), [])
  return (
    <div ref={ref} data-punt-zoom-intro="" aria-hidden="true" className="home-intro">
      <div className="pzi-logo-wrap">
        <svg viewBox="0 0 720 100" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="74" className="home-intro__merk" textLength="600" lengthAdjust="spacingAndGlyphs">{merk}</text>
          <path data-zoom-target="" className="home-intro__x" d="M652 30 L692 70 M692 30 L652 70" />
        </svg>
      </div>
    </div>
  )
}
