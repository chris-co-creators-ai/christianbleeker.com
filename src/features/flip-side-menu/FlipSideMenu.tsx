'use client';

import { useEffect, useId, useRef } from 'react';
import { init } from './flip-side-menu.js';
import './flip-side-menu.css';

export interface FlipSideMenuLink {
  href: string;
  label: string;
}

export interface FlipSideMenuProps {
  links: FlipSideMenuLink[];
  /** Tekst onderaan het paneel, bv. contactgegevens. Optioneel. */
  meta?: React.ReactNode;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `flip-side-menu`. Zet zelf init/destroy op
 * de juiste levenscyclus-momenten. Geef `links` mee, of vervang de
 * kinderen voor eigen markup (zie README "Markup-contract").
 */
export function FlipSideMenu({ links, meta, className }: FlipSideMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root);
    return destroy;
  }, []);

  return (
    <div ref={rootRef} className={['fsm', className].filter(Boolean).join(' ')}>
      <button type="button" className="fsm__button" aria-expanded="false" aria-controls={panelId} data-fsm-button>
        <span className="fsm__button-face" data-fsm-face="closed" aria-hidden="true">
          MENU
        </span>
        <span className="fsm__button-face" data-fsm-face="open" aria-hidden="true">
          SLUIT
        </span>
        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Menu
        </span>
      </button>
      <div id={panelId} className="fsm__panel" data-fsm-panel>
        <nav className="fsm__nav" aria-label="Hoofdmenu">
          <ul className="fsm__list">
            {links.map((link) => (
              <li key={link.href} data-fsm-item>
                <a href={link.href}>
                  {link.label}
                  <span className="fsm__arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {meta && <div className="fsm__meta">{meta}</div>}
        </nav>
      </div>
    </div>
  );
}
