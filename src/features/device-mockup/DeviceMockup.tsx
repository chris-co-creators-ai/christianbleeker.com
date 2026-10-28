'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './device-mockup.js';
import './device-mockup.css';

export interface DeviceMockupProps {
  /** Type frame. */
  device: 'laptop' | 'phone';
  /** URL van de screenshot (mag langer zijn dan het schermvlak — scrollt dan bij hover/focus). */
  src: string;
  /** Alt-tekst van de screenshot. */
  alt: string;
  /** Bijschrift onder het frame. */
  caption?: ReactNode;
  /** className voor de wrapper. */
  className?: string;
}

/**
 * React/Next.js client-wrapper om `device-mockup`. Zet init/destroy op de
 * juiste levenscyclus-momenten; zie README "Markup-contract" voor wat de
 * onderdelen (`.dm-frame`, `[data-device-screen]`) betekenen.
 */
export function DeviceMockup({ device, src, alt, caption, className }: DeviceMockupProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // De <figure> zelf is de root: hij draagt `data-device`, dus init()
    // herkent hem direct als één frame (zie device-mockup.js).
    const destroy = init(root);
    return destroy;
  }, [src]);

  return (
    <figure ref={rootRef} className={className} data-device={device}>
      <div className="dm-frame" tabIndex={0} role="group" aria-label={alt}>
        {device === 'phone' && <div className="dm-notch" aria-hidden="true" />}
        {device === 'phone' && (
          <>
            <div className="dm-sidebtn dm-sidebtn--power" aria-hidden="true" />
            <div className="dm-sidebtn dm-sidebtn--vol1" aria-hidden="true" />
            <div className="dm-sidebtn dm-sidebtn--vol2" aria-hidden="true" />
          </>
        )}
        <div className="dm-screen" data-device-screen>
          <img src={src} alt={alt} loading="lazy" />
        </div>
        {device === 'laptop' && <div className="dm-base" aria-hidden="true" />}
      </div>
      {caption && <figcaption className="dm-caption">{caption}</figcaption>}
    </figure>
  );
}
