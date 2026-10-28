'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './eyebrow-lijn.js';
import './eyebrow-lijn.css';

export interface EyebrowLijnProps {
  /** Het label, bv. "Werkwijze". */
  label: string;
  /** De intro-zin. Een <em> erin wordt een schreef als je schreef-accent laadt met data-schreef-accent="alles". */
  children: ReactNode;
  /** Trigger-marge voor de IntersectionObserver (standaard bovenkant op 80 %). */
  rootMargin?: string;
  /** Eén keer afspelen (standaard true). */
  once?: boolean;
  className?: string;
}

/** React/Next.js-wrapper om `eyebrow-lijn`: rendert de vaste markup en start init/destroy. */
export function EyebrowLijn({ label, children, rootMargin, once, className }: EyebrowLijnProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { rootMargin, once });
  }, [rootMargin, once]);

  return (
    <div ref={ref} data-eyebrow-lijn="" className={className}>
      <div className="el__kop">
        <p className="el__label"><span>{label}</span></p>
        <span className="el__lijn" aria-hidden="true">
          <span className="el__streep" />
          <span className="el__baan">
            <svg className="el__pijl" viewBox="0 0 8 12" fill="none">
              <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </div>
      <p className="el__zin">{children}</p>
    </div>
  );
}
