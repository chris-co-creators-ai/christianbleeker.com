'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './scroll-richting-nav.js';
import './scroll-richting-nav.css';

export interface ScrollRichtingNavProps {
  children: ReactNode;
  /** Zet de header zelf sticky of fixed via deze klasse. */
  className?: string;
  /** Pixels in één richting voordat de stand wisselt. */
  drempel?: number;
  /** Binnen zoveel px van boven altijd zichtbaar. */
  bovenaan?: number;
  /** Extra voorwaarde om zichtbaar te blijven. */
  blijfStaan?: () => boolean;
  onChange?: (weg: boolean) => void;
}

/** React/Next.js-wrapper om `scroll-richting-nav`: een `<header>` die bij omlaag scrollen wegschuift. */
export function ScrollRichtingNav({ children, className, drempel, bovenaan, blijfStaan, onChange }: ScrollRichtingNavProps) {
  const ref = useRef<HTMLElement | null>(null);
  const cb = useRef({ blijfStaan, onChange });
  useEffect(() => { cb.current = { blijfStaan, onChange }; });

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, {
      drempel,
      bovenaan,
      blijfStaan: () => !!cb.current.blijfStaan?.(),
      onChange: (weg: boolean) => cb.current.onChange?.(weg),
    });
  }, [drempel, bovenaan]);

  return <header ref={ref} className={className}>{children}</header>;
}
