'use client';

import type { ElementType, ReactNode } from 'react';
import './schreef-accent.css';

export interface SchreefAccentProps {
  /** Inhoud; elke <em> in een kop h1–h6 hierbinnen wordt de schreefletter. */
  children: ReactNode;
  /** Element voor de wrapper (standaard div). Geef 'h2' om de kop zelf te zijn. */
  as?: ElementType;
  className?: string;
}

/**
 * React/Next.js-wrapper om `schreef-accent`. Alleen CSS, dus geen useEffect:
 * de wrapper zet `data-schreef-accent` en laadt de stylesheet.
 */
export function SchreefAccent({ children, as: Tag = 'div', className }: SchreefAccentProps) {
  return (
    <Tag data-schreef-accent="" className={className}>
      {children}
    </Tag>
  );
}
