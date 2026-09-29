'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './reislijn.js';
import './reislijn.css';

export interface ReislijnProps {
  /** Pagina-inhoud; markeer secties met `data-reislijn-halte`, open elementen met `data-reislijn-aftakking`. */
  children: ReactNode;
  /** Forceer een route (voor tests): 'auto' kiest zelf. */
  route?: 'auto' | 'css' | 'terugval';
  /** Aantal lijnen (1 of 2). */
  lijnen?: 1 | 2;
  /** Selector van de tekstkolom waar de lijn naast loopt. */
  kolom?: string;
  /** Afstand (px) tussen lijn 1 en de tekstkolom op desktop. */
  afstand?: number;
  /** Afstand (px) tussen lijn 1 en lijn 2. */
  lijnAfstand?: number;
  /** Fractie van de viewporthoogte waarop de lijn eindigt en een stip oplicht. */
  activatie?: number;
  /** Viewportbreedte (px) tot en met waar de mobiele modus geldt. */
  mobielTot?: number;
  /** Mobiel: 'dun' (één dunne lijn tegen de rand) of 'uit'. */
  mobiel?: 'dun' | 'uit';
  /** Mobiel: x van de lijn in px. */
  xMobiel?: number;
  /** className voor de wrapper. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `reislijn`. De wrapper is de root: de lijn
 * loopt over de volle hoogte ervan. Geef hem de hele pagina-inhoud.
 */
export function Reislijn({
  children, route, lijnen, kolom, afstand, lijnAfstand, activatie, mobielTot, mobiel, xMobiel, className,
}: ReislijnProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { route, lijnen, kolom, afstand, lijnAfstand, activatie, mobielTot, mobiel, xMobiel });
  }, [route, lijnen, kolom, afstand, lijnAfstand, activatie, mobielTot, mobiel, xMobiel]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
