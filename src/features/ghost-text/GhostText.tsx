'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { init } from './ghost-text.js';
import './ghost-text.css';

export interface GhostTextProps {
  /** Het reusachtige woord/letter, bv. "UITGELICHT" of "R". */
  word: string;
  /** Lichte parallax bij scrollen. */
  parallax?: boolean;
  /** Inhoud van de sectie (boven de ghost-tekst). */
  children?: ReactNode;
  /** CSS `inset`-waarde voor de plaatsing van het woord, bv. "auto auto -0.05em 0". */
  inset?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `ghost-text`. Rendert de sectie-host +
 * het decoratieve `aria-hidden`-woord; `children` komt ervóór te staan.
 */
export function GhostText({ word, parallax = false, children, inset, className }: GhostTextProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { parallax });
    return destroy;
  }, [parallax]);

  return (
    <div data-ghost-text-host className={className}>
      {children}
      <span
        ref={rootRef}
        data-ghost-text
        aria-hidden="true"
        style={inset ? ({ ['--ghost-inset' as string]: inset } as CSSProperties) : undefined}
      >
        {word}
      </span>
    </div>
  );
}
