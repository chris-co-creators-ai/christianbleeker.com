import { over } from '@/content/teksten'
import { ogImage, OG_SIZE } from '@/lib/og'

export const alt = over.titel
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return ogImage(over.kop, over.beschrijving)
}
