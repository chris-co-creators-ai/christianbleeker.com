'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './pill-nav.js';
import './pill-nav.css';

export interface PillNavLink {
  href: string;
  label: string;
  /** Markeert dit item als actief bij het eerste renderen. */
  active?: boolean;
}

export interface PillNavProps {
  links: PillNavLink[];
  /** Merknaam links in de pil; leeg = geen brand-label. */
  brand?: string;
  brandHref?: string;
  /** CTA rechts in de pil. */
  ctaLabel?: string;
  ctaHref?: string;
  position?: 'top' | 'bottom';
  hideOnScroll?: boolean;
  hideThreshold?: number;
  className?: string;
  /** Extra content i.p.v. `links`/`brand`/`ctaLabel` (geavanceerd gebruik). */
  children?: ReactNode;
}

/**
 * React/Next.js client-wrapper om `pill-nav`. Zet zelf init/destroy op de
 * juiste levenscyclus-momenten. Geef óf `links`/`brand`/`ctaLabel` óf eigen
 * `children` met dezelfde markup-structuur (zie README "Markup-contract").
 */
export function PillNav({
  links,
  brand,
  brandHref = '#',
  ctaLabel,
  ctaHref = '#',
  position,
  hideOnScroll,
  hideThreshold,
  className,
  children,
}: PillNavProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, { position, hideOnScroll, hideThreshold });
    return destroy;
  }, [position, hideOnScroll, hideThreshold]);

  return (
    <nav ref={rootRef} className={['pn', className].filter(Boolean).join(' ')} aria-label="Hoofdnavigatie">
      {children ?? (
        <>
          {brand && (
            <a className="pn__brand" href={brandHref}>
              {brand}
            </a>
          )}
          <ul className="pn__list" data-pn-list>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} aria-current={link.active ? 'page' : undefined}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {ctaLabel && (
            <a className="pn__cta" href={ctaHref}>
              {ctaLabel}
            </a>
          )}
        </>
      )}
    </nav>
  );
}
