'use client'

import { useEffect, useRef } from 'react'
import { kop } from '@/content/teksten'
import { v3c } from '@/content/v3c'
import { init } from '@/features/veeg-rij/veeg-rij.js'
import './kaarten.css'

/**
 * 404: de pagina's als lijstregels waar een kleurvlak overheen veegt (veeg-rij, richting van de muis).
 * De CSS van veeg-rij komt via kaarten.css mee (@import): de 404 hangt in de boom van de root-layout, en een eigen
 * CSS-chunk zou op elke pagina worden voorgeladen zonder gebruikt te worden (consolewaarschuwing).
 */
export function Verder() {
  const ref = useRef<HTMLUListElement | null>(null)
  useEffect(() => (ref.current ? init(ref.current, { richting: 'pointer' }) : undefined), [])
  return (
    <nav className="verder" aria-labelledby="verder-kop">
      <h2 id="verder-kop" className="verder-kop">{v3c.verder.kop}</h2>
      <ul ref={ref} className="verder-lijst">
        {kop.links.filter((l) => l.href !== '/').map((l) => (
          <li key={l.href}>
            <a data-veeg="" href={l.href}><span data-veeg-tekst="">{l.label}</span><span aria-hidden="true">→</span></a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
