'use client'

import { useSyncExternalStore } from 'react'
import Script from 'next/script'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { siteVoor, uiVoor } from '@/lib/i18n-content'
import { padVoorTaal, type Taal } from '@/lib/i18n'
import { abonneerOpToestemming, leesToestemming, schrijfToestemming, type ToestemmingKeuze } from './opslag'
import { useEersteInteractie } from './eersteInteractie'

/** Op de server (en vóór hydratie) bestaat er geen keuze — pas na hydratie leest de browser
 *  `localStorage` via `leesToestemming` (het gebruikelijke `useSyncExternalStore`-patroon voor een
 *  externe bron). */
function geenKeuzeOpServer(): ToestemmingKeuze | null {
  return null
}

/**
 * De hele toestemmingsmodule: cookiemelding + (ná "Akkoord") GA4/GTM/Clarity. Zie README.md in
 * deze map voor wanneer je dit aanzet — kort: vul een ID in bij `site.meting` in `content/site.ts`.
 *
 * Zonder enig ID in `site.meting`: deze component rendert `null`. Geen melding, geen script, geen
 * localStorage-toegang — niets. Dat is de standaardstand van een template.
 *
 * Met een ID, vóór een keuze: alleen de melding, geen enkel meetscript in de HTML.
 * Met een ID, ná "Akkoord": Google Consent Mode v2 wordt eerst op "denied" gezet en meteen
 * daarna bijgewerkt naar "granted" (de gebruikelijke volgorde — ook al laadt hier, bewust
 * strenger dan de meeste implementaties, helemaal niets vóór die toestemming er is), en pas dán
 * mount `GoogleAnalytics`/`GoogleTagManager`/Clarity.
 */
export function Toestemming({ taal = 'nl' }: { taal?: Taal } = {}) {
  const site = siteVoor(taal)
  const ui = uiVoor(taal)
  const { ga4, gtm, clarity } = site.meting
  const heeftMeting = Boolean(ga4 || gtm || clarity)
  const keuze = useSyncExternalStore(abonneerOpToestemming, leesToestemming, geenKeuzeOpServer)
  // Meetscripts pas na toestemming én de eerste interactie (of 4 s), zie eersteInteractie.ts.
  const interactie = useEersteInteractie()

  if (!heeftMeting) return null

  return (
    <>
      {keuze === 'akkoord' && interactie && (
        <>
          <Script id="consent-mode-v2" strategy="afterInteractive">
            {"window.dataLayer=window.dataLayer||[];"
              + 'function gtag(){window.dataLayer.push(arguments);}'
              + "gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',"
              + "ad_user_data:'denied',ad_personalization:'denied'});"
              + "gtag('consent','update',{analytics_storage:'granted'});"}
          </Script>
          {ga4 && <GoogleAnalytics gaId={ga4} />}
          {gtm && <GoogleTagManager gtmId={gtm} />}
          {clarity && (
            <Script id="ms-clarity" strategy="afterInteractive">
              {'(function(c,l,a,r,i,t,y){'
                + 'c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};'
                + 't=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;'
                + 'y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);'
                + `})(window,document,"clarity","script","${clarity}");`}
            </Script>
          )}
        </>
      )}

      {keuze === null && (
        <div
          role="dialog"
          aria-label={ui.cookie.ariaLabel}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[36rem] flex-col gap-3
                     rounded-2xl border border-line bg-paper p-5 text-ink shadow-[0_20px_60px_rgb(16_16_16/0.14)]
                     sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-[13px] leading-[1.5] text-muted">
            {ui.cookie.tekst}{' '}
            <a href={padVoorTaal(taal, '/privacy')} className="underline hover:text-ink">{ui.cookie.privacyLinkLabel}</a>.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => schrijfToestemming('geweigerd')}
              className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold transition-colors hover:border-ink"
            >
              {ui.cookie.weigeren}
            </button>
            <button
              type="button"
              onClick={() => schrijfToestemming('akkoord')}
              className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-on-ink transition-colors hover:bg-accent"
            >
              {ui.cookie.akkoord}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
