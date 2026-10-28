'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './float-decor.js';
import './float-decor.css';

export interface FloatDecorProps {
  /** Container waarbinnen naar de vijf data-attributen gezocht wordt (zie README). */
  children: ReactNode;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `float-decor`. Zet de vijf
 * data-attributen (`data-float`, `data-tilt`, `data-confetti`,
 * `data-offset-kader`, `data-badge`) rechtstreeks op elementen binnen
 * `children` — deze wrapper roept alleen `init()`/`destroy()` aan.
 */
export function FloatDecor({ children, className }: FloatDecorProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const destroy = init(root);
    return destroy;
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
