/**
 * Content-Security-Policy voor een statische klantsite.
 *
 * Bewust ZONDER nonce: een nonce maakt elke pagina dynamisch en breekt de statische opbouw (SSG).
 * Daarom staat `'unsafe-inline'` op script-src — de JSON-LD, Consent-mode en Clarity zijn inline.
 * Tegen XSS via inline code beschermt dit dus niet; wél tegen: scripts, frames en plugins van
 * vreemde domeinen, formulieren die naar buiten posten (form-action), `<base>`-kaping,
 * data wegsturen naar vreemde servers (connect-src) en clickjacking (frame-ancestors).
 *
 * Meetdiensten komen er alleen bij als hun ID in `site.meting` staat. Een onderdeel uit de
 * component-library dat een extern domein nodig heeft (video-facade → youtube-nocookie/vimeo,
 * map-facade → google/openstreetmap), zet dat domein in `extra` (next.config.ts).
 */
export type CspBronnen = Partial<Record<
  'script-src' | 'style-src' | 'img-src' | 'font-src' | 'connect-src' | 'media-src' | 'frame-src',
  string[]
>>

export function bouwCsp(opties: {
  meting?: { ga4?: string; gtm?: string; clarity?: string }
  extra?: CspBronnen
  dev?: boolean
  preview?: boolean
}): string {
  const { meting = {}, extra = {}, dev = false, preview = false } = opties
  const b: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
  }
  const voeg = (sleutel: string, ...bronnen: string[]) => b[sleutel].push(...bronnen)

  // React/Next in `next dev` heeft eval nodig voor de foutoverlay; in productie nooit.
  if (dev) voeg('script-src', "'unsafe-eval'")
  // De Vercel-werkbalk op een preview-deploy (commentaar/feedback), alleen daar.
  if (preview) {
    voeg('script-src', 'https://vercel.live')
    voeg('connect-src', 'https://vercel.live', 'wss://ws-us3.pusher.com')
    voeg('frame-src', 'https://vercel.live')
    voeg('img-src', 'https://vercel.live', 'https://vercel.com')
  }
  if (meting.ga4 || meting.gtm) {
    voeg('script-src', 'https://www.googletagmanager.com')
    voeg('img-src', 'https://www.googletagmanager.com', 'https://*.google-analytics.com')
    voeg('connect-src', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com')
  }
  if (meting.gtm) voeg('frame-src', 'https://www.googletagmanager.com')
  if (meting.clarity) {
    voeg('script-src', 'https://www.clarity.ms', 'https://*.clarity.ms')
    voeg('img-src', 'https://*.clarity.ms', 'https://c.bing.com')
    voeg('connect-src', 'https://*.clarity.ms')
  }
  for (const [sleutel, bronnen] of Object.entries(extra)) voeg(sleutel, ...(bronnen ?? []))

  // Geen upgrade-insecure-requests: HSTS (2 jaar + preload) dwingt https al af, en op een lokale
  // `next start` (http) zou die regel de eigen assets naar https sturen.
  return Object.entries(b).map(([k, v]) => `${k} ${[...new Set(v)].join(' ')}`).join('; ')
}
