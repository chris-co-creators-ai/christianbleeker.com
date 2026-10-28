'use client';

/**
 * kleur-configurator — React client-wrapper
 * ============================================
 * Dunne wrapper rond de vanilla `kleur-configurator.js`. `children` bevat de
 * markup: `[data-kleur-img]`, de radiogroep
 * (`input[type=radio][data-kleur-src][data-kleur-naam][data-kleur-meerprijs]`),
 * en optioneel `[data-kleur-naam]`/`[data-kleur-meerprijs]`/`[data-kleur-hidden]`.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './kleur-configurator.js';
import './kleur-configurator.css';

export interface KleurConfiguratorProps {
  children: ReactNode;
  queryParam?: string;
  formatMeerprijs?: (waarde: number) => string;
  className?: string;
}

export function KleurConfigurator({ children, className, ...options }: KleurConfiguratorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const destroy = init(root, options);
    return destroy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.queryParam, options.formatMeerprijs]);

  return (
    <div ref={rootRef} data-kleur-configurator className={className}>
      {children}
    </div>
  );
}

export default KleurConfigurator;
