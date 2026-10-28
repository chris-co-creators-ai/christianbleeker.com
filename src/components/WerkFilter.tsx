'use client'

import { useSyncExternalStore, type ReactNode } from 'react'

type Stand = 'alles' | 'klanten' | 'demos'

const luisteraars = new Set<() => void>()
function volg(melding: () => void) {
  luisteraars.add(melding)
  window.addEventListener('popstate', melding)
  return () => { luisteraars.delete(melding); window.removeEventListener('popstate', melding) }
}
function leesStand(): Stand {
  const t = new URLSearchParams(location.search).get('toon')
  return t === 'klanten' || t === 'demos' ? t : 'alles'
}
const geen = () => () => {}

/**
 * Filter "Alles / Klanten / Demo's" op /work. Zet data-filter op de omhullende div; site.css verbergt
 * de andere groep. Zonder JS staat alles er en blijft de knoppenrij verborgen.
 * De stand staat in ?toon=klanten|demos, zodat een gedeelde link dezelfde selectie opent.
 */
export function WerkFilter({ labels, aantallen, children }: {
  labels: { label: string; alles: string; klanten: string; demos: string }
  aantallen: Record<Stand, number>
  children: ReactNode
}) {
  const stand = useSyncExternalStore(volg, leesStand, () => 'alles' as Stand)
  const klaar = useSyncExternalStore(geen, () => true, () => false)

  function kies(s: Stand) {
    const url = new URL(location.href)
    if (s === 'alles') url.searchParams.delete('toon')
    else url.searchParams.set('toon', s)
    history.replaceState(history.state, '', url)
    luisteraars.forEach((m) => m())
  }

  return (
    <div className="werk-filter-blok" data-filter={stand}>
      <div className="werk-filter container-site" role="group" aria-label={labels.label} hidden={!klaar}>
        {(['alles', 'klanten', 'demos'] as const).map((s) => (
          <button key={s} type="button" className="werk-filter__knop" aria-pressed={stand === s} onClick={() => kies(s)}>
            {labels[s]} <span className="werk-filter__aantal">{aantallen[s]}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}
