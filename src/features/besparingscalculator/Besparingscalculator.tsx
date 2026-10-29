'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './besparingscalculator-kern.js';
import './vergelijkbalk-kopie.css';
import './blokgrafiek-kopie.css';
import './besparingscalculator.css';

export interface BesparingscalculatorProps {
  /** De configuratie (prijzen, staffel, teamgrootte, apps). Zie wolkhaven.json en README. */
  config: Record<string, unknown>;
  /** Keuze bijhouden in de adresbalk (`?team=8&apps=docs,projecten`). Standaard aan. */
  urlStaat?: boolean;
  /** Terugval zonder JavaScript; krijg `data-bc-terugval` en wordt verborgen zolang de calculator draait. */
  children?: ReactNode;
  className?: string;
}

/**
 * React/Next-wrapper om `besparingscalculator`. De module tekent de hele
 * rekenhulp in de wrapper; geef `config` als stabiel object (bv. een JSON-import),
 * anders bouwt hij bij elke render opnieuw op.
 */
export function Besparingscalculator({ config, urlStaat, children, className }: BesparingscalculatorProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { config, urlStaat });
  }, [config, urlStaat]);

  return (
    <div ref={ref} className={['bc', className].filter(Boolean).join(' ')}>
      {children ? <div data-bc-terugval="">{children}</div> : null}
    </div>
  );
}
