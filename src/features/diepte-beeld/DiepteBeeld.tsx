'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './diepte-beeld.js';
import './diepte-beeld.css';

export interface DiepteBeeldProps {
  /** De lagen: kinderen met `data-diepte-laag` en `data-diepte` (0 = achtergrond, 1 = voorgrond). */
  children: ReactNode;
  /** Maximale muisuitslag van de voorgrond, als fractie van het beeld (standaard 0,02). */
  muis?: number;
  /** Maximale scrolluitslag van de voorgrond, als fractie van de hoogte (standaard 0,05). */
  scroll?: number;
  /** Maximale scrolluitslag op touch, als fractie van de hoogte (standaard 0,12). */
  scrollTouch?: number;
  /** Lerp-factor per frame, 0–1 (standaard 0,09). */
  demping?: number;
  /** className op het beeld zelf; zet hier de verhouding of radius via --db-verhouding / --db-radius. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `diepte-beeld`. De alt-tekst zet je op de
 * achtergrondlaag; de andere lagen krijgen alt="" en aria-hidden="true".
 */
export function DiepteBeeld({ children, muis, scroll, scrollTouch, demping, className }: DiepteBeeldProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { muis, scroll, scrollTouch, demping });
  }, [muis, scroll, scrollTouch, demping]);

  return (
    <div ref={ref} data-diepte-beeld="" className={className}>
      {children}
    </div>
  );
}
