'use client';

import { useEffect, useRef } from 'react';
import { init } from './boekingsvelden-kern.js';
import './boekingsvelden.css';

export interface BoekingsveldenWaarden {
  modus: 'verblijf' | 'tafel';
  aankomst?: string;
  vertrek?: string;
  nachten?: number;
  gasten?: number;
  kinderen?: number;
  kamers?: number;
  datum?: string;
  tijd?: string;
  personen?: number;
}

export interface BoekingsveldenVerstuurd {
  modus: 'verblijf' | 'tafel';
  dienst: string;
  url: string;
  /** Wat er echt gebeurde (een dialoog kan een nieuw tabblad worden). */
  doel: 'zelfde' | 'nieuw' | 'dialoog';
  gevraagdDoel: 'zelfde' | 'nieuw' | 'dialoog';
  waarden: BoekingsveldenWaarden;
}

export interface BoekingsveldenProps {
  /** Boekingsmodule zonder waarden. Ook de link die zonder JS werkt. */
  url: string;
  modus?: 'verblijf' | 'tafel';
  /** mews | zenchef | formitable | thefork | resengo | lightspeed | generiek | booking */
  dienst?: string;
  doel?: 'zelfde' | 'nieuw' | 'dialoog';
  /** Dialoog met iframe toestaan (alleen als de dienst dat toestaat). */
  iframe?: boolean;
  kinderen?: boolean;
  kamers?: boolean;
  /** Formitable-ticket. */
  ticket?: string;
  /** URL-sjabloon met {aankomst} {vertrek} {gasten} {datum} {tijd} {personen}. */
  sjabloon?: string;
  /** Taalcode voor de dienst (Mews: nl-NL, Formitable: nl). */
  taal?: string;
  maxGasten?: number;
  /** Tekst van de link zonder JS. */
  fallbackTekst?: string;
  /** Voor de meting: krijgt de details van `boekingsvelden:verstuurd`. */
  onVerstuurd?: (detail: BoekingsveldenVerstuurd) => void;
  className?: string;
}

/** React/Next.js-wrapper om `boekingsvelden`. Init in useEffect, destroy bij unmount. */
export function Boekingsvelden({
  url, modus = 'verblijf', dienst = 'generiek', doel = 'nieuw', iframe, kinderen, kamers, ticket, sjabloon, taal,
  maxGasten, fallbackTekst = 'Boek direct', onVerstuurd, className,
}: BoekingsveldenProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cb = useRef(onVerstuurd);
  useEffect(() => { cb.current = onVerstuurd; });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const luister = (e: Event) => cb.current?.((e as CustomEvent<BoekingsveldenVerstuurd>).detail);
    root.addEventListener('boekingsvelden:verstuurd', luister);
    const destroy = init(root, { modus, dienst, url, doel, iframe, kinderen, kamers, ticket, sjabloon, taal, maxGasten });
    return () => {
      root.removeEventListener('boekingsvelden:verstuurd', luister);
      destroy();
    };
  }, [url, modus, dienst, doel, iframe, kinderen, kamers, ticket, sjabloon, taal, maxGasten]);

  return (
    <div ref={ref} className={`bv${className ? ` ${className}` : ''}`} data-boekingsvelden>
      <a className="bv__fallback" data-bv-fallback href={url} target="_blank" rel="noopener noreferrer">
        {fallbackTekst}
      </a>
    </div>
  );
}
