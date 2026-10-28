'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { init } from '@/features/lottie-scrub/lottie-scrub.js'
import '@/features/lottie-scrub/lottie-scrub.css'
import { voetLijnSvg } from './voet-lijn-svg'
import './kaarten.css'

/**
 * De scheidslijn boven de onderste voetregel tekent zich mee met de scroll (lottie-scrub): "— × — × —", het
 * motief van "Websites × marketing × AI". Decoratief (aria-hidden). Zonder JS en bij minder beweging staat er
 * het eindbeeld als inline SVG, zodat ook dat de kleuren van het thema volgt.
 */
export function VoetLijn() {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => (ref.current ? init(ref.current, { eind: 0.92 }) : undefined), [])
  return (
    <div ref={ref} className="voet-lijn" data-lottie-scrub="" data-lottie-src="/voet/lijn.json" aria-hidden="true" style={{ '--ls-ratio': '1000 / 40' } as CSSProperties}>
      <svg data-lottie-scrub-fallback="" viewBox={voetLijnSvg.viewBox} fill="none" strokeLinecap="round" focusable="false">
        <path className="vl-lijn" d={voetLijnSvg.lijnen} strokeWidth="2" />
        <path className="vl-kruis" d={voetLijnSvg.kruizen} strokeWidth="3" />
      </svg>
    </div>
  )
}
