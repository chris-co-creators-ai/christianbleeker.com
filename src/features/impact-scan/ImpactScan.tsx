'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './impact-scan.js';
import './impact-scan.css';

export interface ImpactScanConfig {
  id: string;
  titel: string;
  secPerVraag?: number;
  teksten: Record<string, string | string[]>;
  vragen: Array<{
    id: string;
    type: 'enkel' | 'meer' | 'getal';
    vraag: string;
    hint?: string;
    samenvattingLabel?: string;
    max?: number;
    min?: number;
    rekenregel?: string;
    factor?: number;
    richting?: string;
    richtingOnbekend?: string;
    opties: Array<{
      id: string;
      label: string;
      richting?: string;
      ideeen?: string[];
      kop?: string;
      kort?: string;
      vrij?: string;
      uitslagRegel?: string;
      waarde?: number;
      case?: { merk: string; bewijs?: string; regel?: string; poster?: string; kleur?: string };
    }>;
  }>;
  uitslag: {
    bronVraag: string;
    eyebrow?: string;
    kop: string;
    intro: string;
    verbinder?: string;
    richtingFocus?: string;
    maxIdeeen?: number;
    extra?: Array<{ als: Record<string, string | string[]>; tekst: string }>;
  };
  cta?: { href?: string };
}

export interface ImpactScanKlaarDetail {
  configId: string;
  antwoorden: Array<{ vraagId: string; vraag: string; antwoorden: Array<{ id: string; label: string }> }>;
  samenvatting: string;
  uitslag: Record<string, unknown>;
}

export interface ImpactScanProps {
  /** De scan: vragen, teksten, cases. Zie README. Wijzigt de inhoud (niet alleen de referentie), dan start de scan opnieuw. */
  config: ImpactScanConfig;
  /** Dialoog in een telefoonframe (valt weg op smalle schermen). */
  telefoon?: boolean;
  /** CSS-selector van het aanvraagformulier dat bij "Vraag aan" wordt ingevuld. */
  formulier?: string;
  /** Selector voor de openers binnen de wrapper. */
  opener?: string;
  /** Duur per laadregel in ms. */
  laadMs?: number;
  /** Naast het DOM-event `impact-scan:klaar`. */
  onKlaar?: (detail: ImpactScanKlaarDetail) => void;
  /** Bevat de opener(s): `<a href="/contact" data-impact-scan-open>…</a>`. */
  children: ReactNode;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `impact-scan`. De opener hoort in `children`
 * en blijft zonder JavaScript een gewone link naar het contactformulier.
 */
export function ImpactScan({ config, telefoon, formulier, opener, laadMs, onKlaar, children, className }: ImpactScanProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onKlaarRef = useRef(onKlaar);
  useEffect(() => { onKlaarRef.current = onKlaar; });
  const configKey = JSON.stringify(config);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, JSON.parse(configKey), {
      telefoon,
      formulier,
      opener,
      laadMs,
      onKlaar: (d: ImpactScanKlaarDetail) => onKlaarRef.current?.(d),
    });
    return destroy;
  }, [configKey, telefoon, formulier, opener, laadMs]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
