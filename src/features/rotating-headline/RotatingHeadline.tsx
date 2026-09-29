'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { init } from './rotating-headline.js';
import './rotating-headline.css';

export interface RotatingHeadlineProps {
  /** Tekst vóór het wisselende woord, bv. "Wij zijn". */
  prefix?: ReactNode;
  /** De woorden die om beurten getoond worden. */
  words: string[];
  /** Tekst ná het wisselende woord, bv. ".". */
  suffix?: ReactNode;
  variant?: 'blinds' | 'clip' | 'slide' | 'typing';
  /** Tijd per woord in ms. */
  interval?: number;
  as?: ElementType;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `rotating-headline`. Bouwt zelf de
 * `[data-rh-word]`-markup (met `hidden` op alle woorden behalve het eerste,
 * voor de zonder-JS-fallback) en roept `init`/`destroy` aan.
 */
export function RotatingHeadline({
  prefix,
  words,
  suffix,
  variant = 'clip',
  interval = 2600,
  as: Tag = 'h2',
  className,
}: RotatingHeadlineProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { variant, interval });
    return destroy;
  }, [variant, interval, words.join('|')]);

  return (
    <Tag ref={rootRef} data-rotating-headline className={className}>
      {prefix} <span className="rh__stage">
        {words.map((w, i) => (
          <span key={w} className="rh__word" data-rh-word hidden={i !== 0}>{w}</span>
        ))}
      </span> {suffix}
    </Tag>
  );
}
