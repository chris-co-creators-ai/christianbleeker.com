'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { init } from '@/features/hotspots/hotspots-kern.js'
import '@/features/hotspots/hotspots.css'

/**
 * Hotspots op een eigen beeld (de <Beeld>-picture met avif/webp), met de kern van de bibliotheek.
 * De meegeleverde wrapper rendert alleen een kale <img src>; dit is dezelfde markup met ons beeld erin.
 */
export function HotspotsBeeld({ children, punten, className }: {
  children: ReactNode
  punten: readonly { x: string; y: string; titel: string; tekst: string }[]
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const id = useId()
  useEffect(() => (ref.current ? init(ref.current) : undefined), [])
  return (
    <div ref={ref} className={`hotspots${className ? ` ${className}` : ''}`}>
      <div className="hotspots__media">
        {children}
        {punten.map((p, i) => (
          <div key={p.titel}>
            <button
              type="button"
              className="hotspots__point"
              style={{ ['--hx' as string]: p.x, ['--hy' as string]: p.y }}
              aria-expanded="false"
              aria-controls={`${id}-p${i}`}
              aria-label={p.titel}
            >
              {i + 1}
              <span className="hotspots__pulse" aria-hidden="true" />
            </button>
            <div className="hotspots__panel" id={`${id}-p${i}`} hidden>
              <h3>{p.titel}</h3>
              <p>{p.tekst}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
