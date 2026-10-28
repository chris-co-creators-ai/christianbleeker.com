'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './logo-kleurwissel.js';
import './logo-kleurwissel.css';

export interface LogoKleurwisselProps {
  /** Het SVG-logo, getekend met fill="currentColor". */
  children: ReactNode;
  href?: string;
  /** Naam voor schermlezers. */
  label: string;
  /** Selector voor de secties (standaard `[data-logo]`). */
  secties?: string;
  menuKnop?: string;
  menuPaneel?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `logo-kleurwissel`. Geef het logo vast
 * (position: fixed) in je header met className. De secties staan buiten
 * deze component en dragen `data-logo="licht"`.
 */
export function LogoKleurwissel({ children, href = '/', label, secties, menuKnop, menuPaneel, className }: LogoKleurwisselProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { secties, menuKnop, menuPaneel });
  }, [secties, menuKnop, menuPaneel]);
  return (
    <a ref={ref} className={`logo-kleurwissel${className ? ` ${className}` : ''}`} href={href} aria-label={label}>
      {children}
    </a>
  );
}
