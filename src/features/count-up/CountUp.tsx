'use client';

import { useEffect, useRef } from 'react';
import { init } from './count-up.js';
import './count-up.css';

export interface CountUpProps {
  /** Het te tonen getal. Verplicht — dit is de enige bron van de waarheid (R8/R9). */
  waarde: number;
  /** Label onder het getal, bv. "tevreden klanten". */
  label?: string;
  /** Aantal decimalen (NL-notatie: komma). Standaard 0. */
  decimalen?: number;
  /** Tekst ná het getal, bv. "+" of "%". */
  suffix?: string;
  /** CSS-selector: andere elementen die dezelfde eindtekst krijgen (R9). */
  koppel?: string;
  /** Bronvermelding, zichtbaar getoond. */
  bron?: string;
  /** Datum/jaar bij de bron. */
  bronDatum?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `count-up`. De eindwaarde staat al
 * statisch in de HTML (server-rendered), zodat de content ook zonder JS
 * klopt — de module telt er bij hydratie/mount naartoe.
 */
export function CountUp({
  waarde,
  label,
  decimalen = 0,
  suffix = '',
  koppel,
  bron,
  bronDatum,
  className,
}: CountUpProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { waarde, decimalen, suffix, koppel, bron, bronDatum });
    return destroy;
  }, [waarde, decimalen, suffix, koppel, bron, bronDatum]);

  const eindTekst = new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  }).format(waarde) + suffix;

  return (
    <div ref={rootRef} className={`cu${className ? ` ${className}` : ''}`} data-waarde={waarde}>
      <span className="cu__waarde" data-cu-waarde>{eindTekst}</span>
      {label ? <span className="cu__label">{label}</span> : null}
    </div>
  );
}
