'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './hero-motion.js';
import './hero-motion.css';

export interface HeroMotionOptions {
  lineSelector?: string;
  headingSelector?: string;
  fadeSelector?: string;
  copySelector?: string;
  figureSelector?: string;
  charStep?: number;
  fadeBase?: number;
  fadeStep?: number;
  recede?: boolean;
  recedeCopyVh?: number;
  recedeCopyScale?: number;
  recedeFigureVh?: number;
  recedeFigureScale?: number;
  recedeOpacity?: number;
}

export interface HeroMotionProps extends HeroMotionOptions {
  /** De hero-markup: kop met `data-hero-line`s, `data-hero-copy`, `data-hero-figure`, `data-hero-fade`-elementen. */
  children: ReactNode;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `hero-motion`. Rendert de stage-div
 * (`data-hero-stage`, waarop de recede-opacity wordt toegepast) en voert
 * init/destroy uit op de juiste levenscyclus-momenten. De opties worden
 * bewust alleen bij mount gelezen (animatie-setup is geen doorlopend
 * herrenderbare state).
 */
export function HeroMotion({ children, className, ...options }: HeroMotionProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, options);
    return destroy;
    // Bewust lege deps: dit is eenmalige animatie-setup bij mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} data-hero-stage className={className}>
      {children}
    </div>
  );
}
