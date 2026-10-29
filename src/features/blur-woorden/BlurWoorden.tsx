'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './blur-woorden.js';
import './blur-woorden.css';

export interface BlurWoordenProps {
  /** Regels van de kop; elke regel staat op een eigen lijn. */
  regels: string[];
  /** Indexen van regels die in de zachte tekstkleur staan (bijvoorbeeld [1] voor de tweede regel). */
  zachteRegels?: number[];
  /** Klein label boven de kop. */
  eyebrow?: ReactNode;
  /** Beschrijving onder de kop. */
  tekst?: ReactNode;
  /** Kopniveau. */
  as?: 'h1' | 'h2' | 'h3';
  /** id op de kop, voor `aria-labelledby` van de sectie. */
  id?: string;
  className?: string;
  /** Seconden tussen twee woorden. */
  stap?: number;
  /** Maximale spreiding tussen eerste en laatste woord, in seconden. */
  maxSpreiding?: number;
  /** Startblur per woord, in px. */
  blur?: number;
  /** Deel van de kop dat in beeld moet zijn (0–1). */
  drempel?: number;
  /** Seconden voordat de beschrijving start. */
  tekstVertraging?: number;
}

/**
 * React/Next-wrapper om `blur-woorden`. De JS splitst de kop pas na de mount in
 * woorden en zet bij unmount precies de originele tekstknopen terug, zodat React
 * zijn eigen knopen houdt. Verandert de tekst, dan draait init opnieuw.
 */
export function BlurWoorden({
  regels, zachteRegels = [], eyebrow, tekst, as: Kop = 'h2', id, className,
  stap, maxSpreiding, blur, drempel, tekstVertraging,
}: BlurWoordenProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const sleutel = regels.join('\n');

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { stap, maxSpreiding, blur, drempel, tekstVertraging });
  }, [sleutel, stap, maxSpreiding, blur, drempel, tekstVertraging]);

  return (
    <div ref={ref} data-blur-woorden="" className={className}>
      {eyebrow ? <p data-bw-eyebrow="">{eyebrow}</p> : null}
      <Kop id={id} data-bw-kop="">
        {regels.map((r, i) => (
          <span key={i} data-bw-regel="" {...(zachteRegels.includes(i) ? { 'data-bw-zacht': '' } : {})}>
            {r}
          </span>
        ))}
      </Kop>
      {tekst ? <p data-bw-tekst="">{tekst}</p> : null}
    </div>
  );
}
