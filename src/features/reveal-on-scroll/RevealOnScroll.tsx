'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './reveal-on-scroll.js';
import './reveal-on-scroll.css';

export interface RevealOnScrollProps {
  /** Inhoud; nest hierin de elementen met `data-reveal`. */
  children: ReactNode;
  /** CSS-selector voor de te onthullen elementen binnen de root. */
  selector?: string;
  /** IntersectionObserver-threshold (0..1). */
  threshold?: number;
  /** IntersectionObserver-rootMargin. */
  rootMargin?: string;
  /** Na onthullen niet opnieuw verbergen bij uitscrollen. */
  once?: boolean;
  /** Seconden extra vertraging vóór opacity start, bovenop de per-element `data-reveal-delay` — laat transform en opacity los van elkaar lopen. Standaard niet gezet (ongewijzigd gedrag: gelijktijdig). */
  opacityVertraging?: number;
  /** className voor de wrapper-div. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `reveal-on-scroll`. Zet zelf init/destroy
 * op de juiste levenscyclus-momenten; de markup binnen `children` bepaalt
 * welke elementen onthuld worden via `data-reveal` / `data-reveal="left|right"`.
 */
export function RevealOnScroll({
  children,
  selector,
  threshold,
  rootMargin,
  once,
  opacityVertraging,
  className,
}: RevealOnScrollProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { selector, threshold, rootMargin, once, opacityVertraging });
    return destroy;
  }, [selector, threshold, rootMargin, once, opacityVertraging]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
