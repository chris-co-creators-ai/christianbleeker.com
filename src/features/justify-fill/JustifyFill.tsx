'use client';

import { useEffect, useRef, type ElementType } from 'react';
import { init } from './justify-fill.js';
import './justify-fill.css';

export interface JustifyFillProps {
  /** De platte tekst — wordt bij mount herschreven tot regels/woorden. */
  children: string;
  /** Rendert als dit element, bv. "h1". */
  as?: ElementType;
  /** Ook de laatste regel volledig uitvullen. */
  lastLine?: boolean;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `justify-fill`. Geeft `children` (platte
 * tekst) als `suppressHydrationWarning`-tekst mee: de JS herschrijft de DOM
 * ná mount, dus de server-gerenderde platte tekst wijkt bewust af van de
 * client-DOM ná `init()`.
 */
export function JustifyFill({ children, as: Tag = 'h2', lastLine = true, className }: JustifyFillProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { lastLine });
    return destroy;
  }, [children, lastLine]);

  return (
    <Tag ref={rootRef} data-justify-fill className={className} suppressHydrationWarning>
      {children}
    </Tag>
  );
}
