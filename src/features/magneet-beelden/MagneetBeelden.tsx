'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './magneet-beelden.js';
import './magneet-beelden.css';

export interface MagneetBeeldenProps {
  /** Inhoud; geef elk beeld `data-magneet`. */
  children: ReactNode;
  /** CSS-selector voor de beelden binnen de root. */
  selector?: string;
  /** Afstand in px waarbinnen de muis trekt (standaard 250). */
  radius?: number;
  /** Maximale verschuiving in px (standaard 30). */
  sterkte?: number;
  /** Lerp bij aantrekken (standaard 0,12). */
  aantrekken?: number;
  /** Lerp bij terugkeren (standaard 0,18). */
  terug?: number;
  className?: string;
}

/** React/Next client-wrapper om `magneet-beelden`: init in useEffect, destroy bij unmount. */
export function MagneetBeelden({ children, selector, radius, sterkte, aantrekken, terug, className }: MagneetBeeldenProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { selector, radius, sterkte, aantrekken, terug });
  }, [selector, radius, sterkte, aantrekken, terug]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
