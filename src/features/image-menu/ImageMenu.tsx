'use client';

import { useEffect, useId, useRef } from 'react';
import { init } from './image-menu.js';
import './image-menu.css';

export interface ImageMenuLink {
  href: string;
  label: string;
  /** Afbeelding die getoond wordt bij hover/focus op deze link. */
  image: string;
  /** Alt-tekst voor die afbeelding. */
  imageAlt?: string;
  /** Achtergrondkleur van het paneel bij hover/focus op deze link (bv. `#114232`). */
  color?: string;
  active?: boolean;
}

export interface ImageMenuProps {
  links: ImageMenuLink[];
  className?: string;
}

/**
 * React/Next.js client-wrapper om `image-menu`. Zet zelf init/destroy op de
 * juiste levenscyclus-momenten.
 */
export function ImageMenu({ links, className }: ImageMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root);
    return destroy;
  }, []);

  const first = links[0];

  return (
    <div ref={rootRef} className={['im', className].filter(Boolean).join(' ')}>
      <button type="button" className="im__button" aria-expanded="false" aria-controls={panelId} data-im-button>
        Menu
      </button>
      <div id={panelId} className="im__panel" data-im-panel>
        <div className="im__content">
          <nav className="im__nav" aria-label="Hoofdmenu">
            <ul className="im__list" data-im-list>
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    data-im-image={link.image}
                    data-im-alt={link.imageAlt}
                    data-im-color={link.color}
                    aria-current={link.active ? 'page' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="im__visual" data-im-visual>
            <img src={first?.image} alt={first?.imageAlt ?? ''} />
          </div>
        </div>
      </div>
    </div>
  );
}
