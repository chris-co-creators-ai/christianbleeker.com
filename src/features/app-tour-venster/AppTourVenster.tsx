'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { init } from './app-tour-venster.js';
import './app-tour-venster.css';
import './domein-wissel-kopie.css';

export interface AppTourApp {
  /** Naam van de app; wordt de toegankelijke naam van de tab en de tooltip. */
  label: string;
  /** Domein in de adresbalk, met `{slug}` op de plek van de bedrijfsnaam, bv. `wiki.{slug}.nl`. */
  domein: string;
  /** Icoon in de rail (18 × 18). */
  icoon: ReactNode;
  /** Zin voor schermlezers: wat staat er in deze nep-app? */
  beschrijving: string;
  /** De nep-app zelf (wordt aria-hidden). Gebruik de `.atv-*`-klassen uit de CSS, zie demo.html. */
  scherm: ReactNode;
}

export interface AppTourVensterProps {
  /** 3–5 apps. Houd de array stabiel (buiten de component of met useMemo). */
  apps: AppTourApp[];
  /** Standaardnaam in de domeinen (vervangt `{slug}`). */
  slug?: string;
  /** Seconden per tab; 0 = niet automatisch. Standaard 5. */
  interval?: number;
  /** Toegankelijke naam van het hele venster. */
  label?: string;
  /** Logo bovenin de rail (optioneel, decoratief). */
  logo?: ReactNode;
  /**
   * Vaste teksten (Nederlandse standaard): pauzeknop (`pauzeer`, `speel`, `pauzeerLabel`, `speelLabel`),
   * `rol` (aria-roledescription, standaard "rondleiding") en `railLabel` (aria-label van de tablist).
   */
  teksten?: { pauzeer?: string; speel?: string; pauzeerLabel?: string; speelLabel?: string; rol?: string; railLabel?: string };
  className?: string;
}

/**
 * React/Next.js client-wrapper om `app-tour-venster`. Rendert venster, rail en panelen; de module
 * geeft ze gedrag (tabs, doorschuiven, pauze, scènes, domein-wissel in de adresbalk).
 */
export function AppTourVenster({ apps, slug = 'bedrijf', interval, label = 'Rondleiding door de apps', logo, teksten, className }: AppTourVensterProps) {
  const ref = useRef<HTMLElement | null>(null);
  const basis = useId();
  const { rol = 'rondleiding', railLabel = 'Apps in het voorbeeld', ...knop } = teksten ?? {};
  const knopSleutel = JSON.stringify(knop);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return init(el, { interval, slug, teksten: JSON.parse(knopSleutel) });
  }, [interval, slug, knopSleutel]);

  const eerste = apps[0]?.domein.replace(/\{slug\}/g, slug) ?? '';
  return (
    <section ref={ref} className={['atv', className].filter(Boolean).join(' ')} data-atv-slug={slug} role="region" aria-roledescription={rol} aria-label={label}>
      <div className="atv__chrome">
        <span className="atv__lichtjes" aria-hidden="true"><i /><i /><i /></span>
        <div className="atv__adres" aria-hidden="true">
          <svg className="atv-i" width="12" height="12" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
          <code data-atv-adres="" data-eigen-naam="domein">{eerste}</code>
        </div>
        <button type="button" className="atv__pauze" data-atv-pauze-knop="" hidden>
          <svg className="atv-i atv__icoon-pauze" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5v11M15 6.5v11" /></svg>
          <svg className="atv-i atv__icoon-speel" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.5v11l9-5.5z" /></svg>
          <span data-atv-knoptekst="">{knop.pauzeer ?? 'Pauzeren'}</span>
        </button>
      </div>
      <div className="atv__app">
        <div className="atv__rail" role="tablist" aria-label={railLabel} aria-orientation="vertical">
          {logo ? <span className="atv__logo" aria-hidden="true">{logo}</span> : null}
          {apps.map((app, i) => (
            <button
              key={app.label}
              type="button"
              role="tab"
              id={`${basis}-tab-${i}`}
              aria-controls={`${basis}-paneel-${i}`}
              aria-selected={i === 0}
              data-atv-domein={app.domein}
              data-atv-label={app.label}
            >
              <span aria-hidden="true">{app.icoon}</span>
              <span className="atv__tip">{app.label}</span>
            </button>
          ))}
          <span className="atv__railnaam" data-atv-railnaam="" aria-hidden="true">{apps[0]?.label}</span>
        </div>
        <div className="atv__podium">
          {apps.map((app, i) => (
            <div key={app.label} className="atv__paneel" role="tabpanel" tabIndex={0} id={`${basis}-paneel-${i}`} aria-labelledby={`${basis}-tab-${i}`}>
              <p className="atv__sr">{app.beschrijving}</p>
              <div aria-hidden="true">{app.scherm}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
