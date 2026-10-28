'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { init } from './story-word-light.js';
import './story-word-light.css';

export interface StoryWordLightProps {
  /** De zin zelf; mag `<em>`/`<strong>`/`<a>` bevatten. */
  children: ReactNode;
  /** Vermenigvuldiger in `floor(multiplier * p * aantalWoorden)`. Standaard 1.3. */
  multiplier?: number;
  /** Lengte van de scroll-baan in veelvoud van 100vh (CSS-var --swl-length). Standaard 1.7. */
  lengthVh?: number;
  /** className voor de root-sectie (naast `.swl`). */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `story-word-light`. Rendert zelf de
 * sticky-structuur (`.swl` → `.swl__sticky` → `<p data-story-text>`); de
 * module detecteert dat de tekst nog niet gesplitst is en splitst hem zelf.
 */
export function StoryWordLight({
  children,
  multiplier,
  lengthVh,
  className,
}: StoryWordLightProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { multiplier });
    return destroy;
  }, [multiplier]);

  const style: CSSProperties | undefined =
    lengthVh !== undefined ? ({ '--swl-length': lengthVh } as CSSProperties) : undefined;

  return (
    <section ref={rootRef} className={className ? `swl ${className}` : 'swl'} style={style}>
      <div className="swl__sticky">
        <p data-story-text>{children}</p>
      </div>
    </section>
  );
}
