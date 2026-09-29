import { site } from '@/content/site'
import { home } from '@/content/teksten'
import { ogImage, OG_SIZE } from '@/lib/og'

export const alt = site.naam
export const size = OG_SIZE
export const contentType = 'image/png'

// Statisch te bouwen (geen `fetch`, geen request-time API's) — Next.js optimaliseert dit net als
// een gewone pagina, zie de opengraph-image-docs.
export default function Image() {
  return ogImage(home.kop.join(' '), site.beschrijving)
}
