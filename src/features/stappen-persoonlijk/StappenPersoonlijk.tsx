'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './stappen-persoonlijk.js';
import './stappen-persoonlijk.css';

export interface StappenPersoonlijkProps {
  /** ms voor het binnenkomen van een stap (standaard 300). */
  duur?: number;
  /** Minimale invultijd in ms; sneller = bot (standaard 1500). */
  minimaleTijd?: number;
  /** Tekst in de kop als het veld nog leeg is. */
  terugval?: { bedrijf?: string; voornaam?: string };
  /** Na een geslaagde POST. */
  onVerzonden?: (res: Response) => void;
  /** De fieldsets, het honeypot-veld en de verzendknop (zie README, markup-contract). */
  children: ReactNode;
  /** `action` van het formulier (ook de terugval zonder JS). */
  actie: string;
  className?: string;
  /** christianbleeker v2: fouttekst en uitweg-link na een mislukte POST. */
  foutTekst?: string;
  foutLink?: { href: string; tekst: string };
  id?: string;
}

/** React-wrapper: init na mount, destroy bij unmount. Het bedankscherm hoort buiten het formulier. */
export function StappenPersoonlijk({ children, actie, className, duur, minimaleTijd, terugval, onVerzonden, foutTekst, foutLink, id }: StappenPersoonlijkProps) {
  const ref = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return init(root, { actie, duur, minimaleTijd, terugval, onVerzonden, foutTekst, foutLink });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- foutLink is een vast object
  }, [actie, duur, minimaleTijd, terugval, onVerzonden, foutTekst]);
  return (
    <form ref={ref} id={id} data-sp="" action={actie} method="post" className={className}>
      {children}
    </form>
  );
}
