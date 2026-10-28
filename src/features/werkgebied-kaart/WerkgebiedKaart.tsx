'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './werkgebied-kaart.js';
import './werkgebied-kaart.css';

export interface WerkgebiedKaartProps {
  /**
   * De markup uit het contract: `.wk-podium` met de SVG uit `maak-kaart.mjs`
   * (`svg[data-wk-kaart]`) en een `<ol class="wk-lijst">` met `[data-wk-project]`-kaartjes.
   */
  children: ReactNode;
  /** Vergroting op het actieve punt (1 = de hele kaart). */
  zoom?: number;
  /** Duur van de vlucht in ms. */
  duur?: number;
  /** Fractie van een kaartjeshoogte waarbinnen het eerste kaartje nog als "overzicht" telt. */
  drempel?: number;
  /** Wordt aangeroepen bij een nieuw actief project (id null = overzicht). */
  bijWissel?: (id: string | null, index: number) => void;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `werkgebied-kaart`. De wrapper is de root.
 * De SVG-markup komt van `maak-kaart.mjs` (bouw- of ontwerptijd), dus zonder
 * JavaScript staat de kaart met alle punten en de projectlijst er al.
 */
export function WerkgebiedKaart({ children, zoom, duur, drempel, bijWissel, className }: WerkgebiedKaartProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const wisselRef = useRef(bijWissel);
  useEffect(() => { wisselRef.current = bijWissel; });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { zoom, duur, drempel, bijWissel: (id, i) => wisselRef.current?.(id, i) });
  }, [zoom, duur, drempel]);

  return (
    <div ref={rootRef} className={`wk${className ? ` ${className}` : ''}`} data-wk>
      {children}
    </div>
  );
}
