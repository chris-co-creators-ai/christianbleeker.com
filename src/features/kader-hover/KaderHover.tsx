'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './kader-hover.js';
import './kader-hover.css';

export interface KaderHoverProps {
  /** Inhoud; geef elke kaart `data-kader` en de knop-wrapper `data-kader-knop`. */
  children: ReactNode;
  /** CSS-selector voor de kaarten binnen de root. */
  selector?: string;
  className?: string;
}

/** React/Next client-wrapper om `kader-hover`: init in useEffect, destroy bij unmount. */
export function KaderHover({ children, selector, className }: KaderHoverProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { selector });
  }, [selector]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
