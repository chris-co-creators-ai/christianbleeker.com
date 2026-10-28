'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './agenda-facade.js';
import './agenda-facade.css';

export interface AgendaFacadeProps {
  /** Inhoud; nest hierin één of meer `[data-agenda-facade]`-blokken. */
  children: ReactNode;
  /** CSS-selector voor de facades binnen de root. */
  selector?: string;
  /** Laad de agenda al als de kaart in beeld komt (standaard uit). */
  vooraf?: boolean;
  /** Op mobiel de dienst in een nieuw tabblad openen (standaard aan). */
  mobielNieuwTabblad?: boolean;
  /** Media query voor "mobiel". */
  mobielQuery?: string;
  /** Milliseconden tot de "laadt niet"-melding. */
  timeout?: number;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `agenda-facade`. De markup binnen `children`
 * bepaalt dienst, URL en teksten: zie de README voor het markup-contract.
 */
export function AgendaFacade({ children, selector, vooraf, mobielNieuwTabblad, mobielQuery, timeout, className }: AgendaFacadeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { selector, vooraf, mobielNieuwTabblad, mobielQuery, timeout });
  }, [selector, vooraf, mobielNieuwTabblad, mobielQuery, timeout]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
