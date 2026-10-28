'use client';

import { useEffect, useRef } from 'react';
import { init } from './review-wall.js';
import './review-wall.css';

export interface Review {
  naam: string;
  datum: string;
  score: number;
  tekst: string;
  bron?: string;
  bronUrl?: string;
}

export interface ReviewWallProps {
  reviews: Review[];
  /** Vaste score (bv. van Google) die wint van de berekening uit `reviews`. */
  scoreVast?: number;
  /** Verplicht zodra `scoreVast` gezet is — waar komt dat cijfer vandaan (R9). */
  scoreBron?: string;
  weergave?: 'raster' | 'carrousel';
  /** Score-badge als zwevend kaartje (bv. over een hero-foto) i.p.v. inline. */
  scoreZwevend?: boolean;
  schemaOrg?: boolean;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `review-wall`. Zonder reviews rendert dit
 * niets zichtbaars — de module verbergt de sectie (R8).
 */
export function ReviewWall({
  reviews,
  scoreVast,
  scoreBron,
  weergave = 'raster',
  scoreZwevend = false,
  schemaOrg,
  className,
}: ReviewWallProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const reviewsJson = JSON.stringify(reviews);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { reviews: JSON.parse(reviewsJson), scoreVast, scoreBron, weergave, schemaOrg });
    return destroy;
  }, [reviewsJson, scoreVast, scoreBron, weergave, schemaOrg]);

  return (
    <section ref={rootRef} className={`rw${className ? ` ${className}` : ''}`} data-weergave={weergave}>
      <div className={scoreZwevend ? 'rw__score rw__score--zwevend' : 'rw__score'} data-rw-score />
      {weergave === 'carrousel' ? (
        <div className="rw__nav">
          <button type="button" data-rw-vorige aria-label="Vorige reviews">‹</button>
          <button type="button" data-rw-volgende aria-label="Volgende reviews">›</button>
        </div>
      ) : null}
      <ul className="rw__lijst" data-rw-lijst />
    </section>
  );
}
