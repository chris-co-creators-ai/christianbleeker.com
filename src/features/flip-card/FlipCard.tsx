'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './flip-card.js';
import './flip-card.css';

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Toegankelijke naam van de omdraai-knop. Standaard "Draai kaart om". */
  toggleLabel?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `flip-card`. Levert zelf de markup die het
 * contract van `flip-card.css`/`flip-card.js` verwacht.
 */
export function FlipCard({ front, back, toggleLabel = 'Draai kaart om', className }: FlipCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root);
    return destroy;
  }, []);

  return (
    <div ref={rootRef} style={{ display: 'contents' }}>
      <div className={`flip-card${className ? ` ${className}` : ''}`}>
        <div className="flip-card__inner">
          <div className="flip-card__face flip-card__face--front">{front}</div>
          <div className="flip-card__face flip-card__face--back">{back}</div>
        </div>
        <button type="button" className="flip-card__toggle" aria-pressed="false" aria-label={toggleLabel}>
          <span className="flip-card__toggle-icon" aria-hidden="true">⇄</span>
        </button>
      </div>
    </div>
  );
}
