'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './kaartenrij-lottie.js';
import './kaartenrij-lottie.css';

/** Zie de JSDoc in kaartenrij-lottie.js voor uitleg per optie. */
export interface KaartenrijOpties {
  introFactor?: number;
  voorStart?: number;
  voorVoortgang?: number;
  startSchaal?: number;
  veegQuery?: string;
  veegDrempel?: number;
  veegFactor?: number;
  uitloopSnelheid?: number;
  ankerFix?: boolean;
}

export interface Kaart {
  titel: string;
  tekst: string;
  /** Pad naar de lus-Lottie van deze kaart (frame 0 = rustbeeld). */
  lottie: string;
  /** Statisch icoon (SVG) dat zonder JS en bij minder beweging blijft staan. */
  icoon: string;
}

export interface KaartenrijLottieProps extends KaartenrijOpties {
  kaarten: Kaart[];
  /** Lottie die zich met de scroll tekent; het laatste frame moet gelijk zijn aan frame 0 van kaart 1. */
  hoofdLottie: string;
  /** Statische versie van het hoofdicoon (meestal hetzelfde als het icoon van kaart 1). */
  hoofdIcoon: string;
  /** Koptekst boven de rij (eyebrow, kop, intro). */
  kop?: ReactNode;
  labelledBy?: string;
  className?: string;
}

/**
 * React/Next.js-wrapper om `kaartenrij-lottie`. Init in useEffect, destroy bij
 * unmount. De markup blijft een gewone <ol>, dus server-side gerenderd en
 * zonder JS leesbaar.
 */
export function KaartenrijLottie({ kaarten, hoofdLottie, hoofdIcoon, kop, labelledBy, className, ...opties }: KaartenrijLottieProps) {
  const ref = useRef<HTMLElement | null>(null);
  const optieSleutel = JSON.stringify(opties);

  useEffect(() => {
    if (!ref.current) return undefined;
    return init(ref.current, JSON.parse(optieSleutel));
  }, [optieSleutel, kaarten.length]);

  return (
    <section ref={ref} data-kaartenrij="" aria-labelledby={labelledBy} className={className}>
      {kop}
      <div data-kaartenrij-pin="">
        <div data-kaartenrij-stage="">
          <div data-kaartenrij-hoofd="" data-kaartenrij-lottie={hoofdLottie} aria-hidden="true">
            <img src={hoofdIcoon} alt="" width={84} height={84} />
          </div>
          <ol data-kaartenrij-track="">
            {kaarten.map((k) => (
              <li key={k.titel} data-kaartenrij-kaart="">
                <h3>{k.titel}</h3>
                <div data-kaartenrij-icoon="" data-kaartenrij-lottie={k.lottie} aria-hidden="true">
                  <img src={k.icoon} alt="" width={84} height={84} />
                </div>
                <p>{k.tekst}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
