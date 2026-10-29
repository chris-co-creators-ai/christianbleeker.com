'use client';

import { useEffect, useId, useRef } from 'react';
import { init } from './circle-text.js';
import './circle-text.css';

export interface CircleTextProps {
  /** De tekst die rond de cirkel loopt — ÉÉN keer, bv. "Ontdek het menu". De module herhaalt 'm zelf zo vaak als nodig en past de tussenruimte aan zodat de lus altijd precies sluit (geen naad, geen afgekapte herhaling). */
  text: string;
  /** Scheidingsteken tussen de herhalingen. Standaard `' • '`. */
  separator?: string;
  /** Waar de link naartoe gaat. */
  href: string;
  /** Toegankelijke naam van de link (aria-label) — de visuele cirkeltekst is decoratief. */
  label: string;
  /** Optioneel icoon/foto in het midden. */
  center?: React.ReactNode;
  /** Rotatieduur in seconden. */
  duration?: number;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `circle-text`.
 */
export function CircleText({ text, href, label, center, duration = 24, separator, className }: CircleTextProps) {
  const rootRef = useRef<HTMLAnchorElement | null>(null);
  const pathId = useId().replace(/:/g, '');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { duration, separator });
    return destroy;
  }, [duration, separator]);

  return (
    <a ref={rootRef} href={href} aria-label={label} data-circle-text className={className}>
      <svg className="ct__ring" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id={pathId} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text>
          <textPath href={`#${pathId}`}>{text}</textPath>
        </text>
      </svg>
      {center && <span className="ct__center">{center}</span>}
    </a>
  );
}
