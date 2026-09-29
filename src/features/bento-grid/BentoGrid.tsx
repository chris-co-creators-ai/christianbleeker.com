'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './bento-grid.js';
import './bento-grid.css';

export interface BentoGridProps {
  /** Inhoud; nest hierin de tegels (`[data-tegel="groot|breed|hoog|klein"]`). */
  children: ReactNode;
  /** CSS-selector voor de tegels binnen de root. */
  tegelSelector?: string;
  /** CSS-selector (binnen elke tegel) voor de stretched-link. */
  linkSelector?: string;
  /** className voor de wrapper (`.bento`-grid). */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `bento-grid`. De layout en interactie
 * (zoom, focusring) zijn pure CSS — deze wrapper roept `init()` alleen aan
 * voor de markup-contract-controle in development (zie de README).
 */
export function BentoGrid({ children, tegelSelector, linkSelector, className }: BentoGridProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { tegelSelector, linkSelector });
    return destroy;
  }, [tegelSelector, linkSelector]);

  return (
    <div ref={rootRef} className={`bento ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
