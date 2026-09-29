'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { init } from './stapelpanelen.js';
import './stapelpanelen.css';

export interface StapelPaneel {
  /** Tekst van de kop (de tab). */
  titel: string;
  /** Inhoud van het paneel. */
  inhoud: ReactNode;
  /** Nummer in de kop, bijvoorbeeld "01". Standaard de positie. */
  nummer?: string;
  /** Eigen achtergrond en tekstkleur voor dit paneel. */
  achtergrond?: string;
  tekstkleur?: string;
}

export interface StapelpanelenOpties {
  /** Onder deze breedte (px) geen pin. Standaard 768. */
  breakpoint?: number;
  /** Gedrag onder het breakpoint: gewone uitklapper of alles onder elkaar. */
  mobiel?: 'uitklap' | 'onder';
  /** 'auto' = CSS-scrolltimeline als de browser die kent, anders JS. */
  motor?: 'auto' | 'css' | 'js';
  /** Deel van elk scrollstuk (0-0.4) waarop een paneel stilstaat. Standaard 0.2. */
  rust?: number;
  /** Onder deze vensterhoogte (px) geen pin. Standaard 520. */
  minHoogte?: number;
}

export interface StapelpanelenProps extends StapelpanelenOpties {
  /** 2 tot 5 panelen. */
  panelen: StapelPaneel[];
  /** Niveau van de koppen (2-6), standaard 3. */
  koppen?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

/** React/Next-wrapper: bouwt het markup-contract en start/stopt init() in een effect. */
export function Stapelpanelen({ panelen, koppen = 3, className, ...opties }: StapelpanelenProps) {
  const ref = useRef<HTMLElement | null>(null);
  const uid = useId();
  const Kop = `h${koppen}` as 'h3';
  const { breakpoint, mobiel, motor, rust, minHoogte } = opties;

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { breakpoint, mobiel, motor, rust, minHoogte });
  }, [breakpoint, mobiel, motor, rust, minHoogte, panelen.length]);

  return (
    <section ref={ref} data-stapelpanelen className={className}>
      <div data-sp-track>
        <div data-sp-stage>
          {panelen.map((p, i) => (
            <article
              key={i}
              data-sp-item
              style={{ ['--sp-item-bg' as string]: p.achtergrond, ['--sp-item-ink' as string]: p.tekstkleur }}
            >
              <Kop data-sp-kop>
                <button type="button" data-sp-knop>
                  <span data-sp-nr aria-hidden="true">{p.nummer ?? String(i + 1).padStart(2, '0')}</span>
                  <span data-sp-titel>{p.titel}</span>
                  <span data-sp-icoon aria-hidden="true" />
                </button>
              </Kop>
              <div data-sp-paneel id={`${uid}-p${i}`}>
                <div data-sp-inhoud>{p.inhoud}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
