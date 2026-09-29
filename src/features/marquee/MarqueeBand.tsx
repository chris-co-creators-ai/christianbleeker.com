'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './marquee.js';
import './marquee.css';

export interface MarqueeProps {
  /** De items van de band — elk kind wordt één marquee-item. */
  children: ReactNode;
  /** Visuele variant. */
  variant?: 'giant' | 'tilted' | 'ticker' | 'logos';
  /** Snelheid in pixels per seconde. */
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
}

/**
 * React/Next.js client-wrapper om `marquee`. Zet `init`/`destroy` op de
 * juiste levenscyclus-momenten; `children` wordt gerenderd als de items
 * binnen `[data-marquee-track]`.
 */
export function Marquee({ children, variant, speed, direction, className }: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { variant, speed, direction });
    return destroy;
  }, [variant, speed, direction]);

  return (
    <div ref={rootRef} data-marquee className={className}>
      <div data-marquee-track>{children}</div>
    </div>
  );
}
