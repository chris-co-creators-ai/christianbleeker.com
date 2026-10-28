'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './parallax-kern.js';
import './parallax.css';

export interface ParallaxProps {
  /** Inhoud; nest hierin elementen met `data-parallax-y`/`-x`/`-rotate`/`-scale`/`-mouse`. */
  children: ReactNode;
  /** CSS-selector voor de te bewegen elementen binnen de root. */
  selector?: string;
  /** IntersectionObserver-rootMargin: hoe ver vóór in beeld de berekening al start. */
  rootMargin?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `parallax`. Zet `init`/`destroy` op de
 * juiste levenscyclus-momenten; de markup binnen `children` bepaalt welke
 * elementen bewegen via de `data-parallax-*`-attributen.
 */
export function Parallax({ children, selector, rootMargin, className }: ParallaxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { selector, rootMargin });
    return destroy;
  }, [selector, rootMargin]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
