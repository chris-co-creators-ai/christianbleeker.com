'use client';

import { useEffect, useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { init } from './letter-rol.js';
import './letter-rol.css';

export interface LetterRolProps {
  /** Alleen platte tekst: de module knipt hem in letters. */
  children: string;
  /** Rendert een `<a>` als er een href is, anders een `<button>`. */
  href?: string;
  /** Totale spreiding in seconden (standaard 0,23). */
  stagger?: number;
  className?: string;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  anchorProps?: AnchorHTMLAttributes<HTMLAnchorElement>;
}

/** React/Next.js client-wrapper om `letter-rol`. */
export function LetterRol({ children, href, stagger, className, buttonProps, anchorProps }: LetterRolProps) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { stagger });
  }, [children, stagger]);

  // De span krijgt de letters; de naam (aria-label) komt op de knop of link.
  // suppressHydrationWarning: init() vervangt de tekst door letters.
  const tekst = <span ref={ref as React.RefObject<HTMLSpanElement>} data-letter-rol="" suppressHydrationWarning>{children}</span>;
  return href ? (
    <a href={href} className={className} {...anchorProps}>{tekst}</a>
  ) : (
    <button type="button" className={className} {...buttonProps}>{tekst}</button>
  );
}
