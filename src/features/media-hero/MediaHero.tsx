'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { init } from './media-hero.js';
import './media-hero.css';

export interface VideoBron {
  src: string;
  /** Media-query, bv. "(max-width: 640px)" voor de mobiele bron. Laat weg voor de standaardbron (moet als laatste in de array staan). */
  media?: string;
  type?: string;
}

export interface DiaBron {
  src: string;
  /** Optioneel: meerdere breedtes (`srcset`); de browser kiest bij 100vw. */
  srcSet?: string;
  alt?: string;
}

interface BaseProps {
  poster: string;
  aspectRatio?: string; // bv. "16 / 9"
  className?: string;
  children: ReactNode; // .mh__inhoud (h1/p/knoppen)
}

export type MediaHeroProps =
  | (BaseProps & { modus: 'video'; bronnen: VideoBron[] })
  | (BaseProps & { modus: 'diashow'; dias: DiaBron[]; diaInterval?: number });

/**
 * React/Next.js client-wrapper om `media-hero`. `children` is de inhoud die
 * in de contrast-gegarandeerde kaart (`.mh__inhoud`) komt te staan.
 */
export function MediaHero(props: MediaHeroProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root, {
      modus: props.modus,
      diaInterval: props.modus === 'diashow' ? props.diaInterval : undefined,
    });
    return destroy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.modus]);

  const style: CSSProperties = props.aspectRatio ? ({ ['--mh-aspect' as any]: props.aspectRatio }) : {};

  return (
    <div ref={rootRef} className={['mh', props.className].filter(Boolean).join(' ')} data-media-hero data-modus={props.modus}>
      <div className="mh__stage" style={style}>
        {props.modus === 'video' ? (
          <>
            <video className="mh__video" muted playsInline preload="metadata" poster={props.poster} autoPlay aria-hidden="true">
              {props.bronnen.map((b, i) => (
                <source key={i} src={b.src} media={b.media} type={b.type} />
              ))}
            </video>
            <img className="mh__poster" src={props.poster} alt="" fetchPriority="high" aria-hidden="true" />
          </>
        ) : (
          props.dias.map((d, i) => (
            <img
              key={d.src}
              className={i === 0 ? 'mh__dia is-actief' : 'mh__dia'}
              src={d.src}
              srcSet={d.srcSet}
              sizes={d.srcSet ? '100vw' : undefined}
              alt={d.alt ?? ''}
              fetchPriority={i === 0 ? 'high' : undefined}
              loading={i === 0 ? undefined : 'lazy'}
            />
          ))
        )}
        <div className="mh__overlay" aria-hidden="true" />
      </div>
      <button type="button" className="mh__pauze" data-mh-pauze aria-pressed="false">
        Pauzeer achtergrond
      </button>
      <div className="mh__inhoud">{props.children}</div>
    </div>
  );
}
