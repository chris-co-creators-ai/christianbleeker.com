'use client';

import { useEffect, useRef, createElement, type ReactNode } from 'react';
import { init } from './letter-reveal.js';
import './letter-reveal.css';

export interface LetterRevealProps {
  /** Inhoud; nest hierin `<span data-lr-line>`/`<span data-lr-line="secondary">`-regels. */
  children: ReactNode;
  /** Welk kop-element gerenderd wordt. Standaard `h1`. */
  as?: 'h1' | 'h2' | 'h3';
  /** CSS-selector voor de regel-containers binnen de kop. */
  lineSelector?: string;
  /** Seconden animatieduur per letter. */
  duration?: number;
  /** Seconden vertraging per volgende letter (doorlopend over regels heen). */
  stagger?: number;
  /** Extra vertraging (seconden) per regel-index, tenzij `data-lr-line-delay` dat overschrijft. */
  lineGap?: number;
  /** className voor het kop-element. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `letter-reveal`. Zet zelf init/destroy op
 * de juiste levenscyclus-momenten; de markup binnen `children` bepaalt welke
 * regels onthuld worden via `data-lr-line` / `data-lr-line="secondary"`.
 */
export function LetterReveal({
  children,
  as = 'h1',
  lineSelector,
  duration,
  stagger,
  lineGap,
  className,
}: LetterRevealProps) {
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const destroy = init(root, { lineSelector, duration, stagger, lineGap });
    return destroy;
  }, [lineSelector, duration, stagger, lineGap]);

  return createElement(as, { ref, className, 'data-letter-reveal': '' }, children);
}
