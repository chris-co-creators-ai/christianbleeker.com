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
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const html = document.documentElement
    const body = document.body
    const destroy = init(root, { startVertraging: 450, duur: 1100 })
    // De intro zet overflow: hidden op html én body. Op body maakt dat body tot scrollcontainer, waardoor
    // sticky (stapelpanelen, beeldexplosie) tijdens de intro verkeerd meet; het slot op html is genoeg.
    body.style.overflow = ''
    // Terugval: hoe de intro ook eindigt (klik, toets, faalveilig of een gemist frame), na 3 s is het slot weg.
    const ontgrendel = () => { if (html.style.overflow === 'hidden') html.style.overflow = ''; body.style.overflow = '' }
    const terugval = window.setTimeout(() => { destroy(); ontgrendel() }, 3000)
    return () => { window.clearTimeout(terugval); destroy(); ontgrendel() }
  }, [])
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
