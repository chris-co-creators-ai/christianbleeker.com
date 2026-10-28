'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './zoek-keuzelijst.js';
import './zoek-keuzelijst.css';

export { vulSelect } from './zoek-keuzelijst.js';

export interface ZoekKeuzelijstProps {
  /** Label en <select> (met <option>/<optgroup>, eventueel `data-synoniemen` en `data-anders`). */
  children: ReactNode;
  /** Tekst in het lege veld. */
  placeholder?: string;
  /** Veldnaam van het vrije invulveld bij "Staat er niet tussen". */
  andersNaam?: string;
  /** Label boven het vrije invulveld. */
  andersLabel?: string;
  /** Vaste teksten overschrijven (bv. Engels). */
  teksten?: Record<string, unknown>;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `zoek-keuzelijst`. De <select> in `children`
 * blijft de bron van de waarde; de server rendert dus een werkend formulier.
 */
export function ZoekKeuzelijst({ children, placeholder, andersNaam, andersLabel, teksten, className }: ZoekKeuzelijstProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { placeholder, andersNaam, andersLabel, teksten });
    return destroy;
  }, [placeholder, andersNaam, andersLabel, teksten]);

  return (
    <div ref={rootRef} data-zoek-keuzelijst className={className}>
      {children}
    </div>
  );
}
