'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './drempelteller-kern.js';
import './drempelteller.css';

export interface DrempeltellerProps {
  /** Huidige stand. Server-gerenderd; zonder geldige waarde (en zonder `bron`) verbergt de teller zich. */
  waarde?: number | string;
  /** Drempel (bijvoorbeeld 1000). */
  doel?: number | string;
  /** JSON-endpoint met `{ waarde, doel }`; wordt pas opgehaald als de teller in beeld komt. */
  bron?: string;
  /** Milliseconden voor het ophalen wordt opgegeven. Standaard 4000. */
  timeout?: number;
  /** Bijvoorbeeld "aanmeldingen". */
  eenheid?: string;
  /** Tekst tot het doel, met {waarde} {doel} {resterend} {procent} {eenheid}. */
  tekst?: string;
  /** Tekst als het doel bereikt is. */
  tekstBereikt?: string;
  /** Getal en balk tellen op als de teller in beeld komt. */
  optellen?: boolean;
  /** Toegankelijke naam van de balk. */
  label?: string;
  rol?: 'progressbar' | 'meter';
  className?: string;
  /** Server-gerenderde tekst die zonder JavaScript zichtbaar blijft. */
  children?: ReactNode;
}

/**
 * React/Next.js client-wrapper om `drempelteller`. Geef de server-gerenderde
 * zin als `children` mee: die blijft zichtbaar zonder JavaScript en wordt
 * daarna door de teller vervangen. Bij `bron` start hij verborgen.
 */
export function Drempelteller({ waarde, doel, bron, timeout, eenheid, tekst, tekstBereikt, optellen, label, rol, className, children }: DrempeltellerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { waarde, doel, bron, timeout, eenheid, tekst, tekstBereikt, optellen, label, rol });
    return destroy;
  }, [waarde, doel, bron, timeout, eenheid, tekst, tekstBereikt, optellen, label, rol]);

  return (
    <div ref={rootRef} data-drempelteller className={className} hidden={bron ? true : undefined} suppressHydrationWarning>
      {children}
    </div>
  );
}
