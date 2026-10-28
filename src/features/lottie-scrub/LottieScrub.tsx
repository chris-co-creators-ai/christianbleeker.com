'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { init } from './lottie-scrub.js';
import './lottie-scrub.css';

export interface LottieScrubProps {
  /** Pad naar de Lottie-JSON. */
  src: string;
  /** Statisch eindbeeld (laatste frame) voor zonder JS en bij minder beweging. */
  fallbackSrc: string;
  /** Breedte en hoogte van de animatie, voor een vaste verhouding (geen layout-shift). */
  breedte: number;
  hoogte: number;
  /** Hoogte (deel van het scherm) van de bovenkant bij frame 0. Standaard 1 (onderkant scherm). */
  start?: number;
  /** Hoogte (deel van het scherm) van de onderkant bij het laatste frame. Standaard 0 (bovenkant scherm). */
  eind?: number;
  /** Seconden naloop; 0 = direct. Standaard 0,8. */
  naloop?: number;
  /** Betekenisvolle omschrijving (bijvoorbeeld de bedrijfsnaam bij een logo). Leeg = decoratief. */
  label?: string;
  className?: string;
}

/** React/Next.js-wrapper om `lottie-scrub`: init in useEffect, destroy bij unmount. */
export function LottieScrub({ src, fallbackSrc, breedte, hoogte, start, eind, naloop, label, className }: LottieScrubProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    return init(ref.current, { src, start, eind, naloop });
  }, [src, start, eind, naloop]);

  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };

  return (
    <div
      ref={ref}
      data-lottie-scrub=""
      data-lottie-src={src}
      className={className}
      style={{ '--ls-ratio': `${breedte} / ${hoogte}` } as CSSProperties}
      {...a11y}
    >
      <img data-lottie-scrub-fallback="" src={fallbackSrc} alt="" width={breedte} height={hoogte} />
    </div>
  );
}
