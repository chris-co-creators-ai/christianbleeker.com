'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './video-facade.js';
import './video-facade.css';

export interface VideoFacadeProps {
  /** Inhoud; nest hierin één of meer `[data-video-facade]`-blokken. */
  children: ReactNode;
  /** CSS-selector voor de facades binnen de root. */
  selector?: string;
  /** className voor de wrapper-div. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `video-facade`. De markup binnen
 * `children` bepaalt provider/id/titel/poster per video — zie de README
 * voor het markup-contract.
 */
export function VideoFacade({ children, selector, className }: VideoFacadeProps) {
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
