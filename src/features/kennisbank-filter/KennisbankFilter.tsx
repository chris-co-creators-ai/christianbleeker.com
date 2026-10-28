'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './kennisbank-filter.js';
import './kennisbank-filter.css';

export interface KennisbankItem {
  titel: string;
  samenvatting?: string;
  categorieen?: string[];
  soort?: string;
  /** JJJJ-MM-DD */
  datum?: string;
  href?: string;
  meta?: string;
}

export interface KennisbankFilterProps {
  /** Server-gerenderde kaarten: `<li data-kb-kaart data-kb-categorie data-kb-soort data-kb-datum>`. Weglaten als je `bron` gebruikt. */
  children?: ReactNode;
  /** Kaarten per pagina (standaard 9). */
  perPagina?: number;
  /** Wachttijd in ms na typen in het zoekveld (standaard 200). */
  debounce?: number;
  /** Filterstand in de querystring (standaard true). */
  url?: boolean;
  /** JSON in plaats van markup (SEO-nadeel: kaarten komen pas na hydratie). */
  bron?: KennisbankItem[];
  eenheid?: [string, string];
  /** 'vacatures' = voorinstelling met locatie, uren, contract en salarisbereik. */
  modus?: 'vacatures';
  /** 'masonry' = kolommen van ongelijke hoogte (CSS columns, leesrichting kolom voor kolom). */
  weergave?: 'raster' | 'masonry';
  /** Extra checkbox-filters op `data-kb-<sleutel>`. Houd de array stabiel (useMemo/const buiten de component). */
  facetten?: { sleutel: string; label: string }[];
  /** Numerieke bereikfilters op `data-kb-<sleutel>` ("3400" of "3400-4600"). Houd de array stabiel. */
  bereiken?: { sleutel: string; label: string; stap?: number; min?: number; max?: number; formaat?: (n: number) => string }[];
  tekst?: Record<string, string>;
  className?: string;
}

/**
 * React/Next-wrapper om `kennisbank-filter`. Render de kaarten als `children`
 * (server-side, dus indexeerbaar); de wrapper levert root, lijst en de lege
 * bedieningsplek. Bij `bron` rendert het onderdeel zelf de lijst.
 */
export function KennisbankFilter({ children, perPagina, debounce, url, bron, eenheid, modus, weergave, facetten, bereiken, tekst, className }: KennisbankFilterProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { perPagina, debounce, url, bron, eenheid, modus, weergave, facetten, bereiken, tekst });
  }, [perPagina, debounce, url, bron, eenheid, modus, weergave, facetten, bereiken, tekst]);

  return (
    <div ref={rootRef} className={className} data-kb>
      <div className="kb-layout">
        <aside data-kb-controls hidden aria-label="Filters" />
        <div className="kb-hoofd">
          <ul className="kb-lijst" data-kb-lijst>{children}</ul>
        </div>
      </div>
    </div>
  );
}
