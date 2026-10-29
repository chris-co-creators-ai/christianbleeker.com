'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './blokgrafiek-kern.js';
import './blokgrafiek.css';

export interface BlokgrafiekProps {
  /** De `<table>` die de bron is (en eventueel een eigen kop). Zie README, Markup-contract. */
  children?: ReactNode;
  /** Tabel buiten de wrapper als bron (element of selector), bv. een zichtbare prijstabel. */
  bron?: Element | string;
  /** Tabel in de wrapper visueel verbergen (standaard) of laten staan. */
  tabel?: 'verborgen' | 'zichtbaar';
  /** Index van de gemarkeerde staaf; `null` = geen. */
  gekozen?: number | null;
  /** Toegankelijke naam van de grafiek; standaard de `<caption>`. */
  label?: string;
  legenda?: { gekozen?: string; overig?: string; spook?: string };
  /** Vaste zinnen voor schermlezers; `{naam}` en `{n}` worden ingevuld. Zie README. */
  teksten?: { grafiek?: string; beschrijving?: string };
  /** Notatie van de tabelgetallen en asgetallen, bv. `en-GB`. Standaard `nl-NL`. */
  locale?: string;
  drempel?: number;
  className?: string;
}

type Api = (() => void) & { kies: (index: number | null) => void };

/** React/Next-wrapper om `blokgrafiek`. De tabel blijft React-markup; de grafiek tekent de module ernaast. */
export function Blokgrafiek({ children, bron, tabel, gekozen, label, legenda, teksten, locale, drempel, className }: BlokgrafiekProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const api = useRef<Api | null>(null);
  const legendaSleutel = legenda ? JSON.stringify(legenda) : '';
  const tekstSleutel = teksten ? JSON.stringify(teksten) : '';

  useEffect(() => {
    if (!ref.current) return;
    const d = init(ref.current, { bron, tabel, label, legenda, teksten, locale, drempel }) as Api;
    api.current = d;
    if (gekozen !== undefined) d.kies(gekozen);
    return () => {
      d();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bron, tabel, label, legendaSleutel, tekstSleutel, locale, drempel]);

  useEffect(() => {
    if (gekozen !== undefined) api.current?.kies(gekozen);
  }, [gekozen]);

  return (
    <div ref={ref} className={['bgf', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
