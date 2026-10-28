'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './floating-contact-card.js';
import './floating-contact-card.css';

export interface FloatingContactCardProps {
  telefoon: string;
  /** Weergavetekst voor het telefoonnummer, bv. "085 - 123 45 67". */
  telefoonLabel?: string;
  /** Openingsregel-tekst, of laat leeg en nest zelf een `<OpenStatus>` in `children`. */
  openingsregel?: string;
  ctaHref: string;
  ctaLabel: string;
  /** CSS-lengte voor de overlap over de hero-rand. Standaard "4rem". */
  overlap?: string;
  /** CSS-selector van het tekstelement dat nooit bedekt mag raken (meestal de hero-kop). */
  vermijd?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `floating-contact-card`. Op mobiel staat
 * de kaart gewoon in de flow (CSS); op desktop zweeft hij over de hero-rand
 * en wijkt hij defensief uit voor `vermijd` als dat toch zou overlappen.
 */
export function FloatingContactCard({
  telefoon,
  telefoonLabel,
  openingsregel,
  ctaHref,
  ctaLabel,
  overlap,
  vermijd,
  children,
  className,
}: FloatingContactCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { overlap, vermijd });
    return destroy;
  }, [overlap, vermijd]);

  return (
    <div ref={rootRef} className={`fcc${className ? ` ${className}` : ''}`}>
      <span className="fcc__label">Snel contact</span>
      <a className="fcc__telefoon" href={`tel:${telefoon}`}>{telefoonLabel ?? telefoon}</a>
      {openingsregel ? <p className="fcc__openingsregel">{openingsregel}</p> : children}
      <a className="fcc__cta" href={ctaHref}>{ctaLabel}</a>
    </div>
  );
}
