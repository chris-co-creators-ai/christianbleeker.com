'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './sectie-dock.js';
import './sectie-dock.css';

export interface DockActie {
  /** Tekst rond de schijf (en in de pil). */
  tekst: string;
  /** Toegankelijke naam; noem de actie. Standaard `tekst`. */
  label?: string;
  /** Afwijkende tekst voor de desktop-pil. */
  pil?: string;
  /** Link (ook fallback bij `event`/`actie`). */
  href?: string;
  /** CustomEvent-naam die op `document` wordt verstuurd. */
  event?: string;
  /** Callback bij klik; de link volgt dan niet. */
  actie?: (info: { sectie: string; cfg: DockActie; event: Event }) => void;
}

export interface SectieDockProps {
  /** Zonder-JS-fallback en standaardtekst, bv. "Neem contact op". */
  children: ReactNode;
  /** Zonder-JS-fallback en standaardlink naar het contact. */
  href: string;
  /** Sectie-id → actie, in paginavolgorde. */
  secties?: Record<string, DockActie>;
  standaard?: Partial<DockActie>;
  toonNa?: string | number;
  verberg?: string;
  drempel?: number;
  pil?: boolean;
  magneet?: boolean;
  reserveer?: boolean;
  wisselMs?: number;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `sectie-dock`. Rendert de fallback-link;
 * de module bouwt schijf en pil erin en zet bij unmount alles terug.
 * Sectie-id's worden in `document` gezocht: de secties mogen overal staan.
 */
export function SectieDock({ children, href, className, secties, standaard, toonNa, verberg, drempel, pil, magneet, reserveer, wisselMs }: SectieDockProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const opties = useRef({ secties, standaard, toonNa, verberg, drempel, pil, magneet, reserveer, wisselMs });
  opties.current = { secties, standaard, toonNa, verberg, drempel, pil, magneet, reserveer, wisselMs };
  // functies (actie) zitten niet in de sleutel: die lees je bij klik uit de laatste props
  const sleutel = JSON.stringify([secties, standaard, toonNa, verberg, drempel, pil, magneet, reserveer, wisselMs]);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    return init(a.ownerDocument.body, { ...opties.current, dock: a });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleutel]);

  return (
    <a ref={ref} className={['sd', className].filter(Boolean).join(' ')} href={href} data-sectie-dock>
      {children}
    </a>
  );
}
