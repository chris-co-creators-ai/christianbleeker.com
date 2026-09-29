'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './marker-highlight.js';
import './marker-highlight.css';

export interface MarkerHighlightProps {
  /** Inhoud; markeer woorden met <mark data-marker> of <strong data-marker>. */
  children: ReactNode;
  selector?: string;
  /** Markeerkleur (CSS-kleur). */
  kleur?: string;
  /** Hele regel of onderste helft. */
  hoogte?: 'regel' | 'half';
  /** Seconden vertraging. */
  vertraging?: number;
  /** Seconden looptijd. */
  duur?: number;
  /** Ruwe stiftrand. */
  ruw?: boolean;
  /** Schuinte van de ruwe rand (0-8). */
  schuin?: number;
  once?: boolean;
  threshold?: number;
  className?: string;
}

/** React/Next-wrapper om `marker-highlight`: init in useEffect, destroy bij unmount. */
export function MarkerHighlight({
  children, selector, kleur, hoogte, vertraging, duur, ruw, schuin, once, threshold, className,
}: MarkerHighlightProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { selector, kleur, hoogte, vertraging, duur, ruw, schuin, once, threshold });
  }, [selector, kleur, hoogte, vertraging, duur, ruw, schuin, once, threshold]);
  return <div ref={ref} className={className}>{children}</div>;
}
