'use client';

import { useEffect } from 'react';
import { init } from './custom-cursor.js';
import './custom-cursor.css';

export interface CustomCursorProps {
  /** Visuele variant. Standaard "dot". */
  variant?: 'dot' | 'crosshair' | 'groot' | 'bal';
  /** Smoothing-factor per animatieframe (0..1). Standaard 0.18. */
  lerp?: number;
  /** Selector voor elementen die de cursor laten vergroten. */
  interactiveSelector?: string;
  /** Selector voor tekstvelden die de systeemcursor terugkrijgen. */
  textFieldSelector?: string;
  /** Magnetische knoppen (`data-cursor-magnetic`) aan/uit. Standaard true. */
  magnetic?: boolean;
  /** Hoe ver een magnetische knop meebeweegt (0..1). Standaard 0.35. */
  magneticStrength?: number;
}

/**
 * React/Next.js client-wrapper om `custom-cursor`. Rendert zelf niets
 * zichtbaars — de module hangt de cursor-elementen aan `document.body`.
 * Zet dit component één keer op paginaniveau (bv. in de root-layout).
 */
export function CustomCursor(props: CustomCursorProps) {
  const { variant, lerp, interactiveSelector, textFieldSelector, magnetic, magneticStrength } = props;

  useEffect(() => {
    const destroy = init(document.body, { variant, lerp, interactiveSelector, textFieldSelector, magnetic, magneticStrength });
    return destroy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, lerp, interactiveSelector, textFieldSelector, magnetic, magneticStrength]);

  return null;
}
