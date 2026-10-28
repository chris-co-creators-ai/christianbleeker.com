'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './eindeloos-raster.js';
import './eindeloos-raster.css';

export interface EindeloosRasterProps {
  /** Markup binnen de sectie: `.er__balk[data-er-balk]` met de uitweg, `.er__loop[data-er-loop] > ul.er__raster[data-er-raster]`, en `.er__einde#…` (zie README). */
  children: ReactNode;
  /** id van de kop van de sectie, voor aria-labelledby. */
  labelledBy?: string;
  /** Aantal keer dat het raster terugkomt voordat de lijst en footer komen. Standaard 20. */
  cycli?: number;
  /** Tegels in het eerste scherm komen bij het laden rustig omhoog. Standaard true. */
  inkomen?: boolean;
  /** rootMargin voor het aan/uit zetten van tegelvideo's. Standaard "0px". */
  videoMarge?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `eindeloos-raster`: init in useEffect,
 * destroy bij unmount. Kopieer `../../_kwaliteit/basis.js` mee. Render de
 * tegels als gewone server-markup; de kopieën maakt het script zelf.
 */
export function EindeloosRaster({ children, labelledBy, cycli, inkomen, videoMarge, className }: EindeloosRasterProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const opties: Record<string, unknown> = {};
    if (cycli !== undefined) opties.cycli = cycli;
    if (inkomen !== undefined) opties.inkomen = inkomen;
    if (videoMarge !== undefined) opties.videoMarge = videoMarge;
    return init(root, opties);
  }, [cycli, inkomen, videoMarge]);

  return (
    <section ref={ref} className={`er${className ? ` ${className}` : ''}`} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}
