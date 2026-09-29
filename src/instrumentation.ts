/**
 * Foutbewaking (Sentry) — minimaal, en alléén actief met een `SENTRY_DSN` in de omgeving.
 *
 * ── Waarom dit voldoende is ──────────────────────────────────────────────────────────────────
 * `register()` draait uitsluitend server-/edge-side (Next.js' eigen instrumentation-hook, sinds
 * Next 15 stabiel, geen `experimental`-vlag nodig) — dit bestand komt dus nooit in de
 * client-JS-bundle terecht, met of zonder DSN. Zonder `SENTRY_DSN` doet `register()` niets: geen
 * `Sentry.init()`, dus geen enkel netwerkverkeer naar Sentry en geen kosten (Developer-plan is
 * gratis tot 5k events/mnd — met of zonder init blijft dat ver onder de grens voor een site van
 * deze omvang). `tracesSampleRate: 0` zet performance-tracing uit (dat telt apart en zwaarder mee
 * tegen het gratis quotum dan losse error-events) — alleen foutmeldingen, geen tracing.
 *
 * Geen source-map-upload/`SENTRY_AUTH_TOKEN`/`withSentryConfig`-wrapper: dat hoort bij releases
 * bouwen voor leesbare stack traces in de Sentry-UI, niet bij "weet dat er iets misging". Voor
 * deze schaal (kleine marketingsites) is dat een bewuste, genoteerde vereenvoudiging — zie
 * AGENTS.md § Foutbewaking voor het upgrade-pad als dat ooit nodig is.
 *
 * `onRequestError` vangt fouten in Server Components/Route Handlers/Server Actions die Next.js
 * zelf al als request-fout classificeert (het hierboven genoemde `Sentry.captureRequestError`
 * is de door Next.js gedocumenteerde koppeling hiervoor). Mislukte formuliermails melden zichzelf
 * apart via `Sentry.captureMessage` in `aanvraag-actions.ts`/`newsletter-actions.ts` — dat zijn
 * afgehandelde fouten (de bezoeker krijgt een eerlijke melding), geen onafgevangen request-fout,
 * en verdienen dus een eigen, herkenbaar bericht in plaats van generieke request-ruis.
 */
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (!process.env.SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
    })
  }
}

export const onRequestError = Sentry.captureRequestError
