'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { ui } from '@/content/ui'

/** Kleur van de adresbalk per thema; gelijk aan --color-grond. */
const BALK = { licht: '#f6efe6', donker: '#17110f' } as const

/**
 * Zon/maan-schakelaar tussen het donkere en het witte thema. De beginstand zet het inline script in
 * layout.tsx (voorkeur van het systeem of de eerder gemaakte keuze); deze knop leest die alleen uit.
 * aria-pressed = het witte thema staat aan.
 */
/** Volgt data-thema op <html>: de bron van waarheid, gezet door het inline script en door wissel(). */
function volg(melding: () => void) {
  const mo = new MutationObserver(melding)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-thema'] })
  return () => mo.disconnect()
}

export function ThemaKnop({ className }: { className?: string }) {
  // Op de server onbekend (null): dan geen aria-pressed, zodat de hydratatie klopt.
  const licht = useSyncExternalStore(volg, () => document.documentElement.dataset.thema === 'licht', () => null)

  useEffect(() => {
    if (licht !== null) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BALK[licht ? 'licht' : 'donker'])
  }, [licht])

  function wissel() {
    const nieuw = licht ? 'donker' : 'licht'
    document.documentElement.dataset.thema = nieuw
    try { localStorage.setItem('thema', nieuw) } catch { /* privévenster: alleen deze pagina */ }
  }

  return (
    <button
      type="button"
      className={['thema-knop', className].filter(Boolean).join(' ')}
      aria-label={ui.thema.label}
      aria-pressed={licht ?? undefined}
      title={licht ? ui.thema.naarDonker : ui.thema.naarLicht}
      onClick={wissel}
    >
      <svg className="thema-zon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </g>
      </svg>
      <svg className="thema-maan" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M20.2 14.6A8.3 8.3 0 0 1 9.4 3.8a8.3 8.3 0 1 0 10.8 10.8Z" fill="currentColor" />
      </svg>
    </button>
  )
}
