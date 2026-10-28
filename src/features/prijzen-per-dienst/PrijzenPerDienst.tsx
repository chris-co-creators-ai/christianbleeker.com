'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './prijzen-per-dienst.js';
import './prijzen-per-dienst.css';

export interface PrijzenPerDienstProps {
  /** Markup volgens het contract in de README: `[data-ppd-paneel]` per dienst. */
  children: ReactNode;
  /** 'auto': pijltjes activeren meteen; 'handmatig': Enter/Spatie activeert. */
  activatie?: 'auto' | 'handmatig';
  /** Actieve tab in de URL-hash. */
  hash?: boolean;
  /** Maximale kanteling in graden (0 = uit, max 3). */
  kanteling?: number;
  paramDienst?: string;
  paramPakket?: string;
  className?: string;
}

/** React/Next.js client-wrapper om `prijzen-per-dienst`; init bij mount, destroy bij unmount. */
export function PrijzenPerDienst({ children, activatie, hash, kanteling, paramDienst, paramPakket, className }: PrijzenPerDienstProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { activatie, hash, kanteling, paramDienst, paramPakket });
  }, [activatie, hash, kanteling, paramDienst, paramPakket]);
  return (
    <div ref={ref} className={`ppd ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
