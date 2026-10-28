'use client';

import { useEffect, useRef } from 'react';
import { init } from './three-mascot.js';
import './three-mascot.css';

export interface ThreeMascotProps {
  /** URL naar een eigen GLB-model; zonder deze prop draait het procedurele standaardmodel. */
  modelUrl?: string;
  /** URL naar de posterafbeelding (fallback, en het beeld tot three.js geladen is). */
  posterSrc: string;
  /** Alt-tekst van de poster. Leeg als de mascotte puur decoratief is. */
  posterAlt?: string;
  /** Toon alléén de poster op touch-apparaten (geen 3D, geen three.js-download). */
  posterOnMobile?: boolean;
  /** Procedureel model: 'bij' (standaard) of 'hond'. */
  vorm?: 'bij' | 'hond';
  /** Alleen bij vorm 'hond': kleuren als hex-getal (vacht, vachtDonker, aftekening, neus, halsband, penning, schaduw). */
  kleuren?: Record<string, number>;
  /** Bovengrens pixelratio (standaard 2). */
  maxDpr?: number;
  /** Rustrichting van de hondenkop zonder muis. */
  kijk?: 'links' | 'midden' | 'rechts';
  /** className voor de wrapper (bv. om `--tm-aspect` te overschrijven). */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `three-mascot`. Zet init/destroy op de
 * juiste levenscyclus-momenten; de markup is een `<img data-mascot-poster>`
 * als poster/fallback, three.js laadt pas zodra de mascotte (bijna) in beeld
 * komt (zie README "Markup-contract").
 */
export function ThreeMascot({
  modelUrl,
  posterSrc,
  posterAlt = '',
  posterOnMobile = false,
  vorm,
  kleuren,
  maxDpr,
  kijk,
  className,
}: ThreeMascotProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { modelUrl, vorm, kleuren, maxDpr });
    return destroy;
    // kleuren als object: bewust alleen de JSON-vorm als afhankelijkheid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, vorm, maxDpr, JSON.stringify(kleuren)]);

  return (
    <div
      ref={rootRef}
      className={className}
      data-mascot
      data-model={modelUrl || undefined}
      data-mobiel={posterOnMobile ? 'poster' : undefined}
      data-kijk={kijk}
    >
      <img data-mascot-poster src={posterSrc} alt={posterAlt} loading="lazy" />
    </div>
  );
}
