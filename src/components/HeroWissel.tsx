'use client'

import { useEffect, useRef, useState } from 'react'
import { RotatingHeadline } from '@/features/rotating-headline/RotatingHeadline'

/**
 * Het wisselwoord in de hero. Pauzeert samen met de achtergrond: staat de media-hero op
 * "gepauzeerd" (knop "Pauzeer achtergrond"), dan staat ook het woord stil (WCAG 2.2.2).
 */
export function HeroWissel({ woorden }: { woorden: string[] }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [stil, setStil] = useState(false)
  useEffect(() => {
    const hero = ref.current?.closest('.mh')
    if (!hero) return
    const kijk = () => setStil(hero.getAttribute('data-mh-status') === 'gepauzeerd' && hero.querySelector('[data-mh-pauze]')?.getAttribute('aria-pressed') === 'true')
    kijk()
    const w = new MutationObserver(kijk)
    w.observe(hero, { attributes: true, subtree: true, attributeFilter: ['data-mh-status', 'aria-pressed'] })
    return () => w.disconnect()
  }, [])
  return (
    <span ref={ref} className="hero-wissel-houder">
      {stil ? <span className="hero-wissel-woord">{woorden[0]}</span> : <RotatingHeadline as="span" className="hero-wissel-woord" words={woorden} variant="clip" interval={2400} />}
    </span>
  )
}
