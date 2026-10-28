import { werkplaats } from '@/content/werkplaats'
import { ogImage, OG_SIZE } from '@/lib/og'

export const alt = werkplaats.titel
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return ogImage(werkplaats.kop, werkplaats.beschrijving)
}
