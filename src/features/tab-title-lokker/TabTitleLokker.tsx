'use client';

import { useEffect } from 'react';
import { init } from './tab-title-lokker.js';

export interface TabTitleLokkerProps {
  /** Tekst die afwisselt met de originele titel zodra het tabblad verborgen is. */
  lokzin?: string;
  /** Tijd in ms tussen elke wissel. */
  interval?: number;
  /** URL/data-URI voor een tweede favicon. Zonder waarde blijft het favicon ongemoeid. */
  favicon?: string;
}

/**
 * React/Next.js client-wrapper om `tab-title-lokker`. Geen zichtbare DOM —
 * render deze component eenmaal, ergens hoog in de boom (bv. root-layout).
 */
export function TabTitleLokker({ lokzin, interval, favicon }: TabTitleLokkerProps) {
  useEffect(() => {
    const destroy = init(document, { lokzin, interval, favicon });
    return destroy;
  }, [lokzin, interval, favicon]);

  return null;
}
