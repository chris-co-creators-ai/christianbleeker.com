'use client'

import { useEffect, useRef } from 'react'
import { AdviesFunnel, type AdviesFunnelConfig } from '@/features/advies-funnel/AdviesFunnel'
import { adviesConfig } from '@/content/prijzen'
import './pakket-advies.css'

/**
 * "Welk pakket past bij jou?" (advies-funnel). De knop onder het advies opent bij de prijzen meteen het
 * tabblad van de gekozen dienst (#dienst-<id>, de hash van prijzen-per-dienst).
 */
export function PakketAdvies() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const klik = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('.af-cta-link')
      if (!a) return
      let dienst = 'website'
      try { dienst = JSON.parse(sessionStorage.getItem(`af:${adviesConfig.id}`) || '{}')?.antwoorden?.dienst || dienst } catch { /* geen opslag */ }
      e.preventDefault()
      location.hash = `dienst-${dienst}`
      document.getElementById('prijzen')?.scrollIntoView({ block: 'start' })
    }
    root.addEventListener('click', klik)
    return () => root.removeEventListener('click', klik)
  }, [])
  return (
    <div ref={ref} className="pakket-advies">
      <AdviesFunnel config={adviesConfig as unknown as AdviesFunnelConfig} />
    </div>
  )
}
