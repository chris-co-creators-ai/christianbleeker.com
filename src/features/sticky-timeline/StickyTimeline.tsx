'use client';

import { useEffect, useRef } from 'react';
import { init } from './sticky-timeline.js';
import './sticky-timeline.css';

export interface StickyTimelineStep {
  title: string;
  text: string;
}

export interface StickyTimelineProps {
  steps: StickyTimelineStep[];
  /** Optioneel: rij-layout op desktop (>=52rem); mobiel blijft altijd verticaal. */
  orientation?: 'vertical' | 'horizontal';
  /** Fractie van de viewporthoogte waarop een stap "aan" gaat. */
  activationRatio?: number;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `sticky-timeline`. Rendert zelf de
 * benodigde `<ol>`-markup uit `steps` en zet `init`/`destroy` op de juiste
 * levenscyclus-momenten.
 */
export function StickyTimeline({ steps, orientation = 'vertical', activationRatio, className }: StickyTimelineProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { activationRatio });
    return destroy;
  }, [activationRatio, steps.length]);

  return (
    <div
      ref={rootRef}
      data-sticky-timeline-root
      data-sticky-timeline-orientation={orientation}
      className={className}
    >
      <p data-sticky-timeline-status aria-hidden="true">
        Stap <span data-stl-status-num>1</span> van <span data-stl-status-total>{steps.length}</span>
      </p>
      <div data-sticky-timeline-track>
        <div data-sticky-timeline-line aria-hidden="true">
          <div data-sticky-timeline-line-fill />
        </div>
        <ol data-sticky-timeline>
          {steps.map((step, i) => (
            <li data-sticky-timeline-step key={step.title}>
              <span data-sticky-timeline-dot aria-hidden="true" />
              <span data-sticky-timeline-num aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
