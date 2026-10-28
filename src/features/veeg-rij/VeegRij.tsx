'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './veeg-rij.js';
import './veeg-rij.css';

export interface VeegRijProps {
  /** Inhoud; geef elke regel `data-veeg` en de tekst die opschuift `data-veeg-tekst`. */
  children: ReactNode;
  /** CSS-selector voor de regels binnen de root. */
  selector?: string;
  /** 'links' (standaard) of 'pointer': het vlak komt van de kant waar de muis binnenkomt. */
  richting?: 'links' | 'pointer';
  className?: string;
}

/** React/Next client-wrapper om `veeg-rij`: init in useEffect, destroy bij unmount. */
export function VeegRij({ children, selector, richting, className }: VeegRijProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { selector, richting });
  }, [selector, richting]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
