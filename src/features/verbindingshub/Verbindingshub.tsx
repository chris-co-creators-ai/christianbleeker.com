'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './verbindingshub-kern.js';
import './verbindingshub.css';

export interface HubKnoop {
  naam: string;
  /** Icoon (inline SVG, 24×24). Wordt als decor behandeld; geef het zelf aria-hidden. */
  icoon: ReactNode;
}

export interface VerbindingshubProps {
  /** Linkergroep (of bovenste rij op smal scherm), bijv. AI-assistenten. 3 is het mooist. */
  bronnen: HubKnoop[];
  /** Rechtergroep (of onderste rij), bijv. apps. */
  doelen: HubKnoop[];
  /** De centrale tegel: naam en logo. */
  hub: HubKnoop;
  /** Naam van de linkergroep voor schermlezers, bijv. "AI-assistenten". */
  bronLabel: string;
  /** Naam van de rechtergroep voor schermlezers, bijv. "Apps". */
  doelLabel: string;
  /** Beschrijving van het geheel (aria-label van de figure). */
  label: string;
  /** Woorden die de relatie hoorbaar maken: standaard "verbonden via" … "met". */
  via?: string;
  met?: string;
  /** ms voor één lijn. */
  reisduur?: number;
  /** ms rust tussen twee verbindingen. */
  rust?: number;
  className?: string;
}

export function Verbindingshub({
  bronnen, doelen, hub, bronLabel, doelLabel, label, via = 'verbonden via', met = 'met', reisduur, rust, className,
}: VerbindingshubProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const sleutel = `${bronnen.map((k) => k.naam).join('|')}#${doelen.map((k) => k.naam).join('|')}#${hub.naam}`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return init(root, { reisduur, rust });
  }, [reisduur, rust, sleutel]);

  const knoop = (k: HubKnoop) => (
    <li className="vh__knoop" key={k.naam}>
      <span className="vh__tegel">{k.icoon}</span>
      <span className="vh__naam">{k.naam}</span>
    </li>
  );

  return (
    <figure ref={rootRef} className={['vh', className].filter(Boolean).join(' ')} aria-label={label}>
      <div className="vh__vlak">
        <ul className="vh__groep" data-vh-kant="bron" aria-label={bronLabel}>{bronnen.map(knoop)}</ul>
        <div className="vh__hub">
          <span className="vh__tegel">{hub.icoon}</span>
          <span className="vh__naam"><span className="vh-sr">{via} </span>{hub.naam}<span className="vh-sr"> {met}</span></span>
        </div>
        <ul className="vh__groep" data-vh-kant="doel" aria-label={doelLabel}>{doelen.map(knoop)}</ul>
      </div>
    </figure>
  );
}
