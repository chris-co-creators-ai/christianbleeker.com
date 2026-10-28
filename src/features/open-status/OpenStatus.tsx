'use client';

import { useEffect, useRef } from 'react';
import { init } from './open-status.js';
import './open-status.css';

type Tijdvak = [string, string];

export interface Schema {
  weekschema: Record<string, Tijdvak[]>;
  uitzonderingen?: Record<string, { open: false; label?: string } | Tijdvak[]>;
  seizoenen?: { van: string; tot: string; weekschema: Record<string, Tijdvak[]> }[];
}

export interface OpenStatusProps {
  /** Weekschema + optionele uitzonderingen/seizoenen. Zie README "Markup-contract". */
  schema: Schema;
  /** Statische fallback-tekst, zichtbaar tot de eerste render (en zonder JS via <noscript> eromheen). */
  standaardTekst?: string;
  /** Hoe vaak herberekenen, in ms. Standaard 60000 (elke minuut). */
  verversMs?: number;
  /** Voeg een schema.org OpeningHoursSpecification (ld+json) toe. */
  schemaOrg?: boolean;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `open-status`. Rekent in Nederlandse tijd
 * (nooit de tijdzone van de bezoeker), ververst elke minuut en schrijft
 * alleen naar de DOM als de tekst echt verandert (geen aria-live-spam).
 */
export function OpenStatus({
  schema,
  standaardTekst = 'Openingstijden laden…',
  verversMs,
  schemaOrg,
  className,
}: OpenStatusProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const schemaJson = JSON.stringify(schema);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { schema: JSON.parse(schemaJson), verversMs, schemaOrg });
    return destroy;
  }, [schemaJson, verversMs, schemaOrg]);

  return (
    <div ref={rootRef} className={`os${className ? ` ${className}` : ''}`}>
      <p className="os__regel">
        <span className="os__dot" aria-hidden="true" />
        <span data-os-tekst aria-live="polite" aria-atomic="true">
          {standaardTekst}
        </span>
      </p>
    </div>
  );
}
