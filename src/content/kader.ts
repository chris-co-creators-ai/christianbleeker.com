/**
 * Klantsites die zich in een iframe laten tonen (live-demo-kader op /work/<slug>). Gemeten 28-10-2026 met
 * curl op X-Frame-Options en CSP frame-ancestors. Niet in de lijst: humanmargin.eu (DENY), nijboer en
 * seveke.nl (SAMEORIGIN), driftawave.com (SAMEORIGIN + frame-ancestors 'self') en souplesserunnersboutique.nl
 * (antwoordt 429 op een meting, dus onbekend). Die tonen alleen het schermbeeld met de link naar buiten.
 * Zet een site er pas bij na een nieuwe meting; next.config.ts opent frame-src alleen voor deze adressen.
 */
export const inKader: Record<string, string> = {
  'stratenova-advisory': 'https://stratenova-demo.vercel.app',
  'offbeat-peak': 'https://offbeatpeak.com',
  'digital-waves': 'https://digitalwaves.agency',
  'radstok-interim': 'https://www.radstokinterim.com',
  fuselabs: 'https://www.fuselabs.ai',
  'kinderopvang-ikke': 'https://kinderopvangikke.nl',
  'win-instituut': 'https://wininstituut.nl',
  'co-creatie-ai': 'https://www.co-creatie.ai',
}
