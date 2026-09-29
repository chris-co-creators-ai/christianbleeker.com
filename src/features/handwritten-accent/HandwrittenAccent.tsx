'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './handwritten-accent.js';
import './handwritten-accent.css';

export interface HandwrittenAccentProps {
  /** De labeltekst, bv. "Net opgeleverd". */
  label: string;
  /** Inline-SVG-krul/pijl tonen (eigen svg via `arrowPath`, of de standaard-krul). */
  arrow?: boolean;
  /** Eigen SVG-pad (viewBox 0 0 32 32) i.p.v. de standaard-krul. */
  arrowPath?: string;
  /** "Wordt geschreven"-animatie bij in beeld. */
  animate?: boolean;
  /** Na de animatie niet opnieuw spelen bij terug-scrollen. */
  once?: boolean;
  /** Kanteling in graden. */
  tilt?: number;
  /** Inhoud die onder het accent komt te staan (meestal een kop). */
  children?: ReactNode;
  className?: string;
}

const DEFAULT_ARROW = 'M2 26C10 10 20 4 30 3M30 3l-6 1M30 3l-2 6';

/**
 * React/Next.js client-wrapper om `handwritten-accent`. Rendert het label
 * (+ optionele krul) boven `children`.
 */
export function HandwrittenAccent({
  label,
  arrow = false,
  arrowPath = DEFAULT_ARROW,
  animate = true,
  once = true,
  tilt = -4,
  children,
  className,
}: HandwrittenAccentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { animate, once });
    return destroy;
  }, [animate, once]);

  return (
    <div className={className}>
      <p
        ref={rootRef}
        data-handwritten-accent
        style={{ ['--hwa-tilt' as string]: `${tilt}deg` }}
      >
        {arrow && (
          <svg className="hwa__squiggle" viewBox="0 0 32 32" aria-hidden="true">
            <path d={arrowPath} />
          </svg>
        )}
        <span className="hwa__label">{label}</span>
      </p>
      {children}
    </div>
  );
}
