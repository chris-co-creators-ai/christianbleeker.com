'use client';

import { useEffect, useRef } from 'react';
import { init } from './film-grain.js';
import './film-grain.css';

export interface FilmGrainProps {
  /** Zichtbaarheid van de korrel (0..1). */
  sterkte?: number;
  /** Aantal wisselingen per seconde. */
  fps?: number;
  /** Breedte/hoogte van de gegenereerde ruistegel in pixels. */
  tegelGrootte?: number;
}

/**
 * React/Next.js client-wrapper om `film-grain`. Render deze component
 * eenmaal, ergens hoog in de boom (bv. in de root-layout) — hij tekent
 * zelf geen zichtbare wrapper, alleen een lege `<div>` die als mount-point
 * dient; de eigenlijke laag hangt via `position: fixed` los van de
 * document-flow.
 */
export function FilmGrain({ sterkte, fps, tegelGrootte }: FilmGrainProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { sterkte, fps, tegelGrootte });
    return destroy;
  }, [sterkte, fps, tegelGrootte]);

  return <div ref={rootRef} style={{ display: 'contents' }} />;
}
