'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './stappen-mini-ui.js';
import './stappen-mini-ui.css';
import './mesh-wolk-kopie.css';

export interface StappenMiniUiProps {
  /** De markup uit het contract: een <ol class="smu-rij"> met drie <li data-smu-stap>. */
  children: ReactNode;
  /** Start mesh-wolk op elk [data-mesh-wolk] binnen de root (standaard aan). */
  wolk?: boolean;
  /** Schermlezertekst na kopiëren. */
  meldingGekopieerd?: string;
  /** Schermlezertekst als kopiëren niet lukt. */
  meldingMislukt?: string;
  /** Zinnen die de JS schrijft: `leeg`, `gekozen` ('{n} gekozen'), `korting` ('{pct} % pakketkorting'), `voorbeeld`. Zie README. */
  teksten?: { leeg?: string; gekozen?: string; korting?: string; voorbeeld?: string };
  className?: string;
}

/**
 * React/Next-wrapper om `stappen-mini-ui`. De JS past alleen attributen en
 * bestaande tekstknopen aan en zet ze bij unmount terug; houd de getoonde
 * waarden (teller, prijs) statisch in je JSX, de JS rekent ze uit de data-attributen.
 */
export function StappenMiniUi({ children, wolk, meldingGekopieerd, meldingMislukt, teksten, className }: StappenMiniUiProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const tekstSleutel = teksten ? JSON.stringify(teksten) : '';

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { wolk, meldingGekopieerd, meldingMislukt, teksten: tekstSleutel ? JSON.parse(tekstSleutel) : undefined });
  }, [wolk, meldingGekopieerd, meldingMislukt, tekstSleutel]);

  return (
    <div ref={ref} data-stappen-mini-ui="" className={className}>
      {children}
    </div>
  );
}
