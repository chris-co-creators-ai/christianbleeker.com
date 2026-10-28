'use client';

import { useEffect, useId, useRef } from 'react';
import { init } from './hotspots-kern.js';
import './hotspots.css';

export interface HotspotPoint {
  /** Positie in procenten t.o.v. de afbeelding, bv. "32%". */
  x: string;
  y: string;
  /** Cijfer/letter in het punt zelf (bv. "1"). */
  marker: string;
  title: string;
  description: string;
}

export interface HotspotsProps {
  src: string;
  alt: string;
  points: HotspotPoint[];
  className?: string;
}

/** React/Next.js client-wrapper om `hotspots`. */
export function Hotspots({ src, alt, points, className }: HotspotsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const destroy = init(root);
    return destroy;
  }, [points]);

  return (
    <div ref={rootRef} className={`hotspots${className ? ` ${className}` : ''}`}>
      <div className="hotspots__media">
        <img src={src} alt={alt} loading="lazy" />
        {points.map((point, i) => {
          const panelId = `${baseId}-panel-${i}`;
          return (
            <div key={panelId}>
              <button
                type="button"
                className="hotspots__point"
                style={{ ['--hx' as string]: point.x, ['--hy' as string]: point.y }}
                aria-expanded="false"
                aria-controls={panelId}
                data-hotspot-label={point.title}
              >
                {point.marker}
                <span className="hotspots__pulse" aria-hidden="true" />
              </button>
              <div className="hotspots__panel" id={panelId} hidden>
                <h4>{point.title}</h4>
                <p>{point.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
