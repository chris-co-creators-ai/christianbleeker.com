'use client';

import { useEffect, useRef } from 'react';
import { init } from './availability-badge.js';
import './availability-badge.css';

export interface AvailabilityBadgeProps {
  /** Statische fallback-tekst voor de maand — ook zichtbaar zonder JS. */
  standaardMaand: string;
  /** Vaste maandnaam die de standaardtekst overschrijft (bv. "december"). Wint van `maandenVooruit`. */
  maand?: string;
  /** Bereken de maand als (vandaag + N maanden), in Nederlandse tijd. */
  maandenVooruit?: number;
  /** Tekst vóór de maand, bv. "Ruimte voor nieuwe projecten in". */
  label?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `availability-badge`. De puls-stip stopt
 * vanzelf bij `prefers-reduced-motion` (CSS, geen JS-koppeling nodig).
 */
export function AvailabilityBadge({
  standaardMaand,
  maand,
  maandenVooruit,
  label = 'Ruimte voor nieuwe projecten in',
  className,
}: AvailabilityBadgeProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { maand, maandenVooruit });
    return destroy;
  }, [maand, maandenVooruit]);

  return (
    <span ref={rootRef} className={`ab${className ? ` ${className}` : ''}`}>
      <span className="ab__dot" aria-hidden="true" />
      <span className="ab__tekst">
        {label} <span data-ab-maand>{standaardMaand}</span>
      </span>
    </span>
  );
}
