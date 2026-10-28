'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './voor-na-verhaal.js';
import './voor-na-verhaal.css';

export interface VoorNaVerhaalProps {
  /** Minstens 2 `<figure data-vnv-stap>` met `<img>` en `<figcaption>`. Houd de children statisch: de module verplaatst de figuren tijdens het leven van het onderdeel. */
  children: ReactNode;
  /** 'fade' = crossfade (standaard), 'veeg' = zachte wisveeg van links naar rechts. */
  overgang?: 'fade' | 'veeg';
  /** Toon de schuif (role="slider"). Standaard aan. */
  schuif?: boolean;
  /** Scrollruimte per stap in svh. Standaard 70. */
  scrollLengte?: number;
  /** Deel (0,15-1) van de scrollruimte waarin de overgang loopt. Standaard 0,55. */
  overgangsdeel?: number;
  /** Kleine regel boven de foto. */
  titel?: string;
  /** Wordt aangeroepen als de getoonde stap wisselt. */
  opStap?: (index: number, figuur: Element) => void;
  /** Toegankelijke naam van het blok. */
  label?: string;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `voor-na-verhaal`. Het sticky podium en de
 * bediening worden door de module gebouwd; ontkoppelen (unmount of gewijzigde
 * props) zet de figuren terug op hun plaats.
 */
export function VoorNaVerhaal({
  children, overgang, schuif, scrollLengte, overgangsdeel, titel, opStap, label, className,
}: VoorNaVerhaalProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const opStapRef = useRef(opStap);
  useEffect(() => { opStapRef.current = opStap; });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, {
      overgang, schuif, scrollLengte, overgangsdeel, titel,
      opStap: (i: number, f: Element) => opStapRef.current?.(i, f),
    });
    return destroy;
  }, [overgang, schuif, scrollLengte, overgangsdeel, titel]);

  return (
    <section ref={rootRef} data-vnv="" aria-label={label} className={className}>
      {children}
    </section>
  );
}
