'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { init, type VORMEN } from './section-dividers.js';
import './section-dividers.css';

export type DividerVorm = keyof typeof VORMEN;

export interface SectionDividerProps {
  /** Welke vorm (zie section-dividers.js VORMEN). */
  vorm: DividerVorm;
  /** Boven of onder in de sectie — de vorm is getekend als bodemrand en spiegelt verticaal voor "boven". */
  positie?: 'boven' | 'onder';
  /** Spiegelt de vorm horizontaal. */
  spiegel?: boolean;
  /** Hoogte in px, standaard 80 (5rem). */
  hoogte?: number;
  /** CSS-kleur; standaard `currentColor` (erft de tekstkleur van de ouder). */
  kleur?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `section-dividers`. Plaats binnen een
 * sectie met `position: relative` (of andere positioning-context).
 */
export function SectionDivider({
  vorm,
  positie = 'onder',
  spiegel = false,
  hoogte,
  kleur,
  className,
}: SectionDividerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const destroy = init(el);
    return destroy;
    // vorm zit in data-divider en verandert de DOM-content niet reactief —
    // bij een vormwissel maakt React een nieuw element (key), dus geen
    // dependency op vorm nodig.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style: CSSProperties = {};
  if (hoogte) (style as Record<string, string>)['--sd-hoogte'] = `${hoogte}px`;
  if (kleur) style.color = kleur;

  return (
    <div
      ref={ref}
      className={['sdv', className].filter(Boolean).join(' ')}
      data-divider={vorm}
      data-positie={positie}
      data-spiegel={spiegel ? '' : undefined}
      style={style}
    />
  );
}
