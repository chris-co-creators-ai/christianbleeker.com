'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './flip-lightbox.js';
import './flip-lightbox.css';

export interface FlipLightboxProps {
  /** De tegels; nest hierin `<a data-lightbox href="…">`-elementen. */
  children: ReactNode;
  /** CSS-selector voor de tegels binnen de root. */
  selector?: string;
  /** className voor de wrapper-div (bv. een grid-layout). */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `flip-lightbox`. Zet init/destroy op de
 * juiste levenscyclus-momenten; de markup binnen `children` bepaalt de
 * tegels via het `data-lightbox`-contract (zie README "Markup-contract").
 */
export function FlipLightbox({ children, selector, className }: FlipLightboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { selector });
    return destroy;
  }, [selector]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
