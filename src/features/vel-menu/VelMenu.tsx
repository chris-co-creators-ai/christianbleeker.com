'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './vel-menu.js';
import './vel-menu.css';

export interface VelMenuProps {
  /** id van de dialog; de openknop verwijst ernaar met aria-controls (en commandfor voor zonder JS). */
  id: string;
  /** Toegankelijke naam van het menu. */
  label?: string;
  /** Het logo in het menu (komt op de plek van het element met data-vel-merk in de paginakop). */
  logo: ReactNode;
  /** Inhoud van de sluitknop (bijvoorbeeld de streepjes van morph-hamburger). */
  sluitInhoud?: ReactNode;
  sluitClassName?: string;
  /** De menu-inhoud. Geef elk blok dat apart binnen moet komen `data-vel-stap`. */
  children: ReactNode;
  lijnDuur?: number;
  rust?: number;
  velDuur?: number;
  inhoudStart?: number;
  stagger?: number;
  sluitDuur?: number;
  onChange?: (open: boolean) => void;
}

/**
 * React/Next.js-wrapper om `vel-menu`. De openknop staat in je eigen kop:
 * `<button aria-controls={id} commandfor={id} command="show-modal">`.
 */
export function VelMenu({
  id, label = 'Menu', logo, sluitInhoud, sluitClassName, children,
  lijnDuur, rust, velDuur, inhoudStart, stagger, sluitDuur, onChange,
}: VelMenuProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    if (!ref.current) return;
    return init(ref.current, { lijnDuur, rust, velDuur, inhoudStart, stagger, sluitDuur, onChange: (o: boolean) => onChangeRef.current?.(o) });
  }, [lijnDuur, rust, velDuur, inhoudStart, stagger, sluitDuur]);

  return (
    <dialog ref={ref} id={id} data-vel="" aria-label={label}>
      <div data-vel-vel="" aria-hidden="true" />
      <span data-vel-logo="">{logo}</span>
      {/* @ts-expect-error commandfor/command zijn nog niet in alle React-typen */}
      <button type="button" data-vel-sluit="" className={sluitClassName} aria-label="Menu sluiten" commandfor={id} command="close">
        {sluitInhoud ?? '×'}
      </button>
      <nav data-vel-inhoud="" aria-label={label}>{children}</nav>
    </dialog>
  );
}
