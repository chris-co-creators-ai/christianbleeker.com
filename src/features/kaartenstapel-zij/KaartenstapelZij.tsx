'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './kaartenstapel-zij.js';
import './kaartenstapel-zij.css';

export interface KaartenstapelZijProps {
  /** Kop boven de rij; staat in het vastgepinde blok en pint dus mee. */
  kop?: ReactNode;
  /** Inhoud per kaart. Zet in een proceskaart een link met `data-kz-knop` voor de uitverende knop. */
  kaarten: ReactNode[];
  /** `team` = geen knoppen. */
  variant?: 'proces' | 'team';
  /** Toegankelijke naam van de sectie (id van de kop). */
  labelledBy?: string;
  className?: string;
  kaartClassName?: string;
  breakpoint?: number;
  minHoogte?: number;
  vhPerStap?: number;
  start?: number;
  interval?: number;
  duur?: number;
  donker?: number;
  naloop?: number;
  overflowFix?: 'clip' | 'melden';
  /** Naam van de zijwaarts scrollende rij op mobiel (die rij is dan focusbaar). */
  label?: string;
}

/** React/Next.js-wrapper om `kaartenstapel-zij`: init na mount, destroy bij unmount. */
export function KaartenstapelZij({
  kop, kaarten, variant = 'proces', labelledBy, className, kaartClassName,
  breakpoint, minHoogte, vhPerStap, start, interval, duur, donker, naloop, overflowFix, label,
}: KaartenstapelZijProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // undefined niet doorgeven: init() doet { ...STANDAARD, ...opties }, dus een undefined wist de standaard.
    const opties = Object.fromEntries(Object.entries({ breakpoint, minHoogte, vhPerStap, start, interval, duur, donker, naloop, overflowFix, label }).filter(([, v]) => v !== undefined));
    return init(ref.current, opties);
  }, [kaarten.length, variant, breakpoint, minHoogte, vhPerStap, start, interval, duur, donker, naloop, overflowFix, label]);

  return (
    <section ref={ref} data-kz="" data-kz-variant={variant} aria-labelledby={labelledBy} className={className}>
      <div data-kz-pin="">
        <div data-kz-stage="">
          {kop}
          <ol data-kz-rij="">
            {kaarten.map((k, i) => (
              <li key={i} data-kz-kaart="" className={kaartClassName}>{k}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
