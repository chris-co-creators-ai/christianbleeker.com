'use client';

import { useEffect, useId, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { init, berekenLaag, OPZET } from './krachtveld-logowand.js';
import '../circle-text/circle-text.css';
import './krachtveld-logowand.css';

export interface KrachtveldLogo {
  /** Naam van de organisatie: wordt de alt-tekst (of aria-label bij `svg`). Verplicht. */
  alt: string;
  /** Bestand van het logo (`<img>`). Geef dit óf `svg`. */
  src?: string;
  /** Inline SVG-logo (gebruik `currentColor` om de kleur uit het thema te halen). */
  svg?: ReactNode;
}

export interface KrachtveldLogowandProps {
  /** 6 tot 10 logo's, in leesvolgorde (plek 1 = linksboven). */
  logos: KrachtveldLogo[];
  /** Waar de schijf naartoe linkt. */
  href: string;
  /** Toegankelijke naam van de schijf-link, bv. "Plan een kennismaking met Studio Wester". */
  label: string;
  /** Tekst in het midden van de schijf. */
  knopTekst?: ReactNode;
  /** Tekst die rond de schijf draait (één keer; circle-text herhaalt hem). Leeg = geen ring. */
  ringTekst?: string;
  /** `licht` (standaard) of `donker`. Of laat weg en zet de CSS-variabelen zelf. */
  thema?: 'licht' | 'donker';
  /** Naam van de lijst met logo's voor schermlezers. */
  lijstLabel?: string;
  /** Maximale verplaatsing bij het buigen, in viewBox-eenheden (standaard 16). */
  kracht?: number;
  /** Straal van de invloed van de cursor (standaard 120). */
  bereik?: number;
  className?: string;
}

/**
 * React/Next.js client-wrapper om `krachtveld-logowand`. De veldlijnen en
 * logoplekken worden bij het renderen uitgerekend (ook op de server), dus de
 * HTML klopt zonder JavaScript; `init` voegt alleen het intekenen en het
 * buigen toe. Importeer ook typography/circle-text mee (staat al in de imports).
 */
export function KrachtveldLogowand({
  logos, href, label, knopTekst = 'Plan een kennismaking', ringTekst, thema = 'licht',
  lijstLabel, kracht, bereik, className,
}: KrachtveldLogowandProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const pad = useId().replace(/:/g, '');
  const lagen = useMemo(() => ({ d: berekenLaag(OPZET.d), m: berekenLaag(OPZET.m) }), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { kracht, bereik, ring: !!ringTekst });
  }, [kracht, bereik, ringTekst]);

  const laag = (k: 'd' | 'm') => {
    const l = lagen[k];
    return (
      <svg
        className={`kv__veld kv__veld--${k}`}
        viewBox={l.vb.join(' ')}
        aria-hidden="true"
        focusable="false"
        data-kv-veld={k}
        data-kv-r={l.R}
        data-kv-draai={l.draai ? 1 : 0}
      >
        {l.paden.map((p) => (
          <path
            key={`${p.L}${p.kant}`}
            data-kv-l={p.L}
            data-kv-kant={p.kant}
            style={{ '--kv-i': p.lijn } as CSSProperties}
            pathLength={1}
            d={p.d}
          />
        ))}
      </svg>
    );
  };

  return (
    <section ref={rootRef} className={className} data-krachtveld data-kv-thema={thema === 'donker' ? 'donker' : undefined}>
      <div className="kv__wand">
        {laag('d')}
        {laag('m')}
        <div className="kv__midden">
          <a className="kv__schijf" href={href} data-circle-text aria-label={label}>
            {ringTekst ? (
              <svg className="ct__ring" viewBox="0 0 100 100" aria-hidden="true">
                <defs><path id={`kv-${pad}`} d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" /></defs>
                <text><textPath href={`#kv-${pad}`}>{ringTekst}</textPath></text>
              </svg>
            ) : null}
            <span className="ct__center" aria-hidden="true">
              {knopTekst}
              <svg className="kv__pijl" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12 12 4M5.5 4H12v6.5" />
              </svg>
            </span>
          </a>
        </div>
        <ul className="kv__logos" aria-label={lijstLabel}>
          {logos.slice(0, 10).map((logo, i) => {
            const d = lagen.d.logos[i];
            const m = lagen.m.logos[i];
            return (
              <li
                key={logo.alt}
                className="kv__logo"
                style={{ '--dx': d.px, '--dy': d.py, '--mx': m.px, '--my': m.py, '--kv-n': i } as CSSProperties}
              >
                {logo.src ? (
                  <img src={logo.src} alt={logo.alt} loading="lazy" />
                ) : (
                  <span role="img" aria-label={logo.alt} style={{ display: 'block' }}>{logo.svg}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
