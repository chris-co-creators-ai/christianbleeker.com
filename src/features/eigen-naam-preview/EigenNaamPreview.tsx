'use client';

import { useEffect, useId, useRef } from 'react';
import { init } from './eigen-naam-preview.js';
import './eigen-naam-preview.css';
import './domein-wissel-kopie.css';

export interface EigenNaamPreviewProps {
  /** CSS-selector van het gebied met de `[data-eigen-naam]`-plekken (standaard de hele pagina). */
  doel?: string;
  /** Sleutel in sessionStorage. */
  sleutel?: string;
  /** Maximale lengte van de slug (standaard 24). */
  max?: number;
  /** Milliseconden stilte na typen voordat de plekken wisselen (standaard 220). */
  wacht?: number;
  label?: string;
  placeholder?: string;
  /** De zin onder het veld; zeg eerlijk waar de naam blijft. */
  uitleg?: string;
  /**
   * Overige vaste teksten: `bijgewerkt` en `standaard` (de live-regio, `{naam}` en `{slug}` worden
   * ingevuld) en `wis` (aria-label van de wisknop). Standaard Nederlands, zie README.
   */
  teksten?: { bijgewerkt?: string; standaard?: string; wis?: string };
  className?: string;
}

/**
 * React/Next.js client-wrapper om `eigen-naam-preview`. Zet hem ná de onderdelen die zelf een plek
 * beheren (zoals `AppTourVenster`) in de boom, dan zijn hun listeners er al als de bewaarde naam
 * wordt teruggezet.
 */
export function EigenNaamPreview({
  doel,
  sleutel,
  max,
  wacht,
  label = 'Bekijk het met je eigen naam',
  placeholder = 'Bijvoorbeeld Bakkerij Groot',
  uitleg = 'Je naam blijft in dit tabblad en verdwijnt als je het sluit. Er gaat niets naar een server.',
  teksten,
  className,
}: EigenNaamPreviewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const { wis = 'Naam wissen', bijgewerkt, standaard } = teksten ?? {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return init(el, { doel, sleutel, max, wacht, teksten: { bijgewerkt, standaard } });
  }, [doel, sleutel, max, wacht, bijgewerkt, standaard]);

  return (
    <div ref={ref} className={['enp', className].filter(Boolean).join(' ')}>
      <div className="enp__rij">
        <label className="enp__label" htmlFor={`${id}-naam`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z" />
          </svg>
          {label}
        </label>
        <div className="enp__veld">
          <input
            id={`${id}-naam`}
            className="enp__invoer"
            type="text"
            inputMode="text"
            autoComplete="organization"
            spellCheck={false}
            maxLength={40}
            placeholder={placeholder}
            aria-describedby={`${id}-uitleg`}
          />
          <button type="button" className="enp__wis" data-enp-wis="" hidden aria-label={wis}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M7 7l10 10M17 7 7 17" />
            </svg>
          </button>
        </div>
      </div>
      <p className="enp__uitleg" id={`${id}-uitleg`}>{uitleg}</p>
    </div>
  );
}
