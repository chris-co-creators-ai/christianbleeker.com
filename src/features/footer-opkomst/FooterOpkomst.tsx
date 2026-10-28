'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './footer-opkomst.js';
import './footer-opkomst.css';

export interface FooterOpkomstProps {
  /** De footerinhoud; hij wordt zelf in `data-opkomst-inhoud` gewikkeld. */
  children: ReactNode;
  /** 'auto' (standaard), 'native' of 'js' (forceert de IntersectionObserver-terugval). */
  modus?: 'auto' | 'native' | 'js';
  className?: string;
}

/** React/Next client-wrapper om `footer-opkomst`: rendert de `<footer>` en doet init/destroy. */
export function FooterOpkomst({ children, modus, className }: FooterOpkomstProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return init(el, { modus });
  }, [modus]);

  return (
    <footer ref={ref} data-opkomst className={className}>
      <div data-opkomst-inhoud>{children}</div>
    </footer>
  );
}
