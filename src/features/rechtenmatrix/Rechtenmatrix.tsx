'use client';

import { useEffect, useMemo, useRef } from 'react';
import { init, tabelHtml } from './rechtenmatrix-kern.js';
import './rechtenmatrix.css';

export interface RechtenmatrixProps {
  /** De volledige config (standen, teksten, rollen, categorieën, waarden). */
  config: Record<string, unknown>;
  /** 'toon' = alleen lezen, 'bewerk' = de bezoeker kan klikken. Overschrijft config.modus. */
  modus?: 'toon' | 'bewerk';
  /** Wordt aangeroepen bij elke wijziging in bewerkmodus. */
  onWijziging?: (detail: { rol: string; handeling: string; stand: string; waarden: Record<string, Record<string, string>>; json: string }) => void;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `rechtenmatrix`. De leesbare tabel (zonder
 * JavaScript) wordt uit dezelfde config server-side gerenderd; `init` zet
 * er de schakelaars naast en verbergt de tabel.
 */
export function Rechtenmatrix({ config, modus, onWijziging, className }: RechtenmatrixProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const terugbellen = useRef(onWijziging);
  useEffect(() => { terugbellen.current = onWijziging; });
  const tabel = useMemo(() => ({ __html: tabelHtml(config) }), [config]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { config, modus });
    const luister = (e: Event) => terugbellen.current?.((e as CustomEvent).detail);
    root.addEventListener('rechtenmatrix:wijziging', luister);
    return () => {
      root.removeEventListener('rechtenmatrix:wijziging', luister);
      destroy();
    };
  }, [config, modus]);

  return <div ref={rootRef} data-rechtenmatrix="" className={className} dangerouslySetInnerHTML={tabel} />;
}
