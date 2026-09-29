'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './chatgpt-intake-knop.js';
import './chatgpt-intake-knop.css';

export interface ChatgptIntakeKnopProps {
  /** Inhoud; nest hierin één of meer `<a data-cik-trigger ...>`-triggers. */
  children: ReactNode;
  /** CSS-selector voor de triggers binnen de root. */
  selector?: string;
  /** Inline prompt-tekst; wint over `data-prompt-src` op de trigger. */
  promptTemplate?: string;
  /** Standaardwaarden voor {{bedrijf}}/{{site}}; een data-attribuut op de trigger zelf wint. */
  placeholders?: { bedrijf?: string; site?: string };
  /** Vanaf hoeveel tekens URL-lengte de klembord-flow gebruikt wordt (standaard 8000). */
  drempel?: number;
  /** className voor de wrapper-div. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `chatgpt-intake-knop`. De markup binnen
 * `children` bepaalt welke triggers er zijn en met welke prompt/target ze
 * werken — zie de README voor het markup-contract.
 */
export function ChatgptIntakeKnop({
  children,
  selector,
  promptTemplate,
  placeholders,
  drempel,
  className,
}: ChatgptIntakeKnopProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { selector, promptTemplate, placeholders, drempel });
    return destroy;
  }, [selector, promptTemplate, placeholders, drempel]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
