'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './raster-intro.js';
import './raster-intro.css';

export interface RasterIntroProps {
  /** Inhoud volgens het markup-contract: .ri__raster (svg), .ri__teken, h1.ri__kop met .ri__woord-spans. */
  children: ReactNode;
  /** Starttijd per woord in seconden (standaard 0.76 / 1.04 / 1.34 / 1.59). */
  woordStarts?: number[];
  /** Vermenigvuldiger voor alle tijden (1.2 = 20 % trager). */
  tempo?: number;
  /** Intro één keer per tabblad-sessie. */
  perSessie?: boolean;
  /** Klik of toets springt naar het eindbeeld (standaard true). */
  overslaan?: boolean;
  id?: string;
  className?: string;
  'aria-labelledby'?: string;
}

/**
 * React/Next.js-wrapper om `raster-intro`. De markup komt als children (zie
 * README, "Markup-contract"); init draait in useEffect, destroy bij unmount.
 * Server-side rendert alles in het eindbeeld; de intro start pas op de client.
 */
export function RasterIntro({ children, woordStarts, tempo, perSessie, overslaan, id, className, ...rest }: RasterIntroProps) {
  const ref = useRef<HTMLElement | null>(null);
  const starts = woordStarts?.join(',');

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { woordStarts, tempo, perSessie, overslaan });
    // woordStarts als string vergelijken: een nieuwe array per render mag de intro niet herstarten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starts, tempo, perSessie, overslaan]);

  return (
    <section ref={ref} data-raster-intro="" id={id} className={className} aria-labelledby={rest['aria-labelledby']}>
      {children}
    </section>
  );
}
