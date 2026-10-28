'use client';

/**
 * advies-funnel — React client-wrapper
 * ======================================
 * Dunne wrapper rond de vanilla `advies-funnel.js`: mount `init(root, config)`
 * in een effect, ruimt op bij unmount. `config` is de JSON-funnel-definitie
 * (zie `configs/*.json` voor drie voorbeelden).
 */

import { useEffect, useRef } from 'react';
import { init } from './advies-funnel.js';
import './advies-funnel.css';

export interface AdviesFunnelOptie {
  waarde: string;
  label: string;
}

export interface AdviesFunnelVoorwaarde {
  vraag: string;
  waarde: string | string[];
}

export interface AdviesFunnelVraag {
  id: string;
  vraag: string;
  type: 'enkel' | 'meer';
  opties: AdviesFunnelOptie[];
  optioneel?: boolean;
  voorwaarde?: AdviesFunnelVoorwaarde;
}

export interface AdviesFunnelRegel {
  als?: Record<string, string | string[]>;
  default?: boolean;
  pakket: string;
  prijsIndicatie: string;
  uitleg: string;
}

export interface AdviesFunnelConfig {
  id: string;
  titel: string;
  vragen: AdviesFunnelVraag[];
  advies: AdviesFunnelRegel[];
  cta: Record<string, unknown>;
}

export interface AdviesFunnelProps {
  config: AdviesFunnelConfig;
  onSubmit?: (data: Record<string, unknown>) => void;
  onBooking?: (iso: string, data: Record<string, unknown>) => void;
  className?: string;
}

export function AdviesFunnel({ config, onSubmit, onBooking, className }: AdviesFunnelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const destroy = init(root, config, { onSubmit, onBooking });
    return destroy;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config-id bepaalt of de funnel écht anders is; onSubmit/onBooking herinitialiseren niet elke render.
  }, [config.id]);

  return <div ref={rootRef} className={className} />;
}

export default AdviesFunnel;
