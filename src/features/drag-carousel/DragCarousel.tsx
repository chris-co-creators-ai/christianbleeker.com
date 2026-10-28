'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { init } from './drag-carousel.js';
import './drag-carousel.css';

export interface DragCarouselProps {
  /** Toegankelijke naam van de carousel-regio (bv. "Cases van Studio Wester"). */
  label: string;
  /** Eén React-node per dia. */
  slides: ReactNode[];
  className?: string;
  /** Voortgangsduim onder de viewport (breedte = zichtbaar/totaal, minimaal 10 %). */
  voortgang?: boolean;
  /** Gridlijn-modus: `true` (inhoud van het bovenliggende element), een selector, of een getal in px vanaf de linkerkant van de viewport. Dia 1 begint dan op de gridlijn en de pijlen springen ernaartoe. */
  gridlijn?: boolean | string | number;
}

/** React/Next.js client-wrapper om de interactieve `.carousel`-variant. */
export function DragCarousel({ label, slides, className, voortgang, gridlijn }: DragCarouselProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { voortgang, gridlijn });
    return destroy;
  }, [slides, voortgang, gridlijn]);

  return (
    <div ref={rootRef} className={`carousel${className ? ` ${className}` : ''}`}>
      <div className="carousel__viewport" role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0}>
        <div className="carousel__track">
          {slides.map((slide, i) => (
            <div key={i} className="carousel__slide" role="group" aria-roledescription="slide" aria-label={`Dia ${i + 1} van ${slides.length}`}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="carousel__controls">
        <button type="button" className="carousel__arrow carousel__arrow--prev" aria-label="Vorige dia">‹</button>
        <div className="carousel__dots">
          {slides.map((_, i) => (
            <button key={i} type="button" className="carousel__dot" aria-label={`Ga naar dia ${i + 1}`} aria-current={i === 0 ? 'true' : 'false'} />
          ))}
        </div>
        <button type="button" className="carousel__arrow carousel__arrow--next" aria-label="Volgende dia">›</button>
      </div>
      <p className="carousel__status" data-carousel-status aria-live="polite" id={`${baseId}-status`}>
        Dia 1 van {slides.length}
      </p>
    </div>
  );
}

export interface ContinuousStripProps {
  /** Eén React-node per item; de module dupliceert ze zelf niet — geef de items al gedupliceerd door als je een naadloze loop wilt, of gebruik `<ContinuousStrip>` twee keer met dezelfde `items`. */
  items: ReactNode[];
  className?: string;
}

/** React/Next.js client-wrapper om de `continuous`-variant (niet-interactieve strip). */
export function ContinuousStrip({ items, className }: ContinuousStripProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root);
    return destroy;
  }, [items]);

  return (
    <div ref={rootRef} className={`carousel-strip${className ? ` ${className}` : ''}`}>
      <div className="carousel-strip__track">
        <div className="carousel-strip__group">{items}</div>
        <div className="carousel-strip__group" aria-hidden="true">{items}</div>
      </div>
    </div>
  );
}
