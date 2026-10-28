'use client';

/**
 * besteldeadline — React client-wrapper
 * ========================================
 * Dunne wrapper rond de vanilla `besteldeadline-kern.js`. Zet `data-deadline`
 * etc. als HTML-attributen op de wrapper-div, precies zoals de vanilla-versie
 * ze leest.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './besteldeadline-kern.js';
import './besteldeadline.css';

export interface BesteldeadlineTexts {
  teVroeg?: (iso: string) => string;
  gesloten?: (iso: string) => string;
}

export interface BesteldeadlineProps {
  /** Afsluittijd "UU:MM" in Nederlandse tijd. */
  deadline: string;
  /** Komma-gescheiden gesloten weekdagen, 0=zondag…6=zaterdag, bv. "0,1". */
  geslotenWeekdagen?: string;
  /** Komma-gescheiden ISO-datums die gesloten zijn, bv. "2026-12-25,2026-01-01". */
  geslotenDatums?: string;
  texts?: BesteldeadlineTexts;
  /** De `<input type="date">` + eventueel een `[data-besteldeadline-melding]`-element. */
  children: ReactNode;
  className?: string;
}

export function Besteldeadline({
  deadline,
  geslotenWeekdagen,
  geslotenDatums,
  texts,
  children,
  className,
}: BesteldeadlineProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const destroy = init(root, { texts });
    return destroy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, geslotenWeekdagen, geslotenDatums]);

  return (
    <div
      ref={rootRef}
      data-deadline={deadline}
      data-gesloten-weekdagen={geslotenWeekdagen}
      data-gesloten-datums={geslotenDatums}
      className={className}
    >
      {children}
    </div>
  );
}

export default Besteldeadline;
