'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './hover-set.js';
import './hover-set.css';

export interface HoverSetProps {
  /** Inhoud; nest hierin `.hover-card[data-hover="…"]`-kaarten (of gebruik `<HoverCard>`). */
  children: ReactNode;
  /** Maximale kantelhoek in graden voor `data-hover="tilt"`. Standaard 6. */
  maxTilt?: number;
  /** className voor de wrapper-div. */
  className?: string;
}

/** React/Next.js client-wrapper om `hover-set`: zet de "tilt"-muisvolging op. */
export function HoverSet({ children, maxTilt, className }: HoverSetProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { maxTilt });
    return destroy;
  }, [maxTilt]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}

export interface HoverCardProps {
  hover: 'lift' | 'tilt' | 'grow' | 'zoom' | 'arrow' | 'corners';
  href: string;
  title: string;
  description: string;
  image?: string;
  /** Toegankelijke naam van de stretched-link (bv. "Bekijk case: Titel"). Standaard = title. */
  linkLabel?: string;
  className?: string;
}

/** Eén kaart met het markup-contract dat `hover-set.css` verwacht (zie README § Markup-contract). */
export function HoverCard({ hover, href, title, description, image, linkLabel, className }: HoverCardProps) {
  return (
    <div className={`hover-card${className ? ` ${className}` : ''}`} data-hover={hover}>
      {image ? (
        <div className="hover-card__media">
          <img src={image} alt="" loading="lazy" />
        </div>
      ) : null}
      <div className="hover-card__body">
        <h3>{title}</h3>
        <p>{description}</p>
        {hover === 'arrow' ? (
          <span className="hover-card__cta">
            Bekijk case
            <span className="hover-card__arrow" aria-hidden="true">→</span>
          </span>
        ) : null}
      </div>
      {hover === 'corners' ? (
        <>
          <span className="hover-card__corner hover-card__corner--tl" aria-hidden="true" />
          <span className="hover-card__corner hover-card__corner--tr" aria-hidden="true" />
          <span className="hover-card__corner hover-card__corner--bl" aria-hidden="true" />
          <span className="hover-card__corner hover-card__corner--br" aria-hidden="true" />
        </>
      ) : null}
      <a className="hover-card__link" href={href}>
        {linkLabel ?? `Bekijk case: ${title}`}
      </a>
    </div>
  );
}
