'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { init } from './gradient-flow.js';
import './gradient-flow.css';

export interface GradientFlowProps {
  /** 4 pastelkleuren, standaard perzik/lavendel/cyaan/roze. */
  kleuren?: [string, string, string, string];
  /** Basisachtergrond (achter de blobs), standaard crème. */
  basis?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `gradient-flow`. Plaats binnen een
 * `position: relative`-container en zet content ervóór (`z-index`).
 */
export function GradientFlow({ kleuren, basis, className }: GradientFlowProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const destroy = init(el);
    return destroy;
  }, []);

  const style: CSSProperties = {};
  if (basis) (style as Record<string, string>)['--gf-basis'] = basis;
  if (kleuren) {
    kleuren.forEach((k, i) => {
      (style as Record<string, string>)[`--gf-kleur-${i + 1}`] = k;
    });
  }

  return (
    <div ref={ref} className={['gf', className].filter(Boolean).join(' ')} data-gradient-flow aria-hidden="true" style={style}>
      <div className="gf__veld">
        <span className="gf__blob gf__blob--1" />
        <span className="gf__blob gf__blob--2" />
        <span className="gf__blob gf__blob--3" />
        <span className="gf__blob gf__blob--4" />
      </div>
    </div>
  );
}
