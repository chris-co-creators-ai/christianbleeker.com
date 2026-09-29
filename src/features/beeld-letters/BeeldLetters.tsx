'use client';

import { useEffect, useRef, type CSSProperties, type ElementType } from 'react';
import { init } from './beeld-letters.js';
import './beeld-letters.css';

export interface BeeldLettersProps {
  /** De kop-tekst. Bij `woord` het deel vóór het gevulde woord. */
  voor?: string;
  /** Het (eerste) woord dat met beeld gevuld wordt. Zonder `voor` is dit de hele kop. */
  woord: string;
  /** Extra woorden om te typen na `woord`. Leeg = geen typemachine. */
  woorden?: string[];
  /** Foto-URL voor de foto-variant. */
  beeld?: string;
  /** Video voor de video-variant (dan wordt `beeld` niet gebruikt). */
  video?: { src: string; poster: string; srcMobiel?: string };
  /** Terugvalkleur onder het beeld (CSS-kleur). */
  terug?: string;
  cursor?: string;
  beweging?: 'drijf' | 'muis' | 'uit';
  typSnelheid?: number;
  wisSnelheid?: number;
  wachtNa?: number;
  wachtVoor?: number;
  lus?: boolean;
  /** Kopniveau, standaard h1. */
  als?: ElementType;
  className?: string;
  kopClassName?: string;
}

/**
 * React/Next.js client-wrapper om `beeld-letters`. Rendert de markup uit het
 * contract (zodat SSR de volledige kop met vulling levert) en zet init/destroy
 * op de levenscyclus. `init` herschrijft de kop; destroy herstelt hem.
 */
export function BeeldLetters({
  voor, woord, woorden = [], beeld, video, terug, cursor, beweging, typSnelheid, wisSnelheid, wachtNa, wachtVoor, lus,
  als: Kop = 'h1', className, kopClassName,
}: BeeldLettersProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const woordenSleutel = woorden.join('|');

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return init(root, {
      woorden: woordenSleutel ? [woord, ...woordenSleutel.split('|')] : undefined,
      cursor, beweging, typSnelheid, wisSnelheid, wachtNa, wachtVoor, lus,
    });
  }, [woord, woordenSleutel, cursor, beweging, typSnelheid, wisSnelheid, wachtNa, wachtVoor, lus]);

  const stijl = {
    ...(beeld && !video ? { '--bl-beeld': `url(${beeld})` } : {}),
    ...(terug ? { '--bl-terug': terug } : {}),
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={className}
      style={stijl}
      data-beeld-letters=""
      {...(video ? { 'data-bl-video': '' } : {})}
      data-bl-woorden={woordenSleutel ? [woord, ...woorden].join('|') : undefined}
      data-bl-beweging={beweging}
      suppressHydrationWarning
    >
      {video && (
        <video
          data-bl-video-bron=""
          muted
          loop
          playsInline
          preload="none"
          poster={video.poster}
          data-bl-src={video.src}
          data-bl-src-mobiel={video.srcMobiel}
          aria-hidden="true"
        />
      )}
      <Kop data-bl-kop="" className={kopClassName} suppressHydrationWarning>
        {voor ? <>{voor} </> : null}
        {voor && !video ? <span data-bl-woord="">{woord}</span> : woord}
      </Kop>
    </div>
  );
}
