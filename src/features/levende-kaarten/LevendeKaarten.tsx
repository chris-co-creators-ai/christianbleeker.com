'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './levende-kaarten.js';
import './levende-kaarten.css';

export interface LevendeKaartenProps {
  /** De kaarten: <article className="lk-kaart"> met een .lk-visual[data-lk-visual] (zie README). */
  children: ReactNode;
  /** Seconden extra vertraging per kaart bij binnenkomst (standaard 0,04). */
  stap?: number;
  /** IntersectionObserver-rootMargin voor de binnenkomst. */
  rootMargin?: string;
  className?: string;
}

/**
 * React/Next-wrapper om `levende-kaarten`. De lussen zijn CSS; de JS zet alleen
 * attributen voor binnenkomst en pauze en haalt ze bij unmount weg.
 */
export function LevendeKaarten({ children, stap, rootMargin, className }: LevendeKaartenProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { stap, rootMargin });
  }, [stap, rootMargin]);

  return (
    <div ref={ref} data-levende-kaarten="" className={className}>
      <div className="lk-raster">{children}</div>
    </div>
  );
}
