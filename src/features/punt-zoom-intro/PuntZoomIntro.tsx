'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './punt-zoom-intro.js';
import './punt-zoom-intro.css';

export interface PuntZoomIntroProps {
  /** De `<svg>` met daarin het gemarkeerde deel, gewrapt in een element met className "pzi-logo-wrap". Zie Markup-contract in de README. */
  children: ReactNode;
  /** Pauze in ms vóór de zoom start. */
  startVertraging?: number;
  /** Duur van de zoom-animatie in ms. */
  duur?: number;
  /** Extra pixels bovenop de minimale radius die de hele viewport dekt. */
  extraRadius?: number;
  /** Sleutel voor de 1x-per-sessie-grens. */
  sleutel?: string;
  /** Absolute fail-safe in ms — hierna is de overlay hoe dan ook weg. */
  faalveiligMs?: number;
  /** className voor de root. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `punt-zoom-intro`. Render deze zo vroeg
 * mogelijk in de layout (bv. direct in `<body>`), met de svg-inhoud als
 * children volgens het markup-contract.
 */
export function PuntZoomIntro({
  children,
  startVertraging,
  duur,
  extraRadius,
  sleutel,
  faalveiligMs,
  className,
}: PuntZoomIntroProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { startVertraging, duur, extraRadius, sleutel, faalveiligMs });
    return destroy;
  }, [startVertraging, duur, extraRadius, sleutel, faalveiligMs]);

  return (
    <div ref={rootRef} data-punt-zoom-intro aria-hidden="true" className={className}>
      {children}
    </div>
  );
}
