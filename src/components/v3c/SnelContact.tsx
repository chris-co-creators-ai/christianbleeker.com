'use client'

import { useEffect, useRef } from 'react'
import { init } from '@/features/floating-contact-card/floating-contact-card.js'
import '@/features/floating-contact-card/floating-contact-card.css'
import { PulseButton } from '@/features/pulse-button/PulseButton'
import { AvailabilityBadge } from '@/features/availability-badge/AvailabilityBadge'
import { contact, linkedin } from '@/content/teksten'
import { v3c } from '@/content/v3c'
import './kaarten.css'

/**
 * "Snel contact" (floating-contact-card) over de onderrand van de AI-kop: beschikbaarheid en de weg naar
 * contact, zonder eerst de hele pagina af te hoeven. Chris heeft geen telefoonnummer op de site, dus de
 * kaart draagt de beschikbaarheid in plaats van een nummer. De knop is de pulse-button: de enige pulserende
 * knop van de pagina, drie keer en alleen in beeld. De sectie-dock wijkt zolang deze kaart in beeld is.
 */
export function SnelContact({ maand }: { maand: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => (ref.current ? init(ref.current, { overlap: '4.5rem', vermijd: '.ai-tweede' }) : undefined), [])
  return (
    <div className="container-site ai-snel-rij">
      <div ref={ref} className="fcc ai-snel" data-floating-contact-card="" data-overlap="4.5rem" data-vermijd=".ai-tweede">
        <span className="fcc__label">{v3c.snelContact.label}</span>
        <AvailabilityBadge className="ai-snel__badge" label={contact.badge} standaardMaand={maand} maandenVooruit={1} />
        <div className="ai-snel__acties">
          <PulseButton href="/contact" className="ai-snel__knop" maxPulses={3} onlyInView>{v3c.snelContact.knop} <span aria-hidden="true">→</span></PulseButton>
          <a className="ai-snel__link" href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </div>
  )
}
