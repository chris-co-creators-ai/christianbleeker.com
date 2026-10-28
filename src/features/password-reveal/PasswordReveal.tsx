'use client';

import { useEffect, useRef } from 'react';
import { init } from './password-reveal.js';
import './password-reveal.css';

export interface PasswordRevealProps {
  /** Het echte woord, bv. "Beveiligd." — staat zonder JS gewoon zo op de pagina. */
  word: string;
  /** Fractie van de viewporthoogte waarop de onthulling begint (0..1). */
  start?: number;
  /** Scroll-afstand in px voor volledige onthulling. */
  distance?: number;
  /** Maskeerteken. */
  mask?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `password-reveal`.
 */
export function PasswordReveal({ word, start = 0.75, distance = 350, mask = '*', className }: PasswordRevealProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { start, distance, mask });
    return destroy;
  }, [start, distance, mask, word]);

  return (
    <span ref={rootRef} data-password-reveal className={className}>
      <span className="pr__real">{word}</span>
    </span>
  );
}
