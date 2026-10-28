'use client';

import { useEffect, useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { init } from './pulse-button.js';
import './pulse-button.css';

export interface PulseButtonProps {
  children: ReactNode;
  /** Glasknop-variant (transparant + blur) i.p.v. gevulde knop. */
  glass?: boolean;
  /** Stopt de ring na dit aantal cycli. Standaard 3. */
  maxPulses?: number;
  /** Pulseert alleen zolang de knop in beeld is. Standaard false. */
  onlyInView?: boolean;
  className?: string;
  /** Rendert een `<a>` i.p.v. `<button>` wanneer een `href` is meegegeven. */
  href?: string;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  anchorProps?: AnchorHTMLAttributes<HTMLAnchorElement>;
}

/** React/Next.js client-wrapper om `pulse-button`. */
export function PulseButton({ children, glass, maxPulses, onlyInView, className, href, buttonProps, anchorProps }: PulseButtonProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { maxPulses, onlyInView });
    return destroy;
  }, [maxPulses, onlyInView]);

  const classes = `pulse-button${glass ? ' pulse-button--glass' : ''}${className ? ` ${className}` : ''}`;

  return (
    <div ref={rootRef} style={{ display: 'contents' }}>
      {href ? (
        <a className={classes} href={href} {...anchorProps}>
          {children}
        </a>
      ) : (
        <button type="button" className={classes} {...buttonProps}>
          {children}
        </button>
      )}
    </div>
  );
}
