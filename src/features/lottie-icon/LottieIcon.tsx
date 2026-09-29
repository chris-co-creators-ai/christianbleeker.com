'use client';

import { useEffect, useRef } from 'react';
import { init } from './lottie-icon.js';
import './lottie-icon.css';

export interface LottieIconProps {
  /** Pad naar de Lottie-JSON. */
  src: string;
  /** Statische SVG/afbeelding die zonder JS (en bij "minder beweging") zichtbaar blijft. */
  fallbackSrc: string;
  /** Loopt de animatie door (standaard) of speelt hij één keer. */
  loop?: boolean;
  /** IntersectionObserver-rootMargin — hoe ver vóór in beeld de player al laadt. */
  rootMargin?: string;
  /** Betekenisvolle omschrijving; gezet = `role="img"` + `aria-label`. Leeg = decoratief (`aria-hidden`). */
  label?: string;
  /** Breedte/hoogte in px (vierkant). */
  size?: number;
  /** className voor het root-element. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `lottie-icon`. Zet zelf init/destroy op de
 * juiste levenscyclus-momenten.
 */
export function LottieIcon({
  src,
  fallbackSrc,
  loop,
  rootMargin,
  label,
  size = 64,
  className,
}: LottieIconProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const destroy = init(root, { src, loop, rootMargin, label });
    return destroy;
  }, [src, loop, rootMargin, label]);

  return (
    <div
      ref={ref}
      data-lottie-icon=""
      data-lottie-src={src}
      className={className}
      style={{ ['--li-size' as string]: `${size}px` } as React.CSSProperties}
    >
      <img data-lottie-fallback="" src={fallbackSrc} alt="" width={size} height={size} />
    </div>
  );
}
