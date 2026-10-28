'use client';

/**
 * afstand-postcode — React client-wrapper
 * ==========================================
 * Dunne wrapper rond de vanilla `afstand-postcode.js`. `children` bevat de
 * markup: `[data-afstand-form]`, `[data-afstand-postcode-input]`, optioneel
 * `[data-afstand-locatie]`/`[data-afstand-straal]`/`[data-afstand-status]`,
 * en `[data-afstand-lijst]` met `[data-locatie][data-lat][data-lng]`-items.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './afstand-postcode.js';
import './afstand-postcode.css';

export interface AfstandPostcodeTexts {
  searching?: string;
  notFound?: string;
  networkError?: string;
  geoDenied?: string;
  geoUnavailable?: string;
  geoTimeout?: string;
  noResultsInRadius?: string;
}

export interface AfstandPostcodeProps {
  children: ReactNode;
  pdokUrl?: string;
  texts?: AfstandPostcodeTexts;
  className?: string;
}

export function AfstandPostcode({ children, className, ...options }: AfstandPostcodeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const destroy = init(root, options);
    return destroy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.pdokUrl, options.texts]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}

export default AfstandPostcode;
