import { ai } from '@/content/teksten'
import { ogImage, OG_SIZE } from '@/lib/og'

export const alt = ai.titel
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return ogImage(ai.kop, ai.beschrijving)
}
