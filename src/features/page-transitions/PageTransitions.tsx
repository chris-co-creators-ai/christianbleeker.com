'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './page-transitions.js';
import './page-transitions.css';

export interface PageTransitionsProps {
  /** Duur van de fade in ms. */
  duur?: number;
  /** Negeer native ondersteuning en gebruik altijd de JS-fallback. */
  forceerFallback?: boolean;
  /** Inhoud waarbinnen linkklikken worden onderschept — meestal je hele layout. */
  children: ReactNode;
}

/**
 * React/Next.js client-wrapper om `page-transitions`. Bedoeld voor
 * gewone, meerdere-pagina's-sites met normale `<a href>`-navigatie (bv.
 * een statisch geëxporteerde Next-site) — **niet** voor `next/link`-
 * navigatie binnen de Next App Router, die is al client-side en heeft
 * zijn eigen (nog experimentele) View Transitions-integratie.
 *
 * L10: zet de `unhandledrejection`-regel uit de README ("Installatie") zo
 * vroeg mogelijk in `<head>` (bv. via `next/script` met
 * `strategy="beforeInteractive"`, of rechtstreeks in `_document`) — anders
 * kan een native browser-transitie die zichzelf afbreekt onterecht als
 * JS-fout gelden, ook al draait deze wrapper zelf al langer mee.
 */
export function PageTransitions({ duur, forceerFallback, children }: PageTransitionsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { duur, forceerFallback });
    return destroy;
  }, [duur, forceerFallback]);

  return <div ref={rootRef}>{children}</div>;
}
