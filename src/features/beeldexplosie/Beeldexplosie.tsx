'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './beeldexplosie-kern.js';
import './beeldexplosie.css';

export interface BeeldexplosieProps {
  /** Markup binnen de sectie: `.bx__spoor[data-bx-spoor] > .bx__podium[data-bx-podium]` met beelden, kop en kaart (zie README). */
  children: ReactNode;
  /** id van de h1, voor aria-labelledby. */
  labelledBy?: string;
  /** Laadanimatie aan/uit. Standaard true. */
  intro?: boolean;
  /** Intro maar 1× per tabblad-sessie. Standaard false. */
  introPerSessie?: boolean;
  /** Starttijden (s) van de vier golven. Standaard [0.04, 0.14, 0.24, 0.39]. */
  golven?: number[];
  /** Start (s) van de eerste kopregel. Standaard 0.35. */
  kopStart?: number;
  /** Tijd (s) tussen de kopregels. Standaard 0.12. */
  kopStagger?: number;
  /** Voortgang (0..1) waarop de kaart begint te groeien. Standaard 0.46. */
  kaartStart?: number;
  /** Voortgang waarop de kaart vol is. Standaard 0.87. */
  kaartEind?: number;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `beeldexplosie`: init in useEffect, destroy
 * bij unmount. Kopieer `../../_kwaliteit/basis.js` mee.
 */
export function Beeldexplosie({
  children, labelledBy, intro, introPerSessie, golven, kopStart, kopStagger, kaartStart, kaartEind, className,
}: BeeldexplosieProps) {
  const ref = useRef<HTMLElement | null>(null);
  const golvenKey = golven ? golven.join(',') : '';

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const opties: Record<string, unknown> = {};
    if (intro !== undefined) opties.intro = intro;
    if (introPerSessie !== undefined) opties.introPerSessie = introPerSessie;
    if (golven) opties.golven = golven;
    if (kopStart !== undefined) opties.kopStart = kopStart;
    if (kopStagger !== undefined) opties.kopStagger = kopStagger;
    if (kaartStart !== undefined) opties.kaartStart = kaartStart;
    if (kaartEind !== undefined) opties.kaartEind = kaartEind;
    return init(root, opties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro, introPerSessie, golvenKey, kopStart, kopStagger, kaartStart, kaartEind]);

  return (
    <section ref={ref} className={`bx${className ? ` ${className}` : ''}`} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}
